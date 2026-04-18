import { Trans } from "@lingui/react/macro";
import { useState } from "react";
import { toast } from "sonner";
import { LanguageSwitch } from "@/components/language-switch";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CurrenciesTable } from "./components/currencies-table";
import { CurrencyDrawer } from "./components/currency-drawer";
import { DeleteCurrencyDialog } from "./components/delete-currency-dialog";
import type { Currency, CurrencyFormValues } from "./data/schema";
import { useCurrencies } from "./data/use-currencies";

export function Currencies() {
  const {
    currencies,
    isLoading,
    error,
    lastSyncedAt,
    isSyncing,
    autoSyncEnabled,
    syncCurrencies,
    setDefault,
    deleteCurrency,
    importCurrencies,
    setAutoSyncEnabled,
    refreshCurrencies,
  } = useCurrencies({ autoSync: true });

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | undefined>(
    undefined
  );

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCurrency, setDeletingCurrency] = useState<Currency | null>(
    null
  );

  const handleSync = async () => {
    try {
      await syncCurrencies();
      toast.success("Currencies synced successfully");
    } catch {
      toast.error("Failed to sync currencies");
    }
  };

  const handleAdd = () => {
    setEditingCurrency(undefined);
    setDrawerOpen(true);
  };

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    setDrawerOpen(true);
  };

  const handleSetDefault = async (currency: Currency) => {
    try {
      await setDefault(currency.id);
      toast.success(`${currency.code} set as base currency`);
    } catch {
      toast.error("Failed to set base currency");
    }
  };

  const handleDelete = (currency: Currency) => {
    setDeletingCurrency(currency);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (id: number) => {
    await deleteCurrency(id);
  };

  const handleImport = async (data: CurrencyFormValues[]) => {
    await importCurrencies(data);
    await refreshCurrencies();
  };

  const handleDrawerSuccess = () => {
    refreshCurrencies();
  };

  // Filter to show only active currencies
  const activeCurrencies = currencies.filter((c) => c.isActive);

  return (
    <>
      <Header>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <LanguageSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main
        className="flex flex-1 flex-col gap-4 overflow-y-scroll sm:gap-6"
        fixed
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="gap-2 font-bold text-2xl tracking-tight">
              <Trans>Currencies</Trans>
            </h2>
            <p className="text-muted-foreground">
              <Trans>
                Manage currency exchange rates. Rates are synced automatically
                from OpenExchangeRates every 12 hours.
              </Trans>
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>
              <Trans>Error</Trans>
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <CurrenciesTable
          autoSyncEnabled={autoSyncEnabled}
          currencies={activeCurrencies}
          isLoading={isLoading}
          isSyncing={isSyncing}
          lastSyncedAt={lastSyncedAt}
          onAdd={handleAdd}
          onAutoSyncChange={setAutoSyncEnabled}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onImport={handleImport}
          onSetDefault={handleSetDefault}
          onSync={handleSync}
        />
      </Main>

      {/* Currency Drawer */}
      <CurrencyDrawer
        currency={editingCurrency}
        onOpenChange={setDrawerOpen}
        onSuccess={handleDrawerSuccess}
        open={drawerOpen}
      />

      {/* Delete Dialog */}
      {deletingCurrency && (
        <DeleteCurrencyDialog
          currency={deletingCurrency}
          onConfirm={handleDeleteConfirm}
          onOpenChange={setDeleteDialogOpen}
          open={deleteDialogOpen}
        />
      )}
    </>
  );
}

export default Currencies;
