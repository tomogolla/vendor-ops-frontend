// API client and pure rules for applications (v1.3 pipeline): an application is an order made of
// lines, and it carries the pipeline stage. Field names follow the Django serializers; money is
// integer cents and totals are always the server's, never recomputed here.
import { request, type Page, type Query } from '#lib/api.ts';
import {
	mapPage,
	rethrowDuplicate,
	toApiVendor,
	user,
	type Json,
	type UserSummary,
	type VendorInput,
	type VendorLabel
} from '#lib/vendor-store.ts';

// --- Stages ---------------------------------------------------------------------------

export type Stage = 'NEW' | 'IN_REVIEW' | 'AWAITING_PAYMENT' | 'WON' | 'DECLINED' | 'WITHDRAWN';

export const stageLabels: Record<Stage, string> = {
	NEW: 'New',
	IN_REVIEW: 'In review',
	AWAITING_PAYMENT: 'Awaiting payment',
	WON: 'Won',
	DECLINED: 'Declined',
	WITHDRAWN: 'Withdrawn'
};

/** Board columns, in pipeline order. */
export const BOARD_STAGES: readonly Stage[] = ['NEW', 'IN_REVIEW', 'AWAITING_PAYMENT', 'WON'];
// TODO(decision): declined cards. Declined and withdrawn are provisional terminal stages, shown in a
// collapsed Closed section until the product decision on declined cards is made.
export const CLOSED_STAGES: readonly Stage[] = ['DECLINED', 'WITHDRAWN'];
export const ALL_STAGES: readonly Stage[] = [...BOARD_STAGES, ...CLOSED_STAGES];

/** Stages in which lines can be added or edited (mirrors LINE_EDIT_STAGES in the backend). */
const LINE_EDIT_STAGES: readonly Stage[] = ['NEW', 'IN_REVIEW', 'WON'];

// --- Lines ------------------------------------------------------------------------------

export type LineStatus = 'REQUESTED' | 'CONFIRMED' | 'WAITLISTED' | 'DECLINED' | 'CANCELLED';

export const lineStatusLabels: Record<LineStatus, string> = {
	REQUESTED: 'Requested',
	CONFIRMED: 'Confirmed',
	WAITLISTED: 'Waitlisted',
	DECLINED: 'Declined',
	CANCELLED: 'Cancelled'
};

export const OPEN_LINE_STATUSES: readonly LineStatus[] = ['REQUESTED', 'WAITLISTED', 'CONFIRMED'];

export type WeekendRef = { id: string; label: string; startDate: string };

export type ApplicationLine = {
	id: string;
	applicationId: string;
	kind: 'booth' | 'add_on';
	variantId: string | null;
	addOnId: string | null;
	parentLineId: string | null;
	productName: string;
	weekend: WeekendRef;
	quantity: number;
	unitPriceCents: number;
	totalCents: number;
	status: LineStatus;
	statusReason: string;
	waitlistedAt: string | null;
	confirmedAt: string | null;
	closedAt: string | null;
	createdAt: string;
};

// --- Applications ---------------------------------------------------------------------

export type DiscountType = 'NONE' | 'PERCENT' | 'FIXED';

export type Discount = {
	type: DiscountType;
	/** Decimal string from the API: a percent (0-100) for PERCENT, whole cents for FIXED. */
	value: string;
	label: string;
};

export type Totals = {
	currency: string;
	requestedTotalCents: number;
	confirmedSubtotalCents: number;
	discountCents: number;
	confirmedTotalCents: number;
};

export type ApplicationVendor = {
	id: string;
	brandName: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	instagram: string;
};

export type Application = {
	id: string;
	vendorId: string;
	vendorBrand: string;
	vendorLabel: VendorLabel;
	vendor: ApplicationVendor;
	submittedBy: UserSummary | null;
	source: string;
	submittedAt: string;
	stage: Stage;
	stageEnteredAt: string | null;
	hasWaitlistedLines: boolean;
	callExhausted: boolean;
	callAttempts: number;
	nextTaskDueAt: string | null;
	reviewerId: string | null;
	category: string;
	productDescription: string;
	lines: ApplicationLine[];
	discount: Discount;
	billedAt: string | null;
	firstPaidAt: string | null;
	totals: Totals;
	updatedAt: string;
};

export type ApplicationSummary = {
	stages: Record<Stage, number>;
	oldestAwaitingPayment: { id: string; brandName: string; billedAt: string | null; daysSinceBilled: number | null }[];
};

// --- API -> UI mapping ------------------------------------------------------------------

export function fromApiLine(raw: Json): ApplicationLine {
	return {
		id: raw.id,
		applicationId: raw.application,
		kind: raw.kind,
		variantId: raw.variant ?? null,
		addOnId: raw.add_on ?? null,
		parentLineId: raw.parent_line ?? null,
		productName: raw.product_name ?? '',
		weekend: { id: raw.weekend.id, label: raw.weekend.label, startDate: raw.weekend.start_date },
		quantity: raw.quantity,
		unitPriceCents: raw.unit_price_cents,
		totalCents: raw.total_cents,
		status: raw.status,
		statusReason: raw.status_reason ?? '',
		waitlistedAt: raw.waitlisted_at ?? null,
		confirmedAt: raw.confirmed_at ?? null,
		closedAt: raw.closed_at ?? null,
		createdAt: raw.created_at
	};
}

export function fromApiApplication(raw: Json): Application {
	const vendor = raw.vendor_detail ?? {};
	return {
		id: raw.id,
		vendorId: raw.vendor,
		vendorBrand: raw.vendor_brand ?? vendor.brand_name ?? '',
		vendorLabel: raw.vendor_label,
		vendor: {
			id: vendor.id ?? raw.vendor,
			brandName: vendor.brand_name ?? raw.vendor_brand ?? '',
			firstName: vendor.first_name ?? '',
			lastName: vendor.last_name ?? '',
			email: vendor.email ?? '',
			phone: vendor.phone ?? '',
			instagram: vendor.instagram ?? ''
		},
		submittedBy: user(raw.submitted_by),
		source: raw.source ?? '',
		submittedAt: raw.submitted_at,
		stage: raw.stage,
		stageEnteredAt: raw.stage_entered_at ?? null,
		hasWaitlistedLines: Boolean(raw.has_waitlisted_lines),
		callExhausted: Boolean(raw.call_exhausted),
		callAttempts: raw.call_attempts ?? 0,
		nextTaskDueAt: raw.next_task_due_at ?? null,
		reviewerId: raw.reviewer ?? null,
		category: raw.category ?? '',
		productDescription: raw.product_description ?? '',
		lines: (raw.lines ?? []).map(fromApiLine),
		discount: { type: raw.discount_type ?? 'NONE', value: raw.discount_value ?? '0.00', label: raw.discount_label ?? '' },
		billedAt: raw.billed_at ?? null,
		firstPaidAt: raw.first_paid_at ?? null,
		totals: {
			currency: raw.currency ?? 'USD',
			requestedTotalCents: raw.requested_total_cents ?? 0,
			confirmedSubtotalCents: raw.confirmed_subtotal_cents ?? 0,
			discountCents: raw.discount_cents ?? 0,
			confirmedTotalCents: raw.confirmed_total_cents ?? 0
		},
		updatedAt: raw.updated_at
	};
}

export function fromApiSummary(raw: Json): ApplicationSummary {
	const stages = Object.fromEntries(ALL_STAGES.map((stage) => [stage, raw.stages?.[stage] ?? 0])) as Record<Stage, number>;
	return {
		stages,
		oldestAwaitingPayment: (raw.oldest_awaiting_payment ?? []).map((item: Json) => ({
			id: item.id,
			brandName: item.brand_name,
			billedAt: item.billed_at ?? null,
			daysSinceBilled: item.days_since_billed ?? null
		}))
	};
}

// --- API calls --------------------------------------------------------------------------

export async function listApplications(query: Query = {}): Promise<Page<Application>> {
	return mapPage(await request<Page<Json>>('/applications/', { query }), fromApiApplication);
}

export async function countApplications(query: Query = {}): Promise<number> {
	return (await request<Page<Json>>('/applications/', { query: { ...query, page_size: 1 } })).count;
}

export async function getApplication(id: string): Promise<Application> {
	return fromApiApplication(await request<Json>(`/applications/${id}/`));
}

export async function getSummary(query: Query = {}): Promise<ApplicationSummary> {
	return fromApiSummary(await request<Json>('/applications/summary/', { query }));
}

/** A booth requested with a new application, with optional add-ons attached to that booth. */
export type OrderLineInput = { variantId: string; quantity: number; addOns: { addOnId: string; quantity: number }[] };

export function toApiOrderLines(lines: OrderLineInput[]): Json[] {
	return lines.map((line) => ({
		variant: line.variantId,
		quantity: line.quantity,
		add_ons: line.addOns.map((addOn) => ({ add_on: addOn.addOnId, quantity: addOn.quantity }))
	}));
}

export type Submission = { application: Application; bundled: boolean };

/** Every entry starts at New with an automatic call task. If the vendor already has an application
 * at New or In review, the backend adds the lines and notes to it instead (200, bundled: true). */
export async function createApplication(args: {
	vendorId?: string;
	vendor?: VendorInput;
	source?: string;
	notes?: string;
	lines?: OrderLineInput[];
}): Promise<Submission> {
	try {
		const raw = await request<Json>('/applications/', {
			method: 'POST',
			json: {
				vendor: args.vendorId,
				vendor_data: args.vendor ? toApiVendor(args.vendor) : undefined,
				source: args.source || 'Staff entry',
				notes: args.notes?.trim() || undefined,
				requested_lines: args.lines?.length ? toApiOrderLines(args.lines) : undefined
			}
		});
		return fromApiSubmission(raw);
	} catch (error) {
		rethrowDuplicate(error);
	}
}

export const fromApiSubmission = (raw: Json): Submission => ({
	application: fromApiApplication(raw),
	bundled: raw.bundled === true
});

/** Where to go after a submission, and the notice to show there. */
export function submissionOutcome({ application, bundled }: Submission): { href: string; notice: string | null } {
	return {
		href: `/applications/${application.id}${bundled ? '?bundled=1' : ''}`,
		notice: bundled ? bundledNotice(application.vendorBrand) : null
	};
}

export const bundledNotice = (brand: string) =>
	`${brand || 'This vendor'} already had an open application, so this submission was added to it instead of starting a new one.`;

export async function changeStage(id: string, stage: Stage, reason = ''): Promise<Application> {
	return fromApiApplication(
		await request<Json>(`/applications/${id}/stage/`, { method: 'POST', json: { stage, reason: reason.trim() } })
	);
}

export async function setDiscount(id: string, discount: Discount): Promise<Application> {
	return fromApiApplication(
		await request<Json>(`/applications/${id}/`, {
			method: 'PATCH',
			json: { discount_type: discount.type, discount_value: discount.value, discount_label: discount.label.trim() }
		})
	);
}

// TODO(invoicing): interim placeholders until invoices, Stripe and Shopify replace them.
export async function markBilled(id: string): Promise<Application> {
	return fromApiApplication(await request<Json>(`/applications/${id}/mark-billed/`, { method: 'POST', json: {} }));
}

export async function markFirstPayment(id: string, note = ''): Promise<Application> {
	return fromApiApplication(
		await request<Json>(`/applications/${id}/mark-first-payment/`, { method: 'POST', json: { note: note.trim() } })
	);
}

export async function listLines(applicationId: string): Promise<ApplicationLine[]> {
	return (await request<Json[]>(`/applications/${applicationId}/lines/`)).map(fromApiLine);
}

export async function addLine(
	applicationId: string,
	line: { variantId?: string; addOnId?: string; parentLineId?: string; quantity: number }
): Promise<ApplicationLine> {
	const raw = await request<Json>(`/applications/${applicationId}/lines/`, {
		method: 'POST',
		json: { variant: line.variantId, add_on: line.addOnId, parent_line: line.parentLineId, quantity: line.quantity }
	});
	return fromApiLine(raw);
}

export async function updateLineQuantity(lineId: string, quantity: number): Promise<ApplicationLine> {
	return fromApiLine(await request<Json>(`/application-lines/${lineId}/`, { method: 'PATCH', json: { quantity } }));
}

export async function deleteLine(lineId: string): Promise<void> {
	await request(`/application-lines/${lineId}/`, { method: 'DELETE' });
}

export type LineDecision = 'confirm' | 'waitlist' | 'decline' | 'release';

export async function decideLine(lineId: string, decision: LineDecision, reason = ''): Promise<ApplicationLine> {
	const json = decision === 'confirm' ? {} : { reason: reason.trim() };
	return fromApiLine(await request<Json>(`/application-lines/${lineId}/${decision}/`, { method: 'POST', json }));
}

// --- Order form drafts ---------------------------------------------------------------------

/** One booth row in the order-lines picker; strings are what the inputs hold. */
export type OrderLineDraft = {
	key: string;
	weekendId: string;
	variantId: string;
	quantity: number | null;
	addOnIds: string[];
};

/** Validates the picker and returns the lines to submit, or the first problem per row. */
export function orderLinesFromDrafts(drafts: readonly OrderLineDraft[]): { lines: OrderLineInput[]; errors: Record<string, string> } {
	const errors: Record<string, string> = {};
	const seen = new Set<string>();
	const lines: OrderLineInput[] = [];
	for (const draft of drafts) {
		if (!draft.weekendId || !draft.variantId) errors[draft.key] = 'Choose a weekend and a booth.';
		else if (!Number.isInteger(draft.quantity) || (draft.quantity ?? 0) < 1) errors[draft.key] = 'Quantity must be a whole number of at least 1.';
		else if (seen.has(draft.variantId)) errors[draft.key] = 'This booth is already in the order; change the quantity on that row instead.';
		if (errors[draft.key]) continue;
		seen.add(draft.variantId);
		lines.push({
			variantId: draft.variantId,
			quantity: draft.quantity as number,
			addOns: draft.addOnIds.map((addOnId) => ({ addOnId, quantity: 1 }))
		});
	}
	return { lines, errors };
}

/** Turns the discount inputs into the API value: a percent (0-100, two decimals) or dollars -> cents. */
export function discountFromInput(
	type: DiscountType,
	text: string,
	label: string,
	parseDollars: (text: string) => number | null
): { discount: Discount } | { error: string } {
	if (type === 'NONE') return { discount: { type, value: '0', label: '' } };
	const trimmed = text.trim();
	if (type === 'PERCENT') {
		if (!/^\d{1,3}(\.\d{1,2})?$/.test(trimmed) || Number(trimmed) > 100) {
			return { error: 'Enter a percent from 0 to 100 (up to two decimals).' };
		}
		return { discount: { type, value: trimmed, label: label.trim() } };
	}
	const cents = parseDollars(trimmed);
	if (cents === null) return { error: 'Enter a dollar amount, for example 25 or 25.50.' };
	return { discount: { type, value: String(cents), label: label.trim() } };
}

// --- Board filters (query-string driven, so views are linkable) ----------------------------

export type CallFilter = 'none' | 'attempted_not_reached' | 'exhausted';

export const callFilterLabels: Record<CallFilter, string> = {
	none: 'Not called',
	attempted_not_reached: 'Attempted, not reached',
	exhausted: 'Call exhausted'
};

/** Call filters the API supports. TODO(backend): `call_exhausted` has no list filter yet. */
export const SUPPORTED_CALL_FILTERS: readonly CallFilter[] = ['none', 'attempted_not_reached'];

export type BoardFilters = {
	source: string;
	owner: '' | 'me' | 'none';
	waitlisted: boolean;
	call: CallFilter | '';
};

export type ParamsLike = Pick<URLSearchParams, 'get' | 'toString'>;

export function filtersFromParams(params: ParamsLike): BoardFilters {
	const owner = params.get('owner');
	const call = params.get('call');
	return {
		source: params.get('source') ?? '',
		owner: owner === 'me' || owner === 'none' ? owner : '',
		waitlisted: params.get('waitlisted') === '1',
		call: call && call in callFilterLabels ? (call as CallFilter) : ''
	};
}

/** API query for the filters. Unsupported filters are reported, never applied client-side. */
export function filtersToQuery(filters: BoardFilters): { query: Query; unsupported: string[] } {
	const query: Query = {
		source: filters.source || undefined,
		owner: filters.owner || undefined,
		has_waitlisted_lines: filters.waitlisted ? true : undefined
	};
	const unsupported: string[] = [];
	if (filters.call && SUPPORTED_CALL_FILTERS.includes(filters.call)) query.call = filters.call;
	else if (filters.call) unsupported.push(callFilterLabels[filters.call]);
	return { query, unsupported };
}

/** Builds /applications?… for a filter set, keeping other params (view, stage, page). */
export function filtersHref(base: ParamsLike, filters: BoardFilters): string {
	const params = new URLSearchParams(base.toString());
	const set = (key: string, value: string) => (value ? params.set(key, value) : params.delete(key));
	set('source', filters.source);
	set('owner', filters.owner);
	set('waitlisted', filters.waitlisted ? '1' : '');
	set('call', filters.call);
	params.delete('page');
	const text = params.toString();
	return text ? `/applications?${text}` : '/applications';
}

// --- Pure helpers --------------------------------------------------------------------------

export function groupByStage(applications: readonly Application[]): Record<Stage, Application[]> {
	const groups = Object.fromEntries(ALL_STAGES.map((stage) => [stage, [] as Application[]])) as Record<Stage, Application[]>;
	for (const application of applications) groups[application.stage]?.push(application);
	return groups;
}

const DAY = 24 * 60 * 60 * 1000;

/** Whole days since the application entered its stage, or null when unknown. */
export function daysInStage(application: Pick<Application, 'stageEnteredAt'>, now: Date = new Date()): number | null {
	if (!application.stageEnteredAt) return null;
	const entered = new Date(application.stageEnteredAt).getTime();
	if (Number.isNaN(entered)) return null;
	return Math.max(0, Math.floor((now.getTime() - entered) / DAY));
}

/** Booth lines in order, each followed by its add-on lines (orphans last). */
export function linesInOrder(lines: readonly ApplicationLine[]): { line: ApplicationLine; parent: ApplicationLine | null }[] {
	const booths = lines.filter((line) => !line.parentLineId);
	const rows: { line: ApplicationLine; parent: ApplicationLine | null }[] = [];
	for (const booth of booths) {
		rows.push({ line: booth, parent: null });
		for (const addOn of lines.filter((line) => line.parentLineId === booth.id)) rows.push({ line: addOn, parent: booth });
	}
	for (const line of lines) if (!rows.some((row) => row.line.id === line.id)) rows.push({ line, parent: null });
	return rows;
}

export const isIncompleteApplication =(application: Pick<Application, 'category'>) => !application.category;

export type StageActionKey = 'start_review' | 'decline' | 'withdraw' | 'reopen' | 'mark_billed' | 'mark_first_payment';

export type StageAction = {
	key: StageActionKey;
	label: string;
	tone: string;
	/** Whether the confirmation dialog asks for a reason or note. */
	input: 'none' | 'reason' | 'note';
	/** Interim actions are replaced by real invoices in the next release. TODO(invoicing) */
	interim?: boolean;
	disabledReason?: string;
};

const stageActionDefs: Record<StageActionKey, StageAction> = {
	start_review: { key: 'start_review', label: 'Start review', tone: 'btn-primary', input: 'none' },
	decline: { key: 'decline', label: 'Decline', tone: 'btn-error btn-outline', input: 'reason' },
	withdraw: { key: 'withdraw', label: 'Withdraw', tone: 'btn-outline', input: 'reason' },
	reopen: { key: 'reopen', label: 'Reopen', tone: 'btn-outline', input: 'reason' },
	mark_billed: { key: 'mark_billed', label: 'Mark billed', tone: 'btn-primary', input: 'none', interim: true },
	mark_first_payment: {
		key: 'mark_first_payment',
		label: 'Mark first payment received',
		tone: 'btn-primary',
		input: 'note',
		interim: true
	}
};

/** Stage actions an administrator can take; team members get none (calls move New to In review). */
export function availableStageActions(
	application: Pick<Application, 'stage' | 'lines'>,
	isAdmin: boolean
): StageAction[] {
	if (!isAdmin) return [];
	const pick = (...keys: StageActionKey[]) => keys.map((key) => ({ ...stageActionDefs[key] }));
	switch (application.stage) {
		case 'NEW':
			return pick('start_review', 'decline', 'withdraw');
		case 'IN_REVIEW': {
			const [billed, ...rest] = pick('mark_billed', 'decline', 'withdraw');
			if (!application.lines.some((line) => line.status === 'CONFIRMED')) {
				billed.disabledReason = 'Confirm at least one line before billing.';
			}
			return [billed, ...rest];
		}
		case 'AWAITING_PAYMENT':
			return pick('mark_first_payment');
		case 'DECLINED':
		case 'WITHDRAWN':
			return pick('reopen');
		default:
			return [];
	}
}

/** The stage an action moves to through POST /applications/{id}/stage/ (billing actions use their own endpoints). */
export const stageActionTarget: Partial<Record<StageActionKey, Stage>> = {
	start_review: 'IN_REVIEW',
	decline: 'DECLINED',
	withdraw: 'WITHDRAWN',
	reopen: 'IN_REVIEW'
};

export type LineActionKey = 'edit' | 'delete' | LineDecision;

export type LineAction = {
	key: LineActionKey;
	label: string;
	tone: string;
	reason: 'none' | 'optional' | 'required';
	disabledReason?: string;
};

/** What the current person can do to a line. `context` narrows by application stage and, for
 * add-on lines, by the status of the parent booth line. The API enforces the same rules. */
export function availableLineActions(
	line: Pick<ApplicationLine, 'status' | 'kind'>,
	isAdmin: boolean,
	applicationFirstPaid: boolean,
	context: { stage?: Stage; parentStatus?: LineStatus } = {}
): LineAction[] {
	const actions: LineAction[] = [];
	const editable = !context.stage || LINE_EDIT_STAGES.includes(context.stage);
	if (line.status === 'REQUESTED' && editable) {
		actions.push({ key: 'edit', label: 'Change quantity', tone: 'btn-ghost', reason: 'none' });
		actions.push({ key: 'delete', label: 'Remove', tone: 'btn-ghost text-error', reason: 'none' });
	}
	const closed = context.stage !== undefined && CLOSED_STAGES.includes(context.stage);
	if (!isAdmin || closed) return actions;

	if (line.status === 'REQUESTED' || line.status === 'WAITLISTED') {
		const confirm: LineAction = { key: 'confirm', label: 'Confirm', tone: 'btn-primary', reason: 'none' };
		if (line.kind === 'add_on' && context.parentStatus && context.parentStatus !== 'CONFIRMED') {
			confirm.disabledReason = 'Confirm the booth line before its add-ons.';
		}
		actions.push(confirm);
	}
	if (line.status === 'REQUESTED') {
		actions.push({ key: 'waitlist', label: 'Waitlist', tone: 'btn-outline', reason: 'optional' });
	}
	if (line.status === 'REQUESTED' || line.status === 'WAITLISTED') {
		actions.push({ key: 'decline', label: 'Decline', tone: 'btn-error btn-outline', reason: 'optional' });
	}
	if (line.status === 'CONFIRMED') {
		const release: LineAction = { key: 'release', label: 'Release hold', tone: 'btn-error btn-outline', reason: 'required' };
		if (applicationFirstPaid) {
			release.disabledReason = 'This application has been paid; releasing would need a refund, which is not designed yet.';
		}
		actions.push(release);
	}
	return actions;
}

/** The order discount in words, e.g. "10% · New Vendor Trial" or "$25.00 off". */
export function describeDiscount(discount: Discount, formatCents: (cents: number) => string): string {
	if (discount.type === 'NONE') return 'No discount';
	const amount =
		discount.type === 'PERCENT' ? `${Number(discount.value)}%` : `${formatCents(Math.round(Number(discount.value)))} off`;
	return discount.label ? `${amount} · ${discount.label}` : amount;
}

export type TotalsRow = { key: keyof Omit<Totals, 'currency'>; label: string; cents: number; emphasis?: boolean; negative?: boolean };

/** Rows for the totals panel, straight from the server's figures. The discount row only shows
 * when there is a discount. */
export function totalsRows(application: Pick<Application, 'totals' | 'discount'>): TotalsRow[] {
	const { totals, discount } = application;
	const rows: TotalsRow[] = [
		{ key: 'requestedTotalCents', label: 'Requested total', cents: totals.requestedTotalCents },
		{ key: 'confirmedSubtotalCents', label: 'Confirmed subtotal', cents: totals.confirmedSubtotalCents }
	];
	if (discount.type !== 'NONE' || totals.discountCents) {
		rows.push({
			key: 'discountCents',
			label: discount.label ? `Discount (${discount.label})` : 'Discount',
			cents: totals.discountCents,
			negative: true
		});
	}
	rows.push({ key: 'confirmedTotalCents', label: 'Confirmed total', cents: totals.confirmedTotalCents, emphasis: true });
	return rows;
}
