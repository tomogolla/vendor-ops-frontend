<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ApplicationCard from '#lib/components/ApplicationCard.svelte';
	import AsyncState from '#lib/components/AsyncState.svelte';
	import CsvImportDialog from '#lib/components/CsvImportDialog.svelte';
	import StageBadge from '#lib/components/StageBadge.svelte';
	import type { Page, Query } from '#lib/api.ts';
	import {
		ALL_STAGES,
		BOARD_STAGES,
		callFilterLabels,
		CLOSED_STAGES,
		daysInStage,
		filtersFromParams,
		filtersHref,
		filtersToQuery,
		getSummary,
		isIncompleteApplication,
		listApplications,
		stageLabels,
		SUPPORTED_CALL_FILTERS,
		type Application,
		type ApplicationSummary,
		type BoardFilters,
		type CallFilter,
		type Stage
	} from '#lib/applications.ts';
	import { formatDateTime, formatMoney } from '#lib/format.ts';
	import { leadSources } from '#lib/options.ts';
	import { Resource } from '#lib/resource.svelte.ts';
	import { session } from '#lib/session.svelte.ts';

	// No drag-and-drop: stage changes go through the application page so line rules cannot be bypassed.
	const COLUMN_SIZE = 50;
	const TABLE_SIZE = 50;
	const sources = [...new Set(['Staff entry', 'CSV import', ...leadSources])];

	const params = $derived(page.url.searchParams);
	const view = $derived(params.get('view') === 'table' ? 'table' : 'board');
	const filters = $derived(filtersFromParams(params));
	const filterQuery = $derived(filtersToQuery(filters));
	const tableStages = $derived(
		(params.get('stage') ?? '').split(',').filter((stage): stage is Stage => (ALL_STAGES as string[]).includes(stage))
	);
	const tablePage = $derived(Math.max(1, Number(params.get('page')) || 1));

	const summary = new Resource<ApplicationSummary>();
	const columns = Object.fromEntries(BOARD_STAGES.map((stage) => [stage, new Resource<Page<Application>>()])) as Record<
		Stage,
		Resource<Page<Application>>
	>;
	const closed = new Resource<Page<Application>>();
	const table = new Resource<Page<Application>>();
	let closedOpen = $state(false);

	function loadAll() {
		const query: Query = filterQuery.query;
		summary.load(() => getSummary(query));
		if (view === 'board') {
			for (const stage of BOARD_STAGES) {
				columns[stage].load(() =>
					listApplications({ ...query, stage, ordering: 'stage_entered_at', page_size: COLUMN_SIZE })
				);
			}
			if (closedOpen) {
				closed.load(() =>
					listApplications({ ...query, stage: CLOSED_STAGES.join(','), ordering: '-stage_entered_at', page_size: COLUMN_SIZE })
				);
			}
		} else {
			const stage = (tableStages.length ? tableStages : BOARD_STAGES).join(',');
			const pageNumber = tablePage;
			table.load(() =>
				listApplications({ ...query, stage, ordering: '-submitted_at', page_size: TABLE_SIZE, page: pageNumber })
			);
		}
	}
	$effect(loadAll);

	function hrefWith(changes: Record<string, string>) {
		const next = new URLSearchParams(params.toString());
		for (const [key, value] of Object.entries(changes)) {
			if (value) next.set(key, value);
			else next.delete(key);
		}
		const text = next.toString();
		return text ? `/applications?${text}` : '/applications';
	}

	function applyFilters(patch: Partial<BoardFilters>) {
		goto(filtersHref(params, { ...filters, ...patch }), { reset: false });
	}

	const hasFilters = $derived(Boolean(filters.source || filters.owner || filters.waitlisted || filters.call));
	let importDialog: CsvImportDialog | undefined = $state();
</script>

<svelte:head><title>Applications · Vendor Ops</title></svelte:head>

<div class="bg-base-100 w-full shadow-sm border border-base-200 rounded-lg">
	<header class="flex flex-wrap items-center justify-between gap-2 bg-[#f4f4f4] px-4 py-3">
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-base font-bold">Applications</h1>
			<nav aria-label="View" class="tabs tabs-box tabs-xs">
				<a href={hrefWith({ view: '', stage: '', page: '' })} class={['tab', view === 'board' && 'tab-active']} aria-current={view === 'board' ? 'page' : undefined}>Board</a>
				<a href={hrefWith({ view: 'table', page: '' })} class={['tab', view === 'table' && 'tab-active']} aria-current={view === 'table' ? 'page' : undefined}>Table</a>
			</nav>
		</div>
		<div class="flex gap-2">
			{#if session.isAdmin}
				<button type="button" class="btn btn-outline btn-sm" onclick={() => importDialog?.showModal()}>Import CSV</button>
			{/if}
			<a href="/applications/new" class="btn btn-primary btn-sm text-xs font-semibold">New application</a>
		</div>
		{#if session.isAdmin}
			<CsvImportDialog bind:this={importDialog} onimported={loadAll} />
		{/if}
	</header>

	<div class="flex flex-col gap-3 p-2">
		<form class="flex flex-wrap items-end gap-3 text-sm" aria-label="Filter applications" onsubmit={(event) => event.preventDefault()}>
			<div class="flex flex-col gap-1">
				<label class="text-xs font-medium" for="filter-source">Source</label>
				<select id="filter-source" class="select select-sm w-44" value={filters.source} onchange={(event) => applyFilters({ source: event.currentTarget.value })}>
					<option value="">Any source</option>
					{#each sources as source (source)}<option value={source}>{source}</option>{/each}
				</select>
			</div>
			<div class="flex flex-col gap-1">
				<label class="text-xs font-medium" for="filter-owner">Owner</label>
				<select id="filter-owner" class="select select-sm w-36" value={filters.owner} onchange={(event) => applyFilters({ owner: event.currentTarget.value as BoardFilters['owner'] })}>
					<option value="">Anyone</option>
					<option value="me">Mine</option>
					<option value="none">Unassigned</option>
				</select>
			</div>
			<div class="flex flex-col gap-1">
				<label class="text-xs font-medium" for="filter-call">Call state</label>
				<select id="filter-call" class="select select-sm w-52" value={filters.call} onchange={(event) => applyFilters({ call: event.currentTarget.value as CallFilter | '' })}>
					<option value="">Any</option>
					{#each Object.entries(callFilterLabels) as [value, label] (value)}
						{@const supported = SUPPORTED_CALL_FILTERS.includes(value as CallFilter)}
						<option {value} disabled={!supported}>{label}{supported ? '' : ' (not available yet)'}</option>
					{/each}
				</select>
			</div>
			<label class="label cursor-pointer gap-2 pb-1 text-xs text-base-content">
				<input type="checkbox" class="checkbox checkbox-xs" checked={filters.waitlisted} onchange={(event) => applyFilters({ waitlisted: event.currentTarget.checked })} />
				Has waitlisted lines
			</label>
			{#if hasFilters}
				<a class="link pb-1 text-xs" href={filtersHref(params, { source: '', owner: '', waitlisted: false, call: '' })}>Clear filters</a>
			{/if}
		</form>

		{#if filterQuery.unsupported.length}
			<p role="status" class="alert alert-warning alert-soft text-xs">
				The server cannot filter by {filterQuery.unsupported.join(', ')} yet, so that filter is not applied.
			</p>
		{/if}

		{#if view === 'board'}
			<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
				{#each BOARD_STAGES as stage (stage)}
					{@const column = columns[stage]}
					<section class="flex flex-col gap-2 rounded-lg bg-base-200/60 p-2" aria-labelledby={`column-${stage}`}>
						<header class="flex items-center justify-between px-1">
							<h2 id={`column-${stage}`} class="text-sm font-semibold">{stageLabels[stage]}</h2>
							<span class="badge badge-sm">{summary.data?.stages[stage] ?? '…'}</span>
						</header>
						<AsyncState resource={column} label={`Loading ${stageLabels[stage].toLowerCase()}…`}>
							{#snippet children(result)}
								<div class="flex flex-col gap-2">
									{#each result.results as application (application.id)}
										<ApplicationCard {application} />
									{:else}
										<p class="px-1 text-xs text-base-content/60">Nothing here.</p>
									{/each}
								</div>
								{#if result.count}
									<p class="mt-2 px-1 text-[11px] text-base-content/60">
										Showing {result.results.length} of {result.count}{#if result.count > result.results.length}
											· <a class="link" href={hrefWith({ view: 'table', stage, page: '' })}>see all in the table</a>{/if}
									</p>
								{/if}
							{/snippet}
						</AsyncState>
					</section>
				{/each}
			</div>

			<details class="rounded-lg border border-base-200" ontoggle={(event) => { closedOpen = event.currentTarget.open; if (closedOpen) loadAll(); }}>
				<summary class="cursor-pointer px-3 py-2 text-sm font-semibold">
					Closed (declined and withdrawn)
					<span class="badge badge-sm ml-1">{summary.data ? summary.data.stages.DECLINED + summary.data.stages.WITHDRAWN : '…'}</span>
				</summary>
				<!-- TODO(decision): declined cards. Declined and withdrawn are provisional; they stay collapsed here. -->
				{#if closedOpen}
					<div class="p-2">
						<AsyncState resource={closed} label="Loading closed applications…">
							{#snippet children(result)}
								<div class="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
									{#each result.results as application (application.id)}
										<div class="flex flex-col gap-1">
											<StageBadge stage={application.stage} />
											<ApplicationCard {application} />
										</div>
									{:else}
										<p class="text-xs text-base-content/60">No closed applications.</p>
									{/each}
								</div>
								{#if result.count > result.results.length}
									<p class="mt-2 text-[11px] text-base-content/60">
										Showing {result.results.length} of {result.count} ·
										<a class="link" href={hrefWith({ view: 'table', stage: CLOSED_STAGES.join(','), page: '' })}>see all in the table</a>
									</p>
								{/if}
							{/snippet}
						</AsyncState>
					</div>
				{/if}
			</details>
		{:else}
			<div class="flex flex-wrap items-center gap-2 text-xs">
				<span class="font-medium">Stages:</span>
				<a href={hrefWith({ stage: '', page: '' })} class={['badge', !tableStages.length ? 'badge-primary' : 'badge-ghost']}>Open</a>
				{#each ALL_STAGES as stage (stage)}
					{@const selected = tableStages.length === 1 && tableStages[0] === stage}
					<a href={hrefWith({ stage, page: '' })} class={['badge', selected ? 'badge-primary' : 'badge-ghost']} aria-current={selected ? 'true' : undefined}>
						{stageLabels[stage]} <span class="opacity-60">{summary.data?.stages[stage] ?? ''}</span>
					</a>
				{/each}
			</div>
			<AsyncState resource={table} label="Loading applications…">
				{#snippet children(result)}
					<div class="overflow-x-auto rounded-lg border border-base-200">
						<table class="table table-zebra table-sm w-full text-left">
							<thead class="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-base-300">
								<tr>
									<th>Brand</th><th>Stage</th><th>In stage</th><th>Source</th><th>Category</th>
									<th>Calls</th><th>Next task</th><th>Confirmed total</th><th>Flags</th>
								</tr>
							</thead>
							<tbody>
								{#each result.results as application (application.id)}
									{@const days = daysInStage(application)}
									<tr class="hover">
										<td class="font-semibold"><a href={`/applications/${application.id}`} class="hover:underline">{application.vendorBrand}</a></td>
										<td><StageBadge stage={application.stage} /></td>
										<td class="whitespace-nowrap">{days === null ? '—' : `${days} d`}</td>
										<td>{application.source || '—'}</td>
										<td>{application.category || '—'}</td>
										<td>{application.callAttempts}</td>
										<td class="whitespace-nowrap">{application.nextTaskDueAt ? formatDateTime(application.nextTaskDueAt) : '—'}</td>
										<td class="whitespace-nowrap">{formatMoney(application.totals.confirmedTotalCents, application.totals.currency)}</td>
										<td>
											<div class="flex flex-wrap gap-1">
												{#if application.hasWaitlistedLines}<span class="badge badge-xs badge-secondary badge-outline">Waitlisted line</span>{/if}
												{#if application.callExhausted}<span class="badge badge-xs badge-error badge-outline">Call exhausted</span>{/if}
												{#if isIncompleteApplication(application)}<span class="badge badge-xs badge-warning">Incomplete</span>{/if}
											</div>
										</td>
									</tr>
								{:else}
									<tr><td colspan="9" class="py-6 text-center text-sm text-base-content/60">No applications match these filters.</td></tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-base-content/60">
						<p>
							Showing {result.results.length ? (tablePage - 1) * TABLE_SIZE + 1 : 0}–{(tablePage - 1) * TABLE_SIZE + result.results.length}
							of {result.count}
						</p>
						<div class="join">
							{#if result.previous}<a class="btn btn-xs join-item" href={hrefWith({ page: String(tablePage - 1) })}>Previous</a>{/if}
							{#if result.next}<a class="btn btn-xs join-item" href={hrefWith({ page: String(tablePage + 1) })}>Next</a>{/if}
						</div>
					</div>
				{/snippet}
			</AsyncState>
		{/if}
		{#if summary.error}
			<p role="alert" class="text-xs text-error">Counts could not load: {summary.error.message}</p>
		{/if}
	</div>
</div>
