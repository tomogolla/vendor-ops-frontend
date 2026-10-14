<script lang="ts">
    import { page } from '$app/state';
    import AsyncState from '#lib/components/AsyncState.svelte';
    import CsvImportDialog from '#lib/components/CsvImportDialog.svelte';
    import VendorTable from '#lib/components/VendorTable.svelte';
    import type { Page, Query } from '#lib/api.ts';
    import { Resource } from '#lib/resource.svelte.ts';
    import { session } from '#lib/session.svelte.ts';
    import { countVendors, listVendors, statusLabels, type Vendor, type VendorStatus } from '#lib/vendor-store.ts';

    const pipeline: VendorStatus[] = ['lead', 'applied', 'in_review', 'waitlisted'];
    const PIPELINE = pipeline.join(',');
    const PAGE_SIZE = 100;
    type Tab = { key: string; label: string; href: string; query: Query };

    const statusTabs: Tab[] = [
        { key: 'all', label: 'All pipeline', href: '/applications', query: { status: PIPELINE } },
        ...pipeline.map((status) => ({
            key: status,
            label: statusLabels[status],
            href: `/applications?status=${status}`,
            query: { status }
        }))
    ];
    const callTabs: Tab[] = [
        { key: 'call-due', label: 'To call', href: '/applications?call=due', query: { status: PIPELINE, call: 'due' } },
        { key: 'call-none', label: 'Not called', href: '/applications?call=none', query: { status: PIPELINE, call: 'none' } }
    ];
    const allTabs = [...statusTabs, ...callTabs];

    const activeKey = $derived.by(() => {
        const call = page.url.searchParams.get('call');
        if (call === 'due' || call === 'none') return `call-${call}`;
        const status = page.url.searchParams.get('status');
        return pipeline.find((item) => item === status) ?? 'all';
    });
    const activeTab = $derived(allTabs.find((tab) => tab.key === activeKey) ?? statusTabs[0]);

    const rows = new Resource<Page<Vendor>>();
    let counts = $state<Record<string, number>>({});

    function loadCounts() {
        Promise.all(allTabs.map(async (tab) => [tab.key, await countVendors(tab.query)] as const))
            .then((entries) => (counts = Object.fromEntries(entries)))
            .catch(() => (counts = {}));
    }

    function reloadAll() {
        rows.retry();
        loadCounts();
    }

    $effect(() => {
        const query = { ...activeTab.query, ordering: '-created_at', page_size: PAGE_SIZE };
        rows.load(() => listVendors(query));
    });
    $effect(loadCounts);

    let importDialog: CsvImportDialog | undefined = $state();
</script>

<svelte:head><title>Applications · Vendor Ops</title></svelte:head>

<div class="bg-base-100 w-full shadow-sm border border-base-200">
    <header class="flex flex-wrap items-center justify-between gap-2 bg-[#f4f4f4] px-4 py-3">
        <h1 class="text-base font-bold">Applications</h1>
        <div class="flex gap-2">
            {#if session.isAdmin}
                <button type="button" class="btn btn-outline btn-sm rounded-none border-[#35B2B2] text-[#35B2B2] hover:bg-[#35B2B2] hover:border-[#35B2B2] hover:text-white" onclick={() => importDialog?.showModal()}>
                    Import CSV
                </button>
            {/if}
            <a href="/applications/new" class="btn btn-sm rounded-none border-none bg-[#35B2B2] text-white text-xs font-semibold hover:bg-[#2a8e8e]">New application</a>
        </div>
        {#if session.isAdmin}
            <CsvImportDialog bind:this={importDialog} onimported={reloadAll} />
        {/if}
    </header>

    <div class="flex flex-col gap-2 p-2">
        {#snippet tabList(label: string, tabs: Tab[])}
            <nav aria-label={label} class="tabs tabs-box tabs-xs w-fit flex-wrap">
                {#each tabs as tab (tab.key)}
                    <a
                        href={tab.href}
                        class={['tab gap-1', activeKey === tab.key && 'tab-active']}
                        aria-current={activeKey === tab.key ? 'page' : undefined}
                    >
                        {tab.label} <span class="text-xs opacity-60">{counts[tab.key] ?? ''}</span>
                    </a>
                {/each}
            </nav>
        {/snippet}
        <div class="flex flex-wrap items-center gap-2">
            {@render tabList('Filter by status', statusTabs)}
            {@render tabList('Filter by call status', callTabs)}
        </div>
        <AsyncState resource={rows} label="Loading applications…">
            {#snippet children(result)}
                <div class="overflow-hidden border border-base-200">
                    <VendorTable vendors={result.results} emptyMessage="No applications match this filter." />
                </div>
                {#if result.count > result.results.length}
                    <p class="mt-2 text-xs text-base-content/60">Showing the newest {result.results.length} of {result.count}.</p>
                {/if}
            {/snippet}
        </AsyncState>
    </div>
</div>
