<script lang="ts">
	import EmailPreviewFrame from '#lib/components/EmailPreviewFrame.svelte';
	import EmailStatusBadge from '#lib/components/EmailStatusBadge.svelte';
	import {
		messageActions,
		messageContext,
		messageState,
		triggerDescription,
		type EmailMessageDetail,
		type EmailRevision,
		type MessageActionKey
	} from '#lib/emails.ts';
	import { formatDateTime } from '#lib/format.ts';

	type Props = {
		message: EmailMessageDetail;
		/** null while loading; revisions are only fetched for edited emails. */
		revisions: EmailRevision[] | null;
		revisionsError?: string;
		/** The action in progress, so buttons cannot be pressed twice. */
		busy?: MessageActionKey | null;
		onaction: (action: MessageActionKey) => void;
		onclose?: () => void;
	};
	let { message, revisions, revisionsError = '', busy = null, onaction, onclose }: Props = $props();

	const actions = $derived(messageActions(message));
	const summary = $derived(messageState(message, formatDateTime));
	const context = $derived(messageContext(message));
	const toneClass = { info: 'alert-info', warning: 'alert-warning', success: 'alert-success', error: 'alert-error', neutral: '' } as const;
	const labels: Record<MessageActionKey, string> = { edit: 'Edit draft', approve: 'Approve', cancel: 'Cancel email' };
	const styles: Record<MessageActionKey, string> = { edit: 'btn-outline', approve: 'btn-primary', cancel: 'btn-error btn-outline' };
	const from = $derived(message.senderEmail ? `${message.senderName} <${message.senderEmail}>` : message.senderName || 'Set when it is queued');

	const timestamps = $derived(
		[
			['Created', message.createdAt],
			['Scheduled for', message.scheduledFor],
			['Sent', message.sentAt],
			['Delivered', message.deliveredAt],
			['Last updated', message.updatedAt]
		].filter((entry): entry is [string, string] => Boolean(entry[1]))
	);
</script>

<article class="flex flex-col gap-3" aria-labelledby="email-detail-title">
	<header class="flex flex-wrap items-start justify-between gap-2">
		<div class="flex flex-col gap-1">
			<h3 id="email-detail-title" class="font-semibold">{message.subject || '(no subject)'}</h3>
			<div class="flex flex-wrap items-center gap-2 text-xs text-base-content/70">
				<EmailStatusBadge status={message.status} />
				<span>{message.templateName}</span>
				{#if context}<span>· {context}</span>{/if}
				{#if message.revision > 0}<span>· Edited {message.revision}×</span>{/if}
			</div>
		</div>
		{#if onclose}<button type="button" class="btn btn-ghost btn-xs" onclick={onclose}>Close</button>{/if}
	</header>

	<div role="status" class={['alert alert-soft text-sm', toneClass[summary.tone]]}>{summary.text}</div>

	{#if actions.length}
		<div class="flex flex-wrap gap-2" role="group" aria-label="Email actions">
			{#each actions as action (action)}
				<button type="button" class={['btn btn-sm', styles[action]]} disabled={busy !== null} onclick={() => onaction(action)}>
					{#if busy === action}<span class="loading loading-spinner loading-xs"></span>{/if}
					{labels[action]}
				</button>
			{/each}
		</div>
	{/if}
	{#if message.status === 'draft' && !message.permissions.canApprove && !message.noLongerApplies}
		<p class="text-xs text-base-content/70">An administrator, the assigned reviewer or the application's reviewer can approve or cancel this draft.</p>
	{/if}

	<dl class="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
		<dt class="text-xs font-semibold text-base-content/70">To</dt>
		<dd>{message.recipientName}{message.recipientEmail ? ` <${message.recipientEmail}>` : ''}</dd>
		{#if message.redirected}
			<dt class="text-xs font-semibold text-base-content/70">Went to</dt>
			<dd>{message.deliveredToEmail} <span class="text-xs text-base-content/70">(team test mailbox, not the vendor)</span></dd>
		{/if}
		<dt class="text-xs font-semibold text-base-content/70">From</dt>
		<dd>{from}</dd>
		<dt class="text-xs font-semibold text-base-content/70">Reply-to</dt>
		<dd>{message.replyToEmail || '—'}</dd>
		{#each timestamps as [label, iso] (label)}
			<dt class="text-xs font-semibold text-base-content/70">{label}</dt>
			<dd>{formatDateTime(iso)}</dd>
		{/each}
		<dt class="text-xs font-semibold text-base-content/70">Why</dt>
		<dd>{triggerDescription(message.templateKey, message.trigger, formatDateTime) || '—'}</dd>
		{#if message.createdBy}
			<dt class="text-xs font-semibold text-base-content/70">Prepared by</dt>
			<dd>{message.createdBy.name}</dd>
		{/if}
	</dl>

	{#if message.reviewTask}
		{@const task = message.reviewTask}
		<section class="rounded-lg bg-base-200/60 p-2 text-sm" aria-label="Review task">
			<p class="font-medium">{task.title}</p>
			<p class="text-xs text-base-content/70">
				{task.isOpen ? 'Open' : 'Closed'}{task.outcome ? ` · ${task.outcome}` : ''} · Reviewer: {task.owner?.name ?? 'Unassigned (team queue)'}{task.dueAt ? ` · Due ${formatDateTime(task.dueAt)}` : ''}
			</p>
		</section>
	{/if}

	{#if message.failureDetail || message.failureCode}
		<section class="text-sm" aria-label="Delivery problem">
			<p class="text-xs font-semibold text-base-content/70">{message.status === 'cancelled' ? 'Cancellation reason' : 'Delivery details'}</p>
			<p>{message.failureDetail || message.failureCode}{message.failureCode && message.failureDetail ? ` (${message.failureCode})` : ''}</p>
			{#if message.attemptCount > 0}<p class="text-xs text-base-content/70">{message.attemptCount} sending attempt{message.attemptCount === 1 ? '' : 's'}</p>{/if}
		</section>
	{/if}

	<EmailPreviewFrame html={message.htmlBody} text={message.textBody} title={`Preview of ${message.subject}`} />

	{#if message.provider}
		<p class="text-xs text-base-content/60">Provider: {message.provider}{message.providerMessageId ? ` · ${message.providerMessageId}` : ''}</p>
	{/if}

	{#if message.revision > 0}
		<section aria-labelledby="revisions-heading" class="flex flex-col gap-1">
			<h4 id="revisions-heading" class="text-xs font-semibold text-base-content/70">Earlier versions</h4>
			{#if revisionsError}
				<p role="alert" class="text-xs text-error">{revisionsError}</p>
			{:else if revisions === null}
				<p class="text-xs text-base-content/60" role="status">Loading earlier versions…</p>
			{:else}
				<ol class="flex flex-col gap-1">
					{#each [...revisions].reverse() as revision (revision.number)}
						<li>
							<details class="rounded-lg border border-base-200 px-2 py-1 text-sm">
								<summary class="cursor-pointer text-xs">
									Version {revision.number}{revision.number === 1 ? ' (original)' : ''}, replaced {formatDateTime(revision.createdAt)}{revision.replacedBy ? ` by ${revision.replacedBy.name}` : ''}{revision.note ? `: “${revision.note}”` : ''}
								</summary>
								<div class="mt-2">
									<EmailPreviewFrame subject={revision.subject} html={revision.htmlBody} text={revision.textBody} title={`Version ${revision.number}`} height="h-48" />
								</div>
							</details>
						</li>
					{/each}
				</ol>
			{/if}
		</section>
	{/if}
</article>
