import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import type { RowSelectionState } from "@tanstack/react-table";
import { DownloadIcon, PrinterIcon, UploadIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Currency, CurrencyFormValues } from "../data/schema";
import { CurrenciesExportDialog } from "./currencies-export-dialog";
import { CurrenciesImportDialog } from "./currencies-import-dialog";
import { CurrenciesPrintDialog } from "./currencies-print-dialog";

interface CurrenciesImportExportPrintActionsProps {
  currencies: Currency[];
  rowSelection?: RowSelectionState;
  onImport: (currencies: CurrencyFormValues[]) => Promise<void>;
}

export function CurrenciesImportExportPrintActions({
  currencies,
  rowSelection,
  onImport,
}: CurrenciesImportExportPrintActionsProps) {
  const [printOpen, setPrintOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTitle, setExportTitle] = useState("All Currencies");
  const [filenamePrefix, setFilenamePrefix] = useState("currencies-all");
  const [currenciesToExport, setCurrenciesToExport] = useState<Currency[]>([]);
  const isMobile = useIsMobile();

  // Get selected currency IDs from rowSelection state
  const getSelectedIds = (): number[] => {
    if (!rowSelection) {
      return [];
    }
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((id) => Number(id));
  };

  const selectedCount = getSelectedIds().length;
  const hasSelection = selectedCount > 0;
  const totalCount = currencies.length;

  const handleOpenExport = () => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length > 0) {
      const selected = currencies.filter((c) => selectedIds.includes(c.id));
      setCurrenciesToExport(selected);
      setExportTitle("Selected Currencies");
      setFilenamePrefix("currencies-selected");
    } else {
      setCurrenciesToExport(currencies);
      setExportTitle("All Currencies");
      setFilenamePrefix("currencies-all");
    }
    setExportOpen(true);
  };

  const handleOpenPrint = () => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length > 0) {
      const selected = currencies.filter((c) => selectedIds.includes(c.id));
      setCurrenciesToExport(selected);
      setExportTitle("Selected Currencies");
    } else {
      setCurrenciesToExport(currencies);
      setExportTitle("All Currencies");
    }
    setPrintOpen(true);
  };

  return (
    <div className="flex items-center gap-2">
      {!isMobile && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={
                hasSelection
                  ? t`Print ${selectedCount} selected currencies`
                  : t`Print all currencies`
              }
              disabled={totalCount === 0}
              onClick={handleOpenPrint}
              variant="outline"
            >
              <PrinterIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {hasSelection ? (
                <Trans>Print {selectedCount} selected currencies</Trans>
              ) : (
                <Trans>Print all currencies</Trans>
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      <ButtonGroup>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={t`Import currencies`}
              onClick={() => setImportOpen(true)}
              variant="outline"
            >
              <UploadIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              <Trans>Import currencies from CSV/JSON/XLSX</Trans>
            </p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={
                hasSelection
                  ? t`Export ${selectedCount} selected currencies`
                  : t`Export all currencies`
              }
              disabled={totalCount === 0}
              onClick={handleOpenExport}
              variant="outline"
            >
              <DownloadIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {hasSelection ? (
                <Trans>Export {selectedCount} selected currencies</Trans>
              ) : (
                <Trans>Export all currencies</Trans>
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      </ButtonGroup>

      <CurrenciesPrintDialog
        currencies={currenciesToExport}
        onOpenChange={setPrintOpen}
        open={printOpen}
        title={exportTitle}
      />
      <CurrenciesImportDialog
        onImport={onImport}
        onOpenChange={setImportOpen}
        open={importOpen}
      />
      <CurrenciesExportDialog
        currencies={currenciesToExport}
        filenamePrefix={filenamePrefix}
        onOpenChange={setExportOpen}
        open={exportOpen}
      />
    </div>
  );
}
