<script lang="ts">
	import { vendorLabels, type VendorLabel } from '#lib/vendor-store.ts';

	let { label, size = 'sm' }: { label: VendorLabel; size?: 'sm' | 'md' } = $props();

	const styles: Record<VendorLabel, string> = {
		prospect: 'badge-ghost',
		active: 'badge-success',
		inactive: 'badge-neutral badge-outline',
		suspended: 'badge-error'
	};
</script>

<span class={['badge whitespace-nowrap font-medium', size === 'sm' && 'badge-sm', styles[label]]}>
	{vendorLabels[label] ?? label}
</span>
