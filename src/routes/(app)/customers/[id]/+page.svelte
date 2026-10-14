<!-- TODO(finance): mock page, unlinked from the menu in v1.3; replaced when invoices, payments and payers arrive. -->
<script lang="ts">
    import type { PageProps } from './$types';

    import DocumentChecklist from '#lib/components/DocumentChecklist.svelte';

    let { data }: PageProps = $props();
    // TODO(decision): vendors vs customers — contact link assumes the same id until the data model is settled.
    // outcome vendors are separate from customers
    const contactHref = $derived(`/customers/${data.id}`);


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
                Customer Name: <span class="text-base-content font-medium">Michael Moris</span> <span class="text-base-content/50 font-mono text-xs">#{data.id}</span>
            </span>

            
        
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
                <p class="text-xs text-slate-500 ">---</p>
            
            </div>

            <!-- Row 3 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Brand Name</h4>
                <p class="text-xs text-slate-500 leading-relaxed">---</p>
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
                <p class="text-xs text-slate-500 leading-relaxed">---</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Notes</h4>
                <p class="text-xs text-slate-500 leading-relaxed">---</p>
            </div>
            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Purchase History</h4>
                <p class="text-xs text-slate-500 leading-relaxed">October 4 & 5 8ft x 8ft</p>
                <p class="text-xs text-slate-500 leading-relaxed">October 10 & 11 8ft x 8ft</p>
                <p class="text-xs text-slate-500 leading-relaxed">Tent</p>
                <p class="text-xs text-slate-500 leading-relaxed">October 17 & 18 8ft x 12ft</p>
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
                <!-- Row 4: Reviewer Notes -->
                <fieldset class="fieldset">
                    <legend class="fieldset-legend font-semibold"
                        >Add tags</legend
                    >
                 <input type="text" placeholder="e.g. returning vendor" class="input" />
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
                        <li><button type="button">Update vendor information</button></li>
                        <li><button type="button">Send Email</button></li>
                        <li><button type="button">Flag for suspension</button></li>
                    </ul>
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
</style>
