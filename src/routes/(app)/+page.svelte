<script lang="ts">
	import { BOARD_STAGES, countApplications, getSummary, stageLabels, type ApplicationSummary } from '#lib/applications.ts';
	import { capacityAlerts, listWeekends, type CapacityAlert } from '#lib/catalog.ts';
	import EmailOverviewCard from '#lib/components/EmailOverviewCard.svelte';
	import QuickActions from '#lib/components/QuickActions.svelte';
	import { SETTINGS_EMAILS_HREF, getEmailOverview, getEmailSettings, type EmailOverview } from '#lib/emails.ts';
	import { formatDateTime } from '#lib/format.ts';
	import { countTasks, listTasks, type Task } from '#lib/vendor-store.ts';

	type CallCounts = { open: number; overdue: number; mine: number; next: Task[] };
	let calls = $state<CallCounts | null>(null);
	let callsError = $state('');
	let summary = $state<ApplicationSummary | null>(null);
	let summaryError = $state('');
	let imported = $state<number | null>(null);
	let alerts = $state<CapacityAlert[] | null>(null);
	let alertsError = $state('');

	const message = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

	function loadCalls() {
		callsError = '';
		const base = { task_type: 'DISCOVERY_CALL', is_open: true };
		Promise.all([
			countTasks(base),
			countTasks({ ...base, due_before: new Date().toISOString() }),
			countTasks({ ...base, owner: 'me' }),
			listTasks({ ...base, ordering: 'due_at', page_size: 5 })
		])
			.then(([open, overdue, mine, next]) => (calls = { open, overdue, mine, next: next.results }))
			.catch((error) => (callsError = message(error, 'Could not load calls.')));
	}

	function loadPipeline() {
		summaryError = '';
		getSummary()
			.then((result) => (summary = result))
			.catch((error) => (summaryError = message(error, 'Could not load the pipeline.')));
		countApplications({ stage: 'NEW', source: 'CSV import' })
			.then((count) => (imported = count))
			.catch(() => (imported = null));
	}

	function loadCapacity() {
		alertsError = '';
		listWeekends({ page_size: 100 })
			.then((page) => (alerts = capacityAlerts(page.results.filter((weekend) => weekend.status !== 'CLOSED'))))
			.catch((error) => (alertsError = message(error, 'Could not load capacity.')));
	}

	let emails = $state<EmailOverview | null>(null);
	let emailsError = $state('');
	let liveSendingBlocked = $state<boolean | null>(null);
	function loadEmails() {
		emailsError = '';
		getEmailOverview()
			.then((result) => (emails = result))
			.catch((error) => (emailsError = message(error, 'Could not load email counts.')));
		getEmailSettings()
			.then((settings) => (liveSendingBlocked = settings.liveSendingBlocked))
			.catch(() => (liveSendingBlocked = null));
	}

	$effect(loadCalls);
	$effect(loadEmails);
	$effect(loadPipeline);
	$effect(loadCapacity);

	const overdue = (task: Task) => task.dueAt !== null && new Date(task.dueAt).getTime() < Date.now();
	const taskHref = (task: Task) => (task.applicationId ? `/applications/${task.applicationId}` : `/vendors/${task.vendor.id}`);
</script>

<svelte:head><title>Overview · Vendor Ops</title></svelte:head>

{#snippet retry(error: string, again: () => void)}
	<p role="alert" class="text-xs text-error">{error} <button type="button" class="link" onclick={again}>Retry</button></p>
{/snippet}
<div class="grid grid-cols-1 gap-2 md:grid-cols-2 mb-4">
	<div class="flex flex-col gap-2">
		<section>
			<p class="text-xs">Summary</p>
		</section>
	</div>
	<div>
		<QuickActions />
		
	</div>
</div>
<div class="grid grid-cols-1 gap-2 md:grid-cols-3">
	<div class="flex flex-col gap-2">
		<section class="card card-xs bg-base-100 border border-base-200 shadow-sm" aria-labelledby="calls-heading">
			<div class="card-body">
				<h2 id="calls-heading" class="card-title">Vendor calls due</h2>
				{#if callsError}
					{@render retry(callsError, loadCalls)}
				{:else if !calls}
					<p class="text-xs text-base-content/60">Loading…</p>
				{:else}
					<p class="text-xs text-base-content/70">
						{calls.open} open · <span class={[calls.overdue && 'font-semibold text-error']}>{calls.overdue} overdue</span> · {calls.mine} assigned to you
					</p>
					<ul class="flex flex-col gap-1">
						{#each calls.next as task (task.id)}
							<li class="flex items-center justify-between gap-2 text-xs">
								<a href={taskHref(task)} class="truncate hover:underline">{task.vendor.brandName}</a>
								<span class={['whitespace-nowrap', overdue(task) ? 'font-semibold text-error' : 'text-base-content/60']}>
									{task.dueAt ? formatDateTime(task.dueAt) : 'No due date'}
								</span>
							</li>
						{:else}
							<li class="text-xs text-base-content/60">No calls due.</li>
						{/each}
					</ul>
					<div class="card-actions justify-end"><a href="/tasks?view=calls" class="btn btn-xs">All calls</a></div>
				{/if}
			</div>
		</section>

		<section class="card card-xs bg-base-100 border border-base-200 shadow-sm" aria-labelledby="imported-heading">
			<div class="card-body">
				<h2 id="imported-heading" class="card-title">Imported, still New</h2>
				<p class="text-xs text-base-content/70">
					{#if imported === null}Loading…{:else}{imported} application{imported === 1 ? '' : 's'} from CSV imports not called yet.{/if}
				</p>
				<div class="card-actions justify-end">
					<a href="/applications?source=CSV+import" class="btn btn-xs">Open on the board</a>
				</div>
			</div>
		</section>

		<section class="card card-xs bg-base-100 border border-base-200 shadow-sm" aria-labelledby="payments-heading">
			<div class="card-body">
				<!-- TODO(finance): match Stripe/Shopify payments to invoices once invoicing exists. -->
				<h2 id="payments-heading" class="card-title">Unmatched payments</h2>
				<p class="text-xs text-base-content/60">Arrives with invoices and payments in the next release.</p>
			</div>
		</section>
	</div>

	<div class="flex flex-col gap-2">
		<section class="card card-xs bg-base-100 border border-base-200 shadow-sm" aria-labelledby="pipeline-heading">
			<div class="card-body">
				<h2 id="pipeline-heading" class="card-title">Pipeline</h2>
				{#if summaryError}
					{@render retry(summaryError, loadPipeline)}
				{:else if !summary}
					<p class="text-xs text-base-content/60">Loading…</p>
				{:else}
					<dl class="grid grid-cols-2 gap-2">
						{#each BOARD_STAGES as stage (stage)}
							<div class="rounded-lg bg-base-200/60 p-2">
								<dt class="text-[11px] text-base-content/60">{stageLabels[stage]}</dt>
								<dd class="text-lg font-semibold">{summary.stages[stage]}</dd>
							</div>
						{/each}
					</dl>
					<p class="text-[11px] text-base-content/60">Closed: {summary.stages.DECLINED} declined, {summary.stages.WITHDRAWN} withdrawn.</p>
					<div class="card-actions justify-end"><a href="/applications" class="btn btn-xs">Board</a></div>
				{/if}
			</div>
		</section>

		<section class="card card-xs bg-base-100 border border-base-200 shadow-sm" aria-labelledby="awaiting-heading">
			<div class="card-body">
				<h2 id="awaiting-heading" class="card-title">Oldest awaiting payment</h2>
				{#if summary}
					<ul class="flex flex-col gap-1">
						{#each summary.oldestAwaitingPayment as item (item.id)}
							<li class="flex items-center justify-between gap-2 text-xs">
								<a href={`/applications/${item.id}`} class="truncate hover:underline">{item.brandName}</a>
								<span class={['whitespace-nowrap', (item.daysSinceBilled ?? 0) >= 7 ? 'font-semibold text-error' : 'text-base-content/60']}>
									{item.daysSinceBilled === null ? 'billing date unknown' : `${item.daysSinceBilled} day${item.daysSinceBilled === 1 ? '' : 's'} since billing`}
								</span>
							</li>
						{:else}
							<li class="text-xs text-base-content/60">Nothing is awaiting payment.</li>
						{/each}
					</ul>
				{:else if !summaryError}
					<p class="text-xs text-base-content/60">Loading…</p>
				{/if}
			</div>
		</section>
	</div>

	<div class="flex flex-col gap-2">
		

		<section class="card card-xs bg-base-100 border border-base-200 shadow-sm" aria-labelledby="emails-heading">
			<div class="card-body">
				<h2 id="emails-heading" class="card-title">Vendor emails</h2>
				{#if emailsError}
					{@render retry(emailsError, loadEmails)}
				{:else if !emails}
					<p class="text-xs text-base-content/60">Loading…</p>
				{:else}
					<EmailOverviewCard overview={emails} {liveSendingBlocked} />
					<div class="card-actions justify-end">
						<a href="/tasks?view=emails" class="btn btn-xs">Email reviews</a>
						<a href={`${SETTINGS_EMAILS_HREF}?tab=messages`} class="btn btn-xs">All emails</a>
					</div>
				{/if}
			</div>
		</section>
		<section class="card card-xs bg-base-100 border border-base-200 shadow-sm" aria-labelledby="capacity-heading">
			<div class="card-body">
				<h2 id="capacity-heading" class="card-title">Capacity alerts</h2>
				<p class="text-[11px] text-base-content/60">Booths and add-ons with 2 or fewer spots left, or with a waitlist.</p>
				{#if alertsError}
					{@render retry(alertsError, loadCapacity)}
				{:else if !alerts}
					<p class="text-xs text-base-content/60">Loading…</p>
				{:else}
					<ul class="flex flex-col gap-1">
						{#each alerts as alert (`${alert.weekend.id}-${alert.kind}-${alert.productName}`)}
							<li class="flex flex-wrap items-center justify-between gap-2 text-xs">
								<a href={`/market-weekends/${alert.weekend.id}`} class="hover:underline">{alert.weekend.label}: {alert.productName}</a>
								<span class="flex gap-1">
									{#if alert.remaining !== null}
										<span class={['badge badge-xs', alert.remaining <= 0 ? 'badge-error' : 'badge-warning']}>{Math.max(alert.remaining, 0)} left</span>
									{/if}
									{#if alert.waitlisted}<span class="badge badge-xs badge-secondary badge-outline">{alert.waitlisted} waitlisted</span>{/if}
								</span>
							</li>
						{:else}
							<li class="text-xs text-base-content/60">No capacity alerts.</li>
						{/each}
					</ul>
					<div class="card-actions justify-end"><a href="/market-weekends" class="btn btn-xs">Market weekends</a></div>
				{/if}
			</div>
		</section>
	</div>
</div>
