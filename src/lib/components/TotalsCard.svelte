<script lang="ts">
	import { describeDiscount, discountFromInput, setDiscount, totalsRows, type Application, type DiscountType } from '#lib/applications.ts';
	import { centsToDollarsInput, formatMoney, parseDollars } from '#lib/format.ts';

	let { application, isAdmin, onchanged }: { application: Application; isAdmin: boolean; onchanged: () => void } = $props();

	const money = (cents: number) => formatMoney(cents, application.totals.currency);
	const rows = $derived(totalsRows(application));

	let editing = $state(false);
	let type = $state<DiscountType>('NONE');
	let value = $state('');
	let label = $state('');
	let busy = $state(false);
	let error = $state('');

	function startEdit() {
		const discount = application.discount;
		type = discount.type;
		value = discount.type === 'FIXED' ? centsToDollarsInput(Math.round(Number(discount.value))) : discount.type === 'PERCENT' ? String(Number(discount.value)) : '';
		label = discount.label;
		error = '';
		editing = true;
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		const result = discountFromInput(type, value, label, parseDollars);
		if ('error' in result) {
			error = result.error;
			return;
		}
		busy = true;
		error = '';
		try {
			await setDiscount(application.id, result.discount);
			editing = false;
			onchanged();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not save the discount.';
		} finally {
			busy = false;
		}
	}
</script>

<div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
	<div class="card-body gap-3">
		<h2 class="text-xs font-bold">TOTALS</h2>
		<dl class="flex flex-col gap-1 text-sm">
			{#each rows as row (row.key)}
				<div class={['flex justify-between gap-4', row.emphasis && 'border-t border-base-200 pt-1 font-semibold']}>
					<dt>{row.label}</dt>
					<dd class="whitespace-nowrap">{row.negative && row.cents ? `−${money(row.cents)}` : money(row.cents)}</dd>
				</div>
			{/each}
		</dl>
		<p class="text-[11px] text-base-content/60">
			Discount: {describeDiscount(application.discount, money)}. Totals are calculated by the server from confirmed lines.
		</p>
		{#if isAdmin && !editing}
			<button type="button" class="btn btn-xs btn-outline self-start" onclick={startEdit}>Edit discount</button>
		{/if}
		{#if editing}
			<form class="flex flex-col gap-2" onsubmit={save} aria-label="Order discount">
				<div class="flex flex-col gap-1">
					<label class="text-xs font-medium" for="totals-discount-type">Discount</label>
					<select id="totals-discount-type" class="select select-sm" bind:value={type}>
						<option value="NONE">No discount</option>
						<option value="PERCENT">Percent of confirmed lines</option>
						<option value="FIXED">Fixed amount</option>
					</select>
				</div>
				{#if type !== 'NONE'}
					<div class="flex flex-col gap-1">
						<label class="text-xs font-medium" for="totals-discount-value">{type === 'PERCENT' ? 'Percent' : 'Amount (USD)'}</label>
						<input id="totals-discount-value" class="input input-sm" inputmode="decimal" bind:value aria-invalid={Boolean(error)} />
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-xs font-medium" for="totals-discount-label">Label</label>
						<input id="totals-discount-label" class="input input-sm" placeholder="New Vendor Trial" bind:value={label} />
					</div>
				{/if}
				{#if error}<p role="alert" class="text-xs text-error">{error}</p>{/if}
				<div class="flex gap-2">
					<button type="submit" class="btn btn-xs btn-primary" disabled={busy}>Save discount</button>
					<button type="button" class="btn btn-xs btn-ghost" onclick={() => (editing = false)}>Cancel</button>
				</div>
			</form>
		{/if}
	</div>
</div>
