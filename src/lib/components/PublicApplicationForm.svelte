<script lang="ts">
	import TurnstileWidget from '#lib/components/TurnstileWidget.svelte';
	import {
		CONSENT_TEXT,
		MAX_WEEKENDS,
		NOT_SURE,
		emptyForm,
		sizeWaitlisted,
		sizesFor,
		submitApplication,
		toApiApplication,
		validateForm,
		type ApplicationForm,
		type Attribution,
		type FormField,
		type PublicCatalog
	} from '#lib/public-application.ts';

	type Props = {
		catalog: PublicCatalog;
		/** The Turnstile site key, or null when the build has none (the form cannot be sent). */
		sitekey: string | null;
		attribution: Attribution;
		onreceived: () => void;
		onclosed: () => void;
	};
	let { catalog, sitekey, attribution, onreceived, onclosed }: Props = $props();

	let form = $state<ApplicationForm>(emptyForm());
	let errors = $state<Partial<Record<FormField, string>>>({});
	let message = $state('');
	let token = $state<string | null>(null);
	let submitting = $state(false);
	let widget: TurnstileWidget | undefined = $state();
	const id = $props.id();

	const sizes = $derived(sizesFor(catalog, form.weekendIds));
	const tooMany = $derived(form.weekendIds.length > MAX_WEEKENDS);

	// A size that is no longer offered on the chosen weekends is cleared.
	$effect(() => {
		if (form.boothSize && form.boothSize !== NOT_SURE && !sizes.some((size) => size.name === form.boothSize)) form.boothSize = '';
	});

	function toggleWeekend(weekendId: string, checked: boolean) {
		form.weekendIds = checked ? [...form.weekendIds, weekendId] : form.weekendIds.filter((item) => item !== weekendId);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (submitting) return;
		message = '';
		errors = validateForm(form);
		if (Object.keys(errors).length) {
			message = 'Please check the highlighted answers.';
			focusFirstError();
			return;
		}
		if (!sitekey) {
			message = 'The form cannot be sent right now. Please email us to apply.';
			return;
		}
		if (!token) {
			message = 'Please complete the verification check above the button.';
			return;
		}
		submitting = true;
		try {
			const outcome = await submitApplication(toApiApplication(form, token, attribution));
			if (outcome.kind === 'received') {
				onreceived();
				return;
			}
			if (outcome.kind === 'closed') {
				onclosed();
				return;
			}
			// Every other outcome keeps the answers. The token may have been used, so get a new one.
			widget?.reset();
			message = outcome.message;
			if (outcome.kind === 'invalid') {
				errors = outcome.fields;
				focusFirstError();
			}
		} finally {
			submitting = false;
		}
	}

	function focusFirstError() {
		requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
	}

	const fieldId = (name: string) => `${id}-${name}`;
	const describedBy = (name: FormField) => (errors[name] ? `${fieldId(name)}-error` : undefined);
	const dateRange = (start: string, end: string) => {
		const format = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
		return start === end ? format(start) : `${format(start)} – ${format(end)}`;
	};
</script>

{#snippet fieldError(name: FormField)}
	{#if errors[name]}<p id={`${fieldId(name)}-error`} class="text-sm text-error">{errors[name]}</p>{/if}
{/snippet}

<form class="flex flex-col gap-5" onsubmit={submit} novalidate aria-busy={submitting}>
	<fieldset class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<legend class="mb-2 text-base font-semibold">About you</legend>
		{#each [['first_name', 'firstName', 'First name', 'given-name', 'text'], ['last_name', 'lastName', 'Last name', 'family-name', 'text'], ['email', 'email', 'Email', 'email', 'email'], ['phone', 'phone', 'Phone', 'tel', 'tel'], ['brand_name', 'brandName', 'Brand or business name', 'organization', 'text'], ['instagram', 'instagram', 'Instagram', 'off', 'text']] as [name, key, label, autocomplete, type] (name)}
			{@const field = name as FormField}
			{@const prop = key as 'firstName' | 'lastName' | 'email' | 'phone' | 'brandName' | 'instagram'}
			<div class="flex flex-col gap-1">
				<label class="text-sm font-medium" for={fieldId(name)}>{label}</label>
				<input
					id={fieldId(name)}
					class="input w-full"
					{type}
					autocomplete={autocomplete as AutoFill}
					placeholder={name === 'instagram' ? '@yourbrand or instagram.com/yourbrand' : undefined}
					bind:value={form[prop]}
					aria-invalid={Boolean(errors[field])}
					aria-describedby={describedBy(field)}
					required
				/>
				{@render fieldError(field)}
			</div>
		{/each}
	</fieldset>

	<fieldset class="flex flex-col gap-2" aria-describedby={describedBy('weekend_ids')}>
		<legend class="mb-1 text-base font-semibold">Which market weekends?</legend>
		<p class="text-sm text-base-content/70">Choose every weekend you would like to join (up to {MAX_WEEKENDS}).</p>
		{#each catalog.weekends as weekend (weekend.id)}
			<label class="flex cursor-pointer items-start gap-3 rounded-lg border border-base-300 p-3 has-[:checked]:border-primary">
				<input
					type="checkbox"
					class="checkbox checkbox-sm mt-0.5"
					checked={form.weekendIds.includes(weekend.id)}
					onchange={(event) => toggleWeekend(weekend.id, event.currentTarget.checked)}
					aria-invalid={Boolean(errors.weekend_ids)}
				/>
				<span class="flex flex-col">
					<span class="font-medium">{weekend.label}</span>
					<span class="text-sm text-base-content/70">{dateRange(weekend.startDate, weekend.endDate)}</span>
					{#if weekend.waitlistOnly}
						<span class="text-xs text-base-content/70">All booths are taken; you can join the waitlist.</span>
					{/if}
				</span>
			</label>
		{:else}
			<p class="text-sm text-base-content/70">There are no market weekends open for applications right now.</p>
		{/each}
		{#if tooMany}<p class="text-sm text-error">Please choose at most {MAX_WEEKENDS} market weekends.</p>{/if}
		{@render fieldError('weekend_ids')}
	</fieldset>

	<fieldset class="flex flex-col gap-2" aria-describedby={describedBy('booth_size')}>
		<legend class="mb-1 text-base font-semibold">Booth size</legend>
		{#each sizes as size (size.name)}
			<label class="flex cursor-pointer items-center gap-3 text-sm">
				<input type="radio" class="radio radio-sm" name={fieldId('booth_size')} value={size.name} bind:group={form.boothSize} />
				<span>
					{size.name}{size.dimensions && size.dimensions !== size.name ? ` (${size.dimensions})` : ''}
					{#if sizeWaitlisted(catalog, form.weekendIds, size.name)}<span class="text-xs text-base-content/70"> · waitlist only</span>{/if}
				</span>
			</label>
		{/each}
		<label class="flex cursor-pointer items-center gap-3 text-sm">
			<input type="radio" class="radio radio-sm" name={fieldId('booth_size')} value={NOT_SURE} bind:group={form.boothSize} />
			Not sure yet
		</label>
		{@render fieldError('booth_size')}
	</fieldset>

	<!-- Honeypot for bots: hidden from people and assistive technology, never filled by a person. -->
	<div class="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
		<label for={fieldId('website')}>Website</label>
		<input id={fieldId('website')} name="website" type="text" tabindex="-1" autocomplete="off" bind:value={form.website} />
	</div>

	<div class="flex flex-col gap-1">
		<label class="flex cursor-pointer items-start gap-3 text-sm">
			<input type="checkbox" class="checkbox checkbox-sm mt-0.5" bind:checked={form.consent} aria-invalid={Boolean(errors.consent)} aria-describedby={describedBy('consent')} />
			<span>{CONSENT_TEXT}</span>
		</label>
		{@render fieldError('consent')}
	</div>

	{#if sitekey}
		<TurnstileWidget bind:this={widget} {sitekey} ontoken={(value) => (token = value)} />
	{:else}
		<p role="alert" class="alert alert-warning alert-soft text-sm">The form is not available right now. Please email us to apply.</p>
	{/if}

	{#if message}<p role="alert" class="alert alert-error alert-soft text-sm">{message}</p>{/if}

	<button type="submit" class="btn btn-primary w-full sm:w-auto sm:self-start" style="--p: 218 100% 34%; background-color: #004aad; border-color: #004aad;" disabled={submitting || !sitekey}>
		{#if submitting}<span class="loading loading-spinner loading-sm"></span> Sending…{:else}Send application{/if}
	</button>
	<p class="text-xs text-base-content/60">Protected by Cloudflare Turnstile. We only use your details to review your application.</p>
</form>
