<script lang="ts">
    import type { PageProps } from "./$types";
        
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
                Task Title: <span class="text-base-content font-medium"
                    >Discovery call</span
                >
            </span>

            <!-- Due date -->
            <div class="flex gap-2">
                <time class="text-xs" datetime=""
                    ><span class="text-sm">Due date/time:</span>12/09/2026
                    10:00AM</time
                >
            </div>
        </div>

        
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
                <h4 class="card-title">Call tasks</h4>
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
