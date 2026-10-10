<script lang="ts">
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    // TODO(decision): vendors vs customers — contact link assumes the same id until the data model is settled.
    const contactHref = $derived(`/customers/${data.id}`);

    // Set your default content here
    let emailSubject = $state(
        "Welcome to The Good Flea! Your Application Has Been Approved",
    );
    let emailBody = $state(`Hi [Vendor Name],
    
Great news! Your application has been approved for The Good Flea. We loved your submission and can't 
wait to have you at the upcoming market.
To officially secure your booth space, please complete your payment using the secure invoice link 
below within 48 hours:
[Invoice Link Populates Here]
Once paid, we'll send over your load-in details and market day schedule. Welcome to the community!
Best,
The Good Flea Team`);
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
                    <li><a>Welcome to The Good Flea</a></li>
                    <li><a>What Kind of Vendors We Are Looking For</a></li>
                    <li><a>How the Application Process Works</a></li>
                    <li><a>Apply for Upcoming Weekends</a></li>
                </ul>
            </div>
        </div>
        <div
            class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden"
        >
            <div class="card-body">
                <h4 class="card-title mb-2">DOCUMENT CHECKLIST</h4>

                <div class="flex flex-col gap-3">
                    <!-- Item 1 -->
                    <label class="label cursor-pointer justify-start">
                        <input
                            type="checkbox"
                            class="checkbox checkbox-xs border-base-300 checked:bg-[#35b2b2] checked:border-[#35b2b2] checked:text-white"
                        />
                        <span class="text-sm"
                            >Certificate of Insurance</span
                        >
                    </label>

                    <!-- Item 2 -->
                    <label class="label cursor-pointer justify-start ">
                        <input
                            type="checkbox"
                            class="checkbox checkbox-xs border-base-300 checked:bg-[#35b2b2] checked:border-[#35b2b2] checked:text-white"
                        />
                        <span class="text-sm"
                            >Business License</span
                        >
                    </label>

                    <!-- Item 3 -->
                    <label class="label cursor-pointer justify-start">
                        <input
                            type="checkbox"
                            class="checkbox checkbox-xs border-base-300 checked:bg-[#35b2b2] checked:border-[#35b2b2] checked:text-white"
                        />
                        <span class="text-sm"
                            >TGF Info Packet</span
                        >
                    </label>
                </div>
            </div>
        </div>
        <div
                class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden"
            >
                <div class="card-body margin-y-3">
                    <h4 class="card-title">QUICK ACTIONS</h4>
                    <ul class="menu menu-sm rounded-box w-56 p-0">
                        <li><a>Assign booth space</a></li>
                        <li><a>Update vendor information</a></li>
                        <li><a>Send Email</a></li>
                        <li><a>Flag for suspension</a></li>
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
                    class="btn btn-primary btn-outline w-full"
                    onclick={() => {
                        const modal = document.getElementById("my_modal_3");
                        if (modal instanceof HTMLDialogElement)
                            modal.showModal();
                    }}
                    >Accept Application
                </button>
                <dialog id="my_modal_3" class="modal">
                    <div
                        class="modal-box p-0 overflow-hidden border-2 border-[var(--brand-color)] rounded-xl max-w-3xl w-full"
                    >
                        <!-- Close Button -->
                        <form method="dialog">
                            <button
                                class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 z-10 text-white"
                                >✕</button
                            >

                            <!-- Header Section -->
                            <div
                                class="p-4 text-white"
                                style="background-color: var(--brand-color);"
                            >
                                <h3 class="font-bold text-lg">
                                    Approve Vendor & Send Invoice
                                </h3>
                                <p>
                                    Review your acceptance message and attach
                                    their Shopify booth invoice.
                                </p>
                            </div>
                        </form>
                        <!-- Modal Form Body -->
                        <form
                            method="dialog"
                            class="p-6 space-y-5 max-h-[80vh] overflow-y-auto"
                        >
                            <!-- First & Last Name Row -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <fieldset class="fieldset">
                                    <legend
                                        class="fieldset-legend font-semibold"
                                        >BUSINESS NAME</legend
                                    >
                                    <input
                                        type="text"
                                        id="first_name"
                                        class="input input-bordered w-full"
                                        placeholder="First Name"
                                        required
                                        disabled
                                    />
                                </fieldset>

                                <fieldset class="fieldset">
                                    <legend
                                        class="fieldset-legend font-semibold"
                                        >VENDOR NAME</legend
                                    >
                                    <input
                                        type="text"
                                        id="last_name"
                                        class="input input-bordered w-full"
                                        placeholder="Vendor Name"
                                        required
                                        disabled
                                    />
                                </fieldset>
                            </div>
                            <!-- email (Full Width) -->
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend font-semibold"
                                    >Email</legend
                                >
                                <input
                                    type="email"
                                    id="email"
                                    class="input input-bordered w-full"
                                    placeholder="e.g. john@acme.com"
                                    required
                                />
                            </fieldset>

                            <fieldset class="fieldset w-full">
                                <legend class="fieldset-legend font-semibold"
                                    >Select Market Dates & Booth Options</legend
                                >

                                <details class="dropdown w-full">
                                    <!-- Dropdown Trigger Button -->
                                    <summary
                                        class="btn justify-between w-full bg-base-100 border-base-300 font-normal"
                                    >
                                        <span>Choose Booth Options & Dates</span
                                        >
                                        <svg
                                            class="h-4 w-4 fill-current opacity-60"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            />
                                        </svg>
                                    </summary>

                                    <!-- Scrollable Dropdown Options List -->
                                    <div
                                        class="dropdown-content menu p-4 shadow-xl bg-base-100 rounded-box w-full max-h-80 overflow-y-auto border border-base-200 mt-2 z-50 space-y-4"
                                    >
                                        <!-- October 10 & October 11 -->
                                        <div
                                            class="border-b border-base-200 pb-3"
                                        >
                                            <h4
                                                class="font-bold text-sm text-[#35b2b2] mb-2"
                                            >
                                                October 10 & October 11
                                            </h4>
                                            <div
                                                class="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                            >
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Oct 10-11 8x12"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 12ft booth — <strong
                                                            >$530</strong
                                                        ></span
                                                    >
                                                </label>
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Oct 10-11 8x8"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 8ft booth — <strong
                                                            >$400</strong
                                                        ></span
                                                    >
                                                </label>
                                            </div>
                                        </div>

                                        <!-- October 17 & October 18 -->
                                        <div
                                            class="border-b border-base-200 pb-3"
                                        >
                                            <h4
                                                class="font-bold text-sm text-[#35b2b2] mb-2"
                                            >
                                                October 17 & October 18
                                            </h4>
                                            <div
                                                class="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                            >
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Oct 17-18 8x12"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 12ft booth — <strong
                                                            >$530</strong
                                                        ></span
                                                    >
                                                </label>
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Oct 17-18 8x8"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 8ft booth — <strong
                                                            >$400</strong
                                                        ></span
                                                    >
                                                </label>
                                            </div>
                                        </div>

                                        <!-- October 24 & October 25 -->
                                        <div
                                            class="border-b border-base-200 pb-3"
                                        >
                                            <h4
                                                class="font-bold text-sm text-[#35b2b2] mb-2"
                                            >
                                                October 24 & October 25
                                            </h4>
                                            <div
                                                class="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                            >
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Oct 24-25 8x12"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 12ft booth — <strong
                                                            >$530</strong
                                                        ></span
                                                    >
                                                </label>
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Oct 24-25 8x8"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 8ft booth — <strong
                                                            >$400</strong
                                                        ></span
                                                    >
                                                </label>
                                            </div>
                                        </div>

                                        <!-- October 31 & November 01 -->
                                        <div
                                            class="border-b border-base-200 pb-3"
                                        >
                                            <h4
                                                class="font-bold text-sm text-[#35b2b2] mb-2"
                                            >
                                                October 31 & November 01
                                            </h4>
                                            <div
                                                class="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                            >
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Oct 31-Nov 01 8x12"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 12ft booth — <strong
                                                            >$530</strong
                                                        ></span
                                                    >
                                                </label>
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Oct 31-Nov 01 8x8"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 8ft booth — <strong
                                                            >$400</strong
                                                        ></span
                                                    >
                                                </label>
                                            </div>
                                        </div>

                                        <!-- November 07 & November 08 -->
                                        <div
                                            class="border-b border-base-200 pb-3"
                                        >
                                            <h4
                                                class="font-bold text-sm text-[#35b2b2] mb-2"
                                            >
                                                November 07 & November 08
                                            </h4>
                                            <div
                                                class="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                            >
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Nov 07-08 8x12"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 12ft booth — <strong
                                                            >$530</strong
                                                        ></span
                                                    >
                                                </label>
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Nov 07-08 8x8"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 8ft booth — <strong
                                                            >$400</strong
                                                        ></span
                                                    >
                                                </label>
                                            </div>
                                        </div>

                                        <!-- November 14 & November 15 -->
                                        <div
                                            class="border-b border-base-200 pb-3"
                                        >
                                            <h4
                                                class="font-bold text-sm text-[#35b2b2] mb-2"
                                            >
                                                November 14 & November 15
                                            </h4>
                                            <div
                                                class="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                            >
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Nov 14-15 8x12"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 12ft booth — <strong
                                                            >$530</strong
                                                        ></span
                                                    >
                                                </label>
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Nov 14-15 8x8"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 8ft booth — <strong
                                                            >$400</strong
                                                        ></span
                                                    >
                                                </label>
                                            </div>
                                        </div>

                                        <!-- November 21 & November 22 -->
                                        <div
                                            class="border-b border-base-200 pb-3"
                                        >
                                            <h4
                                                class="font-bold text-sm text-[#35b2b2] mb-2"
                                            >
                                                November 21 & November 22
                                            </h4>
                                            <div
                                                class="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                            >
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Nov 21-22 8x12"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 12ft booth — <strong
                                                            >$530</strong
                                                        ></span
                                                    >
                                                </label>
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Nov 21-22 8x8"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 8ft booth — <strong
                                                            >$400</strong
                                                        ></span
                                                    >
                                                </label>
                                            </div>
                                        </div>

                                        <!-- November 28 & November 29 -->
                                        <div
                                            class="border-b border-base-200 pb-3"
                                        >
                                            <h4
                                                class="font-bold text-sm text-[#35b2b2] mb-2"
                                            >
                                                November 28 & November 29
                                            </h4>
                                            <div
                                                class="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                            >
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Nov 28-29 8x12"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 12ft booth — <strong
                                                            >$530</strong
                                                        ></span
                                                    >
                                                </label>
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Nov 28-29 8x8"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 8ft booth — <strong
                                                            >$400</strong
                                                        ></span
                                                    >
                                                </label>
                                            </div>
                                        </div>

                                        <!-- December 05 & December 06 -->
                                        <div
                                            class="border-b border-base-200 pb-3"
                                        >
                                            <h4
                                                class="font-bold text-sm text-[#35b2b2] mb-2"
                                            >
                                                December 05 & December 06
                                            </h4>
                                            <div
                                                class="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                            >
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Dec 05-06 8x12"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 12ft booth — <strong
                                                            >$530</strong
                                                        ></span
                                                    >
                                                </label>
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Dec 05-06 8x8"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 8ft booth — <strong
                                                            >$400</strong
                                                        ></span
                                                    >
                                                </label>
                                            </div>
                                        </div>

                                        <!-- December 12 & December 13 -->
                                        <div
                                            class="border-b border-base-200 pb-3"
                                        >
                                            <h4
                                                class="font-bold text-sm text-[#35b2b2] mb-2"
                                            >
                                                December 12 & December 13
                                            </h4>
                                            <div
                                                class="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                            >
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Dec 12-13 8x12"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 12ft booth — <strong
                                                            >$530</strong
                                                        ></span
                                                    >
                                                </label>
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Dec 12-13 8x8"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 8ft booth — <strong
                                                            >$400</strong
                                                        ></span
                                                    >
                                                </label>
                                            </div>
                                        </div>

                                        <!-- December 19 & December 20 -->
                                        <div>
                                            <h4
                                                class="font-bold text-sm text-[#35b2b2] mb-2"
                                            >
                                                December 19 & December 20
                                            </h4>
                                            <div
                                                class="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                            >
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Dec 19-20 8x12"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 12ft booth — <strong
                                                            >$530</strong
                                                        ></span
                                                    >
                                                </label>
                                                <label
                                                    class="label cursor-pointer justify-start gap-2 border border-base-200 p-2 rounded-lg hover:bg-base-200/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="product_options"
                                                        value="Dec 19-20 8x8"
                                                        class="checkbox checkbox-xs checkbox-accent"
                                                    />
                                                    <span
                                                        class="label-text text-xs"
                                                        >8ft x 8ft booth — <strong
                                                            >$400</strong
                                                        ></span
                                                    >
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            </fieldset>

                            <div class="overflow-x-auto">
                                <table class="table table-zebra">
                                    <!-- head -->
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th
                                                >Tent, Market Weekend & booth
                                                size</th
                                            >
                                            <th>Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- row 1 -->
                                        <tr>
                                            <th>1</th>
                                            <td>8ft x 8ft booth</td>
                                            <td class="light color-[var(--brand-color)]"
                                                >$400</td
                                            >
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend font-semibold"
                                    >SUBJECT</legend
                                >
                                <input
                                    type="text"
                                    id="subject"
                                    class="input input-bordered w-full"
                                    bind:value={emailSubject}
                                    required
                                />
                            </fieldset>
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend font-semibold"
                                    >EMAIL BODY</legend
                                >
                                <textarea
                                    id="email_body"
                                    class="textarea textarea-bordered w-full h-20"
                                    bind:value={emailBody}
                                    required
                                ></textarea>
                            </fieldset>
                            <!-- Modal Actions -->
                            <div class="modal-action pt-2 flex justify-end gap-2">
                            <button
                                type="button"
                                class="btn"
                                onclick={() => {
                                const dialog = document.getElementById('my_modal_3');
                                if (dialog instanceof HTMLDialogElement) {
                                    dialog.close();
                                }
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                class="btn text-white border-none"
                                style="background-color: var(--brand-color);"
                            >
                                Send Acceptance & Invoice
                            </button>
                            </div>
                        </form>
                    </div>
                </dialog>
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
    .menu li a {
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

    tbody td {
        color: var(--brand-color);
    }
    h2 {
        text-transform: uppercase;
    }
</style>
