"use client";

import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import type {
    ColumnDef,
    SortingState,
    VisibilityState,
} from "@tanstack/react-table";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import {
    DataTableColumnHeader,
    DataTablePagination,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { DonationRecord } from "@/db/db";
import { formatMoney } from "@/features/donation/donation-utils";

function useDonationColumns(
    onEdit: (donation: DonationRecord) => void,
    onDelete: (donation: DonationRecord) => void
): ColumnDef<DonationRecord>[] {
    const { i18n } = useLingui();

    return [
        {
            accessorKey: "donatedAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={i18n._(msg`Date`)} />
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue("donatedAt"));
                return date.toLocaleDateString();
            },
            sortingFn: "datetime",
            enableSorting: true,
            enableHiding: true,
            size: 120,
        },
        {
            accessorKey: "donorName",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={i18n._(msg`Donor`)} />
            ),
            cell: ({ row }) => (
                <span className="font-medium">{row.getValue("donorName")}</span>
            ),
            enableSorting: true,
            enableHiding: true,
            size: 150,
        },
        {
            accessorKey: "category",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={i18n._(msg`Category`)} />
            ),
            cell: ({ row }) => <div>{row.getValue("category")}</div>,
            enableSorting: true,
            enableHiding: true,
            size: 120,
        },
        {
            accessorKey: "paymentMethod",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={i18n._(msg`Payment`)} />
            ),
            cell: ({ row }) => <div>{row.getValue("paymentMethod")}</div>,
            enableSorting: true,
            enableHiding: true,
            size: 120,
        },
        {
            accessorKey: "currency",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={i18n._(msg`Currency`)} />
            ),
            cell: ({ row }) => (
                <div className="font-mono text-sm">{row.getValue("currency")}</div>
            ),
            enableSorting: true,
            enableHiding: true,
            size: 100,
        },
        {
            accessorKey: "amountCents",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={i18n._(msg`Amount`)} />
            ),
            cell: ({ row }) => {
                const amount = row.getValue("amountCents");
                const currency = row.original.currency;
                return (
                    <div className="text-center font-mono">
                        {formatMoney(amount as number, currency)}
                    </div>
                );
            },
            enableSorting: true,
            enableHiding: true,
            size: 140,
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={i18n._(msg`Status`)} />
            ),
            cell: ({ row }) => (
                <div className="text-xs capitalize">
                    {String(row.getValue("status")).toLowerCase()}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            size: 100,
        },
        {
            accessorKey: "notes",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={i18n._(msg`Notes`)} />
            ),
            cell: ({ row }) => (
                <div className="max-w-xs truncate text-sm">
                    {(row.getValue("notes") as string) || "—"}
                </div>
            ),
            enableSorting: false,
            enableHiding: true,
            size: 150,
        },
        {
            id: "actions",
            header: () => (
                <span className="">
                    <Trans>Actions</Trans>
                </span>
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    aria-label={i18n._(msg`Actions`)}
                                    size="icon-xs"
                                    variant="ghost"
                                >
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            }
                        />
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(row.original)}>
                                <Pencil className="mr-2 size-4" />
                                <Trans>Edit</Trans>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(row.original)}
                                variant="destructive"
                            >
                                <Trash2 className="mr-2 size-4" />
                                <Trans>Delete</Trans>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
            size: 80,
        },
    ];
}

export function DonationTable(props: {
    donations: DonationRecord[];
    onEdit: (donation: DonationRecord) => void;
    onDelete?: (donation: DonationRecord) => void;
}) {
    const { donations, onEdit, onDelete = () => { } } = props;
    const { i18n } = useLingui();
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        donatedAt: true,
        donorName: true,
        category: true,
        paymentMethod: true,
        currency: true,
        amountCents: true,
        status: false,
        notes: false,
    });

    const columns = useDonationColumns(onEdit, onDelete);

    const table = useReactTable({
        data: donations,
        columns,
        state: {
            globalFilter,
            sorting,
            columnVisibility,
        },
        globalFilterFn: (row, _columnId, filterValue) => {
            const searchValue = String(filterValue).toLowerCase();
            const donation = row.original;
            return (
                donation.donorName.toLowerCase().includes(searchValue) ||
                donation.category.toLowerCase().includes(searchValue) ||
                donation.paymentMethod.toLowerCase().includes(searchValue)
            );
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <Input
                    className="h-9 w-full sm:w-75"
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder={i18n._(msg`Search donations...`)}
                    value={globalFilter}
                />
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button size="icon-lg" type="button" variant="secondary">
                                <Settings2 className="size-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-fit min-w-40">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>
                                <Trans>Toggle columns</Trans>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) =>
                                        typeof column.accessorFn !== "undefined" &&
                                        column.getCanHide()
                                )
                                .map((column) => {
                                    const isVisible = columnVisibility[column.id] ?? true;
                                    return (
                                        <DropdownMenuCheckboxItem
                                            checked={isVisible}
                                            key={column.id}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(Boolean(value))
                                            }
                                            onSelect={(event) => {
                                                event.preventDefault();
                                            }}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="min-h-125 overflow-hidden rounded-2xl border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        style={{
                                            width: header.getSize(),
                                            minWidth: header.getSize(),
                                            maxWidth: header.getSize(),
                                        }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    className="cursor-pointer"
                                    key={row.id}
                                    onClick={(e) => {
                                        // Don't trigger edit if clicking on interactive elements
                                        const target = e.target as HTMLElement;
                                        const interactive = target.closest(
                                            "button, input, [role=checkbox], [role=switch], [role=menuitem]"
                                        );
                                        if (!interactive) {
                                            onEdit(row.original);
                                        }
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            className="pl-5 text-start"
                                            key={cell.id}
                                            style={{
                                                width: cell.column.getSize(),
                                                minWidth: cell.column.getSize(),
                                                maxWidth: cell.column.getSize(),
                                            }}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    className="h-24 text-center"
                                    colSpan={columns.length}
                                >
                                    <Trans>No donations found.</Trans>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
    );
}
