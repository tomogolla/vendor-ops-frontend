// API client for what The Good Flea sells: market weekends, their booth variants and add-ons.
// Capacity usage (confirmed, remaining, waitlisted) is computed by the API from application lines.
import { request, type Page, type Query } from '#lib/api.ts';
import { mapPage, type Json } from '#lib/vendor-store.ts';

export type WeekendStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export const weekendStatusLabels: Record<WeekendStatus, string> = { DRAFT: 'Draft', OPEN: 'Open', CLOSED: 'Closed' };

/** Oldest waitlisted line of a product that has room. A suggestion only: nothing is promoted automatically. */
export type PromotionSuggestion = {
	lineId: string;
	applicationId: string;
	vendorId: string;
	brandName: string;
	quantity: number;
	waitlistedAt: string | null;
	fits: boolean;
};

type Usage = {
	confirmed: number;
	/** Null for an add-on without a capacity (unlimited). */
	remaining: number | null;
	waitlisted: number;
	suggestions: PromotionSuggestion[];
};

export type BoothVariant = Usage & {
	id: string;
	weekendId: string;
	name: string;
	dimensions: string;
	priceCents: number;
	capacity: number;
};

export type AddOn = Usage & {
	id: string;
	weekendId: string;
	name: string;
	priceCents: number;
	capacity: number | null;
};

export type MarketWeekend = {
	id: string;
	label: string;
	startDate: string;
	endDate: string;
	venue: string;
	status: WeekendStatus;
	currency: string;
	variants: BoothVariant[];
	addOns: AddOn[];
};

// --- Mapping --------------------------------------------------------------------------------

const fromApiSuggestion = (raw: Json): PromotionSuggestion => ({
	lineId: raw.line_id,
	applicationId: raw.application_id,
	vendorId: raw.vendor_id,
	brandName: raw.brand_name,
	quantity: raw.quantity,
	waitlistedAt: raw.waitlisted_at ?? null,
	fits: Boolean(raw.fits)
});

const usage = (raw: Json): Usage => ({
	confirmed: raw.confirmed ?? 0,
	remaining: raw.remaining ?? null,
	waitlisted: raw.waitlisted ?? 0,
	suggestions: (raw.promotion_suggestions ?? []).map(fromApiSuggestion)
});

export const fromApiVariant = (raw: Json): BoothVariant => ({
	...usage(raw),
	id: raw.id,
	weekendId: raw.weekend,
	name: raw.name,
	dimensions: raw.dimensions ?? '',
	priceCents: raw.price_cents,
	capacity: raw.capacity
});

export const fromApiAddOn = (raw: Json): AddOn => ({
	...usage(raw),
	id: raw.id,
	weekendId: raw.weekend,
	name: raw.name,
	priceCents: raw.price_cents,
	capacity: raw.capacity ?? null
});

export const fromApiWeekend = (raw: Json): MarketWeekend => ({
	id: raw.id,
	label: raw.label,
	startDate: raw.start_date,
	endDate: raw.end_date,
	venue: raw.venue ?? '',
	status: raw.status,
	currency: raw.currency ?? 'USD',
	variants: (raw.variants ?? []).map(fromApiVariant),
	addOns: (raw.add_ons ?? []).map(fromApiAddOn)
});

// --- API calls --------------------------------------------------------------------------------

export type WeekendInput = { label: string; startDate: string; endDate: string; venue: string; status: WeekendStatus };
export type VariantInput = { name: string; dimensions: string; priceCents: number; capacity: number };
export type AddOnInput = { name: string; priceCents: number; capacity: number | null };

const toApiWeekend = (input: Partial<WeekendInput>): Json => {
	const body: Json = {};
	if (input.label !== undefined) body.label = input.label.trim();
	if (input.startDate !== undefined) body.start_date = input.startDate;
	if (input.endDate !== undefined) body.end_date = input.endDate;
	if (input.venue !== undefined) body.venue = input.venue.trim();
	if (input.status !== undefined) body.status = input.status;
	return body;
};

const toApiVariant = (input: Partial<VariantInput>): Json => {
	const body: Json = {};
	if (input.name !== undefined) body.name = input.name.trim();
	if (input.dimensions !== undefined) body.dimensions = input.dimensions.trim();
	if (input.priceCents !== undefined) body.price_cents = input.priceCents;
	if (input.capacity !== undefined) body.capacity = input.capacity;
	return body;
};

const toApiAddOn = (input: Partial<AddOnInput>): Json => {
	const body: Json = {};
	if (input.name !== undefined) body.name = input.name.trim();
	if (input.priceCents !== undefined) body.price_cents = input.priceCents;
	if (input.capacity !== undefined) body.capacity = input.capacity;
	return body;
};

export async function listWeekends(query: Query = {}): Promise<Page<MarketWeekend>> {
	return mapPage(await request<Page<Json>>('/market-weekends/', { query: { ordering: 'start_date', ...query } }), fromApiWeekend);
}

export async function getWeekend(id: string): Promise<MarketWeekend> {
	return fromApiWeekend(await request<Json>(`/market-weekends/${id}/`));
}

export async function createWeekend(input: WeekendInput): Promise<MarketWeekend> {
	return fromApiWeekend(await request<Json>('/market-weekends/', { method: 'POST', json: toApiWeekend(input) }));
}

export async function updateWeekend(id: string, patch: Partial<WeekendInput>): Promise<MarketWeekend> {
	return fromApiWeekend(await request<Json>(`/market-weekends/${id}/`, { method: 'PATCH', json: toApiWeekend(patch) }));
}

export async function deleteWeekend(id: string): Promise<void> {
	await request(`/market-weekends/${id}/`, { method: 'DELETE' });
}

export async function createVariant(weekendId: string, input: VariantInput): Promise<BoothVariant> {
	const raw = await request<Json>(`/market-weekends/${weekendId}/variants/`, { method: 'POST', json: toApiVariant(input) });
	return fromApiVariant(raw);
}

export async function updateVariant(weekendId: string, id: string, patch: Partial<VariantInput>): Promise<BoothVariant> {
	const raw = await request<Json>(`/market-weekends/${weekendId}/variants/${id}/`, { method: 'PATCH', json: toApiVariant(patch) });
	return fromApiVariant(raw);
}

export async function deleteVariant(weekendId: string, id: string): Promise<void> {
	await request(`/market-weekends/${weekendId}/variants/${id}/`, { method: 'DELETE' });
}

export async function createAddOn(weekendId: string, input: AddOnInput): Promise<AddOn> {
	const raw = await request<Json>(`/market-weekends/${weekendId}/add-ons/`, { method: 'POST', json: toApiAddOn(input) });
	return fromApiAddOn(raw);
}

export async function updateAddOn(weekendId: string, id: string, patch: Partial<AddOnInput>): Promise<AddOn> {
	const raw = await request<Json>(`/market-weekends/${weekendId}/add-ons/${id}/`, { method: 'PATCH', json: toApiAddOn(patch) });
	return fromApiAddOn(raw);
}

export async function deleteAddOn(weekendId: string, id: string): Promise<void> {
	await request(`/market-weekends/${weekendId}/add-ons/${id}/`, { method: 'DELETE' });
}

// --- Pure helpers ---------------------------------------------------------------------------

export type CapacityDisplay = {
	unlimited: boolean;
	capacity: number | null;
	confirmed: number;
	remaining: number | null;
	waitlisted: number;
	/** Share of capacity confirmed, 0-100 (0 when unlimited). */
	percentUsed: number;
	text: string;
	tone: 'full' | 'low' | 'ok';
};

export const LOW_CAPACITY = 2;

export function capacityDisplay(product: Pick<BoothVariant | AddOn, 'confirmed' | 'remaining' | 'waitlisted'> & {
	capacity: number | null;
}): CapacityDisplay {
	const { capacity, confirmed, remaining, waitlisted } = product;
	if (capacity === null || remaining === null) {
		return {
			unlimited: true, capacity: null, confirmed, remaining: null, waitlisted, percentUsed: 0,
			text: `${confirmed} confirmed · no limit`, tone: 'ok'
		};
	}
	const percentUsed = capacity > 0 ? Math.min(100, Math.round((confirmed / capacity) * 100)) : 100;
	const left = Math.max(remaining, 0);
	return {
		unlimited: false,
		capacity,
		confirmed,
		remaining,
		waitlisted,
		percentUsed,
		text: `${confirmed} of ${capacity} confirmed · ${left} left`,
		tone: left === 0 ? 'full' : left <= LOW_CAPACITY ? 'low' : 'ok'
	};
}

export type CapacityAlert = {
	weekend: Pick<MarketWeekend, 'id' | 'label'>;
	productName: string;
	kind: 'variant' | 'add_on';
	remaining: number | null;
	waitlisted: number;
};

/** Products with LOW_CAPACITY or fewer spots left, or with anyone waitlisted. */
export function capacityAlerts(weekends: readonly MarketWeekend[]): CapacityAlert[] {
	const alerts: CapacityAlert[] = [];
	for (const weekend of weekends) {
		const products = [
			...weekend.variants.map((product) => ({ product, kind: 'variant' as const })),
			...weekend.addOns.map((product) => ({ product, kind: 'add_on' as const }))
		];
		for (const { product, kind } of products) {
			const low = product.remaining !== null && product.remaining <= LOW_CAPACITY;
			if (low || product.waitlisted > 0) {
				alerts.push({
					weekend: { id: weekend.id, label: weekend.label },
					productName: product.name,
					kind,
					remaining: product.remaining,
					waitlisted: product.waitlisted
				});
			}
		}
	}
	return alerts;
}
