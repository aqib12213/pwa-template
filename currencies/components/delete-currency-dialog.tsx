import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Currency } from "../data/schema";

interface DeleteCurrencyDialogProps {
  currency: Currency;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: number) => Promise<void>;
}

export function DeleteCurrencyDialog({
  currency,
  open,
  onOpenChange,
  onConfirm,
}: DeleteCurrencyDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm(currency.id);
      toast.success(t`Currency "${currency.code}" deactivated successfully`);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to deactivate currency";
      toast.error(message);
    }
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans>Deactivate Currency</Trans>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Trans>
              Are you sure you want to deactivate the currency "{currency.code}"
              ({currency.name})? This will hide it from active use but you can
              reactivate it later.
            </Trans>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Trans>Cancel</Trans>
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} variant="destructive">
            <Trans>Deactivate</Trans>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
