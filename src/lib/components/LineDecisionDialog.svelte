<script lang="ts">
	import { decideLine, type ApplicationLine, type LineAction, type LineDecision } from '#lib/applications.ts';
	import type { CapacityDisplay } from '#lib/catalog.ts';
	import { formatMoney } from '#lib/format.ts';

	type Pending = {
		line: Pick<ApplicationLine, 'id' | 'productName' | 'quantity' | 'unitPriceCents' | 'totalCents' | 'weekend'>;
		action: LineAction & { key: LineDecision };
		capacity: CapacityDisplay | null;
		/** e.g. the vendor's brand, when the dialog is opened outside the application page. */
		context?: string;
	};

	let { currency = 'USD', ondone }: { currency?: string; ondone: () => void } = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let pending = $state<Pending | null>(null);
	let reason = $state('');
	let busy = $state(false);
	let error = $state('');

	export function open(next: Pending) {
		pending = next;
		reason = '';
		error = '';
		dialog?.showModal();
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!pending) return;
		if (pending.action.reason === 'required' && !reason.trim()) {
			error = 'A reason is required.';
			return;
		}
		busy = true;
		error = '';
		try {
			await decideLine(pending.line.id, pending.action.key, reason);
			dialog?.close();
			ondone();
		} catch (err) {
			// The server's message, e.g. "Only 0 of 8ft x 8ft left for Oct 10 & 11; this line needs 1. Waitlist it instead."
			error = err instanceof Error ? err.message : 'That did not work.';
		} finally {
			busy = false;
		}
	}
</script>

<dialog bind:this={dialog} class="modal" aria-labelledby="line-decision-title">
	<div class="modal-box max-w-md">
		{#if pending}
			{@const { line, action, capacity } = pending}
			<form class="flex flex-col gap-3" onsubmit={submit}>
				<h3 id="line-decision-title" class="font-bold text-base">
					{action.label}: {line.productName}, {line.weekend.label}{pending.context ? ` (${pending.context})` : ''}
				</h3>
				<p class="text-sm text-base-content/70">
					{line.quantity} × {formatMoney(line.unitPriceCents, currency)} = {formatMoney(line.totalCents, currency)}
				</p>
				{#if action.key === 'confirm' && capacity}
					<div class={['rounded-lg p-2 text-sm', capacity.tone === 'full' ? 'bg-error/10' : capacity.tone === 'low' ? 'bg-warning/30' : 'bg-base-200']}>
						<p class="font-medium">{capacity.unlimited ? 'No capacity limit' : `${Math.max(capacity.remaining ?? 0, 0)} of ${capacity.capacity} left`}</p>
						<p class="text-xs text-base-content/70">{capacity.text}{capacity.waitlisted ? ` · ${capacity.waitlisted} waitlisted` : ''}</p>
						{#if !capacity.unlimited && (capacity.remaining ?? 0) < line.quantity}
							<p class="mt-1 text-xs">This line needs {line.quantity}; the server will refuse it. Waitlist it instead.</p>
						{/if}
					</div>
				{:else if action.key === 'release'}
					<p class="text-sm">Releasing gives the capacity back. Add-on lines on this booth are released too.</p>
				{/if}
				{#if action.reason !== 'none'}
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for="line-reason">Reason{action.reason === 'required' ? ' (required)' : ' (optional)'}</label>
						<textarea id="line-reason" class="textarea w-full" rows="3" bind:value={reason} required={action.reason === 'required'} aria-invalid={Boolean(error)}></textarea>
					</div>
				{/if}
				{#if error}<p role="alert" class="text-error text-sm">{error}</p>{/if}
				<div class="modal-action mt-0">
					<button type="button" class="btn btn-sm" onclick={() => dialog?.close()}>Cancel</button>
					<button type="submit" class={['btn btn-sm', action.tone]} disabled={busy}>{action.label}</button>
				</div>
			</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button aria-label="Close">close</button></form>
</dialog>
