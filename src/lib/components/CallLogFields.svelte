<script lang="ts">
	import { MAX_CALL_ATTEMPTS, callOutcomes } from '#lib/options.ts';
	import type { CallLog } from '#lib/vendor-store.ts';
	import type { FieldErrors } from '#lib/vendor-validation.ts';

	type Props = {
		value: CallLog;
		/** Prefix for element ids so the fields can appear twice on a page. */
		idPrefix: string;
		errors?: FieldErrors;
	};
	let { value = $bindable(), idPrefix, errors = {} }: Props = $props();

	const id = (name: string) => `${idPrefix}-${name}`;

	// datetime-local works in local time without a zone; the store keeps ISO strings.
	function toLocalInput(iso: string | null): string {
		if (!iso) return '';
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return '';
		const offset = date.getTimezoneOffset() * 60_000;
		return new Date(date.getTime() - offset).toISOString().slice(0, 16);
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
		<label class="text-sm font-medium" for={id('callOutcome')}>Call outcome</label>
		<select id={id('callOutcome')} class="input-line" bind:value={value.callOutcome}>
			<option value="">Not called yet</option>
			{#each callOutcomes as outcome (outcome)}
				<option value={outcome}>{outcome}</option>
			{/each}
		</select>
	</div>
	<div class="flex flex-col gap-1">
		<label class="text-sm font-medium" for={id('lastCalledAt')}>Call time</label>
		<input
			id={id('lastCalledAt')}
			type="datetime-local"
			class="input-line"
			bind:value={() => toLocalInput(value.lastCalledAt), (local) => (value.lastCalledAt = fromLocalInput(local))}
			aria-describedby={id('lastCalledAt-hint')}
		/>
		<p id={id('lastCalledAt-hint')} class="text-xs text-base-content/60">Defaults to now when an outcome is saved.</p>
	</div>
	<div class="flex flex-col gap-1">
		<label class="text-sm font-medium" for={id('callAttempts')}>Call attempts (0–{MAX_CALL_ATTEMPTS})</label>
		<input
			id={id('callAttempts')}
			type="number"
			min="0"
			max={MAX_CALL_ATTEMPTS}
			step="1"
			class="input-line"
			bind:value={value.callAttempts}
			aria-invalid={Boolean(errors.callAttempts)}
			aria-describedby={errors.callAttempts ? id('callAttempts-error') : undefined}
		/>
		{#if errors.callAttempts}<p id={id('callAttempts-error')} class="text-error text-xs">{errors.callAttempts}</p>{/if}
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
			bind:value={value.interestLevel}
			aria-invalid={Boolean(errors.interestLevel)}
			aria-describedby={errors.interestLevel ? id('interestLevel-error') : undefined}
		/>
		{#if errors.interestLevel}<p id={id('interestLevel-error')} class="text-error text-xs">{errors.interestLevel}</p>{/if}
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
					bind:value={value[question.key]}
				></textarea>
			</div>
		{/each}
	{/each}
</div>
