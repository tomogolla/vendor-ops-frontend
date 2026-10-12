// API client layer for vendors, applications, tasks, activity and imports. Data lives in
// PostgreSQL behind the Django API; nothing here is cached in browser storage.
import { ApiError, request, type Page, type Query } from '#lib/api.ts';
import {
	MAX_CALL_ATTEMPTS,
	type BoothSize,
	type BusinessRegistration,
	type CallOutcome,
	type Category,
	type CommitmentLevel,
	type LiabilityInsurance
} from '#lib/options.ts';

export { MAX_CALL_ATTEMPTS };

// --- Status model (display status derived by the API) ------------------------

export type VendorStatus =
	| 'lead'
	| 'applied'
	| 'in_review'
	| 'waitlisted'
	| 'approved'
	| 'declined'
	| 'suspended';

export const vendorStatuses: readonly VendorStatus[] = [
	'lead',
	'applied',
	'in_review',
	'waitlisted',
	'approved',
	'declined',
	'suspended'
];

export const statusLabels: Record<VendorStatus, string> = {
	lead: 'Lead',
	applied: 'Applied',
	in_review: 'In review',
	waitlisted: 'Waitlisted',
	approved: 'Approved',
	declined: 'Declined',
	suspended: 'Suspended'
};

/** Mirrors DISPLAY_TRANSITIONS in the backend, which is the authority. */
export const statusTransitions: Record<VendorStatus, readonly VendorStatus[]> = {
	lead: ['applied', 'in_review', 'declined'],
	applied: ['in_review', 'declined'],
	in_review: ['approved', 'waitlisted', 'declined'],
	waitlisted: ['in_review', 'approved', 'declined'],
	approved: ['suspended'],
	suspended: ['approved'],
	declined: ['in_review']
};

export function canTransition(from: VendorStatus, to: VendorStatus): boolean {
	return statusTransitions[from].includes(to);
}

/** Team members may only turn a lead into an application; everything else is admin-only. */
export function canChangeStatus(isAdmin: boolean, from: VendorStatus, to: VendorStatus): boolean {
	return canTransition(from, to) && (isAdmin || (from === 'lead' && to === 'applied'));
}

/** Status a call outcome suggests; the profile offers it, it is never applied automatically. */
export const outcomeSuggestions: Partial<Record<CallOutcome, VendorStatus>> = {
	Interested: 'applied',
	'Not Qualified': 'declined'
};

// --- Types ----------------------------------------------------------------------

export type UserSummary = { id: string; username: string; name: string; role: string };

export type CallDetails = {
	interestLevel: number | null;
	challenges: string;
	locationPainPoints: string;
	revenueConsistency: string;
	vendorReaction: string;
	objectionNotes: string;
};

export type CallSummary = {
	openTaskId: string | null;
	openTaskStatus: TaskStatus | null;
	dueAt: string | null;
	ownerId: string | null;
	neverCalled: boolean;
	lastOutcome: CallOutcome | '';
	lastCalledAt: string | null;
	attemptCount: number;
	details: CallDetails;
};

export type Vendor = {
	id: string;
	createdAt: string;
	updatedAt: string;
	status: VendorStatus;
	journeyStage: string;
	qualificationStatus: string;
	applicationStatusSummary: string;
	isActive: boolean;
	outreachOptOut: boolean;
	owner: UserSummary | null;
	createdBy: UserSummary | null;
	firstName: string;
	lastName: string;
	brandName: string;
	email: string;
	phone: string;
	instagram: string;
	website: string;
	category: Category | '';
	aboutBrand: string;
	objectives: string;
	commitmentLevel: CommitmentLevel | '';
	otherMarkets: string;
	leadSource: string;
	sourceDetails: string;
	tags: string[];
	notes: string;
	businessRegistration: BusinessRegistration;
	liabilityInsurance: LiabilityInsurance;
	call: CallSummary;
};

/** The fields a person edits through the vendor form. */
export type VendorInput = Pick<
	Vendor,
	| 'firstName'
	| 'lastName'
	| 'brandName'
	| 'email'
	| 'phone'
	| 'instagram'
	| 'website'
	| 'category'
	| 'aboutBrand'
	| 'objectives'
	| 'commitmentLevel'
	| 'otherMarkets'
	| 'leadSource'
	| 'tags'
	| 'notes'
	| 'businessRegistration'
	| 'liabilityInsurance'
>;

export type BookingInterest = {
	proposedBoothSize: BoothSize | '';
	requestedWeekends: string[];
	needsTent: boolean;
};

export type CallInput = {
	outcome: CallOutcome | '';
	callbackAt: string | null;
	notes: string;
	details: CallDetails;
};

export type CreatableStatus = Extract<VendorStatus, 'lead' | 'applied'>;

export type ApplicationStatus = 'SUBMITTED' | 'IN_REVIEW' | 'WAITLISTED' | 'APPROVED' | 'DECLINED' | 'WITHDRAWN';

export type Application = {
	id: string;
	vendorId: string;
	status: ApplicationStatus;
	source: string;
	submittedAt: string;
	submittedBy: UserSummary | null;
	reviewerId: string | null;
	category: string;
	productDescription: string;
	booking: BookingInterest;
	decision: string;
	decisionReason: string;
	decidedAt: string | null;
};

export type TaskType = 'DISCOVERY_CALL' | 'APPLICATION_REVIEW' | 'FOLLOW_UP';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_ANSWER' | 'RESCHEDULED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type VendorSummary = Pick<Vendor, 'id' | 'brandName' | 'firstName' | 'lastName' | 'email' | 'phone' | 'instagram' | 'status'>;

export type Task = {
	id: string;
	vendor: VendorSummary;
	applicationId: string | null;
	title: string;
	taskType: TaskType;
	status: TaskStatus;
	priority: TaskPriority;
	owner: UserSummary | null;
	createdBy: UserSummary | null;
	dueAt: string | null;
	completedAt: string | null;
	description: string;
	outcome: string;
	notes: string;
	attemptCount: number;
	lastAttemptAt: string | null;
	callbackAt: string | null;
	callDetails: CallDetails;
	isOpen: boolean;
	createdAt: string;
};

export type ActivityEvent = {
	id: string;
	eventType: string;
	description: string;
	actor: UserSummary | null;
	createdAt: string;
	metadata: Record<string, unknown>;
};

export type NoteType = 'LEAD_INTAKE' | 'DISCOVERY_CALL' | 'QUALIFICATION' | 'APPLICATION_REVIEW' | 'GENERAL';
export type InternalNote = { id: string; noteType: NoteType; body: string; author: UserSummary | null; createdAt: string };

export type DuplicateMatch = { vendor: VendorSummary; matchedOn: ('email' | 'phone' | 'instagram' | 'brand_name')[] };
export type DuplicateResult = { matches: DuplicateMatch[]; nameMatches: VendorSummary[] };

// --- Empty values and pure helpers ----------------------------------------------

export function emptyVendorInput(): VendorInput {
	return {
		firstName: '',
		lastName: '',
		brandName: '',
		email: '',
		phone: '',
		instagram: '',
		website: '',
		category: '',
		aboutBrand: '',
		objectives: '',
		commitmentLevel: '',
		otherMarkets: '',
		leadSource: '',
		tags: [],
		notes: '',
		businessRegistration: 'Not answered',
		liabilityInsurance: 'Not answered'
	};
}

export const emptyBooking = (): BookingInterest => ({ proposedBoothSize: '', requestedWeekends: [], needsTent: false });

export const emptyCallDetails = (): CallDetails => ({
	interestLevel: null,
	challenges: '',
	locationPainPoints: '',
	revenueConsistency: '',
	vendorReaction: '',
	objectionNotes: ''
});

export const emptyCallInput = (): CallInput => ({ outcome: '', callbackAt: null, notes: '', details: emptyCallDetails() });

export function toVendorInput(vendor: Vendor): VendorInput {
	const input = emptyVendorInput();
	for (const key of Object.keys(input) as (keyof VendorInput)[]) {
		(input as Record<string, unknown>)[key] = key === 'tags' ? [...vendor.tags] : vendor[key];
	}
	return input;
}

export const needsCall = (vendor: Vendor) => vendor.call.openTaskId !== null;
export const neverCalled = (vendor: Vendor) => vendor.call.neverCalled;

export const normaliseEmail = (email: string) => email.trim().toLowerCase();
export const normaliseInstagram = (handle: string) => handle.replace(/[@\s]/g, '').toLowerCase();

// --- API <-> UI mapping -----------------------------------------------------------

type Json = Record<string, any>;

const user = (raw: Json | null | undefined): UserSummary | null =>
	raw ? { id: raw.id, username: raw.username, name: raw.name, role: raw.role } : null;

export function fromApiCallDetails(raw: Json | null | undefined): CallDetails {
	const value = raw ?? {};
	return {
		interestLevel: value.interest_level ?? null,
		challenges: value.challenges ?? '',
		locationPainPoints: value.location_pain_points ?? '',
		revenueConsistency: value.revenue_consistency ?? '',
		vendorReaction: value.vendor_reaction ?? '',
		objectionNotes: value.objection_notes ?? ''
	};
}

export function toApiCallDetails(details: CallDetails): Json {
	return {
		interest_level: details.interestLevel ?? null,
		challenges: details.challenges.trim(),
		location_pain_points: details.locationPainPoints.trim(),
		revenue_consistency: details.revenueConsistency.trim(),
		vendor_reaction: details.vendorReaction.trim(),
		objection_notes: details.objectionNotes.trim()
	};
}

export function fromApiVendor(raw: Json): Vendor {
	const call = raw.call ?? {};
	return {
		id: raw.id,
		createdAt: raw.created_at,
		updatedAt: raw.updated_at,
		status: raw.status,
		journeyStage: raw.journey_stage,
		qualificationStatus: raw.qualification_status,
		applicationStatusSummary: raw.application_status_summary ?? '',
		isActive: raw.is_active,
		outreachOptOut: raw.outreach_opt_out,
		owner: user(raw.owner_detail),
		createdBy: user(raw.created_by),
		firstName: raw.first_name ?? '',
		lastName: raw.last_name ?? '',
		brandName: raw.brand_name ?? '',
		email: raw.email ?? '',
		phone: raw.phone ?? '',
		instagram: raw.instagram ?? '',
		website: raw.website ?? '',
		category: raw.category ?? '',
		aboutBrand: raw.description ?? '',
		objectives: raw.objectives ?? '',
		commitmentLevel: raw.commitment_level ?? '',
		otherMarkets: raw.other_markets ?? '',
		leadSource: raw.lead_source ?? '',
		sourceDetails: raw.source_details ?? '',
		tags: raw.tags ?? [],
		notes: raw.notes ?? '',
		businessRegistration: raw.business_registration || 'Not answered',
		liabilityInsurance: raw.liability_insurance || 'Not answered',
		call: {
			openTaskId: call.open_task_id ?? null,
			openTaskStatus: call.open_task_status ?? null,
			dueAt: call.due_at ?? null,
			ownerId: call.owner_id ?? null,
			neverCalled: call.never_called ?? true,
			lastOutcome: call.last_outcome ?? '',
			lastCalledAt: call.last_called_at ?? null,
			attemptCount: call.attempt_count ?? 0,
			details: fromApiCallDetails(call.call_details)
		}
	};
}

export function toApiVendor(input: Partial<VendorInput>): Json {
	const map: Record<keyof VendorInput, string> = {
		firstName: 'first_name',
		lastName: 'last_name',
		brandName: 'brand_name',
		email: 'email',
		phone: 'phone',
		instagram: 'instagram',
		website: 'website',
		category: 'category',
		aboutBrand: 'description',
		objectives: 'objectives',
		commitmentLevel: 'commitment_level',
		otherMarkets: 'other_markets',
		leadSource: 'lead_source',
		tags: 'tags',
		notes: 'notes',
		businessRegistration: 'business_registration',
		liabilityInsurance: 'liability_insurance'
	};
	const body: Json = {};
	for (const [key, value] of Object.entries(input) as [keyof VendorInput, unknown][]) {
		if (key in map) body[map[key]] = typeof value === 'string' ? value.trim() : value;
	}
	return body;
}

const vendorSummary = (raw: Json): VendorSummary => ({
	id: raw.id,
	brandName: raw.brand_name,
	firstName: raw.first_name ?? '',
	lastName: raw.last_name ?? '',
	email: raw.email ?? '',
	phone: raw.phone ?? '',
	instagram: raw.instagram ?? '',
	status: raw.status
});

export function fromApiApplication(raw: Json): Application {
	const booth = raw.booth_requirements ?? {};
	return {
		id: raw.id,
		vendorId: raw.vendor,
		status: raw.status,
		source: raw.source ?? '',
		submittedAt: raw.submitted_at,
		submittedBy: user(raw.submitted_by),
		reviewerId: raw.reviewer ?? null,
		category: raw.category ?? '',
		productDescription: raw.product_description ?? '',
		booking: {
			proposedBoothSize: booth.size ?? '',
			needsTent: Boolean(booth.needs_tent),
			requestedWeekends: raw.preferred_market_dates ?? []
		},
		decision: raw.decision ?? '',
		decisionReason: raw.decision_reason ?? '',
		decidedAt: raw.decided_at ?? null
	};
}

export function fromApiTask(raw: Json): Task {
	return {
		id: raw.id,
		vendor: vendorSummary(raw.vendor_detail),
		applicationId: raw.application ?? null,
		title: raw.title,
		taskType: raw.task_type,
		status: raw.status,
		priority: raw.priority,
		owner: user(raw.owner_detail),
		createdBy: user(raw.created_by),
		dueAt: raw.due_at ?? null,
		completedAt: raw.completed_at ?? null,
		description: raw.description ?? '',
		outcome: raw.outcome ?? '',
		notes: raw.notes ?? '',
		attemptCount: raw.attempt_count ?? 0,
		lastAttemptAt: raw.last_attempt_at ?? null,
		callbackAt: raw.callback_at ?? null,
		callDetails: fromApiCallDetails(raw.call_details),
		isOpen: raw.is_open,
		createdAt: raw.created_at
	};
}

const fromApiActivity = (raw: Json): ActivityEvent => ({
	id: raw.id,
	eventType: raw.event_type,
	description: raw.description,
	actor: user(raw.actor),
	createdAt: raw.created_at,
	metadata: raw.metadata ?? {}
});

const fromApiNote = (raw: Json): InternalNote => ({
	id: raw.id,
	noteType: raw.note_type,
	body: raw.body,
	author: user(raw.author),
	createdAt: raw.created_at
});

const mapPage = <T>(page: Page<Json>, map: (raw: Json) => T): Page<T> => ({ ...page, results: page.results.map(map) });

function fromApiDuplicates(raw: Json): DuplicateResult {
	return {
		matches: (raw.matches ?? []).map((m: Json) => ({ vendor: vendorSummary(m.vendor), matchedOn: m.matched_on })),
		nameMatches: (raw.name_matches ?? []).map(vendorSummary)
	};
}

/** Thrown when the API refuses to create a vendor because of matching contact details. */
export class DuplicateVendorError extends Error {
	constructor(
		readonly result: DuplicateResult,
		readonly code: 'possible_duplicate' | 'ambiguous_vendor'
	) {
		super(
			code === 'ambiguous_vendor'
				? 'These contact details match more than one vendor.'
				: 'A vendor with the same email, phone or Instagram already exists.'
		);
	}
}

function rethrowDuplicate(error: unknown): never {
	if (error instanceof ApiError && error.status === 409 && error.body) {
		throw new DuplicateVendorError(fromApiDuplicates(error.body), error.body.code as 'possible_duplicate');
	}
	throw error;
}

// --- Vendors ------------------------------------------------------------------------

export async function listVendors(query: Query = {}): Promise<Page<Vendor>> {
	return mapPage(await request<Page<Json>>('/vendors/', { query }), fromApiVendor);
}

export async function countVendors(query: Query = {}): Promise<number> {
	return (await request<Page<Json>>('/vendors/', { query: { ...query, page_size: 1 } })).count;
}

export async function getVendor(id: string): Promise<Vendor> {
	return fromApiVendor(await request<Json>(`/vendors/${id}/`));
}

export async function createLead(
	input: VendorInput,
	options: { ownerId?: string | null; confirmDuplicate?: boolean } = {}
): Promise<Vendor> {
	try {
		const raw = await request<Json>('/vendors/', {
			method: 'POST',
			json: { ...toApiVendor(input), owner: options.ownerId ?? null, confirm_duplicate: options.confirmDuplicate ?? false }
		});
		return fromApiVendor(raw);
	} catch (error) {
		rethrowDuplicate(error);
	}
}

export async function submitApplication(args: {
	vendorId?: string;
	vendor?: VendorInput;
	booking?: BookingInterest;
	source?: string;
}): Promise<Application> {
	const booking = args.booking ?? emptyBooking();
	try {
		const raw = await request<Json>('/applications/', {
			method: 'POST',
			json: {
				vendor: args.vendorId,
				vendor_data: args.vendor ? toApiVendor(args.vendor) : undefined,
				source: args.source ?? 'Staff entry',
				booth_requirements: { size: booking.proposedBoothSize, needs_tent: booking.needsTent },
				preferred_market_dates: booking.requestedWeekends
			}
		});
		return fromApiApplication(raw);
	} catch (error) {
		rethrowDuplicate(error);
	}
}

export async function updateVendor(id: string, patch: Partial<VendorInput> & { ownerId?: string | null }): Promise<Vendor> {
	const { ownerId, ...fields } = patch;
	const body = toApiVendor(fields);
	if (ownerId !== undefined) body.owner = ownerId;
	return fromApiVendor(await request<Json>(`/vendors/${id}/`, { method: 'PATCH', json: body }));
}

export type SetStatusResult =
	| { ok: true; vendor: Vendor }
	| { ok: false; reason: 'not_found' | 'invalid_transition' | 'forbidden' | 'error'; message: string };

export async function setStatus(id: string, to: VendorStatus, note?: string): Promise<SetStatusResult> {
	try {
		const raw = await request<Json>(`/vendors/${id}/status/`, { method: 'POST', json: { status: to, note: note?.trim() ?? '' } });
		return { ok: true, vendor: fromApiVendor(raw) };
	} catch (error) {
		if (!(error instanceof ApiError)) throw error;
		const reason =
			error.status === 404 ? 'not_found' : error.status === 403 ? 'forbidden' : error.status === 400 ? 'invalid_transition' : 'error';
		return { ok: false, reason, message: error.message };
	}
}

export async function findDuplicates(query: {
	email?: string;
	phone?: string;
	instagram?: string;
	brandName?: string;
	excludeId?: string;
}): Promise<DuplicateResult> {
	const raw = await request<Json>('/vendors/duplicates/', {
		query: {
			email: query.email,
			phone: query.phone,
			instagram: query.instagram,
			brand_name: query.brandName,
			exclude: query.excludeId
		}
	});
	return fromApiDuplicates(raw);
}

export async function listApplications(vendorId: string): Promise<Application[]> {
	const page = await request<Page<Json>>('/applications/', { query: { vendor: vendorId, page_size: 100 } });
	return page.results.map(fromApiApplication);
}

export async function listActivity(vendorId: string, page = 1): Promise<Page<ActivityEvent>> {
	return mapPage(await request<Page<Json>>(`/vendors/${vendorId}/activity/`, { query: { page } }), fromApiActivity);
}

export async function listNotes(vendorId: string): Promise<InternalNote[]> {
	return (await request<Page<Json>>(`/vendors/${vendorId}/notes/`, { query: { page_size: 100 } })).results.map(fromApiNote);
}

export async function addNote(vendorId: string, body: string, noteType: NoteType = 'GENERAL'): Promise<InternalNote> {
	return fromApiNote(await request<Json>(`/vendors/${vendorId}/notes/`, { method: 'POST', json: { body, note_type: noteType } }));
}

// --- Tasks --------------------------------------------------------------------------

export async function listTasks(query: Query = {}): Promise<Page<Task>> {
	return mapPage(await request<Page<Json>>('/tasks/', { query }), fromApiTask);
}

export async function countTasks(query: Query = {}): Promise<number> {
	return (await request<Page<Json>>('/tasks/', { query: { ...query, page_size: 1 } })).count;
}

export async function updateTask(
	id: string,
	patch: Partial<{ status: TaskStatus; ownerId: string | null; notes: string; dueAt: string | null; priority: TaskPriority }>
): Promise<Task> {
	const body: Json = {};
	if (patch.status !== undefined) body.status = patch.status;
	if (patch.ownerId !== undefined) body.owner = patch.ownerId;
	if (patch.notes !== undefined) body.notes = patch.notes;
	if (patch.dueAt !== undefined) body.due_at = patch.dueAt;
	if (patch.priority !== undefined) body.priority = patch.priority;
	return fromApiTask(await request<Json>(`/tasks/${id}/`, { method: 'PATCH', json: body }));
}

export async function logCall(taskId: string, call: CallInput): Promise<Task> {
	if (!call.outcome) throw new Error('Choose a call outcome.');
	const raw = await request<Json>(`/tasks/${taskId}/log-call/`, {
		method: 'POST',
		json: {
			outcome: call.outcome,
			notes: call.notes.trim(),
			callback_at: call.outcome === 'Callback Requested' ? call.callbackAt : null,
			call_details: toApiCallDetails(call.details)
		}
	});
	return fromApiTask(raw);
}

export async function listTeam(): Promise<UserSummary[]> {
	return (await request<Json[]>('/team/')).map((raw) => user(raw)!);
}

// --- CSV import ----------------------------------------------------------------------

export type ImportClassification = 'new' | 'matched' | 'possible_duplicate' | 'invalid' | 'skipped';
export type ImportRow = {
	line: number;
	classification: ImportClassification;
	brandName: string;
	data: Json;
	flags: { already_contacted: boolean; inactive: boolean; exclude_from_outreach: boolean };
	reasons: string[];
	matches: { vendor: { id: string; brand_name: string; status: VendorStatus }; matched_on: string[] }[];
};
export type ImportPreview = { rows: ImportRow[]; counts: Record<ImportClassification, number>; ignoredHeaders: string[] };
export type ImportResult = {
	created: number;
	matched: number;
	skipped: number;
	invalid: number;
	callTasksCreated: number;
	batchId: string;
};

function csvForm(file: File, includeLines: number[] = []) {
	const form = new FormData();
	form.append('file', file);
	for (const line of includeLines) form.append('include_lines', String(line));
	return form;
}

export async function previewImport(file: File): Promise<ImportPreview> {
	const raw = await request<Json>('/imports/vendors/preview/', { method: 'POST', form: csvForm(file) });
	return {
		rows: raw.rows.map((row: Json) => ({ ...row, brandName: row.brand_name })),
		counts: raw.counts,
		ignoredHeaders: raw.ignored_headers
	};
}

export async function confirmImport(file: File, includeLines: number[]): Promise<ImportResult> {
	const raw = await request<Json>('/imports/vendors/confirm/', { method: 'POST', form: csvForm(file, includeLines) });
	return {
		created: raw.created,
		matched: raw.matched,
		skipped: raw.skipped,
		invalid: raw.invalid,
		callTasksCreated: raw.call_tasks_created,
		batchId: raw.batch_id
	};
}
