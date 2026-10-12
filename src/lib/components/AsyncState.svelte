<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import type { Resource } from '#lib/resource.svelte.ts';

	type Props = {
		resource: Resource<T>;
		children: Snippet<[T]>;
		notFound?: Snippet;
		label?: string;
	};
	let { resource, children, notFound, label = 'Loading…' }: Props = $props();
</script>

{#if resource.error && !(resource.notFound && notFound)}
	<div role="alert" class="alert alert-error alert-soft flex flex-wrap items-center justify-between gap-2 text-sm">
		<span>
			{resource.forbidden ? 'You do not have access to this.' : resource.error.message}
		</span>
		{#if !resource.forbidden}
			<button type="button" class="btn btn-sm" onclick={resource.retry} disabled={resource.loading}>Retry</button>
		{/if}
	</div>
{:else if resource.error && notFound}
	{@render notFound()}
{:else if resource.data === undefined}
	<div class="flex items-center gap-2 p-4 text-sm text-base-content/60" role="status">
		<span class="loading loading-spinner loading-sm"></span>
		{label}
	</div>
{:else}
	<div class={['transition-opacity', resource.loading && 'opacity-60']} aria-busy={resource.loading}>
		{@render children(resource.data)}
	</div>
{/if}
