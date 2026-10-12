import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	return {
		plugins: [
			tailwindcss(),
			sveltekit({
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				// Single-page app: nginx serves build/ and falls back to index.html; /api goes to Django.
				adapter: adapter({ fallback: 'index.html' })
			})
		],
		server: {
			// Same-origin API in development so the Django session and CSRF cookies just work.
			proxy: { '/api': { target: env.API_PROXY_TARGET || 'http://localhost:8000', changeOrigin: false } }
		}
	};
});
