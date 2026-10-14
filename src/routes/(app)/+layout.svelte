<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import AppSideBar from "#lib/AppSidebar.svelte";
	import { setUnauthorizedHandler } from "#lib/api.ts";
	import { session } from "#lib/session.svelte.ts";

	let { children } = $props();

	$effect(() => {
		setUnauthorizedHandler(() => {
			session.expire();
			goto(
				`/login?next=${encodeURIComponent(page.url.pathname + page.url.search)}&expired=1`,
			);
		});
		return () => setUnauthorizedHandler(null);
	});
</script>

<div class="drawer lg:drawer-open">
	<input id="app-drawer" type="checkbox" class="drawer-toggle" />

	<div class="drawer-content flex flex-col min-h-screen">
		<!-- Header Navbar -->
		<header>
			<div class="navbar px-4 shadow-sm">
			<div class="navbar-start">
				<!-- Added "block md:hidden" here -->
				<div class="dropdown block md:hidden">
					<div tabindex="0" role="button" class="btn btn-ghost btn-circle">
						<svg aria-label="Menu" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> 
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /> 
						</svg>
					</div>
					<ul tabindex="-1" class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
						<li><a href="/">Overview</a></li>
						<li><a href="/applications">Applications</a></li>
						<li><a href="/vendors">Vendors</a></li>
						<li><a href="/tasks">Tasks</a></li>
						<li><a href="/finance">Finance</a></li>
					</ul>
				</div>
			</div>


			<div class="navbar-end">
				<button class="btn btn-ghost btn-circle">
				<svg aria-label="Search" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> </svg>
				</button>
				<button class="btn btn-ghost btn-circle">
				<div class="indicator">
					<svg aria-label="Notifications" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> </svg>
					<span class="badge badge-xs badge-primary indicator-item"></span>
				</div>
				</button>
			</div>
			</div>
		</header>

		<!-- Page View Area -->
		<main class="flex-1 p-2">
			{@render children()}
		</main>
	</div>

	<!-- Sidebar Component -->
	<AppSideBar />
</div>
