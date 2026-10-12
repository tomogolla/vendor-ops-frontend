<script lang="ts">
    import { page } from '$app/state';
    import VendorTable from '#lib/components/VendorTable.svelte';
    import { vendors } from '#lib/vendor-store.ts';

    const filters = [
        { key: 'approved', label: 'Approved' },
        { key: 'suspended', label: 'Suspended' },
        { key: 'all', label: 'All' }
    ] as const;
    type Filter = (typeof filters)[number]['key'];

    const requested = $derived(page.url.searchParams.get('status'));
    const active: Filter = $derived(filters.find((filter) => filter.key === requested)?.key ?? 'approved');
    const sorted = $derived($vendors.toSorted((a, b) => a.brandName.localeCompare(b.brandName)));
    const countFor = (key: Filter) =>
        key === 'all' ? sorted.length : sorted.filter((vendor) => vendor.status === key).length;
    const rows = $derived(active === 'all' ? sorted : sorted.filter((vendor) => vendor.status === active));
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
                    class={['tab gap-1', active === filter.key && 'tab-active']}
                    aria-current={active === filter.key ? 'page' : undefined}
                >
                    {filter.label} <span class="text-xs opacity-60">{countFor(filter.key)}</span>
                </a>
            {/each}
        </nav>
        <div class="overflow-hidden rounded-lg border border-base-200">
            <VendorTable vendors={rows} emptyMessage="No vendors with this status." />
        </div>
    </div>
</div>
