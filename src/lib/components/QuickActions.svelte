<script lang="ts">
	type QuickAction = {
		label: string;
		href: string;
		type: 'create' | 'link';
	};

	const actions: QuickAction[] = [
		{ label: 'Add vendor', href: '/applications/new', type: 'create' },
		{ label: 'Payments', href: '/payments', type: 'link' },
		{ label: 'Create Invoice', href: '/applications/new', type: 'create' },
		{ label: 'Applications', href: '/applications', type: 'link' },
		{ label: 'Add market Weekend', href: '/market-weekends/new', type: 'create' },
		{ label: 'Market Schedule', href: '/market-weekends', type: 'link' },
		{ label: 'Tasks', href: '/tasks', type: 'link' },
		{ label: 'Email Templates', href: '/settings/emails?tab=templates', type: 'link' }
	];
</script>

<section class="card gap-4 p-6" aria-labelledby="actions-heading">
	<h2 id="actions-heading" class="card-title">Actions</h2>

	<div class="grid grid-cols-1 gap-y-1 sm:grid-cols-2">
		{#each actions as action (action.label)}
			<a
				href={action.href}
				class="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[#35b2b2] transition-colors hover:text-[#004aad] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004aad]"
			>
				{#if action.type === 'create'}
					<span class="w-2.5 shrink-0 text-center text-base leading-none" aria-hidden="true">+</span>
				{:else}
					<svg class="size-2.5 shrink-0" viewBox="0 0 10 10" fill="none" aria-hidden="true">
						<path d="m3.5 2 3 3-3 3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				{/if}
				<span>{action.label}</span>
			</a>
		{/each}
	</div>
</section>
