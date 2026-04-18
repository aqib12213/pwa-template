import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef, Table } from "@tanstack/react-table";
import { CircleDollarSign, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Currency } from "../data/schema";

const RATE_DECIMAL_PLACES = 6;

export interface UseCurrenciesColumnsOptions {
  onEdit?: (currency: Currency) => void;
  onSetDefault?: (currency: Currency) => void;
  onDelete?: (currency: Currency) => void;
}

type RenderDataTableViewOptionsProps<TData> = {
  table: Table<TData>;
  columnVisibility?: Record<string, boolean>;
};

export function RenderDataTableViewOptions<TData>({
  table,
  columnVisibility,
}: RenderDataTableViewOptionsProps<TData>) {
  const computedVisibility =
    columnVisibility ?? table?.getState().columnVisibility ?? {};

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" type="button" variant="ghost">
          <MixerHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-fit min-w-[150px]">
        <DropdownMenuLabel>
          <Trans>Toggle columns</Trans>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            const isVisible = computedVisibility[column.id] ?? true;
            return (
              <DropdownMenuCheckboxItem
                checked={isVisible}
                key={column.id}
                onCheckedChange={(value) =>
                  column.toggleVisibility(Boolean(value))
                }
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function useCurrenciesColumns(
  options: UseCurrenciesColumnsOptions = {}
): ColumnDef<Currency>[] {
  const { i18n } = useLingui();
  const { onEdit, onSetDefault, onDelete } = options;

  const columns: ColumnDef<Currency>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label={i18n._(msg`Select all`)}
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          className="translate-y-0.5"
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={i18n._(msg`Select row`)}
          checked={row.getIsSelected()}
          className="translate-y-0.5"
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={i18n._(msg`Code`)} />
      ),
      cell: ({ row }) => {
        const currency = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="flex size-8 min-w-8 items-center justify-center rounded-md bg-muted">
              <span className="font-mono text-xs">
                {currency.symbol ?? currency.code.slice(0, 1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{currency.code}</span>
              {currency.isDefault && (
                <Badge className="w-fit text-xs" variant="secondary">
                  <Trans>Default</Trans>
                </Badge>
              )}
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
      size: 120,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={i18n._(msg`Name`)} />
      ),
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate">{row.getValue("name")}</span>
      ),
      enableSorting: true,
      enableHiding: true,
      size: 200,
    },
    {
      accessorKey: "symbol",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={i18n._(msg`Symbol`)} />
      ),
      cell: ({ row }) => (
        <span className="font-mono">{row.getValue("symbol") ?? "—"}</span>
      ),
      enableSorting: false,
      enableHiding: true,
      size: 80,
    },
    {
      accessorKey: "rate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={i18n._(msg`Rate`)} />
      ),
      cell: ({ row }) => {
        const rate = row.getValue("rate") as string;
        const numericRate = Number.parseFloat(rate);
        return (
          <span className="font-mono tabular-nums">
            {numericRate.toFixed(RATE_DECIMAL_PLACES)}
          </span>
        );
      },
      enableSorting: true,
      enableHiding: true,
      size: 120,
    },
    {
      accessorKey: "decimalPlaces",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={i18n._(msg`Decimals`)} />
      ),
      cell: ({ row }) => (
        <span className="font-mono">{row.getValue("decimalPlaces")}</span>
      ),
      enableSorting: false,
      enableHiding: true,
      size: 80,
    },
    {
      accessorKey: "lastSyncedAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={i18n._(msg`Last Synced`)}
        />
      ),
      cell: ({ row }) => {
        const date = row.original.lastSyncedAt;
        if (!date) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="text-sm">
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(date)}
          </span>
        );
      },
      enableSorting: true,
      enableHiding: true,
      size: 150,
    },
    {
      id: "actions",
      header: ({ table }) => (
        <div className="flex justify-center">
          <span className="sr-only">{i18n._(msg`Actions`)}</span>
          <RenderDataTableViewOptions table={table} />
        </div>
      ),
      cell: ({ row }) => {
        const currency = row.original;
        return (
          <div className="flex justify-center">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={i18n._(msg`Open menu for ${currency.code}`)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <Trans>Actions</Trans>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit?.(currency)}>
                  <Pencil className="mr-2 size-4" />
                  <Trans>Edit</Trans>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={currency.isDefault}
                  onClick={() => onSetDefault?.(currency)}
                >
                  <CircleDollarSign className="mr-2 size-4" />
                  <Trans>Make Base Currency</Trans>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={currency.isDefault}
                  onClick={() => onDelete?.(currency)}
                >
                  <Trash2 className="mr-2 size-4" />
                  <Trans>Deactivate</Trans>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 60,
    },
  ];

  return columns;
}
