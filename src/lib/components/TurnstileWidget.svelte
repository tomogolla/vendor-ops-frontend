<script lang="ts">
	import { loadTurnstile, widgetOptions, type TurnstileApi } from '#lib/turnstile.ts';

	type Props = {
		sitekey: string;
		/** The current token, or null when there is none (not solved yet, expired, failed or reset). */
		ontoken: (token: string | null) => void;
	};
	let { sitekey, ontoken }: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let problem = $state('');
	let api: TurnstileApi | null = null;
	let widgetId: string | null = null;

	$effect(() => {
		const element = container;
		if (!element) return;
		let cancelled = false;
		loadTurnstile()
			.then((turnstile) => {
				if (cancelled) return;
				api = turnstile;
				widgetId = turnstile.render(element, widgetOptions(sitekey, (token) => {
					if (token) problem = '';
					ontoken(token);
				}, (message) => (problem = message)));
			})
			.catch(() => (problem = 'The verification check could not load. Check your connection or ad blocker, then reload the page.'));
		return () => {
			cancelled = true;
			if (api && widgetId) api.remove(widgetId);
			widgetId = null;
		};
	});

	/** A token can be verified only once: after any failed submission, ask for a new one. */
	export function reset() {
		ontoken(null);
		if (api && widgetId) api.reset(widgetId);
	}
</script>

<div class="flex flex-col gap-1">
	<div bind:this={container} class="min-h-[65px]" aria-label="Verification check"></div>
	{#if problem}<p role="alert" class="text-sm text-error">{problem}</p>{/if}
</div>
