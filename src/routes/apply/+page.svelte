<script lang="ts">
	// Public page (no login): outside the (app) group, so it never loads the staff session or menu,
	// and it calls only /api/v1/public/.
	import { page } from '$app/state';
	import tgfLogo from '#lib/assets/tgf-logo.svg';
	import PublicApplicationForm from '#lib/components/PublicApplicationForm.svelte';
	import { CLOSED_MESSAGE, loadCatalog, readAttribution, type CatalogResult } from '#lib/public-application.ts';
	import { siteKey } from '#lib/turnstile.ts';

	let result = $state<CatalogResult | null>(null);
	let received = $state(false);
	const sitekey = siteKey();
	const attribution = readAttribution(page.url, typeof document === 'undefined' ? '' : document.referrer);

	function load() {
		result = null;
		loadCatalog().then((value) => (result = value));
	}
	$effect(load);
</script>

<svelte:head>
	<title>Apply to sell at The Good Flea</title>
	<meta name="description" content="Apply for a booth at The Good Flea market weekends." />
</svelte:head>

<main class="min-h-screen bg-base-200 px-4 py-8">
	<div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
		<header class="flex items-center gap-3">
			<img src={tgfLogo} alt="" class="h-10 w-10" />
			<div>
				<p class="text-sm text-base-content/70">The Good Flea</p>
				<h1 class="text-2xl font-bold">Apply for a booth</h1>
			</div>
		</header>

		<div class="card bg-base-100 border border-base-300 shadow-sm">
			<div class="card-body">
				{#if received}
					<div role="status" class="flex flex-col gap-2">
						<h2 class="text-xl font-semibold">Thank you! We received your application.</h2>
						<p>Our team will review it and get in touch soon, usually by phone or email.</p>
					</div>
				{:else if result === null}
					<p class="flex items-center gap-2 text-sm text-base-content/70" role="status"><span class="loading loading-spinner loading-sm"></span> Loading the form…</p>
				{:else if result.kind === 'closed'}
					<p role="status">{CLOSED_MESSAGE}</p>
				{:else if result.kind === 'error'}
					<div role="alert" class="flex flex-col items-start gap-2">
						<p>{result.message}</p>
						<button type="button" class="btn btn-sm" onclick={load}>Try again</button>
					</div>
				{:else}
					<p class="text-sm text-base-content/70">
						Tell us about your brand and the weekends you would like to join. It takes about two minutes.
					</p>
					<PublicApplicationForm
						catalog={result.catalog}
						{sitekey}
						{attribution}
						onreceived={() => {
							received = true;
							window.scrollTo({ top: 0 });
						}}
						onclosed={() => (result = { kind: 'closed' })}
					/>
				{/if}
			</div>
		</div>
	</div>
</main>
