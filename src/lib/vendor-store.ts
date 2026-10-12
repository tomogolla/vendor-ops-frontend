import { get, writable } from 'svelte/store';

const browser = typeof window !== 'undefined';

export type Vendor = {
	id: string; createdAt: string; firstName: string; lastName: string; brandName: string;
	email: string; phone: string; category: string; instagram: string; website: string;
	leadSource: string; tags: string[]; aboutBrand: string; objectives: string;
	boothDimensions: string; bookedDates: string[]; otherMarkets: string; notes: string;
	marketsAttended: string[];
};

export type NewVendor = Omit<Vendor, 'id' | 'createdAt' | 'marketsAttended'>;
const STORAGE_KEY = 'tgf-vendors';

const seedVendors: Vendor[] = [
	{ id: '1', createdAt: '2023-10-01', firstName: 'Cy', lastName: 'Ganderton', brandName: 'Acme Corporation', email: 'cy@acme.com', phone: '(555) 123-4567', category: 'Arts, Prints & Stickers', instagram: '@acme', website: 'https://acme.example.com', leadSource: 'Meta ads', tags: ['VIP', 'Tier-1'], aboutBrand: 'Independent artwork, prints, and stickers made for collectors and everyday spaces.', objectives: 'Grow brand awareness and meet new customers at The Good Flea.', boothDimensions: '8ft x 10ft', bookedDates: ['October 10 & 11', 'October 17 & 18'], otherMarkets: 'Local art and design markets', notes: 'A strong visual brand with an established customer following.', marketsAttended: ['October 4 & 5'] },
	{ id: '2', createdAt: '2023-10-02', firstName: 'Hart', lastName: 'Hagerty', brandName: 'Stark Industries', email: 'hart@stark.com', phone: '(555) 987-6543', category: 'Ceramics / Glass', instagram: '@starkind', website: 'https://stark.example.com', leadSource: 'Shopify form', tags: ['Late Pay'], aboutBrand: 'Small-batch functional ceramics and sculptural homeware.', objectives: 'Introduce new collections and build repeat local customers.', boothDimensions: '8ft x 8ft', bookedDates: ['November 7 & 8'], otherMarkets: 'Independent makers markets', notes: 'Follow up on payment timing before confirming future dates.', marketsAttended: ['September 19 & 20'] },
	{ id: '3', createdAt: '2023-10-03', firstName: 'Brice', lastName: 'Swyre', brandName: 'Wayne Enterprises', email: 'brice@wayne.co', phone: '(555) 555-5555', category: 'Vintage Clothing', instagram: '@wayne_ent', website: 'https://wayne.example.com', leadSource: 'Email', tags: ['Sponsor'], aboutBrand: 'Curated vintage clothing with a focus on quality statement pieces.', objectives: 'Connect with the community and expand the brand’s in-person presence.', boothDimensions: '8ft x 12ft', bookedDates: ['December 12 & 13'], otherMarkets: 'Vintage fairs and pop-ups', notes: 'Potential partner for a future sponsored activation.', marketsAttended: ['October 10 & 11', 'October 17 & 18'] }
];

function loadInitialVendors(): Vendor[] {
	if (!browser) return seedVendors;
	try {
		const saved = sessionStorage.getItem(STORAGE_KEY);
		return saved ? JSON.parse(saved) as Vendor[] : seedVendors;
	} catch {
		return seedVendors;
	}
}

export const vendors = writable<Vendor[]>(loadInitialVendors());
if (browser) vendors.subscribe((items) => sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items)));

export function getVendor(id: string): Vendor | undefined {
	return get(vendors).find((vendor) => vendor.id === id);
}

export function createVendor(input: NewVendor): Vendor {
	const current = get(vendors);
	const id = String(Math.max(0, ...current.map((vendor) => Number(vendor.id) || 0)) + 1);
	const vendor: Vendor = { ...input, id, createdAt: new Date().toISOString().slice(0, 10), marketsAttended: [] };
	vendors.update((items) => [...items, vendor]);
	return vendor;
}
