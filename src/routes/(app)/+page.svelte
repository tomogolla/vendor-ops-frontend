<script lang="ts">
    import { countTasks } from "#lib/vendor-store.ts";

    type CallCounts = { open: number; overdue: number; mine: number };
    let calls = $state<CallCounts | null>(null);
    let callsError = $state("");

    function loadCalls() {
        callsError = "";
        const base = { task_type: "DISCOVERY_CALL", is_open: true };
        Promise.all([
            countTasks(base),
            countTasks({ ...base, due_before: new Date().toISOString() }),
            countTasks({ ...base, owner: "me" }),
        ])
            .then(([open, overdue, mine]) => (calls = { open, overdue, mine }))
            .catch(
                (error) =>
                    (callsError =
                        error instanceof Error
                            ? error.message
                            : "Could not load calls."),
            );
    }
    $effect(loadCalls);
</script>

<div class="grid grid-cols-1 gap-1 md:grid-cols-3">
    <div class="bg-white p-1 space-y-2 shadow dark:bg-gray-800">
        <div class="card bg-base-100 card-xs shadow-sm">
            <div class="card-body">
                <h2 class="card-title">Vendor calls due</h2>
                <p class="text-xs text-base-content/60">
                    {#if callsError}
                        {callsError}
                        <button type="button" class="link" onclick={loadCalls}
                            >Retry</button
                        >
                    {:else if !calls}
                        Loading…
                    {:else if calls.open}
                        {calls.open} open discovery call{calls.open === 1
                            ? ""
                            : "s"} · {calls.overdue} overdue · {calls.mine} assigned
                        to you
                    {:else}
                        No calls due
                    {/if}
                </p>
                <div class="justify-end card-actions">
                    <button class="btn btn-xs">View Task</button>
                </div>
            </div>
        </div>
        <div class="card bg-base-100 card-xs shadow-sm">
            <div class="card-body">
                <h2 class="card-title">New Shopify & Stripe orders</h2>
                <p class="text-xs text-base-content/60">
                   
                </p>
                <div class="justify-end card-actions">
                    <button class="btn btn-xs">View</button>
                </div>
            </div>
        </div>
    </div>

    <div class="bg-white p-1 shadow dark:bg-gray-800">
        <div class="card bg-base-100 card-xs shadow-sm">
            <div class="card-body">
                <!-- Box Title -->
                <h2 class="card-title">Upcoming Markets</h2>

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
                        
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="bg-white p-1 shadow dark:bg-gray-800">
        <div class="card bg-base-100 card-xs shadow-sm">
            <div class="card-body">
                <h2 class="card-title">Awaiting payment</h2>
                <!-- Outer wrapper handles overflow scroll on small screens -->
                <div class="w-full overflow-x-auto border border-gray-200 dark:border-gray-700">
                    <table
                        class="w-full border-collapse text-left text-xs text-gray-500 dark:text-gray-400"
                    >
                        <!-- Table Header Grid System -->
                        <thead
                            class="bg-gray-50 uppercase text-[10px] tracking-wider text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        >
                            <tr>
                                <th scope="col" class="px-3 py-2 font-semibold"
                                    >Vendor</th
                                >
                                <th scope="col" class="px-3 py-2 font-semibold"
                                    >Market</th
                                >
                                <th
                                    scope="col"
                                    class="px-3 py-2 font-semibold text-right"
                                    >Amount Due</th
                                >
                                <th scope="col"
                                    class="px-3 py-2 font-semibold text-right"
                                    >Invoice Age</th>
                            </tr>
                        </thead>

                        <!-- Table Body / Rows -->
                        <tbody
                            class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900"
                        >
                            <!-- Mock Row 1 -->
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td
                                    class="whitespace-nowrap px-3 py-1.5 font-medium text-gray-900 dark:text-white"
                                    >Brooklyn threads</td
                                >
                                <td class="whitespace-nowrap px-3 py-1.5"
                                    >September 7 & 8</td
                                >
                                <td
                                    class="whitespace-nowrap px-3 py-1.5 text-right text-[#35B2B2] dark:text-white"
                                    >$450.00</td
                                >
                                <td
                                    class="whitespace-nowrap px-3 py-1.5 text-right text-amber-600 dark:text-amber-400"
                                    >1 Days</td
                                >
                            </tr>

                            <!-- Mock Row 2 -->
                            <tr
                                class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                                <td
                                    class="whitespace-nowrap px-3 py-1.5 font-medium text-gray-900 dark:text-white"
                                    >Guy vintage</td
                                >
                                <td class="whitespace-nowrap px-3 py-1.5"
                                    >October 5 & 6</td
                                >
                                <td
                                    class="whitespace-nowrap px-3 py-1.5 text-right font-mono text-[#35B2B2] dark:text-white"
                                    >$800.00</td
                                >
                                <td
                                    class="whitespace-nowrap px-3 py-1.5 text-right font-mono text-emerald-600 dark:text-emerald-400"
                                    >3 Days</td
                                >
                            </tr>

                            <!-- Mock Row 3 -->
                            <tr
                                class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                                <td
                                    class="whitespace-nowrap px-3 py-1.5 font-medium text-gray-900 dark:text-white"
                                    >Tekstuff</td
                                >
                                <td class="whitespace-nowrap px-3 py-1.5"
                                    >October 10 & 11</td
                                >
                                <td
                                    class="whitespace-nowrap px-3 py-1.5 text-right font-mono text-[#35B2B2] dark:text-white"
                                    >$2100</td
                                >
                                <td
                                    class="whitespace-nowrap px-3 py-1.5 text-right font-mono text-red-600 dark:text-red-400"
                                    >3 Days</td
                                >
                             
                            </tr>
                        </tbody>
                    </table>
                </div>

        
            </div>
        </div>
    </div>
</div>
