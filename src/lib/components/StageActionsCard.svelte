<script lang="ts">
	import StageBadge from '#lib/components/StageBadge.svelte';
	import {
		availableStageActions,
		changeStage,
		markBilled,
		markFirstPayment,
		stageActionTarget,
		stageLabels,
		type Application,
		type StageAction
	} from '#lib/applications.ts';
	import { formatDateTime } from '#lib/format.ts';

	let { application, isAdmin, onchanged }: { application: Application; isAdmin: boolean; onchanged: () => void } = $props();

	const actions = $derived(availableStageActions(application, isAdmin));

	let dialog: HTMLDialogElement | undefined = $state();
	let pending = $state<StageAction | null>(null);
	let text = $state('');
	let busy = $state(false);
	let error = $state('');

	function open(action: StageAction) {
		pending = action;
		text = '';
		error = '';
		dialog?.showModal();
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!pending) return;
		busy = true;
		error = '';
		try {
			const target = stageActionTarget[pending.key];
			if (target) await changeStage(application.id, target, text);
			// TODO(invoicing): interim; the next release replaces these with real invoices and payments.
			else if (pending.key === 'mark_billed') await markBilled(application.id);
			else if (pending.key === 'mark_first_payment') await markFirstPayment(application.id, text);
			dialog?.close();
			onchanged();
		} catch (err) {
			error = err instanceof Error ? err.message : 'That did not work.';
		} finally {
			busy = false;
		}
	}
</script>

<div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
	<div class="card-body gap-3">
		<h2 class="text-xs font-bold">STAGE</h2>
		<div><StageBadge stage={application.stage} size="md" /></div>
		<dl class="text-xs text-base-content/70">
			{#if application.billedAt}<div>Billed {formatDateTime(application.billedAt)}</div>{/if}
			{#if application.firstPaidAt}<div>First payment {formatDateTime(application.firstPaidAt)}</div>{/if}
		</dl>
		{#if !isAdmin}
			<p class="text-xs text-base-content/60">
				The stage moves on its own: logging a call moves New to In review. Administrators decide lines and billing.
			</p>
		{:else if actions.length}
			<div class="flex flex-col gap-2">
				{#each actions as action (action.key)}
					<button type="button" class={['btn btn-sm w-full', action.tone]} disabled={busy || Boolean(action.disabledReason)} title={action.disabledReason} onclick={() => open(action)}>
						{action.label}
						{#if action.interim}<span class="badge badge-xs">interim</span>{/if}
					</button>
					{#if action.disabledReason}<p class="text-[11px] text-base-content/60">{action.disabledReason}</p>{/if}
				{/each}
			</div>
			{#if actions.some((action) => action.interim)}
				<p class="text-[11px] text-base-content/60">Interim: real invoices and payments replace these in the next release.</p>
			{/if}
		{:else if application.stage === 'WON'}
			<p class="text-xs text-base-content/60">Won applications cannot be moved by hand; cancellations and refunds are not designed yet.</p>
		{/if}
	</div>
</div>

<dialog bind:this={dialog} class="modal" aria-labelledby="stage-action-title">
	<div class="modal-box max-w-md">
		{#if pending}
			<form class="flex flex-col gap-3" onsubmit={submit}>
				<h3 id="stage-action-title" class="font-bold text-base">{pending.label}: {application.vendorBrand}</h3>
				{#if stageActionTarget[pending.key]}
					{@const target = stageActionTarget[pending.key]}
					<p class="text-sm text-base-content/70">
						Stage changes from {stageLabels[application.stage]} to {target ? stageLabels[target] : ''}.
						{#if pending.key === 'decline' || pending.key === 'withdraw'}
							Open call and review tasks are cancelled, requested and waitlisted lines are cancelled and confirmed lines are released.
						{/if}
					</p>
				{:else if pending.key === 'mark_billed'}
					<p class="text-sm text-base-content/70">Records that the vendor was billed for the confirmed lines and moves the application to Awaiting payment.</p>
				{:else}
					<p class="text-sm text-base-content/70">Records the first payment, wins the application and makes the vendor Active.</p>
				{/if}
				{#if pending.input !== 'none'}
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for="stage-action-text">{pending.input === 'note' ? 'Note' : 'Reason'} (optional)</label>
						<textarea id="stage-action-text" class="textarea w-full" rows="3" bind:value={text}></textarea>
					</div>
				{/if}
				{#if error}<p role="alert" class="text-error text-sm">{error}</p>{/if}
				<div class="modal-action mt-0">
					<button type="button" class="btn btn-sm" onclick={() => dialog?.close()}>Cancel</button>
					<button type="submit" class={['btn btn-sm', pending.tone]} disabled={busy}>{pending.label}</button>
				</div>
			</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button aria-label="Close">close</button></form>
</dialog>
