import { redirect } from '@sveltejs/kit';
import { session } from '#lib/session.svelte.ts';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
	const user = await session.load();
	if (!user) redirect(307, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
	return { user };
};
