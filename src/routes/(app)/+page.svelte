<script lang="ts">
    import { countTasks } from '#lib/vendor-store.ts';

    type CallCounts = { open: number; overdue: number; mine: number };
    let calls = $state<CallCounts | null>(null);
    let callsError = $state('');

    function loadCalls() {
        callsError = '';
        const base = { task_type: 'DISCOVERY_CALL', is_open: true };
        Promise.all([
            countTasks(base),
            countTasks({ ...base, due_before: new Date().toISOString() }),
            countTasks({ ...base, owner: 'me' })
        ])
            .then(([open, overdue, mine]) => (calls = { open, overdue, mine }))
            .catch((error) => (callsError = error instanceof Error ? error.message : 'Could not load calls.'));
    }
    $effect(loadCalls);
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
    <!-- Left Column (50% width on desktop) -->
    <div class="card bg-base-100 border border-base-200 shadow-sm p-2">
        <header class="card-header p-2">
            <div class="flex items-center justify-between">
                <h3 class="font-bold text-lg text-base-content/80">Tasks</h3>
                <span
                    class="bg-red-100 text-red-600 font-semibold text-xs px-2.5 py-0.5 rounded-full"
                >
                    14 pending
                </span>
            </div>
        </header>
        <!-- Task Alert List -->
        <div class="space-y-3">
            <!-- Call tasks: live open DISCOVERY_CALL tasks from the API -->
            <div
                class="bg-base-200/40 border border-base-200 rounded-lg p-3.5 flex items-center justify-between gap-4"
            >
                <div class="space-y-0.5">
                    <h4 class="font-bold text-sm text-base-content">Vendor Calls Due</h4>
                    <p class="text-xs text-base-content/60">
                        {#if callsError}
                            {callsError} <button type="button" class="link" onclick={loadCalls}>Retry</button>
                        {:else if !calls}
                            Loading…
                        {:else if calls.open}
                            {calls.open} open discovery call{calls.open === 1 ? '' : 's'} · {calls.overdue} overdue · {calls.mine} assigned to you
                        {:else}
                            No calls due
                        {/if}
                    </p>
                </div>
                {#if calls?.open}
                    <a
                        href="/tasks?view=calls"
                        class="btn btn-xs sm:btn-sm border-none bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium rounded-md px-3 whitespace-nowrap"
                    >
                        Action Required
                    </a>
                {/if}
            </div>

            <!-- Task 1: Applications Awaiting Review -->
            <div
                class="bg-base-200/40 border border-base-200 rounded-lg p-3.5 flex items-center justify-between gap-4"
            >
                <div class="space-y-0.5">
                    <h4 class="font-bold text-sm text-base-content">
                        Applications Awaiting Review
                    </h4>
                    <p class="text-xs text-base-content/60">
                        8 submissions in 'Under Review' status
                    </p>
                </div>
                <button
                    class="btn btn-xs sm:btn-sm border-none bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium rounded-md px-3 whitespace-nowrap"
                >
                    Action Required
                </button>
            </div>

            <!-- Task 2: Missing Documents -->
            <div
                class="bg-base-200/40 border border-base-200 rounded-lg p-3.5 flex items-center justify-between gap-4"
            >
                <div class="space-y-0.5">
                    <h4 class="font-bold text-sm text-base-content">
                        Missing Documents
                    </h4>
                    <p class="text-xs text-base-content/60">
                        Greenpoint Flea: 4 vendors missing active insurance
                    </p>
                </div>
                <button
                    class="btn btn-xs sm:btn-sm border-none bg-rose-100 text-rose-700 hover:bg-rose-200 font-medium rounded-md px-3 whitespace-nowrap"
                >
                    Action Required
                </button>
            </div>

            <!-- Task 3: Unsigned Contracts -->
            <div
                class="bg-base-200/40 border border-base-200 rounded-lg p-3.5 flex items-center justify-between gap-4"
            >
                <div class="space-y-0.5">
                    <h4 class="font-bold text-sm text-base-content">
                        Unsigned Contracts
                    </h4>
                    <p class="text-xs text-base-content/60">
                        2 core furniture vendors have pending agreements
                    </p>
                </div>
                <button
                    class="btn btn-xs sm:btn-sm border-none bg-rose-100 text-rose-700 hover:bg-rose-200 font-medium rounded-md px-3 whitespace-nowrap"
                >
                    Action Required
                </button>
            </div>

            <!-- Task 4: Unpaid Bookings -->
            <div
                class="bg-base-200/40 border border-base-200 rounded-lg p-3.5 flex items-center justify-between gap-4"
            >
                <div class="space-y-0.5">
                    <h4 class="font-bold text-sm text-base-content">
                        Unpaid Bookings
                    </h4>
                    <p class="text-xs text-base-content/60">
                        Williamsburg Oct 14: $1,250 past due across 5 spots
                    </p>
                </div>
                <button
                    class="btn btn-xs sm:btn-sm border-none bg-rose-100 text-rose-700 hover:bg-rose-200 font-medium rounded-md px-3 whitespace-nowrap"
                >
                    Action Required
                </button>
            </div>

            <!-- Task 5: Failed Messages -->
            <div
                class="bg-base-200/40 border border-base-200 rounded-lg p-3.5 flex items-center justify-between gap-4"
            >
                <div class="space-y-0.5">
                    <h4 class="font-bold text-sm text-base-content">
                        Failed Messages
                    </h4>
                    <p class="text-xs text-base-content/60">
                        1 SMS broadcast bounce error recorded today
                    </p>
                </div>
                <button
                    class="btn btn-xs sm:btn-sm border-none bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium rounded-md px-3 whitespace-nowrap"
                >
                    Action Required
                </button>
            </div>

            <!-- Task 6: New Shopify Orders -->
            <div
                class="bg-base-200/40 border border-base-200 rounded-lg p-3.5 flex items-center justify-between gap-4"
            >
                <div class="space-y-0.5">
                    <h4 class="font-bold text-sm text-base-content">
                        New Shopify Orders
                    </h4>
                    <p class="text-xs text-base-content/60">
                        6 Shopify orders Not matched to vendor profiles
                    </p>
                </div>
                <button
                    class="btn btn-xs sm:btn-sm border-none bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium rounded-md px-3 whitespace-nowrap"
                >
                    Action Required
                </button>
            </div>
            <div
                class="bg-base-200/40 border border-base-200 rounded-lg p-3.5 flex items-center justify-between gap-4"
            >
                <div class="space-y-0.5">
                    <h4 class="font-bold text-sm text-base-content">
                        New Stripe Orders
                    </h4>
                    <p class="text-xs text-base-content/60">
                        6 Stripe orders Not matched to vendor profiles
                    </p>
                </div>
                <button
                    class="btn btn-xs sm:btn-sm border-none bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium rounded-md px-3 whitespace-nowrap"
                >
                    Action Required
                </button>
            </div>

            <!-- Task 7: Markets Nearing Capacity -->
            <div
                class="bg-base-200/40 border border-base-200 rounded-lg p-3.5 flex items-center justify-between gap-4"
            >
                <div class="space-y-0.5">
                    <h4 class="font-bold text-sm text-base-content">
                        Markets Nearing Capacity
                    </h4>
                    <p class="text-xs text-base-content/60">
                        Chelsea Antiques Oct 21: 94% booths booked
                    </p>
                </div>
                <button
                    class="btn btn-xs sm:btn-sm border-none bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-medium rounded-md px-3 whitespace-nowrap"
                >
                    Action Required
                </button>
            </div>
        </div>
    </div>

    <!-- Right Column (50% width on desktop) -->
    <div class="card bg-base-100 border border-base-200 shadow-sm p-2 gap-3">
        <div class="card bg-base-100 w-full shadow-sm border border-base-200 rounded-xl overflow-hidden">
            <div class="card-body p-5 space-y-4">
                <!-- Box Title -->
                <h2 class="text-base-content/80">Upcoming Markets</h2>

                <!-- Markets List -->
                <div class="divide-y divide-base-200">
                    <!-- Market 1 -->
                    <div class="py-0 first:pt-0 last:pb-0 space-y-1.5">
                        <div class="flex items-center justify-between">
                            <h4 class="font-semibold text-sm text-base-content">
                                October Flea <span
                                    class="font-medium text-base-content/70"
                                    >(Oct 03-04)</span
                                >
                            </h4>
                        </div>
                        <div
                            class="flex flex-wrap items-center justify-between text-xs text-base-content/60 gap-2"
                        >
                            <span
                                >Occupancy: <span
                                    class="font-medium text-base-content/80"
                                    >32/40 Booths (80%)</span
                                ></span
                            >
                            <span
                                >Rev: <span
                                    class="font-medium text-base-content/80"
                                    >$8,400 / $9,000</span
                                ></span
                            >
                            <span class="font-light text-emerald-600"
                                >89% Ready</span
                            >
                        </div>

                        <hr class="border-base-300 my-0" />
                    </div>

                    <!-- Market 2 -->
                    <div class="py-0 first:pt-0 last:pb-0 space-y-1.5">
                        <div class="flex items-center justify-between">
                            <h4 class="font-semibold text-sm text-base-content">
                                October Flea <span
                                    class="font-medium text-base-content/70"
                                    >(Oct 10-11)</span
                                >
                            </h4>
                        </div>
                        <div
                            class="flex flex-wrap items-center justify-between text-xs text-base-content/60 gap-2"
                        >
                            <span
                                >Occupancy: <span
                                    class="font-medium text-base-content/80"
                                    >28/40 Booths (70%)</span
                                ></span
                            >
                            <span
                                >Rev: <span
                                    class="font-medium text-base-content/80"
                                    >$5,600 / $9,000</span
                                ></span
                            >
                            <span class="font-light text-emerald-600"
                                >67% Ready</span
                            >
                        </div>
                        <hr class="border-base-300 my-0" />
                    </div>

                    <!-- Market 3 -->
                    <div class="py-1 first:pt-0 last:pb-0 space-y-1.5">
                        <div class="flex items-center justify-between">
                            <h4 class="font-semibold text-sm text-base-content">
                                October Flea <span
                                    class="font-medium text-base-content/70"
                                    >(Oct 17-18)</span
                                >
                            </h4>
                        </div>
                        <div
                            class="flex flex-wrap items-center justify-between text-xs text-base-content/60 gap-2"
                        >
                            <span
                                >Occupancy: <span
                                    class="font-medium text-base-content/80"
                                    >31/40 Booths (78%)</span
                                ></span
                            >
                            <span
                                >Rev: <span
                                    class="font-medium text-base-content/80"
                                    >$6,000 / $9,000</span
                                ></span
                            >
                            <span class="font-light text-emerald-600"
                                >31% Ready</span
                            >
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
                <div
                    class="card bg-base-100 w-full shadow-sm border border-base-200 rounded-xl overflow-hidden"
                >
                    <div class="card-body p-5 space-y-4">
                        <!-- Box Title -->
                        <h3
                            class="text-xs font-semibold uppercase tracking-wider text-base-content/80"
                        >
                            Your Active Tasks
                        </h3>

                        <!-- Task List -->
                        <div class="divide-y divide-base-200">
                            <!-- Task 1 -->
                            <div
                                class="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                            >
                                <div class="space-y-0.5">
                                    <h4
                                        class="font-semibold text-sm text-base-content"
                                    >
                                        View Call list
                                    </h4>
                                   
                                </div>
                                <button
                                    class="btn btn-sm btn-ghost border-base-300 font-medium text-xs px-4 min-h-8 h-8"
                                >
                                    View Call List
                                </button>
                            </div>

                            <!-- Task 2 -->
                            <div
                                class="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                            >
                                <div class="space-y-0.5">
                                    <h4
                                        class="font-semibold text-sm text-base-content"
                                    >
                                        Email: Vintage Vault
                                    </h4>
                                    <p class="text-xs text-base-content/60">
                                        Request updated Certificate of Insurance
                                    </p>
                                </div>
                                <button
                                    class="btn btn-sm btn-ghost border-base-300 font-medium text-xs px-4 min-h-8 h-8"
                                >
                                    Email
                                </button>
                            </div>

                            <!-- Task 3 -->
                            <div
                                class="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                            >
                                <div class="space-y-0.5">
                                    <h4
                                        class="font-semibold text-sm text-base-content"
                                    >
                                        Review: Curated NYC LLC
                                    </h4>
                                    <p class="text-xs text-base-content/60">
                                        Evaluate furniture application submitted
                                        yesterday
                                    </p>
                                </div>
                                <button
                                    class="btn btn-sm btn-ghost border-base-300 font-medium text-xs px-4 min-h-8 h-8"
                                >
                                    Review
                                </button>
                            </div>

                            <!-- Task 4 -->
                            <div
                                class="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                            >
                                <div class="space-y-0.5">
                                    <h4
                                        class="font-semibold text-sm text-base-content"
                                    >
                                        Follow-up: Retro Glass
                                    </h4>
                                    <p class="text-xs text-base-content/60">
                                        Clarify sizing for 10x10 indoor booth
                                        space
                                    </p>
                                </div>
                                <button
                                    class="btn btn-sm btn-ghost border-base-300 font-medium text-xs px-4 min-h-8 h-8"
                                >
                                    Follow-up
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    </div>
</div>



<style>
    h3 {
        font-size: 1rem;
        text-transform: uppercase;
    }
</style>
