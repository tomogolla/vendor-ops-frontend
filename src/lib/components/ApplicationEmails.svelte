<script lang="ts">
	import type { Page } from '#lib/api.ts';
	import type { ApplicationLine } from '#lib/applications.ts';
	import AsyncState from '#lib/components/AsyncState.svelte';
	import EmailDecisionDialog from '#lib/components/EmailDecisionDialog.svelte';
	import EmailDetailPanel from '#lib/components/EmailDetailPanel.svelte';
	import EmailEditDialog from '#lib/components/EmailEditDialog.svelte';
	import EmailList from '#lib/components/EmailList.svelte';
	import NewEmailDialog from '#lib/components/NewEmailDialog.svelte';
	import {
		EMAIL_BUCKETS,
		emailBuckets,
		emailsTabHref,
		getEmailSettings,
		getMessage,
		listApplicationEmails,
		listRevisions,
		listTemplates,
		messageForTask,
		messageOrderingLabels,
		preparableTemplates,
		toTimeInput,
		type EmailBucket,
		type EmailMessage,
		type EmailMessageDetail,
		type EmailRevision,
		type EmailSettings,
		type EmailTemplate,
		type MessageActionKey,
		type MessageOrdering
	} from '#lib/emails.ts';
	import { formatDateTime } from '#lib/format.ts';
	import { Resource } from '#lib/resource.svelte.ts';

	type Props = {
		applicationId: string;
		lines: readonly ApplicationLine[];
		/** The email open in the detail panel (from the URL). */
		selectedId: number | null;
		/** A review task id (from the URL): opens that task's email. */
		taskId: string | null;
		/** Changes the URL; null closes the detail panel. */
		onselect: (id: number | null) => void;
		/** Called after an email changed, so the page can refresh its timeline and tasks. */
		onchanged?: () => void;
		/** Reports the number of emails awaiting review, for the tab label. */
		oncount?: (awaitingReview: number) => void;
	};
	let { applicationId, lines, selectedId, taskId, onselect, onchanged, oncount }: Props = $props();

	const messages = new Resource<Page<EmailMessage>>();
	const templates = new Resource<EmailTemplate[]>();
	const settings = new Resource<EmailSettings>();
	const detail = new Resource<EmailMessageDetail>();
	let revisions = $state<EmailRevision[] | null>(null);
	let revisionsError = $state('');
	let bucket = $state<EmailBucket | ''>('');
	let template = $state('');
	let ordering = $state<MessageOrdering>('-created_at');
	let notice = $state('');
	let taskNotice = $state('');

	let editDialog: EmailEditDialog | undefined = $state();
	let decisionDialog: EmailDecisionDialog | undefined = $state();
	let newDialog: NewEmailDialog | undefined = $state();

	function loadMessages() {
		const query = { bucket: bucket || undefined, template: template || undefined, ordering, pageSize: 100 };
		messages.load(() => listApplicationEmails(applicationId, query));
	}
	$effect(loadMessages);
	$effect(() => {
		templates.load(listTemplates);
		settings.load(getEmailSettings);
	});

	$effect(() => {
		const page = messages.data;
		if (page && !bucket && !template) oncount?.(page.results.filter((message) => message.status === 'draft').length);
	});

	// A review task link: open the email whose review task it is.
	let resolvedTask = '';
	$effect(() => {
		const page = messages.data;
		if (!taskId || !page || taskId === resolvedTask || bucket || template) return;
		resolvedTask = taskId;
		const match = messageForTask(page.results, taskId);
		taskNotice = match ? '' : 'The email for this review task was not found on this application. It may have been removed from the list by a filter.';
		if (match) onselect(match.id);
	});

	function loadRevisions(message: EmailMessageDetail) {
		revisions = null;
		revisionsError = '';
		if (message.revision === 0) return;
		listRevisions(message.id)
			.then((result) => (revisions = result))
			.catch((error) => (revisionsError = error instanceof Error ? error.message : 'Earlier versions could not load.'));
	}

	let loadedDetailId: number | null = null;
	$effect(() => {
		const id = selectedId;
		if (id === null || id === loadedDetailId) return;
		loadedDetailId = id;
		revisions = null;
		detail.load(() => getMessage(id)).then(() => {
			if (detail.data?.id === id) loadRevisions(detail.data);
		});
	});
	const open = $derived(selectedId !== null && detail.data?.id === selectedId ? detail.data : undefined);

	const preparable = $derived(templates.data ? preparableTemplates(templates.data) : []);
	const sendWindow = $derived(
		settings.data ? `${toTimeInput(settings.data.sendWindowStart)}–${toTimeInput(settings.data.sendWindowEnd)} ${settings.data.businessTimezone}` : ''
	);

	/** After an edit, approval, cancellation or a new draft: show it, and refresh what depends on it. */
	function changed(message: EmailMessageDetail, text: string) {
		detail.data = message;
		loadedDetailId = message.id;
		loadRevisions(message);
		notice = text;
		loadMessages();
		onchanged?.();
		if (selectedId !== message.id) onselect(message.id);
	}

	function act(action: MessageActionKey) {
		if (!open) return;
		notice = '';
		if (action === 'edit') editDialog?.open(open);
		else decisionDialog?.open(open, action);
	}

	const scheduled = (message: EmailMessageDetail) => (message.scheduledFor ? ` from ${formatDateTime(message.scheduledFor)}` : '');
</script>

<section class="flex flex-col gap-3" aria-labelledby="emails-heading">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h2 id="emails-heading" class="text-base font-semibold">Emails</h2>
			<p class="text-xs text-base-content/70">Every email prepared for this application. Django sends approved emails in the send window.</p>
		</div>
		{#if preparable.length}
			<button type="button" class="btn btn-sm btn-primary" onclick={() => { notice = ''; newDialog?.open(); }}>New email</button>
		{/if}
	</div>

	{#if notice}
		<div role="status" class="alert alert-success alert-soft flex justify-between text-sm">
			<span>{notice}</span>
			<button type="button" class="btn btn-ghost btn-xs" onclick={() => (notice = '')} aria-label="Dismiss">✕</button>
		</div>
	{/if}
	{#if taskNotice}<p role="status" class="alert alert-warning alert-soft text-sm">{taskNotice}</p>{/if}
	{#if settings.data?.liveSendingBlocked}
		<p class="text-xs text-base-content/70">
			Vendors do not receive email right now ({settings.data.effective.mode === 'redirect' ? "emails go to the team's test mailbox" : 'sending is off'}).
		</p>
	{/if}

	<div class="flex flex-wrap items-end gap-2" role="group" aria-label="Filter emails">
		<label class="flex flex-col gap-0.5 text-xs">
			<span class="font-semibold text-base-content/70">Status</span>
			<select class="select select-sm" bind:value={bucket}>
				<option value="">All</option>
				{#each EMAIL_BUCKETS as key (key)}<option value={key}>{emailBuckets[key].label}</option>{/each}
			</select>
		</label>
		<label class="flex flex-col gap-0.5 text-xs">
			<span class="font-semibold text-base-content/70">Template</span>
			<select class="select select-sm" bind:value={template}>
				<option value="">All</option>
				{#each templates.data ?? [] as item (item.key)}<option value={item.key}>{item.name}</option>{/each}
			</select>
		</label>
		<label class="flex flex-col gap-0.5 text-xs">
			<span class="font-semibold text-base-content/70">Sort</span>
			<select class="select select-sm" bind:value={ordering}>
				{#each Object.entries(messageOrderingLabels) as [value, label] (value)}<option {value}>{label}</option>{/each}
			</select>
		</label>
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
		<div class={['lg:col-span-2', selectedId !== null && 'hidden lg:block']}>
			<AsyncState resource={messages} label="Loading emails…">
				{#snippet children(page)}
					<EmailList
						messages={page.results}
						{selectedId}
						href={(message) => emailsTabHref(applicationId, { email: message.id })}
						empty={bucket || template ? 'No emails match these filters.' : 'No emails have been prepared for this application yet.'}
					/>
					{#if page.count > page.results.length}
						<p class="mt-1 text-xs text-base-content/60">Showing the {page.results.length} most recent of {page.count}.</p>
					{/if}
				{/snippet}
			</AsyncState>
		</div>

		<div class="lg:col-span-3">
			{#if selectedId === null}
				<p class="hidden rounded-lg border border-dashed border-base-300 p-6 text-center text-sm text-base-content/60 lg:block">Choose an email to see it here.</p>
			{:else if open}
				<div class={['rounded-lg border border-base-200 p-3 transition-opacity', detail.loading && 'opacity-60']}>
					<EmailDetailPanel message={open} {revisions} {revisionsError} onaction={act} onclose={() => onselect(null)} />
				</div>
			{:else if detail.notFound}
				<p role="alert" class="text-sm text-error">That email was not found. <button type="button" class="link" onclick={() => onselect(null)}>Back to the list</button></p>
			{:else if detail.error}
				<div role="alert" class="alert alert-error alert-soft flex flex-wrap justify-between text-sm">
					<span>{detail.error.message}</span>
					<button type="button" class="btn btn-sm" onclick={detail.retry}>Retry</button>
				</div>
			{:else}
				<p class="flex items-center gap-2 p-4 text-sm text-base-content/60" role="status"><span class="loading loading-spinner loading-sm"></span> Loading email…</p>
			{/if}
		</div>
	</div>
</section>

<EmailEditDialog bind:this={editDialog} onsaved={(message) => changed(message, `Draft saved (version ${message.revision + 1}). The earlier version is in the history.`)} />
<EmailDecisionDialog
	bind:this={decisionDialog}
	liveSendingBlocked={settings.data?.liveSendingBlocked ?? null}
	{sendWindow}
	ondone={(message, decision) =>
		changed(message, decision === 'approve' ? `Approved. The email is in the sending queue${scheduled(message)}, and its review task is complete.` : 'Email cancelled. It will not be sent, and its review task is closed.')}
/>
<NewEmailDialog
	bind:this={newDialog}
	{applicationId}
	{lines}
	templates={preparable}
	oncreated={(message) => changed(message, `Draft prepared: ${message.templateName}. It is waiting for review.`)}
	onopen={(id) => onselect(id)}
/>
