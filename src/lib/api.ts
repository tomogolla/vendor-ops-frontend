// Thin fetch wrapper for the Django API: session cookie auth, CSRF header on writes,
// typed errors, and a hook so the app can react to 401s by sending people to /login.

export const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api/v1';

export class ApiError extends Error {
	constructor(
		readonly status: number,
		readonly body: Record<string, unknown> | null,
		message?: string
	) {
		super(message ?? ApiError.describe(status, body));
		this.name = 'ApiError';
	}

	get isUnauthorized() {
		return this.status === 401;
	}

	get isForbidden() {
		return this.status === 403;
	}

	/** Field-level errors from DRF ({field: [messages]}) flattened to {field: message}. */
	get fieldErrors(): Record<string, string> {
		if (!this.body) return {};
		const errors: Record<string, string> = {};
		for (const [key, value] of Object.entries(this.body)) {
			if (key === 'detail' || key === 'code') continue;
			if (Array.isArray(value) && typeof value[0] === 'string') errors[key] = value.join(' ');
			else if (typeof value === 'string') errors[key] = value;
		}
		return errors;
	}

	static describe(status: number, body: Record<string, unknown> | null): string {
		if (body && typeof body.detail === 'string') return body.detail;
		if (status === 0) return 'Could not reach the server. Check your connection and try again.';
		if (status === 401) return 'Please sign in.';
		if (status === 403) return 'You do not have permission to do that.';
		if (status === 404) return 'Not found.';
		if (status >= 500) return 'The server had a problem. Please try again.';
		const first = body ? Object.values(body).flat().find((value) => typeof value === 'string') : undefined;
		return typeof first === 'string' ? first : `Request failed (${status}).`;
	}
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
	onUnauthorized = handler;
}

function readCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
	return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

let csrfRequest: Promise<void> | null = null;
async function ensureCsrfCookie(fetcher: typeof fetch) {
	if (readCookie('csrftoken')) return;
	csrfRequest ??= fetcher(`${API_BASE}/auth/csrf/`, { credentials: 'include' }).then(() => undefined);
	try {
		await csrfRequest;
	} finally {
		csrfRequest = null;
	}
}

export type Query = Record<string, string | number | boolean | null | undefined>;

export function withQuery(path: string, query?: Query): string {
	if (!query) return path;
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
	}
	const text = params.toString();
	return text ? `${path}?${text}` : path;
}

export type RequestOptions = {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	query?: Query;
	json?: unknown;
	form?: FormData;
	fetch?: typeof fetch;
	/** Skip the global 401 handler (used by the session check itself). */
	quietUnauthorized?: boolean;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const fetcher = options.fetch ?? fetch;
	const method = options.method ?? 'GET';
	const headers: Record<string, string> = { Accept: 'application/json' };
	let body: BodyInit | undefined;
	if (options.json !== undefined) {
		headers['Content-Type'] = 'application/json';
		body = JSON.stringify(options.json);
	} else if (options.form) {
		body = options.form;
	}
	if (method !== 'GET') {
		await ensureCsrfCookie(fetcher);
		const token = readCookie('csrftoken');
		if (token) headers['X-CSRFToken'] = token;
	}

	let response: Response;
	try {
		response = await fetcher(`${API_BASE}${withQuery(path, options.query)}`, {
			method,
			headers,
			body,
			credentials: 'include'
		});
	} catch {
		throw new ApiError(0, null);
	}

	if (response.status === 204) return undefined as T;
	const text = await response.text();
	let data: unknown = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = null;
	}
	if (!response.ok) {
		const error = new ApiError(response.status, (data as Record<string, unknown>) ?? null);
		if (error.isUnauthorized && !options.quietUnauthorized) onUnauthorized?.();
		throw error;
	}
	return data as T;
}

export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };
