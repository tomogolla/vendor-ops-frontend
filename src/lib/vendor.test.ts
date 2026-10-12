import { describe, expect, it } from 'vitest';
import { previewVendorCsv, rowToInput } from '#lib/vendor-csv.ts';
import {
	canTransition,
	emptyVendorInput,
	getVendor,
	matchDuplicates,
	normaliseInstagram,
	setStatus,
	statusTransitions,
	updateVendor,
	vendorStatuses,
	type Vendor,
	type VendorStatus
} from '#lib/vendor-store.ts';
import { isIncomplete, validateVendor } from '#lib/vendor-validation.ts';

describe('status transitions', () => {
	it('matches the agreed map exactly', () => {
		expect(statusTransitions).toEqual({
			lead: ['applied', 'in_review', 'declined'],
			applied: ['in_review', 'declined'],
			in_review: ['approved', 'waitlisted', 'declined'],
			waitlisted: ['in_review', 'approved', 'declined'],
			approved: ['suspended'],
			suspended: ['approved'],
			declined: ['in_review']
		});
	});

	it('never allows a status to transition to itself', () => {
		for (const status of vendorStatuses) expect(canTransition(status, status)).toBe(false);
	});

	it('rejects an invalid transition without throwing or changing the vendor', async () => {
		const before = getVendor('4')!;
		expect(before.status).toBe('lead');
		const result = await setStatus('4', 'approved');
		expect(result).toMatchObject({ ok: false, reason: 'invalid_transition' });
		expect(getVendor('4')!.statusHistory).toHaveLength(before.statusHistory.length);
	});

	it('appends history with the note on a valid transition', async () => {
		const result = await setStatus('3', 'waitlisted', '  Category full  ');
		expect(result.ok).toBe(true);
		const history = getVendor('3')!.statusHistory;
		expect(history.at(-1)).toMatchObject({ from: 'in_review', to: 'waitlisted', note: 'Category full' });
	});

	it('reports unknown vendors', async () => {
		expect(await setStatus('nope', 'applied')).toMatchObject({ ok: false, reason: 'not_found' });
	});

	it('does not let updateVendor change status', async () => {
		const patch = { notes: 'x', status: 'approved' } as unknown as Partial<Vendor>;
		await updateVendor('5', patch);
		expect(getVendor('5')!.status).toBe('applied');
		expect(getVendor('5')!.notes).toBe('x');
	});
});

describe('validation by status', () => {
	const lead = { ...emptyVendorInput(), brandName: 'Moss', instagram: '@moss' };

	it('accepts a lead with brand name and one contact channel', () => {
		expect(validateVendor(lead, 'lead')).toEqual({});
	});

	it('requires a contact channel for leads', () => {
		expect(validateVendor({ ...lead, instagram: '' }, 'lead')).toHaveProperty('contact');
	});

	it.each<VendorStatus>(['applied', 'in_review', 'approved'])('requires full details once %s', (status) => {
		const errors = validateVendor(lead, status);
		expect(Object.keys(errors).sort()).toEqual(['category', 'email', 'firstName', 'lastName', 'phone']);
	});

	it('checks formats only when a value is present', () => {
		const errors = validateVendor({ ...lead, email: 'bad', phone: '12', website: 'acme.com' }, 'lead');
		expect(Object.keys(errors).sort()).toEqual(['email', 'phone', 'website']);
	});

	it('flags seeded records that lack what their status needs', () => {
		expect(isIncomplete(getVendor('4')!)).toBe(false);
		expect(isIncomplete({ ...getVendor('4')!, status: 'applied' })).toBe(true);
	});
});

describe('duplicate normalisation', () => {
	it('strips @, whitespace and case from Instagram handles', () => {
		expect(normaliseInstagram(' @Wayne_Ent ')).toBe('wayne_ent');
	});

	it('matches email case-insensitively and Instagram by handle', () => {
		const existing = [getVendor('1')!, getVendor('3')!];
		expect(matchDuplicates(existing, { email: 'CY@ACME.COM ' })[0]).toMatchObject({
			vendor: { id: '1' },
			matchedOn: ['email']
		});
		expect(matchDuplicates(existing, { instagram: 'wayne_ent' })[0].vendor.id).toBe('3');
		expect(matchDuplicates(existing, { instagram: '@wayne_ent', excludeId: '3' })).toEqual([]);
	});
});

describe('CSV parsing', () => {
	it('maps aliased headers, splits tags on ; and notes unknown categories', () => {
		const input = rowToInput({ brandName: ' Juniper ', category: 'Knitwear', tags: 'A; B;', leadSource: 'instagram' });
		expect(input).toMatchObject({
			brandName: 'Juniper',
			category: '',
			notes: 'Imported category: Knitwear',
			tags: ['A', 'B'],
			leadSource: 'Instagram'
		});
	});

	it('previews rows to import, duplicates and invalid rows', () => {
		const csv = [
			'Business Name,IG,EMAIL,Category,Tags,Favourite colour',
			'Juniper,@juniper,,ceramics / glass,Returning;Handmade,blue',
			'Juniper Again,JUNIPER,,,,',
			'Acme Copy,,cy@acme.com,,,',
			',@nobrand,,,,',
			'No Contact,,,,,',
			'Bad Email,,not-an-email,,,'
		].join('\n');
		const preview = previewVendorCsv(csv, [getVendor('1')!]);

		expect(preview.ignoredHeaders).toEqual(['Favourite colour']);
		expect(preview.toImport).toHaveLength(1);
		expect(preview.toImport[0]).toMatchObject({
			line: 2,
			input: { brandName: 'Juniper', instagram: '@juniper', category: 'Ceramics / Glass', tags: ['Returning', 'Handmade'] }
		});
		expect(preview.duplicates.map((row) => row.line)).toEqual([3, 4]);
		expect(preview.duplicates[0].reason).toContain('row 2');
		expect(preview.duplicates[1].reason).toContain('Acme Corporation');
		expect(preview.invalid.map((row) => row.line)).toEqual([5, 6, 7]);
	});
});
