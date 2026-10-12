<script lang="ts">
    import type { PageProps } from './$types';
    import CallActionsCard from '#lib/components/CallActionsCard.svelte';
    import SendInvoiceModal from '#lib/components/SendInvoiceModal.svelte';
    import DocumentChecklist from '#lib/components/DocumentChecklist.svelte';
    import StatusBadge from '#lib/components/StatusBadge.svelte';
    import { formatDate, formatDateTime, instagramUrl } from '#lib/format.ts';
    import {
        canTransition,
        needsCall,
        outcomeSuggestions,
        setStatus,
        statusLabels,
        vendors,
        type VendorStatus
    } from '#lib/vendor-store.ts';
    import { isIncomplete, requiredErrors } from '#lib/vendor-validation.ts';

    let { data }: PageProps = $props();
    // TODO(decision): vendors vs customers — contact link assumes the same id until the data model is settled.
    // Decision: vendors are separate from customers - a customer can be a vendor, but a vendor is not necessarily a customer. The contact link should point to the customer page for now, until the data model is settled.
    // Thought: an invoice billed to a vendor(under a brand name) might be paid by a different person i.e. shopify/Stripe might return different customer details (name and email) which should create an match task
    // an inoice id will still mark the vendor as paid for the billed products

    const contactHref = $derived(`/customers/${data.id}`);
    const vendor = $derived($vendors.find((item) => item.id === data.id));
    const missing = $derived(vendor && isIncomplete(vendor) ? Object.values(requiredErrors(vendor, vendor.status)) : []);

    type Action = {
        to: VendorStatus;
        label: string;
        kind: 'direct' | 'invoice' | 'confirm';
        tone: string;
    };
    const accept: Action = { to: 'approved', label: 'Accept', kind: 'invoice', tone: 'btn-primary' };
    const decline: Action = { to: 'declined', label: 'Decline', kind: 'confirm', tone: 'btn-error btn-outline' };
    const review = (label: string): Action => ({ to: 'in_review', label, kind: 'direct', tone: 'btn-outline' });
    const actionsByStatus: Record<VendorStatus, Action[]> = {
        lead: [{ to: 'applied', label: 'Mark as applied', kind: 'direct', tone: 'btn-primary' }, review('Start review')],
        applied: [review('Start review')],
        in_review: [accept, { to: 'waitlisted', label: 'Waitlist', kind: 'confirm', tone: 'btn-neutral btn-outline' }, decline],
        waitlisted: [accept, decline, review('Back to review')],
        approved: [{ to: 'suspended', label: 'Flag for suspension', kind: 'confirm', tone: 'btn-error btn-outline' }],
        suspended: [{ to: 'approved', label: 'Reinstate', kind: 'direct', tone: 'btn-primary' }],
        declined: [review('Reopen')]
    };
    const actions = $derived(
        vendor ? actionsByStatus[vendor.status].filter((action) => canTransition(vendor.status, action.to)) : []
    );

    let dismissedSuggestion = $state('');
    const suggestion = $derived.by(() => {
        if (!vendor?.call.callOutcome) return null;
        const to = outcomeSuggestions[vendor.call.callOutcome];
        if (!to || !canTransition(vendor.status, to)) return null;
        if (dismissedSuggestion === `${vendor.id}:${vendor.call.callOutcome}`) return null;
        return actions.find((action) => action.to === to) ?? (to === 'declined' ? decline : null);
    });

    let invoiceModal: SendInvoiceModal | undefined = $state();
    let confirmDialog: HTMLDialogElement | undefined = $state();
    let pending: Action | null = $state(null);
    let note = $state('');
    let busy = $state(false);
    let actionError = $state('');

    async function changeStatus(to: VendorStatus, statusNote?: string) {
        busy = true;
        actionError = '';
        const result = await setStatus(data.id, to, statusNote);
        busy = false;
        if (!result.ok) actionError = result.message;
        return result.ok;
    }

    function run(action: Action, presetNote = '') {
        actionError = '';
        if (action.kind === 'invoice') {
            invoiceModal?.showModal();
        } else if (action.kind === 'confirm') {
            pending = action;
            note = presetNote;
            confirmDialog?.showModal();
        } else {
            changeStatus(action.to);
        }
    }

    async function confirmPending(event: SubmitEvent) {
        event.preventDefault();
        if (!pending) return;
        if (await changeStatus(pending.to, note)) confirmDialog?.close();
    }

    function invoiceSent() {
        // TODO(backend): create the Shopify/Stripe invoice and send the acceptance email before approving.
        changeStatus('approved');
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
<div class="rounded-box grid grid-cols-1 md:grid-cols-10 gap-4">
    <!-- Column 1 (70% width on desktop) -->
    <div class="flex flex-col gap-4 md:col-span-7">
    <div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
        <div class="bg-base-200/60 px-6 py-3 border-b border-base-200 flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
                <h1 class="font-semibold text-base text-base-content">{vendor.brandName}</h1>
                <span class="text-base-content/50 font-mono text-xs">#{vendor.id}</span>
                <StatusBadge status={vendor.status} />
                {#if missing.length}
                    <span class="badge badge-sm badge-warning" title={missing.join(' ')}>Incomplete</span>
                {/if}
                {#if needsCall(vendor)}
                    <span class="badge badge-sm badge-info badge-outline">To call</span>
                {/if}
            </div>
            <div class="flex gap-2">
                <a href={`/vendors/${vendor.id}/edit`} class="btn btn-primary btn-sm text-xs font-semibold">Edit</a>
                <a href={vendor.status === 'approved' || vendor.status === 'suspended' ? '/vendors' : '/applications'} class="btn btn-ghost btn-sm text-xs font-semibold">Back to list</a>
            </div>
        </div>

        <div class="card-body">
            {#if missing.length}
                <div role="status" class="alert alert-warning text-xs">
                    <div>
                        <p class="font-semibold">This {statusLabels[vendor.status].toLowerCase()} record is missing:</p>
                        <ul class="list-disc pl-4">
                            {#each missing as message (message)}<li>{message}</li>{/each}
                        </ul>
                    </div>
                </div>
            {/if}

            <dl class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {@render section('Contact')}
                <div>
                    <dt class="text-xs font-semibold text-base-content/70">Contact name</dt>
                    <dd class="text-sm">
                        {#if vendor.firstName || vendor.lastName}
                            <a href={contactHref} class="font-medium text-blue-600 hover:text-blue-800 hover:underline">{vendor.firstName} {vendor.lastName}</a>
                        {:else}—{/if}
                    </dd>
                </div>
                {@render field('Brand name', vendor.brandName)}
                {@render field('Email', vendor.email)}
                {@render field('Phone', vendor.phone)}
                <div>
                    <dt class="text-xs font-semibold text-base-content/70">Instagram</dt>
                    <dd class="text-sm">
                        {#if vendor.instagram}
                            <a href={instagramUrl(vendor.instagram)} target="_blank" rel="noreferrer" class="text-blue-600 hover:underline">{vendor.instagram}</a>
                        {:else}—{/if}
                    </dd>
                </div>
                <div>
                    <dt class="text-xs font-semibold text-base-content/70">Website</dt>
                    <dd class="text-sm break-all">
                        {#if vendor.website}
                            <a href={vendor.website} target="_blank" rel="noreferrer" class="text-blue-600 hover:underline">{vendor.website}</a>
                        {:else}—{/if}
                    </dd>
                </div>

                {@render section('Brand')}
                {@render field('Category', vendor.category)}
                {@render field('Commitment level', vendor.commitmentLevel)}
                <div class="sm:col-span-2">{@render field('About the brand', vendor.aboutBrand)}</div>
                <div class="sm:col-span-2">{@render field('Objectives for joining The Good Flea', vendor.objectives)}</div>
                <div class="sm:col-span-2">{@render field('Other markets', vendor.otherMarkets)}</div>

                {@render section('Lead details')}
                {@render field('Lead source', vendor.leadSource)}
                <div>
                    <dt class="text-xs font-semibold text-base-content/70">Tags</dt>
                    <dd class="flex flex-wrap gap-1">
                        {#each vendor.tags as tag (tag)}<span class="badge badge-sm">{tag}</span>{:else}<span class="text-sm">—</span>{/each}
                    </dd>
                </div>
                {@render field('Created', formatDate(vendor.createdAt))}
                {@render field('Imported', vendor.importedAt ? formatDate(vendor.importedAt) : '')}
                <div class="sm:col-span-2">{@render field('Notes', vendor.notes)}</div>

                {@render section('Compliance')}
                {@render field('Business registration', vendor.businessRegistration)}
                {@render field('General liability insurance', vendor.liabilityInsurance)}

                {@render section('Booking interest')}
                {@render field('Proposed booth size', vendor.proposedBoothSize)}
                {@render field('Needs a tent', vendor.needsTent ? 'Yes' : 'No')}
                <div class="sm:col-span-2">{@render field('Requested weekends', vendor.requestedWeekends.join(', '))}</div>
                {@render field('Booked dates', vendor.bookedDates.join(', '))}
                {@render field('Markets attended', vendor.marketsAttended.join(', '))}
            </dl>
        </div>
    </div>
    {#key vendor.id}
        <CallActionsCard {vendor} />
    {/key}
    </div>

    <!-- Column 2 Container (30% width on desktop) -->
    <div class="flex flex-col gap-4 md:col-span-3">
        <div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
            <div class="card-body gap-3">
                <h4 class="card-title">STATUS</h4>
                <div><StatusBadge status={vendor.status} size="md" /></div>
                {#if suggestion && vendor.call.callOutcome}
                    {@const outcome = vendor.call.callOutcome}
                    <div role="status" class="rounded-lg border border-info/40 bg-info/10 p-2 text-xs">
                        <p>Last call outcome: <strong>{outcome}</strong>. Suggested next step:</p>
                        <div class="mt-2 flex gap-2">
                            <button type="button" class={['btn btn-xs', suggestion.tone]} disabled={busy} onclick={() => run(suggestion, `Call outcome: ${outcome}`)}>
                                {suggestion.label}
                            </button>
                            <button type="button" class="btn btn-xs btn-ghost" onclick={() => (dismissedSuggestion = `${vendor.id}:${outcome}`)}>
                                Dismiss
                            </button>
                        </div>
                    </div>
                {/if}
                {#if actions.length}
                    <div class="flex flex-col gap-2">
                        {#each actions as action (action.label)}
                            <button type="button" class={['btn btn-sm w-full', action.tone]} disabled={busy} onclick={() => run(action)}>
                                {action.label}
                            </button>
                        {/each}
                    </div>
                {/if}
                {#if actionError}
                    <p role="alert" class="text-error text-xs">{actionError}</p>
                {/if}
                <SendInvoiceModal
                    bind:this={invoiceModal}
                    brandName={vendor.brandName}
                    vendorName={`${vendor.firstName} ${vendor.lastName}`.trim()}
                    email={vendor.email}
                    onsend={invoiceSent}
                />
            </div>
        </div>

        <div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
            <div class="card-body gap-3">
                <h4 class="card-title">STATUS HISTORY</h4>
                <ol class="flex flex-col gap-2">
                    {#each [...vendor.statusHistory].reverse() as change, index (index)}
                        <li class="border-l-2 border-base-300 pl-3">
                            <p class="text-xs font-medium">
                                {#if change.from}
                                    {statusLabels[change.from]} → {statusLabels[change.to]}
                                {:else}
                                    Created as {statusLabels[change.to]}
                                {/if}
                            </p>
                            <p class="text-[11px] text-base-content/60">{formatDateTime(change.at)}</p>
                            {#if change.note}<p class="text-xs text-base-content/80 whitespace-pre-line">{change.note}</p>{/if}
                        </li>
                    {/each}
                </ol>
            </div>
        </div>

        <!-- Independent Card 1: Evaluation Rubric -->
        <div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
            <div class="card-body">
                <h4 class="card-title">EVALUATION RUBRIC</h4>
                <fieldset class="fieldset">
                    <legend class="fieldset-legend font-semibold">Reviewer Notes</legend>
                    <textarea id="goals" class="textarea textarea-bordered w-full h-20" placeholder="vendor is a good fit for the market"></textarea>
                </fieldset>
                <fieldset class="fieldset">
                    <label class="label" for="name">Tags</label>
                    <input type="text" id="name" class="input" placeholder="e.g. new vendor" />
                </fieldset>
            </div>
        </div>

        <!-- Independent Card 2: Email Sequence Actions -->
        <div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
            <div class="card-body">
                <h4 class="card-title">EMAIL SEQUENCE ACTIONS</h4>
                <ul class="menu menu-sm rounded-box w-56 p-0">
                    <li><button type="button">Welcome to The Good Flea</button></li>
                    <li><button type="button">What Kind of Vendors We Are Looking For</button></li>
                    <li><button type="button">How the Application Process Works</button></li>
                    <li><button type="button">Apply for Upcoming Weekends</button></li>
                </ul>
            </div>
        </div>
        <DocumentChecklist />
        <div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
            <div class="card-body">
                <h4 class="card-title">QUICK ACTIONS</h4>
                <!-- TODO(next slice): wire these to the call list and market weekend bookings. -->
                <ul class="menu menu-sm rounded-box w-56 p-0">
                    <li><button type="button" disabled>Add vendor to call list</button></li>
                    <li><button type="button" disabled>Add vendor to market weekend</button></li>
                </ul>
            </div>
        </div>
    </div>
</div>

<dialog bind:this={confirmDialog} class="modal" aria-labelledby="confirm-status-title">
    <div class="modal-box max-w-md">
        <form class="flex flex-col gap-3" onsubmit={confirmPending}>
            <h3 id="confirm-status-title" class="font-bold text-base">
                {pending?.label}: {vendor.brandName}
            </h3>
            {#if pending}
                <p class="text-sm text-base-content/70">
                    Status will change from {statusLabels[vendor.status]} to {statusLabels[pending.to]}.
                </p>
            {/if}
            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium" for="status-note">Note (optional)</label>
                <textarea id="status-note" class="textarea w-full" rows="3" bind:value={note} placeholder="Saved in the status history"></textarea>
            </div>
            {#if actionError}<p role="alert" class="text-error text-xs">{actionError}</p>{/if}
            <div class="modal-action mt-0">
                <button type="button" class="btn btn-sm" onclick={() => confirmDialog?.close()}>Cancel</button>
                <button type="submit" class={['btn btn-sm', pending?.tone]} disabled={busy}>Confirm</button>
            </div>
        </form>
    </div>
    <form method="dialog" class="modal-backdrop"><button aria-label="Close">close</button></form>
</dialog>
{:else}
    <div class="card bg-base-100 mx-auto max-w-xl border border-base-200 shadow-sm">
        <div class="card-body items-start">
            <h1 class="card-title">Vendor not found</h1>
            <p class="text-sm text-base-content/70">There is no vendor account with ID #{data.id}.</p>
            <a href="/vendors" class="btn btn-primary btn-sm">Return to vendor list</a>
        </div>
    </div>
{/if}

<style>
    .card-title {
        font-size: 0.75rem;
        font-weight: bold;
    }
    .menu li button {
        font-size: 0.75rem;
        text-decoration: underline;
        text-decoration-color: var(--brand-color);
    }

    .btn-primary {
        background-color: var(--brand-color);
        border-color: var(--brand-color);
        box-shadow: 0 0 0 3px var(--brand-color);
        color: white;
    }
</style>
