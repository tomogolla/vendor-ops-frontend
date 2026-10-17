// Cloudflare Turnstile in the browser (explicit rendering). The widget mode (Managed) is set on the
// widget in the Cloudflare dashboard; the page only supplies the public site key and the action,
// which Django checks along with the hostname when it verifies the token.

export const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
/** Must match TURNSTILE_EXPECTED_ACTION on the backend. */
export const TURNSTILE_ACTION = 'apply';

const PLACEHOLDERS = new Set(['', 'your_site_key', 'change-me']);

/** The public site key from the build environment, or null when it is missing or a placeholder. */
export function siteKey(value: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY): string | null {
	const key = (value ?? '').trim();
	return PLACEHOLDERS.has(key) ? null : key;
}

export type RenderOptions = {
	sitekey: string;
	action: string;
	theme: 'auto' | 'light' | 'dark';
	appearance: 'always';
	'response-field': boolean;
	'refresh-expired': 'auto';
	callback: (token: string) => void;
	'expired-callback': () => void;
	'timeout-callback': () => void;
	'error-callback': () => boolean | void;
};

export type TurnstileApi = {
	render: (container: HTMLElement, options: RenderOptions) => string;
	reset: (widgetId: string) => void;
	remove: (widgetId: string) => void;
};

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

let loading: Promise<TurnstileApi> | null = null;

/** Loads Cloudflare's script once per page. */
export function loadTurnstile(doc: Document = document): Promise<TurnstileApi> {
	const win = doc.defaultView as Window | null;
	if (win?.turnstile) return Promise.resolve(win.turnstile);
	loading ??= new Promise<TurnstileApi>((resolve, reject) => {
		const script = doc.createElement('script');
		script.src = TURNSTILE_SCRIPT;
		script.async = true;
		script.defer = true;
		script.onload = () => (win?.turnstile ? resolve(win.turnstile) : reject(new Error('Turnstile did not load.')));
		script.onerror = () => reject(new Error('Turnstile did not load.'));
		doc.head.appendChild(script);
	}).catch((error) => {
		loading = null; // allow a retry
		throw error;
	});
	return loading;
}

/** Widget options: the token is passed to `ontoken` (null when it expires or fails). */
export function widgetOptions(key: string, ontoken: (token: string | null) => void, onproblem: (message: string) => void): RenderOptions {
	return {
		sitekey: key,
		action: TURNSTILE_ACTION,
		theme: 'auto',
		appearance: 'always',
		'response-field': false,
		'refresh-expired': 'auto',
		callback: (token) => ontoken(token),
		'expired-callback': () => ontoken(null),
		'timeout-callback': () => ontoken(null),
		'error-callback': () => {
			ontoken(null);
			onproblem('The verification check could not run. Please try again, or reload the page.');
			return true; // handled: Turnstile retries on its own
		}
	};
}
