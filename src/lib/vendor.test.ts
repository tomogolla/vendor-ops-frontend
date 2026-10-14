import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request, setUnauthorizedHandler, withQuery } from '#lib/api.ts';
import { createApplication } from '#lib/applications.ts';
import {
	DuplicateVendorError,
	emptyCallInput,
	emptyVendorInput,
	fromApiImportResult,
	fromApiVendor,
	logCall,
	setStatus,
	toApiVendor,
	type VendorInput,
	type VendorStatus
} from '#lib/vendor-store.ts';
import { callErrors, isIncomplete, validateVendor } from '#lib/vendor-validation.ts';
import importConfirmFixture from '#lib/fixtures/import-confirm.json';
import wonFixture from '#lib/fixtures/application-won.json';

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

// Changed in v1.3: the vendor-level status machine (statusTransitions, canChangeStatus) is gone; the
// pipeline stage lives on the application. Vendor status is only used for suspend and reinstate.
describe('vendor account status', () => {
	it('suspends and reinstates through the legacy status endpoint', async () => {
		mockFetch({ status: 200, body: { ...apiVendor, status: 'suspended', label: 'suspended' } });
		const result = await setStatus('v1', 'suspended', '  Late payments ');
		expect(calls[0].url).toBe('/api/v1/vendors/v1/status/');
		expect(JSON.parse(calls[0].init.body as string)).toEqual({ status: 'suspended', note: 'Late payments' });
		expect(result).toMatchObject({ ok: true, vendor: { label: 'suspended' } });
	});
});

describe('validation by status', () => {
	const lead = { ...emptyVendorInput(), brandName: 'Moss', instagram: '@moss' };

	it('accepts a lead with brand name and one contact channel', () => {
		expect(validateVendor(lead, 'lead')).toEqual({});
		expect(validateVendor({ ...lead, instagram: '' }, 'lead')).toHaveProperty('contact');
	});

	it.each<VendorStatus>(['applied', 'in_review', 'approved'])('only adds category as a requirement once %s', (status) => {
		expect(validateVendor(lead, status)).toEqual({ category: 'Category is required.' });
	});

	it('keeps names, email and phone optional after a lead progresses', () => {
		const vendor: VendorInput = { ...lead, category: 'Plants', firstName: '', lastName: '', email: '', phone: '' };
		expect(validateVendor(vendor, 'approved')).toEqual({});
	});

	it('validates optional email and phone only when values are supplied', () => {
		const vendor: VendorInput = { ...lead, category: 'Plants', email: 'not-an-email', phone: '123' };
		expect(validateVendor(vendor, 'applied')).toMatchObject({
			email: 'Enter a valid email address.',
			phone: 'Enter a valid phone number (at least 7 digits).'
		});
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

describe('CSV import result', () => {
	it('maps the confirm response (captured payload)', () => {
		expect(fromApiImportResult(importConfirmFixture)).toEqual({
			created: 1,
			matched: 1,
			skipped: 0,
			invalid: 0,
			callTasksCreated: 1,
			applicationsCreated: 2,
			applicationsBundled: 0,
			vendorIds: importConfirmFixture.vendor_ids,
			batchId: importConfirmFixture.batch_id
		});
	});
});

describe('API client', () => {
	// Changed in v1.3: createLead (POST /vendors/) is gone from the UI; every entry is an application.
	it('sends the CSRF token and JSON body on writes', async () => {
		mockFetch({ status: 201, body: wonFixture });
		await createApplication({ vendor: { ...emptyVendorInput(), brandName: ' Moss ', instagram: '@moss' } });
		const [call] = calls;
		expect(call.url).toBe('/api/v1/applications/');
		expect(call.init.method).toBe('POST');
		expect((call.init.headers as Record<string, string>)['X-CSRFToken']).toBe('test-token');
		expect(call.init.credentials).toBe('include');
		expect(JSON.parse(call.init.body as string)).toMatchObject({ vendor_data: { brand_name: 'Moss', instagram: '@moss' } });
	});

	it('turns a 409 into a DuplicateVendorError with matches', async () => {
		mockFetch({
			status: 409,
			body: {
				code: 'ambiguous_vendor',
				matches: [{ vendor: { id: 'v9', brand_name: 'Acme', status: 'lead' }, matched_on: ['email'] }],
				name_matches: []
			}
		});
		const error = await createApplication({ vendor: { ...emptyVendorInput(), brandName: 'X', email: 'a@b.co' } }).catch((e) => e);
		expect(error).toBeInstanceOf(DuplicateVendorError);
		expect(error.code).toBe('ambiguous_vendor');
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
