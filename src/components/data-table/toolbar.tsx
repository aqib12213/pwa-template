import type { Table } from "@tanstack/react-table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTableFacetedFilter } from "./faceted-filter";
import { DataTableViewOptions } from "./view-options";
import { X } from "lucide-react";

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchKey?: string;
  filters?: {
    columnId: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: React.ComponentType<{ className?: string }>;
    }[];
  }[];
};

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = "Filter...",
  searchKey,
  filters = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 || table.getState().globalFilter;

  const handleClearFilters = () => {
    table.resetColumnFilters();
    table.setGlobalFilter("");
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-row items-center gap-y-2 space-x-2">
        <InputGroup className="w-[150px] lg:w-[250px]">
          {searchKey ? (
            <InputGroupInput
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              placeholder={searchPlaceholder}
              value={
                (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
              }
            />
          ) : (
            <InputGroupInput
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              placeholder={searchPlaceholder}
              value={table.getState().globalFilter ?? ""}
            />
          )}
          {isFiltered && (
            <InputGroupAddon align="inline-end">
              <Tooltip>
                <TooltipTrigger render={<InputGroupButton
                  aria-label="Clear filters"
                  onClick={handleClearFilters}
                  size="icon-xs"
                >
                  <X className="size-3.5" />
                </InputGroupButton>}>

                </TooltipTrigger>
                <TooltipContent>Clear filters</TooltipContent>
              </Tooltip>
            </InputGroupAddon>
          )}
        </InputGroup>
        <div className="flex gap-x-2">
          {filters.map((filter) => {
            const column = table.getColumn(filter.columnId);
            if (!column) {
              return null;
            }
            return (
              <DataTableFacetedFilter
                column={column}
                key={filter.columnId}
                options={filter.options}
                title={filter.title}
              />
            );
          })}
        </div>
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
