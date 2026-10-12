<script lang="ts">
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { MAX_CSV_BYTES, previewVendorCsv, sampleCsv, type CsvPreview } from '#lib/vendor-csv.ts';
	import { importVendors, vendors } from '#lib/vendor-store.ts';

	let dialog: HTMLDialogElement | undefined = $state();
	let fileInput: HTMLInputElement | undefined = $state();
	let fileName = $state('');
	let error = $state('');
	let preview: CsvPreview | null = $state(null);
	let importing = $state(false);
	let imported: number | null = $state(null);

	let sampleUrl = $state('');
	$effect(() => {
		const url = URL.createObjectURL(new Blob([sampleCsv()], { type: 'text/csv' }));
		sampleUrl = url;
		return () => URL.revokeObjectURL(url);
	});

	function reset() {
		fileName = '';
		error = '';
		preview = null;
		imported = null;
		if (fileInput) fileInput.value = '';
	}

	export function showModal() {
		reset();
		dialog?.showModal();
	}

	async function choose(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		error = '';
		preview = null;
		imported = null;
		if (!file) return;
		fileName = file.name;
		if (file.size > MAX_CSV_BYTES) {
			error = 'That file is larger than 2 MB.';
			return;
		}
		try {
			preview = previewVendorCsv(await file.text(), get(vendors));
		} catch {
			error = 'Could not read that file as CSV.';
		}
	}

	async function confirmImport() {
		if (!preview?.toImport.length) return;
		importing = true;
		const created = await importVendors(preview.toImport.map((row) => row.input));
		importing = false;
		imported = created.length;
		await goto('/applications?status=lead');
	}
</script>

<dialog bind:this={dialog} class="modal" aria-labelledby="csv-import-title" onclose={reset}>
	<div class="modal-box max-w-3xl">
		<h2 id="csv-import-title" class="text-base font-bold">Import vendors from CSV</h2>
		<p class="mt-1 text-xs text-base-content/60">
			Each row needs a brand name and an email, phone or Instagram. Imported vendors start as leads.
			Tags are separated with <code>;</code>.
			<a class="link" href={sampleUrl} download="vendor-import-sample.csv">Download a sample CSV</a>
		</p>

		{#if imported !== null}
			<div role="status" class="alert alert-success mt-4 text-sm">
				Imported {imported} vendor{imported === 1 ? '' : 's'} as leads.
				{#if preview && (preview.duplicates.length || preview.invalid.length)}
					Skipped {preview.duplicates.length} duplicate{preview.duplicates.length === 1 ? '' : 's'} and
					{preview.invalid.length} invalid row{preview.invalid.length === 1 ? '' : 's'}.
				{/if}
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
				/>
				<p id="csv-import-hint" class="text-xs text-base-content/60">Max size 2 MB.</p>
			</div>

			{#if error}<p role="alert" class="mt-2 text-sm text-error">{error}</p>{/if}

			{#if preview}
				<div class="mt-4 flex flex-col gap-4 text-sm">
					<p>
						<strong>{fileName}</strong>: {preview.toImport.length} to import,
						{preview.duplicates.length} duplicate{preview.duplicates.length === 1 ? '' : 's'} skipped,
						{preview.invalid.length} invalid.
					</p>
					{#if preview.ignoredHeaders.length}
						<p class="text-xs text-base-content/60">Ignored columns: {preview.ignoredHeaders.join(', ')}</p>
					{/if}

					{#if preview.toImport.length}
						<section>
							<h3 class="mb-1 font-semibold">Rows to import</h3>
							<div class="max-h-56 overflow-auto rounded border border-base-200">
								<table class="table table-xs">
									<thead><tr><th>Row</th><th>Brand</th><th>Contact</th><th>Email</th><th>Instagram</th><th>Category</th></tr></thead>
									<tbody>
										{#each preview.toImport as row (row.line)}
											<tr>
												<td>{row.line}</td>
												<td>{row.input.brandName}</td>
												<td>{row.input.firstName} {row.input.lastName}</td>
												<td>{row.input.email || '—'}</td>
												<td>{row.input.instagram || '—'}</td>
												<td>{row.input.category || '—'}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</section>
					{/if}

					{#if preview.duplicates.length}
						<section>
							<h3 class="mb-1 font-semibold">Duplicates (skipped)</h3>
							<ul class="list-disc pl-5 text-xs">
								{#each preview.duplicates as row (row.line)}
									<li>Row {row.line}, {row.brandName}: {row.reason}</li>
								{/each}
							</ul>
						</section>
					{/if}

					{#if preview.invalid.length}
						<section>
							<h3 class="mb-1 font-semibold text-error">Invalid rows (skipped)</h3>
							<ul class="list-disc pl-5 text-xs">
								{#each preview.invalid as row (row.line)}
									<li>Row {row.line}, {row.brandName}: {row.reasons.join(' ')}</li>
								{/each}
							</ul>
						</section>
					{/if}
				</div>
			{/if}

			<div class="modal-action">
				<button type="button" class="btn btn-sm" onclick={() => dialog?.close()}>Cancel</button>
				<button
					type="button"
					class="btn btn-primary btn-sm"
					disabled={!preview?.toImport.length || importing}
					onclick={confirmImport}
				>
					Import {preview?.toImport.length ?? 0} vendor{preview?.toImport.length === 1 ? '' : 's'}
				</button>
			</div>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button aria-label="Close">close</button></form>
</dialog>
