<script lang="ts">
	import { page } from '$app/state';
	import { isActive, navItems } from '#lib/nav.ts';

	let { variant, openTasks = null }: { variant: 'sidebar' | 'dropdown'; openTasks?: number | null } = $props();
</script>

{#if variant === 'sidebar'}
	<ul class="menu w-full p-3 space-y-1 text-base-content/80">
		{#each navItems as item (item.href)}
			{@const active = isActive(page.url.pathname, item.href)}
			<li>
				<a
					href={item.href}
					class={['flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors', active ? 'text-[#35b2b2] bg-[#35b2b2]/10' : 'hover:bg-base-200']}
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
{:else}
	<ul tabindex="-1" class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
		{#each navItems as item (item.href)}
			{@const active = isActive(page.url.pathname, item.href)}
			<li>
				<a href={item.href} class={[active && 'menu-active']} aria-current={active ? 'page' : undefined}>
					{item.label}
					{#if item.showOpenTasks && openTasks}
						<span class="badge badge-xs border-none bg-amber-100 text-amber-800">{openTasks}</span>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
{/if}
