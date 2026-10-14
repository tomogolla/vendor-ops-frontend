<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AsyncState from '#lib/components/AsyncState.svelte';
	import VendorTable from '#lib/components/VendorTable.svelte';
	import type { Page, Query } from '#lib/api.ts';
	import { Resource } from '#lib/resource.svelte.ts';
	import { countVendors, listVendors, type Vendor } from '#lib/vendor-store.ts';

	const PAGE_SIZE = 100;
	// Labels are derived and filtered by the API (Vendor.label); nothing is computed here.
	const tabs: { key: string; label: string; query: Query }[] = [
		{ key: 'active', label: 'Active', query: { label: 'active' } },
		{ key: 'prospect', label: 'Prospects', query: { label: 'prospect' } },
		{ key: 'suspended', label: 'Suspended', query: { label: 'suspended' } },
		{ key: 'inactive', label: 'Inactive', query: { label: 'inactive' } },
		{ key: 'all', label: 'All', query: {} }
	];

	const params = $derived(page.url.searchParams);
	const active = $derived(tabs.find((tab) => tab.key === params.get('label')) ?? tabs[0]);
	const search = $derived(params.get('q') ?? '');

	function href(tabKey: string, q = search) {
		const next = new URLSearchParams();
		if (tabKey !== 'active') next.set('label', tabKey);
		if (q.trim()) next.set('q', q.trim());
		const text = next.toString();
		return text ? `/vendors?${text}` : '/vendors';
	}

	const rows = new Resource<Page<Vendor>>();
	let counts = $state<Record<string, number>>({});

	$effect(() => {
		const query = { ...active.query, search: search || undefined, ordering: 'brand_name', page_size: PAGE_SIZE };
		rows.load(() => listVendors(query));
	});
	$effect(() => {
		const q = search || undefined;
		Promise.all(tabs.map(async (tab) => [tab.key, await countVendors({ ...tab.query, search: q })] as const))
			.then((entries) => (counts = Object.fromEntries(entries)))
			.catch(() => (counts = {}));
	});

	let searchText = $state('');
	$effect(() => {
		searchText = search;
	});
</script>

<svelte:head><title>Vendors · Vendor Ops</title></svelte:head>

<div class="bg-base-100 w-full shadow-sm border border-base-200 rounded-lg">
	<header class="flex flex-wrap items-center justify-between gap-2 bg-[#f4f4f4] px-4 py-3">
		<h1 class="text-base font-bold">Vendors</h1>
		<!-- Every entry starts as an application at New, so adding a vendor goes through the application form. -->
		<a href="/applications/new" class="btn btn-primary btn-sm text-xs font-semibold">Add vendor</a>
	</header>
	<div class="flex flex-col gap-2 p-2">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<nav aria-label="Filter by label" class="tabs tabs-box tabs-sm w-fit">
				{#each tabs as tab (tab.key)}
					<a href={href(tab.key)} class={['tab gap-1', active.key === tab.key && 'tab-active']} aria-current={active.key === tab.key ? 'page' : undefined}>
						{tab.label} <span class="text-xs opacity-60">{counts[tab.key] ?? ''}</span>
					</a>
				{/each}
			</nav>
			<form role="search" class="flex items-center gap-1" onsubmit={(event) => { event.preventDefault(); goto(href(active.key, searchText), { reset: false }); }}>
				<label class="sr-only" for="vendor-search">Search vendors</label>
				<input id="vendor-search" type="search" class="input input-sm w-56" placeholder="Brand, name, email, phone, Instagram" bind:value={searchText} />
				<button type="submit" class="btn btn-sm">Search</button>
				{#if search}<a class="link text-xs" href={href(active.key, '')}>Clear</a>{/if}
			</form>
		</div>
		<AsyncState resource={rows} label="Loading vendors…">
			{#snippet children(result)}
				<div class="overflow-hidden rounded-lg border border-base-200">
					<VendorTable vendors={result.results} emptyMessage={search ? 'No vendors match this search.' : 'No vendors with this label.'} />
				</div>
				{#if result.count > result.results.length}
					<p class="mt-2 text-xs text-base-content/60">Showing {result.results.length} of {result.count}.</p>
				{/if}
			{/snippet}
		</AsyncState>
	</div>
</div>
