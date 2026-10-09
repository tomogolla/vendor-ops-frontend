<script>
	import '../app.css';
	import AppSideBar from '#lib/AppSidebar.svelte';
	import tgfLogo from '#lib/assets/tgf-logo.svg';

	let { children } = $props();
	let drawerOpen = $state(false);
</script>
<svelte:head>
  <link rel="icon" href={tgfLogo} />
</svelte:head>
<div class="drawer lg:drawer-open">
	<!-- Hidden checkbox controlling DaisyUI drawer state -->

	<div class="drawer-content flex flex-col min-h-screen">
		<!-- Header Navbar -->
		<header class="navbar bg-base-300 w-full sticky top-0 z-45 shadow-sm">
			<div class="flex-none lg:hidden">
				<label for="app-drawer" aria-label="open sidebar" class="btn btn-square btn-ghost drawer-button">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block h-6 w-6 stroke-current">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</label>
			</div>
			<div class="mx-2 flex-1 px-2 font-bold text-lg">Vendor Ops</div>
			
			<!-- Desktop Menu -->
			<div class="hidden flex-none lg:block">
				<!-- <ul class="menu menu-horizontal px-1">
					<li><a href="/">Home</a></li>
					<li><a href="/about">About</a></li>
					<li><a href="/dashboard">Dashboard</a></li>
				</ul> -->
			</div>
		</header>

		<!-- Page View Area -->
		<main class="flex-1 p-2">
			{@render children()}
		</main>
	</div>

	<!-- Sidebar Component -->
	<AppSideBar/>
</div>