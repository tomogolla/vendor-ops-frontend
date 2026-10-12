<script lang="ts">
    import { page } from '$app/state';
    import CsvImportDialog from '#lib/components/CsvImportDialog.svelte';
    import VendorTable from '#lib/components/VendorTable.svelte';
    import { statusLabels, vendors, type VendorStatus } from '#lib/vendor-store.ts';

    const pipeline: VendorStatus[] = ['lead', 'applied', 'in_review', 'waitlisted'];
    type Filter = VendorStatus | 'all';

    const requested = $derived(page.url.searchParams.get('status'));
    const active: Filter = $derived(pipeline.find((status) => status === requested) ?? 'all');
    const inPipeline = $derived(
        $vendors
            .filter((vendor) => pipeline.includes(vendor.status))
            .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
    const rows = $derived(active === 'all' ? inPipeline : inPipeline.filter((vendor) => vendor.status === active));
    const tabs = $derived([
        { key: 'all' as Filter, label: 'All pipeline', count: inPipeline.length },
        ...pipeline.map((status) => ({
            key: status as Filter,
            label: statusLabels[status],
            count: inPipeline.filter((vendor) => vendor.status === status).length
        }))
    ]);

    let importDialog: CsvImportDialog | undefined = $state();
</script>

<svelte:head><title>Applications · Vendor Ops</title></svelte:head>

<div class="bg-base-100 w-full shadow-sm border border-base-200 rounded-lg">
    <header class="flex flex-wrap items-center justify-between gap-2 bg-[#f4f4f4] px-4 py-3">
        <h1 class="text-base font-bold">Applications</h1>
        <div class="flex gap-2">
            <button type="button" class="btn btn-outline btn-sm" onclick={() => importDialog?.showModal()}>
                Import CSV
            </button>
            <a href="/applications/new" class="btn btn-primary btn-sm text-xs font-semibold">New application</a>
        </div>
        <CsvImportDialog bind:this={importDialog} />
    </header>

    <div class="flex flex-col gap-2 p-2">
        <nav aria-label="Filter by status" class="tabs tabs-box tabs-sm w-fit flex-wrap">
            {#each tabs as tab (tab.key)}
                <a
                    href={tab.key === 'all' ? '/applications' : `/applications?status=${tab.key}`}
                    class={['tab gap-1', active === tab.key && 'tab-active']}
                    aria-current={active === tab.key ? 'page' : undefined}
                >
                    {tab.label} <span class="text-xs opacity-60">{tab.count}</span>
                </a>
            {/each}
        </nav>
        <div class="overflow-hidden rounded-lg border border-base-200">
            <VendorTable vendors={rows} emptyMessage="No applications with this status." />
        </div>
    </div>
</div>
