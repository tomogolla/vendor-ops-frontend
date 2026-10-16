<script lang="ts">
  import { goto } from '$app/navigation';
  import NavMenu from '#lib/components/NavMenu.svelte';
  import { session } from '#lib/session.svelte.ts';
	import tgfLogo from '#lib/assets/tgf-logo.svg';

  /** The signed-in person's open-task count, loaded by the app layout. */
  let { openTasks = null }: { openTasks?: number | null } = $props();

  async function logout() {
    await session.logout();
    await goto('/login');
  }
</script>

  <!-- ================= SIDEBAR NAVIGATION ================= -->
  <div class="drawer-side z-40">
    <label for="app-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
    
    <aside class="w-54 min-h-full bg-[#fffee8] border-r border-base-200 flex flex-col justify-between">
      
      <!-- Top Section: Brand & Navigation Menu -->
      <div>
        <!-- Brand Header -->
        <div class="p-5 border-b border-base-200 flex items-center">
          <div class="flex items-center gap-3">
            
            <div>
              <h2 class="font-semibold text-sm text-base-content leading-tight">Vendor Ops <span class="text-xs font-light text-base-content/50">| v1.3.1</span></h2>
            </div>
          </div>
        </div>

        <!-- Navigation Links: shared definition in #lib/nav.ts -->
        <NavMenu variant="sidebar" {openTasks} />
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
