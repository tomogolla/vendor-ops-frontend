<script lang="ts">
	import { untrack } from 'svelte';
	import CallLogFields from '#lib/components/CallLogFields.svelte';
	import { normaliseCallLog, updateVendor, type CallLog, type Vendor } from '#lib/vendor-store.ts';
	import { callErrors, type FieldErrors } from '#lib/vendor-validation.ts';

	let { vendor }: { vendor: Vendor } = $props();

	let draft: CallLog = $state(untrack(() => ({ ...vendor.call })));
	let errors: FieldErrors = $state({});
	let saving = $state(false);
	let message = $state('');

	async function save(event: SubmitEvent) {
		event.preventDefault();
		message = '';
		const call = normaliseCallLog($state.snapshot(draft));
		errors = callErrors(call);
		if (Object.keys(errors).length) return;
		saving = true;
		const updated = await updateVendor(vendor.id, { call });
		saving = false;
		if (updated) {
			draft = { ...updated.call };
			message = 'Call saved.';
		} else {
			message = 'This vendor no longer exists.';
		}
	}
</script>

<div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
	<form class="card-body gap-3" novalidate onsubmit={save}>
		<h4 class="text-xs font-bold">CALL ACTIONS</h4>
		<CallLogFields bind:value={draft} idPrefix={`vendor-${vendor.id}-call`} {errors} />
		<div class="flex items-center justify-end gap-2">
			{#if message}<p role="status" class="text-xs text-base-content/70">{message}</p>{/if}
			<button type="submit" class="btn btn-sm btn-outline" disabled={saving}>Save call</button>
		</div>
	</form>
</div>
