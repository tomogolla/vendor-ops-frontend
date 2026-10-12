<script lang="ts">
    import { onMount } from "svelte";
    import MarketWeekendSelect from "#lib/components/MarketWeekendSelect.svelte";
    
    let selectedWeekends = $state<string[]>([]);
    
    const categories = [
        "Apparel & Fashion",
        "Jewelry & Accessories",
        "Beauty & Wellness",
        "Home Goods",
        "Vintage & Thrift",
        "Art & Craft",
        "Pre-packaged Food",
        "Other",
    ];
    const leadSource = [
        "Instagram",
        "Email",
        "Shopify popup form",
        "Shopify lead form",
        "Meta ads",
        "application form",
    ];
    const businessRegistrationStatus = [
        "Not answered",
        "LLC",
        "Sole Prop",
        "In progress",
        "None",
    ];
    const generalLiabilityInsurance = [
        "Not answered",
        "Have active policy",
        "Need guidance",
        "Don't have",
    ];
    

    const commitmentLevels = ["Full time", "Part time"];
    const boothDimensions = ["8ft X 8ft", "8ft x 11ft"];
    const bookingState = ["confirmed", "Draft"];

    let categorySelect: HTMLSelectElement | null = null;
    let commitmentLevelSelect: HTMLSelectElement | null = null;
    let boothDimensionsSelect: HTMLSelectElement | null = null;
    let leadSourceSelect: HTMLSelectElement | null = null;
    let bookingStateSelect: HTMLSelectElement | null = null;
    let businessRegistrationStatusSelect: HTMLSelectElement | null = null;
    let generalLiabilityInsuranceSelect: HTMLSelectElement | null = null;

    onMount(() => {
        const categoryDropdown = categorySelect;
        const commitmentDropdown = commitmentLevelSelect;
        const boothDimensionsDropdown = boothDimensionsSelect;
        const leadSourceDropdown = leadSourceSelect;
        const bookingStateDropdown = bookingStateSelect; // ← was boothDimensionsSelect
        const businessRegistrationStatusDropdown =
            businessRegistrationStatusSelect;
        const generalLiabilityInsuranceDropdown =
            generalLiabilityInsuranceSelect;

        // Populate Categories
        if (categoryDropdown) {
            categories.forEach((category) => {
                const option = document.createElement("option");
                option.value = category;
                option.textContent = category;
                option.className = "bg-base-100 text-base-content";
                categoryDropdown.appendChild(option);
            });
        }

        // Populate Commitment Levels
        if (commitmentDropdown) {
            commitmentLevels.forEach((level) => {
                const option = document.createElement("option");
                option.value = level;
                option.textContent = level;
                option.className = "bg-base-100 text-base-content";
                commitmentDropdown.appendChild(option);
            });
        }

        // Populate Booth Dimensions
        if (boothDimensionsDropdown) {
            boothDimensions.forEach((dimension) => {
                const option = document.createElement("option");
                option.value = dimension;
                option.textContent = dimension;
                option.className = "bg-base-100 text-base-content";
                boothDimensionsDropdown.appendChild(option);
            });
        }

        // Populate Lead Source
        if (leadSourceDropdown) {
            leadSource.forEach((source) => {
                const option = document.createElement("option");
                option.value = source;
                option.textContent = source;
                option.className = "bg-base-100 text-base-content";
                leadSourceDropdown.appendChild(option);
            });
        }
        // Populate booking state
        if (bookingStateDropdown) {
            bookingState.forEach((state) => {
                const option = document.createElement("option");
                option.value = state;
                option.textContent = state;
                option.className = "bg-base-100 text-base-content";
                bookingStateDropdown.appendChild(option);
            });
        }
        // Populate businsess registration status
        if (businessRegistrationStatusDropdown) {
            businessRegistrationStatus.forEach((reg_status) => {
                const option = document.createElement("option");
                option.value = reg_status;
                option.textContent = reg_status;
                option.className = "bg-base-100 text-base-content";
                businessRegistrationStatusDropdown.appendChild(option);
            });
        }
        // Populate general liability insurance status
        if (generalLiabilityInsuranceDropdown) {
            generalLiabilityInsurance.forEach((insurance_status) => {
                const option = document.createElement("option");
                option.value = insurance_status;
                option.textContent = insurance_status;
                option.className = "bg-base-100 text-base-content";
                generalLiabilityInsuranceDropdown.appendChild(option);
            });
        }
    });
    document.addEventListener("DOMContentLoaded", () => {
        const textarea = document.getElementById("aboutBrandAuto");

        if (textarea) {
            textarea.addEventListener("input", function () {
                this.style.height = "auto";
                this.style.height = `${this.scrollHeight}px`;
            });
        }
    });
</script>

<div class="rounded-box grid grid-cols-1 md:grid-cols-10 gap-4">
    <!-- Column 1 (70% width on desktop) -->
    <div
        class="card px-4 bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden md:col-span-7"
    >
        <!-- Card Header -->
        <div
            class="bg-base-200/60 px-6 py-2 border-b border-base-200 flex items-center justify-between"
        ></div>
        <!-- vendor profile details add new/edit -->
        <div>
            <div class="mb-2">
                <h4>Brand name</h4>
                <fieldset class="fieldset w-full">
                    <input
                        type="text"
                        class="w-1/2 bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content placeholder:text-base-content/40 transition-colors"
                        placeholder="Brand Name"
                    />
                </fieldset>
            </div>

            <div class="flex flex-col gap-3">
                <!-- First Name Row Element -->
                <div class="mb-2">
                    <h4 class="text-sm font-semibold text-slate-900">
                        First name
                    </h4>
                    <fieldset class="fieldset w-full max-w-xs">
                        <input
                            type="text"
                            class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content placeholder:text-base-content/40 transition-colors"
                            placeholder="First Name"
                        />
                    </fieldset>
                </div>

                <!-- Last Name Row Element -->
                <div class="mb-2">
                    <h4 class="text-sm font-semibold text-slate-900">
                        Last name
                    </h4>
                    <fieldset class="fieldset w-full max-w-xs">
                        <input
                            type="text"
                            class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content placeholder:text-base-content/40 transition-colors"
                            placeholder="Last Name"
                        />
                    </fieldset>
                </div>
            </div>
            <div class="flex flex-col gap-3">
                <!-- email Row Element -->
                <div class="mb-2">
                    <h4 class="text-sm font-semibold text-slate-900">Email</h4>
                    <fieldset class="fieldset w-full max-w-xs">
                        <input
                            type="email"
                            placeholder="mail@site.com"
                            class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content placeholder:text-base-content/40 transition-colors"
                        />
                    </fieldset>
                </div>

                <!-- row Element -->
                <div class="mb-2">
                    <h4 class="text-sm font-semibold text-slate-900">
                        Phone Number
                    </h4>
                    <fieldset class="fieldset w-full max-w-xs">
                        <input
                            type="tel"
                            required
                            placeholder="Phone"
                            pattern="[0-9]*"
                            minlength="10"
                            maxlength="10"
                            title="Must be 10 digits"
                            class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content placeholder:text-base-content/40 transition-colors"
                        />
                    </fieldset>
                </div>
                <div class="flex flex-col gap-3">
                    <!--  instagram Row Element -->
                    <div class="mb-2">
                        <h4 class="text-sm font-semibold text-slate-900">
                            Instagram
                        </h4>
                        <fieldset class="fieldset w-full max-w-xs">
                            <input
                                type="text"
                                class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content placeholder:text-base-content/40 transition-colors"
                                placeholder="@instagram"
                            />
                        </fieldset>
                    </div>

                    <!-- website Row Element -->
                    <div class="mb-2">
                        <h4 class="text-sm font-semibold text-slate-900">
                            Website
                        </h4>
                        <fieldset class="fieldset w-full max-w-xs">
                            <input
                                type="url"
                                class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content placeholder:text-base-content/40 transition-colors"
                                placeholder="https://"
                                value="https://"
                                pattern="^(https?://)?([a-zA-Z0-9]([a-zA-Z0-9\-].*[a-zA-Z0-9])?\.)+[a-zA-Z].*$"
                            />
                        </fieldset>
                    </div>
                </div>
                <div class="flex flex-col gap-3">
                    <!-- category Row Element -->
                    <div class="mb-2">
                        <h4 class="text-sm font-semibold text-slate-900">
                            Category
                        </h4>
                        <fieldset class="fieldset w-full max-w-xs">
                            <!-- Converted to styled select element with exact borderless bottom-line style -->
                            <select
                                bind:this={categorySelect}
                                id="categorySelect"
                                class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content transition-colors cursor-pointer"
                                required
                            >
                                <option value="" disabled selected>
                                    Select category
                                </option>
                            </select>
                        </fieldset>
                    </div>
                    <div class="mb-2">
                        <h4 class="text-sm font-semibold text-slate-900">
                            About Brand
                        </h4>
                        <fieldset class="fieldset w-full">
                            <textarea
                                id="aboutBrandAuto"
                                rows="2"
                                class="w-3/4 bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content placeholder:text-base-content/40 transition-colors resize-none overflow-hidden"
                                placeholder="Briefly describe brand aesthetic, materials, and product backstory..."
                            ></textarea>
                        </fieldset>
                    </div>
                    <div class="mb-2">
                        <h4 class="text-sm font-semibold text-slate-900">
                            Objectives of joining The Good Flea
                        </h4>
                        <fieldset class="fieldset w-full">
                            <textarea
                                id="aboutBrandAuto"
                                rows="2"
                                class="w-1/2 bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content placeholder:text-base-content/40 transition-colors resize-none overflow-hidden"
                                placeholder="List objectives"
                            ></textarea>
                        </fieldset>
                    </div>
                    <!-- Commitment Level Selection -->
                    <div class="mb-2">
                        <h4 class="text-sm font-semibold text-slate-900">
                            Commitment Level
                        </h4>
                        <fieldset class="fieldset w-full max-w-xs">
                            <select
                                bind:this={commitmentLevelSelect}
                                class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content transition-colors cursor-pointer"
                                required
                            >
                                <option value="" disabled selected
                                    >Select commitment level</option
                                >
                            </select>
                        </fieldset>
                    </div>
                </div>

                <div class="mb-2">
                    <h4 class="text-sm font-semibold text-slate-900">
                        Other markets participated in
                    </h4>
                    <fieldset class="fieldset w-full">
                        <textarea
                            id="othermarketsAuto"
                            rows="2"
                            class="w-1/2 bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content placeholder:text-base-content/40 transition-colors resize-none overflow-hidden"
                            placeholder="Briefly describe brand aesthetic, materials, and product backstory..."
                        ></textarea>
                    </fieldset>
                </div>

                <!-- propoesd booth dimension Selection -->
                <div class="mb-2">
                    <h4 class="text-sm font-semibold text-slate-900">
                        Proposed booth dimensions
                    </h4>
                    <fieldset class="fieldset w-full max-w-xs">
                        <select
                            bind:this={boothDimensionsSelect}
                            class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content transition-colors cursor-pointer"
                            required
                        >
                            <option value="" disabled selected
                                >Select proposed booth dimensions</option
                            >
                        </select>
                    </fieldset>
                </div>
                <h2>Lead and pipeline</h2>
                <!-- lead source Selection -->
                <div class="mb-2">
                    <h4 class="text-sm font-semibold text-slate-900">
                        Lead source
                    </h4>
                    <fieldset class="fieldset w-full max-w-xs">
                        <select
                            bind:this={leadSourceSelect}
                            class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content transition-colors cursor-pointer"
                            required
                        >
                            <option value="" disabled selected
                                >Select lead source</option
                            >
                        </select>
                    </fieldset>
                </div>
                <!-- booking state Selection -->
                <div class="mb-2">
                    <h4 class="text-sm font-semibold text-slate-900">
                        Booking State
                    </h4>
                    <fieldset class="fieldset w-full max-w-xs">
                        <select
                            bind:this={bookingStateSelect}
                            class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content transition-colors cursor-pointer"
                            required
                        >
                            <option value="" disabled selected
                                >Select booking state</option
                            >
                        </select>
                    </fieldset>
                </div>
                <!-- business registration status Selection -->
                <div class="mb-2">
                    <h4 class="text-sm font-semibold text-slate-900">
                        Busness Registration Status
                    </h4>
                    <fieldset class="fieldset w-full max-w-xs">
                        <select
                            bind:this={businessRegistrationStatusSelect}
                            class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content transition-colors cursor-pointer"
                            required
                        >
                            <option value="" disabled selected
                                >Select reg status</option
                            >
                        </select>
                    </fieldset>
                </div>
                <!-- General insurance Selection -->
                <div class="mb-2">
                    <h4 class="text-sm font-semibold text-slate-900">
                        Insurance Status
                    </h4>
                    <fieldset class="fieldset w-full max-w-xs">
                        <select
                            bind:this={generalLiabilityInsuranceSelect}
                            class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content transition-colors cursor-pointer"
                            required
                        >
                            <option value="" disabled selected
                                >Select insurance status</option
                            >
                        </select>
                    </fieldset>
                </div>
            </div>
            <h2 class="mb-3">Pain Points & Application Follow-up</h2>
            <div class="mb-2">
                <h4 class="text-sm font-semibold text-slate-900">Challenges or roadblocks experienced during/after submitting application</h4>
                <fieldset class="fieldset w-full">
                    <textarea
                        id="notesAuto"
                        rows="3"
                        class="w-3/4 bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content placeholder:text-base-content/40 transition-colors resize-none overflow-hidden"
                        placeholder="Add Challenges or roadblocks"
                    ></textarea>
                </fieldset>
            </div>
            <div class="mb-2">
                <h4 class="text-sm font-semibold text-slate-900">Location / Foot-Traffic Pain Points</h4>
                <fieldset class="fieldset w-full">
                    <textarea
                        id="notesAuto"
                        rows="3"
                        class="w-3/4 bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content placeholder:text-base-content/40 transition-colors resize-none overflow-hidden"
                        placeholder="Add Location / Foot-Traffic Pain Points"
                    ></textarea>
                </fieldset>
            </div>
            <div class="mb-2">
                <h4 class="text-sm font-semibold text-slate-900">Revenue Consistency</h4>
                <fieldset class="fieldset w-full">
                    <textarea
                        id="notesAuto"
                        rows="3"
                        class="w-3/4 bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content placeholder:text-base-content/40 transition-colors resize-none overflow-hidden"
                        placeholder="Are they looking for predictable weekly revenue?"
                    ></textarea>
                </fieldset>
            </div>
            <h2 class="mb-3">Pitching The Offer</h2>
            <div class="mb-2">
                <h4 class="text-sm font-semibold text-slate-900">Vendor Reaction & Interest Level</h4>
                <fieldset class="fieldset w-full">
                    <textarea
                        id="notesAuto"
                        rows="1"
                        class="w-1/2 bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content placeholder:text-base-content/40 transition-colors resize-none overflow-hidden"
                        placeholder="Note Interest level"
                    ></textarea>
                </fieldset>
            </div>
            <div class="mb-2">
                <h4 class="text-sm font-semibold text-slate-900">Notes</h4>
                <fieldset class="fieldset w-full">
                    <textarea
                        id="notesAuto"
                        rows="3"
                        class="w-3/4 bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content placeholder:text-base-content/40 transition-colors resize-none overflow-hidden"
                        placeholder="Notes on Vendor Concerns or Objections regarding the offer"
                    ></textarea>
                </fieldset>
            </div>
            <div class="market-weekend-select mb-10">
                <h4 class="mb-2 text-base-content">Select Market Weekends</h4>
                <MarketWeekendSelect bind:selected={selectedWeekends} />
            </div>
            
        </div>
        <!-- Footer -->
        <footer>
            <div
                class="bg-base-200/60 py-3 mt-10 border-b border-base-200 flex items-center justify-between"
            >
                <!-- Vendor Name (Left Side) -->
                <span></span>

                <!-- Due date -->
                <div class="flex gap-2">
                    <button type="submit" class="btn btn-primary btn-sm"
                        >Save</button
                    >
                </div>
            </div>
        </footer>
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
                    <input
                        type="text"
                        id="name"
                        class="input"
                        placeholder="e.g. new vendor"
                    />
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
                    <li>
                        <button type="button">Welcome to The Good Flea</button>
                    </li>
                    <li>
                        <button type="button"
                            >What Kind of Vendors We Are Looking For</button
                        >
                    </li>
                    <li>
                        <button type="button"
                            >How the Application Process Works</button
                        >
                    </li>
                    <li>
                        <button type="button"
                            >Apply for Upcoming Weekends</button
                        >
                    </li>
                </ul>
            </div>
        </div>
        <!-- Independent Card 3: call tasks Actions -->
        <div
            class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden"
        >
            <div class="card-body">
                <h4 class="card-title">Call Actions</h4>
                <ul class="menu menu-sm rounded-box w-56 p-0">
                    <p class="text-xs mb-2">Call Attempts</p>
                    <li>
                        <input
                            type="number"
                            class="input-sm validator"
                            required
                            placeholder="Type a number between 0 to 5"
                            min="0"
                            max="5"
                            title="Must be between be 0 to 5"
                        />
                    </li>
                    <p class="text-xs mb-2">Vendor interest level</p>
                    <li>
                        <input
                            type="number"
                            class="input-sm validator"
                            required
                            placeholder="Type a number between 0 to 5"
                            min="0"
                            max="5"
                            title="Must be between be 0 to 5"
                        />
                    </li>
                    <p class="text-xs mt-2 mb-2">Call Outcome</p>

                    <li>
                        <form>
                            <select
                                class="select-sm validator text-xs"
                                required
                            >
                                <option disabled selected value=""
                                    >Call outcome:
                                </option>
                                <option>Interested</option>
                                <option>Not Qualified</option>
                                <option>Callback Requested</option>
                                <option>No Answer</option>
                                <option>Wrong Number</option>
                            </select>
                        </form>
                    </li>
                    <li>
                        <p class="text-xs mt-2 mb-2">Call Time</p>
                        <fieldset class="fieldset w-full max-w-sm">
                            <input
                                type="datetime-local"
                                id="callDateTime"
                                class="w-full bg-transparent border-0 border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content transition-colors cursor-pointer"
                                required
                            />
                        </fieldset>
                    </li>
                    <button type="button" class="btn btn-xs"
                        >Save call actions
                    </button>
                </ul>
            </div>
        </div>
        <div
            class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden"
        >
            <div class="card-body margin-y-3">
                <h4 class="card-title">QUICK ACTIONS</h4>
                <ul class="menu menu-sm rounded-box w-56 p-0">
                    <li><button type="button">Assign booth space</button></li>
                    <li><button type="button">Send Email</button></li>
                    <li>
                        <button type="button">Add vendor to Call List</button>
                    </li>
                    <li>
                        <button type="button"
                            >Remove vendor from call list</button
                        >
                    </li>
                    <li>
                        <button type="button"
                            >Add vendor to market weekend</button
                        >
                    </li>
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
                <button type="button" class="btn btn-primary w-full"
                    >Approve Vendor
                </button>

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
    h4 {
        text-transform: uppercase;
        font-size: 0.75rem;
        font-weight: 700;
    }
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
