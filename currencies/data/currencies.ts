import type {
  Currency,
  CurrencySyncLog,
  OpenExchangeRatesCurrenciesResponse,
  OpenExchangeRatesResponse,
} from "./schema";
import { CURRENCY_SYMBOLS } from "./schema";

// OpenExchangeRates API configuration
const OPEN_EXCHANGE_RATES_APP_ID = "ed458a9e1804409c96897dfdd2af41e1";
const OPEN_EXCHANGE_RATES_BASE_URL = "https://openexchangerates.org/api";
const BASE_CURRENCY = "USD";

// Time constants
const HOURS_12 = 12;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;

// Sync interval in milliseconds (12 hours)
export const SYNC_INTERVAL_MS =
  HOURS_12 * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;

/**
 * Fetch latest exchange rates from OpenExchangeRates API
 */
export async function fetchExchangeRates(): Promise<OpenExchangeRatesResponse> {
  const url = `${OPEN_EXCHANGE_RATES_BASE_URL}/latest.json?app_id=${OPEN_EXCHANGE_RATES_APP_ID}&base=${BASE_CURRENCY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch exchange rates: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Fetch currency names from OpenExchangeRates API
 */
export async function fetchCurrencyNames(): Promise<OpenExchangeRatesCurrenciesResponse> {
  const url = `${OPEN_EXCHANGE_RATES_BASE_URL}/currencies.json?app_id=${OPEN_EXCHANGE_RATES_APP_ID}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch currency names: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(code: string): string | undefined {
  return CURRENCY_SYMBOLS[code.toUpperCase()];
}

/**
 * Database row type for currencies
 */
export interface CurrencyRow {
  id: number;
  code: string;
  name: string;
  symbol: string | null;
  rate: string;
  baseCurrency: string;
  isActive: boolean;
  isDefault: boolean;
  decimalPlaces: number;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Map database row to Currency type
 */
export function mapRowToCurrency(row: CurrencyRow): Currency {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    symbol: row.symbol ?? undefined,
    rate: row.rate,
    baseCurrency: row.baseCurrency,
    isActive: row.isActive,
    isDefault: row.isDefault,
    decimalPlaces: row.decimalPlaces,
    lastSyncedAt: row.lastSyncedAt ? new Date(row.lastSyncedAt) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

/**
 * Database row type for currency sync log
 */
export interface CurrencySyncLogRow {
  id: number;
  syncedAt: string;
  status: string;
  currenciesUpdated: number;
  errorMessage: string | null;
  apiResponse: string | null;
}

/**
 * Map database row to CurrencySyncLog type
 */
export function mapRowToSyncLog(row: CurrencySyncLogRow): CurrencySyncLog {
  return {
    id: row.id,
    syncedAt: new Date(row.syncedAt),
    status: row.status as "success" | "error",
    currenciesUpdated: row.currenciesUpdated,
    errorMessage: row.errorMessage,
    apiResponse: row.apiResponse,
  };
}

/**
 * Format currency value with proper decimal places and symbol
 */
export function formatCurrencyValue(value: number, currency: Currency): string {
  const symbol = currency.symbol ?? currency.code;
  const formattedValue = value.toFixed(currency.decimalPlaces);
  return `${symbol}${formattedValue}`;
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  const fromRate = Number.parseFloat(fromCurrency.rate);
  const toRate = Number.parseFloat(toCurrency.rate);

  // Convert to USD first, then to target currency
  const amountInUsd = amount / fromRate;
  return amountInUsd * toRate;
}

/**
 * Check if sync is needed based on last sync time
 */
export function isSyncNeeded(lastSyncedAt: Date | null | undefined): boolean {
  if (!lastSyncedAt) {
    return true;
  }

  const timeSinceLastSync = Date.now() - lastSyncedAt.getTime();
  return timeSinceLastSync >= SYNC_INTERVAL_MS;
}

/**
 * Get human-readable time since last sync
 */
export function getTimeSinceSync(
  lastSyncedAt: Date | null | undefined
): string {
  if (!lastSyncedAt) {
    return "Never synced";
  }

  const diff = Date.now() - lastSyncedAt.getTime();
  const msPerHour = MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
  const msPerMinute = MS_PER_SECOND * SECONDS_PER_MINUTE;
  const hours = Math.floor(diff / msPerHour);
  const minutes = Math.floor((diff % msPerHour) / msPerMinute);

  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  }
  return `${minutes}m ago`;
}
