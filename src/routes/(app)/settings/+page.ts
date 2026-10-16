import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Emails is the only settings section so far.
export const load: PageLoad = () => redirect(307, '/settings/emails');
