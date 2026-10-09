<script>
</script>

<div class="rounded-box">
  <button
    class="btn text-white border-none"
    style="background-color: var(--brand-color);"
    onclick={() => {
      const modal = document.getElementById("my_modal_3");
      if (modal instanceof HTMLDialogElement) modal.showModal();
    }}
  >
    + Add Vendor
  </button>

  <dialog id="my_modal_3" class="modal">
    <!-- Responsive container with maximum width for comprehensive vendor form -->
    <div
      class="modal-box p-0 overflow-hidden border-2 border-[var(--brand-color)] rounded-xl max-w-3xl w-full"
    >
      <!-- Close Button -->
      <form method="dialog">
        <button
          class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 z-10 text-white"
          >✕</button
        >
      </form>

      <!-- Header Section -->
      <div class="p-4 text-white" style="background-color: var(--brand-color);">
        <h3 class="font-bold text-lg">Vendor Profile Details</h3>
      </div>

      <!-- Modal Form Body -->
      <form method="dialog" class="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        <!-- Brand Name (Full Width) -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend font-semibold">Brand Name</legend>
          <input
            type="text"
            id="brand_name"
            class="input input-bordered w-full"
            placeholder="e.g. Acme Vintage Co."
            required
          />
        </fieldset>

        <!-- First & Last Name Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold">First Name</legend>
            <input
              type="text"
              id="first_name"
              class="input input-bordered w-full"
              placeholder="First Name"
              required
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold">Last Name</legend>
            <input
              type="text"
              id="last_name"
              class="input input-bordered w-full"
              placeholder="Last Name"
              required
            />
          </fieldset>
        </div>

        <!-- Website & Instagram Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold">Website</legend>
            <input
              type="url"
              id="website"
              class="input input-bordered w-full"
              placeholder="https://yourbrand.com"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold">Instagram</legend>
            <div class="relative w-full">
              <span
                class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 font-medium"
                >@</span
              >
              <input
                type="text"
                id="instagram"
                class="input input-bordered w-full pl-8"
                placeholder="instagram_handle"
              />
            </div>
          </fieldset>
        </div>

        <!-- Email & Phone Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold">Email Address</legend>
            <label class="input input-bordered flex items-center gap-2 w-full">
              <svg
                class="h-[1em] opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <g
                  stroke-linejoin="round"
                  stroke-linecap="round"
                  stroke-width="2.5"
                  fill="none"
                  stroke="currentColor"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </g>
              </svg>
              <input
                type="email"
                id="email"
                class="grow"
                placeholder="mail@site.com"
                required
              />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold">Phone Number</legend>
            <input
              type="tel"
              id="phone"
              class="input input-bordered w-full"
              placeholder="(555) 000-0000"
              required
            />
          </fieldset>
        </div>
        <!-- About brand -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend font-semibold">About the brand</legend>
          <textarea
            id="about_brand"
            class="textarea textarea-bordered w-full h-20"
            placeholder="About the brand and what makes it unique..."
          ></textarea>
        </fieldset>
        <!-- Commitment & Insurance Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold"
              >Commitment Level</legend
            >
            <select
              id="commitment"
              class="select select-bordered w-full"
              required
            >
              <option value="" disabled selected>Select commitment</option>
              <option value="full-time">Full-Time Vendor</option>
              <option value="part-time">Part-Time / Seasonal</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold"
              >Insurance Status</legend
            >
            <select
              id="has_insurance"
              class="select select-bordered w-full"
              required
            >
              <option value="" disabled selected>Has Insurance?</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="pending">In Progress / Pending</option>
            </select>
          </fieldset>
        </div>

        <!-- Sales & Call Status -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold">Call Outcome</legend>
            <select id="call_outcome" class="select select-bordered w-full">
              <option value="" disabled selected>Select outcome</option>
              <option value="not_answered">Not Answered</option>
              <option value="closed_confirmed">Closed-confirmed</option>
              <option value="follow_up_needed">Follow Up Needed</option>
              <option value="unqualified">Unqualified</option>
              <option value="lost">Lost</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold"
              >Vendor Interest Level</legend
            >
            <select
              id="vendor_interest_level"
              class="select select-bordered w-full"
            >
              <option value="" disabled selected>Select interest</option>
              <option value="1">1 - Hesitant</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5 - Extremely Excited</option>
            </select>
          </fieldset>
        </div>

        <!-- Call Details -->
        <fieldset class="fieldset border border-base-300 p-4 rounded-lg">
          <legend class="fieldset-legend font-semibold px-2"
            >Call Details</legend
          >

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend font-semibold">Call Outcome</legend
              >
              <select
                id="call_detail_outcome"
                class="select select-bordered w-full"
              >
                <option value="" disabled selected>Select call status</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="connected">Connected</option>
                <option value="voicemail">Voicemail</option>
                <option value="busy">Busy</option>
                <option value="not_answered">Not Answered</option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend font-semibold"
                >Call Date & Time</legend
              >
              <input
                type="datetime-local"
                id="call_date_time"
                class="input input-bordered w-full"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend font-semibold"
                >Vendor Category</legend
              >
              <select
                id="vendor_category"
                class="select select-bordered w-full"
              >
                <option value="" disabled selected>Select category</option>
                <option value="pets_accessories">Pets Accessories</option>
                <option value="arts_prints_stickers"
                  >Arts, Prints &amp; Stickers</option
                >
                <option value="beauty_cosmetics">Beauty &amp; Cosmetics</option>
                <option value="ceramics_glass">Ceramics / Glass</option>
                <option value="clothing_brand">Clothing Brand</option>
                <option value="crotchet_sewing_quilt_goods"
                  >Crotchet, Sewing, Quilt Goods</option
                >
                <option value="cultural_collectibles"
                  >Cultural Collectibles</option
                >
                <option value="experience">Experience</option>
                <option value="homeware">Homeware</option>
                <option value="jewelry">Jewelry</option>
                <option value="leatherwork">Leatherwork</option>
                <option value="music_vinyl">Music / Vinyl</option>
                <option value="nyc_merch">NYC Merch</option>
                <option value="photography">Photography</option>
                <option value="plants">Plants</option>
                <option value="soaps_candles_perfume"
                  >Soaps / Candles and Perfume</option
                >
                <option value="stationery">Stationery</option>
                <option value="unique_things">Unique Things</option>
                <option value="vintage_clothing">Vintage Clothing</option>
                <option value="vintage_general">Vintage General</option>
                <option value="vintage_homeware">Vintage Homeware</option>
                <option value="vintage_jewelry">Vintage Jewelry</option>
                <option value="vintage_upcycled">Vintage Upcycled</option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend font-semibold">Lead Source</legend>
              <select id="lead_source" class="select select-bordered w-full">
                <option value="" disabled selected>Select lead source</option>
                <option value="instagram">Instagram</option>
                <option value="email">Email</option>
                <option value="shopify_form">Shopify Form</option>
                <option value="meta_ads">Meta Ads</option>
                <option value="application_form">Application Form</option>
              </select>
            </fieldset>
          </div>
        </fieldset>

        <!-- Addons Section (Tent Only) -->
        <fieldset class="fieldset border border-base-300 p-3 rounded-lg">
          <legend class="fieldset-legend font-semibold px-2">Addons</legend>
          <label class="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              id="addon_tent"
              class="checkbox checkbox-accent"
            />
            <span class="label-text font-medium">Tent Rental Needed</span>
          </label>
        </fieldset>

        <!-- Select Market Dates (Checkbox Selection) -->
        <fieldset class="fieldset border border-base-300 p-4 rounded-lg">
          <legend class="fieldset-legend font-semibold px-2"
            >Select Market Dates</legend
          >
          <div
            class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1"
          >
            <label
              class="label cursor-pointer justify-start gap-3 border border-base-200 p-2 rounded hover:bg-base-100"
            >
              <input
                type="checkbox"
                name="market_dates"
                value="Oct 10-11"
                class="checkbox checkbox-sm checkbox-accent"
              />
              <span class="label-text text-sm">October 10 & October 11</span>
            </label>
            <label
              class="label cursor-pointer justify-start gap-3 border border-base-200 p-2 rounded hover:bg-base-100"
            >
              <input
                type="checkbox"
                name="market_dates"
                value="Oct 17-18"
                class="checkbox checkbox-sm checkbox-accent"
              />
              <span class="label-text text-sm">October 17 & October 18</span>
            </label>
            <label
              class="label cursor-pointer justify-start gap-3 border border-base-200 p-2 rounded hover:bg-base-100"
            >
              <input
                type="checkbox"
                name="market_dates"
                value="Oct 24-25"
                class="checkbox checkbox-sm checkbox-accent"
              />
              <span class="label-text text-sm">October 24 & October 25</span>
            </label>
            <label
              class="label cursor-pointer justify-start gap-3 border border-base-200 p-2 rounded hover:bg-base-100"
            >
              <input
                type="checkbox"
                name="market_dates"
                value="Oct 31-Nov 01"
                class="checkbox checkbox-sm checkbox-accent"
              />
              <span class="label-text text-sm">October 31 & November 01</span>
            </label>
            <label
              class="label cursor-pointer justify-start gap-3 border border-base-200 p-2 rounded hover:bg-base-100"
            >
              <input
                type="checkbox"
                name="market_dates"
                value="Nov 07-08"
                class="checkbox checkbox-sm checkbox-accent"
              />
              <span class="label-text text-sm">November 07 & November 08</span>
            </label>
            <label
              class="label cursor-pointer justify-start gap-3 border border-base-200 p-2 rounded hover:bg-base-100"
            >
              <input
                type="checkbox"
                name="market_dates"
                value="Nov 14-15"
                class="checkbox checkbox-sm checkbox-accent"
              />
              <span class="label-text text-sm">November 14 & November 15</span>
            </label>
            <label
              class="label cursor-pointer justify-start gap-3 border border-base-200 p-2 rounded hover:bg-base-100"
            >
              <input
                type="checkbox"
                name="market_dates"
                value="Nov 21-22"
                class="checkbox checkbox-sm checkbox-accent"
              />
              <span class="label-text text-sm">November 21 & November 22</span>
            </label>
            <label
              class="label cursor-pointer justify-start gap-3 border border-base-200 p-2 rounded hover:bg-base-100"
            >
              <input
                type="checkbox"
                name="market_dates"
                value="Nov 28-29"
                class="checkbox checkbox-sm checkbox-accent"
              />
              <span class="label-text text-sm">November 28 & November 29</span>
            </label>
            <label
              class="label cursor-pointer justify-start gap-3 border border-base-200 p-2 rounded hover:bg-base-100"
            >
              <input
                type="checkbox"
                name="market_dates"
                value="Dec 05-06"
                class="checkbox checkbox-sm checkbox-accent"
              />
              <span class="label-text text-sm">December 05 & December 06</span>
            </label>
            <label
              class="label cursor-pointer justify-start gap-3 border border-base-200 p-2 rounded hover:bg-base-100"
            >
              <input
                type="checkbox"
                name="market_dates"
                value="Dec 12-13"
                class="checkbox checkbox-sm checkbox-accent"
              />
              <span class="label-text text-sm">December 12 & December 13</span>
            </label>
            <label
              class="label cursor-pointer justify-start gap-3 border border-base-200 p-2 rounded hover:bg-base-100"
            >
              <input
                type="checkbox"
                name="market_dates"
                value="Dec 19-20"
                class="checkbox checkbox-sm checkbox-accent"
              />
              <span class="label-text text-sm">December 19 & December 20</span>
            </label>
          </div>
        </fieldset>

        <!-- Other Markets & The Good Flea Offer Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold"
              >Other Markets Participated In</legend
            >
            <input
              type="text"
              id="other_markets"
              class="input input-bordered w-full"
              placeholder="e.g., Canal St Market, Brooklyn Flea"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend font-semibold"
              >The Good Flea Offer</legend
            >
            <input
              type="text"
              id="good_flea_offer"
              class="input input-bordered w-full"
              placeholder="e.g., New Vendor Trial / Standard Rate"
            />
          </fieldset>
        </div>

        <!-- Business Challenges -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend font-semibold"
            >Business Challenges</legend
          >
          <textarea
            id="business_challenges"
            class="textarea textarea-bordered w-full h-20"
            placeholder="Describe any current sales, operational, or logistics challenges..."
          ></textarea>
        </fieldset>

        <!-- Goals and Objectives -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend font-semibold"
            >Goals & Objectives</legend
          >
          <textarea
            id="goals"
            class="textarea textarea-bordered w-full h-20"
            placeholder="Describe your revenue targets or customer acquisition goals..."
          ></textarea>
        </fieldset>

        <!-- Notes Field -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend font-semibold">Notes</legend>
          <textarea
            id="notes"
            class="textarea textarea-bordered w-full h-20"
            placeholder="Add any internal representative notes or special requests..."
          ></textarea>
        </fieldset>

        <!-- Modal Actions -->
        <div class="modal-action pt-2 flex justify-end gap-2">
          <button
            type="button"
            class="btn"
            onclick={() => {
              const dialog = document.getElementById("my_modal_3");
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
            Save Vendor Profile
          </button>
        </div>
      </form>
    </div>
  </dialog>
  <!-- Open the modal using ID.showModal() method -->
  <button
    class="btn btn-outline"
    onclick={() => {
      const modal = document.getElementById("my_modal_2");
      if (modal instanceof HTMLDialogElement) modal.showModal();
    }}>Import CSV</button
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
</div>

<div class="overflow-x-auto bg-base-400 rounded-lg shadow-sm">
        <table class="table table-zebra w-full text-left">
        <!-- head -->
        <thead class="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-base-300">
            <tr>
                <th></th>
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
                <td class="font-bold text-slate-900">Acme Corporation</td>
                <td>
                    <div class="text-sm font-medium">Cy Ganderton</div>
                    <div class="text-xs text-slate-400">cy@acme.com</div>
                </td>
                <td>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Confirmed</span>
                </td>
                <td>Corporate Gala</td>
                <td>(555) 123-4567</td>
                <td><a href="https://instagram.com" target="_blank" class="text-blue-600 hover:underline">@acme</a></td>
                <td>LinkedIn Referral</td>
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
                <td class="font-bold text-slate-900">Stark Industries</td>
                <td>
                    <div class="text-sm font-medium">Hart Hagerty</div>
                    <div class="text-xs text-slate-400">hart@stark.com</div>
                </td>
                <td>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">In Dunning</span>
                </td>
                <td>Exhibition Booth</td>
                <td>(555) 987-6543</td>
                <td><a href="https://instagram.com" target="_blank" class="text-blue-600 hover:underline">@starkind</a></td>
                <td>Google Search</td>
                <td>
                    <div class="flex gap-1">
                        <span class="px-1.5 py-0.5 text-[10px] bg-amber-100 rounded text-amber-600">Late Pay</span>
                    </div>
                </td>
            </tr>
            <!-- row 3 -->
            <tr class="hover">
                <th>3</th>
                <td class="font-bold text-slate-900">Wayne Enterprises</td>
                <td>
                    <div class="text-sm font-medium">Brice Swyre</div>
                    <div class="text-xs text-slate-400">brice@wayne.co</div>
                </td>
                <td>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Draft</span>
                </td>
                <td>Charity Auction</td>
                <td>(555) 555-5555</td>
                <td><a href="https://instagram.com" target="_blank" class="text-blue-600 hover:underline">@wayne_ent</a></td>
                <td>Cold Email Loop</td>
                <td>
                    <div class="flex gap-1">
                        <span class="px-1.5 py-0.5 text-[10px] bg-purple-100 rounded text-purple-600">Sponsor</span>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</div>


<style>
  .rounded-box {
    padding: 0.75rem;
    background-color: #f4f4f4;
    border-radius: 0.5rem; /* Adjust this value to change the roundness */
    margin-bottom: 1rem; /* Optional: adds space below the box */
  }
  .btn-outline {
    border-color: var(--brand-color);
    color: var(--brand-color);
  }
  .btn-outline:hover {
    background-color: var(--brand-color);
    color: white;
  }
  .btn-sm {
    background-color: var(--brand-color);
    color: white;
  }
</style>
