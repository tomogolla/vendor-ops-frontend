
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { setUnauthorizedHandler } from "#lib/api.ts";
  import NavMenu from "#lib/components/NavMenu.svelte";
  import { session } from "#lib/session.svelte.ts";
  import { countTasks } from "#lib/vendor-store.ts";

  let { children } = $props();

  let openTasks = $state<number | null>(null);
  let navigationOpen = $state(false);
  let navigationContainer: HTMLDivElement;

  onMount(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (navigationOpen && !navigationContainer.contains(event.target as Node)) {
        navigationOpen = false;
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  });

  // Refresh the task count when navigating.
  $effect(() => {
    void page.url.pathname;

    let cancelled = false;

    countTasks({ owner: "me", is_open: true })
      .then((count) => {
        if (!cancelled) openTasks = count;
      })
      .catch(() => {
        if (!cancelled) openTasks = null;
      });

    return () => {
      cancelled = true;
    };
  });

  // Redirect users when their session expires.
  $effect(() => {
    setUnauthorizedHandler(() => {
      session.expire();

      const next = page.url.pathname + page.url.search;

      void goto(
        `/login?next=${encodeURIComponent(next)}&expired=1`
      );
    });

    return () => setUnauthorizedHandler(null);
  });

  // Replace with the project's existing logout action.
  function logout() {
    session.expire();
    void goto("/login");
  }

  function closeNavigation() {
    navigationOpen = false;
  }
</script>

<svelte:window onkeydown={(event) => event.key === "Escape" && closeNavigation()} />

<div class="drawer lg:drawer-open">
  <input
    id="app-drawer"
    type="checkbox"
    class="drawer-toggle"
  />

  <div class="drawer-content flex min-h-screen flex-col">

    <!-- Main navbar -->
    <header
      class="border-b border-neutral-800 bg-neutral-950 text-white"
    >
      <nav
        class="navbar flex h-12 min-h-12 items-center justify-between px-4 py-0"
        aria-label="Main navigation"
      >

        <!-- Brand -->
        <div class="navbar-start w-auto">
          <div class="relative" bind:this={navigationContainer}>
            <button
              type="button"
              class="nav-icon-button nav-menu-trigger"
              aria-label={navigationOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={navigationOpen}
              aria-controls="mobile-navigation-menu"
              title={navigationOpen ? "Close navigation menu" : "Open navigation menu"}
              onclick={() => (navigationOpen = !navigationOpen)}
            >
              <svg aria-hidden="true" class="nav-icon apps-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3 3h5v5H3V3Zm6.5 0h5v5h-5V3ZM16 3h5v5h-5V3ZM3 9.5h5v5H3v-5Zm6.5 0h5v5h-5v-5Zm6.5 0h5v5h-5v-5ZM3 16h5v5H3v-5Zm6.5 0h5v5h-5v-5Zm6.5 0h5v5h-5v-5Z" />
              </svg>
            </button>
            {#if navigationOpen}
              <NavMenu variant="dropdown" {openTasks} onselect={closeNavigation} />
            {/if}
          </div>
          <h2
           
            class="text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:text-neutral-300"
          >
            Vendor Ops
		</h2>
        </div>

        <!-- Navigation actions -->
        <div class="navbar-end flex w-auto items-center gap-2">

          <!-- Search -->
          <a
            href="/vendors"
            class="nav-icon-button"
            aria-label="Search vendors"
            title="Search vendors"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M10.5 3a7.5 7.5 0 1 0 4.72 13.33L19.9 21 21 19.9l-4.67-4.68A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />
            </svg>
          </a>

          <!-- Notifications -->
          <!-- Non-interactive until notifications are implemented -->
          <span
            class="nav-icon-button"
            aria-label="Notifications"
            title="Notifications"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-5v-5a7 7 0 0 0-5-6.71V4a2 2 0 1 0-4 0v1.29A7 7 0 0 0 5 12v5l-2 2h18l-2-2Z" />
            </svg>
          </span>

          <!-- Settings -->
          <a
            href="/settings"
            class="nav-icon-button"
            aria-label="Settings"
            title="Settings"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path fill-rule="evenodd" d="M9.65 2h4.7l.55 2.14c.42.18.82.41 1.19.69L18.2 4.2l2.35 4.07-1.56 1.52c.06.4.06.82 0 1.22l1.56 1.52-2.35 4.07-2.11-.63c-.37.28-.77.51-1.19.69L14.35 19h-4.7l-.55-2.14a7.3 7.3 0 0 1-1.19-.69l-2.11.63-2.35-4.07 1.56-1.52a7.4 7.4 0 0 1 0-1.22L3.45 8.47 5.8 4.4l2.11.63c.37-.28.77-.51 1.19-.69L9.65 2ZM12 14.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" clip-rule="evenodd" />
            </svg>
          </a>

          <!-- User profile -->
          <div class="dropdown dropdown-end ml-1">

            <!-- Avatar trigger -->
            <div
              tabindex="0"
              role="button"
              aria-label="Open user menu"
              class="nav-icon-button avatar rounded-full ring-1 ring-neutral-700 transition-all hover:ring-neutral-500"
            >
              <span
                class="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-bold tracking-tight text-white"
              >
                VO
              </span>
            </div>

            <!-- Profile menu -->
            <div
              class="dropdown-content z-50 mt-2 w-56 rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-neutral-200 shadow-xl"
            >
              <div class="flex items-center justify-between gap-3">

                <!-- User details -->
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-xs font-semibold text-white"
                  >
                    {session.user?.name ?? "User"}
                  </p>

                  <p class="mt-1 text-[11px] text-neutral-400">
                    {session.isAdmin
                      ? "Administrator"
                      : "Team Member"}
                  </p>
                </div>

                <!-- Logout -->
                <button
                  type="button"
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white transition-colors hover:bg-neutral-800"
                  title="Log out"
                  aria-label="Log out"
                  onclick={logout}
                >
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="m16 17 5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                </button>

              </div>
            </div>
          </div>

        </div>
      </nav>
    </header>
	 <header class="hidden border-b border-neutral-200 bg-white pl-10 text-neutral-900 md:block">
      <nav class="flex min-h-11 items-center overflow-x-auto px-4 sm:px-6" aria-label="Section navigation">
        <a
            href="/"
            class="shrink-0 pr-4 text-sm font-semibold text-[#258b8b]"
          >
            The Good Flea NYC
          </a>
        <span class="h-6 shrink-0 border-l border-neutral-300" aria-hidden="true"></span>
        <div class="pl-2">
          <NavMenu variant="header" {openTasks} />
        </div>
      </nav>
    </header>

    <!-- Page content -->
    <main class="flex-1 p-6">
      {@render children()}
    </main>

  </div>
</div>

<style>
  /* Shared dimensions for every top navbar control */
  :global(.nav-icon-button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    min-width: 1.75rem;
    min-height: 1.75rem;
    padding: 0;
    flex-shrink: 0;
    border-radius: 9999px;
    color: #ffffff;
    background: transparent;
    text-decoration: none;
    transition: background-color 150ms ease;
  }

  :global(a.nav-icon-button:hover),
  :global(.dropdown > .nav-icon-button:hover) {
    background-color: #262626;
  }

  :global(a.nav-icon-button:focus-visible),
  :global(.dropdown > .nav-icon-button:focus-visible) {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }

  /* Shared dimensions and appearance for SVG icons */
  :global(.nav-icon) {
    display: block;
    width: 1.25rem;
    height: 1.25rem;
    color: #ffffff;
    flex-shrink: 0;
  }

  :global(.nav-menu-trigger) {
    width: 2.75rem;
    height: 2.75rem;
    min-width: 2.75rem;
    min-height: 2.75rem;
  }

  :global(.apps-icon) {
    width: 1.1rem;
    height: 1.1rem;
  }
</style>
