import { z } from "zod";

// Validation constants
const MIN_CURRENCY_CODE_LENGTH = 3;
const MAX_CURRENCY_CODE_LENGTH = 10;
const MIN_DECIMAL_PLACES = 0;
const MAX_DECIMAL_PLACES = 8;
const DEFAULT_DECIMAL_PLACES = 2;

// Currency schema
export const currencySchema = z.object({
  id: z.number(),
  code: z.string().min(MIN_CURRENCY_CODE_LENGTH).max(MAX_CURRENCY_CODE_LENGTH),
  name: z.string().min(1),
  symbol: z.string().optional(),
  rate: z.string(), // Exchange rate as string for precision
  baseCurrency: z.string().default("USD"),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  decimalPlaces: z.number().default(DEFAULT_DECIMAL_PLACES),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Currency = z.infer<typeof currencySchema>;

export const currencyListSchema = z.array(currencySchema);

// Currency sync log schema
export const currencySyncLogSchema = z.object({
  id: z.number(),
  syncedAt: z.coerce.date(),
  status: z.enum(["success", "error"]),
  currenciesUpdated: z.number(),
  errorMessage: z.string().optional().nullable(),
  apiResponse: z.string().optional().nullable(),
});

export type CurrencySyncLog = z.infer<typeof currencySyncLogSchema>;

// Form schema for creating/updating currencies
export const currencyFormSchema = z.object({
  code: z
    .string()
    .min(
      MIN_CURRENCY_CODE_LENGTH,
      "Currency code must be at least 3 characters"
    )
    .max(
      MAX_CURRENCY_CODE_LENGTH,
      "Currency code must be at most 10 characters"
    )
    .toUpperCase(),
  name: z.string().min(1, "Currency name is required"),
  symbol: z.string().optional(),
  rate: z.string().min(1, "Exchange rate is required"),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  decimalPlaces: z
    .number()
    .min(MIN_DECIMAL_PLACES)
    .max(MAX_DECIMAL_PLACES)
    .default(DEFAULT_DECIMAL_PLACES),
});

export type CurrencyFormValues = z.infer<typeof currencyFormSchema>;

// OpenExchangeRates API response types
export interface OpenExchangeRatesResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

export interface OpenExchangeRatesCurrenciesResponse {
  [code: string]: string; // code: name mapping
}

// Currency symbols mapping (common ones)
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  PKR: "₨",
  AED: "د.إ",
  SAR: "﷼",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  HKD: "HK$",
  SGD: "S$",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  NZD: "NZ$",
  ZAR: "R",
  MXN: "$",
  BRL: "R$",
  KRW: "₩",
  THB: "฿",
  MYR: "RM",
  PHP: "₱",
  IDR: "Rp",
  VND: "₫",
  TRY: "₺",
  RUB: "₽",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  ILS: "₪",
  EGP: "E£",
  NGN: "₦",
  KES: "KSh",
  GHS: "₵",
  XOF: "CFA",
  XAF: "FCFA",
  BDT: "৳",
  LKR: "Rs",
  NPR: "₨",
  MMK: "K",
  KHR: "៛",
  LAK: "₭",
};
