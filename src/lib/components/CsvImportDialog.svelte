<script lang="ts">
	import { goto } from '$app/navigation';
	import { MAX_CSV_BYTES, sampleCsv } from '#lib/vendor-csv.ts';
	import {
		confirmImport,
		previewImport,
		type ImportClassification,
		type ImportPreview,
		type ImportResult
	} from '#lib/vendor-store.ts';

	let { onimported }: { onimported?: () => void } = $props();

	let dialog = $state<HTMLDialogElement>();
	let fileInput = $state<HTMLInputElement>();
	let file = $state<File | null>(null);
	let error = $state('');
	let preview = $state<ImportPreview | null>(null);
	let include = $state<number[]>([]);
	let busy = $state(false);
	let result = $state<ImportResult | null>(null);

	let sampleUrl = $state('');
	$effect(() => {
		const url = URL.createObjectURL(new Blob([sampleCsv()], { type: 'text/csv' }));
		sampleUrl = url;
		return () => URL.revokeObjectURL(url);
	});

	const sections: { kind: ImportClassification; title: string; tone: string }[] = [
		{ kind: 'new', title: 'New vendors (each gets an application at New)', tone: '' },
		{ kind: 'matched', title: 'Matched existing vendors (the application attaches to that vendor)', tone: '' },
		{ kind: 'possible_duplicate', title: 'Possible duplicates (skipped unless ticked)', tone: 'text-warning' },
		{ kind: 'skipped', title: 'Skipped', tone: 'text-base-content/60' },
		{ kind: 'invalid', title: 'Invalid rows', tone: 'text-error' }
	];
	const importCount = $derived((preview?.counts.new ?? 0) + (preview?.counts.matched ?? 0) + include.length);

	function reset() {
		file = null;
		error = '';
		preview = null;
		include = [];
		result = null;
		busy = false;
		if (fileInput) fileInput.value = '';
	}

	export function showModal() {
		reset();
		dialog?.showModal();
	}

	async function choose(event: Event) {
		const chosen = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
		error = '';
		preview = null;
		include = [];
		result = null;
		file = chosen;
		if (!chosen) return;
		if (chosen.size > MAX_CSV_BYTES) {
			error = 'That file is larger than 2 MB.';
			return;
		}
		busy = true;
		try {
			preview = await previewImport(chosen);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not read that file.';
		} finally {
			busy = false;
		}
	}

	async function confirm() {
		if (!file || !preview) return;
		busy = true;
		error = '';
		try {
			result = await confirmImport(file, include);
			onimported?.();
			await goto('/applications?source=CSV+import');
		} catch (err) {
			error = err instanceof Error ? err.message : 'The import failed. Nothing was saved.';
		} finally {
			busy = false;
		}
	}

	function flagText(flags: ImportPreview['rows'][number]['flags']) {
		const labels = [
			flags.already_contacted && 'already contacted',
			flags.inactive && 'inactive',
			flags.exclude_from_outreach && 'excluded from outreach'
		].filter(Boolean);
		return labels.length ? `No call task: ${labels.join(', ')}` : '';
	}
</script>

<dialog bind:this={dialog} class="modal" aria-labelledby="csv-import-title" onclose={reset}>
	<div class="modal-box max-w-3xl">
		<h2 id="csv-import-title" class="text-base font-bold">Import applications from CSV</h2>
		<p class="mt-1 text-xs text-base-content/60">
			Every row becomes an application at New. Each row needs a brand name and an email, phone or Instagram. Rows that
			match an existing vendor attach to that vendor (added to its open application if it has one). A discovery call
			task is created unless the row is marked already contacted, inactive or excluded from outreach. Tags are separated
			with <code>;</code>.
			<a class="link" href={sampleUrl} download="vendor-import-sample.csv">Download a sample CSV</a>
		</p>

		{#if result}
			<div role="status" class="alert alert-success mt-4 text-sm">
				<div>
					<p>
						{result.applicationsCreated} application{result.applicationsCreated === 1 ? '' : 's'} created at New
						{#if result.applicationsBundled}and {result.applicationsBundled} added to open applications{/if}.
					</p>
					<p class="text-xs">
						{result.created} new vendor{result.created === 1 ? '' : 's'} · {result.matched} matched to existing vendors ·
						{result.callTasksCreated} call task{result.callTasksCreated === 1 ? '' : 's'} created ·
						{result.skipped} skipped · {result.invalid} invalid
					</p>
				</div>
			</div>
			<div class="modal-action">
				<button type="button" class="btn btn-primary btn-sm" onclick={() => dialog?.close()}>Done</button>
			</div>
		{:else}
			<div class="mt-4 flex flex-col gap-1">
				<label class="text-sm font-medium" for="csv-import-file">CSV file</label>
				<input
					bind:this={fileInput}
					id="csv-import-file"
					type="file"
					accept=".csv,text/csv"
					class="file-input file-input-sm w-full max-w-md"
					aria-describedby="csv-import-hint"
					onchange={choose}
					disabled={busy}
				/>
				<p id="csv-import-hint" class="text-xs text-base-content/60">Max size 2 MB.</p>
			</div>

			{#if error}<p role="alert" class="mt-2 text-sm text-error">{error}</p>{/if}
			{#if busy && !preview}
				<p class="mt-3 flex items-center gap-2 text-sm text-base-content/60" role="status">
					<span class="loading loading-spinner loading-xs"></span> Checking rows…
				</p>
			{/if}

			{#if preview}
				<div class="mt-4 flex flex-col gap-4 text-sm">
					<p>
						<strong>{file?.name}</strong>: {preview.counts.new} new, {preview.counts.matched} matched,
						{preview.counts.possible_duplicate} possible duplicate{preview.counts.possible_duplicate === 1 ? '' : 's'},
						{preview.counts.skipped} skipped, {preview.counts.invalid} invalid.
					</p>
					{#if preview.ignoredHeaders.length}
						<p class="text-xs text-base-content/60">Ignored columns: {preview.ignoredHeaders.join(', ')}</p>
					{/if}

					{#each sections as section (section.kind)}
						{@const rows = preview.rows.filter((row) => row.classification === section.kind)}
						{#if rows.length}
							<section>
								<h3 class={['mb-1 font-semibold', section.tone]}>{section.title}</h3>
								<div class="max-h-56 overflow-auto rounded border border-base-200">
									<table class="table table-xs">
										<thead>
											<tr>
												{#if section.kind === 'possible_duplicate'}<th><span class="sr-only">Import</span></th>{/if}
												<th>Row</th><th>Brand</th><th>Contact</th><th>Details</th>
											</tr>
										</thead>
										<tbody>
											{#each rows as row (row.line)}
												<tr>
													{#if section.kind === 'possible_duplicate'}
														<td>
															<input
																type="checkbox"
																class="checkbox checkbox-xs"
																aria-label={`Import row ${row.line} as a new vendor`}
																bind:group={include}
																value={row.line}
															/>
														</td>
													{/if}
													<td>{row.line}</td>
													<td>{row.brandName || '—'}</td>
													<td>{[row.data.email, row.data.phone, row.data.instagram].filter(Boolean).join(' · ') || '—'}</td>
													<td class="text-xs">
														{row.reasons.join(' ')}
														{#each row.matches as match (match.vendor.id)}
															<a class="link ml-1" href={`/vendors/${match.vendor.id}`} target="_blank" rel="noopener">{match.vendor.brand_name}</a>
														{/each}
														{#if section.kind === 'new' && flagText(row.flags)}
															<span class="text-base-content/60">{flagText(row.flags)}</span>
														{/if}
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</section>
						{/if}
					{/each}
				</div>
			{/if}

			<div class="modal-action">
				<button type="button" class="btn btn-sm" onclick={() => dialog?.close()}>Cancel</button>
				<button type="button" class="btn btn-primary btn-sm" disabled={!preview || !importCount || busy} onclick={confirm}>
					{#if busy && preview}<span class="loading loading-spinner loading-xs"></span>{/if}
					Import {importCount} row{importCount === 1 ? '' : 's'}
				</button>
			</div>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button aria-label="Close">close</button></form>
</dialog>
