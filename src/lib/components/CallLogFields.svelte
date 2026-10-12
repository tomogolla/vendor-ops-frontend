<script lang="ts">
	import { callOutcomes } from '#lib/options.ts';
	import type { CallInput } from '#lib/vendor-store.ts';
	import type { FieldErrors } from '#lib/vendor-validation.ts';

	type Props = {
		value: CallInput;
		/** Prefix for element ids so the fields can appear twice on a page. */
		idPrefix: string;
		errors?: FieldErrors;
		emptyOutcomeLabel?: string;
	};
	let { value = $bindable(), idPrefix, errors = {}, emptyOutcomeLabel = 'Choose an outcome' }: Props = $props();

	const id = (name: string) => `${idPrefix}-${name}`;

	// datetime-local works in local time without a zone; the API takes ISO strings.
	function toLocalInput(iso: string | null): string {
		if (!iso) return '';
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return '';
		return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
	}
	const fromLocalInput = (local: string) => (local ? new Date(local).toISOString() : null);

	const scriptQuestions = [
		{
			heading: 'Pain points & application follow-up',
			fields: [
				{ key: 'challenges', label: 'Challenges or roadblocks during/after applying', placeholder: 'Add challenges or roadblocks' },
				{ key: 'locationPainPoints', label: 'Location / foot-traffic pain points', placeholder: 'Add location / foot-traffic pain points' },
				{ key: 'revenueConsistency', label: 'Revenue consistency', placeholder: 'Are they looking for predictable weekly revenue?' }
			]
		},
		{
			heading: 'Pitching the offer',
			fields: [
				{ key: 'vendorReaction', label: 'Vendor reaction & interest', placeholder: 'Note their reaction to the offer' },
				{ key: 'objectionNotes', label: 'Concerns or objections', placeholder: 'Notes on concerns or objections regarding the offer' }
			]
		}
	] as const;
</script>

<div class="grid gap-4 sm:grid-cols-2">
	<div class="flex flex-col gap-1">
		<label class="text-sm font-medium" for={id('outcome')}>Call outcome</label>
		<select
			id={id('outcome')}
			class="input-line"
			bind:value={value.outcome}
			aria-invalid={Boolean(errors.outcome)}
			aria-describedby={errors.outcome ? id('outcome-error') : undefined}
		>
			<option value="">{emptyOutcomeLabel}</option>
			{#each callOutcomes as outcome (outcome)}
				<option value={outcome}>{outcome}</option>
			{/each}
		</select>
		{#if errors.outcome}<p id={id('outcome-error')} class="text-error text-xs">{errors.outcome}</p>{/if}
	</div>
	<div class="flex flex-col gap-1">
		<label class="text-sm font-medium" for={id('interestLevel')}>Interest level (0–5)</label>
		<input
			id={id('interestLevel')}
			type="number"
			min="0"
			max="5"
			step="1"
			class="input-line"
			placeholder="Not rated"
			bind:value={value.details.interestLevel}
			aria-invalid={Boolean(errors.interestLevel)}
			aria-describedby={errors.interestLevel ? id('interestLevel-error') : undefined}
		/>
		{#if errors.interestLevel}<p id={id('interestLevel-error')} class="text-error text-xs">{errors.interestLevel}</p>{/if}
	</div>
	{#if value.outcome === 'Callback Requested'}
		<div class="flex flex-col gap-1">
			<label class="text-sm font-medium" for={id('callbackAt')}>Call back at</label>
			<input
				id={id('callbackAt')}
				type="datetime-local"
				class="input-line"
				bind:value={() => toLocalInput(value.callbackAt), (local) => (value.callbackAt = fromLocalInput(local))}
				aria-invalid={Boolean(errors.callbackAt)}
				aria-describedby={errors.callbackAt ? id('callbackAt-error') : undefined}
			/>
			{#if errors.callbackAt}<p id={id('callbackAt-error')} class="text-error text-xs">{errors.callbackAt}</p>{/if}
		</div>
	{/if}
	<div class="flex flex-col gap-1 sm:col-span-2">
		<label class="text-sm font-medium" for={id('notes')}>Call notes</label>
		<textarea id={id('notes')} class="input-line" rows="2" bind:value={value.notes}></textarea>
	</div>

	{#each scriptQuestions as group (group.heading)}
		<h3 class="col-span-full mt-2 text-xs font-bold uppercase tracking-wide text-base-content/60">{group.heading}</h3>
		{#each group.fields as question (question.key)}
			<div class="flex flex-col gap-1 sm:col-span-2">
				<label class="text-sm font-medium" for={id(question.key)}>{question.label}</label>
				<textarea
					id={id(question.key)}
					class="input-line"
					rows="2"
					placeholder={question.placeholder}
					bind:value={value.details[question.key]}
				></textarea>
			</div>
		{/each}
	{/each}
</div>
