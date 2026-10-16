<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { Page } from '#lib/api.ts';
	import AsyncState from '#lib/components/AsyncState.svelte';
	import EmailList from '#lib/components/EmailList.svelte';
	import EmailSendingSettings from '#lib/components/EmailSendingSettings.svelte';
	import EmailTemplateTable from '#lib/components/EmailTemplateTable.svelte';
	import {
		EMAIL_BUCKETS,
		SETTINGS_EMAILS_HREF,
		emailBuckets,
		emailsTabHref,
		getEmailSettings,
		isEmailBucket,
		listMessages,
		listTemplates,
		messageOrderingLabels,
		type EmailMessage,
		type EmailSettings,
		type EmailTemplate,
		type MessageOrdering
	} from '#lib/emails.ts';
	import { Resource } from '#lib/resource.svelte.ts';
	import { session } from '#lib/session.svelte.ts';

	type Tab = 'sending' | 'templates' | 'messages';
	const tabs: { key: Tab; label: string }[] = [
		{ key: 'sending', label: 'Sending' },
		{ key: 'templates', label: 'Templates' },
		{ key: 'messages', label: 'Messages' }
	];
	const params = $derived(page.url.searchParams);
	const tab = $derived<Tab>(tabs.find((item) => item.key === params.get('tab'))?.key ?? 'sending');

	const settings = new Resource<EmailSettings>();
	const templates = new Resource<EmailTemplate[]>();
	const messages = new Resource<Page<EmailMessage>>();
	$effect(() => {
		settings.load(getEmailSettings);
	});
	$effect(() => {
		templates.load(listTemplates);
	});

	// Message log filters live in the URL, so Overview cards can link straight to a bucket.
	const bucket = $derived(isEmailBucket(params.get('bucket')) ? params.get('bucket') : '');
	const template = $derived(params.get('template') ?? '');
	const search = $derived(params.get('search') ?? '');
	const ordering = $derived((params.get('ordering') as MessageOrdering) in messageOrderingLabels ? (params.get('ordering') as MessageOrdering) : '-created_at');
	const pageNumber = $derived(Math.max(1, Number(params.get('page')) || 1));
	let searchText = $state('');
	$effect(() => {
		searchText = search;
	});

	$effect(() => {
		if (tab !== 'messages') return;
		const query = { bucket: isEmailBucket(bucket) ? bucket : undefined, template: template || undefined, search, ordering, page: pageNumber };
		messages.load(() => listMessages(query));
	});

	function messagesHref(patch: Record<string, string | number>) {
		const next = new URLSearchParams(params.toString());
		next.set('tab', 'messages');
		if (!('page' in patch)) next.delete('page');
		for (const [key, value] of Object.entries(patch)) {
			if (value === '' || value === 1) next.delete(key);
			else next.set(key, String(value));
		}
		return `${SETTINGS_EMAILS_HREF}?${next}`;
	}
	const filter = (patch: Record<string, string | number>) => goto(messagesHref(patch), { reset: false });
	const messageHref = (message: EmailMessage) =>
		message.applicationId ? emailsTabHref(message.applicationId, { email: message.id }) : message.vendor ? `/vendors/${message.vendor.id}` : '#';
</script>

<svelte:head><title>Email settings · Vendor Ops</title></svelte:head>

<div class="flex flex-col gap-3">
	<header class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<p class="text-xs text-base-content/60">Settings</p>
			<h1 class="text-lg font-bold">Emails</h1>
		</div>
		<nav aria-label="Email settings sections" class="tabs tabs-box tabs-sm">
			{#each tabs as item (item.key)}
				<a href={`${SETTINGS_EMAILS_HREF}?tab=${item.key}`} class={['tab', tab === item.key && 'tab-active']} aria-current={tab === item.key ? 'page' : undefined}>{item.label}</a>
			{/each}
		</nav>
	</header>

	<div class="card bg-base-100 border border-base-200 shadow-sm">
		<div class="card-body p-4">
			{#if tab === 'sending'}
				<AsyncState resource={settings} label="Loading email settings…">
					{#snippet children(value)}
						<EmailSendingSettings settings={value} isAdmin={session.isAdmin} onsaved={(next) => (settings.data = next)} />
					{/snippet}
				</AsyncState>
			{:else if tab === 'templates'}
				<AsyncState resource={templates} label="Loading templates…">
					{#snippet children(list)}
						<EmailTemplateTable templates={list} isAdmin={session.isAdmin} href={(item) => `${SETTINGS_EMAILS_HREF}/templates/${item.key}`} />
					{/snippet}
				</AsyncState>
			{:else}
				<section class="flex flex-col gap-3" aria-labelledby="messages-heading">
					<div>
						<h2 id="messages-heading" class="text-base font-semibold">Messages</h2>
						<p class="text-xs text-base-content/70">Every email the system has prepared, newest first. Open one to review it on its application.</p>
					</div>
					<div class="flex flex-wrap items-end gap-2" role="group" aria-label="Filter messages">
						<label class="flex flex-col gap-0.5 text-xs">
							<span class="font-semibold text-base-content/70">Status</span>
							<select class="select select-sm" value={bucket} onchange={(event) => filter({ bucket: event.currentTarget.value })}>
								<option value="">All</option>
								{#each EMAIL_BUCKETS as key (key)}<option value={key}>{emailBuckets[key].label}</option>{/each}
							</select>
						</label>
						<label class="flex flex-col gap-0.5 text-xs">
							<span class="font-semibold text-base-content/70">Template</span>
							<select class="select select-sm" value={template} onchange={(event) => filter({ template: event.currentTarget.value })}>
								<option value="">All</option>
								{#each templates.data ?? [] as item (item.key)}<option value={item.key}>{item.name}</option>{/each}
							</select>
						</label>
						<label class="flex flex-col gap-0.5 text-xs">
							<span class="font-semibold text-base-content/70">Sort</span>
							<select class="select select-sm" value={ordering} onchange={(event) => filter({ ordering: event.currentTarget.value === '-created_at' ? '' : event.currentTarget.value })}>
								{#each Object.entries(messageOrderingLabels) as [value, label] (value)}<option {value}>{label}</option>{/each}
							</select>
						</label>
						<form role="search" class="flex items-end gap-1" onsubmit={(event) => { event.preventDefault(); filter({ search: searchText.trim() }); }}>
							<label class="flex flex-col gap-0.5 text-xs">
								<span class="font-semibold text-base-content/70">Search</span>
								<input type="search" class="input input-sm w-48" bind:value={searchText} placeholder="Subject, address or brand" />
							</label>
							<button type="submit" class="btn btn-sm">Search</button>
						</form>
					</div>
					{#if bucket}<p class="text-xs text-base-content/70">{emailBuckets[bucket as keyof typeof emailBuckets].hint}.</p>{/if}
					<AsyncState resource={messages} label="Loading messages…">
						{#snippet children(result)}
							<EmailList messages={result.results} href={messageHref} showVendor empty="No emails match these filters." />
							{#if result.previous || result.next}
								<nav class="flex items-center justify-between text-xs" aria-label="Message pages">
									<span class="text-base-content/60">{result.count} emails · page {pageNumber}</span>
									<span class="flex gap-1">
										<a class={['btn btn-xs', !result.previous && 'btn-disabled']} aria-disabled={!result.previous} href={messagesHref({ page: pageNumber - 1 })}>Previous</a>
										<a class={['btn btn-xs', !result.next && 'btn-disabled']} aria-disabled={!result.next} href={messagesHref({ page: pageNumber + 1 })}>Next</a>
									</span>
								</nav>
							{/if}
						{/snippet}
					</AsyncState>
				</section>
			{/if}
		</div>
	</div>
</div>
