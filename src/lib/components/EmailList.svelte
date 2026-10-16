<script lang="ts">
	import EmailStatusBadge from '#lib/components/EmailStatusBadge.svelte';
	import { messageContext, messageDate, type EmailMessage } from '#lib/emails.ts';
	import { formatDateTime } from '#lib/format.ts';

	type Props = {
		messages: readonly EmailMessage[];
		selectedId?: number | null;
		/** Link for a row; rows are links so they work with the keyboard and can be opened in a new tab. */
		href: (message: EmailMessage) => string;
		/** Show the vendor on each row (the message log); not needed inside an application. */
		showVendor?: boolean;
		empty?: string;
	};
	let { messages, selectedId = null, href, showVendor = false, empty = 'No emails have been prepared for this application yet.' }: Props = $props();
</script>

{#if messages.length === 0}
	<p class="rounded-lg border border-dashed border-base-300 p-6 text-center text-sm text-base-content/70">{empty}</p>
{:else}
	<ul class="flex flex-col divide-y divide-base-200 rounded-lg border border-base-200" aria-label="Emails">
		{#each messages as message (message.id)}
			{@const date = messageDate(message)}
			{@const context = messageContext(message)}
			<li>
				<a
					href={href(message)}
					class={['flex flex-col gap-1 px-3 py-2 text-sm hover:bg-base-200/60 focus-visible:bg-base-200/60', selectedId === message.id && 'bg-base-200']}
					aria-current={selectedId === message.id ? 'true' : undefined}
					data-sveltekit-reset="false"
				>
					<div class="flex flex-wrap items-center justify-between gap-2">
						<span class="font-medium">{message.subject || '(no subject)'}</span>
						<EmailStatusBadge status={message.status} />
					</div>
					<div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-base-content/70">
						<span>{message.templateName}</span>
						{#if showVendor && message.vendor}<span>{message.vendor.brandName}</span>{/if}
						<span>To {message.recipientEmail || message.recipientName || '—'}</span>
						{#if context}<span>{context}</span>{/if}
						<span>{date.label} {formatDateTime(date.iso)}</span>
						{#if message.status === 'draft'}
							<span>Reviewer: {message.reviewTask?.owner?.name ?? 'Unassigned'}</span>
						{/if}
						{#if message.revision > 0}<span>Edited {message.revision}×</span>{/if}
					</div>
					{#if message.noLongerApplies}
						<p class="text-xs text-warning-content"><span class="badge badge-xs badge-warning">No longer applies</span> {message.noLongerApplies}</p>
					{:else if message.redirected}
						<p class="text-xs text-base-content/70">Redirected to the team's test mailbox ({message.deliveredToEmail}).</p>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
{/if}
