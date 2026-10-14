<script lang="ts">
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { formatDate, instagramUrl } from '#lib/format.ts';
	import type { Vendor } from '#lib/vendor-store.ts';
	import { isIncomplete } from '#lib/vendor-validation.ts';

	let { vendors, emptyMessage = 'No vendors to show.' }: { vendors: Vendor[]; emptyMessage?: string } =
		$props();
</script>

<div class="overflow-x-auto">
	<table class="table table-zebra table-sm w-full text-left">
		<thead class="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-base-300">
			<tr>
				<th>Date</th>
				<th>Brand</th>
				<th>Contact</th>
				<th>Status</th>
				<th>Category</th>
				<th>Phone</th>
				<th>Instagram</th>
				<th>Lead source</th>
				<th>Tags</th>
			</tr>
		</thead>
		<tbody>
			{#each vendors as vendor (vendor.id)}
				<tr class="hover">
					<td class="whitespace-nowrap">{formatDate(vendor.createdAt)}</td>
					<td class="font-semibold">
						<a href={`/vendors/${vendor.id}`} class="hover:underline focus:outline-none focus:ring-1 focus:ring-[#35b2b2]">
							{vendor.brandName}
						</a>
					</td>
					<td>
						<div class="text-sm font-medium">{vendor.firstName} {vendor.lastName}</div>
						<div class="text-xs text-slate-400">{vendor.email}</div>
					</td>
					<td>
						<div class="flex flex-wrap gap-1">
							<StatusBadge status={vendor.status} />
							{#if isIncomplete(vendor)}<span class="badge badge-sm badge-warning">Incomplete</span>{/if}
						</div>
					</td>
					<td>{vendor.category || '—'}</td>
					<td class="whitespace-nowrap">{vendor.phone || '—'}</td>
					<td>
						{#if vendor.instagram}
							<a href={instagramUrl(vendor.instagram)} target="_blank" rel="noreferrer" class="text-blue-600 hover:underline">{vendor.instagram}</a>
						{:else}—{/if}
					</td>
					<td>{vendor.leadSource || '—'}</td>
					
					<td>
						<div class="flex flex-wrap gap-1">
							{#each vendor.tags as tag (tag)}
								<span class="px-1.5 py-0.5 text-[10px] bg-slate-100 rounded text-slate-600">{tag}</span>
							{/each}
						</div>
					</td>
				</tr>
			{:else}
				<tr><td colspan="9" class="py-6 text-center text-sm text-base-content/60">{emptyMessage}</td></tr>
			{/each}
		</tbody>
	</table>
</div>
