// Prototype client-side store. Every mutation is async and returns plain data so the
// implementations can be swapped for Django API calls without changing callers.
import { get, writable, type Readable } from 'svelte/store';
import type {
	BoothSize,
	BusinessRegistration,
	Category,
	CommitmentLevel,
	LiabilityInsurance
} from '#lib/options.ts';

export type VendorStatus =
	| 'lead'
	| 'applied'
	| 'in_review'
	| 'waitlisted'
	| 'approved'
	| 'declined'
	| 'suspended';

export const vendorStatuses: readonly VendorStatus[] = [
	'lead',
	'applied',
	'in_review',
	'waitlisted',
	'approved',
	'declined',
	'suspended'
];

export const statusLabels: Record<VendorStatus, string> = {
	lead: 'Lead',
	applied: 'Applied',
	in_review: 'In review',
	waitlisted: 'Waitlisted',
	approved: 'Approved',
	declined: 'Declined',
	suspended: 'Suspended'
};

export const statusTransitions: Record<VendorStatus, readonly VendorStatus[]> = {
	lead: ['applied', 'in_review', 'declined'],
	applied: ['in_review', 'declined'],
	in_review: ['approved', 'waitlisted', 'declined'],
	waitlisted: ['in_review', 'approved', 'declined'],
	approved: ['suspended'],
	suspended: ['approved'],
	declined: ['in_review']
};

export function canTransition(from: VendorStatus, to: VendorStatus): boolean {
	return statusTransitions[from].includes(to);
}

export type StatusChange = {
	from: VendorStatus | null;
	to: VendorStatus;
	at: string;
	note?: string;
};

export type Vendor = {
	id: string;
	createdAt: string;
	updatedAt: string;
	status: VendorStatus;
	statusHistory: StatusChange[];
	importedAt: string | null;
	firstName: string;
	lastName: string;
	brandName: string;
	email: string;
	phone: string;
	instagram: string;
	website: string;
	category: Category | '';
	aboutBrand: string;
	objectives: string;
	commitmentLevel: CommitmentLevel | '';
	otherMarkets: string;
	leadSource: string;
	tags: string[];
	notes: string;
	businessRegistration: BusinessRegistration;
	liabilityInsurance: LiabilityInsurance;
	proposedBoothSize: BoothSize | '';
	requestedWeekends: string[];
	needsTent: boolean;
	/** Read-only: will be derived from bookings once the backend exists. */
	readonly bookedDates: readonly string[];
	/** Read-only: will be derived from bookings once the backend exists. */
	readonly marketsAttended: readonly string[];
};

type SystemField =
	| 'id'
	| 'createdAt'
	| 'updatedAt'
	| 'status'
	| 'statusHistory'
	| 'importedAt'
	| 'bookedDates'
	| 'marketsAttended';

/** The fields a person can edit through the vendor form. */
export type VendorInput = Omit<Vendor, SystemField>;
export type CreatableStatus = Extract<VendorStatus, 'lead' | 'applied'>;

export function emptyVendorInput(): VendorInput {
	return {
		firstName: '',
		lastName: '',
		brandName: '',
		email: '',
		phone: '',
		instagram: '',
		website: '',
		category: '',
		aboutBrand: '',
		objectives: '',
		commitmentLevel: '',
		otherMarkets: '',
		leadSource: '',
		tags: [],
		notes: '',
		businessRegistration: 'Not answered',
		liabilityInsurance: 'Not answered',
		proposedBoothSize: '',
		requestedWeekends: [],
		needsTent: false
	};
}

export function toVendorInput(vendor: Vendor): VendorInput {
	const {
		id: _id,
		createdAt: _createdAt,
		updatedAt: _updatedAt,
		status: _status,
		statusHistory: _statusHistory,
		importedAt: _importedAt,
		bookedDates: _bookedDates,
		marketsAttended: _marketsAttended,
		...input
	} = vendor;
	return { ...input, tags: [...input.tags], requestedWeekends: [...input.requestedWeekends] };
}

export const normaliseEmail = (email: string) => email.trim().toLowerCase();
export const normaliseInstagram = (handle: string) => handle.replace(/[@\s]/g, '').toLowerCase();

const STORAGE_KEY = 'tgf-vendors-v2';
const browser = typeof window !== 'undefined';

function seed(
	id: string,
	createdAt: string,
	path: VendorStatus[],
	fields: Partial<VendorInput> & Pick<VendorInput, 'brandName'>,
	readOnly: Pick<Vendor, 'bookedDates' | 'marketsAttended'> = { bookedDates: [], marketsAttended: [] }
): Vendor {
	const at = `${createdAt}T12:00:00.000Z`;
	const statusHistory = path.map((to, i) => ({ from: i === 0 ? null : path[i - 1], to, at }));
	return {
		...emptyVendorInput(),
		...fields,
		...readOnly,
		id,
		createdAt: at,
		updatedAt: at,
		status: path[path.length - 1],
		statusHistory,
		importedAt: null
	};
}

const seedVendors: Vendor[] = [
	seed(
		'1',
		'2026-08-01',
		['lead', 'applied', 'in_review', 'approved'],
		{
			firstName: 'Cy',
			lastName: 'Ganderton',
			brandName: 'Acme Corporation',
			email: 'cy@acme.com',
			phone: '(555) 123-4567',
			instagram: '@acme',
			website: 'https://acme.example.com',
			category: 'Arts, Prints & Stickers',
			aboutBrand: 'Independent artwork, prints, and stickers made for collectors and everyday spaces.',
			objectives: 'Grow brand awareness and meet new customers at The Good Flea.',
			commitmentLevel: 'Full time',
			otherMarkets: 'Local art and design markets',
			leadSource: 'Meta ads',
			tags: ['VIP', 'Tier-1'],
			notes: 'A strong visual brand with an established customer following.',
			businessRegistration: 'LLC',
			liabilityInsurance: 'Have active policy',
			proposedBoothSize: '8ft x 8ft',
			requestedWeekends: ['October 10 & 11', 'October 17 & 18']
		},
		{ bookedDates: ['October 10 & 11', 'October 17 & 18'], marketsAttended: ['October 4 & 5'] }
	),
	seed(
		'2',
		'2026-08-02',
		['lead', 'applied', 'in_review', 'approved', 'suspended'],
		{
			firstName: 'Hart',
			lastName: 'Hagerty',
			brandName: 'Stark Industries',
			email: 'hart@stark.com',
			phone: '(555) 987-6543',
			instagram: '@starkind',
			website: 'https://stark.example.com',
			category: 'Ceramics / Glass',
			aboutBrand: 'Small-batch functional ceramics and sculptural homeware.',
			objectives: 'Introduce new collections and build repeat local customers.',
			commitmentLevel: 'Part time',
			otherMarkets: 'Independent makers markets',
			leadSource: 'Shopify lead form',
			tags: ['Late Pay'],
			notes: 'Follow up on payment timing before confirming future dates.',
			businessRegistration: 'Sole Prop',
			liabilityInsurance: 'Need guidance',
			proposedBoothSize: '8ft x 8ft'
		},
		{ bookedDates: [], marketsAttended: ['September 19 & 20'] }
	),
	seed('3', '2026-09-03', ['lead', 'applied', 'in_review'], {
		firstName: 'Brice',
		lastName: 'Swyre',
		brandName: 'Wayne Enterprises',
		email: 'brice@wayne.co',
		phone: '(555) 555-5555',
		instagram: '@wayne_ent',
		website: 'https://wayne.example.com',
		category: 'Vintage Clothing',
		aboutBrand: 'Curated vintage clothing with a focus on quality statement pieces.',
		objectives: 'Connect with the community and expand the brand’s in-person presence.',
		commitmentLevel: 'Full time',
		otherMarkets: 'Vintage fairs and pop-ups',
		leadSource: 'Email',
		tags: ['Sponsor'],
		businessRegistration: 'LLC',
		liabilityInsurance: 'Have active policy',
		proposedBoothSize: '8ft x 12ft',
		requestedWeekends: ['December 12 & 13'],
		needsTent: true
	}),
	seed('4', '2026-10-01', ['lead'], {
		brandName: 'Moss & Thread',
		instagram: '@mossandthread',
		leadSource: 'Instagram'
	}),
	seed('5', '2026-10-04', ['lead', 'applied'], {
		firstName: 'Lillian',
		lastName: 'Park',
		brandName: 'Ember Wick Co.',
		email: 'lillian@emberwick.example.com',
		phone: '(555) 210-3344',
		instagram: '@emberwickco',
		category: 'Soaps / Candles and Perfume',
		aboutBrand: 'Hand-poured soy candles and solid perfumes.',
		leadSource: 'Application form',
		proposedBoothSize: '8ft x 8ft',
		requestedWeekends: ['November 21 & 22', 'November 28 & 29']
	}),
	seed('6', '2026-09-20', ['lead', 'applied', 'in_review', 'waitlisted'], {
		firstName: 'Marcus',
		lastName: 'Bell',
		brandName: 'Second Spin Records',
		email: 'marcus@secondspin.example.com',
		phone: '(555) 678-9012',
		instagram: '@secondspinrecords',
		category: 'Music / Vinyl',
		aboutBrand: 'Used and rare vinyl, mostly soul, jazz and 90s hip hop.',
		leadSource: 'Shopify popup form',
		notes: 'Music / Vinyl is at capacity for October; revisit for November.',
		businessRegistration: 'In progress',
		liabilityInsurance: "Don't have",
		proposedBoothSize: '8ft x 12ft',
		requestedWeekends: ['October 24 & 25'],
		needsTent: true
	}),
	seed('7', '2026-09-12', ['lead', 'applied', 'declined'], {
		firstName: 'Dana',
		lastName: 'Ruiz',
		brandName: 'Fast Fashion Outlet',
		email: 'dana@ffoutlet.example.com',
		phone: '(555) 432-1098',
		category: 'Clothing Brand',
		leadSource: 'Meta ads',
		notes: 'Mass-produced stock; not a fit for the market.'
	})
];

function loadInitialVendors(): Vendor[] {
	if (!browser) return seedVendors;
	try {
		const saved = sessionStorage.getItem(STORAGE_KEY);
		return saved ? (JSON.parse(saved) as Vendor[]) : seedVendors;
	} catch {
		return seedVendors;
	}
}

const store = writable<Vendor[]>(loadInitialVendors());
if (browser) {
	store.subscribe((items) => {
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
		} catch {
			// Storage can be unavailable (private mode, quota); the in-memory store still works.
		}
	});
}

export const vendors: Readable<Vendor[]> = { subscribe: store.subscribe };

export function getVendor(id: string): Vendor | undefined {
	return get(store).find((vendor) => vendor.id === id);
}

const now = () => new Date().toISOString();

function nextIds(count: number): string[] {
	const max = Math.max(0, ...get(store).map((vendor) => Number(vendor.id) || 0));
	return Array.from({ length: count }, (_, i) => String(max + i + 1));
}

function build(
	id: string,
	input: VendorInput,
	status: VendorStatus,
	importedAt: string | null,
	at: string
): Vendor {
	return {
		...input,
		tags: [...input.tags],
		requestedWeekends: [...input.requestedWeekends],
		id,
		createdAt: at,
		updatedAt: at,
		status,
		statusHistory: [{ from: null, to: status, at }],
		importedAt,
		bookedDates: [],
		marketsAttended: []
	};
}

export async function createVendor(
	input: VendorInput,
	status: CreatableStatus = 'lead'
): Promise<Vendor> {
	const [id] = nextIds(1);
	const vendor = build(id, input, status, null, now());
	store.update((items) => [...items, vendor]);
	return vendor;
}

export async function updateVendor(id: string, patch: Partial<VendorInput>): Promise<Vendor | undefined> {
	const editable = Object.keys(emptyVendorInput()) as (keyof VendorInput)[];
	const safePatch = Object.fromEntries(
		Object.entries(patch).filter(([key]) => editable.includes(key as keyof VendorInput))
	) as Partial<VendorInput>;
	let updated: Vendor | undefined;
	store.update((items) =>
		items.map((vendor) => {
			if (vendor.id !== id) return vendor;
			updated = { ...vendor, ...safePatch, updatedAt: now() };
			return updated;
		})
	);
	return updated;
}

export type SetStatusResult =
	| { ok: true; vendor: Vendor }
	| { ok: false; reason: 'not_found' | 'invalid_transition'; message: string };

export async function setStatus(id: string, to: VendorStatus, note?: string): Promise<SetStatusResult> {
	const vendor = getVendor(id);
	if (!vendor) return { ok: false, reason: 'not_found', message: `No vendor with id ${id}.` };
	if (!canTransition(vendor.status, to)) {
		return {
			ok: false,
			reason: 'invalid_transition',
			message: `Cannot move from ${statusLabels[vendor.status]} to ${statusLabels[to]}.`
		};
	}
	const at = now();
	const change: StatusChange = { from: vendor.status, to, at };
	if (note?.trim()) change.note = note.trim();
	const updated: Vendor = {
		...vendor,
		status: to,
		updatedAt: at,
		statusHistory: [...vendor.statusHistory, change]
	};
	store.update((items) => items.map((item) => (item.id === id ? updated : item)));
	return { ok: true, vendor: updated };
}

export async function importVendors(rows: VendorInput[]): Promise<Vendor[]> {
	const at = now();
	const ids = nextIds(rows.length);
	const created = rows.map((row, i) =>
		build(ids[i], { ...row, leadSource: row.leadSource || 'CSV import' }, 'lead', at, at)
	);
	store.update((items) => [...items, ...created]);
	return created;
}

export type DuplicateMatch = { vendor: Vendor; matchedOn: ('email' | 'instagram')[] };

export function matchDuplicates(
	candidates: readonly Vendor[],
	query: { email?: string; instagram?: string; excludeId?: string }
): DuplicateMatch[] {
	const email = normaliseEmail(query.email ?? '');
	const instagram = normaliseInstagram(query.instagram ?? '');
	const matches: DuplicateMatch[] = [];
	for (const vendor of candidates) {
		if (vendor.id === query.excludeId) continue;
		const matchedOn: DuplicateMatch['matchedOn'] = [];
		if (email && normaliseEmail(vendor.email) === email) matchedOn.push('email');
		if (instagram && normaliseInstagram(vendor.instagram) === instagram) matchedOn.push('instagram');
		if (matchedOn.length) matches.push({ vendor, matchedOn });
	}
	return matches;
}

export async function findDuplicates(query: {
	email?: string;
	instagram?: string;
	excludeId?: string;
}): Promise<DuplicateMatch[]> {
	return matchDuplicates(get(store), query);
}
