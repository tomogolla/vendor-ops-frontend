<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import ActivityTimeline from '#lib/components/ActivityTimeline.svelte';
	import CallActionsCard from '#lib/components/CallActionsCard.svelte';
	import LabelBadge from '#lib/components/LabelBadge.svelte';
	import NotesCard from '#lib/components/NotesCard.svelte';
	import OrderLinesCard from '#lib/components/OrderLinesCard.svelte';
	import StageActionsCard from '#lib/components/StageActionsCard.svelte';
	import StageBadge from '#lib/components/StageBadge.svelte';
	import TotalsCard from '#lib/components/TotalsCard.svelte';
	import { bundledNotice, daysInStage, getApplication, type Application } from '#lib/applications.ts';
	import { listWeekends, type MarketWeekend } from '#lib/catalog.ts';
	import { formatDate, formatDateTime } from '#lib/format.ts';
	import { MAX_CALL_ATTEMPTS } from '#lib/options.ts';
	import { Resource } from '#lib/resource.svelte.ts';
	import { session } from '#lib/session.svelte.ts';
	import { getVendor, listActivity, type ActivityEvent, type Vendor } from '#lib/vendor-store.ts';

	let { data }: PageProps = $props();

	const applicationResource = new Resource<Application>();
	const vendorResource = new Resource<Vendor>();
	const weekends = new Resource<MarketWeekend[]>();
	// TODO(backend): no per-application activity endpoint; the vendor timeline is shown, with this
	// application's events marked.
	const activity = new Resource<ActivityEvent[]>();

	const application = $derived(applicationResource.data?.id === data.id ? applicationResource.data : undefined);
	const vendor = $derived(application && vendorResource.data?.id === application.vendorId ? vendorResource.data : undefined);

	function loadApplication() {
		const id = data.id;
		applicationResource.load(() => getApplication(id));
	}
	$effect(loadApplication);

	// Vendor, timeline and capacity depend on the application's vendor.
	let loadedVendorId = '';
	$effect(() => {
		const vendorId = applicationResource.data?.vendorId;
		if (!vendorId || vendorId === loadedVendorId) return;
		loadedVendorId = vendorId;
		vendorResource.load(() => getVendor(vendorId));
		activity.load(() => listActivity(vendorId).then((result) => result.results));
	});
	$effect(() => {
		weekends.load(() => listWeekends({ page_size: 100 }).then((result) => result.results));
	});

	/** After any change: the application (lines, totals, stage), capacity, the vendor's call state and the timeline. */
	function refresh() {
		applicationResource.retry();
		weekends.retry();
		if (loadedVendorId) {
			vendorResource.retry();
			activity.retry();
		}
	}

	const days = $derived(application ? daysInStage(application) : null);
	const notices = $derived.by(() => {
		const params = page.url.searchParams;
		const list: string[] = [];
		if (application && params.get('bundled') === '1') list.push(bundledNotice(application.vendorBrand));
		if (params.get('discount') === 'skipped') list.push('The discount was not applied because the submission joined an existing application. Set it below if needed.');
		if (params.get('call') === 'not-logged') list.push('The call was not logged: this application has no open discovery call task.');
		return list;
	});
</script>

<svelte:head><title>{application?.vendorBrand ?? 'Application'} · Vendor Ops</title></svelte:head>

{#if application}
	<div class="flex flex-col gap-4">
		{#each notices as notice (notice)}
			<div role="status" class="alert alert-info alert-soft text-sm">{notice}</div>
		{/each}

		<div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
			<div class="bg-base-200/60 px-6 py-3 border-b border-base-200 flex flex-wrap items-center justify-between gap-2">
				<div class="flex flex-wrap items-center gap-2">
					<h1 class="font-semibold text-base"><a href={`/vendors/${application.vendorId}`} class="hover:underline">{application.vendorBrand}</a></h1>
					<StageBadge stage={application.stage} size="md" />
					<LabelBadge label={application.vendorLabel} />
					{#if application.hasWaitlistedLines}<span class="badge badge-sm badge-secondary badge-outline">Waitlisted line</span>{/if}
					{#if application.callExhausted}<span class="badge badge-sm badge-error badge-outline">Call exhausted</span>{/if}
				</div>
				<a href="/applications" class="btn btn-ghost btn-sm text-xs font-semibold">Back to board</a>
			</div>
			<dl class="card-body grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
				<div><dt class="text-xs font-semibold text-base-content/70">In stage</dt><dd>{days === null ? '—' : days === 0 ? 'Since today' : `${days} day${days === 1 ? '' : 's'}`}</dd></div>
				<div><dt class="text-xs font-semibold text-base-content/70">Source</dt><dd>{application.source || '—'}</dd></div>
				<div><dt class="text-xs font-semibold text-base-content/70">Owner</dt><dd>{vendor ? (vendor.owner?.name ?? 'Unassigned') : '…'}</dd></div>
				<div><dt class="text-xs font-semibold text-base-content/70">Submitted</dt><dd>{formatDate(application.submittedAt)}{application.submittedBy ? ` by ${application.submittedBy.name}` : ''}</dd></div>
				<div><dt class="text-xs font-semibold text-base-content/70">Category</dt><dd>{application.category || '—'}</dd></div>
				<div class="col-span-2 sm:col-span-3"><dt class="text-xs font-semibold text-base-content/70">Products</dt><dd class="whitespace-pre-line">{application.productDescription || '—'}</dd></div>
			</dl>
		</div>

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-10">
			<div class="flex flex-col gap-4 lg:col-span-7">
				{#if weekends.error}
					<p role="alert" class="text-xs text-error">Capacity could not load: {weekends.error.message}</p>
				{/if}
				<OrderLinesCard {application} weekends={weekends.data ?? []} isAdmin={session.isAdmin} onchanged={refresh} />

				<section class="flex flex-col gap-2" aria-labelledby="call-heading">
					<h2 id="call-heading" class="sr-only">Call and review</h2>
					<div class="card bg-base-100 border border-base-200 shadow-sm">
						<div class="card-body gap-1 py-3 text-xs">
							<p>
								<strong>{application.callAttempts}/{MAX_CALL_ATTEMPTS}</strong> call attempts on this application.
								{#if application.nextTaskDueAt}Next task due {formatDateTime(application.nextTaskDueAt)}.{/if}
							</p>
							{#if application.callExhausted}
								<p role="status" class="text-error">
									The call task closed after {MAX_CALL_ATTEMPTS} unanswered attempts. What happens next is still to be decided; the stage was left unchanged.
								</p>
							{/if}
						</div>
					</div>
					{#if vendor}
						{#key vendor.id}
							<CallActionsCard {vendor} onlogged={refresh} />
						{/key}
					{:else if vendorResource.error}
						<p role="alert" class="text-xs text-error">{vendorResource.error.message}</p>
					{/if}
				</section>
			</div>

			<div class="flex flex-col gap-4 lg:col-span-3">
				<TotalsCard {application} isAdmin={session.isAdmin} onchanged={refresh} />
				<StageActionsCard {application} isAdmin={session.isAdmin} onchanged={refresh} />
				<ActivityTimeline
					title="VENDOR TIMELINE"
					subtitle="All of this vendor's activity; events for this application are marked."
					{activity}
					highlightApplicationId={application.id}
				/>
				{#key application.vendorId}
					<NotesCard vendorId={application.vendorId} onadded={() => activity.retry()} />
				{/key}
			</div>
		</div>
	</div>
{:else if applicationResource.notFound}
	<div class="card bg-base-100 mx-auto max-w-xl border border-base-200 shadow-sm">
		<div class="card-body items-start">
			<h1 class="card-title">Application not found</h1>
			<p class="text-sm text-base-content/70">There is no application with ID {data.id}.</p>
			<a href="/applications" class="btn btn-primary btn-sm">Back to applications</a>
		</div>
	</div>
{:else if applicationResource.error}
	<div role="alert" class="alert alert-error alert-soft flex flex-wrap justify-between text-sm">
		<span>{applicationResource.error.message}</span>
		<button type="button" class="btn btn-sm" onclick={applicationResource.retry}>Retry</button>
	</div>
{:else}
	<div class="flex items-center gap-2 p-4 text-sm text-base-content/60" role="status">
		<span class="loading loading-spinner loading-sm"></span> Loading application…
	</div>
{/if}
