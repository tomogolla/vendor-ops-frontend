<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>Error · Vendor Ops</title></svelte:head>

<main class="flex min-h-screen items-center justify-center bg-base-200 p-4">
	<div class="card w-full max-w-md border border-base-200 bg-base-100 shadow-sm">
		<div class="card-body items-start gap-3">
			<h1 class="card-title">{page.status === 404 ? 'Page not found' : 'Something went wrong'}</h1>
			<p class="text-sm text-base-content/70">
				{page.status === 404 ? 'That page does not exist.' : (page.error?.message ?? 'Could not load this page.')}
			</p>
			<div class="flex gap-2">
				<button type="button" class="btn btn-primary btn-sm" onclick={() => location.reload()}>Retry</button>
				<a href="/" class="btn btn-ghost btn-sm">Go to dashboard</a>
			</div>
		</div>
	</div>
</main>
