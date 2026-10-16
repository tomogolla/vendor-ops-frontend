<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { ApiError } from '#lib/api.ts';
	import type { PageProps } from './$types';
	import EmailPreviewFrame from '#lib/components/EmailPreviewFrame.svelte';
	import { listApplications, type Application } from '#lib/applications.ts';
	import {
		SETTINGS_EMAILS_HREF,
		getEmailSettings,
		getTemplate,
		hasChanges,
		insertVariable,
		isUnusedTemplate,
		modeChangeWarning,
		previewTemplate,
		templateChanges,
		templateDraft,
		templateModeHelp,
		templateModeLabels,
		unknownPlaceholders,
		updateTemplate,
		type EmailTemplate,
		type TemplateDraft,
		type TemplateMode,
		type TemplatePreview
	} from '#lib/emails.ts';
	import { formatDateTime } from '#lib/format.ts';
	import { Resource } from '#lib/resource.svelte.ts';
	import { session } from '#lib/session.svelte.ts';

	let { data }: PageProps = $props();

	const resource = new Resource<EmailTemplate>();
	let liveSendingBlocked = $state<boolean | null>(null);
	let original = $state<TemplateDraft | null>(null);
	let draft = $state<TemplateDraft>({ subjectTemplate: '', htmlTemplate: '', textTemplate: '', mode: 'off', allowedVariables: [] });
	let busy = $state(false);
	let errors = $state<Record<string, string>>({});
	let error = $state('');
	let saved = $state('');

	$effect(() => {
		const key = data.key;
		resource.load(() => getTemplate(key)).then(() => {
			if (resource.data?.key === key) reset(resource.data);
		});
	});
	$effect(() => {
		getEmailSettings()
			.then((settings) => (liveSendingBlocked = settings.liveSendingBlocked))
			.catch(() => (liveSendingBlocked = null));
	});

	function reset(template: EmailTemplate) {
		original = templateDraft(template);
		draft = templateDraft(template);
		errors = {};
	}

	const template = $derived(resource.data?.key === data.key ? resource.data : undefined);
	const canEdit = $derived(session.isAdmin);
	const changes = $derived(original ? templateChanges(original, draft) : {});
	const dirty = $derived(hasChanges(changes));
	const unknown = $derived(unknownPlaceholders([draft.subjectTemplate, draft.htmlTemplate, draft.textTemplate], draft.allowedVariables));
	const autoWarning = $derived(original ? modeChangeWarning(original.mode, draft.mode, liveSendingBlocked) : null);
	const modes: TemplateMode[] = ['off', 'draft', 'auto'];

	// --- Unsaved changes ---------------------------------------------------------------------------
	beforeNavigate((navigation) => {
		if (dirty && !busy && !confirm('You have unsaved changes to this template. Leave without saving?')) navigation.cancel();
	});
	$effect(() => {
		if (!dirty) return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	});

	// --- Variables -----------------------------------------------------------------------------------
	type Part = 'subjectTemplate' | 'htmlTemplate' | 'textTemplate';
	let lastPart = $state<Part>('htmlTemplate');
	const fields: Partial<Record<Part, HTMLInputElement | HTMLTextAreaElement>> = {};

	function insert(name: string) {
		const field = fields[lastPart];
		const value = draft[lastPart];
		const { text, cursor } = insertVariable(value, field?.selectionStart ?? value.length, field?.selectionEnd ?? value.length, name);
		draft[lastPart] = text;
		requestAnimationFrame(() => {
			field?.focus();
			field?.setSelectionRange(cursor, cursor);
		});
	}

	function toggleAllowed(name: string, allowed: boolean) {
		draft.allowedVariables = allowed ? [...draft.allowedVariables, name] : draft.allowedVariables.filter((item) => item !== name);
	}

	// --- Preview ---------------------------------------------------------------------------------------
	let previewSource = $state<'sample' | 'application'>('sample');
	const applications = new Resource<Application[]>();
	let applicationId = $state('');
	let lineId = $state('');
	let preview = $state<TemplatePreview | null>(null);
	let previewError = $state('');
	let previewing = $state(false);
	const chosenApplication = $derived(applications.data?.find((item) => item.id === applicationId));

	function chooseSource(source: 'sample' | 'application') {
		previewSource = source;
		if (source === 'application' && !applications.loaded && !applications.loading) {
			applications.load(() => listApplications({ ordering: '-submitted_at', page_size: 50 }).then((page) => page.results));
		}
	}

	/** Renders the unsaved edits; nothing is saved and no email is created. */
	async function runPreview() {
		if (!template || previewing) return;
		previewing = true;
		previewError = '';
		try {
			const source = previewSource === 'application' ? { applicationId: applicationId || null, applicationLineId: lineId || null } : {};
			preview = await previewTemplate(template.key, source, {
				subjectTemplate: draft.subjectTemplate,
				htmlTemplate: draft.htmlTemplate,
				textTemplate: draft.textTemplate,
				allowedVariables: draft.allowedVariables
			});
		} catch (err) {
			preview = null;
			const fieldErrors = err instanceof ApiError ? err.fieldErrors : {};
			previewError = Object.values(fieldErrors).join(' ') || (err instanceof Error ? err.message : 'The preview could not load.');
		} finally {
			previewing = false;
		}
	}

	// --- Save ----------------------------------------------------------------------------------------
	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (!template || !canEdit || busy || !dirty) return;
		if (autoWarning && !confirm(`Switch “${template.name}” to Auto?\n\n${autoWarning}`)) return;
		busy = true;
		errors = {};
		error = '';
		saved = '';
		try {
			const result = await updateTemplate(template.key, changes);
			resource.data = result;
			reset(result);
			saved = `Saved. Mode: ${templateModeLabels[result.mode]}.`;
		} catch (err) {
			// The edits stay in the form; the server says which part is wrong.
			errors = err instanceof ApiError ? err.fieldErrors : {};
			error = Object.keys(errors).length ? 'The template was not saved. Fix the highlighted parts.' : err instanceof Error ? err.message : 'The template could not be saved.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>{template?.name ?? 'Email template'} · Vendor Ops</title></svelte:head>

<div class="flex flex-col gap-3">
	<a href={`${SETTINGS_EMAILS_HREF}?tab=templates`} class="btn btn-ghost btn-sm w-fit">← Templates</a>

	{#if template && original}
		<form class="grid grid-cols-1 gap-3 xl:grid-cols-5" onsubmit={save} novalidate>
			<div class="card bg-base-100 border border-base-200 shadow-sm xl:col-span-3">
				<div class="card-body gap-3 p-4">
					<header>
						<h1 class="text-lg font-bold">{template.name}</h1>
						<p class="text-sm text-base-content/70">{template.description}</p>
						<p class="text-xs text-base-content/60">
							<span class="capitalize">{template.category}</span> · Last updated {formatDateTime(template.updatedAt)}{template.updatedBy ? ` by ${template.updatedBy.name}` : ''}
							{#if isUnusedTemplate(template.key)} · No workflow prepares this email yet{/if}
						</p>
					</header>
					{#if !canEdit}<p role="status" class="alert alert-info alert-soft text-sm">Only administrators can change templates. You can preview it.</p>{/if}

					<fieldset class="flex flex-col gap-1" disabled={!canEdit}>
						<legend class="mb-1 text-sm font-medium">Mode</legend>
						<div class="flex flex-wrap gap-3">
							{#each modes as mode (mode)}
								<label class="flex cursor-pointer items-center gap-2 text-sm">
									<input type="radio" class="radio radio-sm" name="template-mode" value={mode} bind:group={draft.mode} />
									{templateModeLabels[mode]}
								</label>
							{/each}
						</div>
						<p class="text-xs text-base-content/70">{templateModeHelp[draft.mode]}</p>
						{#if autoWarning}<p role="alert" class="alert alert-warning alert-soft text-xs">{autoWarning}</p>{/if}
						{#if errors.mode}<p class="text-xs text-error">{errors.mode}</p>{/if}
					</fieldset>

					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for="template-subject">Subject</label>
						<input id="template-subject" class="input w-full" maxlength="255" readonly={!canEdit} bind:value={draft.subjectTemplate} bind:this={fields.subjectTemplate} onfocus={() => (lastPart = 'subjectTemplate')} aria-invalid={Boolean(errors.subject_template)} />
						{#if errors.subject_template}<p class="text-xs text-error">{errors.subject_template}</p>{/if}
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for="template-html">Email body (HTML)</label>
						<textarea id="template-html" class="textarea w-full font-mono text-xs" rows="10" readonly={!canEdit} bind:value={draft.htmlTemplate} bind:this={fields.htmlTemplate} onfocus={() => (lastPart = 'htmlTemplate')} aria-invalid={Boolean(errors.html_template)}></textarea>
						{#if errors.html_template}<p class="text-xs text-error">{errors.html_template}</p>{/if}
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for="template-text">Plain-text version</label>
						<textarea id="template-text" class="textarea w-full text-sm" rows="8" readonly={!canEdit} bind:value={draft.textTemplate} bind:this={fields.textTemplate} onfocus={() => (lastPart = 'textTemplate')} aria-invalid={Boolean(errors.text_template)}></textarea>
						{#if errors.text_template}<p class="text-xs text-error">{errors.text_template}</p>{/if}
					</div>
					{#if unknown.length}
						<p role="status" class="text-xs text-warning-content">
							Not allowed for this template yet: {unknown.map((name) => `{${name}}`).join(', ')}. Allow them on the right, or the server will refuse to save.
						</p>
					{/if}
					{#if errors.allowed_variables}<p class="text-xs text-error">{errors.allowed_variables}</p>{/if}
					{#if error}<p role="alert" class="text-sm text-error">{error}</p>{/if}
					{#if saved}<p role="status" class="text-sm text-success">{saved}</p>{/if}
					{#if canEdit}
						<div class="flex flex-wrap gap-2">
							<button type="button" class="btn btn-sm" disabled={!dirty || busy} onclick={() => template && reset(template)}>Discard changes</button>
							<button type="submit" class="btn btn-sm btn-primary" disabled={!dirty || busy}>
								{#if busy}<span class="loading loading-spinner loading-xs"></span>{/if}
								Save template
							</button>
							{#if dirty}<span class="self-center text-xs text-base-content/60">Unsaved changes</span>{/if}
						</div>
					{/if}
				</div>
			</div>

			<div class="flex flex-col gap-3 xl:col-span-2">
				<section class="card bg-base-100 border border-base-200 shadow-sm" aria-labelledby="variables-heading">
					<div class="card-body gap-2 p-4">
						<h2 id="variables-heading" class="text-sm font-semibold">Variables</h2>
						<p class="text-xs text-base-content/70">
							Click Insert to add a variable where the cursor is{canEdit ? ` (in the ${lastPart === 'subjectTemplate' ? 'subject' : lastPart === 'htmlTemplate' ? 'HTML body' : 'plain-text version'})` : ''}. Write {'{{'} and {'}}'} for literal braces.
						</p>
						<ul class="flex flex-col gap-1">
							{#each Object.entries(template.availableVariables) as [name, description] (name)}
								{@const allowed = draft.allowedVariables.includes(name)}
								<li class="flex items-start justify-between gap-2 rounded-lg bg-base-200/50 p-2 text-xs">
									<div>
										<code class="font-semibold">{`{${name}}`}</code>
										<p class="text-base-content/70">{description}</p>
										{#if canEdit}
											<label class="mt-1 flex items-center gap-1">
												<input type="checkbox" class="checkbox checkbox-xs" checked={allowed} onchange={(event) => toggleAllowed(name, event.currentTarget.checked)} />
												Allowed in this template
											</label>
										{:else if !allowed}
											<p class="text-base-content/50">Not used by this template.</p>
										{/if}
									</div>
									{#if canEdit}
										<button type="button" class="btn btn-xs" disabled={!allowed} title={allowed ? undefined : 'Allow it first'} onclick={() => insert(name)}>Insert<span class="sr-only">{` ${name}`}</span></button>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				</section>

				<section class="card bg-base-100 border border-base-200 shadow-sm" aria-labelledby="preview-heading">
					<div class="card-body gap-2 p-4">
						<h2 id="preview-heading" class="text-sm font-semibold">Preview</h2>
						<p class="text-xs text-base-content/70">Shows your current edits. Nothing is saved and no email is created.</p>
						<div class="flex flex-wrap gap-3 text-sm" role="radiogroup" aria-label="Preview data">
							<label class="flex items-center gap-1"><input type="radio" class="radio radio-xs" name="preview-source" checked={previewSource === 'sample'} onchange={() => chooseSource('sample')} /> Sample data</label>
							<label class="flex items-center gap-1"><input type="radio" class="radio radio-xs" name="preview-source" checked={previewSource === 'application'} onchange={() => chooseSource('application')} /> A real application</label>
						</div>
						{#if previewSource === 'application'}
							{#if applications.error}
								<p role="alert" class="text-xs text-error">{applications.error.message}</p>
							{:else if !applications.data}
								<p class="text-xs text-base-content/60" role="status">Loading recent applications…</p>
							{:else}
								<label class="flex flex-col gap-0.5 text-xs">
									<span class="font-semibold text-base-content/70">Application (50 most recent)</span>
									<select class="select select-sm w-full" bind:value={applicationId} onchange={() => (lineId = '')}>
										<option value="">Choose an application</option>
										{#each applications.data as item (item.id)}<option value={item.id}>{item.vendorBrand} · {formatDateTime(item.submittedAt)}</option>{/each}
									</select>
								</label>
								{#if chosenApplication?.lines.length}
									<label class="flex flex-col gap-0.5 text-xs">
										<span class="font-semibold text-base-content/70">Booth (for booth and market details)</span>
										<select class="select select-sm w-full" bind:value={lineId}>
											<option value="">None</option>
											{#each chosenApplication.lines as line (line.id)}<option value={line.id}>{line.productName} · {line.weekend.label}</option>{/each}
										</select>
									</label>
								{/if}
							{/if}
						{/if}
						<div>
							<button type="button" class="btn btn-sm btn-outline" onclick={runPreview} disabled={previewing || (previewSource === 'application' && !applicationId)}>
								{#if previewing}<span class="loading loading-spinner loading-xs"></span>{/if}
								{preview ? 'Refresh preview' : 'Show preview'}
							</button>
						</div>
						{#if previewError}
							<p role="alert" class="text-xs text-error">{previewError}</p>
						{:else if preview}
							<p class="text-xs text-base-content/60">{preview.dataSource === 'sample' ? 'Using sample data.' : `Using ${chosenApplication?.vendorBrand ?? 'the application'}'s data.`}</p>
							{#if preview.missingVariables.length}
								<p role="status" class="alert alert-warning alert-soft text-xs">
									No value for {preview.missingVariables.join(', ')}; shown as [name]. A real email would not be created like this{previewSource === 'application' ? ' (choose a booth if the template needs one)' : ''}.
								</p>
							{/if}
							<EmailPreviewFrame subject={preview.subject} html={preview.htmlBody} text={preview.textBody} title="Template preview" />
						{/if}
					</div>
				</section>
			</div>
		</form>
	{:else if resource.notFound}
		<div class="card bg-base-100 max-w-xl border border-base-200 shadow-sm">
			<div class="card-body items-start">
				<h1 class="card-title">Template not found</h1>
				<p class="text-sm text-base-content/70">There is no email template called “{data.key}”.</p>
				<a href={`${SETTINGS_EMAILS_HREF}?tab=templates`} class="btn btn-primary btn-sm">Back to templates</a>
			</div>
		</div>
	{:else if resource.error}
		<div role="alert" class="alert alert-error alert-soft flex flex-wrap justify-between text-sm">
			<span>{resource.error.message}</span>
			<button type="button" class="btn btn-sm" onclick={resource.retry}>Retry</button>
		</div>
	{:else}
		<p class="flex items-center gap-2 p-4 text-sm text-base-content/60" role="status"><span class="loading loading-spinner loading-sm"></span> Loading template…</p>
	{/if}
</div>
