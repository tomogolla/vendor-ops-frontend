import Papa from 'papaparse';
import { categories, leadSources } from '#lib/options.ts';
import {
	emptyVendorInput,
	matchDuplicates,
	normaliseEmail,
	normaliseInstagram,
	type Vendor,
	type VendorInput
} from '#lib/vendor-store.ts';
import { formatErrors, requiredErrors } from '#lib/vendor-validation.ts';

export const MAX_CSV_BYTES = 2 * 1024 * 1024;

type CsvField =
	| 'brandName'
	| 'firstName'
	| 'lastName'
	| 'email'
	| 'phone'
	| 'instagram'
	| 'website'
	| 'category'
	| 'leadSource'
	| 'notes'
	| 'tags';

const headerAliases: Record<string, CsvField> = {
	brand: 'brandName',
	'brand name': 'brandName',
	'business name': 'brandName',
	'first name': 'firstName',
	'last name': 'lastName',
	email: 'email',
	phone: 'phone',
	instagram: 'instagram',
	ig: 'instagram',
	website: 'website',
	category: 'category',
	'lead source': 'leadSource',
	source: 'leadSource',
	notes: 'notes',
	tags: 'tags'
};

const normaliseHeader = (header: string) => header.trim().toLowerCase().replace(/[\s_-]+/g, ' ');

export function matchHeader(header: string): CsvField | undefined {
	return headerAliases[normaliseHeader(header)];
}

function canonical<T extends string>(options: readonly T[], value: string): T | undefined {
	const wanted = value.trim().toLowerCase();
	return options.find((option) => option.toLowerCase() === wanted);
}

export type CsvRow = { line: number; input: VendorInput };
export type CsvSkipped = { line: number; brandName: string; reason: string };
export type CsvInvalid = { line: number; brandName: string; reasons: string[] };
export type CsvPreview = {
	toImport: CsvRow[];
	duplicates: CsvSkipped[];
	invalid: CsvInvalid[];
	ignoredHeaders: string[];
};

/** Maps one parsed CSV record (already keyed by our field names) to vendor input. */
export function rowToInput(record: Partial<Record<CsvField, string>>): VendorInput {
	const value = (field: CsvField) => (record[field] ?? '').trim();
	const input: VendorInput = {
		...emptyVendorInput(),
		brandName: value('brandName'),
		firstName: value('firstName'),
		lastName: value('lastName'),
		email: value('email'),
		phone: value('phone'),
		instagram: value('instagram'),
		website: value('website'),
		notes: value('notes'),
		leadSource: canonical(leadSources, value('leadSource')) ?? value('leadSource'),
		tags: value('tags')
			.split(';')
			.map((tag) => tag.trim())
			.filter(Boolean)
	};
	const rawCategory = value('category');
	const category = canonical(categories, rawCategory);
	if (category) {
		input.category = category;
	} else if (rawCategory) {
		const line = `Imported category: ${rawCategory}`;
		input.notes = input.notes ? `${input.notes}\n${line}` : line;
	}
	return input;
}

export function previewVendorCsv(text: string, existing: readonly Vendor[]): CsvPreview {
	const ignoredHeaders: string[] = [];
	const parsed = Papa.parse<Partial<Record<CsvField, string>>>(text, {
		header: true,
		skipEmptyLines: 'greedy',
		transformHeader: (header) => {
			const field = matchHeader(header);
			if (!field && header.trim()) ignoredHeaders.push(header.trim());
			return field ?? `__ignored:${header}`;
		}
	});

	const parseErrors = new Map<number, string>();
	for (const error of parsed.errors) {
		if (typeof error.row === 'number') parseErrors.set(error.row, error.message);
	}

	const preview: CsvPreview = { toImport: [], duplicates: [], invalid: [], ignoredHeaders };
	const seenEmail = new Map<string, number>();
	const seenInstagram = new Map<string, number>();

	parsed.data.forEach((record, index) => {
		const line = index + 2;
		const input = rowToInput(record);
		const brandName = input.brandName || '(no brand name)';

		const reasons = [
			...(parseErrors.has(index) ? [`Malformed row: ${parseErrors.get(index)}`] : []),
			...Object.values(requiredErrors(input, 'lead')),
			...Object.values(formatErrors(input))
		];
		if (reasons.length) {
			preview.invalid.push({ line, brandName, reasons });
			return;
		}

		const email = normaliseEmail(input.email);
		const instagram = normaliseInstagram(input.instagram);
		const existingMatch = matchDuplicates(existing, { email, instagram })[0];
		if (existingMatch) {
			preview.duplicates.push({
				line,
				brandName,
				reason: `Same ${existingMatch.matchedOn.join(' and ')} as existing vendor ${existingMatch.vendor.brandName} (#${existingMatch.vendor.id})`
			});
			return;
		}
		const earlierLine = (email && seenEmail.get(email)) || (instagram && seenInstagram.get(instagram));
		if (earlierLine) {
			preview.duplicates.push({ line, brandName, reason: `Same email or Instagram as row ${earlierLine} in this file` });
			return;
		}

		if (email) seenEmail.set(email, line);
		if (instagram) seenInstagram.set(instagram, line);
		preview.toImport.push({ line, input });
	});

	return preview;
}

export function sampleCsv(): string {
	return Papa.unparse({
		fields: ['Brand name', 'First name', 'Last name', 'Email', 'Phone', 'Instagram', 'Website', 'Category', 'Lead source', 'Notes', 'Tags'],
		data: [
			['Juniper Ceramics', 'Ana', 'Lopez', 'ana@juniper.example.com', '(555) 101-2020', '@juniperceramics', 'https://juniper.example.com', 'Ceramics / Glass', 'Instagram', 'Met at the October market', 'Returning;Handmade'],
			['Thread Theory', '', '', '', '', '@threadtheory', '', 'Knitwear', '', '', '']
		]
	});
}
