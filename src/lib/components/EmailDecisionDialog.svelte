<script lang="ts">
	import { approveMessage, cancelMessage, type EmailMessage, type EmailMessageDetail } from '#lib/emails.ts';

	type Decision = 'approve' | 'cancel';
	type Props = {
		/** From the email settings, when known: tells the person nothing reaches vendors right now. */
		liveSendingBlocked?: boolean | null;
		sendWindow?: string;
		ondone: (message: EmailMessageDetail, decision: Decision) => void;
	};
	let { liveSendingBlocked = null, sendWindow = '', ondone }: Props = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let message = $state<Pick<EmailMessage, 'id' | 'subject' | 'recipientEmail' | 'status' | 'templateName'> | null>(null);
	let decision = $state<Decision>('approve');
	let reason = $state('');
	let busy = $state(false);
	let error = $state('');

	export function open(next: NonNullable<typeof message>, kind: Decision) {
		message = next;
		decision = kind;
		reason = '';
		error = '';
		dialog?.showModal();
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!message || busy) return;
		busy = true;
		error = '';
		try {
			const result = decision === 'approve' ? await approveMessage(message.id) : await cancelMessage(message.id, reason);
			dialog?.close();
			ondone(result, decision);
		} catch (err) {
			// The server's reason, e.g. "This email no longer applies: … Cancel it instead."
			error = err instanceof Error ? err.message : 'That did not work.';
		} finally {
			busy = false;
		}
	}
</script>

<dialog bind:this={dialog} class="modal" aria-labelledby="email-decision-title">
	<div class="modal-box max-w-md">
		{#if message}
			<form class="flex flex-col gap-3" onsubmit={submit}>
				<h3 id="email-decision-title" class="text-base font-bold">
					{decision === 'approve' ? 'Approve this email?' : 'Cancel this email?'}
				</h3>
				<p class="text-sm">
					<span class="font-medium">{message.subject}</span><br />
					<span class="text-base-content/70">{message.templateName} to {message.recipientEmail}</span>
				</p>
				{#if decision === 'approve'}
					<p class="text-sm">
						It joins the sending queue and is sent in the next send window{sendWindow ? ` (${sendWindow})` : ''}. It can no longer be edited, but it can still be cancelled until it is sent.
					</p>
					{#if liveSendingBlocked}
						<p class="rounded-lg bg-base-200 p-2 text-xs">Sending is currently disabled or redirected, so no vendor receives it yet.</p>
					{/if}
				{:else}
					<p class="text-sm">
						It will not be sent{message.status === 'draft' ? ' and its review task is closed' : ''}. This cannot be undone; prepare a new email if needed.
					</p>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for="email-cancel-reason">Reason (optional, for the team)</label>
						<textarea id="email-cancel-reason" class="textarea w-full" rows="2" maxlength="500" bind:value={reason}></textarea>
					</div>
				{/if}
				{#if error}<p role="alert" class="text-sm text-error">{error}</p>{/if}
				<div class="modal-action mt-0">
					<button type="button" class="btn btn-sm" onclick={() => dialog?.close()} disabled={busy}>Back</button>
					<button type="submit" class={['btn btn-sm', decision === 'approve' ? 'btn-primary' : 'btn-error']} disabled={busy}>
						{#if busy}<span class="loading loading-spinner loading-xs"></span>{/if}
						{decision === 'approve' ? 'Approve and queue' : 'Cancel email'}
					</button>
				</div>
			</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button aria-label="Close" disabled={busy}>close</button></form>
</dialog>
