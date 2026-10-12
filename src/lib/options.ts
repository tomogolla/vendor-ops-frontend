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

export const boothSizes = ['8ft x 8ft', '8ft x 12ft'] as const;
export type BoothSize = (typeof boothSizes)[number];

export const marketWeekends = [
	'October 10 & 11',
	'October 17 & 18',
	'October 24 & 25',
	'October 31 & November 1',
	'November 7 & 8',
	'November 14 & 15',
	'November 21 & 22',
	'November 28 & 29',
	'December 5 & 6',
	'December 12 & 13',
	'December 19 & 20',
	'December 26 & 27'
] as const;
export type MarketWeekend = (typeof marketWeekends)[number];
