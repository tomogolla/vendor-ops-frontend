<script lang="ts">
	import { ApiError } from '#lib/api.ts';
	import {
		explainSendingMode,
		sendingModeLabels,
		toTimeInput,
		updateEmailSettings,
		type EmailSettings,
		type EmailSettingsInput,
		type SendingMode
	} from '#lib/emails.ts';
	import { formatDateTime } from '#lib/format.ts';

	type Props = { settings: EmailSettings; isAdmin: boolean; onsaved: (settings: EmailSettings) => void };
	let { settings, isAdmin, onsaved }: Props = $props();

	type Form = Required<EmailSettingsInput>;
	const toForm = (value: EmailSettings): Form => ({
		sendingMode: value.sendingMode,
		redirectToEmail: value.redirectToEmail,
		senderName: value.senderName,
		senderEmail: value.senderEmail,
		replyToEmail: value.replyToEmail,
		businessTimezone: value.businessTimezone,
		sendWindowStart: toTimeInput(value.sendWindowStart),
		sendWindowEnd: toTimeInput(value.sendWindowEnd)
	});

	let editing = $state(false);
	// Filled from the current settings each time editing starts.
	let form = $state<Form>({ sendingMode: 'disabled', redirectToEmail: '', senderName: '', senderEmail: '', replyToEmail: '', businessTimezone: '', sendWindowStart: '', sendWindowEnd: '' });
	let busy = $state(false);
	let errors = $state<Record<string, string>>({});
	let error = $state('');
	let saved = $state('');

	const explanation = $derived(explainSendingMode(settings));
	const tone = { info: 'alert-info', warning: 'alert-warning', success: 'alert-success', error: 'alert-error' } as const;
	const modes: SendingMode[] = ['disabled', 'redirect', 'enabled'];
	const modeHelp: Record<SendingMode, string> = {
		disabled: 'Nothing is sent; approved emails wait in the queue.',
		redirect: "Every email goes to the team's test mailbox instead of the vendor.",
		enabled: 'Emails go to vendors (if the server configuration allows it).'
	};
	const apiNames: Record<keyof Form, string> = {
		sendingMode: 'sending_mode',
		redirectToEmail: 'redirect_to_email',
		senderName: 'sender_name',
		senderEmail: 'sender_email',
		replyToEmail: 'reply_to_email',
		businessTimezone: 'business_timezone',
		sendWindowStart: 'send_window_start',
		sendWindowEnd: 'send_window_end'
	};
	const fieldError = (key: keyof Form) => errors[apiNames[key]];

	function startEditing() {
		form = toForm(settings);
		errors = {};
		error = '';
		saved = '';
		editing = true;
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		const original = toForm(settings);
		const changes: EmailSettingsInput = {};
		for (const key of Object.keys(form) as (keyof Form)[]) {
			if (form[key] !== original[key]) (changes as Record<string, string>)[key] = form[key];
		}
		if (!Object.keys(changes).length) {
			editing = false;
			return;
		}
		if (changes.sendingMode === 'enabled' && !confirm('Enable sending? Vendors will start receiving queued and approved emails (if the server configuration allows it).')) return;
		busy = true;
		errors = {};
		error = '';
		try {
			const result = await updateEmailSettings(changes);
			editing = false;
			saved = 'Email settings saved.';
			onsaved(result);
		} catch (err) {
			// Kept: the form stays as typed so nothing has to be re-entered.
			errors = err instanceof ApiError ? err.fieldErrors : {};
			error = Object.keys(errors).length ? 'Please fix the highlighted fields.' : err instanceof Error ? err.message : 'The settings could not be saved.';
		} finally {
			busy = false;
		}
	}
</script>

<section class="flex flex-col gap-3" aria-labelledby="sending-heading">
	<h2 id="sending-heading" class="text-base font-semibold">Sending status</h2>

	<div role="status" class={['alert alert-soft flex flex-col items-start gap-1 text-sm', tone[explanation.tone]]}>
		<p class="font-semibold">{explanation.headline}</p>
		<p>{explanation.detail}</p>
	</div>
	{#if settings.notices.length}
		<ul class="flex flex-col gap-1 text-xs text-base-content/80" aria-label="Notices from the server">
			{#each settings.notices as notice (notice)}<li class="rounded-lg bg-base-200/60 px-2 py-1">{notice}</li>{/each}
		</ul>
	{/if}
	{#if saved}<p role="status" class="text-sm text-success">{saved}</p>{/if}

	{#if !editing}
		<dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
			<div><dt class="text-xs font-semibold text-base-content/70">Mode chosen here</dt><dd>{sendingModeLabels[settings.sendingMode]}</dd></div>
			<div>
				<dt class="text-xs font-semibold text-base-content/70">Mode in effect</dt>
				<dd>
					{sendingModeLabels[settings.effective.mode]}
					{#if settings.effective.mode !== settings.sendingMode}<span class="text-xs text-base-content/70">(limited by the server configuration)</span>{/if}
				</dd>
			</div>
			<div><dt class="text-xs font-semibold text-base-content/70">Sender</dt><dd>{settings.effective.senderName}{settings.effective.senderEmail ? ` <${settings.effective.senderEmail}>` : ' (no address configured)'}</dd></div>
			<div><dt class="text-xs font-semibold text-base-content/70">Reply-to</dt><dd>{settings.effective.replyToEmail || '—'}</dd></div>
			<div><dt class="text-xs font-semibold text-base-content/70">Redirect mailbox</dt><dd>{settings.effective.redirectToEmail || '—'}</dd></div>
			<div><dt class="text-xs font-semibold text-base-content/70">Business time zone</dt><dd>{settings.businessTimezone}</dd></div>
			<div><dt class="text-xs font-semibold text-base-content/70">Send window</dt><dd>{toTimeInput(settings.sendWindowStart)}–{toTimeInput(settings.sendWindowEnd)} every day</dd></div>
			<div>
				<dt class="text-xs font-semibold text-base-content/70">Daily limit</dt>
				<dd>{settings.environment.dailyLimit ? `${settings.environment.dailyRemaining ?? '—'} of ${settings.environment.dailyLimit} left today` : 'No limit'}</dd>
			</div>
			<div>
				<dt class="text-xs font-semibold text-base-content/70">Delivery service</dt>
				<dd>
					{settings.environment.provider}{settings.environment.providerConfigured ? '' : ' (not fully configured)'}
					{#if settings.environment.webhookConfigured === false}<span class="block text-xs text-warning-content">Delivery tracking is not set up.</span>{/if}
				</dd>
			</div>
			{#if settings.updatedAt}
				<div><dt class="text-xs font-semibold text-base-content/70">Last changed</dt><dd>{formatDateTime(settings.updatedAt)}{settings.updatedBy ? ` by ${settings.updatedBy.name}` : ''}</dd></div>
			{/if}
		</dl>
		<p class="text-xs text-base-content/60">
			Server values (the delivery service, the highest allowed mode and any fixed addresses) are set by whoever runs the server; they always win over the settings here. Keys and passwords are never shown.
		</p>
		{#if isAdmin}
			<div><button type="button" class="btn btn-sm btn-outline" onclick={startEditing}>Change settings</button></div>
		{:else}
			<p class="text-xs text-base-content/60">Only administrators can change these settings.</p>
		{/if}
	{:else}
		<form class="flex flex-col gap-3" onsubmit={save} novalidate>
			<fieldset class="flex flex-col gap-1">
				<legend class="mb-1 text-sm font-medium">Sending mode</legend>
				{#each modes as mode (mode)}
					<label class="flex cursor-pointer items-start gap-2 text-sm">
						<input type="radio" class="radio radio-sm mt-0.5" name="sending-mode" value={mode} bind:group={form.sendingMode} />
						<span><span class="font-medium">{sendingModeLabels[mode]}</span><span class="block text-xs text-base-content/70">{modeHelp[mode]}</span></span>
					</label>
				{/each}
				{#if fieldError('sendingMode')}<p class="text-xs text-error">{fieldError('sendingMode')}</p>{/if}
				{#if settings.environment.globalMode !== 'enabled'}
					<p class="text-xs text-base-content/70">The server configuration currently allows at most “{sendingModeLabels[settings.environment.globalMode]}”.</p>
				{/if}
			</fieldset>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{#each [['redirectToEmail', 'Redirect mailbox', 'email'], ['senderName', 'Sender name', 'text'], ['senderEmail', 'Sender address', 'email'], ['replyToEmail', 'Reply-to address', 'email'], ['businessTimezone', 'Business time zone', 'text'], ['sendWindowStart', 'Send window starts', 'time'], ['sendWindowEnd', 'Send window ends', 'time']] as [key, label, type] (key)}
					{@const name = key as keyof Form}
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={`email-setting-${key}`}>{label}</label>
						<input id={`email-setting-${key}`} class="input w-full" {type} bind:value={form[name]} aria-invalid={Boolean(fieldError(name))} />
						{#if fieldError(name)}<p class="text-xs text-error">{fieldError(name)}</p>{/if}
					</div>
				{/each}
			</div>
			<p class="text-xs text-base-content/60">Addresses set on the server replace the sender, reply-to and redirect addresses here. The time zone is an IANA name, e.g. America/New_York.</p>
			{#if error}<p role="alert" class="text-sm text-error">{error}</p>{/if}
			<div class="flex gap-2">
				<button type="button" class="btn btn-sm" onclick={() => (editing = false)} disabled={busy}>Cancel</button>
				<button type="submit" class="btn btn-sm btn-primary" disabled={busy}>
					{#if busy}<span class="loading loading-spinner loading-xs"></span>{/if}
					Save settings
				</button>
			</div>
		</form>
	{/if}
</section>
