<script lang="ts">
	import { goto } from '$app/navigation';
	import { createVendor } from '../vendor-store';

	let dialog: HTMLDialogElement;
	const categories = ['Pets Accessories', 'Arts, Prints & Stickers', 'Beauty & Cosmetics', 'Ceramics / Glass', 'Clothing Brand', 'Crotchet, Sewing, Quilt Goods', 'Cultural Collectibles', 'Experience', 'Homeware', 'Jewelry', 'Leatherwork', 'Music / Vinyl', 'NYC Merch', 'Photography', 'Plants', 'Soaps / Candles and Perfume', 'Stationery', 'Unique Things', 'Vintage Clothing', 'Vintage General', 'Vintage Homeware', 'Vintage Jewelry', 'Vintage Upcycled'];

	let firstName = $state(''); let lastName = $state(''); let brandName = $state('');
	let email = $state(''); let phone = $state(''); let category = $state('');
	let instagram = $state(''); let website = $state(''); let leadSource = $state('');
	let tags = $state(''); let aboutBrand = $state(''); let objectives = $state('');
	let boothDimensions = $state(''); let bookedDates = $state('');
	let otherMarkets = $state(''); let notes = $state('');

	export function showModal() { dialog.showModal(); }
	export function close() { dialog.close(); }

	function resetForm() {
		firstName = ''; lastName = ''; brandName = ''; email = ''; phone = ''; category = '';
		instagram = ''; website = ''; leadSource = ''; tags = ''; aboutBrand = ''; objectives = '';
		boothDimensions = ''; bookedDates = ''; otherMarkets = ''; notes = '';
	}

	function cancel() { close(); resetForm(); }

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const vendor = createVendor({
			firstName: firstName.trim(), lastName: lastName.trim(), brandName: brandName.trim(),
			email: email.trim(), phone: phone.trim(), category, instagram: instagram.trim(),
			website: website.trim(), leadSource: leadSource.trim(),
			tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
			aboutBrand: aboutBrand.trim(), objectives: objectives.trim(), boothDimensions: boothDimensions.trim(),
			bookedDates: bookedDates.split(',').map((date) => date.trim()).filter(Boolean),
			otherMarkets: otherMarkets.trim(), notes: notes.trim()
		});
		close(); resetForm();
		await goto(`/vendors/${vendor.id}`);
	}
</script>

<dialog bind:this={dialog} class="modal" aria-labelledby="create-vendor-title" onclose={resetForm}>
	<div class="modal-box max-w-4xl max-h-[90vh] p-0 overflow-hidden">
		<header class="flex items-center justify-between border-b border-base-200 bg-base-100 px-5 py-4">
			<div><h2 id="create-vendor-title" class="text-lg font-bold">Create vendor account</h2><p class="text-xs text-base-content/60">Add the vendor’s contact and brand information.</p></div>
			<button type="button" class="btn btn-sm btn-circle btn-ghost" aria-label="Close create vendor modal" onclick={cancel}>✕</button>
		</header>
		<form id="create-vendor-form" class="grid max-h-[calc(90vh-9rem)] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2" onsubmit={handleSubmit}>
			<label class="fieldset"><span class="fieldset-legend">First name *</span><input class="input w-full" bind:value={firstName} autocomplete="given-name" required /></label>
			<label class="fieldset"><span class="fieldset-legend">Last name *</span><input class="input w-full" bind:value={lastName} autocomplete="family-name" required /></label>
			<label class="fieldset"><span class="fieldset-legend">Brand name *</span><input class="input w-full" bind:value={brandName} required /></label>
			<label class="fieldset"><span class="fieldset-legend">Category *</span><select class="select w-full" bind:value={category} required><option value="" disabled>Choose a category</option>{#each categories as item}<option value={item}>{item}</option>{/each}</select></label>
			<label class="fieldset"><span class="fieldset-legend">Contact email *</span><input class="input w-full" type="email" bind:value={email} autocomplete="email" required /></label>
			<label class="fieldset"><span class="fieldset-legend">Phone *</span><input class="input w-full" type="tel" bind:value={phone} autocomplete="tel" pattern={'[0-9+() .-]{7,}'} title="Enter a valid phone number" required /></label>
			<label class="fieldset"><span class="fieldset-legend">Instagram</span><input class="input w-full" bind:value={instagram} placeholder="@brand" /></label>
			<label class="fieldset"><span class="fieldset-legend">Website</span><input class="input w-full" type="url" bind:value={website} placeholder="https://" /></label>
			<label class="fieldset"><span class="fieldset-legend">Lead source</span><input class="input w-full" bind:value={leadSource} /></label>
			<label class="fieldset"><span class="fieldset-legend">Tags</span><input class="input w-full" bind:value={tags} placeholder="VIP, New vendor" /><span class="label">Separate tags with commas</span></label>
			<label class="fieldset sm:col-span-2"><span class="fieldset-legend">About brand</span><textarea class="textarea w-full" rows="3" bind:value={aboutBrand}></textarea></label>
			<label class="fieldset sm:col-span-2"><span class="fieldset-legend">Objectives for joining The Good Flea</span><textarea class="textarea w-full" rows="2" bind:value={objectives}></textarea></label>
			<label class="fieldset"><span class="fieldset-legend">Proposed booth dimensions</span><input class="input w-full" bind:value={boothDimensions} placeholder="8ft x 8ft" /></label>
			<label class="fieldset"><span class="fieldset-legend">Booked dates</span><input class="input w-full" bind:value={bookedDates} placeholder="October 10 & 11, October 17 & 18" /><span class="label">Separate dates with commas</span></label>
			<label class="fieldset sm:col-span-2"><span class="fieldset-legend">Other markets</span><input class="input w-full" bind:value={otherMarkets} /></label>
			<label class="fieldset sm:col-span-2"><span class="fieldset-legend">Notes</span><textarea class="textarea w-full" rows="3" bind:value={notes}></textarea></label>
		</form>
		<footer class="flex justify-end gap-2 border-t border-base-200 bg-base-100 px-5 py-4"><button type="button" class="btn btn-sm" onclick={cancel}>Cancel</button><button type="submit" form="create-vendor-form" class="btn btn-primary btn-sm">Create vendor</button></footer>
	</div>
	<form method="dialog" class="modal-backdrop"><button aria-label="Close create vendor modal">close</button></form>
</dialog>
