<script lang="ts">
	import { untrack } from 'svelte';
	import CallLogFields from '#lib/components/CallLogFields.svelte';
	import { formatDateTime } from '#lib/format.ts';
	import { session } from '#lib/session.svelte.ts';
	import { emptyCallInput, logCall, MAX_CALL_ATTEMPTS, type CallInput, type Vendor } from '#lib/vendor-store.ts';
	import { callErrors, type FieldErrors } from '#lib/vendor-validation.ts';

	let { vendor, onlogged }: { vendor: Vendor; onlogged: () => void } = $props();

	const freshDraft = (): CallInput => ({ ...emptyCallInput(), details: { ...vendor.call.details } });
	let draft: CallInput = $state(untrack(freshDraft));
	let errors: FieldErrors = $state({});
	let saving = $state(false);
	let message = $state('');
	let failure = $state('');

	const call = $derived(vendor.call);
	const canLog = $derived(
		call.openTaskId !== null && (session.isAdmin || call.ownerId === null || call.ownerId === session.user?.id)
	);

	async function save(event: SubmitEvent) {
		event.preventDefault();
		message = '';
		failure = '';
		errors = callErrors(draft, { requireOutcome: true });
		if (Object.keys(errors).length || !call.openTaskId) return;
		saving = true;
		try {
			const task = await logCall(call.openTaskId, $state.snapshot(draft));
			message = task.isOpen ? `Call logged (attempt ${task.attemptCount}). Task still open.` : 'Call logged. Task completed.';
			draft = { ...emptyCallInput(), details: { ...task.callDetails } };
			onlogged();
		} catch (error) {
			failure = error instanceof Error ? error.message : 'Could not log the call.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden" id="call">
	<form class="card-body gap-3" novalidate onsubmit={save}>
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h4 class="text-xs font-bold">CALL ACTIONS</h4>
			<p class="text-xs text-base-content/60">
				{#if call.lastCalledAt}
					Last call {formatDateTime(call.lastCalledAt)}: <strong>{call.lastOutcome}</strong> ·
				{:else}
					Not called yet ·
				{/if}
				{call.attemptCount}/{MAX_CALL_ATTEMPTS} attempts
				{#if call.dueAt}· due {formatDateTime(call.dueAt)}{/if}
			</p>
		</div>

		{#if !call.openTaskId}
			<p class="text-sm text-base-content/70">
				No open discovery call. {vendor.outreachOptOut ? 'This vendor is excluded from outreach.' : ''}
			</p>
		{:else if !canLog}
			<p class="text-sm text-base-content/70">This call is assigned to someone else.</p>
		{:else}
			<CallLogFields bind:value={draft} idPrefix={`vendor-${vendor.id}-call`} {errors} />
			{#if failure}<p role="alert" class="text-xs text-error">{failure}</p>{/if}
			<div class="flex items-center justify-end gap-2">
				{#if message}<p role="status" class="text-xs text-base-content/70">{message}</p>{/if}
				<button type="submit" class="btn btn-sm btn-outline" disabled={saving}>Log call</button>
			</div>
		{/if}
	</form>
</div>
