<script lang="ts">
	import { goto } from '$app/navigation';
	import VendorForm from '#lib/components/VendorForm.svelte';
	import { createVendor, type CreatableStatus, type VendorInput } from '#lib/vendor-store.ts';

	async function save(input: VendorInput, status: CreatableStatus) {
		const vendor = await createVendor(input, status);
		await goto(`/vendors/${vendor.id}`);
	}
</script>

<svelte:head><title>New application · Vendor Ops</title></svelte:head>

<div class="mx-auto flex max-w-4xl flex-col gap-4 p-2">
	<header class="flex items-center justify-between">
		<h1 class="text-lg font-bold">New application</h1>
		<a href="/applications" class="link text-sm">Back to applications</a>
	</header>
	<VendorForm mode="create" cancelHref="/applications" onsave={save} />
</div>
