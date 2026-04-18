import type {
  Column,
  ColumnPinningState,
  SortingState,
  Table,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftToLine,
  ArrowRight,
  ArrowRightToLine,
  ArrowUp,
  Check,
  ChevronsUpDown,
  EyeOff,
  PinOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type DataTableColumnHeaderProps<TData, TValue> =
  React.HTMLAttributes<HTMLDivElement> & {
    column: Column<TData, TValue>;
    pinningState?: ColumnPinningState;
    sortingState?: SortingState;
    title: string;
    table?: Table<TData>;
  };

export function DataTableColumnHeader<TData, TValue>({
  column,
  pinningState,
  sortingState,
  title,
  className,
  table,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const sortSource = sortingState ?? table?.getState().sorting;
  const sortEntry = sortSource?.find((entry) => entry.id === column.id);
  const sortDirection = sortEntry
    ? sortEntry.desc
      ? "desc"
      : "asc"
    : column.getIsSorted();

  const getSortIcon = () => {
    if (sortDirection === "desc") {
      return <ArrowDown className="ms-2 h-4 w-4" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ms-2 h-4 w-4" />;
    }
    return <ChevronsUpDown className="ms-2 h-4 w-4 hidden hover:block" />;
  };

  const moveColumn = (direction: "left" | "right") => {
    if (!table) {
      return;
    }
    const currentOrder = table.getState().columnOrder;
    const allColumns = table.getAllLeafColumns().map((col) => col.id);
    const order = currentOrder.length > 0 ? [...currentOrder] : [...allColumns];
    const currentIndex = order.indexOf(column.id);

    if (direction === "left" && currentIndex > 0) {
      const [movedColumn] = order.splice(currentIndex, 1);
      order.splice(currentIndex - 1, 0, movedColumn);
      table.setColumnOrder(order);
    }

    if (direction === "right" && currentIndex < order.length - 1) {
      const [movedColumn] = order.splice(currentIndex, 1);
      order.splice(currentIndex + 1, 0, movedColumn);
      table.setColumnOrder(order);
    }
  };

  const canMove = (direction: "left" | "right"): boolean => {
    if (!table) {
      return false;
    }
    const currentOrder = table.getState().columnOrder;
    const allColumns = table.getAllLeafColumns().map((col) => col.id);
    const order = currentOrder.length > 0 ? currentOrder : allColumns;
    const currentIndex = order.indexOf(column.id);
    if (direction === "left") {
      return currentIndex > 0;
    }
    return currentIndex < order.length - 1;
  };

  const computedPinning = pinningState ?? table?.getState().columnPinning;
  const isPinned = computedPinning
    ? computedPinning.left?.includes(column.id)
      ? "left"
      : computedPinning.right?.includes(column.id)
        ? "right"
        : false
    : column.getIsPinned();

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button
          className="h-8 data-[state=open]:bg-accent"
          size="sm"
          variant="ghost"
        >
          <span>{title}</span>
          {getSortIcon()}
        </Button>}>

        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-fit min-w-42">
          <DropdownMenuItem
            onClick={() => {
              if (sortDirection === "asc") {
                column.clearSorting();
              } else {
                column.toggleSorting(false);
              }
            }}
          >
            <ArrowUp className="size-3.5 text-muted-foreground/70" />
            <span className="grow">Asc</span>
            {sortDirection === "asc" && (
              <Check className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (sortDirection === "desc") {
                column.clearSorting();
              } else {
                column.toggleSorting(true);
              }
            }}
          >
            <ArrowDown className="size-3.5 text-muted-foreground/70" />
            <span className="grow">Desc</span>
            {sortDirection === "desc" && (
              <Check className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
          {column.getCanPin() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => column.pin(isPinned === "left" ? false : "left")}
              >
                <ArrowLeftToLine className="size-3.5 text-muted-foreground/70" />
                <span className="grow">Pin to left</span>
                {isPinned === "left" && (
                  <Check className="size-4 text-primary" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  column.pin(isPinned === "right" ? false : "right")
                }
              >
                <ArrowRightToLine className="size-3.5 text-muted-foreground/70" />
                <span className="grow">Pin to right</span>
                {isPinned === "right" && (
                  <Check className="size-4 text-primary" />
                )}
              </DropdownMenuItem>
            </>
          )}
          {table && !isPinned && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!canMove("left")}
                onClick={() => moveColumn("left")}
              >
                <ArrowLeft className="size-3.5 text-muted-foreground/70" />
                Move to Left
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canMove("right")}
                onClick={() => moveColumn("right")}
              >
                <ArrowRight className="size-3.5 text-muted-foreground/70" />
                Move to Right
              </DropdownMenuItem>
            </>
          )}
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOff className="size-3.5 text-muted-foreground/70" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {isPinned && (
        <Tooltip>
          <TooltipTrigger render={<Button
            aria-label="Unpin column"
            className="size-7"
            onClick={() => column.pin(false)}
            size="icon"
            variant="ghost"
          >
            <PinOff className="size-4 text-muted-foreground" />
          </Button>}>

          </TooltipTrigger>
          <TooltipContent>Unpin column</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
