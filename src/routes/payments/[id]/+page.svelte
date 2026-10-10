<script lang="ts">
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    // Mock: invoices don't carry a customer id yet.
    const customerId = '1';
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
    <!-- Left Column (50% width on desktop) -->
    <div class="card bg-base-100 border border-base-200 shadow-sm p-3">
        <header class="bg-base-100 border-b border-base-200 ">
            <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-base-content">
                    INVOICE #{data.id}
                </h3>
                <span class="badge badge-sm badge-success font-medium"
                    >PAID</span
                >
            </div>
        </header>
        <div class="w-full max-w-2xl mx-auto mt-3">
            <!-- Row 1 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Customer Name</h4>
                <p class="text-xs text-slate-500 leading-relaxed">
                    <a href={`/customers/${customerId}`} class="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150 ease-in-out">Michael Moris</a>
                </p>

            </div>

            <!-- Row 2 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Date Paid</h4>
                <p class="text-xs text-slate-500 ">October 1st, 2026 <span class="text-slate-600">Due Date: October 15th, 2026</span></p>
            
            </div>

            <!-- Row 3 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Stripe payment link</h4>
                <p class="text-xs text-slate-500 leading-relaxed">https://stripe.com/payments</p>
            </div>

            <!-- Row 4 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Shopify Order</h4>
                <p class="text-xs text-slate-500 leading-relaxed">Shopify Order #2003</p>
            </div>

            <!-- Row 6 -->
            <div class="pb-4">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">Line Items</h4>
                <div class="overflow-x-auto">
                    <table class="table table-zebra table-sm md:table-md">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>October 10 & 11 8ftx8ft booth</td>
                                <td>2</td>
                                <td>$400.00</td>
                                <td>$800.00</td>
                            </tr>
                        </tbody>

                    </table>
                    <div class="pb-4">
                        <h4 class="text-sm font-semibold text-slate-900 mb-1">Amount Paid</h4>
                        <p class="text-xs text-slate-500 leading-relaxed">$800.00</p>
                    </div>
                </div>
          </div>
        </div>

         </div>

    <!-- Right Column (50% width on desktop) -->
    <div class="card bg-base-100 border border-base-200 shadow-sm p-6">
        <div
                class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden"
            >
                <div class="card-body margin-y-3">
                    <h4 class="card-title">QUICK ACTIONS</h4>
                    <ul class="menu menu-sm rounded-box w-56 p-0">
                        <li><button type="button">Assign brand</button></li>
                        <li><button type="button">Send payment receipt to customer</button></li>
                        <li><button type="button">Send payment reminder</button></li>
                    </ul>
                </div>
            </div>
    </div>
</div>


<style>
    .bg-base-100 {
        background-color: var(--base-100);
    }
</style>