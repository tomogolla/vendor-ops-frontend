import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '#lib/api.ts';
import {
	APPLICATION_TEMPLATE_KEYS,
	PrepareDraftError,
	approveMessage,
	cancelMessage,
	draftChanged,
	draftProblems,
	emailsTabHref,
	explainSendingMode,
	filterTemplates,
	fromApiMessage,
	fromApiMessageDetail,
	fromApiOverview,
	fromApiSettings,
	fromApiTemplate,
	getEmailOverview,
	insertVariable,
	listApplicationEmails,
	listMessages,
	listRevisions,
	messageActions,
	messageDate,
	messageForTask,
	messageState,
	messagesHref,
	modeChangeWarning,
	placeholdersIn,
	preparableTemplates,
	prepareDraft,
	previewDocument,
	previewTemplate,
	reviewTaskHref,
	reviseDraft,
	templateCategories,
	templateChanges,
	templateDraft,
	triggerDescription,
	unknownPlaceholders,
	updateEmailSettings,
	updateTemplate,
	type EmailMessage
} from '#lib/emails.ts';
import { fromApiTask, updateTask } from '#lib/vendor-store.ts';
import messagesFixture from '#lib/fixtures/email-messages.json';
import overviewFixture from '#lib/fixtures/email-overview.json';
import settingsFixture from '#lib/fixtures/email-settings.json';
import templatesFixture from '#lib/fixtures/email-templates.json';
import tasksFixture from '#lib/fixtures/tasks-email-review.json';

let calls: { url: string; init: RequestInit }[] = [];
function mockFetch(...responses: { status: number; body?: unknown }[]) {
	calls = [];
	const queue = [...responses];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			calls.push({ url, init });
			const next = queue.shift() ?? { status: 200, body: {} };
			return new Response(next.body === undefined ? null : JSON.stringify(next.body), { status: next.status });
		})
	);
}
const sent = (index = 0) => JSON.parse(String(calls[index].init.body ?? 'null'));
beforeEach(() => vi.stubGlobal('document', { cookie: 'csrftoken=test-token' }));
afterEach(() => vi.unstubAllGlobals());

const adminList = messagesFixture.application_emails_admin.results.map(fromApiMessage);
const memberList = messagesFixture.application_emails_member.results.map(fromApiMessage);
const mixed = messagesFixture.application_emails_mixed.results.map(fromApiMessage);
const received = adminList.find((message) => message.templateKey === 'application_received')!;
const waitlist = adminList.find((message) => message.templateKey === 'waitlist_update')!;
const stale = fromApiMessageDetail(messagesFixture.message_detail_stale);
const approved = fromApiMessageDetail(messagesFixture.message_approve);
const templates = templatesFixture.templates.map(fromApiTemplate);
const settings = fromApiSettings(settingsFixture.settings);
const format = (iso: string) => `<${iso.slice(0, 16)}>`;

describe('message mapping (captured payloads)', () => {
	it('maps list items with the booth line, review task and permissions', () => {
		expect(waitlist).toMatchObject({
			status: 'draft',
			statusLabel: 'Draft (awaiting review)',
			templateName: 'Waitlist update',
			recipientEmail: 'hello@example.com',
			redirected: false,
			vendor: { brandName: 'Example Ceramics' },
			applicationLine: { productName: '8ft x 8ft', weekendLabel: 'Oct 10 & 11', status: 'WAITLISTED' },
			reviewTask: { status: 'TODO', isOpen: true, owner: null },
			permissions: { canEdit: true, canApprove: true, canCancel: true },
			noLongerApplies: null
		});
		expect(received.applicationLine).toBeNull();
	});

	it('maps details with bodies, sender and trigger', () => {
		const detail = fromApiMessageDetail(messagesFixture.message_detail_draft);
		expect(detail.htmlBody).toContain('<p>Hi Example Ceramics,</p>');
		expect(detail.textBody).toContain('Hi Example Ceramics,');
		expect(detail.senderName).toBe('The Good Flea');
		expect(detail.trigger).toEqual({});
		expect(fromApiMessageDetail(messagesFixture.prepare_created).trigger).toEqual({ manual: true });
	});

	it('gives team members only the actions the server allows', () => {
		expect(memberList.every((message) => !message.permissions.canApprove && !message.permissions.canCancel)).toBe(true);
		expect(memberList.map(messageActions)).toEqual([['edit'], ['edit']]);
		expect(messageActions(received)).toEqual(['edit', 'approve', 'cancel']);
	});
});

describe('message actions and states', () => {
	it('offers only Cancel for a draft that no longer applies', () => {
		expect(stale.noLongerApplies).toContain('no longer waitlisted');
		expect(stale.permissions.canApprove).toBe(true); // the server still reports it…
		expect(messageActions(stale)).toEqual(['cancel']); // …but approving would be refused.
		expect(messageState(stale, format)).toMatchObject({ tone: 'warning' });
		expect(messageState(stale, format).text).toContain('cannot be approved');
	});

	it('lets queued emails be cancelled and nothing else; finished emails have no actions', () => {
		expect(approved.status).toBe('queued');
		expect(messageActions(approved)).toEqual(['cancel']);
		expect(messageActions(fromApiMessageDetail(messagesFixture.message_cancel))).toEqual([]);
		expect(messageActions(mixed.find((message) => message.status === 'delivered')!)).toEqual([]);
	});

	it('describes each status in plain words', () => {
		expect(messageState(received, format).text).toContain('team queue');
		expect(messageState(approved, format).text).toBe(`Queued. It will be sent from ${format(approved.scheduledFor!)}, in the send window.`);
		const delivered = mixed.find((message) => message.status === 'delivered')!;
		expect(messageState(delivered, format)).toMatchObject({ tone: 'success', text: `Delivered ${format(delivered.deliveredAt!)}.` });
		const redirected = { ...delivered, status: 'sent' as const, redirected: true, deliveredToEmail: 'team@example.com' };
		expect(messageState(redirected, format).text).toContain("team's test mailbox (team@example.com), not to the vendor");
		expect(messageState({ ...delivered, status: 'failed', failureDetail: 'Connection refused' }, format)).toEqual({ tone: 'error', text: 'Sending failed: Connection refused' });
		const cancelled = fromApiMessageDetail(messagesFixture.message_cancel);
		expect(messageState(cancelled, format).text).toBe('Cancelled: Sent by phone instead');
	});

	it('shows the most useful date for a row', () => {
		const delivered = mixed.find((message) => message.status === 'delivered')!;
		expect(messageDate(delivered)).toEqual({ label: 'Delivered', iso: delivered.deliveredAt });
		expect(messageDate(approved)).toEqual({ label: 'Scheduled', iso: approved.scheduledFor });
		expect(messageDate(received)).toEqual({ label: 'Created', iso: received.createdAt });
	});

	it('explains why an email exists', () => {
		expect(triggerDescription('call_follow_up', { attempt: 2, attempted_at: '2026-10-16T10:00:00Z' }, format)).toBe(
			'Prepared automatically after an unanswered call (attempt 2) on <2026-10-16T10:00>.'
		);
		expect(triggerDescription('waitlist_update', { manual: true }, format)).toBe('Prepared by hand by a team member.');
	});
});

describe('review tasks', () => {
	const tasks = tasksFixture.tasks_email_review.results.map(fromApiTask);

	it('maps EMAIL_REVIEW tasks and links them to their email', () => {
		expect(tasks.every((task) => task.taskType === 'EMAIL_REVIEW')).toBe(true);
		const task = tasks.find((item) => item.id === received.reviewTask!.id)!;
		expect(reviewTaskHref(task)).toBe(`/applications/${task.applicationId}?tab=emails&task=${task.id}`);
		expect(messageForTask(adminList, task.id)?.id).toBe(received.id);
		expect(messageForTask(adminList, 'other')).toBeUndefined();
	});

	it('surfaces the refusal when a review task is completed directly', async () => {
		mockFetch({ status: 400, body: tasksFixture.task_complete_refused });
		await expect(updateTask(tasks[0].id, { status: 'COMPLETED' })).rejects.toThrow('Approve or cancel the email draft instead; that closes this task.');
	});

	it('builds links to the Emails tab and the message log', () => {
		expect(emailsTabHref('abc')).toBe('/applications/abc?tab=emails');
		expect(emailsTabHref('abc', { email: 7 })).toBe('/applications/abc?tab=emails&email=7');
		expect(messagesHref('problems')).toBe('/settings/emails?tab=messages&bucket=problems');
	});
});

describe('message API calls', () => {
	it('lists an application’s emails with filters, sorting and paging', async () => {
		mockFetch({ status: 200, body: messagesFixture.application_emails_admin });
		const page = await listApplicationEmails('app-1', { bucket: 'awaiting_review', template: 'waitlist_update', ordering: '-sent_at', pageSize: 100 });
		expect(calls[0].url).toBe('/api/v1/applications/app-1/emails/?template=waitlist_update&bucket=awaiting_review&ordering=-sent_at&page_size=100');
		expect(page.count).toBe(2);
		expect(page.results[0].templateKey).toBe('waitlist_update');
	});

	it('sends several statuses comma-separated and searches the message log', async () => {
		mockFetch({ status: 200, body: messagesFixture.application_emails_mixed });
		await listMessages({ status: ['failed', 'bounced'], search: '  ceramics ', page: 2 });
		expect(calls[0].url).toBe('/api/v1/email/messages/?status=failed%2Cbounced&search=ceramics&page=2');
	});

	it('edits a draft and returns the new version', async () => {
		mockFetch({ status: 200, body: messagesFixture.message_revise });
		const result = await reviseDraft(received.id, { subject: 'Thanks for applying, Example Ceramics', htmlBody: '<p>x</p>', textBody: 'x', note: ' Shorter subject ' });
		expect(calls[0].url).toBe(`/api/v1/email/messages/${received.id}/`);
		expect(calls[0].init.method).toBe('PATCH');
		expect((calls[0].init.headers as Record<string, string>)['X-CSRFToken']).toBe('test-token');
		expect(sent()).toEqual({ subject: 'Thanks for applying, Example Ceramics', html_body: '<p>x</p>', text_body: 'x', note: 'Shorter subject' });
		expect(result.revision).toBe(1);
	});

	it('reports validation errors per field', async () => {
		mockFetch({ status: 400, body: messagesFixture.message_revise_invalid });
		const error = await reviseDraft(received.id, { subject: '', htmlBody: 'x', textBody: 'x' }).catch((err) => err);
		expect(error).toBeInstanceOf(ApiError);
		expect(error.fieldErrors).toEqual({ subject: 'A subject is required.' });
		mockFetch({ status: 400, body: messagesFixture.message_revise_after_approve });
		await expect(reviseDraft(received.id, { subject: 'x', htmlBody: 'x', textBody: 'x' })).rejects.toThrow('Only drafts awaiting review can be edited.');
	});

	it('loads earlier versions', async () => {
		mockFetch({ status: 200, body: messagesFixture.message_revisions });
		const revisions = await listRevisions(received.id);
		expect(calls[0].url).toBe(`/api/v1/email/messages/${received.id}/revisions/`);
		expect(revisions[0]).toMatchObject({ number: 1, subject: received.subject, note: 'Shorter subject' });
	});

	it('approves through the API (nothing is sent from the browser) and shows refusals', async () => {
		mockFetch({ status: 200, body: messagesFixture.message_approve });
		const result = await approveMessage(received.id);
		expect(calls[0]).toMatchObject({ url: `/api/v1/email/messages/${received.id}/approve/`, init: { method: 'POST' } });
		expect(result).toMatchObject({ status: 'queued', reviewTask: { status: 'COMPLETED', outcome: 'Approved' } });

		mockFetch({ status: 403, body: messagesFixture.message_approve_forbidden });
		const forbidden = await approveMessage(received.id).catch((err) => err);
		expect(forbidden.isForbidden).toBe(true);
		expect(forbidden.message).toBe('Only administrators, the assigned reviewer or the application reviewer can approve emails.');

		mockFetch({ status: 400, body: messagesFixture.message_approve_stale });
		await expect(approveMessage(stale.id)).rejects.toThrow(/no longer applies.*Cancel it instead/);
	});

	it('cancels with a trimmed reason', async () => {
		mockFetch({ status: 200, body: messagesFixture.message_cancel });
		const result = await cancelMessage(12, '  Sent by phone instead ');
		expect(sent()).toEqual({ reason: 'Sent by phone instead' });
		expect(result).toMatchObject({ status: 'cancelled', reviewTask: { status: 'CANCELLED' } });
	});
});

describe('preparing an email by hand', () => {
	it('creates a draft for a template and booth', async () => {
		mockFetch({ status: 201, body: messagesFixture.prepare_created });
		const result = await prepareDraft('app-1', 'waitlist_update', 'line-1');
		expect(calls[0].url).toBe('/api/v1/applications/app-1/emails/');
		expect(sent()).toEqual({ template_key: 'waitlist_update', application_line: 'line-1' });
		expect(result.status).toBe('draft');
	});

	it('points to the existing draft when one is already waiting', async () => {
		mockFetch({ status: 400, body: messagesFixture.prepare_duplicate });
		const error = await prepareDraft('app-1', 'call_follow_up').catch((err) => err);
		expect(error).toBeInstanceOf(PrepareDraftError);
		expect(error.message).toBe('A draft of this email is already awaiting review.');
		expect(error.existingMessageId).toBe(12);
		expect(sent()).toEqual({ template_key: 'call_follow_up' });
	});

	it('shows the server’s reason when the application cannot provide the details', async () => {
		mockFetch({ status: 400, body: messagesFixture.prepare_needs_line });
		const error = await prepareDraft('app-1', 'waitlist_update').catch((err) => err);
		expect(error.message).toContain('choose a booth line');
		expect(error.existingMessageId).toBeNull();
	});

	it('offers the four application templates that are active, in pipeline order', () => {
		expect(preparableTemplates(templates).map((template) => template.key)).toEqual([...APPLICATION_TEMPLATE_KEYS]);
		const inactive = templates.map((template) => (template.key === 'call_follow_up' ? { ...template, isActive: false } : template));
		expect(preparableTemplates(inactive).map((template) => template.key)).not.toContain('call_follow_up');
	});
});

describe('templates', () => {
	it('maps all ten templates with the backend’s variables', () => {
		expect(templates).toHaveLength(10);
		const waitlistTemplate = templates.find((template) => template.key === 'waitlist_update')!;
		expect(waitlistTemplate.allowedVariables).toContain('booth_name');
		expect(Object.keys(waitlistTemplate.availableVariables)).toEqual([
			'vendor_name', 'application_reference', 'market_name', 'market_dates', 'booth_name', 'owner_name', 'payment_link'
		]);
		expect(templateCategories(templates)).toEqual(['operational', 'transactional']);
	});

	it('filters by search, category and mode', () => {
		expect(filterTemplates(templates, { search: 'waitlist', category: '', mode: '' }).map((t) => t.key)).toEqual(['waitlist_update']);
		expect(filterTemplates(templates, { search: '', category: 'operational', mode: '' })).toHaveLength(4);
		expect(filterTemplates(templates, { search: '', category: '', mode: 'auto' })).toHaveLength(0);
	});

	it('saves only what changed', () => {
		const template = templates[0];
		const original = templateDraft(template);
		expect(templateChanges(original, { ...original })).toEqual({});
		expect(templateChanges(original, { ...original, mode: 'draft', subjectTemplate: 'Hi {vendor_name}' })).toEqual({ mode: 'draft', subjectTemplate: 'Hi {vendor_name}' });
		expect(templateChanges(original, { ...original, allowedVariables: [...original.allowedVariables].reverse() })).toEqual({});
	});

	it('finds placeholders, ignoring literal braces, and flags ones not allowed', () => {
		expect(placeholdersIn('Hi {vendor_name}, {{literal}} and {market_name}{vendor_name}')).toEqual(['vendor_name', 'market_name']);
		expect(unknownPlaceholders(['{vendor_name} {secret}', '{booth_name}'], ['vendor_name'])).toEqual(['booth_name', 'secret']);
	});

	it('inserts a variable at the cursor or over the selection', () => {
		expect(insertVariable('Hi !', 3, 3, 'vendor_name')).toEqual({ text: 'Hi {vendor_name}!', cursor: 16 });
		expect(insertVariable('Hi NAME!', 3, 7, 'vendor_name')).toEqual({ text: 'Hi {vendor_name}!', cursor: 16 });
	});

	it('warns before switching a template to Auto', () => {
		expect(modeChangeWarning('off', 'draft', true)).toBeNull();
		expect(modeChangeWarning('auto', 'auto', false)).toBeNull();
		expect(modeChangeWarning('draft', 'auto', true)).toContain('once global sending is enabled real vendors will receive');
		expect(modeChangeWarning('off', 'auto', false)).toContain('Sending is enabled right now');
	});

	it('previews unsaved edits with sample or real data without saving', async () => {
		mockFetch({ status: 200, body: templatesFixture.template_preview_application });
		const preview = await previewTemplate('waitlist_update', { applicationId: 'app-1', applicationLineId: 'line-1' }, { subjectTemplate: 'Hi {vendor_name}' });
		expect(calls[0].url).toBe('/api/v1/email/templates/waitlist_update/preview/');
		expect(calls[0].init.method).toBe('POST');
		expect(sent()).toEqual({ subject_template: 'Hi {vendor_name}', application: 'app-1', application_line: 'line-1' });
		expect(preview).toMatchObject({ dataSource: 'application', missingVariables: [] });
		expect(preview.subject).toContain('8ft x 8ft');

		mockFetch({ status: 200, body: templatesFixture.template_preview_missing });
		expect((await previewTemplate('waitlist_update', { applicationId: 'app-1' })).missingVariables).toEqual(['booth_name', 'market_dates', 'market_name']);
		mockFetch({ status: 200, body: templatesFixture.template_preview_sample });
		expect((await previewTemplate('application_received')).dataSource).toBe('sample');
		expect(sent()).toEqual({});
	});

	it('reports invalid placeholders and refuses team members', async () => {
		mockFetch({ status: 400, body: templatesFixture.template_patch_invalid });
		const invalid = await updateTemplate('application_received', { subjectTemplate: 'Hi {secret}' }).catch((err) => err);
		expect(sent()).toEqual({ subject_template: 'Hi {secret}' });
		expect(invalid.fieldErrors).toEqual({ subject_template: 'Unknown placeholder(s): {secret}.' });
		mockFetch({ status: 403, body: templatesFixture.template_patch_forbidden });
		await expect(updateTemplate('application_received', { mode: 'auto' })).rejects.toThrow('Only administrators can change this.');
	});
});

describe('settings', () => {
	it('maps stored and effective values without credentials', () => {
		expect(settings).toMatchObject({ sendingMode: 'disabled', businessTimezone: 'America/New_York', liveSendingBlocked: true });
		expect(settings.environment).toMatchObject({ provider: 'console', deliversRealEmail: false, webhookConfigured: null });
		expect(JSON.stringify(settingsFixture.settings)).not.toMatch(/key|secret|password|token/i);
	});

	it('explains configured versus effective mode', () => {
		expect(explainSendingMode(settings).headline).toBe('Email sending is disabled.');
		const limited = { ...settings, sendingMode: 'enabled' as const, effective: { ...settings.effective, mode: 'disabled' as const } };
		expect(explainSendingMode(limited).headline).toBe('Email sending is disabled by the server configuration.');
		expect(explainSendingMode(limited).detail).toContain('The setting here is Enabled, but the server configuration only allows Disabled.');
		const redirect = { ...settings, sendingMode: 'redirect' as const, effective: { ...settings.effective, mode: 'redirect' as const, redirectToEmail: 'team@example.com' } };
		expect(explainSendingMode(redirect)).toMatchObject({ headline: "Redirect mode: emails are sent to your team's test mailbox, not vendors." });
		expect(explainSendingMode(redirect).detail).toContain('team@example.com');
		const console = { ...settings, sendingMode: 'enabled' as const, effective: { ...settings.effective, mode: 'enabled' as const } };
		expect(explainSendingMode(console).headline).toBe('Sending is enabled, but the server cannot deliver email yet.');
		const live = { ...console, environment: { ...console.environment, provider: 'resend', deliversRealEmail: true, providerConfigured: true } };
		expect(explainSendingMode(live).tone).toBe('success');
	});

	it('saves changed settings in the API’s field names and reports errors', async () => {
		mockFetch({ status: 200, body: settingsFixture.settings });
		await updateEmailSettings({ sendingMode: 'redirect', redirectToEmail: ' team@example.com ', sendWindowStart: '08:30' });
		expect(calls[0].init.method).toBe('PATCH');
		expect(sent()).toEqual({ sending_mode: 'redirect', redirect_to_email: 'team@example.com', send_window_start: '08:30' });
		mockFetch({ status: 400, body: settingsFixture.settings_patch_invalid });
		const error = await updateEmailSettings({ sendWindowStart: '19:00' }).catch((err) => err);
		expect(error.fieldErrors).toEqual({ send_window_end: 'The send window must end after it starts (same day).' });
	});
});

describe('overview', () => {
	it('counts each email once: sent includes delivered', async () => {
		mockFetch({ status: 200, body: overviewFixture.overview });
		const overview = await getEmailOverview();
		expect(calls[0].url).toBe('/api/v1/email/overview/');
		expect(overview.counts).toEqual({ awaiting_review: 1, queued: 0, sent: 1, problems: 0, not_sent: 1 });
		expect(overview.byStatus).toEqual({ draft: 1, cancelled: 1, delivered: 1 });
		const total = Object.values(overview.counts).reduce((sum, count) => sum + count, 0);
		expect(total).toBe(Object.values(overview.byStatus).reduce((sum, count) => sum + (count ?? 0), 0));
		expect(overview.recentActivity[0]).toMatchObject({ eventType: expect.stringMatching(/^EMAIL_/), vendor: { brandName: 'Example Ceramics' } });
	});

	it('fills missing buckets with zero', () => {
		expect(fromApiOverview({ counts: { queued: 2 } }).counts).toEqual({ awaiting_review: 0, queued: 2, sent: 0, problems: 0, not_sent: 0 });
	});
});

describe('draft editing and safe previews', () => {
	it('checks drafts before saving and notices changes', () => {
		const draft = { subject: 'Hi', htmlBody: '<p>x</p>', textBody: 'x' };
		expect(draftProblems(draft)).toEqual({});
		expect(draftProblems({ subject: ' ', htmlBody: '', textBody: '' })).toEqual({
			subject: 'A subject is required.',
			html_body: 'The HTML body cannot be empty.',
			text_body: 'The plain-text body cannot be empty.'
		});
		expect(draftChanged(draft, { ...draft, note: 'only a note' })).toBe(false);
		expect(draftChanged(draft, { ...draft, textBody: 'y' })).toBe(true);
	});

	it('wraps email HTML in a document that blocks scripts and remote loading', () => {
		const document = previewDocument('<p>Hello</p><script>alert(1)</script>');
		expect(document).toMatch(/<head>.*Content-Security-Policy.*default-src 'none'.*<\/head><body><p>Hello<\/p>/);
		expect(document).not.toContain('script-src');
	});
});

it('keeps the EmailMessage type in step with the fixtures', () => {
	const keys: (keyof EmailMessage)[] = ['id', 'status', 'permissions', 'reviewTask', 'noLongerApplies'];
	for (const key of keys) expect(received).toHaveProperty(key);
});
