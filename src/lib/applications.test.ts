import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '#lib/api.ts';
import {
	availableLineActions,
	availableStageActions,
	bookingsByWeekend,
	createApplication,
	daysInStage,
	decideLine,
	describeDiscount,
	discountFromInput,
	filtersFromParams,
	filtersHref,
	filtersToQuery,
	fromApiApplication,
	fromApiSubmission,
	fromApiSummary,
	groupByStage,
	linesInOrder,
	orderLinesFromDrafts,
	submissionOutcome,
	totalsRows,
	weekendRoster,
	type Application,
	type ApplicationLine,
	type LineStatus,
	type OrderLineDraft,
	type Stage
} from '#lib/applications.ts';
import { formatMoney, parseDollars } from '#lib/format.ts';
import { fromApiVendor } from '#lib/vendor-store.ts';
import bundledFixture from '#lib/fixtures/application-bundled.json';
import waitlistedFixture from '#lib/fixtures/application-waitlisted.json';
import wonFixture from '#lib/fixtures/application-won.json';
import errorsFixture from '#lib/fixtures/errors.json';
import pageFixture from '#lib/fixtures/applications-page.json';
import summaryFixture from '#lib/fixtures/summary.json';
import vendorFixture from '#lib/fixtures/vendor-active.json';

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
beforeEach(() => vi.stubGlobal('document', { cookie: 'csrftoken=test-token' }));
afterEach(() => vi.unstubAllGlobals());

const won = fromApiApplication(wonFixture);
const waitlisted = fromApiApplication(waitlistedFixture);

describe('application mapping (captured payloads)', () => {
	it('maps an application with lines, discount and server totals', () => {
		expect(won).toMatchObject({
			vendorBrand: 'Acme Corporation',
			vendorLabel: 'active',
			stage: 'WON',
			source: 'Staff entry',
			callAttempts: 1,
			hasWaitlistedLines: false,
			callExhausted: false,
			discount: { type: 'PERCENT', value: '10.00', label: 'New Vendor Trial' },
			totals: {
				currency: 'USD',
				requestedTotalCents: 34000,
				confirmedSubtotalCents: 34000,
				discountCents: 3400,
				confirmedTotalCents: 30600
			}
		});
		expect(won.firstPaidAt).not.toBeNull();
		expect(won.vendor).toMatchObject({ brandName: 'Acme Corporation', email: 'cy@acme.example.com' });
	});

	it('maps booth and add-on lines', () => {
		const [booth, tent] = won.lines;
		expect(booth).toMatchObject({
			kind: 'booth',
			productName: '8ft x 8ft',
			quantity: 2,
			unitPriceCents: 15000,
			totalCents: 30000,
			status: 'CONFIRMED',
			parentLineId: null,
			weekend: { label: 'Oct 10 & 11', startDate: '2026-10-10' }
		});
		expect(tent).toMatchObject({ kind: 'add_on', productName: 'Tent rental', parentLineId: booth.id, variantId: null });
	});

	it('lists each booth line followed by its add-ons', () => {
		const [tent, booth] = [won.lines[1], won.lines[0]];
		expect(linesInOrder([tent, booth]).map((row) => [row.line.productName, row.parent?.id ?? null])).toEqual([
			['8ft x 8ft', null],
			['Tent rental', booth.id]
		]);
	});

	it('maps waitlisted lines and the flag', () => {
		expect(waitlisted.hasWaitlistedLines).toBe(true);
		expect(waitlisted.lines[0]).toMatchObject({ status: 'WAITLISTED', statusReason: 'Weekend full' });
		expect(waitlisted.lines[0].waitlistedAt).not.toBeNull();
	});

	it('maps the summary', () => {
		const summary = fromApiSummary(summaryFixture);
		expect(summary.stages).toEqual(summaryFixture.stages);
		expect(summary.oldestAwaitingPayment[0]).toMatchObject({ brandName: 'Wayne Enterprises', daysSinceBilled: 0 });
	});

	it('maps the vendor label', () => {
		expect(fromApiVendor(vendorFixture)).toMatchObject({ label: 'active', brandName: 'Acme Corporation' });
	});
});

describe('board grouping and days in stage', () => {
	const applications = pageFixture.results.map(fromApiApplication);

	it('groups every application under its stage, keeping order', () => {
		const groups = groupByStage(applications);
		const total = Object.values(groups).reduce((sum, group) => sum + group.length, 0);
		expect(total).toBe(applications.length);
		expect(groups.WON.map((a) => a.vendorBrand)).toEqual(['Stark Industries', 'Acme Corporation']);
		expect(groups.AWAITING_PAYMENT.map((a) => a.vendorBrand)).toEqual(['Wayne Enterprises']);
		expect(groups.DECLINED).toHaveLength(1);
		expect(groups.WITHDRAWN).toHaveLength(1);
	});

	it('groups confirmed lines into bookings by weekend', () => {
		const groups = bookingsByWeekend(applications);
		expect(groups.map((group) => group.weekend.label)).toEqual(['Oct 10 & 11', 'Oct 17 & 18']);
		const oct10 = groups[0].bookings.map((booking) => `${booking.line.productName} ${booking.application.stage}`);
		expect(oct10).toEqual(expect.arrayContaining(['10ft x 10ft AWAITING_PAYMENT', '8ft x 8ft WON', 'Tent rental WON']));
		expect(groups.flatMap((group) => group.bookings).every((booking) => booking.line.status === 'CONFIRMED')).toBe(true);
	});

	it('builds a weekend roster of booked and waitlisted lines', () => {
		const oct10 = won.lines[0].weekend.id;
		const { booked, waitlist } = weekendRoster(applications, oct10);
		expect(booked.map((row) => `${row.application.vendorBrand}: ${row.line.productName}`)).toEqual([
			'Acme Corporation: 8ft x 8ft',
			'Acme Corporation: Tent rental',
			'Wayne Enterprises: 10ft x 10ft'
		]);
		expect(waitlist.map((row) => row.application.vendorBrand)).toEqual(['Second Spin Records']);
		expect(booked[0].application.firstPaidAt).not.toBeNull();
		expect(weekendRoster(applications, 'unknown')).toEqual({ booked: [], waitlist: [] });
	});

	it('counts whole days in stage', () => {
		const entered = { stageEnteredAt: '2026-10-10T12:00:00Z' };
		expect(daysInStage(entered, new Date('2026-10-10T23:00:00Z'))).toBe(0);
		expect(daysInStage(entered, new Date('2026-10-11T12:00:00Z'))).toBe(1);
		expect(daysInStage(entered, new Date('2026-10-14T11:59:00Z'))).toBe(3);
		expect(daysInStage(entered, new Date('2026-10-01T00:00:00Z'))).toBe(0);
		expect(daysInStage({ stageEnteredAt: null })).toBeNull();
	});
});

describe('order form', () => {
	const draft = (key: string, patch: Partial<OrderLineDraft> = {}): OrderLineDraft => ({
		key, weekendId: 'w1', variantId: 'v1', quantity: 1, addOnIds: [], ...patch
	});

	it('builds order lines with add-ons attached to their booth', () => {
		const result = orderLinesFromDrafts([draft('a', { quantity: 2, addOnIds: ['tent'] }), draft('b', { variantId: 'v2' })]);
		expect(result.errors).toEqual({});
		expect(result.lines).toEqual([
			{ variantId: 'v1', quantity: 2, addOns: [{ addOnId: 'tent', quantity: 1 }] },
			{ variantId: 'v2', quantity: 1, addOns: [] }
		]);
	});

	it('reports incomplete rows, bad quantities and duplicate booths', () => {
		const { errors, lines } = orderLinesFromDrafts([
			draft('a'), draft('b', { variantId: '' }), draft('c', { quantity: 0 }), draft('d', { quantity: 1.5 }), draft('e')
		]);
		expect(Object.keys(errors)).toEqual(['b', 'c', 'd', 'e']);
		expect(errors.e).toMatch(/already in the order/);
		expect(lines).toHaveLength(1);
	});

	it('turns discount inputs into API values', () => {
		expect(discountFromInput('PERCENT', '12.5', ' New Vendor Trial ', parseDollars)).toEqual({
			discount: { type: 'PERCENT', value: '12.5', label: 'New Vendor Trial' }
		});
		expect(discountFromInput('FIXED', '$25.50', '', parseDollars)).toEqual({ discount: { type: 'FIXED', value: '2550', label: '' } });
		expect(discountFromInput('NONE', 'x', 'y', parseDollars)).toEqual({ discount: { type: 'NONE', value: '0', label: '' } });
		expect(discountFromInput('PERCENT', '101', '', parseDollars)).toHaveProperty('error');
		expect(discountFromInput('PERCENT', '-1', '', parseDollars)).toHaveProperty('error');
		expect(discountFromInput('FIXED', 'ten', '', parseDollars)).toHaveProperty('error');
	});
});

describe('board filters', () => {
	it('reads filters from the query string, ignoring unknown values', () => {
		expect(filtersFromParams(new URLSearchParams('source=CSV+import&owner=me&waitlisted=1&call=none'))).toEqual({
			source: 'CSV import',
			owner: 'me',
			waitlisted: true,
			call: 'none'
		});
		expect(filtersFromParams(new URLSearchParams('owner=bob&call=sometimes'))).toEqual({
			source: '',
			owner: '',
			waitlisted: false,
			call: ''
		});
	});

	it('maps filters to the API and reports what the API cannot filter', () => {
		const filters = { source: 'Staff entry', owner: 'none' as const, waitlisted: true, call: 'attempted_not_reached' as const };
		expect(filtersToQuery(filters)).toEqual({
			query: { source: 'Staff entry', owner: 'none', has_waitlisted_lines: true, call: 'attempted_not_reached' },
			unsupported: []
		});
		const exhausted = filtersToQuery({ source: '', owner: '', waitlisted: false, call: 'exhausted' });
		expect(exhausted.query.call).toBeUndefined();
		expect(exhausted.unsupported).toEqual(['Call exhausted']);
	});

	it('builds linkable hrefs that keep the view and reset paging', () => {
		const base = new URLSearchParams('view=table&page=3&owner=me');
		expect(filtersHref(base, { source: '', owner: '', waitlisted: true, call: '' })).toBe('/applications?view=table&waitlisted=1');
		expect(filtersHref(new URLSearchParams(), { source: '', owner: '', waitlisted: false, call: '' })).toBe('/applications');
	});
});

describe('stage actions', () => {
	const at = (stage: Stage, lines: Pick<ApplicationLine, 'status'>[] = []) =>
		({ stage, lines }) as unknown as Application;
	const keys = (stage: Stage, lines: Pick<ApplicationLine, 'status'>[] = []) =>
		availableStageActions(at(stage, lines), true).map((action) => action.key);

	it('gives team members no stage actions', () => {
		for (const stage of ['NEW', 'IN_REVIEW', 'AWAITING_PAYMENT', 'WON', 'DECLINED', 'WITHDRAWN'] as Stage[]) {
			expect(availableStageActions(at(stage), false)).toEqual([]);
		}
	});

	it('follows the stage rules for administrators', () => {
		expect(keys('NEW')).toEqual(['start_review', 'decline', 'withdraw']);
		expect(keys('IN_REVIEW')).toEqual(['mark_billed', 'decline', 'withdraw']);
		expect(keys('AWAITING_PAYMENT')).toEqual(['mark_first_payment']);
		expect(keys('WON')).toEqual([]);
		expect(keys('DECLINED')).toEqual(['reopen']);
		expect(keys('WITHDRAWN')).toEqual(['reopen']);
	});

	it('only enables Mark billed with a confirmed line, and labels billing as interim', () => {
		const [billed] = availableStageActions(at('IN_REVIEW', [{ status: 'WAITLISTED' }]), true);
		expect(billed.disabledReason).toMatch(/Confirm at least one line/);
		const [ready] = availableStageActions(at('IN_REVIEW', [{ status: 'CONFIRMED' }]), true);
		expect(ready.disabledReason).toBeUndefined();
		expect(ready.interim).toBe(true);
		expect(availableStageActions(at('AWAITING_PAYMENT'), true)[0]).toMatchObject({ interim: true, input: 'note' });
	});
});

describe('line actions', () => {
	const keys = (status: LineStatus, isAdmin: boolean, paid = false, context = {}) =>
		availableLineActions({ status, kind: 'booth' }, isAdmin, paid, context).map((action) => action.key);

	it('lets team members edit and remove only requested lines', () => {
		expect(keys('REQUESTED', false)).toEqual(['edit', 'delete']);
		for (const status of ['CONFIRMED', 'WAITLISTED', 'DECLINED', 'CANCELLED'] as LineStatus[]) {
			expect(keys(status, false)).toEqual([]);
		}
	});

	it('gives administrators the decisions the transition map allows', () => {
		expect(keys('REQUESTED', true)).toEqual(['edit', 'delete', 'confirm', 'waitlist', 'decline']);
		expect(keys('WAITLISTED', true)).toEqual(['confirm', 'decline']);
		expect(keys('CONFIRMED', true)).toEqual(['release']);
		expect(keys('DECLINED', true)).toEqual([]);
		expect(keys('CANCELLED', true)).toEqual([]);
	});

	it('requires a reason to release and blocks release after first payment', () => {
		const [release] = availableLineActions({ status: 'CONFIRMED', kind: 'booth' }, true, false);
		expect(release).toMatchObject({ key: 'release', reason: 'required' });
		expect(release.disabledReason).toBeUndefined();
		const [paid] = availableLineActions({ status: 'CONFIRMED', kind: 'booth' }, true, true);
		expect(paid.disabledReason).toMatch(/paid/);
	});

	it('respects the application stage and the parent booth line', () => {
		expect(keys('REQUESTED', true, false, { stage: 'DECLINED' })).toEqual([]);
		expect(keys('REQUESTED', false, false, { stage: 'AWAITING_PAYMENT' })).toEqual([]);
		expect(keys('REQUESTED', true, false, { stage: 'AWAITING_PAYMENT' })).toEqual(['confirm', 'waitlist', 'decline']);
		const addOn = availableLineActions({ status: 'REQUESTED', kind: 'add_on' }, true, false, { parentStatus: 'REQUESTED' });
		expect(addOn.find((action) => action.key === 'confirm')?.disabledReason).toMatch(/booth line/);
	});
});

describe('totals display', () => {
	it('uses the server figures and shows the discount row with its label', () => {
		expect(totalsRows(won)).toEqual([
			{ key: 'requestedTotalCents', label: 'Requested total', cents: 34000 },
			{ key: 'confirmedSubtotalCents', label: 'Confirmed subtotal', cents: 34000 },
			{ key: 'discountCents', label: 'Discount (New Vendor Trial)', cents: 3400, negative: true },
			{ key: 'confirmedTotalCents', label: 'Confirmed total', cents: 30600, emphasis: true }
		]);
		expect(totalsRows(waitlisted).map((row) => row.key)).not.toContain('discountCents');
	});

	it('describes discounts', () => {
		expect(describeDiscount(won.discount, formatMoney)).toBe('10% · New Vendor Trial');
		expect(describeDiscount({ type: 'FIXED', value: '2500.00', label: '' }, formatMoney)).toBe('$25.00 off');
		expect(describeDiscount({ type: 'NONE', value: '0.00', label: '' }, formatMoney)).toBe('No discount');
	});
});

describe('submissions and bundling', () => {
	it('recognises a bundled response and points at the open application with a notice', () => {
		const submission = fromApiSubmission(bundledFixture);
		expect(submission.bundled).toBe(true);
		const outcome = submissionOutcome(submission);
		expect(outcome.href).toBe(`/applications/${bundledFixture.id}?bundled=1`);
		expect(outcome.notice).toMatch(/Moss & Thread already had an open application/);
	});

	it('treats a new application as not bundled', () => {
		const outcome = submissionOutcome({ application: won, bundled: false });
		expect(outcome).toEqual({ href: `/applications/${won.id}`, notice: null });
	});

	it('posts vendor data, notes and order lines in the API shape', async () => {
		mockFetch({ status: 200, body: bundledFixture });
		const result = await createApplication({
			vendorId: 'v1',
			notes: '  Also November ',
			lines: [{ variantId: 'var1', quantity: 2, addOns: [{ addOnId: 'tent', quantity: 1 }] }]
		});
		expect(result.bundled).toBe(true);
		expect(calls[0].url).toBe('/api/v1/applications/');
		expect(JSON.parse(calls[0].init.body as string)).toEqual({
			vendor: 'v1',
			source: 'Staff entry',
			notes: 'Also November',
			requested_lines: [{ variant: 'var1', quantity: 2, add_ons: [{ add_on: 'tent', quantity: 1 }] }]
		});
	});
});

describe('line decisions', () => {
	it('surfaces the capacity refusal with the remaining number', async () => {
		mockFetch({ status: 400, body: errorsFixture.capacity_refused });
		const error = await decideLine('l1', 'confirm').catch((e) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect(error.message).toBe('Only 0 of 8ft x 8ft left for Oct 10 & 11; this line needs 1. Waitlist it instead.');
		expect(calls[0].url).toBe('/api/v1/application-lines/l1/confirm/');
	});

	it('sends the reason for releases and shows a refusal for team members', async () => {
		mockFetch({ status: 403, body: errorsFixture.member_forbidden });
		const error = await decideLine('l1', 'release', '  Vendor cancelled ').catch((e) => e);
		expect(JSON.parse(calls[0].init.body as string)).toEqual({ reason: 'Vendor cancelled' });
		expect(error.message).toBe('Only administrators can do this.');
	});
});
