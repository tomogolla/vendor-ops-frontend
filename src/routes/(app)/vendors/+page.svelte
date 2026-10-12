<script lang="ts">
    import { page } from '$app/state';
    import AsyncState from '#lib/components/AsyncState.svelte';
    import VendorTable from '#lib/components/VendorTable.svelte';
    import type { Page, Query } from '#lib/api.ts';
    import { Resource } from '#lib/resource.svelte.ts';
    import { countVendors, listVendors, type Vendor } from '#lib/vendor-store.ts';

    const PAGE_SIZE = 100;
    const filters: { key: 'approved' | 'suspended' | 'all'; label: string; query: Query }[] = [
        { key: 'approved', label: 'Approved', query: { status: 'approved' } },
        { key: 'suspended', label: 'Suspended', query: { status: 'suspended' } },
        { key: 'all', label: 'All', query: {} }
    ];

    const requested = $derived(page.url.searchParams.get('status'));
    const active = $derived(filters.find((filter) => filter.key === requested) ?? filters[0]);

    const rows = new Resource<Page<Vendor>>();
    let counts = $state<Record<string, number>>({});

    $effect(() => {
        const query = { ...active.query, ordering: 'brand_name', page_size: PAGE_SIZE };
        rows.load(() => listVendors(query));
    });
    $effect(() => {
        Promise.all(filters.map(async (filter) => [filter.key, await countVendors(filter.query)] as const))
            .then((entries) => (counts = Object.fromEntries(entries)))
            .catch(() => (counts = {}));
    });
</script>

<svelte:head><title>Vendors · Vendor Ops</title></svelte:head>

<div class="bg-base-100 w-full shadow-sm border border-base-200 rounded-lg">
    <header class="flex flex-wrap items-center justify-between gap-2 bg-[#f4f4f4] px-4 py-3">
        <h1 class="text-base font-bold">Vendors</h1>
    </header>
    <div class="flex flex-col gap-2 p-2">
        <nav aria-label="Filter by status" class="tabs tabs-box tabs-sm w-fit">
            {#each filters as filter (filter.key)}
                <a
                    href={filter.key === 'approved' ? '/vendors' : `/vendors?status=${filter.key}`}
                    class={['tab gap-1', active.key === filter.key && 'tab-active']}
                    aria-current={active.key === filter.key ? 'page' : undefined}
                >
                    {filter.label} <span class="text-xs opacity-60">{counts[filter.key] ?? ''}</span>
                </a>
            {/each}
        </nav>
        <AsyncState resource={rows} label="Loading vendors…">
            {#snippet children(result)}
                <div class="overflow-hidden rounded-lg border border-base-200">
                    <VendorTable vendors={result.results} emptyMessage="No vendors with this status." />
                </div>
                {#if result.count > result.results.length}
                    <p class="mt-2 text-xs text-base-content/60">Showing {result.results.length} of {result.count}.</p>
                {/if}
            {/snippet}
        </AsyncState>
    </div>
</div>
