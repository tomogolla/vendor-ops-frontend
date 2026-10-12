import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Old application URLs now live on the vendor profile. SSR is re-enabled here (the root
// layout disables it) so the redirect happens on the server, not only after hydration.
export const ssr = true;

export const load: PageServerLoad = ({ params }) => {
	redirect(308, `/vendors/${params.id}`);
};
