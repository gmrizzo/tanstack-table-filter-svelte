<script lang="ts">
    import { rankItem, compareItems } from "@tanstack/match-sorter-utils";
    import {
        type FilterFn,
        type SortingFn,
        sortingFns,
        type ColumnFiltersState,
        createSvelteTable,
        getCoreRowModel,
        getFacetedMinMaxValues,
        getFacetedRowModel,
        getFacetedUniqueValues,
        getFilteredRowModel,
        getPaginationRowModel,
        getSortedRowModel,
        type ColumnDef,
        type TableOptions,
    } from "@tanstack/svelte-table";
    import { makeData, type Person } from "$lib/makeData";
    import { onMount } from "svelte";
    import { each } from "svelte/internal";
    import { writable } from "svelte/store";
    import { flexRender } from "$lib/flexRenderer";
    import { SORTASCICON, SORTDESCICON, SORTICON } from "$lib/constants";
    import DebouncedInput from "$lib/cmpt/DebouncedInput.svelte";
    import Filter from "$lib/cmpt/Filter.svelte";

    const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
        // Rank the item
        const itemRank = rankItem(row.getValue(columnId), value);

        // Store the itemRank info
        addMeta({
            itemRank,
        });

        // Return if the item should be filtered in/out
        return itemRank.passed;
    };

    const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
        let dir = 0;

        // Only sort by rank if the column has ranking information
        if (rowA.columnFiltersMeta[columnId]) {
            dir = compareItems(
                rowA.columnFiltersMeta[columnId]?.itemRank!,
                rowB.columnFiltersMeta[columnId]?.itemRank!
            );
        }

        // Provide an alphanumeric fallback for when the item ranks are equal
        return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
    };

    let columnFilters: ColumnFiltersState = [];
    function setColumnFilters(value) {
        columnFilters = value;
    }

    let globalFilter: string = "";
    function setGlobalFilter(value) {
        globalFilter = value;
    }

    let columns: ColumnDef<Person, any>[] = [
        {
            header: "Name",
            footer: (props) => props.column.id,
            columns: [
                {
                    accessorKey: "firstName",
                    cell: (info) => info.getValue(),
                    footer: (props) => props.column.id,
                },
                {
                    accessorFn: (row) => row.lastName,
                    id: "lastName",
                    cell: (info) => info.getValue(),
                    header: "Last Name",
                    footer: (props) => props.column.id,
                },
                {
                    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
                    id: "fullName",
                    header: "Full Name",
                    cell: (info) => info.getValue(),
                    footer: (props) => props.column.id,
                    filterFn: "fuzzy",
                    sortingFn: fuzzySort,
                },
            ],
        },
        {
            header: "Info",
            footer: (props) => props.column.id,
            columns: [
                {
                    accessorKey: "age",
                    header: () => "Age",
                    footer: (props) => props.column.id,
                },
                {
                    header: "More Info",
                    columns: [
                        {
                            accessorKey: "visits",
                            header: "Visits",
                            footer: (props) => props.column.id,
                        },
                        {
                            accessorKey: "status",
                            header: "Status",
                            footer: (props) => props.column.id,
                        },
                        {
                            accessorKey: "progress",
                            header: "Profile Progress",
                            footer: (props) => props.column.id,
                        },
                    ],
                },
            ],
        },
    ];

    export function rerender() {
        options.update((options) => ({
            ...options,
            data: data,
        }));
    }

    let data: Person[] = makeData(50000);
    function setData(value) {
        data = value;
    }

    function refreshData() {
        setData(makeData(50000));
    }

    const options = writable<TableOptions<Person>>({
        data,
        columns,
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        state: {
            columnFilters,
            globalFilter,
        },
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        debugTable: true,
        debugHeaders: true,
        debugColumns: false,
    });

    const table = createSvelteTable(options);

    $: {
        console.log("$table.getState()", $table);
        if ($table.getState().columnFilters[0]?.id === "fullName") {
            if ($table.getState().sorting[0]?.id !== "fullName") {
                $table.setSorting([{ id: "fullName", desc: false }]);
            }
        }
    }
</script>

<div class="p-2">
    <div>
        <DebouncedInput
            value={globalFilter ?? ""}
            on:change={(value) => setGlobalFilter(String(value.detail))}
            class="p-2 font-lg shadow border border-block"
            placeholder="Search all columns..."
        />
    </div>
    <div class="h-2" />
    <table>
        <thead>
            {#each $table.getHeaderGroups() as headerGroup (headerGroup.id)}
                <tr>
                    {#each headerGroup.headers as header (header.id)}
                        <th class="text-left" colSpan={header.colSpan}>
                            {#if !header.isPlaceholder}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <div
                                    class:cursor-pointer={header.column.getCanSort()}
                                    class:select-none={header.column.getCanSort()}
                                    class:sortable={header.column.getCanSort()}
                                    on:click={header.column.getToggleSortingHandler()}
                                >
                                    <div>
                                        <svelte:component
                                            this={flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        />
                                    </div>
                                    {#if header.column.getCanSort()}
                                        {@html {
                                            asc: SORTASCICON,
                                            desc: SORTDESCICON,
                                        }[
                                            header.column
                                                .getIsSorted()
                                                .toString()
                                        ] ?? SORTICON}
                                    {/if}
                                </div>
                                {#if header.column.getCanFilter()}
                                    <div>
                                        <Filter
                                            column={header.column}
                                            table={$table}
                                        />
                                    </div>
                                {/if}
                            {/if}
                        </th>
                    {/each}
                </tr>
            {/each}
        </thead><tbody>
            {#each $table.getRowModel().rows as row, i}
                <tr class:odd={i % 2 == 1} class:even={i % 2 == 0}>
                    {#each row.getVisibleCells() as cell}
                        <td class="px-3 py-3 text-sm text-left">
                            <svelte:component
                                this={flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                )}
                            />
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
    <div class="h-2" />
    <div class="flex items-center gap-2">
        <button
            class="border rounded p-1"
            on:click={() => $table.setPageIndex(0)}
            disabled={!$table.getCanPreviousPage()}
        >
            {"<<"}
        </button>
        <button
            class="border rounded p-1"
            on:click={() => $table.previousPage()}
            disabled={!$table.getCanPreviousPage()}
        >
            {"<"}
        </button>
        <button
            class="border rounded p-1"
            on:click={() => $table.nextPage()}
            disabled={!$table.getCanNextPage()}
        >
            {">"}
        </button>
        <button
            class="border rounded p-1"
            on:click={() => $table.setPageIndex($table.getPageCount() - 1)}
            disabled={!$table.getCanNextPage()}
        >
            {">>"}
        </button>
        <span class="flex items-center gap-1">
            <div>Page</div>
            <strong>
                {$table.getState().pagination.pageIndex + 1} of{" "}
                {$table.getPageCount()}
            </strong>
        </span>
        <span class="flex items-center gap-1">
            | Go to page:
            <input
                type="number"
                value={$table.getState().pagination.pageIndex + 1}
                on:change={(e) => {
                    const page = e.target.value
                        ? Number(e.target.value) - 1
                        : 0;
                    $table.setPageIndex(page);
                }}
                class="border p-1 rounded w-16"
            />
        </span>
        <select
            value={$table.getState().pagination.pageSize}
            on:change={(e) => {
                $table.setPageSize(Number(e.target.value));
            }}
        >
            {#each [10, 20, 30, 40, 50] as pageSize}
                <option value={pageSize}>
                    Show {pageSize}
                </option>
            {/each}
        </select>
    </div>
    <div>{$table.getPrePaginationRowModel().rows.length} Rows</div>
    <div>
        <button on:click={() => rerender()}>Force Rerender</button>
    </div>
    <div>
        <button on:click={() => refreshData()}>Refresh Data</button>
    </div>
    <pre>{JSON.stringify($table.getState(), null, 2)}</pre>
</div>

<style lang="postcss">
    :global(html) {
        background-color: theme(colors.gray.100);
    }

    table,
    table td,
    table th {
        border: 1px solid black;
        padding: 8px;
    }
</style>
