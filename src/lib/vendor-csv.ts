import Papa from 'papaparse';

// Rows are parsed, validated and matched by the API (/imports/vendors/preview/).
export const MAX_CSV_BYTES = 2 * 1024 * 1024;

export function sampleCsv(): string {
	return Papa.unparse({
		fields: [
			'Brand name', 'First name', 'Last name', 'Email', 'Phone', 'Instagram', 'Website', 'Category',
			'Lead source', 'Notes', 'Tags', 'Already contacted', 'Inactive', 'Exclude from outreach'
		],
		data: [
			['Juniper Ceramics', 'Ana', 'Lopez', 'ana@juniper.example.com', '(555) 101-2020', '@juniperceramics',
				'https://juniper.example.com', 'Ceramics / Glass', 'Instagram', 'Met at the October market',
				'Returning;Handmade', '', '', ''],
			['Thread Theory', '', '', '', '', '@threadtheory', '', 'Knitwear', '', '', '', 'yes', '', '']
		]
	});
}
