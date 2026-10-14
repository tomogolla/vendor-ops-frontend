<script lang="ts">
	import LineDecisionDialog from '#lib/components/LineDecisionDialog.svelte';
	import LineStatusBadge from '#lib/components/LineStatusBadge.svelte';
	import {
		addLine,
		availableLineActions,
		deleteLine,
		linesInOrder,
		updateLineQuantity,
		type Application,
		type ApplicationLine,
		type LineAction,
		type LineDecision
	} from '#lib/applications.ts';
	import { capacityDisplay, type MarketWeekend } from '#lib/catalog.ts';
	import { formatDate, formatMoney } from '#lib/format.ts';

	type Props = {
		application: Application;
		/** Every weekend, with live capacity; used for "spots left" and the add-line picker. */
		weekends: MarketWeekend[];
		isAdmin: boolean;
		onchanged: () => void;
	};
	let { application, weekends, isAdmin, onchanged }: Props = $props();

	const currency = $derived(application.totals.currency);
	const rows = $derived(linesInOrder(application.lines));
	const canAdd = $derived(['NEW', 'IN_REVIEW', 'WON'].includes(application.stage));

	function productFor(line: ApplicationLine) {
		const weekend = weekends.find((item) => item.id === line.weekend.id);
		if (!weekend) return null;
		return line.variantId
			? (weekend.variants.find((variant) => variant.id === line.variantId) ?? null)
			: (weekend.addOns.find((addOn) => addOn.id === line.addOnId) ?? null);
	}

	// --- Decisions go through the shared dialog -----------------------------------------------
	let decisionDialog: LineDecisionDialog | undefined = $state();
	let busy = $state(false);
	let rowError = $state('');

	function open(line: ApplicationLine, action: LineAction) {
		rowError = '';
		if (action.key === 'edit') {
			editing = line.id;
			editQuantity = line.quantity;
			return;
		}
		if (action.key === 'delete') {
			if (confirm(`Remove ${line.productName} (${line.weekend.label}) from this order?`)) run(() => deleteLine(line.id));
			return;
		}
		const product = productFor(line);
		decisionDialog?.open({ line, action: action as LineAction & { key: LineDecision }, capacity: product ? capacityDisplay(product) : null });
	}

	async function run(task: () => Promise<unknown>) {
		busy = true;
		rowError = '';
		try {
			await task();
			onchanged();
			return true;
		} catch (error) {
			rowError = error instanceof Error ? error.message : 'That did not work.';
			return false;
		} finally {
			busy = false;
		}
	}

	// --- Quantity edits ---------------------------------------------------------------------
	let editing = $state<string | null>(null);
	let editQuantity = $state<number | null>(1);

	async function saveQuantity(line: ApplicationLine) {
		if (!Number.isInteger(editQuantity) || (editQuantity ?? 0) < 1) {
			rowError = 'Quantity must be a whole number of at least 1.';
			return;
		}
		if (await run(() => updateLineQuantity(line.id, editQuantity as number))) editing = null;
	}

	// --- Adding a line ------------------------------------------------------------------------
	let newWeekendId = $state('');
	let newProduct = $state('');
	let newParentId = $state('');
	let newQuantity = $state<number | null>(1);
	let addError = $state('');
	const openWeekends = $derived(weekends.filter((weekend) => weekend.status !== 'CLOSED'));
	const newWeekend = $derived(openWeekends.find((weekend) => weekend.id === newWeekendId));
	const parentChoices = $derived(
		application.lines.filter(
			(line) => line.kind === 'booth' && line.weekend.id === newWeekendId && ['REQUESTED', 'WAITLISTED', 'CONFIRMED'].includes(line.status)
		)
	);

	async function submitLine(event: SubmitEvent) {
		event.preventDefault();
		addError = '';
		const [kind, productId] = newProduct.split(':');
		if (!productId) return void (addError = 'Choose a booth or add-on.');
		if (!Number.isInteger(newQuantity) || (newQuantity ?? 0) < 1) return void (addError = 'Quantity must be at least 1.');
		if (kind === 'addon' && !newParentId) return void (addError = 'Choose the booth line this add-on belongs to.');
		busy = true;
		try {
			await addLine(application.id, {
				variantId: kind === 'variant' ? productId : undefined,
				addOnId: kind === 'addon' ? productId : undefined,
				parentLineId: kind === 'addon' ? newParentId : undefined,
				quantity: newQuantity as number
			});
			newProduct = '';
			newParentId = '';
			newQuantity = 1;
			onchanged();
		} catch (error) {
			addError = error instanceof Error ? error.message : 'Could not add the line.';
		} finally {
			busy = false;
		}
	}

	const spots = (remaining: number | null) => (remaining === null ? 'no limit' : `${Math.max(remaining, 0)} left`);
</script>

<div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden" id="lines">
	<div class="card-body gap-3">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-xs font-bold">ORDER LINES</h2>
			{#if application.hasWaitlistedLines}<span class="badge badge-sm badge-secondary badge-outline">Has waitlisted lines</span>{/if}
		</div>
		{#if rowError}<p role="alert" class="text-xs text-error">{rowError}</p>{/if}
		<div class="overflow-x-auto rounded-lg border border-base-200">
			<table class="table table-sm w-full text-left">
				<thead class="text-xs uppercase text-slate-500 bg-base-200">
					<tr><th>Weekend</th><th>Item</th><th>Qty</th><th>Unit</th><th>Line total</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr>
				</thead>
				<tbody>
					{#each rows as { line, parent } (line.id)}
						{@const actions = availableLineActions(line, isAdmin, Boolean(application.firstPaidAt), { stage: application.stage, parentStatus: parent?.status })}
						<tr class={[line.status === 'DECLINED' || line.status === 'CANCELLED' ? 'opacity-60' : '']}>
							<td class="whitespace-nowrap">{parent ? '' : line.weekend.label}</td>
							<td class={[parent && 'pl-6']}>
								{#if parent}<span class="text-base-content/50" aria-hidden="true">↳ </span><span class="sr-only">Add-on: </span>{/if}{line.productName}
							</td>
							<td>
								{#if editing === line.id}
									<form class="flex items-center gap-1" onsubmit={(event) => { event.preventDefault(); saveQuantity(line); }}>
										<label class="sr-only" for={`qty-${line.id}`}>Quantity</label>
										<input id={`qty-${line.id}`} type="number" min="1" step="1" class="input input-xs w-16" bind:value={editQuantity} />
										<button type="submit" class="btn btn-xs" disabled={busy}>Save</button>
										<button type="button" class="btn btn-xs btn-ghost" onclick={() => (editing = null)}>Cancel</button>
									</form>
								{:else}{line.quantity}{/if}
							</td>
							<td class="whitespace-nowrap">{formatMoney(line.unitPriceCents, currency)}</td>
							<td class="whitespace-nowrap">{formatMoney(line.totalCents, currency)}</td>
							<td>
								<LineStatusBadge status={line.status} />
								{#if line.statusReason}<p class="text-[11px] text-base-content/60">{line.statusReason}</p>{/if}
								{#if line.status === 'WAITLISTED' && line.waitlistedAt}<p class="text-[11px] text-base-content/60">since {formatDate(line.waitlistedAt)}</p>{/if}
							</td>
							<td>
								<div class="flex flex-wrap justify-end gap-1">
									{#each actions as action (action.key)}
										<button
											type="button"
											class={['btn btn-xs', action.tone]}
											disabled={busy || Boolean(action.disabledReason)}
											title={action.disabledReason}
											onclick={() => open(line, action)}
										>
											{action.label}<span class="sr-only"> {line.productName}, {line.weekend.label}</span>
										</button>
									{/each}
								</div>
								{#each actions.filter((action) => action.disabledReason) as action (action.key)}
									<p class="text-right text-[11px] text-base-content/60">{action.label}: {action.disabledReason}</p>
								{/each}
							</td>
						</tr>
					{:else}
						<tr><td colspan="7" class="py-4 text-center text-sm text-base-content/60">No lines yet.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if canAdd}
			<form class="flex flex-wrap items-end gap-3 rounded-lg bg-base-200/50 p-3" onsubmit={submitLine} aria-label="Add a line">
				<div class="flex flex-col gap-1">
					<label class="text-xs font-medium" for="add-line-weekend">Weekend</label>
					<select id="add-line-weekend" class="select select-sm" bind:value={newWeekendId} onchange={() => { newProduct = ''; newParentId = ''; }}>
						<option value="">Choose</option>
						{#each openWeekends as weekend (weekend.id)}<option value={weekend.id}>{weekend.label}</option>{/each}
					</select>
				</div>
				<div class="flex flex-col gap-1">
					<label class="text-xs font-medium" for="add-line-product">Booth or add-on</label>
					<select id="add-line-product" class="select select-sm" bind:value={newProduct} disabled={!newWeekend}>
						<option value="">Choose</option>
						{#if newWeekend}
							<optgroup label="Booths">
								{#each newWeekend.variants as variant (variant.id)}
									<option value={`variant:${variant.id}`}>{variant.name} · {formatMoney(variant.priceCents, currency)} · {spots(variant.remaining)}</option>
								{/each}
							</optgroup>
							{#if newWeekend.addOns.length}
								<optgroup label="Add-ons">
									{#each newWeekend.addOns as addOn (addOn.id)}
										<option value={`addon:${addOn.id}`}>{addOn.name} · {formatMoney(addOn.priceCents, currency)} · {spots(addOn.remaining)}</option>
									{/each}
								</optgroup>
							{/if}
						{/if}
					</select>
				</div>
				{#if newProduct.startsWith('addon:')}
					<div class="flex flex-col gap-1">
						<label class="text-xs font-medium" for="add-line-parent">For booth line</label>
						<select id="add-line-parent" class="select select-sm" bind:value={newParentId}>
							<option value="">Choose</option>
							{#each parentChoices as line (line.id)}<option value={line.id}>{line.productName} ×{line.quantity}</option>{/each}
						</select>
					</div>
				{/if}
				<div class="flex flex-col gap-1">
					<label class="text-xs font-medium" for="add-line-quantity">Quantity</label>
					<input id="add-line-quantity" type="number" min="1" step="1" class="input input-sm w-20" bind:value={newQuantity} />
				</div>
				<button type="submit" class="btn btn-sm btn-outline" disabled={busy}>Add line</button>
				{#if addError}<p role="alert" class="w-full text-xs text-error">{addError}</p>{/if}
			</form>
		{:else}
			<p class="text-xs text-base-content/60">Lines can be added while the application is New, In review or Won.</p>
		{/if}
	</div>
</div>

<LineDecisionDialog bind:this={decisionDialog} {currency} ondone={onchanged} />
