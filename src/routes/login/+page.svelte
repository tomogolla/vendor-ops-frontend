<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ApiError } from '#lib/api.ts';
	import { session } from '#lib/session.svelte.ts';

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);

	const next = $derived.by(() => {
		const target = page.url.searchParams.get('next') ?? '/';
		return target.startsWith('/') && !target.startsWith('//') ? target : '/';
	});
	const expired = $derived(page.url.searchParams.has('expired'));

	$effect(() => {
		session.load().then((user) => {
			if (user) goto(next, { replaceState: true });
		}).catch(() => {});
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		if (!username.trim() || !password) {
			error = 'Enter your username and password.';
			return;
		}
		submitting = true;
		try {
			await session.login(username.trim(), password);
			await goto(next, { replaceState: true });
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Could not sign in. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head><title>Sign in · Vendor Ops</title></svelte:head>

<main class="flex min-h-screen items-center justify-center bg-base-200 p-4">
	<form class="card w-full max-w-sm border border-base-200 bg-base-100 shadow-sm" novalidate onsubmit={submit}>
		<div class="card-body gap-4">
			<div class="flex items-center gap-3">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white" style="background-color: #35b2b2;">GF</div>
				<div>
					<h1 class="text-base font-bold leading-tight">Vendor Ops</h1>
					<p class="text-xs text-base-content/60">The Good Flea team sign-in</p>
				</div>
			</div>
			{#if expired}
				<p role="status" class="alert alert-info alert-soft text-sm">Your session ended. Please sign in again.</p>
			{/if}
			<div class="flex flex-col gap-1">
				<label class="text-sm font-medium" for="login-username">Username</label>
				<input id="login-username" class="input-line" autocomplete="username" bind:value={username} />
			</div>
			<div class="flex flex-col gap-1">
				<label class="text-sm font-medium" for="login-password">Password</label>
				<input id="login-password" type="password" class="input-line" autocomplete="current-password" bind:value={password} />
			</div>
			{#if error}<p role="alert" class="text-sm text-error">{error}</p>{/if}
			<button type="submit" class="btn btn-primary btn-sm" disabled={submitting}>
				{#if submitting}<span class="loading loading-spinner loading-xs"></span>{/if}
				Sign in
			</button>
		</div>
	</form>
</main>
