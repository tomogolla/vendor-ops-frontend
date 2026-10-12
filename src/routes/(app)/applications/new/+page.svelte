<script lang="ts">
	import { goto } from '$app/navigation';
	import VendorForm, { type VendorFormPayload } from '#lib/components/VendorForm.svelte';
	import { session } from '#lib/session.svelte.ts';
	import {
		createLead,
		getVendor,
		listTeam,
		logCall,
		submitApplication,
		type UserSummary
	} from '#lib/vendor-store.ts';

	let team = $state<UserSummary[] | undefined>();
	$effect(() => {
		listTeam().then((members) => (team = members)).catch(() => (team = undefined));
	});

	async function save({ vendor, status, booking, call, ownerId, confirmDuplicate }: VendorFormPayload) {
		const vendorId =
			status === 'lead'
				? (await createLead(vendor, { ownerId: ownerId ?? null, confirmDuplicate })).id
				: (await submitApplication({ vendor, booking })).vendorId;
		if (call.outcome) {
			const created = await getVendor(vendorId);
			if (created.call.openTaskId) await logCall(created.call.openTaskId, call);
		}
		await goto(`/vendors/${vendorId}`);
	}
</script>

<svelte:head><title>New application · Vendor Ops</title></svelte:head>

<div class="mx-auto flex max-w-4xl flex-col gap-4 p-2">
	<header class="flex items-center justify-between">
		<h1 class="text-lg font-bold">New lead or application</h1>
		<a href="/applications" class="link text-sm">Back to applications</a>
	</header>
	<VendorForm
		mode="create"
		cancelHref="/applications"
		onsave={save}
		{team}
		currentUserId={session.user?.id}
		canAssignOthers={session.isAdmin}
	/>
</div>
