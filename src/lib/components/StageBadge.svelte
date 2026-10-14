<script lang="ts">
	import { stageLabels, type Stage } from '#lib/applications.ts';

	let { stage, size = 'sm' }: { stage: Stage; size?: 'sm' | 'md' } = $props();

	const styles: Record<Stage, string> = {
		NEW: 'badge-info',
		IN_REVIEW: 'badge-warning',
		AWAITING_PAYMENT: 'badge-secondary',
		WON: 'badge-success',
		DECLINED: 'badge-error badge-outline',
		WITHDRAWN: 'badge-ghost'
	};
</script>

<span class={['badge whitespace-nowrap font-medium', size === 'sm' && 'badge-sm', styles[stage]]}>
	{stageLabels[stage]}
</span>
