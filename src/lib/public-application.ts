// The public vendor application form (/apply). It talks ONLY to /api/v1/public/ (no login): requests
// carry no cookies and no CSRF token, so the staff API is never used from this page. Django validates
// everything again, verifies the Turnstile token and decides what happens; the rules here only help
// the applicant before they send.
import { API_BASE, withQuery } from '#lib/api.ts';

// --- Weekends ---------------------------------------------------------------------------------------

export type PublicVariant = { name: string; dimensions: string; waitlist: boolean };
export type PublicWeekend = {
	id: string;
	label: string;
	startDate: string;
	endDate: string;
	variants: PublicVariant[];
	waitlistOnly: boolean;
};
export type BoothSize = { name: string; dimensions: string };
export type PublicCatalog = { weekends: PublicWeekend[]; boothSizes: BoothSize[] };

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export const fromApiCatalog = (raw: Json): PublicCatalog => ({
	weekends: (raw.weekends ?? []).map((weekend: Json) => ({
		id: weekend.id,
		label: weekend.label,
		startDate: weekend.start_date,
		endDate: weekend.end_date,
		variants: (weekend.variants ?? []).map((variant: Json) => ({
			name: variant.name,
			dimensions: variant.dimensions ?? '',
			waitlist: Boolean(variant.waitlist)
		})),
		waitlistOnly: Boolean(weekend.waitlist_only)
	})),
	boothSizes: (raw.booth_sizes ?? []).map((size: Json) => ({ name: size.name, dimensions: size.dimensions ?? '' }))
});

export const NOT_SURE = 'not_sure';
export const MAX_WEEKENDS = 12;

/** Sizes offered on at least one chosen weekend (all sizes before any weekend is chosen). */
export function sizesFor(catalog: PublicCatalog, weekendIds: readonly string[]): BoothSize[] {
	if (!weekendIds.length) return catalog.boothSizes;
	const offered = new Set(catalog.weekends.filter((weekend) => weekendIds.includes(weekend.id)).flatMap((weekend) => weekend.variants.map((variant) => variant.name)));
	return catalog.boothSizes.filter((size) => offered.has(size.name));
}

/** True when the size is on the waitlist on every chosen weekend that offers it. */
export function sizeWaitlisted(catalog: PublicCatalog, weekendIds: readonly string[], size: string): boolean {
	const variants = catalog.weekends
		.filter((weekend) => weekendIds.includes(weekend.id))
		.flatMap((weekend) => weekend.variants.filter((variant) => variant.name === size));
	return variants.length > 0 && variants.every((variant) => variant.waitlist);
}

// --- The form -------------------------------------------------------------------------------------

export type ApplicationForm = {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	brandName: string;
	instagram: string;
	weekendIds: string[];
	boothSize: string;
	consent: boolean;
	/** Honeypot: hidden from people; anything typed here means a bot. */
	website: string;
};

export const emptyForm = (): ApplicationForm => ({
	firstName: '',
	lastName: '',
	email: '',
	phone: '',
	brandName: '',
	instagram: '',
	weekendIds: [],
	boothSize: '',
	consent: false,
	website: ''
});

/** Shown next to the consent box; its version is recorded with the application. */
export const CONSENT_TEXT =
	'I agree that The Good Flea may contact me by email, phone or text about my application and the markets I chose.';
export const CONSENT_TEXT_VERSION = '2026-10';

export type FormField = 'first_name' | 'last_name' | 'email' | 'phone' | 'brand_name' | 'instagram' | 'weekend_ids' | 'booth_size' | 'consent';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE = /^[a-z0-9._]{1,30}$/;

/** "@Shop.Name", "instagram.com/shop.name/" -> "shop.name" (as the backend normalises it). */
export function normaliseInstagram(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '')
		.split('?')[0]
		.replace(/^\/+|\/+$/g, '')
		.replace(/[@\s]/g, '');
}

/** Digits only; a leading US country code is dropped (as the backend normalises it). */
export function phoneDigits(value: string): string {
	const digits = value.replace(/\D/g, '');
	return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

/** Friendly checks before sending. The server repeats them and its messages win. */
export function validateForm(form: ApplicationForm): Partial<Record<FormField, string>> {
	const errors: Partial<Record<FormField, string>> = {};
	if (!form.firstName.trim()) errors.first_name = 'Please enter your first name.';
	if (!form.lastName.trim()) errors.last_name = 'Please enter your last name.';
	if (!form.brandName.trim()) errors.brand_name = 'Please enter your brand or business name.';
	if (!EMAIL.test(form.email.trim())) errors.email = 'Please enter a valid email address.';
	const digits = phoneDigits(form.phone);
	if (digits.length < 7 || digits.length > 15) errors.phone = 'Please enter a phone number with 7 to 15 digits.';
	if (!HANDLE.test(normaliseInstagram(form.instagram)))
		errors.instagram = 'Please enter your Instagram handle (letters, numbers, dots and underscores) or profile link.';
	if (!form.weekendIds.length) errors.weekend_ids = 'Please choose at least one market weekend.';
	else if (new Set(form.weekendIds).size > MAX_WEEKENDS) errors.weekend_ids = `Please choose at most ${MAX_WEEKENDS} market weekends.`;
	if (!form.boothSize) errors.booth_size = 'Please choose a booth size, or "Not sure yet".';
	if (!form.consent) errors.consent = 'Please agree to be contacted about your application.';
	return errors;
}

// --- Attribution (where the visitor came from) ------------------------------------------------------

const ATTRIBUTION_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'] as const;
export type Attribution = Partial<Record<(typeof ATTRIBUTION_PARAMS)[number] | 'referrer' | 'landing_path', string>>;

/** UTM tags, click ids, the referring page and the landing path. The server truncates and cleans
 * them again; no IP address or other personal data is collected here. */
export function readAttribution(url: Pick<URL, 'pathname'> & { searchParams: Pick<URLSearchParams, 'get'> }, referrer: string): Attribution {
	const attribution: Attribution = {};
	for (const name of ATTRIBUTION_PARAMS) {
		const value = url.searchParams.get(name);
		if (value) attribution[name] = value.slice(0, 255);
	}
	if (referrer) attribution.referrer = referrer.slice(0, 500);
	attribution.landing_path = url.pathname.slice(0, 300);
	return attribution;
}

export function toApiApplication(form: ApplicationForm, token: string, attribution: Attribution): Json {
	return {
		first_name: form.firstName.trim(),
		last_name: form.lastName.trim(),
		email: form.email.trim(),
		phone: form.phone.trim(),
		brand_name: form.brandName.trim(),
		instagram: form.instagram.trim(),
		weekend_ids: [...new Set(form.weekendIds)],
		booth_size: form.boothSize,
		consent: form.consent,
		consent_text_version: CONSENT_TEXT_VERSION,
		turnstile_token: token,
		website: form.website,
		attribution
	};
}

// --- Requests -------------------------------------------------------------------------------------

const PUBLIC_BASE = `${API_BASE}/public`;

export type SubmitOutcome =
	| { kind: 'received' }
	| { kind: 'invalid'; fields: Partial<Record<FormField, string>>; message: string }
	| { kind: 'not_verified'; message: string }
	| { kind: 'limited'; message: string }
	| { kind: 'unavailable'; message: string }
	| { kind: 'closed'; message: string }
	| { kind: 'network'; message: string };

const FIELDS: readonly FormField[] = ['first_name', 'last_name', 'email', 'phone', 'brand_name', 'instagram', 'weekend_ids', 'booth_size', 'consent'];
export const CLOSED_MESSAGE = 'Applications are closed right now. Please check back soon, or email us.';
const NETWORK_MESSAGE = 'We could not reach our server. Check your connection and try again; your answers are still here.';
const GENERIC_MESSAGE = 'We could not send your application. Please try again, or email us if this keeps happening.';

/** No cookies, no CSRF header: these endpoints need neither, and the staff session is never sent. */
async function publicFetch(path: string, init: RequestInit = {}, fetcher: typeof fetch = fetch): Promise<Response> {
	return fetcher(`${PUBLIC_BASE}${path}`, {
		...init,
		credentials: 'omit',
		headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}) }
	});
}

async function readJson(response: Response): Promise<Json | null> {
	try {
		const text = await response.text();
		return text ? JSON.parse(text) : null;
	} catch {
		return null;
	}
}

export type CatalogResult = { kind: 'open'; catalog: PublicCatalog } | { kind: 'closed' } | { kind: 'error'; message: string };

export async function loadCatalog(fetcher: typeof fetch = fetch): Promise<CatalogResult> {
	let response: Response;
	try {
		response = await publicFetch(withQuery('/market-weekends/'), {}, fetcher);
	} catch {
		return { kind: 'error', message: NETWORK_MESSAGE };
	}
	if (response.status === 404) return { kind: 'closed' };
	if (!response.ok) return { kind: 'error', message: 'The application form could not load. Please refresh the page in a minute.' };
	const body = await readJson(response);
	return body ? { kind: 'open', catalog: fromApiCatalog(body) } : { kind: 'error', message: GENERIC_MESSAGE };
}

function firstMessage(value: unknown): string | null {
	if (typeof value === 'string') return value;
	if (Array.isArray(value) && typeof value[0] === 'string') return value.join(' ');
	return null;
}

export async function submitApplication(payload: Json, fetcher: typeof fetch = fetch): Promise<SubmitOutcome> {
	let response: Response;
	try {
		response = await publicFetch('/applications/', { method: 'POST', body: JSON.stringify(payload) }, fetcher);
	} catch {
		return { kind: 'network', message: NETWORK_MESSAGE };
	}
	const body = await readJson(response);
	const detail = firstMessage(body?.detail);
	if (response.ok && body?.status === 'received') return { kind: 'received' };
	if (response.status === 400 && body) {
		const fields: Partial<Record<FormField, string>> = {};
		for (const field of FIELDS) {
			const message = firstMessage(body[field]);
			if (message) fields[field] = message;
		}
		if (Object.keys(fields).length) return { kind: 'invalid', fields, message: 'Please check the highlighted answers.' };
		if (detail?.toLowerCase().includes('verify')) return { kind: 'not_verified', message: detail };
		return { kind: 'invalid', fields: {}, message: detail ?? GENERIC_MESSAGE };
	}
	if (response.status === 404) return { kind: 'closed', message: CLOSED_MESSAGE };
	if (response.status === 429) {
		// The per-email limit explains itself; DRF's own throttle message ("Request was throttled…") does not.
		const friendly = detail && !detail.startsWith('Request was throttled') ? detail : null;
		return { kind: 'limited', message: friendly ?? 'Too many attempts from your connection. Please wait a little and try again.' };
	}
	if (response.status >= 500) return { kind: 'unavailable', message: detail ?? GENERIC_MESSAGE };
	return { kind: 'invalid', fields: {}, message: detail ?? GENERIC_MESSAGE };
}
