import { plural, t } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import { Printer } from "lucide-react";
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
import { ALL_EXPORT_COLUMNS } from "./currencies-export-dialog";

type Orientation = "portrait" | "landscape";

interface CurrenciesPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencies: Currency[];
  onPrinted?: () => void;
  title?: string;
}

const DEFAULT_COLUMNS: Array<keyof Currency> = [
  "code",
  "name",
  "symbol",
  "rate",
  "isActive",
  "decimalPlaces",
];

interface PrintColumn {
  key: keyof Currency;
  label: string;
}

interface PrintOptions {
  orientation: Orientation;
  title: string;
  documentTitle: string;
  metaLine: string;
}

function buildPrintableHtml(
  currencies: Currency[],
  columns: PrintColumn[],
  options: PrintOptions
): string {
  const { orientation, title, documentTitle, metaLine } = options;

  const tableRows = currencies
    .map((currency) => {
      const cells = columns
        .map((col) => {
          let value = currency[col.key];
          if (value === null || value === undefined) {
            value = "—";
          } else if (value instanceof Date) {
            value = value.toLocaleDateString();
          } else if (typeof value === "boolean") {
            value = value ? "Yes" : "No";
          }
          return `<td style="border:1px solid #ddd;padding:8px;">${String(value)}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const tableHeaders = columns
    .map(
      (col) =>
        `<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5;text-align:left;">${col.label}</th>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <title>${documentTitle}</title>
  <style>
    @page { size: ${orientation}; margin: 1cm; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    @media print {
      body { padding: 0; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">${metaLine}</p>
  <table>
    <thead><tr>${tableHeaders}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>
`;
}

function openPrintWindow(html: string): void {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
}

export function CurrenciesPrintDialog({
  open,
  onOpenChange,
  currencies,
  onPrinted,
  title = "Currencies",
}: CurrenciesPrintDialogProps) {
  const { i18n } = useLingui();
  const [orientation, setOrientation] = React.useState<Orientation>("portrait");
  const [selectedColumns, setSelectedColumns] = React.useState<
    Set<keyof Currency>
  >(() => new Set(DEFAULT_COLUMNS));
  const [isPrinting, setIsPrinting] = React.useState(false);

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

  const handlePrint = () => {
    const currencyCount = currencies.length;

    if (currencyCount === 0) {
      toast.error(t`No currencies to print`);
      return;
    }
    if (selectedColumns.size === 0) {
      toast.error(t`Select at least one column to print`);
      return;
    }
    setIsPrinting(true);
    try {
      const cols = ALL_EXPORT_COLUMNS.filter((c) =>
        selectedColumns.has(c.key)
      ).map((c) => ({ key: c.key, label: i18n._(c.label) }));

      const dateStr = new Date().toLocaleString();
      const metaLine = t`Printed ${dateStr} • ${plural(currencyCount, {
        one: "# row",
        other: "# rows",
      })}`;
      const docTitle = `${title} - ${t`Print`}`;

      const html = buildPrintableHtml(currencies, cols, {
        orientation,
        title,
        documentTitle: docTitle,
        metaLine,
      });
      openPrintWindow(html);
      toast.success(
        t`Sent ${plural(currencyCount, {
          one: "# currency",
          other: "# currencies",
        })} to printer`
      );
      onOpenChange(false);
      onPrinted?.();
    } catch {
      toast.error(t`Print failed`);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <Trans>Print Currencies</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              Choose page orientation and select the columns to include.
            </Trans>
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-6">
          <Field>
            <FieldLabel>
              <Trans>Orientation</Trans>
            </FieldLabel>
            <RadioGroup
              className="flex gap-4"
              onValueChange={(v) => setOrientation(v as Orientation)}
              value={orientation}
            >
              <Label
                className="flex cursor-pointer items-center gap-2"
                htmlFor="ori-portrait"
              >
                <RadioGroupItem id="ori-portrait" value="portrait" />
                <Trans>Portrait</Trans>
              </Label>
              <Label
                className="flex cursor-pointer items-center gap-2"
                htmlFor="ori-landscape"
              >
                <RadioGroupItem id="ori-landscape" value="landscape" />
                <Trans>Landscape</Trans>
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
                    htmlFor={`pcol-${col.key}`}
                    key={col.key}
                  >
                    <Checkbox
                      checked={selectedColumns.has(col.key)}
                      id={`pcol-${col.key}`}
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
          <Button disabled={isPrinting} onClick={handlePrint}>
            <Printer className="mr-2 size-4" />
            {isPrinting ? <Trans>Printing...</Trans> : <Trans>Print</Trans>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
