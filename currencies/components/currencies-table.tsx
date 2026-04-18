import { Trans } from "@lingui/react/macro";
import {
  type ColumnPinningState,
  type ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Currency, CurrencyFormValues } from "../data/schema";
import { useCurrenciesColumns } from "./currencies-columns";
import { CurrenciesImportExportPrintActions } from "./currencies-import-export-print";

interface CurrenciesTableProps {
  currencies: Currency[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  autoSyncEnabled: boolean;
  onSync: () => void;
  onEdit: (currency: Currency) => void;
  onSetDefault: (currency: Currency) => void;
  onDelete: (currency: Currency) => void;
  onAdd: () => void;
  onImport: (currencies: CurrencyFormValues[]) => Promise<void>;
  onAutoSyncChange: (enabled: boolean) => void;
}

export function CurrenciesTable({
  currencies,
  isLoading,
  // isSyncing,
  // lastSyncedAt,
  autoSyncEnabled,
  // onSync,
  onEdit,
  onSetDefault,
  onDelete,
  onAdd,
  onImport,
  onAutoSyncChange,
}: CurrenciesTableProps) {
  const columns = useCurrenciesColumns({ onEdit, onSetDefault, onDelete });

  // Table states
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: [],
  });
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    code: true,
    name: true,
    symbol: true,
    rate: true,
    decimalPlaces: false,
    lastSyncedAt: false,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: currencies,
    columns,
    state: {
      globalFilter,
      sorting,
      rowSelection,
      columnVisibility,
      columnSizing,
      columnPinning,
      columnOrder,
    },
    getRowId: (row) => String(row.id),
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchValue = String(filterValue).toLowerCase();
      const currency = row.original;
      return (
        currency.code.toLowerCase().includes(searchValue) ||
        currency.name.toLowerCase().includes(searchValue) ||
        (currency.symbol?.toLowerCase().includes(searchValue) ?? false)
      );
    },
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnPinning: true,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onColumnPinningChange: setColumnPinning,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  if (isLoading) {
    const skeletonIds = [
      "sk-1",
      "sk-2",
      "sk-3",
      "sk-4",
      "sk-5",
      "sk-6",
      "sk-7",
      "sk-8",
      "sk-9",
      "sk-10",
    ];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="rounded-md border">
          {skeletonIds.map((id) => (
            <Skeleton className="m-2 h-12" key={id} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col-reverse flex-wrap items-start justify-between gap-4 sm:flex-row">
        <Input
          className="h-9 w-full sm:w-[300px]"
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search currencies..."
          value={globalFilter}
        />
        <div className="flex flex-row-reverse items-center gap-4 sm:flex-row">
          <Field className="flex items-center gap-2" orientation="horizontal">
            <FieldContent>
              <FieldTitle className="text-sm">
                <Trans>Auto-sync</Trans>
              </FieldTitle>
            </FieldContent>
            <Switch
              checked={autoSyncEnabled}
              onCheckedChange={onAutoSyncChange}
            />
          </Field>
          <CurrenciesImportExportPrintActions
            currencies={currencies}
            onImport={onImport}
            rowSelection={rowSelection}
          />
          <Button onClick={onAdd}>
            <Plus className="mr-2 size-4" />
            <Trans>Activate Currency</Trans>
          </Button>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isPinned = header.column.getIsPinned();
                  return (
                    <TableHead
                      className={cn(
                        isPinned && "sticky bg-background",
                        isPinned === "left" && "left-0 z-10",
                        isPinned === "right" && "right-0 z-10"
                      )}
                      colSpan={header.colSpan}
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
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="cursor-pointer"
                  data-state={row.getIsSelected() && "selected"}
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
                  {row.getVisibleCells().map((cell) => {
                    const isPinned = cell.column.getIsPinned();
                    return (
                      <TableCell
                        className={cn(
                          isPinned && "sticky bg-background",
                          isPinned === "left" && "left-0 z-10",
                          isPinned === "right" && "right-0 z-10"
                        )}
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
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  <Trans>No currencies found.</Trans>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer info */}
      <div className="text-muted-foreground text-sm">
        <Trans>
          Rates are synced from OpenExchangeRates every 12 hours. Base currency:
          USD.
        </Trans>
      </div>
    </div>
  );
}
