<script lang="ts">
    import type { Column, Table } from "@tanstack/svelte-table";
    import DebouncedInput from "./DebouncedInput.svelte";

    export let column: Column<any, unknown>;
    export let table: Table<any>;

    const firstValue = table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id);
    const columnFilterValue = column.getFilterValue();

    $: sortedUniqueValues =
        typeof firstValue === "number" ? [] : Array.from(column.getFacetedUniqueValues().keys()).sort();
</script>

{#if typeof firstValue == "number"}
    <div>
        <div class="flex space-x-2">
            <DebouncedInput
                type="number"
                min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
                max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
                value={columnFilterValue?.[0] ?? ""}
                on:change={(value) => column.setFilterValue((old) => [value.detail, old?.[1]])}
                placeholder={`Min ${
                    column.getFacetedMinMaxValues()?.[0] ? `(${column.getFacetedMinMaxValues()?.[0]})` : ""
                }`}
                class="w-24 border shadow rounded" />
            <DebouncedInput
                type="number"
                min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
                max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
                value={columnFilterValue?.[1] ?? ""}
                on:change={(value) => column.setFilterValue((old) => [old?.[0], value.detail])}
                placeholder={`Max ${
                    column.getFacetedMinMaxValues()?.[1] ? `(${column.getFacetedMinMaxValues()?.[1]})` : ""
                }`}
                class="w-24 border shadow rounded" />
        </div>
        <div class="h-1" />
    </div>
{:else}
    <datalist id={column.id + "list"}>
        {#each sortedUniqueValues.slice(0, 5000) as value}
            <option {value} />
        {/each}
    </datalist>
    <DebouncedInput
        type="text"
        value={String(columnFilterValue ?? "")}
        on:change={(value) => column.setFilterValue(value.detail)}
        placeholder={`Search... (${column.getFacetedUniqueValues().size})`}
        class="w-36 border shadow rounded"
        list={column.id + "list"} />
    <div class="h-1" />
{/if}
