<script lang="ts">
	import { statusLabels, type VendorStatus } from '#lib/vendor-store.ts';

	let { status, size = 'sm' }: { status: VendorStatus; size?: 'sm' | 'md' } = $props();

	const styles: Record<VendorStatus, string> = {
		lead: 'badge-ghost',
		applied: 'badge-info',
		in_review: 'badge-warning',
		waitlisted: 'badge-secondary badge-outline',
		approved: 'badge-success',
		declined: 'badge-error badge-outline',
		suspended: 'badge-error'
	};
</script>

<span class={['badge whitespace-nowrap font-medium', size === 'sm' && 'badge-sm', styles[status]]}>
	{statusLabels[status]}
</span>
