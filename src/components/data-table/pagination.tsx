import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getPageNumbers } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  className?: string;
  totalCount?: number;
};

export function DataTablePagination<TData>({
  table,
  className,
  totalCount,
}: DataTablePaginationProps<TData>) {
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;
  // If totalCount is provided, calculate total pages from it
  // Otherwise fall back to table's internal pageCount
  const totalPages = totalCount
    ? Math.ceil(totalCount / pageSize)
    : table.getPageCount();
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 overflow-clip px-2 sm:flex-row",
        "@max-2xl/content:flex-col-reverse @max-2xl/content:gap-4",
        className
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex @2xl/content:hidden w-[100px] items-center justify-center font-medium text-sm">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex @max-2xl/content:flex-row-reverse items-center gap-2">
          <Select
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
            value={`${table.getState().pagination.pageSize}`}
          >
            <SelectTrigger className="h-8 w-17.5">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((pageSizeOption) => (
                <SelectItem key={pageSizeOption} value={`${pageSizeOption}`}>
                  {pageSizeOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="hidden font-medium text-sm sm:block">Rows per page</p>
        </div>
      </div>

      <div className="flex items-center sm:space-x-6 lg:space-x-8">
        <div className="flex @max-3xl/content:hidden w-[100px] items-center justify-center font-medium text-sm">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            className="@max-md/content:hidden size-8 p-0"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
            variant="outline"
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            className="size-8 p-0"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            variant="outline"
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page number buttons */}
          {pageNumbers.map((pageNumber) => (
            <div className="flex items-center" key={String(pageNumber)}>
              {pageNumber === "..." ? (
                <span className="px-1 text-muted-foreground text-sm">...</span>
              ) : (
                <Button
                  className="h-8 min-w-8 px-2"
                  onClick={() => table.setPageIndex((pageNumber as number) - 1)}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                >
                  <span className="sr-only">Go to page {pageNumber}</span>
                  {pageNumber}
                </Button>
              )}
            </div>
          ))}

          <Button
            className="size-8 p-0"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            variant="outline"
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            className="@max-md/content:hidden size-8 p-0"
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            variant="outline"
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
