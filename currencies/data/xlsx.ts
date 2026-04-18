import { read, utils } from "xlsx";
import type { CurrencyFormValues } from "./schema";

interface ColumnIndices {
  code: number;
  name: number;
  symbol: number;
  rate: number;
  decimalPlaces: number;
  isActive: number;
  isDefault: number;
}

/**
 * Find column indices from headers
 */
function findColumnIndices(headers: string[]): ColumnIndices {
  const normalizedHeaders = headers.map((h) =>
    String(h || "")
      .toLowerCase()
      .trim()
  );

  return {
    code: normalizedHeaders.indexOf("code"),
    name: normalizedHeaders.indexOf("name"),
    symbol: normalizedHeaders.indexOf("symbol"),
    rate: normalizedHeaders.indexOf("rate"),
    decimalPlaces: normalizedHeaders.indexOf("decimalplaces"),
    isActive: normalizedHeaders.indexOf("isactive"),
    isDefault: normalizedHeaders.indexOf("isdefault"),
  };
}

/**
 * Parse a single row into currency form values
 */
function parseXlsxRow(
  row: string[],
  indices: ColumnIndices
): CurrencyFormValues | null {
  const code = String(row[indices.code] ?? "")
    .toUpperCase()
    .trim();
  const name = String(row[indices.name] ?? "").trim();

  // Skip rows without required fields
  if (!(code && name)) {
    return null;
  }

  const symbol =
    indices.symbol !== -1
      ? String(row[indices.symbol] ?? "").trim()
      : undefined;
  const rate = String(row[indices.rate] ?? "1").trim();
  const rawDecimalPlaces = Number.parseInt(
    String(row[indices.decimalPlaces] ?? "2"),
    10
  );
  const decimalPlaces = Number.isNaN(rawDecimalPlaces) ? 2 : rawDecimalPlaces;

  const isActive = parseXlsxBoolean(row, indices.isActive, true);
  const isDefault = parseXlsxBoolean(row, indices.isDefault, false);

  return {
    code,
    name,
    symbol: symbol || undefined,
    rate: rate || "1",
    decimalPlaces,
    isActive,
    isDefault,
  };
}

/**
 * Parse boolean value from XLSX row
 */
function parseXlsxBoolean(
  row: string[],
  index: number,
  defaultValue: boolean
): boolean {
  if (index === -1) {
    return defaultValue;
  }
  const value = row[index];
  if (value === undefined) {
    return defaultValue;
  }
  return String(value).toLowerCase() === "true";
}

/**
 * Parse XLSX ArrayBuffer into currency form values
 */
export function parseCurrenciesXlsxFromArrayBuffer(
  buffer: ArrayBuffer
): CurrencyFormValues[] {
  const workbook = read(buffer, { type: "array" });

  // Try to find a "Currencies" sheet first, otherwise use the first sheet
  const sheetName = workbook.SheetNames.includes("Currencies")
    ? "Currencies"
    : workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return [];
  }

  // Convert sheet to array of arrays
  const data = utils.sheet_to_json<string[]>(sheet, { header: 1 });
  if (data.length < 2) {
    return [];
  }

  const indices = findColumnIndices(data[0]);

  // Validate required columns exist
  if (indices.code === -1 || indices.name === -1) {
    return [];
  }

  const results: CurrencyFormValues[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) {
      continue;
    }

    const currency = parseXlsxRow(row, indices);
    if (currency) {
      results.push(currency);
    }
  }

  return results;
}
