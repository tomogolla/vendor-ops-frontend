<script lang="ts">
	import {
		filterTemplates,
		isUnusedTemplate,
		templateCategories,
		templateModeHelp,
		templateModeLabels,
		type EmailTemplate,
		type TemplateFilters,
		type TemplateMode
	} from '#lib/emails.ts';
	import { formatDate } from '#lib/format.ts';

	type Props = { templates: readonly EmailTemplate[]; isAdmin: boolean; href: (template: EmailTemplate) => string };
	let { templates, isAdmin, href }: Props = $props();

	let filters = $state<TemplateFilters>({ search: '', category: '', mode: '' });
	const shown = $derived(filterTemplates(templates, filters));
	const categories = $derived(templateCategories(templates));
	const modeStyles: Record<TemplateMode, string> = { off: 'badge-ghost', draft: 'badge-warning', auto: 'badge-error' };
</script>

<section class="flex flex-col gap-2" aria-labelledby="templates-heading">
	<div class="flex flex-wrap items-end justify-between gap-2">
		<div>
			<h2 id="templates-heading" class="text-base font-semibold">Templates</h2>
			<p class="text-xs text-base-content/70">
				Off: nothing is prepared. Draft: the team reviews each email. Auto: sent without review.
			</p>
		</div>
		<div class="flex flex-wrap items-end gap-2" role="search" aria-label="Filter templates">
			<label class="flex flex-col gap-0.5 text-xs">
				<span class="font-semibold text-base-content/70">Search</span>
				<input type="search" class="input input-sm w-44" bind:value={filters.search} placeholder="Name or purpose" />
			</label>
			<label class="flex flex-col gap-0.5 text-xs">
				<span class="font-semibold text-base-content/70">Category</span>
				<select class="select select-sm" bind:value={filters.category}>
					<option value="">All</option>
					{#each categories as category (category)}<option value={category}>{category}</option>{/each}
				</select>
			</label>
			<label class="flex flex-col gap-0.5 text-xs">
				<span class="font-semibold text-base-content/70">Mode</span>
				<select class="select select-sm" bind:value={filters.mode}>
					<option value="">All</option>
					{#each Object.entries(templateModeLabels) as [value, label] (value)}<option {value}>{label}</option>{/each}
				</select>
			</label>
		</div>
	</div>

	<div class="overflow-x-auto rounded-lg border border-base-200">
		<table class="table table-sm w-full">
			<thead class="bg-base-300 text-xs font-semibold uppercase tracking-wider text-slate-500">
				<tr><th>Template</th><th>Category</th><th>Mode</th><th>Updated</th><th><span class="sr-only">Actions</span></th></tr>
			</thead>
			<tbody>
				{#each shown as template (template.key)}
					<tr class="hover">
						<td>
							<a href={href(template)} class="font-medium hover:underline">{template.name}</a>
							{#if isUnusedTemplate(template.key)}<span class="badge badge-xs badge-ghost ml-1" title="No workflow prepares this email yet">Not used yet</span>{/if}
							<p class="text-xs text-base-content/70">{template.description}</p>
						</td>
						<td class="whitespace-nowrap capitalize">{template.category}</td>
						<td><span class={['badge badge-sm', modeStyles[template.mode]]} title={templateModeHelp[template.mode]}>{templateModeLabels[template.mode]}</span></td>
						<td class="whitespace-nowrap text-xs">{formatDate(template.updatedAt)}{template.updatedBy ? ` · ${template.updatedBy.name}` : ''}</td>
						<td class="text-right"><a href={href(template)} class="btn btn-xs">{isAdmin ? 'Edit' : 'View'}<span class="sr-only">{` ${template.name}`}</span></a></td>
					</tr>
				{:else}
					<tr><td colspan="5" class="py-6 text-center text-sm text-base-content/60">No templates match these filters.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
