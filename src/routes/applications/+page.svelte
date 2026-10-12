<script lang="ts">
    import { page } from '$app/state';
    import CsvImportDialog from '#lib/components/CsvImportDialog.svelte';
    import VendorTable from '#lib/components/VendorTable.svelte';
    import {
        needsCall,
        neverCalled,
        statusLabels,
        vendors,
        type Vendor,
        type VendorStatus
    } from '#lib/vendor-store.ts';

    const pipeline: VendorStatus[] = ['lead', 'applied', 'in_review', 'waitlisted'];
    type Tab = { key: string; label: string; href: string; match: (vendor: Vendor) => boolean };

    const statusTabs: Tab[] = [
        { key: 'all', label: 'All pipeline', href: '/applications', match: () => true },
        ...pipeline.map((status) => ({
            key: status,
            label: statusLabels[status],
            href: `/applications?status=${status}`,
            match: (vendor: Vendor) => vendor.status === status
        }))
    ];
    const callTabs: Tab[] = [
        { key: 'call-due', label: 'To call', href: '/applications?call=due', match: needsCall },
        { key: 'call-none', label: 'Not called', href: '/applications?call=none', match: neverCalled }
    ];
    const allTabs = [...statusTabs, ...callTabs];

    const activeKey = $derived.by(() => {
        const call = page.url.searchParams.get('call');
        if (call === 'due' || call === 'none') return `call-${call}`;
        const status = page.url.searchParams.get('status');
        return pipeline.find((item) => item === status) ?? 'all';
    });
    const inPipeline = $derived(
        $vendors
            .filter((vendor) => pipeline.includes(vendor.status))
            .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
    const activeTab = $derived(allTabs.find((tab) => tab.key === activeKey) ?? statusTabs[0]);
    const rows = $derived(inPipeline.filter(activeTab.match));
    const count = (tab: Tab) => inPipeline.filter(tab.match).length;

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
        {#snippet tabList(label: string, tabs: Tab[])}
            <nav aria-label={label} class="tabs tabs-box tabs-sm w-fit flex-wrap">
                {#each tabs as tab (tab.key)}
                    <a
                        href={tab.href}
                        class={['tab gap-1', activeKey === tab.key && 'tab-active']}
                        aria-current={activeKey === tab.key ? 'page' : undefined}
                    >
                        {tab.label} <span class="text-xs opacity-60">{count(tab)}</span>
                    </a>
                {/each}
            </nav>
        {/snippet}
        <div class="flex flex-wrap items-center gap-2">
            {@render tabList('Filter by status', statusTabs)}
            {@render tabList('Filter by call status', callTabs)}
        </div>
        <div class="overflow-hidden rounded-lg border border-base-200">
            <VendorTable vendors={rows} emptyMessage="No applications match this filter." />
        </div>
    </div>
</div>
