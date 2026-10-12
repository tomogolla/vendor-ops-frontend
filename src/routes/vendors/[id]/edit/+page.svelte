<script lang="ts">
	import { goto } from '$app/navigation';
	import VendorForm from '#lib/components/VendorForm.svelte';
	import { updateVendor, vendors, type VendorInput } from '#lib/vendor-store.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const vendor = $derived($vendors.find((item) => item.id === data.id));

	async function save(input: VendorInput) {
		const updated = await updateVendor(data.id, input);
		if (!updated) throw new Error('This vendor no longer exists.');
		await goto(`/vendors/${data.id}`);
	}
</script>

<svelte:head><title>Edit {vendor?.brandName ?? 'vendor'} · Vendor Ops</title></svelte:head>

{#if vendor}
	<div class="mx-auto flex max-w-4xl flex-col gap-4 p-2">
		<header class="flex items-center justify-between">
			<h1 class="text-lg font-bold">
				Edit {vendor.brandName} <span class="font-mono text-xs text-base-content/50">#{vendor.id}</span>
			</h1>
			<a href={`/vendors/${vendor.id}`} class="link text-sm">Back to profile</a>
		</header>
		{#key vendor.id}
			<VendorForm mode="edit" initial={vendor} cancelHref={`/vendors/${vendor.id}`} onsave={save} />
		{/key}
	</div>
{:else}
	<div class="card mx-auto max-w-xl border border-base-200 bg-base-100 shadow-sm">
		<div class="card-body items-start">
			<h1 class="card-title">Vendor not found</h1>
			<p class="text-sm text-base-content/70">There is no vendor with ID #{data.id}.</p>
			<a href="/vendors" class="btn btn-primary btn-sm">Return to vendor list</a>
		</div>
	</div>
{/if}
