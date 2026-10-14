<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AsyncState from '#lib/components/AsyncState.svelte';
	import type { Page, Query } from '#lib/api.ts';
	import { formatDateTime } from '#lib/format.ts';
	import { Resource } from '#lib/resource.svelte.ts';
	import { session } from '#lib/session.svelte.ts';
	import { countTasks, listTasks, updateTask, type Task, type TaskStatus, type TaskType } from '#lib/vendor-store.ts';

	type View = { key: string; label: string; query: Query; empty: string };
	const views: View[] = [
		{ key: 'mine', label: 'My Tasks', query: { owner: 'me' }, empty: 'Nothing assigned to you.' },
		{ key: 'calls', label: 'Calls', query: { task_type: 'DISCOVERY_CALL' }, empty: 'No discovery calls.' },
		{ key: 'reviews', label: 'Application Reviews', query: { task_type: 'APPLICATION_REVIEW' }, empty: 'No applications to review.' },
		{ key: 'queue', label: 'Team Queue', query: { owner: 'none' }, empty: 'The team queue is empty.' }
	];

	const typeLabels: Record<TaskType, string> = {
		DISCOVERY_CALL: 'Discovery call',
		APPLICATION_REVIEW: 'Application review',
		FOLLOW_UP: 'Follow-up'
	};
	const statusLabels: Record<TaskStatus, string> = {
		TODO: 'To do',
		IN_PROGRESS: 'In progress',
		COMPLETED: 'Completed',
		NO_ANSWER: 'No answer',
		RESCHEDULED: 'Rescheduled',
		CANCELLED: 'Cancelled'
	};
	const priorityStyles: Record<Task['priority'], string> = {
		URGENT: 'badge-error',
		HIGH: 'badge-warning',
		NORMAL: 'badge-ghost',
		LOW: 'badge-ghost opacity-70'
	};

	const active = $derived(views.find((view) => view.key === page.url.searchParams.get('view')) ?? views[0]);
	const includeClosed = $derived(page.url.searchParams.get('closed') === '1');
	const hrefFor = (key: string, closed = includeClosed) => `/tasks?view=${key}${closed ? '&closed=1' : ''}`;

	const tasks = new Resource<Page<Task>>();
	let counts = $state<Record<string, number>>({});
	let rowError = $state('');
	let working = $state<string | null>(null);

	function load() {
		const query: Query = { ...active.query, ordering: 'due_at', page_size: 100 };
		if (!includeClosed) query.is_open = true;
		tasks.load(() => listTasks(query));
	}
	function loadCounts() {
		Promise.all(views.map(async (view) => [view.key, await countTasks({ ...view.query, is_open: true })] as const))
			.then((entries) => (counts = Object.fromEntries(entries)))
			.catch(() => (counts = {}));
	}
	$effect(load);
	$effect(loadCounts);

	const overdue = (task: Task) => task.isOpen && task.dueAt !== null && new Date(task.dueAt).getTime() < Date.now();
	/** Tasks open on their application when they belong to one, otherwise on the vendor. */
	const taskHref = (task: Task) => (task.applicationId ? `/applications/${task.applicationId}` : `/vendors/${task.vendor.id}`);
	const canAct = (task: Task) => session.isAdmin || task.owner === null || task.owner.id === session.user?.id;

	async function change(task: Task, patch: Parameters<typeof updateTask>[1]) {
		rowError = '';
		working = task.id;
		try {
			await updateTask(task.id, patch);
			load();
			loadCounts();
		} catch (error) {
			rowError = error instanceof Error ? error.message : 'Could not update the task.';
		} finally {
			working = null;
		}
	}
</script>

<svelte:head><title>Tasks · Vendor Ops</title></svelte:head>

<div class="bg-base-100 w-full shadow-sm border border-base-200 rounded-lg">
	<header class="flex flex-wrap items-center justify-between gap-2 bg-[#f4f4f4] px-4 py-3">
		<h1 class="text-base font-bold">Task Center</h1>
		<label class="label cursor-pointer gap-2 text-xs">
			<input
				type="checkbox"
				class="checkbox checkbox-xs"
				checked={includeClosed}
				onchange={(event) => goto(hrefFor(active.key, event.currentTarget.checked))}
			/>
			Include completed and cancelled
		</label>
	</header>

	<div class="flex flex-col gap-2 p-2">
		<nav aria-label="Task views" class="tabs tabs-box tabs-sm w-fit flex-wrap">
			{#each views as view (view.key)}
				<a
					href={hrefFor(view.key)}
					class={['tab gap-1', active.key === view.key && 'tab-active']}
					aria-current={active.key === view.key ? 'page' : undefined}
				>
					{view.label} <span class="text-xs opacity-60">{counts[view.key] ?? ''}</span>
				</a>
			{/each}
		</nav>
		{#if rowError}<p role="alert" class="text-sm text-error">{rowError}</p>{/if}

		<AsyncState resource={tasks} label="Loading tasks…">
			{#snippet children(result)}
				<div class="overflow-x-auto rounded-lg border border-base-200">
					<table class="table table-zebra table-sm w-full text-left">
						<thead class="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-base-300">
							<tr>
								<th>Due</th>
								<th>Task</th>
								<th>Vendor</th>
								<th>Type</th>
								<th>Status</th>
								<th>Priority</th>
								<th>Owner</th>
								<th>Last outcome</th>
								<th><span class="sr-only">Actions</span></th>
							</tr>
						</thead>
						<tbody>
							{#each result.results as task (task.id)}
								<tr class="hover">
									<td class={['whitespace-nowrap', overdue(task) && 'font-semibold text-error']}>
										{task.dueAt ? formatDateTime(task.dueAt) : '—'}
										{#if overdue(task)}<span class="sr-only">(overdue)</span>{/if}
									</td>
									<td class="font-medium">{task.title}</td>
									<td>
										<div class="flex flex-wrap items-center gap-1">
											<a href={taskHref(task)} class="hover:underline">{task.vendor.brandName}</a>
											{#if task.applicationId}<a href={`/vendors/${task.vendor.id}`} class="text-xs link link-hover text-base-content/60">vendor<span class="sr-only"> profile for {task.vendor.brandName}</span></a>{/if}
										</div>
										<div class="text-xs text-slate-400">{task.vendor.phone || task.vendor.email || task.vendor.instagram}</div>
									</td>
									<td class="whitespace-nowrap">{typeLabels[task.taskType]}</td>
									<td class="whitespace-nowrap">{statusLabels[task.status]}</td>
									<td><span class={['badge badge-sm', priorityStyles[task.priority]]}>{task.priority.toLowerCase()}</span></td>
									<td class="whitespace-nowrap">{task.owner?.name ?? 'Unassigned'}</td>
									<td class="whitespace-nowrap">
										{task.outcome || '—'}{#if task.attemptCount}<span class="text-xs text-base-content/60"> ({task.attemptCount})</span>{/if}
									</td>
									<td>
										<div class="flex justify-end gap-1">
											{#if task.isOpen && !task.owner}
												<button type="button" class="btn btn-xs" disabled={working === task.id} onclick={() => change(task, { ownerId: session.user?.id ?? null })}>
													Claim
												</button>
											{/if}
											{#if task.isOpen && canAct(task)}
												{#if task.taskType === 'DISCOVERY_CALL' || task.taskType === 'FOLLOW_UP'}
													<a href={`${taskHref(task)}#call`} class="btn btn-xs btn-primary">Log call</a>
												{/if}
												{#if task.taskType !== 'DISCOVERY_CALL'}
													<button type="button" class="btn btn-xs btn-outline" disabled={working === task.id} onclick={() => change(task, { status: 'COMPLETED' })}>
														Complete
													</button>
												{/if}
											{/if}
										</div>
									</td>
								</tr>
							{:else}
								<tr><td colspan="9" class="py-6 text-center text-sm text-base-content/60">{active.empty}</td></tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if result.count > result.results.length}
					<p class="mt-2 text-xs text-base-content/60">Showing the first {result.results.length} of {result.count}, soonest due first.</p>
				{/if}
			{/snippet}
		</AsyncState>
	</div>
</div>
