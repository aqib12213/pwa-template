import { plural, t } from "@lingui/core/macro";
import type { RowSelectionState, Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>;
  entityName: string;
  children: React.ReactNode;
  rowSelection?: RowSelectionState;
};

/**
 * A modular toolbar for displaying bulk actions when table rows are selected.
 *
 * @template TData The type of data in the table.
 * @param {object} props The component props.
 * @param {Table<TData>} props.table The react-table instance.
 * @param {string} props.entityName The name of the entity being acted upon (e.g., "task", "user").
 * @param {React.ReactNode} props.children The action buttons to be rendered inside the toolbar.
 * @returns {React.ReactNode | null} The rendered component or null if no rows are selected.
 */
export function DataTableBulkActions<TData>({
  table,
  entityName,
  children,
  rowSelection,
}: DataTableBulkActionsProps<TData>): React.ReactNode | null {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  // Use rowSelection prop to ensure re-render when selection changes
  const selectedCount = rowSelection
    ? Object.keys(rowSelection).length
    : selectedRows.length;
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState("");

  // Announce selection changes to screen readers
  useEffect(() => {
    if (selectedCount > 0) {
      const message = t`${selectedCount} ${entityName}${selectedCount > 1 ? "s" : ""} selected. Bulk actions toolbar is available.`;

      // Use queueMicrotask to defer state update and avoid cascading renders
      queueMicrotask(() => {
        setAnnouncement(message);
      });

      // Clear announcement after a delay
      const timer = setTimeout(() => setAnnouncement(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedCount, entityName]);

  const handleClearSelection = () => {
    table.resetRowSelection();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const buttons = toolbarRef.current?.querySelectorAll("button");
    if (!buttons) {
      return;
    }

    // biome-ignore lint/complexity/useIndexOf: this is more readable with findIndex
    const currentIndex = Array.from(buttons).findIndex(
      (button) => button === document.activeElement
    );

    switch (event.key) {
      case "ArrowRight": {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % buttons.length;
        buttons[nextIndex]?.focus();
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        const prevIndex =
          currentIndex === 0 ? buttons.length - 1 : currentIndex - 1;
        buttons[prevIndex]?.focus();
        break;
      }
      case "Home":
        event.preventDefault();
        buttons[0]?.focus();
        break;
      case "End":
        event.preventDefault();
        // biome-ignore lint/style/useAtIndex: using .at() would cous error on compile time Property 'at' does not exist on type 'NodeListOf<HTMLButtonElement>'
        buttons[buttons.length - 1]?.focus();
        break;
      case "Escape": {
        // Check if the Escape key came from a dropdown trigger or content
        // We can't check dropdown state because Radix UI closes it before our handler runs
        const target = event.target as HTMLElement;
        const activeElement = document.activeElement as HTMLElement;

        // Check if the event target or currently focused element is a dropdown trigger
        const isFromDropdownTrigger =
          target?.getAttribute("data-slot") === "dropdown-menu-trigger" ||
          activeElement?.getAttribute("data-slot") ===
          "dropdown-menu-trigger" ||
          target?.closest('[data-slot="dropdown-menu-trigger"]') ||
          activeElement?.closest('[data-slot="dropdown-menu-trigger"]');

        // Check if the focused element is inside dropdown content (which is portaled)
        const isFromDropdownContent =
          activeElement?.closest('[data-slot="dropdown-menu-content"]') ||
          target?.closest('[data-slot="dropdown-menu-content"]');

        if (isFromDropdownTrigger || isFromDropdownContent) {
          // Escape was meant for the dropdown - don't clear selection
          return;
        }

        // Escape was meant for the toolbar - clear selection
        event.preventDefault();
        handleClearSelection();
        break;
      }
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      {/* Live region for screen reader announcements */}
      <div
        aria-atomic="true"
        aria-live="polite"
        className="sr-only"
        role="status"
      >
        {announcement}
      </div>

      <div
        aria-describedby="bulk-actions-description"
        aria-label={t`Bulk actions for ${selectedCount} selected ${entityName}${selectedCount > 1 ? "s" : ""}`}
        className={cn(
          "-translate-x-1/2 fixed bottom-6 left-1/2 z-50 rounded-xl",
          "transition-all delay-100 duration-300 ease-out hover:scale-105",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        )}
        onKeyDown={handleKeyDown}
        ref={toolbarRef}
        role="toolbar"
        tabIndex={-1}
      >
        <div
          className={cn(
            "p-2 shadow-xl",
            "rounded-xl border",
            "bg-background/95 backdrop-blur-lg supports-backdrop-filter:bg-background/60",
            "flex items-center gap-x-2"
          )}
        >
          <Tooltip>
            <TooltipTrigger render={<Button
              aria-label={t`Clear selection`}
              className="size-6 rounded-full"
              onClick={handleClearSelection}
              size="icon"
              title={t`Clear selection (Escape)`}
              variant="outline"
            >
              <X />
              <span className="sr-only">{t`Clear selection`}</span>
            </Button>}>

            </TooltipTrigger>
            <TooltipContent>
              <p>{t`Clear selection (Escape)`}</p>
            </TooltipContent>
          </Tooltip>

          <Separator
            aria-hidden="true"
            className="h-5"
            orientation="vertical"
          />

          <div
            className="flex items-center gap-x-1 text-sm"
            id="bulk-actions-description"
          >
            <Badge
              aria-label={t`${selectedCount} selected`}
              className="min-w-8 rounded-lg"
              variant="default"
            >
              {selectedCount}
            </Badge>{" "}
            <span className="hidden sm:inline">
              {plural(selectedCount, {
                one: entityName,
                other: `${entityName}s`,
              })}
            </span>{" "}
            {t`selected`}
          </div>

          <Separator
            aria-hidden="true"
            className="h-5"
            orientation="vertical"
          />

          {children}
        </div>
      </div>
    </>
  );
}
