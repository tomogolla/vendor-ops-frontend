  <!-- ================= SIDEBAR NAVIGATION ================= -->
  <div class="drawer-side z-40">
    <label for="app-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
    
    <aside class="w-72 min-h-full bg-base-100 border-r border-base-200 flex flex-col justify-between">
      
      <!-- Top Section: Brand & Navigation Menu -->
      <div>
        <!-- Brand Header -->
        <div class="p-5 border-b border-base-200 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg" style="background-color: #35b2b2;">
              GF
            </div>
            <div>
              <h2 class="font-bold text-sm text-base-content leading-tight">The Good Flea</h2>
              <span class="text-xs text-base-content/50">Vendor Management</span>
              <p class="text-xs text-base-content/50">V1.2.2</p>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <ul class="menu p-3 space-y-1 text-base-content/80">
          
          <!-- Section Label -->
          

          <!-- Dashboard (Active Example) -->
          <li>
            <a href="/" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors text-[#35b2b2] bg-[#35b2b2]/10">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              <span>Dashboard</span>
            </a>
          </li>

          <!-- Applications / Leads -->
          <li>
            <a href="/applications" class="flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm hover:bg-base-200 transition-colors">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>Applications</span>
              </div>
              <span class="badge badge-sm border-none bg-amber-100 text-amber-800 font-semibold">5</span>
            </a>
          </li>

          <!-- Vendors / Customers Directory -->
          <li>
            <a href="/vendors" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm hover:bg-base-200 transition-colors">
              <svg class="w-5 h-5 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <span>Vendors</span>
            </a>
          </li>

          <!-- Upcoming Markets -->
          <li>
            <a href="/market-weekends" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm hover:bg-base-200 transition-colors">
              <svg class="w-5 h-5 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>Market Weekends</span>
            </a>
          </li>

          <!-- Tasks & Alerts -->
          
          <!-- Finance & Invoices -->
          <li>
            <a href="/payments" class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm hover:bg-base-200 transition-colors">
              <svg class="w-5 h-5 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Payments</span>
            </a>
          </li>

          

        </ul>
      </div>

      <!-- Bottom User Profile Footer -->
      <div class="p-4 border-t border-base-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="avatar placeholder">
              <div class="bg-neutral text-neutral-content rounded-full w-9">
                <span class="text-xs font-bold">W</span>
              </div>
            </div>
            <div>
              <p class="text-sm font-bold leading-tight text-base-content">Wambui</p>
              <p class="text-xs text-base-content/50">Sales Lead</p>
            </div>
          </div>
          <button class="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-error" title="Logout">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
        </div>
      </div>

    </aside>
  </div>
