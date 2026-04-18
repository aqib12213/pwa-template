import { usePGlite } from "@electric-sql/pglite-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CurrencyRow,
  type CurrencySyncLogRow,
  fetchCurrencyNames,
  fetchExchangeRates,
  getCurrencySymbol,
  isSyncNeeded,
  mapRowToCurrency,
  mapRowToSyncLog,
  SYNC_INTERVAL_MS,
} from "./currencies";
import type { Currency, CurrencyFormValues, CurrencySyncLog } from "./schema";

interface UseCurrenciesOptions {
  autoSync?: boolean;
}

interface UseCurrenciesReturn {
  currencies: Currency[];
  isLoading: boolean;
  error: string | null;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  autoSyncEnabled: boolean;
  syncCurrencies: () => Promise<void>;
  getSyncLogs: () => Promise<CurrencySyncLog[]>;
  updateCurrency: (
    id: number,
    updates: Partial<Omit<Currency, "id" | "createdAt" | "updatedAt">>
  ) => Promise<void>;
  toggleActive: (id: number, isActive: boolean) => Promise<void>;
  setDefault: (id: number) => Promise<void>;
  deleteCurrency: (id: number) => Promise<void>;
  deleteCurrencies: (ids: number[]) => Promise<void>;
  importCurrencies: (currencies: CurrencyFormValues[]) => Promise<void>;
  setAutoSyncEnabled: (enabled: boolean) => void;
  refreshCurrencies: () => Promise<void>;
}

const DEFAULT_DECIMAL_PLACES = 2;

// Default currencies to activate on first sync
const DEFAULT_ACTIVE_CURRENCIES = [
  "USD", // US Dollar
  "EUR", // Euro
  "CAD", // Canadian Dollar
  "GBP", // British Pound
  "SAR", // Saudi Riyal
  "AUD", // Australian Dollar
  "AED", // UAE Dirham
  "INR", // Indian Rupee
  "PKR", // Pakistani Rupee
  "TRY", // Turkish Lira
  "AFN", // Afghan Afghani
  "CNY", // Chinese Yuan
  "JPY", // Japanese Yen
  "OMR", // Omani Rial
  "QAR", // Qatari Riyal
];

interface CurrencySyncParams {
  db: ReturnType<typeof usePGlite>;
  code: string;
  rate: number;
  name: string;
  symbol: string | undefined;
  now: string;
  isFirstSync: boolean;
}

/**
 * Check if this is the first sync (no currencies in DB)
 */
async function checkIsFirstSync(
  db: ReturnType<typeof usePGlite>
): Promise<boolean> {
  if (!db) {
    return false;
  }
  const result = await db.query<{ count: number }>(
    'SELECT COUNT(*) as count FROM "currencies"'
  );
  return result.rows[0].count === 0;
}

/**
 * Process a single currency during sync
 */
async function processCurrencySync(params: CurrencySyncParams): Promise<void> {
  const { db, code, rate, name, symbol, now, isFirstSync } = params;

  if (!db) {
    return;
  }

  const isUsd = code === "USD";
  const shouldActivate =
    isFirstSync && DEFAULT_ACTIVE_CURRENCIES.includes(code);

  // Check if currency exists
  const existingResult = await db.query<{ id: number; isActive: boolean }>(
    'SELECT "id", "isActive" FROM "currencies" WHERE "code" = $1',
    [code]
  );

  if (existingResult.rows.length > 0) {
    // Update existing currency (only if active or first sync)
    const existing = existingResult.rows[0];
    if (existing.isActive || isFirstSync) {
      await db.query(
        `UPDATE "currencies" 
         SET "rate" = $1, "name" = $2, "symbol" = COALESCE($3, "symbol"), 
             "lastSyncedAt" = $4, "updatedAt" = $4
         WHERE "code" = $5`,
        [String(rate), name, symbol, now, code]
      );
    }
  } else if (isFirstSync) {
    // Insert new currency (only on first sync)
    await db.query(
      `INSERT INTO "currencies" 
       ("code", "name", "symbol", "rate", "baseCurrency", "isActive", "isDefault", "decimalPlaces", "lastSyncedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $9)`,
      [
        code,
        name,
        symbol,
        String(rate),
        "USD",
        shouldActivate,
        isUsd,
        DEFAULT_DECIMAL_PLACES,
        now,
      ]
    );
  }
}

/**
 * Hook for managing currencies with auto-sync functionality
 */
export function useCurrencies(
  options: UseCurrenciesOptions = {}
): UseCurrenciesReturn {
  const { autoSync = true } = options;
  const db = usePGlite();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabledState] = useState(autoSync);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Load auto-sync setting from database
   */
  const loadAutoSyncSetting = useCallback(async () => {
    if (!db) {
      return;
    }

    try {
      const result = await db.query<{ value: string }>(
        'SELECT "value" FROM "db_sync_status" WHERE "key" = $1',
        ["currency_auto_sync"]
      );

      if (result.rows.length > 0) {
        const enabled = result.rows[0].value === "true";
        setAutoSyncEnabledState(enabled);
      }
    } catch (err) {
      // If table doesn't exist or query fails, use default
      console.warn("Failed to load auto-sync setting:", err);
    }
  }, [db]);

  /**
   * Save auto-sync setting to database
   */
  const setAutoSyncEnabled = useCallback(
    async (enabled: boolean) => {
      if (!db) {
        return;
      }

      try {
        // Update state immediately for UI responsiveness
        setAutoSyncEnabledState(enabled);

        // Check if setting exists
        const existingResult = await db.query<{ id: number }>(
          'SELECT "id" FROM "db_sync_status" WHERE "key" = $1',
          ["currency_auto_sync"]
        );

        if (existingResult.rows.length > 0) {
          // Update existing setting
          await db.query(
            'UPDATE "db_sync_status" SET "value" = $1, "updatedAt" = $2 WHERE "key" = $3',
            [String(enabled), new Date().toISOString(), "currency_auto_sync"]
          );
        } else {
          // Insert new setting
          await db.query(
            'INSERT INTO "db_sync_status" ("key", "value", "updatedAt") VALUES ($1, $2, $3)',
            ["currency_auto_sync", String(enabled), new Date().toISOString()]
          );
        }
      } catch (err) {
        console.error("Failed to save auto-sync setting:", err);
      }
    },
    [db]
  );

  /**
   * Fetch currencies from local database
   */
  const fetchLocalCurrencies = useCallback(async () => {
    if (!db) {
      return;
    }

    try {
      const result = await db.query<CurrencyRow>(
        'SELECT * FROM "currencies" ORDER BY "isDefault" DESC, "code" ASC'
      );
      const mapped = result.rows.map(mapRowToCurrency);
      setCurrencies(mapped);

      // Get the most recent sync time
      const syncResult = await db.query<{ lastSyncedAt: string | null }>(
        'SELECT MAX("lastSyncedAt") as "lastSyncedAt" FROM "currencies"'
      );
      if (syncResult.rows[0]?.lastSyncedAt) {
        setLastSyncedAt(new Date(syncResult.rows[0].lastSyncedAt));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch currencies"
      );
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  /**
   * Sync currencies from OpenExchangeRates API
   */
  const syncCurrencies = useCallback(async () => {
    if (!db || isSyncing) {
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      // Check if this is the first sync
      const isFirstSync = await checkIsFirstSync(db);

      // Fetch rates and names in parallel
      const [ratesData, namesData] = await Promise.all([
        fetchExchangeRates(),
        fetchCurrencyNames(),
      ]);

      const now = new Date().toISOString();
      const ratesEntries = Object.entries(ratesData.rates);

      // Process each currency
      for (const [code, rate] of ratesEntries) {
        const name = namesData[code] ?? code;
        const symbol = getCurrencySymbol(code);
        await processCurrencySync({
          db,
          code,
          rate,
          name,
          symbol,
          now,
          isFirstSync,
        });
      }

      // Log successful sync
      await db.query(
        `INSERT INTO "currency_sync_log" ("syncedAt", "status", "currenciesUpdated", "apiResponse")
         VALUES ($1, $2, $3, $4)`,
        [
          now,
          "success",
          ratesEntries.length,
          JSON.stringify({ timestamp: ratesData.timestamp }),
        ]
      );

      setLastSyncedAt(new Date(now));

      // Refresh local data
      await fetchLocalCurrencies();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sync currencies";
      setError(errorMessage);

      // Log failed sync
      try {
        await db.query(
          `INSERT INTO "currency_sync_log" ("syncedAt", "status", "errorMessage")
           VALUES ($1, $2, $3)`,
          [new Date().toISOString(), "error", errorMessage]
        );
      } catch {
        // Ignore logging errors
      }
    } finally {
      setIsSyncing(false);
    }
  }, [db, isSyncing, fetchLocalCurrencies]);

  /**
   * Get sync logs
   */
  const getSyncLogs = useCallback(async (): Promise<CurrencySyncLog[]> => {
    if (!db) {
      return [];
    }

    try {
      const result = await db.query<CurrencySyncLogRow>(
        'SELECT * FROM "currency_sync_log" ORDER BY "syncedAt" DESC LIMIT 50'
      );
      return result.rows.map(mapRowToSyncLog);
    } catch {
      return [];
    }
  }, [db]);

  /**
   * Update a currency
   */
  const updateCurrency = useCallback(
    async (
      id: number,
      updates: Partial<Omit<Currency, "id" | "createdAt" | "updatedAt">>
    ) => {
      if (!db) {
        return;
      }

      const setClauses: string[] = [];
      const values: (string | number | boolean | null)[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          setClauses.push(`"${key}" = $${paramIndex}`);
          // Convert Date to ISO string if needed
          const processedValue =
            value instanceof Date ? value.toISOString() : value;
          values.push(processedValue as string | number | boolean | null);
          paramIndex += 1;
        }
      }

      if (setClauses.length === 0) {
        return;
      }

      setClauses.push(`"updatedAt" = $${paramIndex}`);
      values.push(new Date().toISOString());
      paramIndex += 1;

      values.push(id);

      await db.query(
        `UPDATE "currencies" SET ${setClauses.join(", ")} WHERE "id" = $${paramIndex}`,
        values
      );

      await fetchLocalCurrencies();
    },
    [db, fetchLocalCurrencies]
  );

  /**
   * Toggle currency active status
   */
  const toggleActive = useCallback(
    async (id: number, isActive: boolean) => {
      await updateCurrency(id, { isActive });
    },
    [updateCurrency]
  );

  /**
   * Set a currency as default
   */
  const setDefault = useCallback(
    async (id: number) => {
      if (!db) {
        return;
      }

      // First, unset current default
      await db.query(
        `UPDATE "currencies" SET "isDefault" = false, "updatedAt" = $1 WHERE "isDefault" = true`,
        [new Date().toISOString()]
      );

      // Set new default
      await updateCurrency(id, { isDefault: true });
    },
    [db, updateCurrency]
  );

  /**
   * Delete a single currency (deactivate)
   */
  const deleteCurrency = useCallback(
    async (id: number) => {
      if (!db) {
        return;
      }

      // Don't allow deactivating the default currency
      const currencyToDelete = currencies.find((c) => c.id === id);
      if (currencyToDelete?.isDefault) {
        throw new Error("Cannot deactivate the default currency");
      }

      // Deactivate instead of delete
      await db.query(
        'UPDATE "currencies" SET "isActive" = false, "updatedAt" = $1 WHERE "id" = $2',
        [new Date().toISOString(), id]
      );
      await fetchLocalCurrencies();
    },
    [db, currencies, fetchLocalCurrencies]
  );

  /**
   * Delete multiple currencies (deactivate)
   */
  const deleteCurrencies = useCallback(
    async (ids: number[]) => {
      if (!db || ids.length === 0) {
        return;
      }

      // Don't allow deactivating the default currency
      const hasDefault = currencies.some(
        (c) => ids.includes(c.id) && c.isDefault
      );
      if (hasDefault) {
        throw new Error("Cannot deactivate the default currency");
      }

      const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
      const now = new Date().toISOString();
      await db.query(
        `UPDATE "currencies" SET "isActive" = false, "updatedAt" = '${now}' WHERE "id" IN (${placeholders})`,
        ids
      );
      await fetchLocalCurrencies();
    },
    [db, currencies, fetchLocalCurrencies]
  );

  /**
   * Import currencies from form values (insert or update)
   */
  const importCurrencies = useCallback(
    async (currenciesToImport: CurrencyFormValues[]) => {
      if (!db || currenciesToImport.length === 0) {
        return;
      }

      const now = new Date().toISOString();

      for (const currency of currenciesToImport) {
        // Check if currency with same code exists
        const existingResult = await db.query<{ id: number }>(
          'SELECT "id" FROM "currencies" WHERE "code" = $1',
          [currency.code]
        );

        if (existingResult.rows.length > 0) {
          // Update existing currency
          await db.query(
            `UPDATE "currencies" 
             SET "name" = $1, "symbol" = COALESCE($2, "symbol"), "rate" = $3, 
                 "decimalPlaces" = $4, "isActive" = $5, "updatedAt" = $6
             WHERE "code" = $7`,
            [
              currency.name,
              currency.symbol,
              currency.rate,
              currency.decimalPlaces,
              currency.isActive,
              now,
              currency.code,
            ]
          );
        } else {
          // Insert new currency
          await db.query(
            `INSERT INTO "currencies" 
             ("code", "name", "symbol", "rate", "baseCurrency", "isActive", "isDefault", "decimalPlaces", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
            [
              currency.code,
              currency.name,
              currency.symbol,
              currency.rate,
              "USD",
              currency.isActive,
              currency.isDefault,
              currency.decimalPlaces,
              now,
            ]
          );
        }
      }

      await fetchLocalCurrencies();
    },
    [db, fetchLocalCurrencies]
  );

  // Initial load
  useEffect(() => {
    loadAutoSyncSetting();
    fetchLocalCurrencies();
  }, [loadAutoSyncSetting, fetchLocalCurrencies]);

  // Auto-sync on mount if needed
  useEffect(() => {
    if (!autoSyncEnabled || isLoading) {
      return;
    }

    // Check if sync is needed
    if (isSyncNeeded(lastSyncedAt) || currencies.length === 0) {
      syncCurrencies();
    }
  }, [
    autoSyncEnabled,
    isLoading,
    lastSyncedAt,
    currencies.length,
    syncCurrencies,
  ]);

  // Setup periodic sync
  useEffect(() => {
    if (!autoSyncEnabled) {
      return;
    }

    // Clear existing interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    // Setup new interval
    syncIntervalRef.current = setInterval(() => {
      syncCurrencies();
    }, SYNC_INTERVAL_MS);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSyncEnabled, syncCurrencies]);

  return {
    currencies,
    isLoading,
    error,
    lastSyncedAt,
    isSyncing,
    autoSyncEnabled,
    syncCurrencies,
    getSyncLogs,
    updateCurrency,
    toggleActive,
    setDefault,
    deleteCurrency,
    deleteCurrencies,
    importCurrencies,
    setAutoSyncEnabled,
    refreshCurrencies: fetchLocalCurrencies,
  };
}

/**
 * Hook to get active currencies for dropdowns
 */
export function useActiveCurrencies(): {
  currencies: Currency[];
  isLoading: boolean;
} {
  const { currencies, isLoading } = useCurrencies({ autoSync: false });

  const activeCurrencies = currencies.filter((c) => c.isActive);

  return {
    currencies: activeCurrencies,
    isLoading,
  };
}

/**
 * Hook to get default currency
 */
export function useDefaultCurrency(): {
  currency: Currency | null;
  isLoading: boolean;
} {
  const { currencies, isLoading } = useCurrencies({ autoSync: false });

  const defaultCurrency = currencies.find((c) => c.isDefault) ?? null;

  return {
    currency: defaultCurrency,
    isLoading,
  };
}
