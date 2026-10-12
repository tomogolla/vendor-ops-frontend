<script lang="ts">
	import '../app.css';
	import tgfLogo from '#lib/assets/tgf-logo.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={tgfLogo} />
</svelte:head>

{@render children()}
