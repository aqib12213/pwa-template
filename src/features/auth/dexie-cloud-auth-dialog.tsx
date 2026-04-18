import { t } from "@lingui/core/macro";
import {
    type DXCAlert,
    type DXCInputField,
    type DXCOption,
    resolveText,
} from "dexie-cloud-addon";
import { useObservable } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DB } from "@/db/db";

type AuthParams = Record<string, string>;

const getAlertVariantClasses = (type: DXCAlert["type"]): string => {
    switch (type) {
        case "error":
            return "border-red-200 bg-red-50 text-red-800";
        case "warning":
            return "border-amber-200 bg-amber-50 text-amber-900";
        default:
            return "border-muted bg-muted/40 text-foreground";
    }
};

const getLabelForField = (fieldName: string, field: DXCInputField): string => {
    if (field.label) {
        return field.label;
    }

    if (fieldName === "email") {
        return t`Email`;
    }

    if (fieldName === "otp") {
        return t`One-Time Password`;
    }

    return fieldName;
};

export function DexieCloudAuthDialog() {
    const interaction = useObservable(DB.cloud.userInteraction);
    const [params, setParams] = useState<AuthParams>({});

    useEffect(() => {
        const nextParams = Object.fromEntries(
            Object.entries(interaction?.fields ?? {}).map(([name]) => [name, ""])
        );
        setParams(nextParams);
    }, [interaction]);

    if (!interaction) {
        return null;
    }

    const fields = Object.entries(interaction.fields) as [
        string,
        DXCInputField,
    ][];
    const options = "options" in interaction ? (interaction.options ?? []) : [];
    const hasFields = fields.length > 0;
    const hasOptions = options.length > 0;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        interaction.onSubmit(params);
    };

    const handleOptionClick = (option: DXCOption): void => {
        interaction.onSubmit({ [option.name]: option.value });
    };

    return (
        <Dialog open>
            <DialogContent className="max-w-lg" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{interaction.title}</DialogTitle>
                    <DialogDescription>
                        {interaction.type === "otp"
                            ? t`Enter the code sent to your email to finish signing in.`
                            : t`Continue to your account.`}
                    </DialogDescription>
                </DialogHeader>

                {interaction.alerts.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {interaction.alerts.map((alert) => (
                            <div
                                className={`rounded-md border px-3 py-2 text-sm ${getAlertVariantClasses(alert.type)}`}
                                key={`${alert.messageCode}:${alert.message}`}
                            >
                                {resolveText(alert)}
                            </div>
                        ))}
                    </div>
                ) : null}

                {hasOptions ? (
                    <div className="flex flex-col gap-2">
                        {options.map((option) => (
                            <Button
                                className="justify-start"
                                key={`${option.name}:${option.value}`}
                                onClick={() => handleOptionClick(option)}
                                type="button"
                                variant="outline"
                            >
                                {option.iconUrl ? (
                                    <img
                                        alt=""
                                        className="size-4"
                                        height={16}
                                        src={option.iconUrl}
                                        width={16}
                                    />
                                ) : null}
                                {option.displayName}
                            </Button>
                        ))}
                    </div>
                ) : null}

                {hasFields ? (
                    <form className="grid gap-4" onSubmit={handleSubmit}>
                        <FieldGroup>
                            {fields.map(([fieldName, field], index) => (
                                <Field key={fieldName}>
                                    <FieldLabel htmlFor={fieldName}>
                                        {getLabelForField(fieldName, field)}
                                    </FieldLabel>
                                    <Input
                                        autoFocus={index === 0}
                                        id={fieldName}
                                        onChange={(event) => {
                                            setParams((prev) => ({
                                                ...prev,
                                                [fieldName]: event.target.value,
                                            }));
                                        }}
                                        placeholder={field.placeholder}
                                        type={field.type === "otp" ? "text" : field.type}
                                        value={params[fieldName] ?? ""}
                                    />
                                </Field>
                            ))}
                        </FieldGroup>

                        <DialogFooter>
                            <Button type="submit">{interaction.submitLabel}</Button>
                            {interaction.cancelLabel ? (
                                <Button
                                    // Disable the cancel button to prevent users from application without submitting auth credintials.
                                    disabled={true}
                                    onClick={interaction.onCancel}
                                    type="button"
                                    variant="outline"
                                >
                                    {interaction.cancelLabel}
                                </Button>
                            ) : null}
                        </DialogFooter>
                    </form>
                ) : (
                    <DialogFooter>
                        <Button onClick={() => interaction.onSubmit({})} type="button">
                            {interaction.submitLabel}
                        </Button>
                        {interaction.cancelLabel ? (
                            <Button
                                // Disable the cancel button to prevent users from application without submitting auth credintials.
                                disabled={true}
                                onClick={interaction.onCancel}
                                type="button"
                                variant="outline"
                            >
                                {interaction.cancelLabel}
                            </Button>
                        ) : null}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
