import { describe, expect, it } from 'vitest';
import { capacityAlerts, capacityDisplay, fromApiWeekend } from '#lib/catalog.ts';
import suggestionFixture from '#lib/fixtures/weekend-with-suggestion.json';
import weekendsFixture from '#lib/fixtures/weekends-page.json';

const weekends = weekendsFixture.results.map(fromApiWeekend);

describe('catalog mapping (captured payloads)', () => {
	it('maps weekends, variants and add-ons', () => {
		const [oct10] = weekends;
		expect(oct10).toMatchObject({ label: 'Oct 10 & 11', startDate: '2026-10-10', endDate: '2026-10-11', status: 'OPEN', currency: 'USD' });
		expect(oct10.variants[0]).toMatchObject({
			name: '8ft x 8ft',
			dimensions: '8 x 8 ft',
			priceCents: 15000,
			capacity: 2,
			confirmed: 2,
			remaining: 0,
			waitlisted: 1,
			weekendId: oct10.id
		});
		expect(oct10.addOns[0]).toMatchObject({ name: 'Tent rental', priceCents: 4000, capacity: 3, remaining: 2 });
		const table = weekends[1].addOns.find((addOn) => addOn.name === 'Table');
		expect(table).toMatchObject({ capacity: null, remaining: null });
	});

	it('maps promotion suggestions', () => {
		const weekend = fromApiWeekend(suggestionFixture);
		expect(weekend.variants[0].suggestions).toEqual([
			expect.objectContaining({ brandName: 'Second Spin Records', quantity: 1, fits: true })
		]);
		expect(weekend.variants[0].remaining).toBe(1);
	});
});

describe('capacity display', () => {
	it('reports remaining spots and percent used', () => {
		expect(capacityDisplay({ capacity: 4, confirmed: 1, remaining: 3, waitlisted: 0 })).toMatchObject({
			percentUsed: 25,
			text: '1 of 4 confirmed · 3 left',
			tone: 'ok'
		});
		expect(capacityDisplay({ capacity: 2, confirmed: 2, remaining: 0, waitlisted: 1 })).toMatchObject({
			percentUsed: 100,
			tone: 'full'
		});
		expect(capacityDisplay({ capacity: 3, confirmed: 1, remaining: 2, waitlisted: 0 }).tone).toBe('low');
	});

	it('handles unlimited add-ons and zero capacity', () => {
		expect(capacityDisplay({ capacity: null, confirmed: 7, remaining: null, waitlisted: 0 })).toMatchObject({
			unlimited: true,
			percentUsed: 0,
			text: '7 confirmed · no limit'
		});
		expect(capacityDisplay({ capacity: 0, confirmed: 0, remaining: 0, waitlisted: 0 })).toMatchObject({
			percentUsed: 100,
			tone: 'full'
		});
	});

	it('raises alerts for low capacity and waitlists', () => {
		const alerts = capacityAlerts(weekends).map((alert) => `${alert.weekend.label}: ${alert.productName}`);
		expect(alerts).toContain('Oct 10 & 11: 8ft x 8ft');
		expect(alerts).toContain('Oct 10 & 11: Tent rental');
		expect(alerts).not.toContain('Oct 17 & 18: 8ft x 8ft');
		expect(alerts).not.toContain('Oct 17 & 18: Table');
	});
});
