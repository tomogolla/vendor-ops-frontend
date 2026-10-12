import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Old application URLs now live on the vendor profile.
export const load: PageLoad = ({ params }) => {
	redirect(308, `/vendors/${params.id}`);
};
