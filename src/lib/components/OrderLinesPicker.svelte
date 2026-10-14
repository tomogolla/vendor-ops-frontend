<script lang="ts">
	import type { OrderLineDraft } from '#lib/applications.ts';
	import type { MarketWeekend } from '#lib/catalog.ts';
	import { formatDate, formatMoney } from '#lib/format.ts';

	type Props = {
		/** Weekends that can take new requests (not closed). */
		weekends: MarketWeekend[];
		lines: OrderLineDraft[];
		errors?: Record<string, string>;
		idPrefix: string;
	};
	let { weekends, lines = $bindable(), errors = {}, idPrefix }: Props = $props();

	let counter = 0;
	const newRow = (): OrderLineDraft => ({
		key: `${idPrefix}-${++counter}`,
		weekendId: weekends.length === 1 ? weekends[0].id : '',
		variantId: '',
		quantity: 1,
		addOnIds: []
	});
	const weekendFor = (line: OrderLineDraft) => weekends.find((weekend) => weekend.id === line.weekendId);

	function changeWeekend(line: OrderLineDraft, weekendId: string) {
		line.weekendId = weekendId;
		line.variantId = '';
		line.addOnIds = [];
	}

	function toggleAddOn(line: OrderLineDraft, addOnId: string, checked: boolean) {
		line.addOnIds = checked ? [...line.addOnIds, addOnId] : line.addOnIds.filter((id) => id !== addOnId);
	}

	const spotsText = (remaining: number | null) =>
		remaining === null ? 'no limit' : remaining > 0 ? `${remaining} left` : 'full, will be waitlisted or declined';
</script>

<div class="flex flex-col gap-3">
	{#each lines as line, index (line.key)}
		{@const weekend = weekendFor(line)}
		<fieldset class="rounded-lg border border-base-200 p-3" aria-describedby={errors[line.key] ? `${line.key}-error` : undefined}>
			<legend class="px-1 text-xs font-semibold">Booth {index + 1}</legend>
			<div class="grid gap-3 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end">
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium" for={`${line.key}-weekend`}>Weekend</label>
					<select id={`${line.key}-weekend`} class="input-line" value={line.weekendId} onchange={(event) => changeWeekend(line, event.currentTarget.value)}>
						<option value="">Choose a weekend</option>
						{#each weekends as option (option.id)}
							<option value={option.id}>{option.label} ({formatDate(option.startDate)})</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium" for={`${line.key}-variant`}>Booth</label>
					<select id={`${line.key}-variant`} class="input-line" bind:value={line.variantId} disabled={!weekend}>
						<option value="">Choose a booth</option>
						{#each weekend?.variants ?? [] as variant (variant.id)}
							<option value={variant.id}>
								{variant.name} · {formatMoney(variant.priceCents, weekend?.currency)} · {spotsText(variant.remaining)}
							</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium" for={`${line.key}-quantity`}>Quantity</label>
					<input id={`${line.key}-quantity`} type="number" min="1" step="1" class="input-line" bind:value={line.quantity} />
				</div>
				<button type="button" class="btn btn-ghost btn-xs text-error" onclick={() => (lines = lines.filter((item) => item.key !== line.key))}>
					Remove<span class="sr-only"> booth {index + 1}</span>
				</button>
			</div>
			{#if weekend?.addOns.length}
				<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1">
					<span class="text-xs font-medium text-base-content/70">Add-ons for this booth:</span>
					{#each weekend.addOns as addOn (addOn.id)}
						<label class="label cursor-pointer gap-2 text-xs text-base-content">
							<input
								type="checkbox"
								class="checkbox checkbox-xs"
								checked={line.addOnIds.includes(addOn.id)}
								onchange={(event) => toggleAddOn(line, addOn.id, event.currentTarget.checked)}
							/>
							{addOn.name} ({formatMoney(addOn.priceCents, weekend.currency)}{addOn.capacity === null ? '' : `, ${spotsText(addOn.remaining)}`})
						</label>
					{/each}
				</div>
			{/if}
			{#if errors[line.key]}<p id={`${line.key}-error`} class="mt-2 text-error text-xs">{errors[line.key]}</p>{/if}
		</fieldset>
	{/each}
	<div>
		<button type="button" class="btn btn-outline btn-xs" onclick={() => (lines = [...lines, newRow()])} disabled={!weekends.length}>
			Add a booth
		</button>
		{#if !weekends.length}
			<p class="mt-1 text-xs text-base-content/60">No market weekends are open for requests yet.</p>
		{/if}
	</div>
</div>
