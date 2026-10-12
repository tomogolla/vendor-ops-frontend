<script lang="ts">
  interface Props {
    /** Predefined list of market weekends to choose from */
    weekends?: string[];
    /** Currently selected weekends (bindable) */
    selected?: string[];
    /** Allow selecting more than one (default: true) */
    multiple?: boolean;
    /** Label shown above the field */
    label?: string;
    /** Placeholder text when nothing is selected */
    placeholder?: string;
    /** Disable the whole control */
    disabled?: boolean;
  }

  let {
    weekends = [
      "October 10 & 11",
      "October 17 & 18",
      "October 24 & 25",
      "October 31 & November 1",
      "November 7 & 8",
      "November 14 & 15",
      "November 21 & 22",
      "November 28 & 29",
      "December 5 & 6",
      "December 12 & 13",
      "December 19 & 20",
      "December 26 & 27",

    ],
    selected = $bindable([]),
    multiple = true,
    label = "Market Weekend",
    placeholder = "Select weekend(s)...",
    disabled = false,
  }: Props = $props();

  // Ensure `selected` is always an array for consistent handling
  $effect(() => {
    if (!Array.isArray(selected)) selected = [];
  });

  function isSelected(weekend: string) {
    return selected.includes(weekend);
  }

  function toggle(weekend: string) {
    if (disabled) return;

    if (multiple) {
      selected = isSelected(weekend)
        ? selected.filter((w) => w !== weekend)
        : [...selected, weekend];
    } else {
      selected = isSelected(weekend) ? [] : [weekend];
      closeDropdown();
    }
  }

  function clearAll(e: MouseEvent) {
    e.stopPropagation();
    selected = [];
  }

  function closeDropdown() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  // Display summary in the trigger
  let summary = $derived(
    selected.length === 0
      ? placeholder
      : multiple
        ? selected.length === 1
          ? selected[0]
          : `${selected.length} weekends selected`
        : selected[0]
  );
</script>

<div class="form-control w-full max-w-md">
  <label class="label">
    <span class="label-text text-sm font-semibold text-base-content/80">
      {label}
    </span>
    {#if multiple && selected.length > 0}
      <button
        type="button"
        class="label-text-alt link link-hover text-xs"
        onclick={clearAll}
        disabled={disabled}
      >
        Clear all
      </button>
    {/if}
  </label>

  <!-- DaisyUI dropdown -->
  <div class="dropdown w-full">
    <div
      tabindex={disabled ? -1 : 0}
      role="button"
      class="select select-bordered w-full flex items-center justify-between text-left
             {disabled ? 'select-disabled' : ''}"
      aria-disabled={disabled}
    >
      <span class={selected.length === 0 ? "text-base-content/50" : ""}>
        {summary}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 opacity-60"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>
    </div>

    <ul
      class="dropdown-content menu bg-base-100 rounded-box z-[1] mt-1 w-full
             max-h-72 overflow-y-auto p-2 shadow-lg border border-base-200"
    >
      {#if weekends.length === 0}
        <li class="px-3 py-2 text-xs text-base-content/50">
          No weekends available
        </li>
      {/if}

      {#each weekends as weekend (weekend)}
        <li>
          <button
            type="button"
            class="flex items-center gap-2 text-sm text-left"
            onclick={() => toggle(weekend)}
            disabled={disabled}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              class="{multiple ? 'checkbox' : 'radio'} checkbox-xs radio-xs"
              checked={isSelected(weekend)}
              tabindex="-1"
              readonly
            />
            <span class="flex-1">{weekend}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <!-- Selected chips (only in multi mode) -->
  {#if multiple && selected.length > 0}
    <div class="mt-2 flex flex-wrap gap-1">
      {#each selected as weekend (weekend)}
        <span class="badge badge-sm badge-primary gap-1">
          {weekend}
          <button
            type="button"
            class="hover:text-error"
            onclick={() => toggle(weekend)}
            aria-label="Remove {weekend}"
          >
            ✕
          </button>
        </span>
      {/each}
    </div>
  {/if}
</div>