export function formatDate(iso: string): string {
	const date = new Date(iso);
	return Number.isNaN(date.getTime())
		? iso
		: date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string): string {
	const date = new Date(iso);
	return Number.isNaN(date.getTime())
		? iso
		: date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export const instagramUrl = (handle: string) =>
	`https://instagram.com/${encodeURIComponent(handle.replace(/[@\s]/g, ''))}`;

// --- Money: integer cents in code, formatted only for display -------------------

const moneyFormats = new Map<string, Intl.NumberFormat>();

/** 30600 -> "$306.00". The currency code comes from the API (`currency`, USD today). */
export function formatMoney(cents: number | null | undefined, currency = 'USD'): string {
	if (cents === null || cents === undefined || !Number.isFinite(cents)) return '—';
	let format = moneyFormats.get(currency);
	if (!format) {
		format = new Intl.NumberFormat('en-US', { style: 'currency', currency });
		moneyFormats.set(currency, format);
	}
	return format.format(cents / 100);
}

const DOLLARS = /^\$?\s*(\d{1,3}(?:,\d{3})+|\d+)?(?:\.(\d{1,2}))?$/;

/** Parses what a person types as a dollar amount ("150", "$1,250.5", "0.99") into whole cents.
 * Returns null for blank, negative, malformed or more-than-two-decimal input. */
export function parseDollars(text: string): number | null {
	const match = DOLLARS.exec(text.trim());
	if (!match || (match[1] === undefined && match[2] === undefined)) return null;
	const whole = Number((match[1] ?? '0').replaceAll(',', ''));
	const fraction = Number((match[2] ?? '').padEnd(2, '0'));
	const cents = whole * 100 + fraction;
	return Number.isSafeInteger(cents) ? cents : null;
}

/** 15000 -> "150.00", for pre-filling a dollars input. */
export function centsToDollarsInput(cents: number | null | undefined): string {
	if (cents === null || cents === undefined) return '';
	return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
