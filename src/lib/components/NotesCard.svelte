<script lang="ts">
	import { untrack } from 'svelte';
	import { formatDateTime } from '#lib/format.ts';
	import { Resource } from '#lib/resource.svelte.ts';
	import { addNote, listNotes, type InternalNote, type NoteType } from '#lib/vendor-store.ts';

	let { vendorId, onadded }: { vendorId: string; onadded?: () => void } = $props();

	const noteTypes: { value: NoteType; label: string }[] = [
		{ value: 'GENERAL', label: 'General' },
		{ value: 'LEAD_INTAKE', label: 'Lead intake' },
		{ value: 'DISCOVERY_CALL', label: 'Discovery call' },
		{ value: 'QUALIFICATION', label: 'Qualification' },
		{ value: 'APPLICATION_REVIEW', label: 'Application review' }
	];
	const labelFor = (type: NoteType) => noteTypes.find((item) => item.value === type)?.label ?? type;

	const notes = new Resource<InternalNote[]>();
	untrack(() => notes.load(() => listNotes(vendorId)));

	let body = $state('');
	let noteType = $state<NoteType>('GENERAL');
	let saving = $state(false);
	let error = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		if (!body.trim()) {
			error = 'Write a note first.';
			return;
		}
		saving = true;
		try {
			const note = await addNote(vendorId, body.trim(), noteType);
			notes.data = [note, ...(notes.data ?? [])];
			body = '';
			onadded?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not save the note.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="card bg-base-100 w-full shadow-sm border border-base-200 overflow-hidden">
	<div class="card-body gap-3">
		<h4 class="text-xs font-bold">INTERNAL NOTES</h4>
		<form class="flex flex-col gap-2" novalidate onsubmit={submit}>
			<label class="sr-only" for={`note-type-${vendorId}`}>Note type</label>
			<select id={`note-type-${vendorId}`} class="input-line" bind:value={noteType}>
				{#each noteTypes as type (type.value)}<option value={type.value}>{type.label}</option>{/each}
			</select>
			<label class="sr-only" for={`note-body-${vendorId}`}>Note</label>
			<textarea
				id={`note-body-${vendorId}`}
				class="input-line"
				rows="2"
				placeholder="Add an internal note"
				bind:value={body}
				aria-invalid={Boolean(error)}
			></textarea>
			{#if error}<p role="alert" class="text-xs text-error">{error}</p>{/if}
			<button type="submit" class="btn btn-xs btn-outline self-end" disabled={saving}>Add note</button>
		</form>
		{#if notes.error}
			<p role="alert" class="text-xs text-error">{notes.error.message} <button type="button" class="link" onclick={notes.retry}>Retry</button></p>
		{:else if notes.data}
			<ul class="flex flex-col gap-2">
				{#each notes.data as note (note.id)}
					<li class="border-l-2 border-base-300 pl-3">
						<p class="text-xs whitespace-pre-line">{note.body}</p>
						<p class="text-[11px] text-base-content/60">
							{labelFor(note.noteType)} · {note.author?.name ?? 'Unknown'} · {formatDateTime(note.createdAt)}
						</p>
					</li>
				{:else}
					<li class="text-xs text-base-content/60">No notes yet.</li>
				{/each}
			</ul>
		{:else}
			<p class="text-xs text-base-content/60">Loading notes…</p>
		{/if}
	</div>
</div>
