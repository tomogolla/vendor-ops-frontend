<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { session } from '#lib/session.svelte.ts';
  import { countTasks } from '#lib/vendor-store.ts';
	import tgfLogo from '#lib/assets/tgf-logo.svg';

  let myOpenTasks = $state<number | null>(null);
  $effect(() => {
    void page.url.pathname;
    countTasks({ owner: 'me', is_open: true })
      .then((count) => (myOpenTasks = count))
      .catch(() => (myOpenTasks = null));
  });

  const initials = $derived(
    (session.user?.name ?? '?')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  );

  async function logout() {
    await session.logout();
    await goto('/login');
  }

  const isActive = (href: string) =>
    href === '/' ? page.url.pathname === '/' : page.url.pathname === href || page.url.pathname.startsWith(href + '/');
</script>

  <!-- ================= SIDEBAR NAVIGATION ================= -->
  <div class="drawer-side z-40">
    <label for="app-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
    
    <aside class="w-54 min-h-full bg-[#fffee8] border-r border-base-200 flex flex-col justify-between">
      
      <!-- Top Section: Brand & Navigation Menu -->
      <div>
        <!-- Brand Header -->
        <div class="p-5 border-b border-base-200 flex items-center justify-between">
          <div class="flex items-center gap-3">
            
            <div>
              <h2 class="font-semibold text-sm text-base-content leading-tight">Vendor Ops <span class="text-xs font-light text-base-content/50">| v1.3.0</span></h2>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <ul class="menu p-3 space-y-1 text-base-content/80">
          
          <!-- Section Label -->
          

          <!-- overview -->
          <li>
            <a href="/" class={['flex items-center gap-3 px-3 py-2.5 rounded-lg font-regular text-sm transition-colors', isActive('/') ? 'text-[#35b2b2] bg-[#35b2b2]/10' : 'hover:bg-base-200']}>
              <span class="material-symbols-outlined">overview</span>
              <span>Overview</span>
            </a>
          </li>

          <!-- Task Center -->
          <li>
            <a href="/tasks" class={['flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-colors', isActive('/tasks') ? 'text-[#35b2b2] bg-[#35b2b2]/10' : 'hover:bg-base-200']}>
              <div class="flex items-center gap-3">
                <svg class={['w-5 h-5', !isActive('/tasks') && 'text-base-content/60']} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
                <span>Tasks</span>
              </div>
              {#if myOpenTasks}
                <span class="badge badge-sm border-none bg-amber-100 text-amber-800 font-semibold" title="Your open tasks">{myOpenTasks}</span>
              {/if}
            </a>
          </li>

          <!-- Applications / Leads -->
          <li>
            <a href="/applications" class={['flex items-center justify-between px-3 py-2.5 rounded-lg font-regular text-sm transition-colors', isActive('/applications') ? 'text-[#35b2b2] bg-[#35b2b2]/10' : 'hover:bg-base-200']}>
              <div class="flex items-center gap-3">
                <svg class={['w-5 h-5', !isActive('/applications') && 'text-base-content/60']} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>Applications</span>
              </div>
            </a>
          </li>

          <!-- Vendors Directory -->
          <li>
            <a href="/vendors" class={['flex items-center gap-3 px-3 py-2.5 rounded-lg font-regular text-sm transition-colors', isActive('/vendors') ? 'text-[#35b2b2] bg-[#35b2b2]/10' : 'hover:bg-base-200']}>
              <svg class={['w-5 h-5', !isActive('/vendors') && 'text-base-content/60']} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <span>Vendors</span>
            </a>
          </li>

          <!-- <li>
            <a href="/customers" class={['flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors', isActive('/customers') ? 'text-[#35b2b2] bg-[#35b2b2]/10' : 'hover:bg-base-200']}>
              <svg class={['w-5 h-5', !isActive('/customers') && 'text-base-content/60']} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <span>Customers</span>
            </a>
          </li> -->

          <!-- Upcoming Markets -->
          <li>
            <a href="/market-weekends" class={['flex items-center gap-3 px-3 py-2.5 rounded-lg font-regular text-sm transition-colors', isActive('/market-weekends') ? 'text-[#35b2b2] bg-[#35b2b2]/10' : 'hover:bg-base-200']}>
              <svg class={['w-5 h-5', !isActive('/market-weekends') && 'text-base-content/60']} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>Market Weekends</span>
            </a>
          </li>

          
          
          <!-- Finance & Invoices -->
          <li>
            <a href="/finance" class={['flex items-center gap-3 px-3 py-2.5 rounded-lg font-regular text-sm transition-colors', isActive('/finance') ? 'text-[#35b2b2] bg-[#35b2b2]/10' : 'hover:bg-base-200']}>
              <svg class={['w-5 h-5', !isActive('/finance') && 'text-base-content/60']} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>Finance</span>
            </a>
          </li>


          <!-- <li>
            <a href="/payments" class={['flex items-center gap-3 px-3 py-2.5 rounded-lg font-regular text-sm transition-colors', isActive('/payments') ? 'text-[#35b2b2] bg-[#35b2b2]/10' : 'hover:bg-base-200']}>
              <svg class={['w-5 h-5', !isActive('/payments') && 'text-base-content/60']} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Payments</span>
            </a>
          </li> -->

          

        </ul>
      </div>

      <!-- Bottom User Profile Footer -->
      <div class="p-4 border-t border-base-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="avatar">
              <div class="ring-primary w-10 rounded-full">
                <img alt="Tailwind-CSS-Avatar-component" src={tgfLogo} />
              </div>
            </div>
            <div>
              <p class="text-sm font-bold leading-tight text-base-content">{session.user?.name ?? ''}</p>
              <p class="text-xs text-base-content/50">{session.isAdmin ? 'Administrator' : 'Team Member'}</p>
            </div>
          </div>
          <button type="button" class="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-error" title="Log out" aria-label="Log out" onclick={logout}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
        </div>
      </div>

    </aside>
  </div>
