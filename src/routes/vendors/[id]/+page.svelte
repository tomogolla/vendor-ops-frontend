<script lang="ts">
    import type { PageProps } from './$types';
    import ApproveVendorModal from '#lib/components/SendInvoiceModal.svelte';
    import DocumentChecklist from '#lib/components/DocumentChecklist.svelte';
    import { vendors } from '#lib/vendor-store.ts';

    let { data }: PageProps = $props();
    // TODO(decision): vendors vs customers — contact link assumes the same id until the data model is settled.
    // Decision: vendors are separate from customers - a customer can be a vendor, but a vendor is not necessarily a customer. The contact link should point to the customer page for now, until the data model is settled.
    // Thought: an invoice billed to a vendor(under a brand name) might be paid by a different person i.e. shopify/Stripe might return different customer details (name and email) which should create an match task
    // an inoice id will still mark the vendor as paid for the billed products
    
    const contactHref = $derived(`/customers/${data.id}`);
    let vendor = $derived($vendors.find((item) => item.id === data.id));

    let approveModal: ApproveVendorModal | undefined = $state();
</script>

{#if vendor}
<div class="rounded-box grid grid-cols-1 md:grid-cols-10 gap-4">
    <!-- Column 1 (70% width on desktop) -->
    <div
        class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden md:col-span-7"
    >
        <!-- Card Header -->
        <div
            class="bg-base-200/60 px-6 py-3 border-b border-base-200 flex items-center justify-between"
        >
            <!-- Vendor Name (Left Side) -->
            <span class="font-semibold text-sm text-base-content/70">
                Vendor: <span class="text-base-content font-medium">{vendor.brandName}</span> <span class="text-base-content/50 font-mono text-xs">#{vendor.id}</span>
            </span>

            <!-- Back Button Link (Right Side) -->
             <div class="flex gap-2">
                
                 <a
                href="/vendors"
                class="btn btn-primary btn-sm text-xs font-semibold"
            >
                Vendor List
            </a>
             </div>
        
        </div>

        <!-- Card Body -->
        <div class="card-body">
            <div class="w-full max-w-2xl mx-auto mt-3">
            <!-- Row 1 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Contact Name/Customer Name</h4>
                <p class="text-xs text-slate-500 leading-relaxed">
                    <a href={contactHref} class="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150 ease-in-out">{vendor.firstName} {vendor.lastName}</a>
                </p>

            </div>

            <!-- Row 2 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Reference links</h4>
                    <p class="text-xs text-slate-500">Instagram: {vendor.instagram || '—'}</p>
                    <p class="text-xs text-slate-500">Website: {vendor.website || '—'}</p>
            
            </div>

            <!-- Row 3 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Brand Name</h4>
                <p class="text-xs text-slate-500 leading-relaxed">{vendor.brandName}</p>
            </div>

            <!-- Row 4 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Contact Email</h4>
                <p class="text-xs text-slate-500 leading-relaxed">{vendor.email}</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Phone</h4>
                <p class="text-xs text-slate-500 leading-relaxed">{vendor.phone}</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Category</h4>
                <p class="text-xs text-slate-500 leading-relaxed">{vendor.category}</p>
            </div>

            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Lead Source</h4>
                <p class="text-xs text-slate-500 leading-relaxed">{vendor.leadSource || '—'}</p>
            </div>

            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Tags</h4>
                <div class="flex flex-wrap gap-1">
                    {#if vendor.tags.length}
                        {#each vendor.tags as tag}<span class="badge badge-sm">{tag}</span>{/each}
                    {:else}
                        <span class="text-xs text-slate-500">—</span>
                    {/if}
                </div>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">About Brand</h4>
                <p class="text-xs text-slate-500 leading-relaxed">{vendor.aboutBrand || '—'}</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Objectives of joining The Good Flea</h4>
                <p class="text-xs text-slate-500 leading-relaxed">{vendor.objectives || '—'}</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Proposed booth dimensions</h4>
                <p class="text-xs text-slate-500 leading-relaxed">{vendor.boothDimensions || '—'}</p>
            </div>
            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Booked dates</h4>
                <p class="text-xs text-slate-500 leading-relaxed">{vendor.bookedDates.join(', ') || '—'}</p>
            </div>
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Other Markets</h4>
                <p class="text-xs text-slate-500 leading-relaxed">{vendor.otherMarkets || '—'}</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Notes</h4>
                <p class="text-xs text-slate-500 leading-relaxed">{vendor.notes || '—'}</p>
            </div>
            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Markets attended</h4>
                {#if vendor.marketsAttended.length}
                    {#each vendor.marketsAttended as market}<p class="text-xs text-slate-500 leading-relaxed">{market}</p>{/each}
                {:else}
                    <p class="text-xs text-slate-500 leading-relaxed">No markets attended yet.</p>
                {/if}
            </div>
        </div>
        </div>

        <!-- Card Footer -->
    </div>

    <!-- Column 2 Container (30% width on desktop) -->
    <div class="flex flex-col gap-4 md:col-span-3">
        <!-- Independent Card 1: Evaluation Rubric -->
        <div
            class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden"
        >
            <div class="card-body">
                <h4 class="card-title">EVALUATION RUBRIC</h4>

                <!-- Row 4: Reviewer Notes -->
                <fieldset class="fieldset">
                    <legend class="fieldset-legend font-semibold"
                        >Reviewer Notes</legend
                    >
                    <textarea
                        id="goals"
                        class="textarea textarea-bordered w-full h-20"
                        placeholder="vendor is a good fit for the market"
                    ></textarea>
                </fieldset>
                <fieldset class="fieldset">
                    <label class="label" for="name">Tags</label>
                    <input type="text" id="name" class="input" placeholder="e.g. new vendor" />
                    </fieldset>
                </div>
        </div>

        <!-- Independent Card 2: Email Sequence Actions -->
        <div
            class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden"
        >
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
        <div
                class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden"
            >
                <div class="card-body margin-y-3">
                    <h4 class="card-title">QUICK ACTIONS</h4>
                    <ul class="menu menu-sm rounded-box w-56 p-0">
                        <li><button type="button">Assign booth space</button></li>
                        <li><button type="button">Send Email</button></li>
                        <li><button type="button">Add vendor to Call List</button></li>
                        <li><button type="button">Remove vendor from call list</button></li>
                        <li><button type="button">Add vendor to market weekend</button></li>
                        <li><button type="button">Flag for suspension</button></li>
                    </ul>
                </div>
            </div>
        <div
            class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden"
        >
            <div class="card-body gap-4">
                <h4 class="card-title">ACTIONS</h4>

                <!-- Top Row: Full Width Primary Action -->
                
                <!-- You can open the modal using ID.showModal() method -->
                
                <button
                    type="button"
                    class="btn btn-primary w-full"
                    onclick={() => approveModal?.showModal()}
                    >Send Invoice
                </button>
                <ApproveVendorModal bind:this={approveModal} />
                
            </div>
            
        </div>
    </div>
</div>
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
