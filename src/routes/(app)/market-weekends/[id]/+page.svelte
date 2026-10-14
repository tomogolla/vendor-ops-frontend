<script lang="ts">
	import type { PageProps } from './$types';
	import AsyncState from '#lib/components/AsyncState.svelte';
	import CapacityBar from '#lib/components/CapacityBar.svelte';
	import LineDecisionDialog from '#lib/components/LineDecisionDialog.svelte';
	import StageBadge from '#lib/components/StageBadge.svelte';
	import {
		availableLineActions,
		listApplications,
		weekendRoster,
		type Application,
		type LineAction,
		type LineDecision,
		type RosterRow
	} from '#lib/applications.ts';
	import { capacityDisplay, getWeekend, weekendStatusLabels, type MarketWeekend } from '#lib/catalog.ts';
	import type { Page } from '#lib/api.ts';
	import { formatDate, formatDateTime } from '#lib/format.ts';
	import { Resource } from '#lib/resource.svelte.ts';
	import { session } from '#lib/session.svelte.ts';

	let { data }: PageProps = $props();

	const ROSTER_LIMIT = 200;
	const weekend = new Resource<MarketWeekend>();
	// TODO(backend): weekend detail does not list booked or waitlisted lines; they are built from the
	// applications that have a line on this weekend (GET /applications/?weekend=id).
	const applications = new Resource<Page<Application>>();

	function load() {
		const id = data.id;
		weekend.load(() => getWeekend(id));
		applications.load(() => listApplications({ weekend: id, page_size: ROSTER_LIMIT }));
	}
	$effect(load);

	const roster = $derived(applications.data ? weekendRoster(applications.data.results, data.id) : null);
	const suggestedLineIds = $derived(
		new Set([...(weekend.data?.variants ?? []), ...(weekend.data?.addOns ?? [])].flatMap((product) => product.suggestions.map((s) => s.lineId)))
	);

	function productFor(row: RosterRow) {
		const current = weekend.data;
		if (!current) return null;
		return row.line.variantId
			? (current.variants.find((variant) => variant.id === row.line.variantId) ?? null)
			: (current.addOns.find((addOn) => addOn.id === row.line.addOnId) ?? null);
	}

	let decisionDialog: LineDecisionDialog | undefined = $state();
	function decide(row: RosterRow, action: LineAction) {
		const product = productFor(row);
		decisionDialog?.open({
			line: row.line,
			action: action as LineAction & { key: LineDecision },
			capacity: product ? capacityDisplay(product) : null,
			context: row.application.vendorBrand
		});
	}
	const actionFor = (row: RosterRow, key: LineDecision) =>
		availableLineActions(row.line, session.isAdmin, Boolean(row.application.firstPaidAt), { stage: row.application.stage }).find(
			(action) => action.key === key
		);
	const statusTone = { DRAFT: 'badge-ghost', OPEN: 'badge-success', CLOSED: 'badge-neutral badge-outline' } as const;
</script>

<svelte:head><title>{weekend.data?.label ?? 'Market weekend'} · Vendor Ops</title></svelte:head>

<AsyncState resource={weekend} label="Loading weekend…">
	{#snippet children(current)}
		<div class="flex flex-col gap-4">
			<div class="card bg-base-100 border border-base-200 shadow-sm">
				<div class="bg-base-200/60 px-6 py-3 border-b border-base-200 flex flex-wrap items-center justify-between gap-2">
					<div class="flex flex-wrap items-center gap-2">
						<h1 class="font-semibold text-base">{current.label}</h1>
						<span class={['badge badge-sm', statusTone[current.status]]}>{weekendStatusLabels[current.status]}</span>
					</div>
					<div class="flex gap-2">
						{#if session.isAdmin}<a href={`/market-weekends/${current.id}/edit`} class="btn btn-primary btn-sm text-xs font-semibold">Edit</a>{/if}
						<a href="/market-weekends" class="btn btn-ghost btn-sm text-xs font-semibold">Back to weekends</a>
					</div>
				</div>
				<div class="card-body gap-4">
					<p class="text-sm text-base-content/70">
						{formatDate(current.startDate)} – {formatDate(current.endDate)}{current.venue ? ` · ${current.venue}` : ''}
					</p>
					<section class="flex flex-col gap-3" aria-labelledby="capacity-heading">
						<h2 id="capacity-heading" class="text-xs font-bold">BOOTH CAPACITY</h2>
						{#each current.variants as variant (variant.id)}
							<CapacityBar name={variant.name} detail={variant.dimensions} capacity={capacityDisplay(variant)} />
						{:else}
							<p class="text-xs text-base-content/60">No booth variants yet.</p>
						{/each}
					</section>
					{#if current.addOns.length}
						<section class="flex flex-col gap-3" aria-labelledby="addons-heading">
							<h2 id="addons-heading" class="text-xs font-bold">ADD-ONS</h2>
							{#each current.addOns as addOn (addOn.id)}
								<CapacityBar name={addOn.name} capacity={capacityDisplay(addOn)} />
							{/each}
						</section>
					{/if}
					<!-- Revenue is omitted until invoicing exists. -->
				</div>
			</div>

			{#if session.isAdmin}
				{@const withSuggestions = [...current.variants, ...current.addOns].filter((product) => product.suggestions.length)}
				{#if withSuggestions.length}
					<div role="status" class="alert alert-info alert-soft flex flex-col items-start gap-1 text-sm">
						<p class="font-semibold">Spots are free for waitlisted vendors</p>
						{#each withSuggestions as product (product.id)}
							<p class="text-xs">
								{product.name}: {product.remaining ?? 'unlimited'} left. Oldest waitlisted:
								{product.suggestions.map((s) => `${s.brandName} (×${s.quantity}${s.fits ? '' : ', does not fit'})`).join(', ')}.
								Confirm them from the waitlist below; nothing is promoted automatically.
							</p>
						{/each}
					</div>
				{/if}
			{/if}

			<div class="grid gap-4 lg:grid-cols-2">
				<section class="card bg-base-100 border border-base-200 shadow-sm" aria-labelledby="booked-heading">
					<div class="card-body gap-3">
						<h2 id="booked-heading" class="text-xs font-bold">BOOKED VENDORS</h2>
						<AsyncState resource={applications} label="Loading bookings…">
							{#snippet children()}
								<div class="overflow-x-auto">
									<table class="table table-sm">
										<thead><tr><th>Vendor</th><th>Item</th><th>Qty</th><th>Stage</th><th><span class="sr-only">Actions</span></th></tr></thead>
										<tbody>
											{#each roster?.booked ?? [] as row (row.line.id)}
												{@const release = actionFor(row, 'release')}
												<tr>
													<td><a class="hover:underline" href={`/applications/${row.application.id}`}>{row.application.vendorBrand}</a></td>
													<td>{row.line.kind === 'add_on' ? '↳ ' : ''}{row.line.productName}</td>
													<td>{row.line.quantity}</td>
													<td><StageBadge stage={row.application.stage} /></td>
													<td class="text-right">
														{#if release}
															<button type="button" class="btn btn-xs btn-error btn-outline" disabled={Boolean(release.disabledReason)} title={release.disabledReason} onclick={() => decide(row, release)}>
																Release hold<span class="sr-only"> for {row.application.vendorBrand}</span>
															</button>
															{#if release.disabledReason}<p class="text-[11px] text-base-content/60">Paid: release needs a refund.</p>{/if}
														{/if}
													</td>
												</tr>
											{:else}
												<tr><td colspan="5" class="text-xs text-base-content/60">Nobody is confirmed yet.</td></tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/snippet}
						</AsyncState>
					</div>
				</section>

				<section class="card bg-base-100 border border-base-200 shadow-sm" aria-labelledby="waitlist-heading">
					<div class="card-body gap-3">
						<h2 id="waitlist-heading" class="text-xs font-bold">WAITLIST (OLDEST FIRST)</h2>
						<AsyncState resource={applications} label="Loading waitlist…">
							{#snippet children()}
								<div class="overflow-x-auto">
									<table class="table table-sm">
										<thead><tr><th>Vendor</th><th>Item</th><th>Qty</th><th>Since</th><th><span class="sr-only">Actions</span></th></tr></thead>
										<tbody>
											{#each roster?.waitlist ?? [] as row (row.line.id)}
												{@const promote = actionFor(row, 'confirm')}
												{@const suggested = suggestedLineIds.has(row.line.id)}
												<tr>
													<td>
														<a class="hover:underline" href={`/applications/${row.application.id}`}>{row.application.vendorBrand}</a>
														{#if suggested}<span class="badge badge-xs badge-info ml-1">Suggested</span>{/if}
													</td>
													<td>{row.line.kind === 'add_on' ? '↳ ' : ''}{row.line.productName}</td>
													<td>{row.line.quantity}</td>
													<td class="whitespace-nowrap text-xs">{row.line.waitlistedAt ? formatDateTime(row.line.waitlistedAt) : '—'}</td>
													<td class="text-right">
														{#if promote && suggested}
															<button type="button" class="btn btn-xs btn-primary" onclick={() => decide(row, promote)}>
																Confirm<span class="sr-only"> {row.application.vendorBrand}</span>
															</button>
														{/if}
													</td>
												</tr>
											{:else}
												<tr><td colspan="5" class="text-xs text-base-content/60">Nobody is waitlisted.</td></tr>
											{/each}
										</tbody>
									</table>
								</div>
								{#if (applications.data?.count ?? 0) > ROSTER_LIMIT}
									<p class="text-xs text-warning">Only the first {ROSTER_LIMIT} applications on this weekend are listed.</p>
								{/if}
							{/snippet}
						</AsyncState>
					</div>
				</section>
			</div>
		</div>
		<LineDecisionDialog bind:this={decisionDialog} currency={current.currency} ondone={load} />
	{/snippet}
	{#snippet notFound()}
		<p class="text-sm">There is no market weekend with ID {data.id}. <a class="link" href="/market-weekends">Back to weekends</a></p>
	{/snippet}
</AsyncState>
