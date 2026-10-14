export const categories = [
	'Pets Accessories',
	'Arts, Prints & Stickers',
	'Beauty & Cosmetics',
	'Ceramics / Glass',
	'Clothing Brand',
	'Crotchet, Sewing, Quilt Goods',
	'Cultural Collectibles',
	'Experience',
	'Homeware',
	'Jewelry',
	'Leatherwork',
	'Music / Vinyl',
	'NYC Merch',
	'Photography',
	'Plants',
	'Soaps / Candles and Perfume',
	'Stationery',
	'Unique Things',
	'Vintage Clothing',
	'Vintage General',
	'Vintage Homeware',
	'Vintage Jewelry',
	'Vintage Upcycled'
] as const;
export type Category = (typeof categories)[number];

export const leadSources = [
	'Instagram',
	'Email',
	'Shopify popup form',
	'Shopify lead form',
	'Meta ads',
	'Application form',
	'CSV import'
] as const;
export type LeadSource = (typeof leadSources)[number];

export const commitmentLevels = ['Full time', 'Part time'] as const;
export type CommitmentLevel = (typeof commitmentLevels)[number];

export const businessRegistration = ['Not answered', 'LLC', 'Sole Prop', 'In progress', 'None'] as const;
export type BusinessRegistration = (typeof businessRegistration)[number];

export const liabilityInsurance = [
	'Not answered',
	'Have active policy',
	'Need guidance',
	"Don't have"
] as const;
export type LiabilityInsurance = (typeof liabilityInsurance)[number];

export const callOutcomes = [
	'Interested',
	'Not Qualified',
	'Callback Requested',
	'No Answer',
	'Wrong Number'
] as const;
export type CallOutcome = (typeof callOutcomes)[number];

export const MAX_CALL_ATTEMPTS = 5;
