<script lang="ts" module>
	export type FormSection = 'status' | 'contact' | 'brand' | 'lead' | 'call' | 'compliance' | 'booking';
</script>

<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { tick, untrack } from 'svelte';
	import CallLogFields from '#lib/components/CallLogFields.svelte';
	import MarketWeekendSelect from '#lib/components/MarketWeekendSelect.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import {
		boothSizes,
		businessRegistration,
		categories,
		commitmentLevels,
		leadSources,
		liabilityInsurance
	} from '#lib/options.ts';
	import {
		emptyVendorInput,
		findDuplicates,
		normaliseEmail,
		normaliseCallLog,
		normaliseInstagram,
		statusLabels,
		toVendorInput,
		type CreatableStatus,
		type DuplicateMatch,
		type Vendor,
		type VendorInput
	} from '#lib/vendor-store.ts';
	import { requiredErrors, validateVendor, type FieldName } from '#lib/vendor-validation.ts';

	type Props = {
		mode: 'create' | 'edit';
		initial?: Vendor;
		/** Receives trimmed input; in create mode also the chosen starting status. */
		onsave: (input: VendorInput, status: CreatableStatus) => Promise<unknown> | void;
		/** Set a section to false to hide it, e.g. for a public application form. The call section defaults to create mode only. */
		fields?: Partial<Record<FormSection, boolean>>;
		cancelHref?: string;
	};

	let { mode, initial, onsave, fields = {}, cancelHref }: Props = $props();

	const uid = $props.id();
	const id = (name: string) => `${uid}-${name}`;
	const show = (section: FormSection) =>
		section === 'call' ? (fields.call ?? mode === 'create') : fields[section] !== false;
	const creatableStatuses: CreatableStatus[] = ['lead', 'applied'];

	const start = untrack(() => (initial ? toVendorInput(initial) : emptyVendorInput()));
	let form = $state(start);
	let tagsText = $state(start.tags.join(', '));
	let status = $state<CreatableStatus>('lead');
	const baseline = JSON.stringify([start, start.tags.join(', '), 'lead']);

	let formEl: HTMLFormElement | undefined = $state();
	let submitted = $state(false);
	let saving = $state(false);
	let saved = false;
	let saveError = $state('');
	let duplicates = $state<DuplicateMatch[]>([]);
	let warnedFor = $state<string | null>(null);

	const validationStatus = $derived(mode === 'edit' && initial ? initial.status : status);
	const required = $derived(new Set(Object.keys(requiredErrors(emptyVendorInput(), validationStatus))));
	const dirty = $derived(JSON.stringify([form, tagsText, status]) !== baseline);
	const errors = $derived(submitted ? validateVendor(payload(), validationStatus) : {});
	const duplicateKey = $derived(`${normaliseEmail(form.email)}|${normaliseInstagram(form.instagram)}`);
	const showDuplicates = $derived(duplicates.length > 0 && warnedFor === duplicateKey);
	const leadSourceOptions: readonly string[] = $derived(
		form.leadSource && !(leadSources as readonly string[]).includes(form.leadSource)
			? [...leadSources, form.leadSource]
			: leadSources
	);

	function payload(): VendorInput {
		const snapshot = $state.snapshot(form);
		const trimmed = Object.fromEntries(
			Object.entries(snapshot).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
		) as VendorInput;
		return {
			...trimmed,
			tags: tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
			call: normaliseCallLog(snapshot.call)
		};
	}

	const contactFields: FieldName[] = ['email', 'phone', 'instagram'];
	const invalid = (name: FieldName) =>
		Boolean(errors[name] || (errors.contact && contactFields.includes(name)));
	function describedBy(name: FieldName): string | undefined {
		const ids = [];
		if (errors[name]) ids.push(id(`${name}-error`));
		if (errors.contact && contactFields.includes(name)) ids.push(id('contact-error'));
		return ids.length ? ids.join(' ') : undefined;
	}
	const mark = (name: FieldName) => (required.has(name) ? ' *' : '');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;
		const input = payload();
		if (Object.keys(validateVendor(input, validationStatus)).length) {
			await tick();
			formEl?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			return;
		}
		if (warnedFor !== duplicateKey) {
			const matches = await findDuplicates({
				email: input.email,
				instagram: input.instagram,
				excludeId: initial?.id
			});
			if (matches.length) {
				duplicates = matches;
				warnedFor = duplicateKey;
				return;
			}
		}
		saving = true;
		saveError = '';
		saved = true;
		try {
			await onsave(input, status);
		} catch (error) {
			saved = false;
			saveError = error instanceof Error ? error.message : 'Could not save the vendor.';
		} finally {
			saving = false;
		}
	}

	beforeNavigate((navigation) => {
		if (!dirty || saved) return;
		if (navigation.type === 'leave') {
			navigation.cancel();
			return;
		}
		if (!confirm('You have unsaved changes. Leave this page without saving?')) navigation.cancel();
	});
</script>

{#snippet fieldError(name: FieldName)}
	{#if errors[name]}
		<p id={id(`${name}-error`)} class="text-error text-xs">{errors[name]}</p>
	{/if}
{/snippet}

<form bind:this={formEl} class="flex flex-col gap-4" novalidate onsubmit={handleSubmit}>
	{#if show('status')}
		<section class="card bg-base-100 border border-base-200 shadow-sm">
			<div class="card-body gap-3">
				<h2 class="card-title text-sm">Status</h2>
				{#if mode === 'create'}
					<div class="flex flex-col gap-1 max-w-xs">
						<label class="text-sm font-medium" for={id('status')}>Starting status</label>
						<select id={id('status')} class="input-line" bind:value={status}>
							{#each creatableStatuses as option (option)}
								<option value={option}>{statusLabels[option]}</option>
							{/each}
						</select>
						<p class="text-xs text-base-content/60">
							Leads only need a brand name and one way to reach them.
						</p>
					</div>
				{:else if initial}
					<div class="flex items-center gap-3">
						<StatusBadge status={initial.status} size="md" />
						<p class="text-xs text-base-content/60">Change status from the vendor profile.</p>
					</div>
				{/if}
			</div>
		</section>
	{/if}

	{#if show('contact')}
		<section class="card bg-base-100 border border-base-200 shadow-sm">
			<div class="card-body gap-4">
				<h2 class="card-title text-sm">Contact</h2>
				{#if errors.contact}
					<p id={id('contact-error')} class="text-error text-xs">{errors.contact}</p>
				{/if}
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('firstName')}>First name{mark('firstName')}</label>
						<input id={id('firstName')} class="input-line" autocomplete="given-name" bind:value={form.firstName} aria-invalid={invalid('firstName')} aria-describedby={describedBy('firstName')} />
						{@render fieldError('firstName')}
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('lastName')}>Last name{mark('lastName')}</label>
						<input id={id('lastName')} class="input-line" autocomplete="family-name" bind:value={form.lastName} aria-invalid={invalid('lastName')} aria-describedby={describedBy('lastName')} />
						{@render fieldError('lastName')}
					</div>
					<div class="flex flex-col gap-1 sm:col-span-2">
						<label class="text-sm font-medium" for={id('brandName')}>Brand name{mark('brandName')}</label>
						<input id={id('brandName')} class="input-line" autocomplete="organization" bind:value={form.brandName} aria-invalid={invalid('brandName')} aria-describedby={describedBy('brandName')} />
						{@render fieldError('brandName')}
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('email')}>Email{mark('email')}</label>
						<input id={id('email')} type="email" class="input-line" autocomplete="email" bind:value={form.email} aria-invalid={invalid('email')} aria-describedby={describedBy('email')} />
						{@render fieldError('email')}
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('phone')}>Phone{mark('phone')}</label>
						<input id={id('phone')} type="tel" class="input-line" autocomplete="tel" bind:value={form.phone} aria-invalid={invalid('phone')} aria-describedby={describedBy('phone')} />
						{@render fieldError('phone')}
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('instagram')}>Instagram</label>
						<input id={id('instagram')} class="input-line" placeholder="@brand" bind:value={form.instagram} aria-invalid={invalid('instagram')} aria-describedby={describedBy('instagram')} />
						{@render fieldError('instagram')}
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('website')}>Website</label>
						<input id={id('website')} type="url" class="input-line" placeholder="https://" autocomplete="url" bind:value={form.website} aria-invalid={invalid('website')} aria-describedby={describedBy('website')} />
						{@render fieldError('website')}
					</div>
				</div>
			</div>
		</section>
	{/if}

	{#if show('brand')}
		<section class="card bg-base-100 border border-base-200 shadow-sm">
			<div class="card-body gap-4">
				<h2 class="card-title text-sm">Brand</h2>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('category')}>Category{mark('category')}</label>
						<select id={id('category')} class="input-line" bind:value={form.category} aria-invalid={invalid('category')} aria-describedby={describedBy('category')}>
							<option value="">Choose a category</option>
							{#each categories as option (option)}
								<option value={option}>{option}</option>
							{/each}
						</select>
						{@render fieldError('category')}
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('commitmentLevel')}>Commitment level</label>
						<select id={id('commitmentLevel')} class="input-line" bind:value={form.commitmentLevel}>
							<option value="">Not answered</option>
							{#each commitmentLevels as option (option)}
								<option value={option}>{option}</option>
							{/each}
						</select>
					</div>
					<div class="flex flex-col gap-1 sm:col-span-2">
						<label class="text-sm font-medium" for={id('aboutBrand')}>About the brand</label>
						<textarea id={id('aboutBrand')} class="input-line" rows="3" bind:value={form.aboutBrand}></textarea>
					</div>
					<div class="flex flex-col gap-1 sm:col-span-2">
						<label class="text-sm font-medium" for={id('objectives')}>Objectives for joining The Good Flea</label>
						<textarea id={id('objectives')} class="input-line" rows="2" bind:value={form.objectives}></textarea>
					</div>
					<div class="flex flex-col gap-1 sm:col-span-2">
						<label class="text-sm font-medium" for={id('otherMarkets')}>Other markets</label>
						<input id={id('otherMarkets')} class="input-line" bind:value={form.otherMarkets} />
					</div>
				</div>
			</div>
		</section>
	{/if}

	{#if show('lead')}
		<section class="card bg-base-100 border border-base-200 shadow-sm">
			<div class="card-body gap-4">
				<h2 class="card-title text-sm">Lead details</h2>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('leadSource')}>Lead source</label>
						<select id={id('leadSource')} class="input-line" bind:value={form.leadSource}>
							<option value="">Unknown</option>
							{#each leadSourceOptions as option (option)}
								<option value={option}>{option}</option>
							{/each}
						</select>
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('tags')}>Tags</label>
						<input id={id('tags')} class="input-line" placeholder="VIP, Returning" bind:value={tagsText} aria-describedby={id('tags-hint')} />
						<p id={id('tags-hint')} class="text-xs text-base-content/60">Separate tags with commas.</p>
					</div>
					<div class="flex flex-col gap-1 sm:col-span-2">
						<label class="text-sm font-medium" for={id('notes')}>Notes</label>
						<textarea id={id('notes')} class="input-line" rows="3" bind:value={form.notes}></textarea>
					</div>
				</div>
			</div>
		</section>
	{/if}

	{#if show('call')}
		<section class="card bg-base-100 border border-base-200 shadow-sm">
			<div class="card-body gap-4">
				<div>
					<h2 class="card-title text-sm">Call</h2>
					<p class="text-xs text-base-content/60">
						Optional. Leave the outcome as "Not called yet" and this vendor shows up as a call task.
					</p>
				</div>
				<CallLogFields bind:value={form.call} idPrefix={id('call')} {errors} />
			</div>
		</section>
	{/if}

	{#if show('compliance')}
		<section class="card bg-base-100 border border-base-200 shadow-sm">
			<div class="card-body gap-4">
				<h2 class="card-title text-sm">Compliance</h2>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('businessRegistration')}>Business registration</label>
						<select id={id('businessRegistration')} class="input-line" bind:value={form.businessRegistration}>
							{#each businessRegistration as option (option)}
								<option value={option}>{option}</option>
							{/each}
						</select>
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('liabilityInsurance')}>General liability insurance</label>
						<select id={id('liabilityInsurance')} class="input-line" bind:value={form.liabilityInsurance}>
							{#each liabilityInsurance as option (option)}
								<option value={option}>{option}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</section>
	{/if}

	{#if show('booking')}
		<section class="card bg-base-100 border border-base-200 shadow-sm">
			<div class="card-body gap-4">
				<h2 class="card-title text-sm">Booking interest</h2>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium" for={id('proposedBoothSize')}>Proposed booth size</label>
						<select id={id('proposedBoothSize')} class="input-line" bind:value={form.proposedBoothSize}>
							<option value="">Not sure yet</option>
							{#each boothSizes as option (option)}
								<option value={option}>{option}</option>
							{/each}
						</select>
					</div>
					<div class="flex items-end">
						<label class="label cursor-pointer gap-2 text-sm text-base-content" for={id('needsTent')}>
							<input id={id('needsTent')} type="checkbox" class="checkbox checkbox-sm" bind:checked={form.needsTent} />
							Needs a tent
						</label>
					</div>
					<div class="sm:col-span-2">
						<MarketWeekendSelect bind:selected={form.requestedWeekends} label="Requested weekends" />
					</div>
				</div>
			</div>
		</section>
	{/if}

	{#if showDuplicates}
		<div role="alert" class="alert alert-warning flex flex-col items-start gap-2">
			<p class="font-semibold text-sm">
				{duplicates.length === 1 ? 'A vendor' : `${duplicates.length} vendors`} with the same
				email or Instagram already exist{duplicates.length === 1 ? 's' : ''}:
			</p>
			<ul class="list-disc pl-5 text-sm">
				{#each duplicates as match (match.vendor.id)}
					<li>
						<a class="link" href={`/vendors/${match.vendor.id}`} target="_blank" rel="noopener">
							{match.vendor.brandName}
						</a>
						<span class="text-xs">(same {match.matchedOn.join(' and ')})</span>
					</li>
				{/each}
			</ul>
			<p class="text-xs">Links open in a new tab so you don't lose this form.</p>
		</div>
	{/if}

	{#if saveError}
		<div role="alert" class="alert alert-error text-sm">{saveError}</div>
	{/if}

	<div class="flex justify-end gap-2">
		{#if cancelHref}
			<a href={cancelHref} class="btn btn-ghost btn-sm">Cancel</a>
		{/if}
		<button type="submit" class="btn btn-primary btn-sm" disabled={saving}>
			{#if showDuplicates}
				{mode === 'create' ? 'Create anyway' : 'Save anyway'}
			{:else}
				{mode === 'create' ? 'Create vendor' : 'Save changes'}
			{/if}
		</button>
	</div>
</form>
