<script lang="ts">
	import { ApiError } from '#lib/api.ts';
	import EmailPreviewFrame from '#lib/components/EmailPreviewFrame.svelte';
	import {
		draftChanged,
		draftFromMessage,
		draftProblems,
		reviseDraft,
		type DraftEdit,
		type EmailMessageDetail
	} from '#lib/emails.ts';

	let { onsaved }: { onsaved: (message: EmailMessageDetail) => void } = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let message = $state<EmailMessageDetail | null>(null);
	let original: DraftEdit = { subject: '', htmlBody: '', textBody: '' };
	let draft = $state<DraftEdit>({ subject: '', htmlBody: '', textBody: '', note: '' });
	let view = $state<'edit' | 'preview'>('edit');
	let busy = $state(false);
	let errors = $state<Record<string, string>>({});
	let error = $state('');

	const changed = $derived(message !== null && draftChanged(original, draft));

	/** Opens with the email's current content; nothing is lost if saving fails. */
	export function open(next: EmailMessageDetail) {
		message = next;
		original = draftFromMessage(next);
		draft = { ...original };
		view = 'edit';
		errors = {};
		error = '';
		dialog?.showModal();
	}

	function close() {
		if (changed && !busy && !confirm('Discard your changes to this draft?')) return;
		dialog?.close();
	}

	function oncancel(event: Event) {
		// Escape key: same unsaved-changes check as the Close button.
		event.preventDefault();
		close();
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (!message || busy) return;
		errors = draftProblems(draft);
		error = '';
		if (Object.keys(errors).length) {
			view = 'edit';
			return;
		}
		if (!changed) {
			dialog?.close();
			return;
		}
		busy = true;
		try {
			const saved = await reviseDraft(message.id, draft);
			dialog?.close();
			onsaved(saved);
		} catch (err) {
			// e.g. {"status": "Only drafts awaiting review can be edited."} when someone approved it meanwhile.
			errors = err instanceof ApiError ? err.fieldErrors : {};
			error = errors.status ?? (Object.keys(errors).length ? '' : err instanceof Error ? err.message : 'The draft could not be saved.');
			view = 'edit';
		} finally {
			busy = false;
		}
	}
</script>

<dialog bind:this={dialog} class="modal" aria-labelledby="email-edit-title" {oncancel}>
	<div class="modal-box flex max-w-3xl flex-col gap-3">
		{#if message}
			<form class="flex flex-col gap-3" onsubmit={save} novalidate>
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h3 id="email-edit-title" class="text-base font-bold">Edit draft: {message.templateName}</h3>
					<div role="tablist" aria-label="Editor view" class="tabs tabs-box tabs-xs">
						<button type="button" role="tab" aria-selected={view === 'edit'} class={['tab', view === 'edit' && 'tab-active']} onclick={() => (view = 'edit')}>Edit</button>
						<button type="button" role="tab" aria-selected={view === 'preview'} class={['tab', view === 'preview' && 'tab-active']} onclick={() => (view = 'preview')}>Preview</button>
					</div>
				</div>
				<p class="text-xs text-base-content/70">
					To {message.recipientName} &lt;{message.recipientEmail}&gt;. The recipient and sender cannot be changed. The current version is kept in the history when you save.
				</p>

				{#if view === 'edit'}
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for="email-subject">Subject</label>
						<input id="email-subject" class="input w-full" maxlength="255" bind:value={draft.subject} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? 'email-subject-error' : undefined} />
						{#if errors.subject}<p id="email-subject-error" class="text-xs text-error">{errors.subject}</p>{/if}
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for="email-html">Email body (HTML)</label>
						<textarea id="email-html" class="textarea w-full font-mono text-xs" rows="10" bind:value={draft.htmlBody} aria-invalid={Boolean(errors.html_body)} aria-describedby={errors.html_body ? 'email-html-error' : undefined}></textarea>
						{#if errors.html_body}<p id="email-html-error" class="text-xs text-error">{errors.html_body}</p>{/if}
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for="email-text">Plain-text version</label>
						<textarea id="email-text" class="textarea w-full text-sm" rows="7" bind:value={draft.textBody} aria-invalid={Boolean(errors.text_body)} aria-describedby={errors.text_body ? 'email-text-error' : undefined}></textarea>
						{#if errors.text_body}<p id="email-text-error" class="text-xs text-error">{errors.text_body}</p>{/if}
						<p class="text-xs text-base-content/60">Some vendors' email apps show this version. Keep it in step with the HTML.</p>
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for="email-note">What did you change? (optional)</label>
						<input id="email-note" class="input w-full" maxlength="300" bind:value={draft.note} placeholder="e.g. Friendlier opening" />
					</div>
				{:else}
					<EmailPreviewFrame subject={draft.subject} html={draft.htmlBody} text={draft.textBody} title="Preview of your edits" height="h-96" />
				{/if}

				{#if error}<p role="alert" class="text-sm text-error">{error}</p>{/if}
				<div class="modal-action mt-0">
					<button type="button" class="btn btn-sm" onclick={close} disabled={busy}>Close</button>
					<button type="submit" class="btn btn-sm btn-primary" disabled={busy || !changed}>
						{#if busy}<span class="loading loading-spinner loading-xs"></span>{/if}
						Save draft
					</button>
				</div>
			</form>
		{/if}
	</div>
</dialog>
