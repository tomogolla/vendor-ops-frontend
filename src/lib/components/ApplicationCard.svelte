<script lang="ts">
	import { daysInStage, isIncompleteApplication, type Application } from '#lib/applications.ts';
	import { formatDateTime, formatMoney } from '#lib/format.ts';

	let { application }: { application: Application } = $props();

	const days = $derived(daysInStage(application));
	const overdue = $derived(application.nextTaskDueAt !== null && new Date(application.nextTaskDueAt).getTime() < Date.now());
</script>

<article class="rounded-lg border border-base-200 bg-base-100 p-3 shadow-sm">
	<div class="flex items-start justify-between gap-2">
		<a href={`/applications/${application.id}`} class="font-semibold text-sm hover:underline">{application.vendorBrand}</a>
		{#if application.totals.confirmedTotalCents}
			<span class="text-xs text-base-content/70" title="Confirmed total">
				{formatMoney(application.totals.confirmedTotalCents, application.totals.currency)}
			</span>
		{/if}
	</div>
	<p class="text-xs text-base-content/70">{application.category || 'No category'} · {application.source || 'Unknown source'}</p>
	<dl class="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-base-content/70">
		<div>
			<dt class="sr-only">Days in stage</dt>
			<dd>{days === null ? '—' : days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'}`} in stage</dd>
		</div>
		<div>
			<dt class="sr-only">Call attempts</dt>
			<dd>{application.callAttempts} call attempt{application.callAttempts === 1 ? '' : 's'}</dd>
		</div>
		<div class="col-span-2">
			<dt class="sr-only">Next task due</dt>
			<dd class={[overdue && 'font-semibold text-error']}>
				{application.nextTaskDueAt ? `Next task ${formatDateTime(application.nextTaskDueAt)}${overdue ? ' (overdue)' : ''}` : 'No open task'}
			</dd>
		</div>
	</dl>
	{#if application.hasWaitlistedLines || application.callExhausted || isIncompleteApplication(application)}
		<div class="mt-2 flex flex-wrap gap-1">
			{#if application.hasWaitlistedLines}<span class="badge badge-xs badge-secondary badge-outline">Waitlisted line</span>{/if}
			{#if application.callExhausted}<span class="badge badge-xs badge-error badge-outline">Call exhausted</span>{/if}
			{#if isIncompleteApplication(application)}<span class="badge badge-xs badge-warning">Incomplete details</span>{/if}
		</div>
	{/if}
</article>
