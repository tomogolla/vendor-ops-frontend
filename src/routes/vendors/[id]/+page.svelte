<script lang="ts">
    import type { PageProps } from './$types';
    import ApproveVendorModal from '#lib/components/ApproveVendorModal.svelte';
    import DocumentChecklist from '#lib/components/DocumentChecklist.svelte';

    let { data }: PageProps = $props();
    // TODO(decision): vendors vs customers — contact link assumes the same id until the data model is settled.
    const contactHref = $derived(`/customers/${data.id}`);

    let approveModal: ApproveVendorModal | undefined = $state();
</script>

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
                Vendor Name: <span class="text-base-content font-medium">Michael Moris</span> <span class="text-base-content/50 font-mono text-xs">#{data.id}</span>
            </span>

            <!-- Back Button Link (Right Side) -->
             <div class="flex gap-2">
                 <button
                    type="button"
                    class="btn btn-primary btn-sm text-xs font-semibold"
                    onclick={() => approveModal?.showModal()}
                >Edit Vendor Details
                </button>
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
                    <a href={contactHref} class="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150 ease-in-out">Michael Moris</a>
                </p>

            </div>

            <!-- Row 2 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Reference links</h4>
                <p class="text-xs text-slate-500 ">Instagram: @astoriavintage<span class="text-slate-600">website: https://astoriavintage.com</span></p>
            
            </div>

            <!-- Row 3 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Brand Name</h4>
                <p class="text-xs text-slate-500 leading-relaxed">Astoria Vintage</p>
            </div>

            <!-- Row 4 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Contact Email</h4>
                <p class="text-xs text-slate-500 leading-relaxed">michael@astoriavintage.com</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Phone</h4>
                <p class="text-xs text-slate-500 leading-relaxed">(555) 123-4567</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Category</h4>
                <p class="text-xs text-slate-500 leading-relaxed">Fashion</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">About Brand</h4>
                <p class="text-xs text-slate-500 leading-relaxed">Creating unique and sustainable fashion pieces that celebrate individuality and environmental consciousness.</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Objectives of joining The Good Flea</h4>
                <p class="text-xs text-slate-500 leading-relaxed">To expand our brand presence and reach new customers through collaboration.</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Proposed booth dimensions</h4>
                <p class="text-xs text-slate-500 leading-relaxed">8ft x 10ft</p>
            </div>
            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Booked dates</h4>
                <p class="text-xs text-slate-500 leading-relaxed">October 10 & 11, October 17 & 18</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Notes</h4>
                <p class="text-xs text-slate-500 leading-relaxed">Lillian was referred at the last market. They curate high end 90s sportswear. Looking to book the next weekend</p>
            </div>
            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Markets attended</h4>
                <p class="text-xs text-slate-500 leading-relaxed">October 4 & 5</p>
                <p class="text-xs text-slate-500 leading-relaxed">October 10 & 11</p>
                <p class="text-xs text-slate-500 leading-relaxed">October 17 & 18</p>
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
                <h4 class="card-title">DECISION ACTIONS</h4>

                <!-- Top Row: Full Width Primary Action -->
                
                <!-- You can open the modal using ID.showModal() method -->
                <button
                    type="button"
                    class="btn btn-primary btn-outline w-full"
                    onclick={() => approveModal?.showModal()}
                    >Accept Application
                </button>
                <ApproveVendorModal bind:this={approveModal} />
                <!-- Bottom Row: 50% / 50% Secondary Actions -->
                <div class="grid grid-cols-2 gap-3 w-full">
                    <button class="btn btn-neutral btn-outline w-full"
                        >Waitlist</button
                    >
                    <button class="btn btn-error btn-outline w-full"
                        >Decline</button
                    >
                </div>
            </div>
            
        </div>
    </div>
</div>

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
