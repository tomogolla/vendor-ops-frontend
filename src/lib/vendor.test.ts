import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request, setUnauthorizedHandler, withQuery } from '#lib/api.ts';
import {
	canChangeStatus,
	createLead,
	DuplicateVendorError,
	emptyCallInput,
	emptyVendorInput,
	fromApiVendor,
	logCall,
	setStatus,
	statusTransitions,
	toApiVendor,
	vendorStatuses,
	type VendorStatus
} from '#lib/vendor-store.ts';
import { callErrors, isIncomplete, validateVendor } from '#lib/vendor-validation.ts';

type Call = { url: string; init: RequestInit };
let calls: Call[] = [];

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

beforeEach(() => vi.stubGlobal('document', { cookie: 'csrftoken=test-token' }));
afterEach(() => {
	vi.unstubAllGlobals();
	setUnauthorizedHandler(null);
});

const apiVendor = {
	id: 'v1',
	created_at: '2026-10-12T10:00:00Z',
	updated_at: '2026-10-12T10:00:00Z',
	status: 'lead',
	journey_stage: 'LEAD',
	qualification_status: 'NOT_ASSESSED',
	application_status_summary: '',
	is_active: true,
	outreach_opt_out: false,
	owner_detail: { id: 'u1', username: 'wambui', name: 'Wambui K', role: 'TEAM_MEMBER' },
	created_by: null,
	brand_name: 'Moss & Thread',
	first_name: '',
	last_name: '',
	email: '',
	phone: '',
	instagram: '@moss',
	website: '',
	category: '',
	description: 'Hand-dyed yarn',
	objectives: '',
	commitment_level: '',
	other_markets: '',
	business_registration: 'Not answered',
	liability_insurance: 'Not answered',
	lead_source: 'Instagram',
	source_details: '',
	tags: ['New'],
	notes: '',
	call: {
		open_task_id: 't1',
		open_task_status: 'TODO',
		due_at: '2026-10-12T12:00:00Z',
		owner_id: 'u1',
		never_called: true,
		last_outcome: '',
		last_called_at: null,
		attempt_count: 0,
		call_details: {}
	}
};

describe('status rules', () => {
	it('matches the backend transition map', () => {
		expect(statusTransitions).toEqual({
			lead: ['applied', 'in_review', 'declined'],
			applied: ['in_review', 'declined'],
			in_review: ['approved', 'waitlisted', 'declined'],
			waitlisted: ['in_review', 'approved', 'declined'],
			approved: ['suspended'],
			suspended: ['approved'],
			declined: ['in_review']
		});
	});

	it('lets team members only turn leads into applications', () => {
		expect(canChangeStatus(false, 'lead', 'applied')).toBe(true);
		expect(canChangeStatus(false, 'lead', 'declined')).toBe(false);
		expect(canChangeStatus(false, 'in_review', 'approved')).toBe(false);
		expect(canChangeStatus(true, 'in_review', 'approved')).toBe(true);
		for (const status of vendorStatuses) expect(canChangeStatus(true, status, status)).toBe(false);
	});
});

describe('validation by status', () => {
	const lead = { ...emptyVendorInput(), brandName: 'Moss', instagram: '@moss' };

	it('accepts a lead with brand name and one contact channel', () => {
		expect(validateVendor(lead, 'lead')).toEqual({});
		expect(validateVendor({ ...lead, instagram: '' }, 'lead')).toHaveProperty('contact');
	});

	it.each<VendorStatus>(['applied', 'in_review', 'approved'])('requires full details once %s', (status) => {
		expect(Object.keys(validateVendor(lead, status)).sort()).toEqual(['category', 'email', 'firstName', 'lastName', 'phone']);
	});

	it('flags incomplete vendors from API data', () => {
		const vendor = fromApiVendor(apiVendor);
		expect(isIncomplete(vendor)).toBe(false);
		expect(isIncomplete({ ...vendor, status: 'applied' })).toBe(true);
	});

	it('validates call input', () => {
		const call = emptyCallInput();
		expect(callErrors(call)).toEqual({});
		expect(callErrors(call, { requireOutcome: true })).toHaveProperty('outcome');
		expect(callErrors({ ...call, outcome: 'Callback Requested' })).toHaveProperty('callbackAt');
		expect(callErrors({ ...call, details: { ...call.details, interestLevel: 7 } })).toHaveProperty('interestLevel');
	});
});

describe('API mapping', () => {
	it('maps API vendors to UI vendors', () => {
		const vendor = fromApiVendor(apiVendor);
		expect(vendor).toMatchObject({
			id: 'v1',
			brandName: 'Moss & Thread',
			aboutBrand: 'Hand-dyed yarn',
			status: 'lead',
			owner: { name: 'Wambui K' },
			call: { openTaskId: 't1', neverCalled: true, attemptCount: 0 }
		});
		expect(vendor.call.details.interestLevel).toBeNull();
	});

	it('maps UI input to API fields and trims strings', () => {
		expect(toApiVendor({ brandName: ' Moss ', aboutBrand: 'Yarn', tags: ['a'] })).toEqual({
			brand_name: 'Moss',
			description: 'Yarn',
			tags: ['a']
		});
	});

	it('builds query strings without empty values', () => {
		expect(withQuery('/vendors/', { status: 'lead,applied', owner: '', page: 2, call: undefined })).toBe(
			'/vendors/?status=lead%2Capplied&page=2'
		);
	});
});

describe('API client', () => {
	it('sends the CSRF token and JSON body on writes', async () => {
		mockFetch({ status: 201, body: apiVendor });
		await createLead({ ...emptyVendorInput(), brandName: 'Moss', instagram: '@moss' });
		const [call] = calls;
		expect(call.url).toBe('/api/v1/vendors/');
		expect(call.init.method).toBe('POST');
		expect((call.init.headers as Record<string, string>)['X-CSRFToken']).toBe('test-token');
		expect(call.init.credentials).toBe('include');
		expect(JSON.parse(call.init.body as string)).toMatchObject({ brand_name: 'Moss', confirm_duplicate: false });
	});

	it('turns a 409 into a DuplicateVendorError with matches', async () => {
		mockFetch({
			status: 409,
			body: {
				code: 'possible_duplicate',
				matches: [{ vendor: { id: 'v9', brand_name: 'Acme', status: 'lead' }, matched_on: ['email'] }],
				name_matches: []
			}
		});
		const error = await createLead({ ...emptyVendorInput(), brandName: 'X', email: 'a@b.co' }).catch((e) => e);
		expect(error).toBeInstanceOf(DuplicateVendorError);
		expect(error.result.matches[0]).toMatchObject({ vendor: { id: 'v9', brandName: 'Acme' }, matchedOn: ['email'] });
	});

	it('reports a forbidden status change without throwing', async () => {
		mockFetch({ status: 403, body: { detail: 'Only administrators can change vendor status.' } });
		const result = await setStatus('v1', 'approved');
		expect(result).toEqual({ ok: false, reason: 'forbidden', message: 'Only administrators can change vendor status.' });
	});

	it('calls the unauthorized handler on 401', async () => {
		const handler = vi.fn();
		setUnauthorizedHandler(handler);
		mockFetch({ status: 401, body: { detail: 'Authentication credentials were not provided.' } });
		await expect(request('/vendors/')).rejects.toBeInstanceOf(ApiError);
		expect(handler).toHaveBeenCalledOnce();
	});

	it('exposes DRF field errors', () => {
		const error = new ApiError(400, { email: ['Enter a valid email address.'], detail: 'x' });
		expect(error.fieldErrors).toEqual({ email: 'Enter a valid email address.' });
	});

	it('logs a call with snake_case details and only sends callback time for callbacks', async () => {
		mockFetch({ status: 200, body: { id: 't1', vendor_detail: { id: 'v1', brand_name: 'Moss', status: 'lead' }, call_details: {}, is_open: false } });
		const call = { ...emptyCallInput(), outcome: 'Interested' as const, callbackAt: '2030-01-01T00:00:00Z' };
		call.details.challenges = '  parking ';
		await logCall('t1', call);
		const body = JSON.parse(calls[0].init.body as string);
		expect(calls[0].url).toBe('/api/v1/tasks/t1/log-call/');
		expect(body).toMatchObject({ outcome: 'Interested', callback_at: null, call_details: { challenges: 'parking' } });
	});
});
