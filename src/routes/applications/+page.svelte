<script lang="ts">
    import { vendors } from "../../lib/vendor-store";
</script>

<div class="bg-base-100 w-full shadow-sm border border-base-200 rounded-lg">
    <header class="base-100 bg-[#f4f4f4] py-2">
        <div class="mb-4 px-4">
            <!-- Open the modal using ID.showModal() method -->
            <button
                class="btn btn-primary btn-sm"
                onclick={() => {
                    const modal = document.getElementById("my_modal_2");
                    if (modal instanceof HTMLDialogElement) modal.showModal();
                }}
                >Import Vendor CSV
            </button>
            <a
                href="/applications/new"
                class="btn bg-[#35b2b2] hover:bg-[#2c9696] border-none text-white btn-sm text-xs font-semibold"
            >
                Create vendor application
            </a>
            <dialog id="my_modal_2" class="modal">
                <div class="modal-box">
                    <h2>Import vendors CSV</h2>
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Pick a file</legend>
                        <input type="file" class="file-input" />
                        <p class="label">Max size 2MB</p>
                    </fieldset>
                    <div class="modal-action">
                        <form method="dialog">
                            <!-- if there is a button in form, it will close the modal -->
                            <button class="btn btn-sm">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
            <div class="flex gap-2"></div>
        </div>
    </header>

    <div class="bg-base-200/40 border border-base-200 rounded-lg p-2 gap-4">
        <!-- New applications -->
        <div class="overflow-x-auto bg-base-400 rounded-lg shadow-sm">
            <header class="bg-base-300/50 py-2 px-4">
                <h3 class="text-sm font-bold">New Applications/Call Tasks</h3>
            </header>
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
                        <th>Category</th>
                        <th>Phone</th>
                        <th>Instagram</th>
                        <th>Lead Source</th>
                        <th>Tags</th>
                    </tr>
                </thead>
                <tbody>
                    {#each $vendors as vendor, index (vendor.id)}
                        <tr class="hover">
                            <th>{index + 1}</th>
                            <td>{vendor.createdAt}</td>
                            <td class="font-medium text-xs">
                                <a
                                    href={`/applications/${vendor.id}`}
                                    class="hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-[#35b2b2]"
                                    >{vendor.brandName}</a
                                >
                            </td>
                            <td
                                ><div class="text-sm font-medium">
                                    {vendor.firstName}
                                    {vendor.lastName}
                                </div>
                                <div class="text-xs text-slate-400">
                                    {vendor.email}
                                </div></td
                            >
                            <td>{vendor.category}</td>
                            <td>{vendor.phone}</td>
                            <td
                                >{#if vendor.instagram}<a
                                        href={`https://instagram.com/${vendor.instagram.replace("@", "")}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        class="text-blue-600 hover:underline"
                                        >{vendor.instagram}</a
                                    >{:else}—{/if}</td
                            >
                            <td>{vendor.leadSource || "—"}</td>
                            <td
                                ><div class="flex gap-1">
                                    {#each vendor.tags as tag}<span
                                            class="px-1.5 py-0.5 text-[10px] bg-slate-100 rounded text-slate-600"
                                            >{tag}</span
                                        >{/each}
                                </div></td
                            >
                        </tr>
                    {/each}
                </tbody>
                <tbody class="hidden" aria-hidden="true">
                    <!-- row 1 -->
                    <tr class="hover">
                        <th>1</th>
                        <td>2023-10-01</td>
                        <td class="font-medium text-xs">
                            <a
                                href="/vendors/1"
                                class="hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-[#35b2b2]"
                                >Acme Corporation</a
                            >
                        </td>
                        <td>
                            <div class="text-sm font-medium">Cy Ganderton</div>
                            <div class="text-xs text-slate-400">
                                cy@acme.com
                            </div>
                        </td>
                        <td>Arts, prints and stickers</td>
                        <td>(555) 123-4567</td>
                        <td
                            ><a
                                href="https://instagram.com"
                                target="_blank"
                                class="text-blue-600 hover:underline">@acme</a
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
                        <td class="font-medium text-xs">
                            <a
                                href="/vendors/2"
                                class="hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-[#35b2b2]"
                                >Stark Industries</a
                            >
                        </td>
                        <td>
                            <div class="text-sm font-medium">Hart Hagerty</div>
                            <div class="text-xs text-slate-400">
                                hart@stark.com
                            </div>
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
                        <td class="font-medium text-xs">
                            <a
                                href="/vendors/3"
                                class="hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-[#35b2b2]"
                                >Wayne Enterprices</a
                            >
                        </td>
                        <td>
                            <div class="text-sm font-medium">Brice Swyre</div>
                            <div class="text-xs text-slate-400">
                                bruce@wayne.co
                            </div>
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
