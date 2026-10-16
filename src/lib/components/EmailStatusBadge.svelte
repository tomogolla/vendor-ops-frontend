<script lang="ts">
	import { emailStatusLabels, emailStatusStyles, type EmailStatus } from '#lib/emails.ts';

	let { status, size = 'sm' }: { status: EmailStatus; size?: 'sm' | 'md' } = $props();
</script>

<span class={['badge whitespace-nowrap font-medium', size === 'sm' && 'badge-sm', emailStatusStyles[status] ?? 'badge-ghost']}>
	{emailStatusLabels[status] ?? status}
</span>
