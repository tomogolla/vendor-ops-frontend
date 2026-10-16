// API client and pure rules for vendor email (backend Slice 2, see backend/docs/email-frontend-guide.md).
// Django generates, schedules and sends every email; this module only reads messages and asks the
// API to edit, approve, cancel or prepare them. Field names follow the Django serializers. Which
// actions a person may take always comes from the server (`permissions`); the UI never decides it
// from the role alone.
import { ApiError, request, type Page, type Query } from '#lib/api.ts';
import { mapPage, user, type Json, type UserSummary } from '#lib/vendor-store.ts';

// --- Statuses ------------------------------------------------------------------------------

export type EmailStatus =
	| 'draft'
	| 'queued'
	| 'sending'
	| 'sent'
	| 'delivered'
	| 'failed'
	| 'bounced'
	| 'complained'
	| 'skipped'
	| 'cancelled';

/** Short labels for badges (the API's `status_label` is used where there is room). */
export const emailStatusLabels: Record<EmailStatus, string> = {
	draft: 'Awaiting review',
	queued: 'Queued',
	sending: 'Sending',
	sent: 'Sent',
	delivered: 'Delivered',
	failed: 'Failed',
	bounced: 'Bounced',
	complained: 'Marked as spam',
	skipped: 'Not sent',
	cancelled: 'Cancelled'
};

export const emailStatusStyles: Record<EmailStatus, string> = {
	draft: 'badge-warning',
	queued: 'badge-info badge-outline',
	sending: 'badge-info',
	sent: 'badge-success badge-outline',
	delivered: 'badge-success',
	failed: 'badge-error',
	bounced: 'badge-error',
	complained: 'badge-error',
	skipped: 'badge-ghost',
	cancelled: 'badge-ghost'
};

export type EmailBucket = 'awaiting_review' | 'queued' | 'sent' | 'problems' | 'not_sent';

/** Every message is in exactly one bucket (mirrors BUCKETS in the backend). */
export const emailBuckets: Record<EmailBucket, { label: string; statuses: readonly EmailStatus[]; hint: string }> = {
	awaiting_review: { label: 'Awaiting review', statuses: ['draft'], hint: 'Drafts waiting for the team' },
	queued: { label: 'Queued', statuses: ['queued', 'sending'], hint: 'Approved, waiting for the send window' },
	sent: { label: 'Sent', statuses: ['sent', 'delivered'], hint: 'Sent, including those confirmed delivered' },
	problems: { label: 'Problems', statuses: ['failed', 'bounced', 'complained'], hint: 'Failed, bounced or marked as spam' },
	not_sent: { label: 'Not sent', statuses: ['skipped', 'cancelled'], hint: 'Skipped or cancelled' }
};
export const EMAIL_BUCKETS = Object.keys(emailBuckets) as EmailBucket[];

export const isEmailBucket = (value: string | null): value is EmailBucket => value !== null && value in emailBuckets;

// --- Types ---------------------------------------------------------------------------------

export type EmailPermissions = { canEdit: boolean; canApprove: boolean; canCancel: boolean };

export type ReviewTask = {
	id: string;
	status: string;
	isOpen: boolean;
	title: string;
	owner: UserSummary | null;
	dueAt: string | null;
	outcome: string;
};

export type EmailMessage = {
	id: number;
	templateKey: string;
	templateName: string;
	status: EmailStatus;
	statusLabel: string;
	subject: string;
	recipientName: string;
	recipientEmail: string;
	/** Where it actually went: the redirect mailbox when `redirected`. */
	deliveredToEmail: string;
	redirected: boolean;
	applicationId: string | null;
	vendor: { id: string; brandName: string } | null;
	marketWeekend: { id: string; label: string; startDate: string } | null;
	applicationLine: { id: string; productName: string; weekendLabel: string; status: string } | null;
	scheduledFor: string | null;
	sentAt: string | null;
	deliveredAt: string | null;
	failureCode: string;
	failureDetail: string;
	revision: number;
	reviewTask: ReviewTask | null;
	createdBy: UserSummary | null;
	createdAt: string;
	updatedAt: string;
	permissions: EmailPermissions;
	/** Why the email would be stopped now (drafts and queued emails only), or null. */
	noLongerApplies: string | null;
};

export type EmailMessageDetail = EmailMessage & {
	htmlBody: string;
	textBody: string;
	senderName: string;
	senderEmail: string;
	replyToEmail: string;
	provider: string;
	providerMessageId: string;
	attemptCount: number;
	eventKey: string;
	trigger: Record<string, unknown>;
};

export type EmailRevision = {
	number: number;
	subject: string;
	htmlBody: string;
	textBody: string;
	replacedBy: UserSummary | null;
	note: string;
	createdAt: string;
};

export type TemplateMode = 'off' | 'draft' | 'auto';

export const templateModeLabels: Record<TemplateMode, string> = { off: 'Off', draft: 'Draft', auto: 'Auto' };

export const templateModeHelp: Record<TemplateMode, string> = {
	off: 'No emails are prepared for this template.',
	draft: 'Emails are prepared as drafts for the team to review before anything is sent.',
	auto: 'Emails are queued automatically and sent in the next send window, without review.'
};

export type EmailTemplate = {
	key: string;
	name: string;
	description: string;
	category: string;
	mode: TemplateMode;
	isActive: boolean;
	subjectTemplate: string;
	htmlTemplate: string;
	textTemplate: string;
	allowedVariables: string[];
	/** Every placeholder the backend supports, with a description. */
	availableVariables: Record<string, string>;
	updatedBy: UserSummary | null;
	updatedAt: string;
};

export type TemplatePreview = {
	subject: string;
	htmlBody: string;
	textBody: string;
	dataSource: 'application' | 'sample';
	missingVariables: string[];
};

export type SendingMode = 'disabled' | 'redirect' | 'enabled';

export const sendingModeLabels: Record<SendingMode, string> = { disabled: 'Disabled', redirect: 'Redirect', enabled: 'Enabled' };

export type EmailSettings = {
	sendingMode: SendingMode;
	redirectToEmail: string;
	senderName: string;
	senderEmail: string;
	replyToEmail: string;
	businessTimezone: string;
	sendWindowStart: string;
	sendWindowEnd: string;
	updatedBy: UserSummary | null;
	updatedAt: string | null;
	effective: { mode: SendingMode; senderName: string; senderEmail: string; replyToEmail: string; redirectToEmail: string };
	environment: {
		globalMode: SendingMode;
		provider: string;
		providerConfigured: boolean;
		deliversRealEmail: boolean;
		/** null unless the provider is Resend (the only one with delivery tracking). */
		webhookConfigured: boolean | null;
		dailyLimit: number;
		/** null when there is no daily limit. */
		dailyRemaining: number | null;
	};
	liveSendingBlocked: boolean;
	notices: string[];
};

export type EmailSettingsInput = Partial<
	Pick<
		EmailSettings,
		'sendingMode' | 'redirectToEmail' | 'senderName' | 'senderEmail' | 'replyToEmail' | 'businessTimezone' | 'sendWindowStart' | 'sendWindowEnd'
	>
>;

export type EmailActivity = {
	id: string;
	eventType: string;
	description: string;
	vendor: { id: string; brandName: string };
	applicationId: string | null;
	emailMessageId: number | null;
	actor: string;
	createdAt: string;
};

export type EmailOverview = {
	counts: Record<EmailBucket, number>;
	byStatus: Partial<Record<EmailStatus, number>>;
	recentActivity: EmailActivity[];
};

// --- API -> UI mapping ------------------------------------------------------------------------

export function fromApiMessage(raw: Json): EmailMessage {
	const task = raw.review_task;
	const line = raw.application_line;
	const weekend = raw.market_weekend;
	return {
		id: raw.id,
		templateKey: raw.template_key,
		templateName: raw.template_name ?? raw.template_key,
		status: raw.status,
		statusLabel: raw.status_label ?? raw.status,
		subject: raw.subject ?? '',
		recipientName: raw.recipient_name ?? '',
		recipientEmail: raw.recipient_email ?? '',
		deliveredToEmail: raw.delivered_to_email ?? '',
		redirected: Boolean(raw.redirected),
		applicationId: raw.application ?? null,
		vendor: raw.vendor ? { id: raw.vendor.id, brandName: raw.vendor.brand_name } : null,
		marketWeekend: weekend ? { id: weekend.id, label: weekend.label, startDate: weekend.start_date } : null,
		applicationLine: line
			? { id: line.id, productName: line.product_name, weekendLabel: line.weekend_label, status: line.status }
			: null,
		scheduledFor: raw.scheduled_for ?? null,
		sentAt: raw.sent_at ?? null,
		deliveredAt: raw.delivered_at ?? null,
		failureCode: raw.failure_code ?? '',
		failureDetail: raw.failure_detail ?? '',
		revision: raw.revision ?? 0,
		reviewTask: task
			? {
					id: task.id,
					status: task.status,
					isOpen: Boolean(task.is_open),
					title: task.title ?? '',
					owner: user(task.owner),
					dueAt: task.due_at ?? null,
					outcome: task.outcome ?? ''
				}
			: null,
		createdBy: user(raw.created_by),
		createdAt: raw.created_at,
		updatedAt: raw.updated_at,
		permissions: {
			canEdit: Boolean(raw.permissions?.can_edit),
			canApprove: Boolean(raw.permissions?.can_approve),
			canCancel: Boolean(raw.permissions?.can_cancel)
		},
		noLongerApplies: raw.no_longer_applies ?? null
	};
}

export function fromApiMessageDetail(raw: Json): EmailMessageDetail {
	return {
		...fromApiMessage(raw),
		htmlBody: raw.html_body ?? '',
		textBody: raw.text_body ?? '',
		senderName: raw.sender_name ?? '',
		senderEmail: raw.sender_email ?? '',
		replyToEmail: raw.reply_to_email ?? '',
		provider: raw.provider ?? '',
		providerMessageId: raw.provider_message_id ?? '',
		attemptCount: raw.attempt_count ?? 0,
		eventKey: raw.event_key ?? '',
		trigger: raw.trigger ?? {}
	};
}

export const fromApiRevision = (raw: Json): EmailRevision => ({
	number: raw.number,
	subject: raw.subject ?? '',
	htmlBody: raw.html_body ?? '',
	textBody: raw.text_body ?? '',
	replacedBy: user(raw.replaced_by),
	note: raw.note ?? '',
	createdAt: raw.created_at
});

export const fromApiTemplate = (raw: Json): EmailTemplate => ({
	key: raw.key,
	name: raw.name,
	description: raw.description ?? '',
	category: raw.category ?? '',
	mode: raw.mode,
	isActive: Boolean(raw.is_active),
	subjectTemplate: raw.subject_template ?? '',
	htmlTemplate: raw.html_template ?? '',
	textTemplate: raw.text_template ?? '',
	allowedVariables: raw.allowed_variables ?? [],
	availableVariables: raw.available_variables ?? {},
	updatedBy: user(raw.updated_by),
	updatedAt: raw.updated_at
});

export const fromApiPreview = (raw: Json): TemplatePreview => ({
	subject: raw.subject ?? '',
	htmlBody: raw.html_body ?? '',
	textBody: raw.text_body ?? '',
	dataSource: raw.data_source,
	missingVariables: raw.missing_variables ?? []
});

export function fromApiSettings(raw: Json): EmailSettings {
	const effective = raw.effective ?? {};
	const environment = raw.environment ?? {};
	return {
		sendingMode: raw.sending_mode,
		redirectToEmail: raw.redirect_to_email ?? '',
		senderName: raw.sender_name ?? '',
		senderEmail: raw.sender_email ?? '',
		replyToEmail: raw.reply_to_email ?? '',
		businessTimezone: raw.business_timezone ?? '',
		sendWindowStart: raw.send_window_start ?? '',
		sendWindowEnd: raw.send_window_end ?? '',
		updatedBy: user(raw.updated_by),
		updatedAt: raw.updated_at ?? null,
		effective: {
			mode: effective.mode,
			senderName: effective.sender_name ?? '',
			senderEmail: effective.sender_email ?? '',
			replyToEmail: effective.reply_to_email ?? '',
			redirectToEmail: effective.redirect_to_email ?? ''
		},
		environment: {
			globalMode: environment.global_mode,
			provider: environment.provider ?? '',
			providerConfigured: Boolean(environment.provider_configured),
			deliversRealEmail: Boolean(environment.delivers_real_email),
			webhookConfigured: environment.webhook_configured ?? null,
			dailyLimit: environment.daily_limit ?? 0,
			dailyRemaining: environment.daily_remaining ?? null
		},
		liveSendingBlocked: raw.live_sending_blocked !== false,
		notices: raw.notices ?? []
	};
}

export function fromApiOverview(raw: Json): EmailOverview {
	const counts = Object.fromEntries(EMAIL_BUCKETS.map((bucket) => [bucket, raw.counts?.[bucket] ?? 0])) as Record<EmailBucket, number>;
	return {
		counts,
		byStatus: raw.by_status ?? {},
		recentActivity: (raw.recent_activity ?? []).map((event: Json) => ({
			id: event.id,
			eventType: event.event_type,
			description: event.description,
			vendor: { id: event.vendor?.id, brandName: event.vendor?.brand_name ?? '' },
			applicationId: event.application ?? null,
			emailMessageId: event.email_message_id ?? null,
			actor: event.actor ?? 'System',
			createdAt: event.created_at
		}))
	};
}

// --- API calls ----------------------------------------------------------------------------------

export async function getEmailSettings(): Promise<EmailSettings> {
	return fromApiSettings(await request<Json>('/email/settings/'));
}

/** Administrators only. Times are "HH:MM". */
export async function updateEmailSettings(input: EmailSettingsInput): Promise<EmailSettings> {
	const names: Record<keyof EmailSettingsInput, string> = {
		sendingMode: 'sending_mode',
		redirectToEmail: 'redirect_to_email',
		senderName: 'sender_name',
		senderEmail: 'sender_email',
		replyToEmail: 'reply_to_email',
		businessTimezone: 'business_timezone',
		sendWindowStart: 'send_window_start',
		sendWindowEnd: 'send_window_end'
	};
	const json: Json = {};
	for (const [key, value] of Object.entries(input) as [keyof EmailSettingsInput, string][]) {
		if (value !== undefined) json[names[key]] = typeof value === 'string' ? value.trim() : value;
	}
	return fromApiSettings(await request<Json>('/email/settings/', { method: 'PATCH', json }));
}

/** The ten templates; this list is not paginated. */
export async function listTemplates(): Promise<EmailTemplate[]> {
	return (await request<Json[]>('/email/templates/')).map(fromApiTemplate);
}

export async function getTemplate(key: string): Promise<EmailTemplate> {
	return fromApiTemplate(await request<Json>(`/email/templates/${encodeURIComponent(key)}/`));
}

export type TemplateInput = Partial<Pick<EmailTemplate, 'subjectTemplate' | 'htmlTemplate' | 'textTemplate' | 'mode' | 'allowedVariables'>>;

function toApiTemplateParts(input: TemplateInput): Json {
	const json: Json = {};
	if (input.subjectTemplate !== undefined) json.subject_template = input.subjectTemplate;
	if (input.htmlTemplate !== undefined) json.html_template = input.htmlTemplate;
	if (input.textTemplate !== undefined) json.text_template = input.textTemplate;
	if (input.mode !== undefined) json.mode = input.mode;
	if (input.allowedVariables !== undefined) json.allowed_variables = input.allowedVariables;
	return json;
}

/** Administrators only. Invalid placeholders come back as field errors (ApiError.fieldErrors). */
export async function updateTemplate(key: string, input: TemplateInput): Promise<EmailTemplate> {
	return fromApiTemplate(
		await request<Json>(`/email/templates/${encodeURIComponent(key)}/`, { method: 'PATCH', json: toApiTemplateParts(input) })
	);
}

export type PreviewSource = { applicationId?: string | null; applicationLineId?: string | null; marketWeekendId?: string | null };

/** Renders a template (optionally with unsaved edits) without saving it or creating an email. */
export async function previewTemplate(
	key: string,
	source: PreviewSource = {},
	unsaved: Omit<TemplateInput, 'mode'> = {}
): Promise<TemplatePreview> {
	const json: Json = { ...toApiTemplateParts(unsaved) };
	if (source.applicationId) json.application = source.applicationId;
	if (source.applicationLineId) json.application_line = source.applicationLineId;
	if (source.marketWeekendId) json.market_weekend = source.marketWeekendId;
	return fromApiPreview(await request<Json>(`/email/templates/${encodeURIComponent(key)}/preview/`, { method: 'POST', json }));
}

export type MessageQuery = {
	application?: string;
	vendor?: string;
	template?: string;
	/** One status or several (sent comma-separated). */
	status?: EmailStatus | EmailStatus[];
	bucket?: EmailBucket;
	search?: string;
	ordering?: MessageOrdering;
	page?: number;
	pageSize?: number;
};

export type MessageOrdering = '-created_at' | 'created_at' | '-scheduled_for' | 'scheduled_for' | '-sent_at' | 'sent_at';

export const messageOrderingLabels: Record<MessageOrdering, string> = {
	'-created_at': 'Newest first',
	created_at: 'Oldest first',
	'-sent_at': 'Recently sent',
	sent_at: 'Sent longest ago',
	'-scheduled_for': 'Scheduled latest',
	scheduled_for: 'Scheduled soonest'
};

export function toMessageQuery(query: MessageQuery): Query {
	return {
		application: query.application,
		vendor: query.vendor,
		template: query.template,
		status: Array.isArray(query.status) ? query.status.join(',') : query.status,
		bucket: query.bucket,
		search: query.search?.trim() || undefined,
		ordering: query.ordering,
		page: query.page && query.page > 1 ? query.page : undefined,
		page_size: query.pageSize
	};
}

export async function listMessages(query: MessageQuery = {}): Promise<Page<EmailMessage>> {
	return mapPage(await request<Page<Json>>('/email/messages/', { query: toMessageQuery(query) }), fromApiMessage);
}

/** The application's emails, newest first (the same items as listMessages({application})). */
export async function listApplicationEmails(applicationId: string, query: Omit<MessageQuery, 'application'> = {}): Promise<Page<EmailMessage>> {
	return mapPage(
		await request<Page<Json>>(`/applications/${applicationId}/emails/`, { query: toMessageQuery(query) }),
		fromApiMessage
	);
}

export async function getMessage(id: number): Promise<EmailMessageDetail> {
	return fromApiMessageDetail(await request<Json>(`/email/messages/${id}/`));
}

export async function listRevisions(id: number): Promise<EmailRevision[]> {
	return (await request<Json[]>(`/email/messages/${id}/revisions/`)).map(fromApiRevision);
}

export type DraftEdit = { subject: string; htmlBody: string; textBody: string; note?: string };

/** Edits a draft. The server keeps the previous version as a revision; identical content changes nothing. */
export async function reviseDraft(id: number, edit: DraftEdit): Promise<EmailMessageDetail> {
	return fromApiMessageDetail(
		await request<Json>(`/email/messages/${id}/`, {
			method: 'PATCH',
			json: { subject: edit.subject, html_body: edit.htmlBody, text_body: edit.textBody, note: edit.note?.trim() ?? '' }
		})
	);
}

/** Queues the draft for the next send window. Nothing is sent from the browser. */
export async function approveMessage(id: number): Promise<EmailMessageDetail> {
	return fromApiMessageDetail(await request<Json>(`/email/messages/${id}/approve/`, { method: 'POST', json: {} }));
}

export async function cancelMessage(id: number, reason = ''): Promise<EmailMessageDetail> {
	return fromApiMessageDetail(
		await request<Json>(`/email/messages/${id}/cancel/`, { method: 'POST', json: { reason: reason.trim() } })
	);
}

/** Refusals from POST applications/{id}/emails/, with the existing draft when it is a duplicate. */
export class PrepareDraftError extends Error {
	constructor(
		message: string,
		readonly existingMessageId: number | null,
		readonly fieldErrors: Record<string, string>
	) {
		super(message);
		this.name = 'PrepareDraftError';
	}
}

/** Prepares a draft by hand. It is always a draft for review, whatever the template mode. */
export async function prepareDraft(
	applicationId: string,
	templateKey: string,
	applicationLineId?: string | null
): Promise<EmailMessageDetail> {
	try {
		const raw = await request<Json>(`/applications/${applicationId}/emails/`, {
			method: 'POST',
			json: { template_key: templateKey, application_line: applicationLineId || undefined }
		});
		return fromApiMessageDetail(raw);
	} catch (error) {
		if (error instanceof ApiError && error.status === 400 && error.body) {
			const existing = Number(error.body.message_id);
			const fields = error.fieldErrors;
			delete fields.message_id;
			throw new PrepareDraftError(Object.values(fields)[0] ?? error.message, Number.isFinite(existing) && existing > 0 ? existing : null, fields);
		}
		throw error;
	}
}

export async function getEmailOverview(): Promise<EmailOverview> {
	return fromApiOverview(await request<Json>('/email/overview/'));
}

// --- Pure rules -------------------------------------------------------------------------------

/** The four templates Slice 2 prepares from applications, in pipeline order. */
export const APPLICATION_TEMPLATE_KEYS = ['application_received', 'call_follow_up', 'waitlist_update', 'application_declined'] as const;

/** Templates that need a booth line to say which booth they are about. */
export const LINE_TEMPLATE_KEYS: readonly string[] = ['waitlist_update'];

/** Templates a person can prepare by hand from an application: the four, when active. */
export const preparableTemplates = (templates: readonly EmailTemplate[]): EmailTemplate[] =>
	APPLICATION_TEMPLATE_KEYS.map((key) => templates.find((template) => template.key === key && template.isActive)).filter(
		(template): template is EmailTemplate => template !== undefined
	);

export type MessageActionKey = 'edit' | 'approve' | 'cancel';

/** Buttons for a message, from the server's permissions. A draft that no longer applies cannot be
 * approved (the server refuses it), so only Cancel is offered for it. */
export function messageActions(message: Pick<EmailMessage, 'status' | 'permissions' | 'noLongerApplies'>): MessageActionKey[] {
	const actions: MessageActionKey[] = [];
	if (message.status === 'draft' && message.permissions.canEdit && !message.noLongerApplies) actions.push('edit');
	if (message.status === 'draft' && message.permissions.canApprove && !message.noLongerApplies) actions.push('approve');
	if ((message.status === 'draft' || message.status === 'queued') && message.permissions.canCancel) actions.push('cancel');
	return actions;
}

export type MessageState = { tone: 'info' | 'warning' | 'success' | 'error' | 'neutral'; text: string };

/** One sentence about where the message stands, for the detail panel. */
export function messageState(
	message: Pick<EmailMessage, 'status' | 'noLongerApplies' | 'scheduledFor' | 'sentAt' | 'deliveredAt' | 'redirected' | 'deliveredToEmail' | 'failureDetail' | 'reviewTask'>,
	format: (iso: string) => string
): MessageState {
	const reason = message.failureDetail ? `: ${message.failureDetail}` : '.';
	switch (message.status) {
		case 'draft':
			if (message.noLongerApplies) return { tone: 'warning', text: `No longer applies: ${message.noLongerApplies} It cannot be approved; the system cancels it shortly.` };
			return { tone: 'warning', text: `Waiting for review${message.reviewTask?.owner ? ` by ${message.reviewTask.owner.name}` : ' (team queue)'}. Nothing is sent until it is approved.` };
		case 'queued':
			if (message.noLongerApplies) return { tone: 'warning', text: `Will not be sent: ${message.noLongerApplies}` };
			return { tone: 'info', text: message.scheduledFor ? `Queued. It will be sent from ${format(message.scheduledFor)}, in the send window.` : 'Queued for the next send window.' };
		case 'sending':
			return { tone: 'info', text: 'Sending now.' };
		case 'sent':
		case 'delivered': {
			const when = message.status === 'delivered' && message.deliveredAt ? `Delivered ${format(message.deliveredAt)}` : message.sentAt ? `Sent ${format(message.sentAt)}` : 'Sent';
			const where = message.redirected ? ` to the team's test mailbox (${message.deliveredToEmail || 'redirect address'}), not to the vendor.` : '.';
			return { tone: 'success', text: `${when}${where}` };
		}
		case 'failed':
			return { tone: 'error', text: `Sending failed${reason}` };
		case 'bounced':
			return { tone: 'error', text: `The vendor's mail server refused it (bounced)${reason}` };
		case 'complained':
			return { tone: 'error', text: `The vendor marked it as spam; this address will not receive more email${reason}` };
		case 'skipped':
			return { tone: 'neutral', text: `Not sent${reason}` };
		case 'cancelled':
			return { tone: 'neutral', text: `Cancelled${reason}` };
		default:
			return { tone: 'neutral', text: message.status };
	}
}

/** The date worth showing in a list row, with its label. */
export function messageDate(message: Pick<EmailMessage, 'status' | 'sentAt' | 'deliveredAt' | 'scheduledFor' | 'createdAt'>): { label: string; iso: string } {
	if (message.status === 'delivered' && message.deliveredAt) return { label: 'Delivered', iso: message.deliveredAt };
	if (message.sentAt) return { label: 'Sent', iso: message.sentAt };
	if ((message.status === 'queued' || message.status === 'sending') && message.scheduledFor) return { label: 'Scheduled', iso: message.scheduledFor };
	return { label: 'Created', iso: message.createdAt };
}

/** What the vendor's email is about, e.g. "10ft x 10ft · Oct 10 & 11". */
export function messageContext(message: Pick<EmailMessage, 'applicationLine' | 'marketWeekend'>): string {
	if (message.applicationLine) return `${message.applicationLine.productName} · ${message.applicationLine.weekendLabel}`;
	return message.marketWeekend?.label ?? '';
}

/** Why the email exists, from the trigger snapshot. */
export function triggerDescription(templateKey: string, trigger: Record<string, unknown>, format: (iso: string) => string): string {
	if (trigger.manual) return 'Prepared by hand by a team member.';
	const at = (key: string) => (typeof trigger[key] === 'string' ? format(trigger[key] as string) : null);
	switch (templateKey) {
		case 'application_received':
			return 'Prepared automatically when the application was submitted.';
		case 'call_follow_up':
			return `Prepared automatically after an unanswered call${trigger.attempt ? ` (attempt ${trigger.attempt})` : ''}${at('attempted_at') ? ` on ${at('attempted_at')}` : ''}.`;
		case 'waitlist_update':
			return `Prepared automatically when the booth was waitlisted${at('waitlisted_at') ? ` on ${at('waitlisted_at')}` : ''}.`;
		case 'application_declined':
			return `Prepared automatically when the application was declined${at('decided_at') ? ` on ${at('decided_at')}` : ''}.`;
		default:
			return '';
	}
}

/** The message a review task belongs to (each message carries its review task's id). */
export const messageForTask = <T extends Pick<EmailMessage, 'reviewTask'>>(messages: readonly T[], taskId: string): T | undefined =>
	messages.find((message) => message.reviewTask?.id === taskId);

/** Where a task's "Review email" action goes: the application's Emails tab, opening that task's email. */
export const reviewTaskHref = (task: { id: string; applicationId: string | null; vendor: { id: string } }) =>
	task.applicationId ? emailsTabHref(task.applicationId, { task: task.id }) : `/vendors/${task.vendor.id}`;

/** Link to an application's Emails tab, optionally opening one email or the email of a review task. */
export function emailsTabHref(applicationId: string, open: { email?: number; task?: string } = {}): string {
	const params = new URLSearchParams({ tab: 'emails' });
	if (open.email !== undefined) params.set('email', String(open.email));
	if (open.task) params.set('task', open.task);
	return `/applications/${applicationId}?${params}`;
}

export const SETTINGS_EMAILS_HREF = '/settings/emails';

/** Link to the message log in Settings → Emails, filtered by bucket. */
export const messagesHref = (bucket?: EmailBucket) => `${SETTINGS_EMAILS_HREF}?tab=messages${bucket ? `&bucket=${bucket}` : ''}`;

export type ModeExplanation = { tone: 'info' | 'warning' | 'success' | 'error'; headline: string; detail: string };

/** Plain-language summary of what actually happens to email right now. */
export function explainSendingMode(settings: Pick<EmailSettings, 'sendingMode' | 'effective' | 'environment' | 'liveSendingBlocked'>): ModeExplanation {
	const { effective, environment, sendingMode } = settings;
	const limitedByServer = effective.mode !== sendingMode;
	const chosen = sendingModeLabels[sendingMode] ?? sendingMode;
	const serverNote = limitedByServer ? ` The setting here is ${chosen}, but the server configuration only allows ${sendingModeLabels[effective.mode] ?? effective.mode}.` : '';
	if (effective.mode === 'disabled') {
		return {
			tone: 'warning',
			headline: limitedByServer ? 'Email sending is disabled by the server configuration.' : 'Email sending is disabled.',
			detail: `Nothing is sent. Approved emails wait in the queue.${serverNote}`
		};
	}
	if (effective.mode === 'redirect') {
		return {
			tone: 'info',
			headline: "Redirect mode: emails are sent to your team's test mailbox, not vendors.",
			detail: `Every email goes to ${effective.redirectToEmail || 'the redirect mailbox (none is set yet)'}.${serverNote}`
		};
	}
	if (!environment.deliversRealEmail || !environment.providerConfigured) {
		return {
			tone: 'warning',
			headline: 'Sending is enabled, but the server cannot deliver email yet.',
			detail: environment.deliversRealEmail ? `The ${environment.provider} provider is not fully configured on the server.` : 'The server only prints emails to its log (console provider); nothing reaches vendors.'
		};
	}
	return { tone: 'success', headline: 'Sending is enabled: approved and automatic emails go to vendors.', detail: 'Emails are sent in the send window, up to the daily limit.' };
}

/** "09:00:00" -> "09:00" for time inputs. */
export const toTimeInput = (value: string) => value.slice(0, 5);

// --- Template editing helpers -------------------------------------------------------------------

const PLACEHOLDER = /(?<!\{)\{([a-z_][a-z0-9_]*)\}(?!\})/g;

/** Placeholder names used in a text ({{ and }} are literal braces and are ignored). */
export function placeholdersIn(text: string): string[] {
	return [...new Set([...text.replaceAll('{{', '').replaceAll('}}', '').matchAll(PLACEHOLDER)].map((match) => match[1]))];
}

/** A quick hint while typing; the server is the judge when saving. */
export function unknownPlaceholders(texts: readonly string[], allowed: readonly string[]): string[] {
	const used = new Set(texts.flatMap(placeholdersIn));
	return [...used].filter((name) => !allowed.includes(name)).sort();
}

/** Inserts {name} at the cursor (or replaces the selection) and returns the new text and cursor. */
export function insertVariable(text: string, start: number, end: number, name: string): { text: string; cursor: number } {
	const token = `{${name}}`;
	const from = Math.max(0, Math.min(start, text.length));
	const to = Math.max(from, Math.min(end, text.length));
	return { text: text.slice(0, from) + token + text.slice(to), cursor: from + token.length };
}

export type TemplateDraft = Pick<EmailTemplate, 'subjectTemplate' | 'htmlTemplate' | 'textTemplate' | 'mode' | 'allowedVariables'>;

export const templateDraft = (template: EmailTemplate): TemplateDraft => ({
	subjectTemplate: template.subjectTemplate,
	htmlTemplate: template.htmlTemplate,
	textTemplate: template.textTemplate,
	mode: template.mode,
	allowedVariables: [...template.allowedVariables]
});

/** Only the changed fields, so a save never overwrites what the person did not touch. */
export function templateChanges(original: TemplateDraft, draft: TemplateDraft): TemplateInput {
	const changes: TemplateInput = {};
	if (draft.subjectTemplate !== original.subjectTemplate) changes.subjectTemplate = draft.subjectTemplate;
	if (draft.htmlTemplate !== original.htmlTemplate) changes.htmlTemplate = draft.htmlTemplate;
	if (draft.textTemplate !== original.textTemplate) changes.textTemplate = draft.textTemplate;
	if (draft.mode !== original.mode) changes.mode = draft.mode;
	if ([...draft.allowedVariables].sort().join() !== [...original.allowedVariables].sort().join()) changes.allowedVariables = draft.allowedVariables;
	return changes;
}

export const hasChanges = (changes: object) => Object.keys(changes).length > 0;

export type TemplateFilters = { search: string; category: string; mode: TemplateMode | '' };

export function filterTemplates(templates: readonly EmailTemplate[], filters: TemplateFilters): EmailTemplate[] {
	const needle = filters.search.trim().toLowerCase();
	return templates.filter(
		(template) =>
			(!filters.category || template.category === filters.category) &&
			(!filters.mode || template.mode === filters.mode) &&
			(!needle || `${template.name} ${template.description} ${template.key}`.toLowerCase().includes(needle))
	);
}

export const templateCategories = (templates: readonly EmailTemplate[]) => [...new Set(templates.map((template) => template.category))].sort();

/** Templates no workflow uses yet, so nobody expects them to fire. */
export const isUnusedTemplate = (key: string) => !(APPLICATION_TEMPLATE_KEYS as readonly string[]).includes(key);

/** The confirmation to show before a mode change, or null when none is needed. */
export function modeChangeWarning(from: TemplateMode, to: TemplateMode, liveSendingBlocked: boolean | null): string | null {
	if (to !== 'auto' || from === 'auto') return null;
	const now =
		liveSendingBlocked === false
			? 'Sending is enabled right now, so real vendors will receive these emails.'
			: 'Sending is currently disabled or redirected, but once global sending is enabled real vendors will receive these emails.';
	return `Auto sends these emails without anyone reviewing them first. ${now} Use Draft if the team should review each email.`;
}

// --- Draft editing helpers ----------------------------------------------------------------------

export const draftFromMessage = (message: Pick<EmailMessageDetail, 'subject' | 'htmlBody' | 'textBody'>): DraftEdit => ({
	subject: message.subject,
	htmlBody: message.htmlBody,
	textBody: message.textBody,
	note: ''
});

export const draftChanged = (original: DraftEdit, draft: DraftEdit) =>
	draft.subject !== original.subject || draft.htmlBody !== original.htmlBody || draft.textBody !== original.textBody;

/** Checks the server would make anyway, shown before sending (the server's message wins). */
export function draftProblems(draft: DraftEdit): Record<string, string> {
	const problems: Record<string, string> = {};
	if (!draft.subject.trim()) problems.subject = 'A subject is required.';
	else if (draft.subject.trim().length > 255) problems.subject = 'Keep the subject to 255 characters.';
	if (!draft.htmlBody.trim()) problems.html_body = 'The HTML body cannot be empty.';
	if (!draft.textBody.trim()) problems.text_body = 'The plain-text body cannot be empty.';
	return problems;
}

// --- Safe HTML preview --------------------------------------------------------------------------

/** The document shown inside the sandboxed preview frame. The frame has no script, form, popup or
 * navigation permissions; this policy also blocks scripts, remote fonts, frames and connections, and
 * allows only images (as email clients do) and inline styles. */
export function previewDocument(html: string): string {
	const policy = "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'";
	return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer"><style>body{font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#1f2937;margin:12px;overflow-wrap:anywhere}img{max-width:100%;height:auto}</style></head><body>${html}</body></html>`;
}
