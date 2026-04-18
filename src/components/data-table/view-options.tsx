import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Funnel } from "lucide-react";

type DataTableViewOptionsProps<TData> = {
  table: Table<TData>;
};

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger render={<Button
        className="ms-auto hidden h-8 lg:flex"
        size="sm"
        variant="outline"
      >
        <Funnel className="size-4" />
        View
      </Button>}>

      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-fit min-w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => (
            <DropdownMenuCheckboxItem
              checked={column.getIsVisible()}
              className="capitalize"
              key={column.id}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
              onSelect={(e) => {
                // Keep menu open while toggling multiple items
                e.preventDefault();
              }}
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
