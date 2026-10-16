// Renders the email components with Svelte's server renderer (no browser or extra test library
// needed) against payloads captured from the backend. Interactions are covered in emails.test.ts.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ApplicationEmails from '#lib/components/ApplicationEmails.svelte';
import EmailDetailPanel from '#lib/components/EmailDetailPanel.svelte';
import EmailList from '#lib/components/EmailList.svelte';
import EmailOverviewCard from '#lib/components/EmailOverviewCard.svelte';
import EmailSendingSettings from '#lib/components/EmailSendingSettings.svelte';
import EmailStatusBadge from '#lib/components/EmailStatusBadge.svelte';
import EmailTemplateTable from '#lib/components/EmailTemplateTable.svelte';
import {
	emailStatusLabels,
	fromApiMessage,
	fromApiMessageDetail,
	fromApiOverview,
	fromApiRevision,
	fromApiSettings,
	fromApiTemplate,
	type EmailMessage,
	type EmailMessageDetail,
	type EmailStatus
} from '#lib/emails.ts';
import messagesFixture from '#lib/fixtures/email-messages.json';
import overviewFixture from '#lib/fixtures/email-overview.json';
import settingsFixture from '#lib/fixtures/email-settings.json';
import templatesFixture from '#lib/fixtures/email-templates.json';

// Loosely typed on purpose: each test passes the props its component expects.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const html = (component: any, props: Record<string, unknown>): string => render(component, { props }).body;
/** The page outside any iframe srcdoc attribute: what actually lands in the app's DOM. */
const outsideFrames = (body: string) => body.replace(/srcdoc="[^"]*"/g, 'srcdoc=""');
const buttons = (body: string) => [...body.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map((match) => match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());

const mixed = messagesFixture.application_emails_mixed.results.map(fromApiMessage);
const href = (message: EmailMessage) => `/applications/x?tab=emails&email=${message.id}`;
const noop = () => {};

describe('email history list', () => {
	it('renders subject, template, recipient, status, dates and reviewer', () => {
		const body = html(EmailList, { messages: mixed, href, selectedId: 11 });
		expect(body).toContain('Waitlist update for Oct 10 &amp; 11: 8ft x 8ft');
		expect(body).toContain('Application received');
		expect(body).toContain('To hello@example.com');
		expect(body).toContain('8ft x 8ft · Oct 10 &amp; 11');
		expect(body).toContain('Reviewer: Unassigned');
		expect(body).toMatch(/Delivered \w{3} \d+, \d{4}/);
		expect(body).toContain('Edited 1×');
		for (const label of ['Cancelled', 'Awaiting review', 'Delivered']) expect(body).toContain(label);
		expect(body).toContain('href="/applications/x?tab=emails&amp;email=11"');
		expect(body).toMatch(/aria-current="true"[^>]*>[\s\S]*?Waitlist update/);
	});

	it('shows the empty state', () => {
		expect(html(EmailList, { messages: [], href })).toContain('No emails have been prepared for this application yet.');
	});

	it('has a badge for every backend status', () => {
		for (const status of Object.keys(emailStatusLabels) as EmailStatus[]) {
			expect(html(EmailStatusBadge, { status })).toContain(emailStatusLabels[status]);
		}
	});
});

describe('email detail panel', () => {
	const draft = fromApiMessageDetail(messagesFixture.message_detail_draft);
	const panel = (message: EmailMessageDetail, extra: Record<string, unknown> = {}) =>
		html(EmailDetailPanel, { message, revisions: [], onaction: noop, ...extra });

	it('shows sender, reply-to, recipient, review task and the actions an administrator may take', () => {
		const body = panel(draft);
		expect(body).toContain('The Good Flea');
		expect(body).toContain('Reply-to');
		expect(body).toContain('Example Ceramics &lt;hello@example.com>');
		expect(body).toContain('Review email: Application received to Example Ceramics');
		expect(body).toContain('Prepared automatically when the application was submitted.');
		expect(buttons(body)).toEqual(expect.arrayContaining(['Edit draft', 'Approve', 'Cancel email']));
	});

	it('shows a team member only what the server permits', () => {
		const member = fromApiMessageDetail({ ...messagesFixture.message_detail_draft, permissions: messagesFixture.application_emails_member.results[1].permissions });
		const body = panel(member);
		expect(buttons(body)).toContain('Edit draft');
		expect(buttons(body)).not.toContain('Approve');
		expect(buttons(body)).not.toContain('Cancel email');
		expect(body).toContain('the assigned reviewer or the application');
	});

	it('warns about a draft that no longer applies and hides Approve', () => {
		const body = panel(fromApiMessageDetail(messagesFixture.message_detail_stale));
		expect(body).toContain('No longer applies: The 8ft x 8ft line for Oct 10 &amp; 11 is no longer waitlisted (confirmed).');
		expect(buttons(body)).toContain('Cancel email');
		expect(buttons(body)).not.toContain('Approve');
		expect(buttons(body)).not.toContain('Edit draft');
	});

	it('shows queued, cancelled and delivered states without edit actions', () => {
		const approved = panel(fromApiMessageDetail(messagesFixture.message_approve));
		expect(approved).toContain('Queued. It will be sent from');
		expect(buttons(approved)).not.toContain('Edit draft');
		const cancelled = panel(fromApiMessageDetail(messagesFixture.message_cancel));
		expect(cancelled).toContain('Cancellation reason');
		expect(cancelled).toContain('Sent by phone instead');
		expect(buttons(cancelled).filter((label) => ['Edit draft', 'Approve', 'Cancel email'].includes(label))).toEqual([]);
	});

	it('disables actions while one is in progress', () => {
		const body = panel(draft, { busy: 'approve' });
		expect(body.match(/<button[^>]*disabled[^>]*>[\s\S]*?(Edit draft|Approve|Cancel email)/g)).toHaveLength(3);
	});

	it('renders email HTML only inside a sandboxed frame', () => {
		const hostile = { ...draft, htmlBody: '<p>Hi</p><script>alert(1)</script><img src=x onerror="alert(2)">' };
		const body = panel(hostile);
		expect(body).toMatch(/<iframe[^>]*sandbox=""/);
		expect(body).toContain('srcdoc=');
		expect(outsideFrames(body)).not.toContain('<script>alert');
		expect(outsideFrames(body)).not.toContain('onerror');
	});

	it('lists earlier versions, oldest marked as the original', () => {
		const revisions = messagesFixture.message_revisions.map(fromApiRevision);
		const edited = fromApiMessageDetail(messagesFixture.message_revise);
		const body = html(EmailDetailPanel, { message: edited, revisions, onaction: noop });
		expect(body).toContain('Version 1 (original)');
		expect(body).toContain('“Shorter subject”');
		expect(html(EmailDetailPanel, { message: edited, revisions: null, onaction: noop })).toContain('Loading earlier versions…');
		expect(html(EmailDetailPanel, { message: edited, revisions: null, revisionsError: 'Not found.', onaction: noop })).toContain('Not found.');
	});
});

describe('Emails tab', () => {
	it('starts in a loading state (data loads in the browser)', () => {
		const body = html(ApplicationEmails, { applicationId: 'app-1', lines: [], selectedId: null, taskId: null, onselect: noop });
		expect(body).toContain('Loading emails…');
		expect(buttons(body)).not.toContain('New email'); // offered only once templates have loaded
	});
});

describe('overview cards', () => {
	const overview = fromApiOverview(overviewFixture.overview);

	it('shows the four counts with links, counting delivered emails once', () => {
		const body = html(EmailOverviewCard, { overview, liveSendingBlocked: true });
		for (const label of ['Awaiting review', 'Queued', 'Failed', 'Sent / delivered']) expect(body).toContain(label);
		expect(body).toContain('href="/tasks?view=emails"');
		expect(body).toContain('href="/settings/emails?tab=messages&amp;bucket=problems"');
		expect(body).toContain('1 confirmed delivered');
		expect(body).toContain('vendors receive nothing right now');
	});

	it('lists recent email activity with links to the email', () => {
		const body = html(EmailOverviewCard, { overview });
		const first = overview.recentActivity[0];
		expect(body).toContain(`Example Ceramics: ${first.description}`);
		expect(body).toContain(`/applications/${first.applicationId}?tab=emails`);
		expect(html(EmailOverviewCard, { overview: { ...overview, recentActivity: [] } })).toContain('No email activity yet.');
	});
});

describe('settings and templates', () => {
	const settings = fromApiSettings(settingsFixture.settings);
	const templates = templatesFixture.templates.map(fromApiTemplate);

	it('explains the sending status and never shows secrets', () => {
		const body = html(EmailSendingSettings, { settings, isAdmin: false, onsaved: noop });
		expect(body).toContain('Email sending is disabled.');
		expect(body).toContain('The console provider only prints messages on the server; nothing is delivered.');
		expect(body).toContain('America/New_York');
		expect(body).toContain('09:00–18:00');
		expect(body).toContain('Only administrators can change these settings.');
		expect(buttons(body)).not.toContain('Change settings');
		expect(body).not.toMatch(/api[_ ]key|whsec_|re_[A-Za-z0-9]{8}/i);
	});

	it('gives administrators the edit button', () => {
		expect(buttons(html(EmailSendingSettings, { settings, isAdmin: true, onsaved: noop }))).toContain('Change settings');
	});

	it('lists the ten templates with mode, category and unused markers', () => {
		const body = html(EmailTemplateTable, { templates, isAdmin: false, href: (t: { key: string }) => `/t/${t.key}` });
		expect(body.match(/<tr class="hover">/g)).toHaveLength(10);
		expect(body.match(/Not used yet/g)).toHaveLength(6);
		expect(body).toContain('href="/t/waitlist_update"');
		expect(body).toContain('View<span class="sr-only"> Waitlist update');
		expect(html(EmailTemplateTable, { templates, isAdmin: true, href: () => '#' })).toContain('Edit<span class="sr-only">');
	});
});
