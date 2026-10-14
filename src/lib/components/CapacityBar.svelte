<script lang="ts">
	import type { CapacityDisplay } from '#lib/catalog.ts';

	let { name, capacity, detail = '' }: { name: string; capacity: CapacityDisplay; detail?: string } = $props();

	const barTone = $derived(capacity.tone === 'full' ? 'progress-error' : capacity.tone === 'low' ? 'progress-warning' : 'progress-success');
</script>

<div class="flex flex-col gap-1">
	<div class="flex flex-wrap items-baseline justify-between gap-2 text-sm">
		<span class="font-medium">{name}{#if detail}<span class="text-xs font-normal text-base-content/60"> · {detail}</span>{/if}</span>
		<span class="text-xs text-base-content/70">
			{capacity.text}{#if capacity.waitlisted}<span class="ml-1 badge badge-xs badge-secondary badge-outline">{capacity.waitlisted} waitlisted</span>{/if}
		</span>
	</div>
	{#if !capacity.unlimited}
		<progress
			class={['progress h-2 w-full', barTone]}
			value={capacity.percentUsed}
			max="100"
			aria-label={`${name}: ${capacity.text}`}
		></progress>
	{/if}
</div>
