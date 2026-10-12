<script lang="ts">
    // State variable to hold the selected category string
    let selectedValue = $state("");

    // Array containing your exact list of categories
    const categories = [
        "Pets Accessories",
        "Arts, Prints & Stickers",
        "Beauty & Cosmetics",
        "Ceramics / Glass",
        "Clothing Brand",
        "Crotchet, Sewing, Quilt Goods",
        "Cultural Collectibles",
        "Experience",
        "Homeware",
        "Jewelry",
        "Leatherwork",
        "Music / Vinyl",
        "NYC Merch",
        "Photography",
        "Plants",
        "Soaps / Candles and Perfume",
        "Stationery",
        "Unique Things",
        "Vintage Clothing",
        "Vintage General",
        "Vintage Homeware",
        "Vintage Jewelry",
        "Vintage Upcycled",
    ];

    // Handler function to update the input value and close the dropdown safely
    function selectCategory(category: string) {
        selectedValue = category;

        // Explicitly remove focus from the active element to close the daisyUI dropdown
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }

    function handleSave() {
        console.log('Save')
    }
</script>
 

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
                <time class="text-xs" datetime=""><span class="text-sm">Due date/time:</span>12/09/2026 10:00AM</time>
            </div>
        </div>

        <!-- Card Body -->
        <div class="card-body">
            <div class="w-full max-w-2xl mx-auto mt-0">
                <!-- Row 1 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        First Name
                    </h4>
                    <input
                            type="text"
                            class="w-1/4 bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content"
                        />
                </div>
                <!-- Row 1 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        Last Name
                    </h4>
                    <input
                            type="text"
                            class="w-1/4 bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content"
                        />
                </div>
                <!-- Row 2 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        Reference links
                    </h4>
                   
                    <fieldset class="fieldset w-full">
                       
                        <input
                            type="text"
                            class="w-1/4 bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content"
                        />
                        <input
                            type="text"
                            class="w-1/4 bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content"
                            />
                    </fieldset>
                </div>

                <!-- Row 3 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        Brand Name
                    </h4>
                    <input
                            type="text"
                            class="w-1/4 bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content"
                        />
                </div>

                <!-- Row 4 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        Contact Email
                    </h4>
                    <input
                            type="text"
                            class="w-1/4 bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content"
                        />
                </div>

                <!-- Row 6 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        Phone
                    </h4>
                    <input
                            type="text"
                            class="w-1/4 bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content"
                        />
                </div>

                <!-- Row 6 -->
                <div class="dropdown dropdown-end w-full max-w-xs">
            <h4 class="text-sm font-semibold text-slate-900 mb-1">Category</h4>

            <!-- The input acts as the trigger element -->
            <input
                tabindex="0"
                type="text"
                placeholder="Choose a category..."
                readonly
                bind:value={selectedValue}
                class="bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content w-full cursor-pointer"
            />

            <!-- Dropdown wrapper content -->
            <ul
                class="dropdown-content menu bg-base-200 rounded-box z-[1] w-full max-h-60 overflow-y-auto p-2 mt-1 shadow-lg flex-nowrap"
            >
                {#each categories as category}
                    <li>
                        <button
                            type="button"
                            onclick={() => selectCategory(category)}
                            class="w-full text-left text-xs"
                        >
                            {category}
                        </button>
                    </li>
                {/each}
            </ul>
        </div>

                <!-- Row 6 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        About Brand
                    </h4>
                    <input
                            type="text"
                            class="w-1/2 bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content resize-none min-h-[40px] leading-relaxed"
                        />
                </div>

                <!-- Row 6 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        Objectives of joining The Good Flea
                    </h4>
                      <input
                            type="text"
                            class="w-1/4 bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content"
                        />
                </div>

                <!-- Row 6 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        Proposed booth dimensions
                    </h4>
                      <input
                            type="text"
                            class="w-1/4 bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content"
                        />
                </div>
                <!-- Row 6 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        Booked dates
                    </h4>
                     <input
                            type="text"
                            class="w-1/4 bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content"
                        />
                </div>
                <!-- Row 6 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        Other Markets  
                    </h4>
                     <input
                            type="text"
                            class="w-1/4 bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-0 text-xs text-base-content"
                        />
                </div>

                <!-- Row 6 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        Notes
                    </h4>
                     <textarea
                            rows="2"
                            class="w-full bg-transparent border-b-2 border-base-300 focus:border-[#35b2b2] outline-none focus:outline-none focus:ring-0 rounded-none px-0 py-1 text-xs text-base-content resize-none min-h-[40px] leading-relaxed"
                            placeholder="Add vendor notes here..."
                        ></textarea>
                </div>
                <!-- Row 6 -->
                <div class="pb-4">
                    <h4 class="text-sm font-semibold text-slate-900 mb-1">
                        Markets attended
                    </h4>
                    <p class="text-xs text-slate-500 leading-relaxed">
                        October 4 & 5
                    </p>
                    <p class="text-xs text-slate-500 leading-relaxed">
                        October 10 & 11
                    </p>
                    <p class="text-xs text-slate-500 leading-relaxed">
                        October 17 & 18
                    </p>
                </div>
            </div>
        </div>

        <!-- Card Footer -->
        <footer>
            <div
            class="bg-base-200/60 px-6 py-3 border-b border-base-200 flex items-center justify-between"
        >
            <!-- Vendor Name (Left Side) -->
            <span >
                
            </span>

            <!-- Due date -->
            <div class="flex gap-2">
                <button class="btn btn-primary btn-sm">Save</button>
            </div>
        </div>
        </footer>
        
</div>
