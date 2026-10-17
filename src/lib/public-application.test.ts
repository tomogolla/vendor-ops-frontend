import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	CONSENT_TEXT_VERSION,
	NOT_SURE,
	emptyForm,
	fromApiCatalog,
	loadCatalog,
	normaliseInstagram,
	phoneDigits,
	readAttribution,
	sizeWaitlisted,
	sizesFor,
	submitApplication,
	toApiApplication,
	validateForm,
	type ApplicationForm
} from '#lib/public-application.ts';
import { TURNSTILE_ACTION, siteKey, widgetOptions } from '#lib/turnstile.ts';
import fixture from '#lib/fixtures/public-application.json';

let calls: { url: string; init: RequestInit }[] = [];
function mockFetch(...responses: ({ status: number; body?: unknown } | Error)[]) {
	calls = [];
	const queue = [...responses];
	const fetcher = vi.fn(async (url: string, init: RequestInit = {}) => {
		calls.push({ url, init });
		const next = queue.shift() ?? { status: 200, body: {} };
		if (next instanceof Error) throw next;
		return new Response(next.body === undefined ? null : JSON.stringify(next.body), { status: next.status });
	});
	vi.stubGlobal('fetch', fetcher);
	return fetcher;
}
afterEach(() => vi.unstubAllGlobals());

const catalog = fromApiCatalog(fixture.weekends);
const [oct, nov] = catalog.weekends;
const filled = (overrides: Partial<ApplicationForm> = {}): ApplicationForm => ({
	...emptyForm(),
	firstName: ' Ana ',
	lastName: 'Silva',
	email: 'ana@example.com ',
	phone: '(555) 123-4567',
	brandName: 'Juniper Goods',
	instagram: '@Juniper.Goods',
	weekendIds: [oct.id],
	boothSize: '8ft x 8ft',
	consent: true,
	...overrides
});

describe('public weekends (captured payload)', () => {
	it('maps weekends and sizes without prices or counts', () => {
		expect(catalog.weekends.map((weekend) => weekend.label)).toEqual(['Oct 17 & 18', 'November 12 & 13']);
		expect(oct.variants[0]).toEqual({ name: '8ft x 8ft', dimensions: '8 x 8 ft', waitlist: false });
		expect(JSON.stringify(fixture.weekends)).not.toMatch(/price|capacity|count|remaining/);
	});

	it('offers only sizes sold on the chosen weekends', () => {
		expect(sizesFor(catalog, []).map((size) => size.name)).toEqual(['8ft x 8ft', '10ft x 10ft', '8 x 8ft']);
		expect(sizesFor(catalog, [oct.id]).map((size) => size.name)).toEqual(['8ft x 8ft', '10ft x 10ft']);
		expect(sizesFor(catalog, [nov.id]).map((size) => size.name)).toEqual(['8 x 8ft']);
	});

	it('marks a size waitlist-only when every chosen weekend has none left', () => {
		const full = { ...catalog, weekends: [{ ...oct, variants: oct.variants.map((variant) => ({ ...variant, waitlist: true })) }, nov] };
		expect(sizeWaitlisted(full, [oct.id], '8ft x 8ft')).toBe(true);
		expect(sizeWaitlisted(catalog, [oct.id], '8ft x 8ft')).toBe(false);
	});
});

describe('form checks before sending', () => {
	it('accepts a complete form', () => {
		expect(validateForm(filled())).toEqual({});
		expect(validateForm(filled({ boothSize: NOT_SURE, instagram: 'https://www.instagram.com/juniper.goods/?hl=en' }))).toEqual({});
	});

	it('flags each missing or malformed answer', () => {
		expect(Object.keys(validateForm(emptyForm())).sort()).toEqual(
			['booth_size', 'brand_name', 'consent', 'email', 'first_name', 'instagram', 'last_name', 'phone', 'weekend_ids'].sort()
		);
		expect(validateForm(filled({ email: 'nope' }))).toHaveProperty('email');
		expect(validateForm(filled({ phone: '12345' }))).toHaveProperty('phone');
		expect(validateForm(filled({ instagram: 'bad handle!' }))).toHaveProperty('instagram');
		expect(validateForm(filled({ weekendIds: Array.from({ length: 13 }, (_, i) => `w${i}`) }))).toHaveProperty('weekend_ids');
	});

	it('normalises Instagram and phone the way the server does', () => {
		expect(normaliseInstagram('  @Juniper.Goods ')).toBe('juniper.goods');
		expect(normaliseInstagram('instagram.com/juniper.goods/')).toBe('juniper.goods');
		expect(phoneDigits('+1 (555) 123-4567')).toBe('5551234567');
	});
});

describe('submission', () => {
	const attribution = readAttribution(new URL('https://ops.thegoodflea.com/apply?utm_campaign=fall-ads&gclid=g1&other=x'), 'https://www.instagram.com/');

	it('collects attribution, never anything else', () => {
		expect(attribution).toEqual({ utm_campaign: 'fall-ads', gclid: 'g1', referrer: 'https://www.instagram.com/', landing_path: '/apply' });
	});

	it('posts the token, the honeypot and the answers to the public endpoint only, without cookies or CSRF', async () => {
		const fetcher = mockFetch({ status: 200, body: fixture.received });
		const outcome = await submitApplication(toApiApplication(filled(), 'XXXX.DUMMY.TOKEN.XXXX', attribution));
		expect(outcome).toEqual({ kind: 'received' });
		expect(fetcher).toHaveBeenCalledTimes(1);
		const { url, init } = calls[0];
		expect(url).toBe('/api/v1/public/applications/');
		expect(init.method).toBe('POST');
		expect(init.credentials).toBe('omit');
		expect(init.headers).not.toHaveProperty('X-CSRFToken');
		expect(JSON.parse(String(init.body))).toEqual({
			first_name: 'Ana', last_name: 'Silva', email: 'ana@example.com', phone: '(555) 123-4567', brand_name: 'Juniper Goods',
			instagram: '@Juniper.Goods', weekend_ids: [oct.id], booth_size: '8ft x 8ft', consent: true,
			consent_text_version: CONSENT_TEXT_VERSION, turnstile_token: 'XXXX.DUMMY.TOKEN.XXXX', website: '', attribution
		});
	});

	it('shows the server field errors', async () => {
		mockFetch({ status: 400, body: fixture.validation_error });
		const outcome = await submitApplication({});
		expect(outcome.kind).toBe('invalid');
		if (outcome.kind !== 'invalid') return;
		expect(outcome.fields).toEqual({
			email: 'Enter a valid email address.',
			instagram: 'Enter your Instagram handle (letters, numbers, dots and underscores, up to 30 characters) or profile link.',
			weekend_ids: 'This list may not be empty.',
			consent: 'Please agree to be contacted about your application.'
		});
	});

	it('tells failed verification, limits, outages, closure and network problems apart', async () => {
		mockFetch(
			{ status: fixture.not_verified.status, body: fixture.not_verified.body },
			{ status: fixture.email_limit.status, body: fixture.email_limit.body },
			{ status: 429, body: { detail: 'Request was throttled. Expected available in 3599 seconds.' } },
			{ status: fixture.unavailable.status, body: fixture.unavailable.body },
			{ status: 404, body: fixture.closed.body },
			new TypeError('Failed to fetch')
		);
		expect(await submitApplication({})).toEqual({ kind: 'not_verified', message: fixture.not_verified.body.detail });
		expect(await submitApplication({})).toEqual({ kind: 'limited', message: fixture.email_limit.body.detail });
		expect(await submitApplication({})).toEqual({ kind: 'limited', message: 'Too many attempts from your connection. Please wait a little and try again.' });
		expect(await submitApplication({})).toEqual({ kind: 'unavailable', message: fixture.unavailable.body.detail });
		expect((await submitApplication({})).kind).toBe('closed');
		expect((await submitApplication({})).kind).toBe('network');
	});

	it('loads weekends without cookies and reports a closed form', async () => {
		mockFetch({ status: 200, body: fixture.weekends }, { status: 404, body: fixture.closed.body }, { status: 500 });
		const open = await loadCatalog();
		expect(calls[0].url).toBe('/api/v1/public/market-weekends/');
		expect(calls[0].init.credentials).toBe('omit');
		expect(open.kind === 'open' && open.catalog.weekends).toHaveLength(2);
		expect(await loadCatalog()).toEqual({ kind: 'closed' });
		expect((await loadCatalog()).kind).toBe('error');
	});
});

describe('Turnstile', () => {
	it('uses the site key from the build and treats placeholders as missing', () => {
		expect(siteKey('1x00000000000000000000AA')).toBe('1x00000000000000000000AA');
		expect(siteKey('your_site_key')).toBeNull();
		expect(siteKey('')).toBeNull();
		expect(siteKey(undefined)).toBeNull();
	});

	it('renders with the apply action and clears the token when it expires or fails', () => {
		const tokens: (string | null)[] = [];
		const problems: string[] = [];
		const options = widgetOptions('1x00000000000000000000AA', (token) => tokens.push(token), (message) => problems.push(message));
		expect(options).toMatchObject({ sitekey: '1x00000000000000000000AA', action: TURNSTILE_ACTION, appearance: 'always', 'response-field': false });
		expect(TURNSTILE_ACTION).toBe('apply');
		options.callback('XXXX.DUMMY.TOKEN.XXXX');
		options['expired-callback']();
		options['timeout-callback']();
		expect(options['error-callback']()).toBe(true);
		expect(tokens).toEqual(['XXXX.DUMMY.TOKEN.XXXX', null, null, null]);
		expect(problems).toHaveLength(1);
	});
});
