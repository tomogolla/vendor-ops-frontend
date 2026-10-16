<script lang="ts">
	import { emailBuckets, emailsTabHref, messagesHref, type EmailBucket, type EmailOverview } from '#lib/emails.ts';
	import { formatDateTime } from '#lib/format.ts';

	type Props = {
		overview: EmailOverview;
		/** From the email settings: true when no vendor can receive email right now. */
		liveSendingBlocked?: boolean | null;
		/** How many recent events to list. */
		recent?: number;
	};
	let { overview, liveSendingBlocked = null, recent = 5 }: Props = $props();

	// Each message is counted once, by its current status: "Sent" includes the delivered ones.
	const cards: { bucket: EmailBucket; label: string; alert: boolean }[] = [
		{ bucket: 'awaiting_review', label: 'Awaiting review', alert: true },
		{ bucket: 'queued', label: 'Queued', alert: false },
		{ bucket: 'problems', label: 'Failed', alert: true },
		{ bucket: 'sent', label: 'Sent / delivered', alert: false }
	];
	const delivered = $derived(overview.byStatus.delivered ?? 0);
	const events = $derived(overview.recentActivity.slice(0, recent));
</script>

<div class="flex flex-col gap-2">
	{#if liveSendingBlocked}
		<p class="rounded-lg bg-base-200/60 px-2 py-1 text-[11px] text-base-content/70">Sending is off or redirected: vendors receive nothing right now.</p>
	{/if}
	<dl class="grid grid-cols-2 gap-2">
		{#each cards as card (card.bucket)}
			{@const count = overview.counts[card.bucket]}
			<div class={['rounded-lg p-2', card.alert && count > 0 ? (card.bucket === 'problems' ? 'bg-error/10' : 'bg-warning/20') : 'bg-base-200/60']}>
				<dt class="text-[11px] text-base-content/60">
					<a href={card.bucket === 'awaiting_review' ? '/tasks?view=emails' : messagesHref(card.bucket)} class="hover:underline">
						{card.label}<span class="sr-only">: {emailBuckets[card.bucket].hint}</span>
					</a>
				</dt>
				<dd class="text-lg font-semibold">{count}</dd>
				{#if card.bucket === 'sent' && count > 0}
					<dd class="text-[11px] text-base-content/60">{delivered} confirmed delivered</dd>
				{:else if card.bucket === 'problems' && count > 0}
					<dd class="text-[11px] text-base-content/60">Includes bounced and spam reports</dd>
				{:else if card.bucket === 'awaiting_review' && count > 0}
					<dd class="text-[11px]"><a href={messagesHref('awaiting_review')} class="link link-hover text-base-content/60">See the drafts</a></dd>
				{/if}
			</div>
		{/each}
	</dl>

	{#if events.length}
		<h3 class="text-[11px] font-semibold text-base-content/70">Recent email activity</h3>
		<ul class="flex flex-col gap-1">
			{#each events as event (event.id)}
				<li class="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
					{#if event.applicationId}
						<a href={emailsTabHref(event.applicationId, event.emailMessageId ? { email: event.emailMessageId } : {})} class="truncate hover:underline">
							{event.vendor.brandName}: {event.description}
						</a>
					{:else}
						<a href={`/vendors/${event.vendor.id}`} class="truncate hover:underline">{event.vendor.brandName}: {event.description}</a>
					{/if}
					<span class="whitespace-nowrap text-base-content/60">{event.actor} · {formatDateTime(event.createdAt)}</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-xs text-base-content/60">No email activity yet.</p>
	{/if}
</div>
