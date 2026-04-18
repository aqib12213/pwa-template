import { Trans, useLingui } from "@lingui/react/macro";
import { useForm } from "@tanstack/react-form";
import { ChevronDownIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import {
    NativeSelect,
    NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
    amountToCents,
    type DonationDraft,
    parseDateInputToEpochMs,
} from "@/features/donation/donation-utils";
import { useIsMobile } from "@/hooks/use-mobile";

const DEFAULT_CURRENCIES = ["PKR", "USD", "EUR", "GBP"] as const;

const PAYMENT_METHOD_VALUES = [
    "cash",
    "card",
    "bank_transfer",
    "easypaisa",
    "jazzcash",
    "other",
] as const;

const isPaymentMethodOption = (value: string): boolean => {
    return PAYMENT_METHOD_VALUES.includes(value as never);
};

const normalizeCurrency = (value: string): string => {
    return value.trim().toUpperCase();
};

const normalizePaymentMethod = (value: string): string => {
    const trimmed = value.trim();
    return isPaymentMethodOption(trimmed) ? trimmed : "";
};

const validateRequired = (
    value: string,
    message: string
): string | undefined => {
    return value.trim().length > 0 ? undefined : message;
};

const validateAmount = (value: string): string | undefined => {
    return amountToCents(value) === null ? "Enter a valid amount" : undefined;
};

const validateDonatedOn = (value: string): string | undefined => {
    return parseDateInputToEpochMs(value) === null
        ? "Enter a valid date"
        : undefined;
};

export function DonationDrawer(props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingDonationId: string | null;
    initialDraft: DonationDraft;
    onRecordClick: () => void;
    onSubmit: (draft: DonationDraft) => Promise<void>;
}) {
    const {
        open,
        onOpenChange,
        editingDonationId,
        initialDraft,
        onRecordClick,
        onSubmit,
    } = props;

    const { t: translate } = useLingui();
    const isMobile = useIsMobile();

    const currencyOptions = useMemo(() => {
        const normalized = normalizeCurrency(initialDraft.currency);
        if (normalized && !DEFAULT_CURRENCIES.includes(normalized as never)) {
            return [normalized, ...DEFAULT_CURRENCIES];
        }

        return [...DEFAULT_CURRENCIES];
    }, [initialDraft.currency]);

    const form = useForm({
        defaultValues: {
            donorName: initialDraft.donorName,
            amount: initialDraft.amount,
            currency: normalizeCurrency(initialDraft.currency) || "PKR",
            donatedOn: initialDraft.donatedOn,
            category: initialDraft.category,
            paymentMethod: normalizePaymentMethod(initialDraft.paymentMethod),
            notes: initialDraft.notes,
            description: initialDraft.description,
        },
        onSubmit: async ({ value }) => {
            await onSubmit(value);
        },
    });

    const handleClose = (): void => {
        onOpenChange(false);
    };

    return (
        <Drawer
            direction={isMobile ? "bottom" : "right"}
            dismissible={true}
            handleOnly={isMobile}
            modal={isMobile}
            onOpenChange={onOpenChange}
            open={open}
        >
            <Button onClick={onRecordClick} size="sm">
                <Trans>Record Donation</Trans>
            </Button>

            <DrawerContent className="overflow-hidden">
                <DrawerHeader>
                    <DrawerTitle>
                        {editingDonationId ? (
                            <Trans>Edit donation</Trans>
                        ) : (
                            <Trans>Record donation</Trans>
                        )}
                    </DrawerTitle>
                </DrawerHeader>

                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={async (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        await form.handleSubmit();
                    }}
                >
                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        <FieldGroup>
                            <form.Field
                                name="donorName"
                                validators={{
                                    onBlur: ({ value }) =>
                                        validateRequired(value, "Donor name is required"),
                                    onSubmit: ({ value }) =>
                                        validateRequired(value, "Donor name is required"),
                                }}
                            >
                                {(field) => {
                                    const fieldError = field.state.meta.errors[0];
                                    const errorMessage =
                                        typeof fieldError === "string" ? fieldError : undefined;

                                    return (
                                        <Field data-invalid={Boolean(errorMessage)}>
                                            <FieldLabel htmlFor={field.name}>
                                                <Trans>Donor name</Trans>
                                            </FieldLabel>
                                            <Input
                                                aria-invalid={Boolean(errorMessage)}
                                                aria-label={translate`Donor name`}
                                                id={field.name}
                                                name={field.name}
                                                onBlur={field.handleBlur}
                                                onChange={(event) =>
                                                    field.handleChange(event.target.value)
                                                }
                                                placeholder={translate`e.g., John Doe`}
                                                value={field.state.value}
                                            />
                                            <FieldError>{errorMessage}</FieldError>
                                        </Field>
                                    );
                                }}
                            </form.Field>

                            <form.Field
                                name="amount"
                                validators={{
                                    onBlur: ({ value }) => validateAmount(value),
                                    onSubmit: ({ value }) => validateAmount(value),
                                }}
                            >
                                {(amountField) => {
                                    return (
                                        <form.Field
                                            name="currency"
                                            validators={{
                                                onBlur: ({ value }) =>
                                                    validateRequired(value, "Currency is required"),
                                                onSubmit: ({ value }) =>
                                                    validateRequired(value, "Currency is required"),
                                            }}
                                        >
                                            {(currencyField) => {
                                                const amountError = amountField.state.meta.errors[0];
                                                const currencyError =
                                                    currencyField.state.meta.errors[0];

                                                const errorMessage =
                                                    (typeof amountError === "string"
                                                        ? amountError
                                                        : undefined) ||
                                                    (typeof currencyError === "string"
                                                        ? currencyError
                                                        : undefined);

                                                return (
                                                    <Field data-invalid={Boolean(errorMessage)}>
                                                        <FieldLabel htmlFor={amountField.name}>
                                                            <Trans>Amount</Trans>
                                                        </FieldLabel>
                                                        <InputGroup>
                                                            <InputGroupInput
                                                                aria-invalid={Boolean(errorMessage)}
                                                                aria-label={translate`Amount`}
                                                                id={amountField.name}
                                                                min="10"
                                                                name={amountField.name}
                                                                onBlur={amountField.handleBlur}
                                                                onChange={(event) =>
                                                                    amountField.handleChange(event.target.value)
                                                                }
                                                                placeholder={translate`e.g., 200.00`}
                                                                step="1"
                                                                type="number"
                                                                value={amountField.state.value}
                                                            />
                                                            <InputGroupAddon
                                                                align="inline-end"
                                                                className="cursor-default"
                                                                data-vaul-no-drag
                                                            >
                                                                <DropdownMenu
                                                                    modal={false}
                                                                    onOpenChange={(openState) => {
                                                                        if (!openState) {
                                                                            currencyField.handleBlur();
                                                                        }
                                                                    }}
                                                                >
                                                                    <DropdownMenuTrigger
                                                                        render={
                                                                            <InputGroupButton
                                                                                aria-label={translate`Currency`}
                                                                                className="h-8 border-0 bg-transparent px-2 text-xs"
                                                                                data-vaul-no-drag
                                                                                onPointerDown={(event) => {
                                                                                    event.stopPropagation();
                                                                                }}
                                                                                variant="ghost"
                                                                            >
                                                                                {currencyField.state.value}
                                                                                <ChevronDownIcon className="size-3" />
                                                                            </InputGroupButton>
                                                                        }
                                                                    />
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuGroup>
                                                                            {currencyOptions.map((currency) => (
                                                                                <DropdownMenuItem
                                                                                    key={currency}
                                                                                    onClick={() => {
                                                                                        currencyField.handleChange(
                                                                                            currency
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    {currency}
                                                                                </DropdownMenuItem>
                                                                            ))}
                                                                        </DropdownMenuGroup>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </InputGroupAddon>
                                                        </InputGroup>
                                                        <FieldError>{errorMessage}</FieldError>
                                                    </Field>
                                                );
                                            }}
                                        </form.Field>
                                    );
                                }}
                            </form.Field>

                            <form.Field
                                name="donatedOn"
                                validators={{
                                    onBlur: ({ value }) => validateDonatedOn(value),
                                    onSubmit: ({ value }) => validateDonatedOn(value),
                                }}
                            >
                                {(field) => {
                                    const fieldError = field.state.meta.errors[0];
                                    const errorMessage =
                                        typeof fieldError === "string" ? fieldError : undefined;

                                    return (
                                        <Field data-invalid={Boolean(errorMessage)}>
                                            <FieldLabel htmlFor={field.name}>
                                                <Trans>Date</Trans>
                                            </FieldLabel>
                                            <Input
                                                aria-invalid={Boolean(errorMessage)}
                                                aria-label={translate`Date`}
                                                data-vaul-no-drag
                                                id={field.name}
                                                name={field.name}
                                                onBlur={field.handleBlur}
                                                onChange={(event) =>
                                                    field.handleChange(event.target.value)
                                                }
                                                type="date"
                                                value={field.state.value}
                                            />
                                            <FieldError>{errorMessage}</FieldError>
                                        </Field>
                                    );
                                }}
                            </form.Field>

                            <form.Field
                                name="category"
                                validators={{
                                    onBlur: ({ value }) =>
                                        validateRequired(value, "Category is required"),
                                    onSubmit: ({ value }) =>
                                        validateRequired(value, "Category is required"),
                                }}
                            >
                                {(field) => {
                                    const fieldError = field.state.meta.errors[0];
                                    const errorMessage =
                                        typeof fieldError === "string" ? fieldError : undefined;

                                    return (
                                        <Field data-invalid={Boolean(errorMessage)}>
                                            <FieldLabel htmlFor={field.name}>
                                                <Trans>Category</Trans>
                                            </FieldLabel>
                                            <Input
                                                aria-invalid={Boolean(errorMessage)}
                                                aria-label={translate`Category`}
                                                id={field.name}
                                                name={field.name}
                                                onBlur={field.handleBlur}
                                                onChange={(event) =>
                                                    field.handleChange(event.target.value)
                                                }
                                                placeholder={translate`e.g., General`}
                                                value={field.state.value}
                                            />
                                            <FieldError>{errorMessage}</FieldError>
                                        </Field>
                                    );
                                }}
                            </form.Field>

                            <form.Field
                                name="paymentMethod"
                                validators={{
                                    onSubmit: ({ value }) =>
                                        validateRequired(value, "Payment method is required"),
                                }}
                            >
                                {(field) => {
                                    const fieldError = field.state.meta.errors[0];
                                    const errorMessage =
                                        typeof fieldError === "string" ? fieldError : undefined;

                                    return (
                                        <Field data-invalid={Boolean(errorMessage)}>
                                            <FieldLabel>
                                                <Trans>Payment method</Trans>
                                            </FieldLabel>
                                            <NativeSelect
                                                aria-invalid={Boolean(errorMessage)}
                                                aria-label={translate`Payment method`}
                                                onBlur={field.handleBlur}
                                                onChange={(event) => {
                                                    field.handleChange(event.currentTarget.value);
                                                }}
                                                value={field.state.value}
                                            >
                                                <NativeSelectOption disabled value="">
                                                    {translate`Select a payment method`}
                                                </NativeSelectOption>
                                                {PAYMENT_METHOD_VALUES.map((method) => (
                                                    <NativeSelectOption key={method} value={method}>
                                                        {method
                                                            .replace(/_/g, " ")
                                                            .replace(/\b\w/g, (char) => char.toUpperCase())}
                                                    </NativeSelectOption>
                                                ))}
                                            </NativeSelect>
                                            <FieldError>{errorMessage}</FieldError>
                                        </Field>
                                    );
                                }}
                            </form.Field>

                            <form.Field name="notes">
                                {(field) => {
                                    return (
                                        <Field>
                                            <FieldLabel htmlFor={field.name}>
                                                <Trans>Notes</Trans>
                                            </FieldLabel>
                                            <Textarea
                                                aria-label={translate`Notes`}
                                                id={field.name}
                                                name={field.name}
                                                onBlur={field.handleBlur}
                                                onChange={(event) =>
                                                    field.handleChange(event.target.value)
                                                }
                                                placeholder={translate`Optional`}
                                                value={field.state.value}
                                            />
                                        </Field>
                                    );
                                }}
                            </form.Field>
                        </FieldGroup>
                    </div>

                    <DrawerFooter>
                        <Button disabled={form.state.isSubmitting} type="submit">
                            {editingDonationId ? <Trans>Save</Trans> : <Trans>Record</Trans>}
                        </Button>
                        <Button onClick={handleClose} type="button" variant="ghost">
                            <Trans>Cancel</Trans>
                        </Button>
                    </DrawerFooter>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
