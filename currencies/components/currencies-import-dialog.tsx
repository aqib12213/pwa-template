"use client";

import { plural } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import { FileSpreadsheetIcon, InfoIcon, SparklesIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { parseCurrenciesCsv, parseCurrenciesJson } from "../data/csv";
import type { CurrencyFormValues } from "../data/schema";
import {
  buildCurrenciesCsvTemplate,
  buildCurrenciesJsonTemplate,
  buildCurrenciesXlsxTemplate,
} from "../data/templates";
import { parseCurrenciesXlsxFromArrayBuffer } from "../data/xlsx";

interface CurrenciesImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (currencies: CurrencyFormValues[]) => Promise<void>;
}

const BINARY_KIBI = 1024 as const;
const BYTES_PER_MB = BINARY_KIBI * BINARY_KIBI;
const DEFAULT_IMPORT_MB_LIMIT = 5 as const;
const MAX_IMPORT_SIZE_BYTES = DEFAULT_IMPORT_MB_LIMIT * BYTES_PER_MB;

export function CurrenciesImportDialog({
  open,
  onOpenChange,
  onImport,
}: CurrenciesImportDialogProps) {
  const { t } = useLingui();
  const [state, actions] = useFileUpload({
    accept:
      ".csv,.xlsx,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    multiple: false,
    maxSize: MAX_IMPORT_SIZE_BYTES,
    onError: (errors) => {
      for (const e of errors) {
        toast.error(e);
      }
    },
  });
  const { clearFiles } = actions;
  const [parsed, setParsed] = React.useState<CurrencyFormValues[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingAction, setProcessingAction] = React.useState<
    "parse" | "import" | null
  >(null);
  const previousFileIdRef = React.useRef<string | undefined>(undefined);

  const resetDialogState = React.useCallback(() => {
    clearFiles();
    setParsed([]);
    setIsProcessing(false);
    setProcessingAction(null);
  }, [clearFiles]);

  React.useEffect(() => {
    const currentId = state.files[0]?.id;
    if (currentId !== previousFileIdRef.current) {
      setParsed([]);
      setIsProcessing(false);
      setProcessingAction(null);
    }
    previousFileIdRef.current = currentId;
  }, [state.files]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetDialogState();
    }
    onOpenChange(nextOpen);
  };

  React.useEffect(() => {
    if (!open) {
      resetDialogState();
    }
  }, [open, resetDialogState]);

  const handleParse = async () => {
    const fileEntry = state.files[0];
    const fileObj = fileEntry?.file;
    if (!(fileObj instanceof File)) {
      toast.error(t`Please select a CSV, JSON, or XLSX file`);
      return;
    }
    setProcessingAction("parse");
    setIsProcessing(true);
    try {
      const name = fileObj.name.toLowerCase();
      const type = fileObj.type;
      const isJson = type === "application/json" || name.endsWith(".json");
      const isXlsx =
        type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        name.endsWith(".xlsx");
      let records: CurrencyFormValues[] = [];
      if (isJson) {
        const text = await fileObj.text();
        records = parseCurrenciesJson(text);
      } else if (isXlsx) {
        const ab = await fileObj.arrayBuffer();
        records = await parseCurrenciesXlsxFromArrayBuffer(ab);
      } else {
        const text = await fileObj.text();
        records = parseCurrenciesCsv(text);
      }
      setParsed(records);
      if (records.length === 0) {
        toast.error(
          t`No valid records found. Ensure headers match (code, name required).`
        );
      } else {
        toast.success(
          t`Parsed ${plural(records.length, { one: "# currency", other: "# currencies" })}`
        );
      }
    } catch {
      toast.error(t`Failed to read file`);
    } finally {
      setProcessingAction(null);
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (parsed.length === 0) {
      toast.error(t`Nothing to import`);
      return;
    }
    setProcessingAction("import");
    setIsProcessing(true);
    try {
      await onImport(parsed);
      toast.success(
        t`Imported ${plural(parsed.length, { one: "# currency", other: "# currencies" })}`
      );
      handleOpenChange(false);
    } catch {
      toast.error(t`Import failed`);
    } finally {
      setProcessingAction(null);
      setIsProcessing(false);
    }
  };

  const selected = state.files[0];
  const fileName =
    selected && selected.file instanceof File ? selected.file.name : undefined;
  const fileSize =
    selected && selected.file instanceof File ? selected.file.size : undefined;

  const hasParsed = parsed.length > 0;
  const isParsing = processingAction === "parse";
  const isImporting = processingAction === "import";
  const actionDisabled =
    isProcessing || (hasParsed ? parsed.length === 0 : !selected);
  const actionHandler = hasParsed ? handleImport : handleParse;
  const actionVariant = hasParsed ? "default" : "secondary";

  // Compute action label based on state
  const getActionLabel = () => {
    if (hasParsed) {
      return isImporting ? t`Importing...` : t`Import`;
    }
    return isParsing ? t`Parsing...` : t`Parse`;
  };
  const actionLabel = getActionLabel();

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-w-3xl gap-6">
        <DialogHeader>
          <DialogTitle>
            <Trans>Import Currencies</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              Upload a CSV, JSON, or Excel (.xlsx) file to add currencies in
              bulk.
            </Trans>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-3">
          <FieldGroup>
            <Field>
              <FieldLabel>
                <Trans>Download Template</Trans>
              </FieldLabel>
              <ButtonGroup>
                <Button
                  onClick={() => {
                    const csv = buildCurrenciesCsvTemplate();
                    const blob = new Blob([csv], {
                      type: "text/csv;charset=utf-8",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "currencies-template.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  type="button"
                  variant="outline"
                >
                  <Trans>CSV</Trans>
                </Button>
                <Button
                  onClick={() => {
                    const json = buildCurrenciesJsonTemplate();
                    const blob = new Blob([json], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "currencies-template.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  type="button"
                  variant="outline"
                >
                  <Trans>JSON</Trans>
                </Button>
                <Button
                  onClick={async () => {
                    const blob = await buildCurrenciesXlsxTemplate();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "currencies-template.xlsx";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  type="button"
                  variant="outline"
                >
                  <Trans>Excel (.xlsx)</Trans>
                </Button>
              </ButtonGroup>
              <FieldDescription>
                <Trans>
                  Templates include sample currencies. XLSX includes a Field
                  Reference sheet.
                </Trans>
              </FieldDescription>
            </Field>

            <Field className="rounded-lg border px-4 py-3">
              <FieldLabel className="flex items-center gap-2">
                <Trans>Upload File</Trans>
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InfoIcon className="size-4 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  {...actions.getInputProps({
                    accept:
                      ".csv,.xlsx,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  })}
                />
              </InputGroup>
              <FieldDescription>
                {t`Accepted: CSV, JSON, or XLSX. Max size ${formatBytes(MAX_IMPORT_SIZE_BYTES)}.`}
              </FieldDescription>
            </Field>

            {fileName && (
              <Field className="rounded-lg border px-4 py-3">
                <FieldLabel className="flex items-center gap-2">
                  <FileSpreadsheetIcon className="size-4 text-muted-foreground" />
                  <Trans>Selected File</Trans>
                </FieldLabel>
                <div className="font-medium text-foreground text-sm">
                  {fileName} {fileSize ? `(${formatBytes(fileSize)})` : ""}
                </div>
                <FieldDescription>
                  <Trans>
                    After selecting a file, click Parse to preview and validate.
                  </Trans>
                </FieldDescription>
              </Field>
            )}

            {parsed.length > 0 && (
              <Field className="rounded-lg border px-4 py-3">
                <FieldLabel className="flex items-center gap-2">
                  <SparklesIcon className="size-4 text-muted-foreground" />
                  <Trans>Preview</Trans>
                </FieldLabel>
                <div className="font-medium text-foreground text-sm">
                  {t`${plural(parsed.length, { one: "# currency", other: "# currencies" })} ready to import.`}
                </div>
                <FieldDescription>
                  <Trans>
                    Existing currencies (by code) will be updated. New codes
                    will be added.
                  </Trans>
                </FieldDescription>
              </Field>
            )}
          </FieldGroup>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="outline"
          >
            <Trans>Cancel</Trans>
          </Button>
          <Button
            disabled={actionDisabled}
            onClick={actionHandler}
            type="button"
            variant={actionVariant}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
