<script lang="ts">
	import { goto } from '$app/navigation';
	import OrderLinesPicker from '#lib/components/OrderLinesPicker.svelte';
	import VendorForm, { type VendorFormPayload } from '#lib/components/VendorForm.svelte';
	import {
		createApplication,
		discountFromInput,
		orderLinesFromDrafts,
		setDiscount,
		submissionOutcome,
		type DiscountType,
		type OrderLineDraft
	} from '#lib/applications.ts';
	import { listWeekends, type MarketWeekend } from '#lib/catalog.ts';
	import { parseDollars } from '#lib/format.ts';
	import { leadSources } from '#lib/options.ts';
	import { session } from '#lib/session.svelte.ts';
	import { listTasks, logCall } from '#lib/vendor-store.ts';

	// Every entry is an application: it starts at New with an automatic discovery call task.
	const sources = [...new Set(['Staff entry', ...leadSources.filter((source) => source !== 'CSV import')])];

	let weekends = $state<MarketWeekend[]>([]);
	let weekendsError = $state('');
	$effect(() => {
		listWeekends({ page_size: 100 })
			.then((page) => (weekends = page.results.filter((weekend) => weekend.status !== 'CLOSED')))
			.catch((error) => (weekendsError = error instanceof Error ? error.message : 'Could not load market weekends.'));
	});

	let lines = $state<OrderLineDraft[]>([]);
	let lineErrors = $state<Record<string, string>>({});
	let source = $state('Staff entry');
	let notes = $state('');
	let discountType = $state<DiscountType>('NONE');
	let discountValue = $state('');
	let discountLabel = $state('');
	let discountError = $state('');
	const extraDirty = $derived(lines.length > 0 || notes.trim() !== '' || discountType !== 'NONE' || source !== 'Staff entry');

	async function save({ vendor, call }: VendorFormPayload) {
		const order = orderLinesFromDrafts($state.snapshot(lines));
		lineErrors = order.errors;
		const discount = session.isAdmin ? discountFromInput(discountType, discountValue, discountLabel, parseDollars) : null;
		discountError = discount && 'error' in discount ? discount.error : '';
		if (Object.keys(order.errors).length || discountError) {
			throw new Error('Check the order lines and discount above.');
		}

		const submission = await createApplication({ vendor, source, notes, lines: order.lines });
		const { application, bundled } = submission;
		const params = new URLSearchParams();
		if (discount && 'discount' in discount && discount.discount.type !== 'NONE') {
			// A bundled submission joins an application that may already have a discount: never overwrite it here.
			if (bundled) params.set('discount', 'skipped');
			else await setDiscount(application.id, discount.discount);
		}
		if (call.outcome) {
			const tasks = await listTasks({ application: application.id, task_type: 'DISCOVERY_CALL', is_open: true, page_size: 1 });
			if (tasks.results[0]) await logCall(tasks.results[0].id, call);
			else params.set('call', 'not-logged');
		}
		const { href } = submissionOutcome(submission);
		const extra = params.toString();
		await goto(extra ? `${href}${href.includes('?') ? '&' : '?'}${extra}` : href);
	}
</script>

<svelte:head><title>New application · Vendor Ops</title></svelte:head>

<div class="mx-auto flex max-w-4xl flex-col gap-4 p-2">
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-lg font-bold">New application</h1>
			<p class="text-xs text-base-content/60">
				Starts at New with a discovery call task. If the vendor already has an open application, this is added to it.
			</p>
		</div>
		<a href="/applications" class="link text-sm">Back to applications</a>
	</header>
	<VendorForm mode="create" cancelHref="/applications" onsave={save} {extraDirty}>
		{#snippet extra()}
			<section class="card bg-base-100 border border-base-200 shadow-sm">
				<div class="card-body gap-4">
					<div>
						<h2 class="card-title text-sm">Order</h2>
						<p class="text-xs text-base-content/60">
							Booths and add-ons the vendor asked for. Administrators confirm or waitlist each line later.
						</p>
					</div>
					{#if weekendsError}
						<p role="alert" class="text-xs text-error">{weekendsError}</p>
					{:else}
						<OrderLinesPicker {weekends} bind:lines errors={lineErrors} idPrefix="new-order" />
					{/if}
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-1">
							<label class="text-sm font-medium" for="application-source">Source</label>
							<select id="application-source" class="input-line" bind:value={source}>
								{#each sources as option (option)}<option value={option}>{option}</option>{/each}
							</select>
						</div>
						<div class="flex flex-col gap-1 sm:col-span-2">
							<label class="text-sm font-medium" for="application-notes">Application notes</label>
							<textarea id="application-notes" class="input-line" rows="2" bind:value={notes} placeholder="Saved as an application review note"></textarea>
						</div>
					</div>
					{#if session.isAdmin}
						<fieldset class="grid gap-4 sm:grid-cols-3" aria-describedby={discountError ? 'discount-error' : undefined}>
							<legend class="mb-2 text-sm font-medium">Order discount</legend>
							<div class="flex flex-col gap-1">
								<label class="text-xs" for="discount-type">Type</label>
								<select id="discount-type" class="input-line" bind:value={discountType}>
									<option value="NONE">No discount</option>
									<option value="PERCENT">Percent of confirmed lines</option>
									<option value="FIXED">Fixed amount</option>
								</select>
							</div>
							{#if discountType !== 'NONE'}
								<div class="flex flex-col gap-1">
									<label class="text-xs" for="discount-value">{discountType === 'PERCENT' ? 'Percent' : 'Amount (USD)'}</label>
									<input id="discount-value" class="input-line" inputmode="decimal" placeholder={discountType === 'PERCENT' ? '10' : '25.00'} bind:value={discountValue} aria-invalid={Boolean(discountError)} />
								</div>
								<div class="flex flex-col gap-1">
									<label class="text-xs" for="discount-label">Label</label>
									<input id="discount-label" class="input-line" placeholder="New Vendor Trial" bind:value={discountLabel} />
								</div>
							{/if}
							{#if discountError}<p id="discount-error" class="text-error text-xs sm:col-span-3">{discountError}</p>{/if}
						</fieldset>
					{/if}
				</div>
			</section>
		{/snippet}
	</VendorForm>
</div>
