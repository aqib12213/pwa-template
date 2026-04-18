import { usePGlite } from "@electric-sql/pglite-react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useForm } from "@tanstack/react-form";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLingui } from "@/context/lingui-provider";
import type { Currency } from "../data/schema";

// Validation constants
const MIN_DECIMAL_PLACES = 0;
const MAX_DECIMAL_PLACES = 8;
const DEFAULT_DECIMAL_PLACES = 2;

// Decimal places options
const DECIMAL_PLACES_OPTIONS = [
  { value: "0", label: "0 (1)" },
  { value: "1", label: "1 (1.0)" },
  { value: "2", label: "2 (1.00)" },
  { value: "3", label: "3 (1.000)" },
  { value: "4", label: "4 (1.0000)" },
  { value: "6", label: "6 (1.000000)" },
  { value: "8", label: "8 (1.00000000)" },
] as const;

const formSchema = z.object({
  code: z.string().min(1, "Please select a currency"),
  name: z.string().min(1, "Currency name is required"),
  symbol: z.string().optional(),
  decimalPlaces: z.number().min(MIN_DECIMAL_PLACES).max(MAX_DECIMAL_PLACES),
});

type FormValues = z.infer<typeof formSchema>;

interface CurrencyDrawerProps {
  currency?: Currency;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface InactiveCurrency {
  code: string;
  name: string;
  symbol: string | null;
  rate: string;
}

export function CurrencyDrawer({
  currency,
  open,
  onOpenChange,
  onSuccess,
}: CurrencyDrawerProps) {
  const db = usePGlite();
  const isEdit = Boolean(currency);
  const { dir } = useLingui();
  const [inactiveCurrencies, setInactiveCurrencies] = useState<
    InactiveCurrency[]
  >([]);
  const [selectedCurrency, setSelectedCurrency] =
    useState<InactiveCurrency | null>(null);

  const form = useForm({
    defaultValues: {
      code: currency?.code ?? "",
      name: currency?.name ?? "",
      symbol: currency?.symbol ?? "",
      decimalPlaces: currency?.decimalPlaces ?? DEFAULT_DECIMAL_PLACES,
    } as FormValues,
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await handleFormSubmit(value);
    },
  });

  // Fetch inactive currencies for selection
  useEffect(() => {
    if (!(db && open) || isEdit) {
      return;
    }

    const fetchInactive = async () => {
      try {
        const result = await db.query<InactiveCurrency>(
          'SELECT "code", "name", "symbol", "rate" FROM "currencies" WHERE "isActive" = false ORDER BY "code" ASC'
        );
        setInactiveCurrencies(result.rows);
      } catch (error) {
        console.error("Failed to fetch inactive currencies:", error);
      }
    };

    fetchInactive();
  }, [db, open, isEdit]);

  const handleFormSubmit = useCallback(
    async (value: FormValues) => {
      try {
        if (!db) {
          toast.error(t`Database not available`);
          return;
        }

        const now = new Date().toISOString();

        if (isEdit && currency) {
          // Update existing active currency
          await db.query(
            `UPDATE "currencies" 
             SET "name" = $1, "symbol" = $2, "decimalPlaces" = $3, "updatedAt" = $4
             WHERE "id" = $5`,
            [
              value.name,
              value.symbol ?? null,
              value.decimalPlaces,
              now,
              currency.id,
            ]
          );
          toast.success(t`Currency updated successfully`);
        } else {
          // Activate an inactive currency
          await db.query(
            `UPDATE "currencies" 
             SET "isActive" = true, "name" = $1, "symbol" = $2, "decimalPlaces" = $3, "updatedAt" = $4
             WHERE "code" = $5`,
            [
              value.name,
              value.symbol ?? null,
              value.decimalPlaces,
              now,
              value.code,
            ]
          );
          toast.success(t`Currency activated successfully`);
        }

        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(
          isEdit
            ? t`Failed to update currency: ${errorMessage}`
            : t`Failed to activate currency: ${errorMessage}`
        );
      }
    },
    [db, isEdit, currency, form, onOpenChange, onSuccess]
  );

  // Reset form when currency or open state changes
  useEffect(() => {
    if (currency) {
      form.reset({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol ?? "",
        decimalPlaces: currency.decimalPlaces,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        symbol: "",
        decimalPlaces: DEFAULT_DECIMAL_PLACES,
      });
      setSelectedCurrency(null);
    }
  }, [currency, form]);

  const handleCurrencySelect = useCallback(
    (code: string) => {
      const selected = inactiveCurrencies.find((c) => c.code === code);
      if (selected) {
        setSelectedCurrency(selected);
        // Auto-populate fields
        form.setFieldValue("code", selected.code);
        form.setFieldValue("name", selected.name);
        form.setFieldValue("symbol", selected.symbol ?? "");
      }
    },
    [inactiveCurrencies, form]
  );

  const handleClose = useCallback(() => {
    form.reset();
    setSelectedCurrency(null);
    onOpenChange(false);
  }, [form, onOpenChange]);

  return (
    <Drawer
      direction={dir === "rtl" ? "left" : "right"}
      onOpenChange={onOpenChange}
      open={open}
    >
      <DrawerContent className="right-0 left-auto my-0 h-screen w-full max-w-md rounded-none">
        <form
          className="flex h-full flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <DrawerHeader className="border-b px-6">
            <DrawerTitle>
              {isEdit ? (
                <Trans>Edit Currency</Trans>
              ) : (
                <Trans>Activate Currency</Trans>
              )}
            </DrawerTitle>
            <DrawerDescription>
              {isEdit ? (
                <Trans>Update the currency details below.</Trans>
              ) : (
                <Trans>Select a currency to activate.</Trans>
              )}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <FieldGroup>
              {/* Currency Selector (only for new/activate) */}
              {!isEdit && (
                <form.Field name="code">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          <Trans>Currency</Trans>
                        </FieldLabel>
                        <Select
                          name={field.name}
                          onValueChange={handleCurrencySelect}
                          value={field.state.value}
                        >
                          <SelectTrigger
                            aria-invalid={isInvalid}
                            id={field.name}
                          >
                            <SelectValue placeholder="Select currency..." />
                          </SelectTrigger>
                          <SelectContent>
                            {inactiveCurrencies.length === 0 ? (
                              <SelectItem disabled value="__no_currencies__">
                                <Trans>No inactive currencies available</Trans>
                              </SelectItem>
                            ) : (
                              inactiveCurrencies.map((curr) => (
                                <SelectItem key={curr.code} value={curr.code}>
                                  {curr.code} - {curr.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          <Trans>
                            Select an inactive currency to activate.
                          </Trans>
                        </FieldDescription>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              )}

              {/* Currency Code (read-only for edit) */}
              {isEdit && (
                <Field>
                  <FieldLabel>
                    <Trans>Currency Code</Trans>
                  </FieldLabel>
                  <Input disabled value={currency?.code ?? ""} />
                  <FieldDescription>
                    <Trans>Currency code cannot be changed.</Trans>
                  </FieldDescription>
                </Field>
              )}

              {/* Currency Name */}
              {(isEdit || selectedCurrency) && (
                <form.Field name="name">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          <Trans>Currency Name</Trans>
                        </FieldLabel>
                        <Input
                          aria-invalid={isInvalid}
                          autoComplete="off"
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="US Dollar, Euro, British Pound..."
                          value={field.state.value}
                        />
                        <FieldDescription>
                          <Trans>The full name of the currency.</Trans>
                        </FieldDescription>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              )}

              {/* Currency Symbol */}
              {(isEdit || selectedCurrency) && (
                <form.Field name="symbol">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          <Trans>Currency Symbol</Trans>
                        </FieldLabel>
                        <Input
                          aria-invalid={isInvalid}
                          autoComplete="off"
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="$, €, £, ¥..."
                          value={field.state.value ?? ""}
                        />
                        <FieldDescription>
                          <Trans>
                            The symbol used to display currency values.
                          </Trans>
                        </FieldDescription>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              )}

              {(isEdit || selectedCurrency) && <FieldSeparator />}

              {/* Decimal Places */}
              {(isEdit || selectedCurrency) && (
                <form.Field name="decimalPlaces">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid} orientation="responsive">
                        <FieldContent>
                          <FieldTitle>
                            <Trans>Decimal Places</Trans>
                          </FieldTitle>
                          <FieldDescription>
                            <Trans>
                              Number of decimal places for currency values.
                            </Trans>
                          </FieldDescription>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </FieldContent>
                        <Select
                          name={field.name}
                          onValueChange={(val) =>
                            field.handleChange(Number.parseInt(val, 10))
                          }
                          value={String(field.state.value)}
                        >
                          <SelectTrigger
                            aria-invalid={isInvalid}
                            className="w-[180px]"
                            id={field.name}
                          >
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {DECIMAL_PLACES_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    );
                  }}
                </form.Field>
              )}
            </FieldGroup>
          </div>

          <DrawerFooter className="border-t px-6">
            <div className="flex gap-3">
              <DrawerClose asChild>
                <Button onClick={handleClose} type="button" variant="outline">
                  <Trans>Cancel</Trans>
                </Button>
              </DrawerClose>
              <Button disabled={!(isEdit || selectedCurrency)} type="submit">
                {isEdit ? (
                  <Trans>Save Changes</Trans>
                ) : (
                  <Trans>Activate Currency</Trans>
                )}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
