<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import AsyncState from '#lib/components/AsyncState.svelte';
	import WeekendForm from '#lib/components/WeekendForm.svelte';
	import { getWeekend, type MarketWeekend } from '#lib/catalog.ts';
	import { Resource } from '#lib/resource.svelte.ts';
	import { session } from '#lib/session.svelte.ts';

	let { data }: PageProps = $props();
	const weekend = new Resource<MarketWeekend>();
	$effect(() => {
		const id = data.id;
		weekend.load(() => getWeekend(id));
	});
</script>

<svelte:head><title>Edit {weekend.data?.label ?? 'weekend'} · Vendor Ops</title></svelte:head>

<div class="mx-auto flex max-w-4xl flex-col gap-4 p-2">
	<AsyncState resource={weekend} label="Loading weekend…">
		{#snippet children(current)}
			<header class="flex items-center justify-between">
				<h1 class="text-lg font-bold">Edit {current.label}</h1>
				<a href={`/market-weekends/${current.id}`} class="link text-sm">Back to weekend</a>
			</header>
			{#if session.isAdmin}
				{#key current.id}
					<WeekendForm initial={current} cancelHref={`/market-weekends/${current.id}`} onsaved={(id) => goto(`/market-weekends/${id}`)} />
				{/key}
			{:else}
				<p role="alert" class="alert alert-warning text-sm">Only administrators can edit market weekends.</p>
			{/if}
		{/snippet}
		{#snippet notFound()}
			<p class="text-sm">There is no market weekend with ID {data.id}. <a class="link" href="/market-weekends">Back to weekends</a></p>
		{/snippet}
	</AsyncState>
</div>
