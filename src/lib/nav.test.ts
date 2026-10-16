import { describe, expect, it } from 'vitest';
import { isActive, navItems } from '#lib/nav.ts';

describe('navigation', () => {
	it('lists the menu in order, without customers or payments', () => {
		expect(navItems.map((item) => item.label)).toEqual([
			'Overview', 'Applications', 'Vendors', 'Market weekends', 'Tasks', 'Finance', 'Settings'
		]);
		expect(navItems.filter((item) => item.showOpenTasks).map((item) => item.href)).toEqual(['/tasks']);
	});

	it('marks the current section active', () => {
		expect(isActive('/', '/')).toBe(true);
		expect(isActive('/vendors', '/')).toBe(false);
		expect(isActive('/applications/abc', '/applications')).toBe(true);
		expect(isActive('/applications-old', '/applications')).toBe(false);
	});
});
