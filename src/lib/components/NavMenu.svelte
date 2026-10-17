<script lang="ts">
	import { page } from '$app/state';
	import { isActive, navItems } from '#lib/nav.ts';

	let {
		variant,
		openTasks = null,
		onselect
	}: { variant: 'sidebar' | 'dropdown' | 'header'; openTasks?: number | null; onselect?: () => void } = $props();
</script>

{#if variant === 'sidebar'}
	<ul class="menu w-full p-3 space-y-1 text-base-content/80">
		{#each navItems as item (item.href)}
			{@const active = isActive(page.url.pathname, item.href)}
			<li>
				<a
					href={item.href}
					class={['flex items-center justify-between px-3 py-2.5 text-sm transition-colors', active ? 'text-[#35b2b2] bg-[#35b2b2]/10' : 'hover:bg-base-200']}
					aria-current={active ? 'page' : undefined}
				>
					<span class="flex items-center gap-3">
						<svg class={['w-5 h-5', !active && 'text-base-content/60']} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon}></path>
						</svg>
						<span>{item.label}</span>
					</span>
					{#if item.showOpenTasks && openTasks}
						<span class="badge badge-sm border-none bg-amber-100 text-amber-800 font-semibold" title="Your open tasks">{openTasks}</span>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
	
{:else if variant === 'header'}
	<ul class="flex min-w-max items-center gap-1" aria-label="Primary sections">
		{#each navItems as item (item.href)}
			{@const active = isActive(page.url.pathname, item.href)}
			<li>
				<a
					href={item.href}
					class={[
						'flex h-9 items-center gap-2 border-b-2 px-3 text-xs font-medium transition-colors',
						active
							? 'border-[#35b2b2] text-[#258b8b]'
							: 'border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-950'
					]}
					aria-current={active ? 'page' : undefined}
				>
					{item.label}
					{#if item.showOpenTasks && openTasks}
						<span class="badge badge-xs border-none bg-amber-100 text-amber-800">{openTasks}</span>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
{:else}
<ul
	id="mobile-navigation-menu"
	class="mobile-nav-menu menu menu-sm absolute left-0 top-full z-50 mt-2 w-56 border border-neutral-200 bg-white p-2 text-neutral-900 shadow-xl"
>
		{#each navItems as item (item.href)}
			{@const active = isActive(page.url.pathname, item.href)}
			<li>
				<a
					href={item.href}
					class={[
						'flex min-h-10 items-center justify-between px-3 text-sm text-neutral-800 hover:bg-neutral-100 hover:text-neutral-950',
						active && 'bg-neutral-900 text-white hover:bg-neutral-900 hover:text-white'
					]}
					aria-current={active ? 'page' : undefined}
					onclick={onselect}
				>
					{item.label}
					{#if item.showOpenTasks && openTasks}
						<span class="badge badge-xs border-none bg-amber-100 text-amber-800">{openTasks}</span>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	/* Hex fallbacks keep the menu readable in browsers that ignore Tailwind v4's
	   modern oklch() color declarations. */
	.mobile-nav-menu {
		background-color: #ffffff;
		color: #171717;
	}

	.mobile-nav-menu a {
		color: #262626;
	}

	.mobile-nav-menu a[aria-current='page'] {
		background-color: #171717;
		color: #ffffff;
	}
</style>
