<script lang="ts">
	import { goto } from '$app/navigation';
	import AsyncState from '#lib/components/AsyncState.svelte';
	import VendorForm, { type VendorFormPayload } from '#lib/components/VendorForm.svelte';
	import { Resource } from '#lib/resource.svelte.ts';
	import { session } from '#lib/session.svelte.ts';
	import { getVendor, listTeam, updateVendor, type UserSummary, type Vendor } from '#lib/vendor-store.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const vendor = new Resource<Vendor>();
	let team = $state<UserSummary[] | undefined>();

	$effect(() => {
		const id = data.id;
		vendor.load(() => getVendor(id));
	});
	$effect(() => {
		if (session.isAdmin) listTeam().then((members) => (team = members)).catch(() => {});
	});

	async function save({ vendor: input, ownerId }: VendorFormPayload) {
		await updateVendor(data.id, { ...input, ...(ownerId !== undefined ? { ownerId } : {}) });
		await goto(`/vendors/${data.id}`);
	}
</script>

<svelte:head><title>Edit {vendor.data?.brandName ?? 'vendor'} · Vendor Ops</title></svelte:head>

<AsyncState resource={vendor} label="Loading vendor…">
	{#snippet children(current)}
		<div class="mx-auto flex max-w-4xl flex-col gap-4 p-2">
			<header class="flex items-center justify-between">
				<h1 class="text-lg font-bold">Edit {current.brandName}</h1>
				<a href={`/vendors/${current.id}`} class="link text-sm">Back to profile</a>
			</header>
			{#key current.id}
				<VendorForm
					mode="edit"
					initial={current}
					cancelHref={`/vendors/${current.id}`}
					onsave={save}
					{team}
					currentUserId={session.user?.id}
					canAssignOthers={session.isAdmin}
				/>
			{/key}
		</div>
	{/snippet}
	{#snippet notFound()}
		<div class="card mx-auto max-w-xl border border-base-200 bg-base-100 shadow-sm">
			<div class="card-body items-start">
				<h1 class="card-title">Vendor not found</h1>
				<p class="text-sm text-base-content/70">There is no vendor with ID {data.id}.</p>
				<a href="/vendors" class="btn btn-primary btn-sm">Return to vendor list</a>
			</div>
		</div>
	{/snippet}
</AsyncState>
