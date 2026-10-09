<!-- name of each tab group should be unique -->
<div class="tabs tabs-border">
    <input
        type="radio"
        name="my_tabs_2"
        class="tab checked:border-[#35b2b2]"
        aria-label="October 10 & 11"
    />
    <div class="tab-content border-base-300 bg-base-100 p-2">
        <div class="grid grid-cols-5 gap-2 w-full">
            <!-- Left Column (1/5 or 20% width) -->
            <div class="col-span-1 bg-base-200 rounded-box">
                <div
                    class="card bg-base-100 w-full max-w-sm shadow-sm border border-base-200 overflow-hidden"
                >
                    <!-- Optional Header -->
                    <div
                        class="bg-base-200/60 px-6 py-1 border-b border-base-200"
                    >
                        <span
                            class="font-semibold text-xs text-base-content/70 uppercase tracking-wider"
                            >STATS</span
                        >
                    </div>

                    <!-- 4-Row Statistics Block -->
                    <div
                        class="stats stats-vertical w-full rounded-none bg-transparent"
                    >
                        <!-- Row 1 -->
                        <div class="stat px-6 py-4">
                            <div
                                class="stat-title text-xs font-medium text-base-content/60"
                            >
                                Total Revenue
                            </div>
                            <div
                                class="stat-value text-2xl font-bold text-base-content"
                            >
                                $24,500.00
                            </div>
                        </div>

                        <!-- Row 2 -->
                        <div class="stat px-6 py-4">
                            <div
                                class="stat-title text-xs font-medium text-base-content/60"
                            >
                                Booked Vendors
                            </div>
                            <div
                                class="stat-value text-2xl font-bold text-base-content"
                            >
                                14
                            </div>
                            <div class="stat-desc text-xs text-base-content/50">
                                12 pending review
                            </div>
                        </div>

                        <!-- Row 3 -->
                        <div class="stat px-6 py-4">
                            <div
                                class="stat-title text-xs font-medium text-base-content/60"
                            >
                                Market Attendance Rate
                            </div>
                            <div class="stat-value text-2xl font-bold">
                                92.4%
                            </div>
                        </div>

                        <!-- Row 4 -->
                        <div class="stat px-6 py-4">
                            <div
                                class="stat-title text-xs font-medium text-base-content/60"
                            >
                                Lifetime Value (LTV)
                            </div>
                            <div
                                class="stat-value text-2xl font-bold text-base-content"
                            >
                                $1,240.50
                            </div>
                            <div class="stat-desc text-xs text-base-content/50">
                                Average per checked brand
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column (4/5 or 80% width) -->
            <div
                class="col-span-4 bg-base-100 border border-base-200 rounded-box"
            >
                <header
                    class="bg-base-200/60 px-6 py-1 border-b border-base-200"
                >
                    <span
                        class="font-semibold text-xs text-base-content/70 uppercase tracking-wider"
                        >Schedule</span
                    >
                </header>
                <div
                    class="overflow-x-auto bg-base-400 rounded-lg shadow-sm mb-4"
                >
                    <table class="table table-zebra w-full text-left">
                        <!-- head -->
                        <thead
                            class="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-base-300"
                        >
                            <tr>
                                <th></th>
                                <th>Date</th>
                                <th>Brand Name</th>
                                <th>Contact</th>
                                <th>Booking State</th>
                                <th>Category</th>
                                <th>Phone</th>
                                <th>Instagram</th>
                                <th>Lead Source</th>
                                <th>Tags</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- row 1 -->
                            <tr class="hover">
                                <th>1</th>
                                <td>2023-10-01</td>
                                <td class="font-bold text-slate-900"
                                    >Acme Corporation</td
                                >
                                <td>
                                    <div class="text-sm font-medium">
                                        Cy Ganderton
                                    </div>
                                    <div class="text-xs text-slate-400">
                                        cy@acme.com
                                    </div>
                                </td>
                                <td>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                        >Confirmed</span
                                    >
                                </td>
                                <td>Arts, prints and stickers</td>
                                <td>(555) 123-4567</td>
                                <td
                                    ><a
                                        href="https://instagram.com"
                                        target="_blank"
                                        class="text-blue-600 hover:underline"
                                        >@acme</a
                                    ></td
                                >
                                <td>Meta ads</td>
                                <td>
                                    <div class="flex gap-1">
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] bg-slate-100 rounded text-slate-600"
                                            >VIP</span
                                        >
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] bg-blue-100 rounded text-blue-600"
                                            >Tier-1</span
                                        >
                                    </div>
                                </td>
                            </tr>
                            <!-- row 2 -->
                            <tr class="hover">
                                <th>2</th>
                                <td>2023-10-02</td>
                                <td class="font-bold text-slate-900"
                                    >Stark Industries</td
                                >
                                <td>
                                    <div class="text-sm font-medium">
                                        Hart Hagerty
                                    </div>
                                    <div class="text-xs text-slate-400">
                                        hart@stark.com
                                    </div>
                                </td>
                                <td>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                                        >In Dunning</span
                                    >
                                </td>
                                <td>Ceramics</td>
                                <td>(555) 987-6543</td>
                                <td
                                    ><a
                                        href="https://instagram.com"
                                        target="_blank"
                                        class="text-blue-600 hover:underline"
                                        >@starkind</a
                                    ></td
                                >
                                <td>Shopify form</td>
                                <td>
                                    <div class="flex gap-1">
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] bg-amber-100 rounded text-amber-600"
                                            >Late Pay</span
                                        >
                                    </div>
                                </td>
                            </tr>
                            <!-- row 3 -->
                            <tr class="hover">
                                <th>3</th>
                                <td>2023-10-03</td>
                                <td class="font-bold text-slate-900"
                                    >Wayne Enterprises</td
                                >
                                <td>
                                    <div class="text-sm font-medium">
                                        Brice Swyre
                                    </div>
                                    <div class="text-xs text-slate-400">
                                        brice@wayne.co
                                    </div>
                                </td>
                                <td>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
                                        >Draft</span
                                    >
                                </td>
                                <td>Vintage Clothing</td>
                                <td>(555) 555-5555</td>
                                <td
                                    ><a
                                        href="https://instagram.com"
                                        target="_blank"
                                        class="text-blue-600 hover:underline"
                                        >@wayne_ent</a
                                    ></td
                                >
                                <td>Email</td>
                                <td>
                                    <div class="flex gap-1">
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] bg-purple-100 rounded text-purple-600"
                                            >Sponsor</span
                                        >
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <input
        type="radio"
        name="my_tabs_2"
        class="tab checked:border-[#35b2b2]"
        aria-label="October 17 & 18"
        checked="checked"
    />
    <div class="tab-content border-base-300 bg-base-100 p-1">
       <div class="grid grid-cols-5 gap-2 w-full">
            <!-- Left Column (1/5 or 20% width) -->
            <div class="col-span-1 bg-base-200 rounded-box">
                <div
                    class="card bg-base-100 w-full max-w-sm shadow-sm border border-base-200 overflow-hidden"
                >
                    <!-- Optional Header -->
                    <div
                        class="bg-base-200/60 px-6 py-1 border-b border-base-200"
                    >
                        <span
                            class="font-semibold text-xs text-base-content/70 uppercase tracking-wider"
                            >STATS</span
                        >
                    </div>

                    <!-- 4-Row Statistics Block -->
                    <div
                        class="stats stats-vertical w-full rounded-none bg-transparent"
                    >
                        <!-- Row 1 -->
                        <div class="stat px-6 py-4">
                            <div
                                class="stat-title text-xs font-medium text-base-content/60"
                            >
                                Total Revenue
                            </div>
                            <div
                                class="stat-value text-2xl font-bold text-base-content"
                            >
                                $24,500.00
                            </div>
                        </div>

                        <!-- Row 2 -->
                        <div class="stat px-6 py-4">
                            <div
                                class="stat-title text-xs font-medium text-base-content/60"
                            >
                                Booked Vendors
                            </div>
                            <div
                                class="stat-value text-2xl font-bold text-base-content"
                            >
                                14
                            </div>
                            <div class="stat-desc text-xs text-base-content/50">
                                12 pending review
                            </div>
                        </div>

                        <!-- Row 3 -->
                        <div class="stat px-6 py-4">
                            <div
                                class="stat-title text-xs font-medium text-base-content/60"
                            >
                                Market Attendance Rate
                            </div>
                            <div class="stat-value text-2xl font-bold">
                                92.4%
                            </div>
                        </div>

                        <!-- Row 4 -->
                        <div class="stat px-6 py-4">
                            <div
                                class="stat-title text-xs font-medium text-base-content/60"
                            >
                                Lifetime Value (LTV)
                            </div>
                            <div
                                class="stat-value text-2xl font-bold text-base-content"
                            >
                                $1,240.50
                            </div>
                            <div class="stat-desc text-xs text-base-content/50">
                                Average per checked brand
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column (4/5 or 80% width) -->
            <div
                class="col-span-4 bg-base-100 border border-base-200 rounded-box"
            >
                <header
                    class="bg-base-200/60 px-6 py-1 border-b border-base-200"
                >
                    <span
                        class="font-semibold text-xs text-base-content/70 uppercase tracking-wider"
                        >Schedule</span
                    >
                </header>
                <div
                    class="overflow-x-auto bg-base-400 rounded-lg shadow-sm mb-4"
                >
                    <table class="table table-zebra w-full text-left">
                        <!-- head -->
                        <thead
                            class="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-base-300"
                        >
                            <tr>
                                <th></th>
                                <th>Date</th>
                                <th>Brand Name</th>
                                <th>Contact</th>
                                <th>Booking State</th>
                                <th>Category</th>
                                <th>Phone</th>
                                <th>Instagram</th>
                                <th>Lead Source</th>
                                <th>Tags</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- row 1 -->
                            <tr class="hover">
                                <th>1</th>
                                <td>2023-10-01</td>
                                <td class="font-bold text-slate-900"
                                    >Acme Corporation</td
                                >
                                <td>
                                    <div class="text-sm font-medium">
                                        Cy Ganderton
                                    </div>
                                    <div class="text-xs text-slate-400">
                                        cy@acme.com
                                    </div>
                                </td>
                                <td>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                        >Confirmed</span
                                    >
                                </td>
                                <td>Arts, prints and stickers</td>
                                <td>(555) 123-4567</td>
                                <td
                                    ><a
                                        href="https://instagram.com"
                                        target="_blank"
                                        class="text-blue-600 hover:underline"
                                        >@acme</a
                                    ></td
                                >
                                <td>Meta ads</td>
                                <td>
                                    <div class="flex gap-1">
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] bg-slate-100 rounded text-slate-600"
                                            >VIP</span
                                        >
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] bg-blue-100 rounded text-blue-600"
                                            >Tier-1</span
                                        >
                                    </div>
                                </td>
                            </tr>
                            <!-- row 2 -->
                            <tr class="hover">
                                <th>2</th>
                                <td>2023-10-02</td>
                                <td class="font-bold text-slate-900"
                                    >Stark Industries</td
                                >
                                <td>
                                    <div class="text-sm font-medium">
                                        Hart Hagerty
                                    </div>
                                    <div class="text-xs text-slate-400">
                                        hart@stark.com
                                    </div>
                                </td>
                                <td>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                                        >In Dunning</span
                                    >
                                </td>
                                <td>Ceramics</td>
                                <td>(555) 987-6543</td>
                                <td
                                    ><a
                                        href="https://instagram.com"
                                        target="_blank"
                                        class="text-blue-600 hover:underline"
                                        >@starkind</a
                                    ></td
                                >
                                <td>Shopify form</td>
                                <td>
                                    <div class="flex gap-1">
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] bg-amber-100 rounded text-amber-600"
                                            >Late Pay</span
                                        >
                                    </div>
                                </td>
                            </tr>
                            <!-- row 3 -->
                            <tr class="hover">
                                <th>3</th>
                                <td>2023-10-03</td>
                                <td class="font-bold text-slate-900"
                                    >Wayne Enterprises</td
                                >
                                <td>
                                    <div class="text-sm font-medium">
                                        Brice Swyre
                                    </div>
                                    <div class="text-xs text-slate-400">
                                        brice@wayne.co
                                    </div>
                                </td>
                                <td>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
                                        >Draft</span
                                    >
                                </td>
                                <td>Vintage Clothing</td>
                                <td>(555) 555-5555</td>
                                <td
                                    ><a
                                        href="https://instagram.com"
                                        target="_blank"
                                        class="text-blue-600 hover:underline"
                                        >@wayne_ent</a
                                    ></td
                                >
                                <td>Email</td>
                                <td>
                                    <div class="flex gap-1">
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] bg-purple-100 rounded text-purple-600"
                                            >Sponsor</span
                                        >
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <input
        type="radio"
        name="my_tabs_2"
        class="tab checked:border-[#35b2b2]"
        aria-label="October 24 & 25"
    />
    <div class="tab-content border-base-300 bg-base-100 p-1">
        <div class="grid grid-cols-5 gap-2 w-full">
            <!-- Left Column (1/5 or 20% width) -->
            <div class="col-span-1 bg-base-200 rounded-box">
                <div
                    class="card bg-base-100 w-full max-w-sm shadow-sm border border-base-200 overflow-hidden"
                >
                    <!-- Optional Header -->
                    <div
                        class="bg-base-200/60 px-6 py-1 border-b border-base-200"
                    >
                        <span
                            class="font-semibold text-xs text-base-content/70 uppercase tracking-wider"
                            >STATS</span
                        >
                    </div>

                    <!-- 4-Row Statistics Block -->
                    <div
                        class="stats stats-vertical w-full rounded-none bg-transparent"
                    >
                        <!-- Row 1 -->
                        <div class="stat px-6 py-4">
                            <div
                                class="stat-title text-xs font-medium text-base-content/60"
                            >
                                Total Revenue
                            </div>
                            <div
                                class="stat-value text-2xl font-bold text-base-content"
                            >
                                $24,500.00
                            </div>
                        </div>

                        <!-- Row 2 -->
                        <div class="stat px-6 py-4">
                            <div
                                class="stat-title text-xs font-medium text-base-content/60"
                            >
                                Booked Vendors
                            </div>
                            <div
                                class="stat-value text-2xl font-bold text-base-content"
                            >
                                14
                            </div>
                            <div class="stat-desc text-xs text-base-content/50">
                                12 pending review
                            </div>
                        </div>

                        <!-- Row 3 -->
                        <div class="stat px-6 py-4">
                            <div
                                class="stat-title text-xs font-medium text-base-content/60"
                            >
                                Market Attendance Rate
                            </div>
                            <div class="stat-value text-2xl font-bold">
                                92.4%
                            </div>
                        </div>

                        <!-- Row 4 -->
                        <div class="stat px-6 py-4">
                            <div
                                class="stat-title text-xs font-medium text-base-content/60"
                            >
                                Lifetime Value (LTV)
                            </div>
                            <div
                                class="stat-value text-2xl font-bold text-base-content"
                            >
                                $1,240.50
                            </div>
                            <div class="stat-desc text-xs text-base-content/50">
                                Average per checked brand
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column (4/5 or 80% width) -->
            <div
                class="col-span-4 bg-base-100 border border-base-200 rounded-box"
            >
                <header
                    class="bg-base-200/60 px-6 py-1 border-b border-base-200"
                >
                    <span
                        class="font-semibold text-xs text-base-content/70 uppercase tracking-wider"
                        >Schedule</span
                    >
                </header>
                <div
                    class="overflow-x-auto bg-base-400 rounded-lg shadow-sm mb-4"
                >
                    <table class="table table-zebra w-full text-left">
                        <!-- head -->
                        <thead
                            class="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-base-300"
                        >
                            <tr>
                                <th></th>
                                <th>Date</th>
                                <th>Brand Name</th>
                                <th>Contact</th>
                                <th>Booking State</th>
                                <th>Category</th>
                                <th>Phone</th>
                                <th>Instagram</th>
                                <th>Lead Source</th>
                                <th>Tags</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- row 1 -->
                            <tr class="hover">
                                <th>1</th>
                                <td>2023-10-01</td>
                                <td class="font-bold text-slate-900"
                                    >Acme Corporation</td
                                >
                                <td>
                                    <div class="text-sm font-medium">
                                        Cy Ganderton
                                    </div>
                                    <div class="text-xs text-slate-400">
                                        cy@acme.com
                                    </div>
                                </td>
                                <td>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                        >Confirmed</span
                                    >
                                </td>
                                <td>Arts, prints and stickers</td>
                                <td>(555) 123-4567</td>
                                <td
                                    ><a
                                        href="https://instagram.com"
                                        target="_blank"
                                        class="text-blue-600 hover:underline"
                                        >@acme</a
                                    ></td
                                >
                                <td>Meta ads</td>
                                <td>
                                    <div class="flex gap-1">
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] bg-slate-100 rounded text-slate-600"
                                            >VIP</span
                                        >
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] bg-blue-100 rounded text-blue-600"
                                            >Tier-1</span
                                        >
                                    </div>
                                </td>
                            </tr>
                            <!-- row 2 -->
                            <tr class="hover">
                                <th>2</th>
                                <td>2023-10-02</td>
                                <td class="font-bold text-slate-900"
                                    >Stark Industries</td
                                >
                                <td>
                                    <div class="text-sm font-medium">
                                        Hart Hagerty
                                    </div>
                                    <div class="text-xs text-slate-400">
                                        hart@stark.com
                                    </div>
                                </td>
                                <td>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                                        >In Dunning</span
                                    >
                                </td>
                                <td>Ceramics</td>
                                <td>(555) 987-6543</td>
                                <td
                                    ><a
                                        href="https://instagram.com"
                                        target="_blank"
                                        class="text-blue-600 hover:underline"
                                        >@starkind</a
                                    ></td
                                >
                                <td>Shopify form</td>
                                <td>
                                    <div class="flex gap-1">
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] bg-amber-100 rounded text-amber-600"
                                            >Late Pay</span
                                        >
                                    </div>
                                </td>
                            </tr>
                            <!-- row 3 -->
                            <tr class="hover">
                                <th>3</th>
                                <td>2023-10-03</td>
                                <td class="font-bold text-slate-900"
                                    >Wayne Enterprises</td
                                >
                                <td>
                                    <div class="text-sm font-medium">
                                        Brice Swyre
                                    </div>
                                    <div class="text-xs text-slate-400">
                                        brice@wayne.co
                                    </div>
                                </td>
                                <td>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
                                        >Draft</span
                                    >
                                </td>
                                <td>Vintage Clothing</td>
                                <td>(555) 555-5555</td>
                                <td
                                    ><a
                                        href="https://instagram.com"
                                        target="_blank"
                                        class="text-blue-600 hover:underline"
                                        >@wayne_ent</a
                                    ></td
                                >
                                <td>Email</td>
                                <td>
                                    <div class="flex gap-1">
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] bg-purple-100 rounded text-purple-600"
                                            >Sponsor</span
                                        >
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
