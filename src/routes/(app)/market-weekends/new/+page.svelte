<script lang="ts">
	import { goto } from '$app/navigation';
	import WeekendForm from '#lib/components/WeekendForm.svelte';
	import { session } from '#lib/session.svelte.ts';
</script>

<svelte:head><title>New market weekend · Vendor Ops</title></svelte:head>

<div class="mx-auto flex max-w-4xl flex-col gap-4 p-2">
	<header class="flex items-center justify-between">
		<h1 class="text-lg font-bold">New market weekend</h1>
		<a href="/market-weekends" class="link text-sm">Back to weekends</a>
	</header>
	{#if session.isAdmin}
		<WeekendForm cancelHref="/market-weekends" onsaved={(id) => goto(`/market-weekends/${id}`)} />
	{:else}
		<p role="alert" class="alert alert-warning text-sm">Only administrators can create market weekends.</p>
	{/if}
</div>
