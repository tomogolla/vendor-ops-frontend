<script lang="ts">
	import EmailPreviewFrame from '#lib/components/EmailPreviewFrame.svelte';
	import { lineStatusLabels, type ApplicationLine } from '#lib/applications.ts';
	import {
		PrepareDraftError,
		prepareDraft,
		previewTemplate,
		templateNeedsLine,
		templateModeLabels,
		type EmailMessageDetail,
		type EmailTemplate,
		type TemplatePreview
	} from '#lib/emails.ts';

	type Props = {
		applicationId: string;
		lines: readonly ApplicationLine[];
		/** Templates that can be prepared by hand (preparableTemplates). */
		templates: readonly EmailTemplate[];
		oncreated: (message: EmailMessageDetail) => void;
		/** Opens an email that already exists (the duplicate draft the server pointed to). */
		onopen: (id: number) => void;
	};
	let { applicationId, lines, templates, oncreated, onopen }: Props = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let templateKey = $state('');
	let lineId = $state('');
	let preview = $state<TemplatePreview | null>(null);
	let previewError = $state('');
	let previewing = $state(false);
	let busy = $state(false);
	let error = $state('');
	let existingId = $state<number | null>(null);
	let run = 0;

	// Booth lines only (add-ons have no waitlist email); waitlisted ones first.
	const boothLines = $derived(
		lines.filter((line) => line.kind === 'booth').sort((a, b) => Number(b.status === 'WAITLISTED') - Number(a.status === 'WAITLISTED'))
	);
	const template = $derived(templates.find((item) => item.key === templateKey));
	const needsLine = $derived(templateNeedsLine(template));

	export function open() {
		templateKey = '';
		lineId = '';
		preview = null;
		previewError = '';
		error = '';
		existingId = null;
		dialog?.showModal();
	}

	/** Renders the template with this application's data; nothing is saved or created. */
	async function loadPreview() {
		const current = ++run;
		preview = null;
		previewError = '';
		error = '';
		existingId = null;
		if (!templateKey || (needsLine && !lineId)) return;
		previewing = true;
		try {
			const result = await previewTemplate(templateKey, { applicationId, applicationLineId: needsLine ? lineId : null });
			if (current === run) preview = result;
		} catch (err) {
			if (current === run) previewError = err instanceof Error ? err.message : 'The preview could not load.';
		} finally {
			if (current === run) previewing = false;
		}
	}

	function chooseTemplate(key: string) {
		templateKey = key;
		if (templateNeedsLine(templates.find((item) => item.key === key)) && !lineId) {
			lineId = boothLines.find((line) => line.status === 'WAITLISTED')?.id ?? boothLines[0]?.id ?? '';
		}
		loadPreview();
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!templateKey || busy) return;
		if (needsLine && !lineId) {
			error = 'Choose the booth this email is about.';
			return;
		}
		busy = true;
		error = '';
		existingId = null;
		try {
			const created = await prepareDraft(applicationId, templateKey, needsLine ? lineId : null);
			dialog?.close();
			oncreated(created);
		} catch (err) {
			// The server's reason: a duplicate draft, a missing booth, an unusable address, or "does not apply".
			error = err instanceof Error ? err.message : 'The email could not be prepared.';
			existingId = err instanceof PrepareDraftError ? err.existingMessageId : null;
		} finally {
			busy = false;
		}
	}
</script>

<dialog bind:this={dialog} class="modal" aria-labelledby="new-email-title">
	<div class="modal-box flex max-w-2xl flex-col gap-3">
		<form class="flex flex-col gap-3" onsubmit={submit}>
			<h3 id="new-email-title" class="text-base font-bold">New email</h3>
			<p class="text-xs text-base-content/70">
				This prepares a draft for review; nothing is sent until someone approves it. The usual rules still apply: one draft of each email at a time, and only when it fits the application.
			</p>

			<fieldset class="flex flex-col gap-1">
				<legend class="mb-1 text-sm font-medium">Template</legend>
				{#each templates as item (item.key)}
					<label class="flex cursor-pointer items-start gap-2 rounded-lg border border-base-200 p-2 text-sm has-[:checked]:border-primary">
						<input type="radio" class="radio radio-sm mt-0.5" name="new-email-template" value={item.key} checked={templateKey === item.key} onchange={() => chooseTemplate(item.key)} />
						<span>
							<span class="font-medium">{item.name}</span>
							<span class="badge badge-xs badge-ghost ml-1">{templateModeLabels[item.mode]}</span>
							<span class="block text-xs text-base-content/70">{item.description}</span>
						</span>
					</label>
				{:else}
					<p class="text-sm text-base-content/70">No email templates are available.</p>
				{/each}
			</fieldset>

			{#if needsLine}
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium" for="new-email-line">Booth</label>
					{#if boothLines.length}
						<select id="new-email-line" class="select w-full" bind:value={lineId} onchange={loadPreview}>
							<option value="" disabled>Choose a booth</option>
							{#each boothLines as line (line.id)}
								<option value={line.id}>{line.productName} · {line.weekend.label} ({lineStatusLabels[line.status]})</option>
							{/each}
						</select>
					{:else}
						<p class="text-sm text-base-content/70">This application has no booth lines.</p>
					{/if}
				</div>
			{/if}

			{#if template}
				<section class="flex flex-col gap-2" aria-label="Preview" aria-busy={previewing}>
					{#if previewing}
						<p class="text-xs text-base-content/60" role="status">Loading preview…</p>
					{:else if previewError}
						<p role="alert" class="text-xs text-error">{previewError}</p>
					{:else if preview}
						{#if preview.missingVariables.length}
							<p role="status" class="alert alert-warning alert-soft text-xs">
								This application cannot fill in {preview.missingVariables.join(', ')}{needsLine ? '; choose a booth' : ''}. The email cannot be prepared like this.
							</p>
						{/if}
						<EmailPreviewFrame subject={preview.subject} html={preview.htmlBody} text={preview.textBody} title={`Preview of ${template.name}`} height="h-64" />
						<p class="text-xs text-base-content/60">Uses: {template.allowedVariables.map((name) => `{${name}}`).join(', ') || 'no variables'}</p>
					{/if}
				</section>
			{/if}

			{#if error}
				<div role="alert" class="flex flex-wrap items-center gap-2 text-sm text-error">
					<span>{error}</span>
					{#if existingId !== null}
						{@const id = existingId}
						<button type="button" class="btn btn-xs" onclick={() => { dialog?.close(); onopen(id); }}>Open the existing draft</button>
					{/if}
				</div>
			{/if}
			<div class="modal-action mt-0">
				<button type="button" class="btn btn-sm" onclick={() => dialog?.close()} disabled={busy}>Close</button>
				<button type="submit" class="btn btn-sm btn-primary" disabled={busy || !templateKey || (needsLine && !lineId)}>
					{#if busy}<span class="loading loading-spinner loading-xs"></span>{/if}
					Prepare draft
				</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop"><button aria-label="Close" disabled={busy}>close</button></form>
</dialog>
