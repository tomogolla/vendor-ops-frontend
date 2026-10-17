// The public form rendered with Svelte's server renderer against the captured weekends payload.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import PublicApplicationForm from '#lib/components/PublicApplicationForm.svelte';
import { CONSENT_TEXT, fromApiCatalog } from '#lib/public-application.ts';
import fixture from '#lib/fixtures/public-application.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const html = (props: Record<string, unknown>): string => render(PublicApplicationForm as any, { props }).body;
const catalog = fromApiCatalog(fixture.weekends);
const base = { catalog, attribution: {}, onreceived: () => {}, onclosed: () => {} };

describe('public application form', () => {
	it('asks for every field, the weekends, a booth size and consent', () => {
		const body = html({ ...base, sitekey: '1x00000000000000000000AA' });
		for (const label of ['First name', 'Last name', 'Email', 'Phone', 'Brand or business name', 'Instagram']) expect(body).toContain(label);
		expect(body).toContain('Oct 17 &amp; 18');
		expect(body).toContain('November 12 &amp; 13');
		expect(body).toContain('Not sure yet');
		expect(body).toContain(CONSENT_TEXT);
		expect(body).toContain('aria-label="Verification check"');
		expect(body).toMatch(/<button type="submit"[^>]*>[\s\S]*Send application/);
		expect(body).not.toMatch(/<button type="submit"[^>]*disabled/);
	});

	it('hides the honeypot from people and assistive technology', () => {
		const body = html({ ...base, sitekey: '1x00000000000000000000AA' });
		expect(body).toMatch(/<div class="absolute -left-\[9999px\][^"]*" aria-hidden="true">[\s\S]*?name="website" type="text" tabindex="-1" autocomplete="off"/);
	});

	it('cannot be sent without a site key', () => {
		const body = html({ ...base, sitekey: null });
		expect(body).toContain('The form is not available right now');
		expect(body).toMatch(/<button type="submit"[^>]*disabled/);
		expect(body).not.toContain('Verification check');
	});

	it('shows no prices, capacities or other vendors', () => {
		expect(html({ ...base, sitekey: '1x00000000000000000000AA' })).not.toMatch(/\$\d|capacity|remaining|spots left/i);
	});
});
