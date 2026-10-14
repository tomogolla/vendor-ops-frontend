<script lang="ts">
	import { formatDateTime } from '#lib/format.ts';
	import type { Resource } from '#lib/resource.svelte.ts';
	import type { ActivityEvent } from '#lib/vendor-store.ts';

	type Props = {
		title: string;
		/** Explains where the events come from, e.g. that this is the whole vendor's timeline. */
		subtitle?: string;
		activity: Resource<ActivityEvent[]>;
		/** Events of this application are marked. */
		highlightApplicationId?: string;
	};
	let { title, subtitle, activity, highlightApplicationId }: Props = $props();
</script>

<div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
	<div class="card-body gap-3">
		<div>
			<h2 class="text-xs font-bold">{title}</h2>
			{#if subtitle}<p class="text-[11px] text-base-content/60">{subtitle}</p>{/if}
		</div>
		{#if activity.error}
			<p role="alert" class="text-xs text-error">
				{activity.error.message}
				<button type="button" class="link" onclick={activity.retry}>Retry</button>
			</p>
		{:else if !activity.data}
			<p class="text-xs text-base-content/60">Loading activity…</p>
		{:else}
			<ol class="flex flex-col gap-2">
				{#each activity.data as event (event.id)}
					{@const detail = [event.metadata.note, event.metadata.reason, event.metadata.notes].find((value) => typeof value === 'string' && value)}
					{@const mine = highlightApplicationId && event.applicationId === highlightApplicationId}
					<li class={['border-l-2 pl-3', mine ? 'border-primary' : 'border-base-300']}>
						<p class="text-xs font-medium">{event.description}</p>
						<p class="text-[11px] text-base-content/60">
							{formatDateTime(event.createdAt)} · {event.actor?.name ?? 'System'}{mine ? ' · this application' : ''}
						</p>
						{#if detail}<p class="text-xs text-base-content/80 whitespace-pre-line">{detail}</p>{/if}
					</li>
				{:else}
					<li class="text-xs text-base-content/60">No activity yet.</li>
				{/each}
			</ol>
		{/if}
	</div>
</div>
