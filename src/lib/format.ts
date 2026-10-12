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
