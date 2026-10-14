<script lang="ts">
	import AsyncState from '#lib/components/AsyncState.svelte';
	import CapacityBar from '#lib/components/CapacityBar.svelte';
	import type { Page } from '#lib/api.ts';
	import { capacityDisplay, listWeekends, weekendStatusLabels, type MarketWeekend } from '#lib/catalog.ts';
	import { formatDate } from '#lib/format.ts';
	import { Resource } from '#lib/resource.svelte.ts';
	import { session } from '#lib/session.svelte.ts';

	// Not in this release: a calendar view.
	const weekends = new Resource<Page<MarketWeekend>>();
	$effect(() => {
		weekends.load(() => listWeekends({ page_size: 100 }));
	});

	const statusTone = { DRAFT: 'badge-ghost', OPEN: 'badge-success', CLOSED: 'badge-neutral badge-outline' } as const;
</script>

<svelte:head><title>Market weekends · Vendor Ops</title></svelte:head>

<div class="bg-base-100 w-full shadow-sm border border-base-200 rounded-lg">
	<header class="flex flex-wrap items-center justify-between gap-2 bg-[#f4f4f4] px-4 py-3">
		<h1 class="text-base font-bold">Market weekends</h1>
		{#if session.isAdmin}<a href="/market-weekends/new" class="btn btn-primary btn-sm text-xs font-semibold">New weekend</a>{/if}
	</header>
	<div class="p-2">
		<AsyncState resource={weekends} label="Loading market weekends…">
			{#snippet children(result)}
				<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{#each result.results as weekend (weekend.id)}
						{@const waitlisted = [...weekend.variants, ...weekend.addOns].reduce((sum, product) => sum + product.waitlisted, 0)}
						<article class="card border border-base-200 bg-base-100 shadow-sm">
							<div class="card-body gap-3 p-4">
								<div class="flex flex-wrap items-start justify-between gap-2">
									<div>
										<h2 class="font-semibold"><a href={`/market-weekends/${weekend.id}`} class="hover:underline">{weekend.label}</a></h2>
										<p class="text-xs text-base-content/60">
											{formatDate(weekend.startDate)} – {formatDate(weekend.endDate)}{weekend.venue ? ` · ${weekend.venue}` : ''}
										</p>
									</div>
									<div class="flex gap-1">
										<span class={['badge badge-sm', statusTone[weekend.status]]}>{weekendStatusLabels[weekend.status]}</span>
										{#if waitlisted}<span class="badge badge-sm badge-secondary badge-outline">{waitlisted} waitlisted</span>{/if}
									</div>
								</div>
								{#each weekend.variants as variant (variant.id)}
									<CapacityBar name={variant.name} capacity={capacityDisplay(variant)} />
								{:else}
									<p class="text-xs text-base-content/60">No booth variants yet.</p>
								{/each}
								{#if weekend.addOns.length}
									<p class="text-xs text-base-content/60">
										Add-ons: {weekend.addOns.map((addOn) => `${addOn.name} ${addOn.confirmed}${addOn.capacity === null ? '' : `/${addOn.capacity}`}`).join(' · ')}
									</p>
								{/if}
							</div>
						</article>
					{:else}
						<p class="text-sm text-base-content/60">No market weekends yet.</p>
					{/each}
				</div>
			{/snippet}
		</AsyncState>
	</div>
</div>
