<script lang="ts">
	import { previewDocument } from '#lib/emails.ts';

	type Props = { subject?: string; html: string; text: string; title?: string; height?: string };
	let { subject, html, text, title = 'Email preview', height = 'h-80' }: Props = $props();

	let view = $state<'html' | 'text'>('html');
	const id = $props.id();
</script>

<div class="flex flex-col gap-2">
	{#if subject !== undefined}
		<p class="text-sm"><span class="text-xs font-semibold text-base-content/70">Subject</span><br />{subject || '—'}</p>
	{/if}
	<div role="tablist" aria-label="Email format" class="tabs tabs-box tabs-xs w-fit">
		<button type="button" role="tab" id={`${id}-html`} aria-controls={`${id}-panel`} aria-selected={view === 'html'} class={['tab', view === 'html' && 'tab-active']} onclick={() => (view = 'html')}>Formatted</button>
		<button type="button" role="tab" id={`${id}-text`} aria-controls={`${id}-panel`} aria-selected={view === 'text'} class={['tab', view === 'text' && 'tab-active']} onclick={() => (view = 'text')}>Plain text</button>
	</div>
	<div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${view}`} class="rounded-lg border border-base-200 bg-white">
		{#if view === 'html'}
			<!-- Email HTML is untrusted: an empty sandbox (no scripts, forms, popups or navigation of the
			     app) plus a restrictive policy inside the document. Never rendered with {@html}. -->
			<iframe {title} sandbox="" referrerpolicy="no-referrer" srcdoc={previewDocument(html)} class={['w-full rounded-lg', height]}></iframe>
		{:else}
			<pre class={['overflow-auto whitespace-pre-wrap break-words p-3 font-sans text-sm text-gray-800', height]}>{text}</pre>
		{/if}
	</div>
</div>
