import { describe, expect, it } from 'vitest';
import { centsToDollarsInput, formatMoney, parseDollars } from '#lib/format.ts';

describe('formatMoney', () => {
	it('formats integer cents as USD', () => {
		expect(formatMoney(30600)).toBe('$306.00');
		expect(formatMoney(0)).toBe('$0.00');
		expect(formatMoney(5)).toBe('$0.05');
		expect(formatMoney(123456789)).toBe('$1,234,567.89');
		expect(formatMoney(-3400)).toBe('-$34.00');
	});

	it('shows a dash for missing amounts', () => {
		expect(formatMoney(null)).toBe('—');
		expect(formatMoney(undefined)).toBe('—');
		expect(formatMoney(Number.NaN)).toBe('—');
	});
});

describe('parseDollars', () => {
	it.each([
		['150', 15000],
		['150.5', 15050],
		['150.05', 15005],
		['$1,250.50', 125050],
		[' $ 40 ', 4000],
		['.99', 99],
		['0', 0],
		['1,000', 100000]
	])('parses %j to %d cents', (text, cents) => {
		expect(parseDollars(text)).toBe(cents);
	});

	it.each(['', '  ', 'abc', '-5', '1.234', '1,00', '12.', '$', '1e3', '12,34.5'])('rejects %j', (text) => {
		expect(parseDollars(text)).toBeNull();
	});

	it('round-trips with centsToDollarsInput', () => {
		for (const cents of [0, 5, 99, 15000, 22500, 123456]) {
			expect(parseDollars(centsToDollarsInput(cents))).toBe(cents);
		}
		expect(centsToDollarsInput(4000)).toBe('40.00');
		expect(centsToDollarsInput(null)).toBe('');
	});
});
