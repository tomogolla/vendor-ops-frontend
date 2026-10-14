<script lang="ts">
	import type { PageProps } from './$types';
	import ActivityTimeline from '#lib/components/ActivityTimeline.svelte';
	import CallActionsCard from '#lib/components/CallActionsCard.svelte';
	import DocumentChecklist from '#lib/components/DocumentChecklist.svelte';
	import LabelBadge from '#lib/components/LabelBadge.svelte';
	import LineStatusBadge from '#lib/components/LineStatusBadge.svelte';
	import NotesCard from '#lib/components/NotesCard.svelte';
	import StageBadge from '#lib/components/StageBadge.svelte';
	import { bookingsByWeekend, listApplications, type Application } from '#lib/applications.ts';
	import { formatDate, formatMoney, instagramUrl } from '#lib/format.ts';
	import { Resource } from '#lib/resource.svelte.ts';
	import { session } from '#lib/session.svelte.ts';
	import { getVendor, listActivity, needsCall, setStatus, type ActivityEvent, type Vendor } from '#lib/vendor-store.ts';
	import { isIncomplete, requiredErrors } from '#lib/vendor-validation.ts';

	let { data }: PageProps = $props();

	const vendorResource = new Resource<Vendor>();
	const applications = new Resource<Application[]>();
	const activity = new Resource<ActivityEvent[]>();

	function refresh() {
		const id = data.id;
		vendorResource.load(() => getVendor(id));
		applications.load(() => listApplications({ vendor: id, ordering: '-submitted_at', page_size: 100 }).then((page) => page.results));
		activity.load(() => listActivity(id).then((page) => page.results));
	}
	$effect(refresh);

	const vendor = $derived(vendorResource.data?.id === data.id ? vendorResource.data : undefined);
	const missing = $derived(vendor && isIncomplete(vendor) ? Object.values(requiredErrors(vendor, vendor.status)) : []);
	const bookings = $derived(bookingsByWeekend(applications.data ?? []));

	// --- Suspend and reinstate (administrators) ------------------------------------------------
	// TODO(backend): dedicated suspend endpoint. Until then this uses the deprecated
	// POST /vendors/{id}/status/ (suspended / approved), which the backend keeps for this.
	const accountAction = $derived.by(() => {
		if (!vendor || !session.isAdmin) return null;
		if (vendor.status === 'suspended') return { to: 'approved' as const, label: 'Reinstate', tone: 'btn-primary' };
		if (vendor.status === 'approved') return { to: 'suspended' as const, label: 'Suspend', tone: 'btn-error btn-outline' };
		return null;
	});
	let dialog: HTMLDialogElement | undefined = $state();
	let note = $state('');
	let busy = $state(false);
	let actionError = $state('');

	async function confirmAccountAction(event: SubmitEvent) {
		event.preventDefault();
		if (!accountAction) return;
		busy = true;
		actionError = '';
		const result = await setStatus(data.id, accountAction.to, note);
		busy = false;
		if (!result.ok) {
			actionError = result.message;
			return;
		}
		dialog?.close();
		refresh();
	}
</script>

{#snippet field(label: string, value: string | undefined)}
	<div>
		<dt class="text-xs font-semibold text-base-content/70">{label}</dt>
		<dd class="text-sm text-base-content/90 whitespace-pre-line">{value || '—'}</dd>
	</div>
{/snippet}

{#snippet section(title: string)}
	<h2 class="col-span-full mt-2 border-b border-base-200 pb-1 text-xs font-bold uppercase tracking-wide text-base-content/60">{title}</h2>
{/snippet}

<svelte:head><title>{vendor?.brandName ?? 'Vendor'} · Vendor Ops</title></svelte:head>

{#if vendor}
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-10">
		<div class="flex flex-col gap-4 lg:col-span-7">
			<div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
				<div class="bg-base-200/60 px-6 py-3 border-b border-base-200 flex flex-wrap items-center justify-between gap-2">
					<div class="flex flex-wrap items-center gap-2">
						<h1 class="font-semibold text-base">{vendor.brandName}</h1>
						<LabelBadge label={vendor.label} size="md" />
						{#if missing.length}<span class="badge badge-sm badge-warning" title={missing.join(' ')}>Incomplete</span>{/if}
						{#if needsCall(vendor)}<span class="badge badge-sm badge-info badge-outline">To call</span>{/if}
					</div>
					<div class="flex gap-2">
						<a href={`/vendors/${vendor.id}/edit`} class="btn btn-primary btn-sm text-xs font-semibold">Edit</a>
						<a href="/vendors" class="btn btn-ghost btn-sm text-xs font-semibold">Back to vendors</a>
					</div>
				</div>
				<div class="card-body">
					{#if missing.length}
						<div role="status" class="alert alert-warning text-xs">
							<div>
								<p class="font-semibold">This vendor's details are missing:</p>
								<ul class="list-disc pl-4">{#each missing as message (message)}<li>{message}</li>{/each}</ul>
							</div>
						</div>
					{/if}
					<dl class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
						{@render section('Contact')}
						{@render field('Contact name', `${vendor.firstName} ${vendor.lastName}`.trim())}
						{@render field('Email', vendor.email)}
						{@render field('Phone', vendor.phone)}
						<div>
							<dt class="text-xs font-semibold text-base-content/70">Instagram</dt>
							<dd class="text-sm">
								{#if vendor.instagram}<a href={instagramUrl(vendor.instagram)} target="_blank" rel="noreferrer" class="text-blue-600 hover:underline">{vendor.instagram}</a>{:else}—{/if}
							</dd>
						</div>
						<div>
							<dt class="text-xs font-semibold text-base-content/70">Website</dt>
							<dd class="text-sm break-all">
								{#if vendor.website}<a href={vendor.website} target="_blank" rel="noreferrer" class="text-blue-600 hover:underline">{vendor.website}</a>{:else}—{/if}
							</dd>
						</div>

						{@render section('Brand')}
						{@render field('Category', vendor.category)}
						{@render field('Commitment level', vendor.commitmentLevel)}
						<div class="sm:col-span-2">{@render field('About the brand', vendor.aboutBrand)}</div>
						<div class="sm:col-span-2">{@render field('Objectives for joining The Good Flea', vendor.objectives)}</div>
						<div class="sm:col-span-2">{@render field('Other markets', vendor.otherMarkets)}</div>

						{@render section('Account')}
						{@render field('Lead source', vendor.leadSource)}
						<div>
							<dt class="text-xs font-semibold text-base-content/70">Tags</dt>
							<dd class="flex flex-wrap gap-1">{#each vendor.tags as tag (tag)}<span class="badge badge-sm">{tag}</span>{:else}<span class="text-sm">—</span>{/each}</dd>
						</div>
						{@render field('Owner', vendor.owner?.name ?? 'Unassigned')}
						{@render field('Created', `${formatDate(vendor.createdAt)}${vendor.createdBy ? ` by ${vendor.createdBy.name}` : ''}`)}
						{@render field('Active', vendor.isActive ? (vendor.outreachOptOut ? 'Yes (excluded from outreach)' : 'Yes') : 'No')}
						<div class="sm:col-span-2">{@render field('Notes', vendor.notes)}</div>

						{@render section('Compliance')}
						{@render field('Business registration', vendor.businessRegistration)}
						{@render field('General liability insurance', vendor.liabilityInsurance)}
					</dl>
				</div>
			</div>

			<section class="card bg-base-100 w-full shadow-sm border border-base-200" aria-labelledby="vendor-applications">
				<div class="card-body gap-3">
					<div class="flex items-center justify-between">
						<h2 id="vendor-applications" class="text-xs font-bold">APPLICATIONS</h2>
						<a href="/applications/new" class="btn btn-xs btn-outline">New application</a>
					</div>
					{#if applications.error}
						<p role="alert" class="text-xs text-error">{applications.error.message} <button type="button" class="link" onclick={applications.retry}>Retry</button></p>
					{:else if !applications.data}
						<p class="text-xs text-base-content/60">Loading applications…</p>
					{:else}
						<ul class="flex flex-col divide-y divide-base-200">
							{#each applications.data as application (application.id)}
								<li class="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
									<div class="flex flex-wrap items-center gap-2">
										<a href={`/applications/${application.id}`} class="font-medium hover:underline">Submitted {formatDate(application.submittedAt)}</a>
										<StageBadge stage={application.stage} />
										<span class="text-xs text-base-content/60">{application.source}</span>
									</div>
									<div class="text-xs text-base-content/70">
										{application.lines.length} line{application.lines.length === 1 ? '' : 's'} ·
										confirmed {formatMoney(application.totals.confirmedTotalCents, application.totals.currency)}
										of {formatMoney(application.totals.requestedTotalCents, application.totals.currency)} requested
									</div>
								</li>
							{:else}
								<li class="py-2 text-xs text-base-content/60">No applications yet.</li>
							{/each}
						</ul>
					{/if}
				</div>
			</section>

			<section class="card bg-base-100 w-full shadow-sm border border-base-200" aria-labelledby="vendor-bookings">
				<div class="card-body gap-3">
					<h2 id="vendor-bookings" class="text-xs font-bold">BOOKINGS</h2>
					<p class="text-[11px] text-base-content/60">Confirmed lines across all applications.</p>
					{#each bookings as group (group.weekend.id)}
						<div>
							<h3 class="text-sm font-semibold">{group.weekend.label} <span class="text-xs font-normal text-base-content/60">{formatDate(group.weekend.startDate)}</span></h3>
							<ul class="mt-1 flex flex-col gap-1 text-sm">
								{#each group.bookings as booking (booking.line.id)}
									<li class="flex flex-wrap items-center gap-2">
										<span>{booking.line.kind === 'add_on' ? '↳ ' : ''}{booking.line.productName} ×{booking.line.quantity}</span>
										<LineStatusBadge status={booking.line.status} />
										<a href={`/applications/${booking.application.id}`} class="link text-xs">application</a>
										<StageBadge stage={booking.application.stage} />
									</li>
								{/each}
							</ul>
						</div>
					{:else}
						<p class="text-xs text-base-content/60">{applications.data ? 'No confirmed bookings.' : 'Loading…'}</p>
					{/each}
				</div>
			</section>

			{#if vendor.call.openTaskId}
				{#key vendor.id}
					<CallActionsCard {vendor} onlogged={refresh} />
				{/key}
			{/if}
		</div>

		<div class="flex flex-col gap-4 lg:col-span-3">
			{#if accountAction}
				<div class="card bg-base-100 w-full shadow-sm border border-base-200">
					<div class="card-body gap-2">
						<h2 class="text-xs font-bold">ACCOUNT</h2>
						<button type="button" class={['btn btn-sm w-full', accountAction.tone]} onclick={() => { note = ''; actionError = ''; dialog?.showModal(); }}>
							{accountAction.label}
						</button>
					</div>
				</div>
			{/if}
			<ActivityTimeline title="TIMELINE" {activity} />
			{#key vendor.id}
				<NotesCard vendorId={vendor.id} onadded={() => activity.retry()} />
			{/key}
			<DocumentChecklist />
		</div>
	</div>

	<dialog bind:this={dialog} class="modal" aria-labelledby="account-action-title">
		<div class="modal-box max-w-md">
			<form class="flex flex-col gap-3" onsubmit={confirmAccountAction}>
				<h3 id="account-action-title" class="font-bold text-base">{accountAction?.label}: {vendor.brandName}</h3>
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium" for="account-note">Note (optional)</label>
					<textarea id="account-note" class="textarea w-full" rows="3" bind:value={note} placeholder="Saved in the timeline"></textarea>
				</div>
				{#if actionError}<p role="alert" class="text-error text-xs">{actionError}</p>{/if}
				<div class="modal-action mt-0">
					<button type="button" class="btn btn-sm" onclick={() => dialog?.close()}>Cancel</button>
					<button type="submit" class={['btn btn-sm', accountAction?.tone]} disabled={busy}>Confirm</button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop"><button aria-label="Close">close</button></form>
	</dialog>
{:else if vendorResource.notFound}
	<div class="card bg-base-100 mx-auto max-w-xl border border-base-200 shadow-sm">
		<div class="card-body items-start">
			<h1 class="card-title">Vendor not found</h1>
			<p class="text-sm text-base-content/70">There is no vendor with ID {data.id}.</p>
			<a href="/vendors" class="btn btn-primary btn-sm">Return to vendor list</a>
		</div>
	</div>
{:else if vendorResource.error}
	<div role="alert" class="alert alert-error alert-soft flex flex-wrap justify-between text-sm">
		<span>{vendorResource.error.message}</span>
		<button type="button" class="btn btn-sm" onclick={vendorResource.retry}>Retry</button>
	</div>
{:else}
	<div class="flex items-center gap-2 p-4 text-sm text-base-content/60" role="status">
		<span class="loading loading-spinner loading-sm"></span> Loading vendor…
	</div>
{/if}
