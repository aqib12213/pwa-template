import { msg, t } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Currency } from "../data/schema";

export type ExportFormat = "csv" | "json" | "xlsx";

export const ALL_EXPORT_COLUMNS: Array<{
  key: keyof Currency;
  label: ReturnType<typeof msg>;
}> = [
  { key: "id", label: msg`ID` },
  { key: "code", label: msg`Code` },
  { key: "name", label: msg`Name` },
  { key: "symbol", label: msg`Symbol` },
  { key: "rate", label: msg`Rate` },
  { key: "baseCurrency", label: msg`Base Currency` },
  { key: "isActive", label: msg`Active` },
  { key: "isDefault", label: msg`Default` },
  { key: "decimalPlaces", label: msg`Decimal Places` },
  { key: "lastSyncedAt", label: msg`Last Synced` },
  { key: "createdAt", label: msg`Created At` },
  { key: "updatedAt", label: msg`Updated At` },
];

const DEFAULT_COLUMNS: Array<keyof Currency> = [
  "code",
  "name",
  "symbol",
  "rate",
  "isActive",
  "decimalPlaces",
];

interface CurrenciesExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencies: Currency[];
  filenamePrefix?: string;
  onExported?: () => void;
}

function currenciesToCsv(currencies: Currency[]): string {
  if (currencies.length === 0) {
    return "";
  }
  const headers = Object.keys(currencies[0]) as Array<keyof Currency>;
  const csvRows = [headers.join(",")];

  for (const currency of currencies) {
    const row = headers.map((header) => {
      const value = currency[header];
      if (value === null || value === undefined) {
        return "";
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === "string" && value.includes(",")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csvRows.push(row.join(","));
  }

  return csvRows.join("\n");
}

function currenciesToJson(currencies: Currency[]): string {
  return JSON.stringify(currencies, null, 2);
}

async function currenciesToXlsxBlob(currencies: Currency[]): Promise<Blob> {
  const { utils, write } = await import("xlsx");

  const data = currencies.map((c) => ({
    ...c,
    lastSyncedAt: c.lastSyncedAt?.toISOString() ?? "",
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Currencies");

  const buffer = write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function CurrenciesExportDialog({
  open,
  onOpenChange,
  currencies,
  filenamePrefix = "currencies",
  onExported,
}: CurrenciesExportDialogProps) {
  const { i18n } = useLingui();
  const [format, setFormat] = React.useState<ExportFormat>("csv");
  const [selectedColumns, setSelectedColumns] = React.useState<
    Set<keyof Currency>
  >(() => new Set(DEFAULT_COLUMNS));
  const [isExporting, setIsExporting] = React.useState(false);

  const toggleColumn = (key: keyof Currency) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedColumns(new Set(ALL_EXPORT_COLUMNS.map((c) => c.key)));
  };

  const selectNone = () => setSelectedColumns(new Set());

  const handleExport = async () => {
    const currencyCount = currencies.length;

    if (currencyCount === 0) {
      toast.error(t`No currencies to export`);
      return;
    }
    if (selectedColumns.size === 0) {
      toast.error(t`Select at least one column to export`);
      return;
    }
    setIsExporting(true);
    try {
      const cols = ALL_EXPORT_COLUMNS.filter((c) =>
        selectedColumns.has(c.key)
      ).map((c) => c.key);

      // Filter currencies to only include selected columns
      const filteredCurrencies = currencies.map((currency) => {
        const filtered: Partial<Currency> = {};
        for (const key of cols) {
          (filtered as Record<string, unknown>)[key as string] = (
            currency as Record<string, unknown>
          )[key as string];
        }
        return filtered as Currency;
      });

      let blob: Blob;
      let ext: string;
      let mimeType: string;

      if (format === "xlsx") {
        blob = await currenciesToXlsxBlob(filteredCurrencies);
        ext = "xlsx";
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (format === "json") {
        const json = currenciesToJson(filteredCurrencies);
        blob = new Blob([json], { type: "application/json" });
        ext = "json";
        mimeType = "application/json";
      } else {
        const csv = currenciesToCsv(filteredCurrencies);
        blob = new Blob([csv], { type: "text/csv" });
        ext = "csv";
        mimeType = "text/csv";
      }

      // Create download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filenamePrefix}-${new Date().toISOString().split("T")[0]}.${ext}`;
      a.type = mimeType;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        t`Exported ${currencyCount} currencies to ${ext.toUpperCase()}`
      );
      onOpenChange(false);
      onExported?.();
    } catch {
      toast.error(t`Export failed`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <Trans>Export Currencies</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              Choose export format and select the columns to include.
            </Trans>
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-6">
          <Field>
            <FieldLabel>
              <Trans>Format</Trans>
            </FieldLabel>
            <RadioGroup
              className="flex gap-4"
              onValueChange={(v) => setFormat(v as ExportFormat)}
              value={format}
            >
              <Label
                className="flex cursor-pointer items-center gap-2"
                htmlFor="fmt-csv"
              >
                <RadioGroupItem id="fmt-csv" value="csv" />
                <Trans>CSV</Trans>
              </Label>
              <Label
                className="flex cursor-pointer items-center gap-2"
                htmlFor="fmt-json"
              >
                <RadioGroupItem id="fmt-json" value="json" />
                <Trans>JSON</Trans>
              </Label>
              <Label
                className="flex cursor-pointer items-center gap-2"
                htmlFor="fmt-xlsx"
              >
                <RadioGroupItem id="fmt-xlsx" value="xlsx" />
                <Trans>Excel (.xlsx)</Trans>
              </Label>
            </RadioGroup>
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>
                <Trans>Columns</Trans>
              </FieldLabel>
              <div className="flex gap-2 text-xs">
                <Button
                  onClick={selectAll}
                  size="sm"
                  type="button"
                  variant="link"
                >
                  <Trans>Select All</Trans>
                </Button>
                <Button
                  onClick={selectNone}
                  size="sm"
                  type="button"
                  variant="link"
                >
                  <Trans>Clear</Trans>
                </Button>
              </div>
            </div>
            <FieldDescription>
              {t`${selectedColumns.size} of ${ALL_EXPORT_COLUMNS.length} columns selected`}
            </FieldDescription>
            <ScrollArea className="mt-2 h-48 rounded-md border p-2">
              <div className="grid grid-cols-2 gap-2 p-1">
                {ALL_EXPORT_COLUMNS.map((col) => (
                  <Label
                    className="flex cursor-pointer items-center gap-2 font-normal"
                    htmlFor={`ecol-${col.key}`}
                    key={col.key}
                  >
                    <Checkbox
                      checked={selectedColumns.has(col.key)}
                      id={`ecol-${col.key}`}
                      onCheckedChange={() => toggleColumn(col.key)}
                    />
                    {i18n._(col.label)}
                  </Label>
                ))}
              </div>
            </ScrollArea>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            <Trans>Cancel</Trans>
          </Button>
          <Button disabled={isExporting} onClick={handleExport}>
            {isExporting ? <Trans>Exporting...</Trans> : <Trans>Export</Trans>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
