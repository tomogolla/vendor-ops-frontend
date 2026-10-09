<div class="bg-base-100 w-full shadow-sm border border-base-200 rounded-lg">
    <header class="base-100 bg-[#f4f4f4] py-2">
        <div class="flex items-center justify-between mb-4 px-4">
            <!-- Open the modal using ID.showModal() method -->
            <button
                class="btn btn-primary btn-sm"
                onclick={() => {
                    const modal = document.getElementById("my_modal_2");
                    if (modal instanceof HTMLDialogElement) modal.showModal();
                }}>Import Vendor CSV</button
            >
            <dialog id="my_modal_2" class="modal">
                <div class="modal-box">
                    <h2>Import vendors CSV</h2>
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Pick a file</legend>
                        <input type="file" class="file-input" />
                        <label class="label">Max size 2MB</label>
                    </fieldset>
                    <div class="modal-action">
                        <form method="dialog">
                            <!-- if there is a button in form, it will close the modal -->
                            <button class="btn btn-sm">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
            <div class="flex gap-2">
            <p class="text-sm text-base-content/70">5</p>
        </div>
        </div>
    </header>

   <div class="bg-base-200/40 border border-base-200 rounded-lg p-2 gap-4">


    <div class="overflow-x-auto bg-base-400 rounded-lg shadow-sm mb-4">
     <header class="bg-base-300/50 py-2 px-4">
        <h3>Call List</h3>
    </header>
        <table class="table table-zebra w-full text-left">
        <!-- head -->
        <thead class="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-base-300">
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
                <td class="font-bold text-slate-900">Acme Corporation</td>
                <td>
                    <div class="text-sm font-medium">Cy Ganderton</div>
                    <div class="text-xs text-slate-400">cy@acme.com</div>
                </td>
                <td>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Confirmed</span>
                </td>
                <td>Arts, prints and stickers</td>
                <td>(555) 123-4567</td>
                <td><a href="https://instagram.com" target="_blank" class="text-blue-600 hover:underline">@acme</a></td>
                <td>Meta ads</td>
                <td>
                    <div class="flex gap-1">
                        <span class="px-1.5 py-0.5 text-[10px] bg-slate-100 rounded text-slate-600">VIP</span>
                        <span class="px-1.5 py-0.5 text-[10px] bg-blue-100 rounded text-blue-600">Tier-1</span>
                    </div>
                </td>
            </tr>
            <!-- row 2 -->
            <tr class="hover">
                <th>2</th>
                <td>2023-10-02</td>
                <td class="font-bold text-slate-900">Stark Industries</td>
                <td>
                    <div class="text-sm font-medium">Hart Hagerty</div>
                    <div class="text-xs text-slate-400">hart@stark.com</div>
                </td>
                <td>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">In Dunning</span>
                </td>
                <td>Ceramics</td>
                <td>(555) 987-6543</td>
                <td><a href="https://instagram.com" target="_blank" class="text-blue-600 hover:underline">@starkind</a></td>
                <td>Shopify form</td>
                <td>
                    <div class="flex gap-1">
                        <span class="px-1.5 py-0.5 text-[10px] bg-amber-100 rounded text-amber-600">Late Pay</span>
                    </div>
                </td>
            </tr>
            <!-- row 3 -->
            <tr class="hover">
                <th>3</th>
                <td>2023-10-03</td>
                <td class="font-bold text-slate-900">Wayne Enterprises</td>
                <td>
                    <div class="text-sm font-medium">Brice Swyre</div>
                    <div class="text-xs text-slate-400">brice@wayne.co</div>
                </td>
                <td>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Draft</span>
                </td>
                <td>Vintage Clothing</td>
                <td>(555) 555-5555</td>
                <td><a href="https://instagram.com" target="_blank" class="text-blue-600 hover:underline">@wayne_ent</a></td>
                <td>Email</td>
                <td>
                    <div class="flex gap-1">
                        <span class="px-1.5 py-0.5 text-[10px] bg-purple-100 rounded text-purple-600">Sponsor</span>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</div>



<!-- New applications -->
 <div class="overflow-x-auto bg-base-400 rounded-lg shadow-sm">
 <header class="bg-base-300/50 py-2 px-4">
    <h3>New Applications</h3>
 </header>
        <table class="table table-zebra w-full text-left">
        <!-- head -->
        <thead class="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-base-300">
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
                <td class="font-bold text-slate-900">Acme Corporation</td>
                <td>
                    <div class="text-sm font-medium">Cy Ganderton</div>
                    <div class="text-xs text-slate-400">cy@acme.com</div>
                </td>
                <td>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Confirmed</span>
                </td>
                <td>Arts, prints and stickers</td>
                <td>(555) 123-4567</td>
                <td><a href="https://instagram.com" target="_blank" class="text-blue-600 hover:underline">@acme</a></td>
                <td>Meta ads</td>
                <td>
                    <div class="flex gap-1">
                        <span class="px-1.5 py-0.5 text-[10px] bg-slate-100 rounded text-slate-600">VIP</span>
                        <span class="px-1.5 py-0.5 text-[10px] bg-blue-100 rounded text-blue-600">Tier-1</span>
                    </div>
                </td>
            </tr>
            <!-- row 2 -->
            <tr class="hover">
                <th>2</th>
                <td>2023-10-02</td>
                <td class="font-bold text-slate-900">Stark Industries</td>
                <td>
                    <div class="text-sm font-medium">Hart Hagerty</div>
                    <div class="text-xs text-slate-400">hart@stark.com</div>
                </td>
                <td>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">In Dunning</span>
                </td>
                <td>Ceramics</td>
                <td>(555) 987-6543</td>
                <td><a href="https://instagram.com" target="_blank" class="text-blue-600 hover:underline">@starkind</a></td>
                <td>Shopify form</td>
                <td>
                    <div class="flex gap-1">
                        <span class="px-1.5 py-0.5 text-[10px] bg-amber-100 rounded text-amber-600">Late Pay</span>
                    </div>
                </td>
            </tr>
            <!-- row 3 -->
            <tr class="hover">
                <th>3</th>
                <td>2023-10-03</td>
                <td class="font-bold text-slate-900">Wayne Enterprises</td>
                <td>
                    <div class="text-sm font-medium">Brice Swyre</div>
                    <div class="text-xs text-slate-400">brice@wayne.co</div>
                </td>
                <td>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Draft</span>
                </td>
                <td>Vintage Clothing</td>
                <td>(555) 555-5555</td>
                <td><a href="https://instagram.com" target="_blank" class="text-blue-600 hover:underline">@wayne_ent</a></td>
                <td>Email</td>
                <td>
                    <div class="flex gap-1">
                        <span class="px-1.5 py-0.5 text-[10px] bg-purple-100 rounded text-purple-600">Sponsor</span>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</div>

</div>
</div>
