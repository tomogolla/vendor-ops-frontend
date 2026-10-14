<script lang="ts">
	import { lineStatusLabels, type LineStatus } from '#lib/applications.ts';

	let { status }: { status: LineStatus } = $props();

	const styles: Record<LineStatus, string> = {
		REQUESTED: 'badge-info badge-outline',
		CONFIRMED: 'badge-success',
		WAITLISTED: 'badge-secondary badge-outline',
		DECLINED: 'badge-error badge-outline',
		CANCELLED: 'badge-ghost'
	};
</script>

<span class={['badge badge-sm whitespace-nowrap font-medium', styles[status]]}>{lineStatusLabels[status]}</span>
