<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { untrack } from 'svelte';
	import {
		createAddOn,
		createVariant,
		createWeekend,
		deleteAddOn,
		deleteVariant,
		getWeekend,
		planCatalogSave,
		updateAddOn,
		updateVariant,
		updateWeekend,
		validateCatalogDrafts,
		weekendStatusLabels,
		type AddOnDraft,
		type CatalogOp,
		type MarketWeekend,
		type VariantDraft,
		type WeekendStatus
	} from '#lib/catalog.ts';
	import { centsToDollarsInput, parseDollars } from '#lib/format.ts';

	let { initial, onsaved, cancelHref }: { initial?: MarketWeekend; onsaved: (id: string) => void; cancelHref: string } = $props();

	let counter = 0;
	const key = () => `row-${++counter}`;
	const variantDrafts = (weekend?: MarketWeekend): VariantDraft[] =>
		(weekend?.variants ?? []).map((variant) => ({
			key: key(), id: variant.id, name: variant.name, dimensions: variant.dimensions,
			price: centsToDollarsInput(variant.priceCents), capacity: variant.capacity, removed: false
		}));
	const addOnDrafts = (weekend?: MarketWeekend): AddOnDraft[] =>
		(weekend?.addOns ?? []).map((addOn) => ({
			key: key(), id: addOn.id, name: addOn.name, price: centsToDollarsInput(addOn.priceCents), capacity: addOn.capacity, removed: false
		}));

	// The server's current state: what the drafts are compared against when saving.
	let server = $state<MarketWeekend | null>(untrack(() => initial ?? null));
	let label = $state(untrack(() => initial?.label ?? ''));
	let startDate = $state(untrack(() => initial?.startDate ?? ''));
	let endDate = $state(untrack(() => initial?.endDate ?? ''));
	let venue = $state(untrack(() => initial?.venue ?? ''));
	let status = $state<WeekendStatus>(untrack(() => initial?.status ?? 'DRAFT'));
	let variants = $state<VariantDraft[]>(untrack(() => variantDrafts(initial)));
	let addOns = $state<AddOnDraft[]>(untrack(() => addOnDrafts(initial)));
	const baseline = untrack(() => JSON.stringify([label, startDate, endDate, venue, status, variants, addOns]));
	const dirty = $derived(JSON.stringify([label, startDate, endDate, venue, status, variants, addOns]) !== baseline);

	let fieldErrors = $state<Record<string, string>>({});
	let rowErrors = $state<Record<string, string>>({});
	let formError = $state('');
	let saving = $state(false);
	let saved = false;

	function weekendErrors() {
		const errors: Record<string, string> = {};
		if (!label.trim()) errors.label = 'Label is required, for example "Oct 10 & 11".';
		if (!startDate) errors.startDate = 'Start date is required.';
		if (!endDate) errors.endDate = 'End date is required.';
		else if (startDate && endDate < startDate) errors.endDate = 'The weekend cannot end before it starts.';
		return errors;
	}

	async function runOp(weekendId: string, op: CatalogOp) {
		if (op.kind === 'variant') {
			if (op.op === 'create') {
				const created = await createVariant(weekendId, op.input);
				const draft = variants.find((row) => row.key === op.key);
				if (draft) draft.id = created.id;
			} else if (op.op === 'update') await updateVariant(weekendId, op.id, op.patch);
			else {
				await deleteVariant(weekendId, op.id);
				variants = variants.filter((row) => row.key !== op.key);
			}
		} else if (op.op === 'create') {
			const created = await createAddOn(weekendId, op.input);
			const draft = addOns.find((row) => row.key === op.key);
			if (draft) draft.id = created.id;
		} else if (op.op === 'update') await updateAddOn(weekendId, op.id, op.patch);
		else {
			await deleteAddOn(weekendId, op.id);
			addOns = addOns.filter((row) => row.key !== op.key);
		}
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		fieldErrors = weekendErrors();
		rowErrors = validateCatalogDrafts(variants, addOns, parseDollars);
		if (Object.keys(fieldErrors).length || Object.keys(rowErrors).length) {
			formError = 'Fix the highlighted fields.';
			return;
		}
		saving = true;
		try {
			const input = { label, startDate, endDate, venue, status };
			const weekend = server ? await updateWeekend(server.id, input) : await createWeekend(input);
			const ops = planCatalogSave(server, $state.snapshot(variants), $state.snapshot(addOns), parseDollars);
			const failures: Record<string, string> = {};
			for (const op of ops) {
				try {
					await runOp(weekend.id, op);
				} catch (error) {
					// e.g. "This product has application lines and cannot be deleted." or a capacity floor.
					failures[op.key] = error instanceof Error ? error.message : 'The server refused this change.';
				}
			}
			server = await getWeekend(weekend.id);
			rowErrors = failures;
			if (Object.keys(failures).length) {
				formError = 'The weekend was saved, but the server refused some booth or add-on changes. See the rows marked below.';
				return;
			}
			saved = true;
			onsaved(weekend.id);
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Could not save the weekend.';
		} finally {
			saving = false;
		}
	}

	function undoRemove(row: VariantDraft | AddOnDraft) {
		row.removed = false;
		delete rowErrors[row.key];
	}

	beforeNavigate((navigation) => {
		if (!dirty || saved) return;
		if (navigation.type === 'leave') return navigation.cancel();
		if (!confirm('You have unsaved changes. Leave this page without saving?')) navigation.cancel();
	});
</script>

{#snippet error(message: string | undefined, id: string)}
	{#if message}<p {id} class="text-error text-xs">{message}</p>{/if}
{/snippet}

<form class="flex flex-col gap-4" novalidate onsubmit={save}>
	<section class="card bg-base-100 border border-base-200 shadow-sm">
		<div class="card-body grid gap-4 sm:grid-cols-2">
			<h2 class="card-title text-sm sm:col-span-2">Weekend</h2>
			<div class="flex flex-col gap-1">
				<label class="text-sm font-medium" for="weekend-label">Label *</label>
				<input id="weekend-label" class="input-line" placeholder="Oct 10 & 11" bind:value={label} aria-invalid={Boolean(fieldErrors.label)} aria-describedby={fieldErrors.label ? 'weekend-label-error' : undefined} />
				{@render error(fieldErrors.label, 'weekend-label-error')}
			</div>
			<div class="flex flex-col gap-1">
				<label class="text-sm font-medium" for="weekend-status">Status</label>
				<select id="weekend-status" class="input-line" bind:value={status} aria-describedby="weekend-status-hint">
					{#each Object.entries(weekendStatusLabels) as [value, text] (value)}<option {value}>{text}</option>{/each}
				</select>
				<p id="weekend-status-hint" class="text-xs text-base-content/60">Closed weekends take no new requests.</p>
			</div>
			<div class="flex flex-col gap-1">
				<label class="text-sm font-medium" for="weekend-start">Start date *</label>
				<input id="weekend-start" type="date" class="input-line" bind:value={startDate} aria-invalid={Boolean(fieldErrors.startDate)} aria-describedby={fieldErrors.startDate ? 'weekend-start-error' : undefined} />
				{@render error(fieldErrors.startDate, 'weekend-start-error')}
			</div>
			<div class="flex flex-col gap-1">
				<label class="text-sm font-medium" for="weekend-end">End date *</label>
				<input id="weekend-end" type="date" class="input-line" bind:value={endDate} aria-invalid={Boolean(fieldErrors.endDate)} aria-describedby={fieldErrors.endDate ? 'weekend-end-error' : undefined} />
				{@render error(fieldErrors.endDate, 'weekend-end-error')}
			</div>
			<div class="flex flex-col gap-1 sm:col-span-2">
				<label class="text-sm font-medium" for="weekend-venue">Venue</label>
				<input id="weekend-venue" class="input-line" bind:value={venue} />
			</div>
		</div>
	</section>

	<section class="card bg-base-100 border border-base-200 shadow-sm">
		<div class="card-body gap-3">
			<div>
				<h2 class="card-title text-sm">Booth variants</h2>
				<p class="text-xs text-base-content/60">Prices are in dollars. Changing a price never changes lines already requested.</p>
			</div>
			{#each variants as row, index (row.key)}
				<fieldset class={['grid gap-3 rounded-lg border border-base-200 p-3 sm:grid-cols-[2fr_2fr_1fr_1fr_auto] sm:items-end', row.removed && 'opacity-50']} aria-describedby={rowErrors[row.key] ? `${row.key}-error` : undefined}>
					<legend class="px-1 text-xs font-semibold">Booth {index + 1}{row.removed ? ' (will be deleted)' : ''}</legend>
					<div class="flex flex-col gap-1">
						<label class="text-xs" for={`${row.key}-name`}>Name *</label>
						<input id={`${row.key}-name`} class="input-line" placeholder="8ft x 8ft" bind:value={row.name} disabled={row.removed} />
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-xs" for={`${row.key}-dimensions`}>Dimensions</label>
						<input id={`${row.key}-dimensions`} class="input-line" placeholder="8 x 8 ft" bind:value={row.dimensions} disabled={row.removed} />
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-xs" for={`${row.key}-price`}>Price (USD) *</label>
						<input id={`${row.key}-price`} class="input-line" inputmode="decimal" placeholder="150.00" bind:value={row.price} disabled={row.removed} />
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-xs" for={`${row.key}-capacity`}>Capacity *</label>
						<input id={`${row.key}-capacity`} type="number" min="0" step="1" class="input-line" bind:value={row.capacity} disabled={row.removed} />
					</div>
					{#if row.removed}
						<button type="button" class="btn btn-ghost btn-xs" onclick={() => undoRemove(row)}>Undo</button>
					{:else}
						<button type="button" class="btn btn-ghost btn-xs text-error" onclick={() => (row.id ? (row.removed = true) : (variants = variants.filter((item) => item.key !== row.key)))}>
							Remove<span class="sr-only"> booth {index + 1}</span>
						</button>
					{/if}
					{#if rowErrors[row.key]}<p id={`${row.key}-error`} role="alert" class="text-error text-xs sm:col-span-5">{rowErrors[row.key]}</p>{/if}
				</fieldset>
			{/each}
			<div>
				<button type="button" class="btn btn-outline btn-xs" onclick={() => (variants = [...variants, { key: key(), id: null, name: '', dimensions: '', price: '', capacity: null, removed: false }])}>
					Add a booth variant
				</button>
			</div>
		</div>
	</section>

	<section class="card bg-base-100 border border-base-200 shadow-sm">
		<div class="card-body gap-3">
			<div>
				<h2 class="card-title text-sm">Add-ons</h2>
				<p class="text-xs text-base-content/60">Leave capacity blank for unlimited.</p>
			</div>
			{#each addOns as row, index (row.key)}
				<fieldset class={['grid gap-3 rounded-lg border border-base-200 p-3 sm:grid-cols-[3fr_1fr_1fr_auto] sm:items-end', row.removed && 'opacity-50']} aria-describedby={rowErrors[row.key] ? `${row.key}-error` : undefined}>
					<legend class="px-1 text-xs font-semibold">Add-on {index + 1}{row.removed ? ' (will be deleted)' : ''}</legend>
					<div class="flex flex-col gap-1">
						<label class="text-xs" for={`${row.key}-name`}>Name *</label>
						<input id={`${row.key}-name`} class="input-line" placeholder="Tent rental" bind:value={row.name} disabled={row.removed} />
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-xs" for={`${row.key}-price`}>Price (USD) *</label>
						<input id={`${row.key}-price`} class="input-line" inputmode="decimal" placeholder="40.00" bind:value={row.price} disabled={row.removed} />
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-xs" for={`${row.key}-capacity`}>Capacity</label>
						<input id={`${row.key}-capacity`} type="number" min="0" step="1" class="input-line" placeholder="Unlimited" bind:value={row.capacity} disabled={row.removed} />
					</div>
					{#if row.removed}
						<button type="button" class="btn btn-ghost btn-xs" onclick={() => undoRemove(row)}>Undo</button>
					{:else}
						<button type="button" class="btn btn-ghost btn-xs text-error" onclick={() => (row.id ? (row.removed = true) : (addOns = addOns.filter((item) => item.key !== row.key)))}>
							Remove<span class="sr-only"> add-on {index + 1}</span>
						</button>
					{/if}
					{#if rowErrors[row.key]}<p id={`${row.key}-error`} role="alert" class="text-error text-xs sm:col-span-4">{rowErrors[row.key]}</p>{/if}
				</fieldset>
			{/each}
			<div>
				<button type="button" class="btn btn-outline btn-xs" onclick={() => (addOns = [...addOns, { key: key(), id: null, name: '', price: '', capacity: null, removed: false }])}>
					Add an add-on
				</button>
			</div>
		</div>
	</section>

	{#if formError}<div role="alert" class="alert alert-error text-sm">{formError}</div>{/if}

	<div class="flex justify-end gap-2">
		<a href={cancelHref} class="btn btn-ghost btn-sm">Cancel</a>
		<button type="submit" class="btn btn-primary btn-sm" disabled={saving}>
			{#if saving}<span class="loading loading-spinner loading-xs"></span>{/if}
			{server ? 'Save weekend' : 'Create weekend'}
		</button>
	</div>
</form>
