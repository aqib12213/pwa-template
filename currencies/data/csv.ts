import type { CurrencyFormValues } from "./schema";

const LINE_SPLIT_REGEX = /\r?\n/;

/**
 * Parse CSV text into currency form values
 */
export function parseCurrenciesCsv(text: string): CurrencyFormValues[] {
  const lines = text
    .split(LINE_SPLIT_REGEX)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  return parseCurrencyRows(lines);
}

/**
 * Parse currency rows from CSV lines
 */
function parseCurrencyRows(lines: string[]): CurrencyFormValues[] {
  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());

  const indices = getColumnIndices(headers);
  const missingRequired = indices.codeIndex === -1 || indices.nameIndex === -1;

  if (missingRequired) {
    return [];
  }

  const results: CurrencyFormValues[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parsed = parseCurrencyFromLine(lines[i], indices);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

interface ColumnIndices {
  codeIndex: number;
  nameIndex: number;
  symbolIndex: number;
  rateIndex: number;
  decimalPlacesIndex: number;
  isActiveIndex: number;
  isDefaultIndex: number;
}

function getColumnIndices(headers: string[]): ColumnIndices {
  return {
    codeIndex: headers.indexOf("code"),
    nameIndex: headers.indexOf("name"),
    symbolIndex: headers.indexOf("symbol"),
    rateIndex: headers.indexOf("rate"),
    decimalPlacesIndex: headers.indexOf("decimalplaces"),
    isActiveIndex: headers.indexOf("isactive"),
    isDefaultIndex: headers.indexOf("isdefault"),
  };
}

function parseCurrencyFromLine(
  line: string,
  indices: ColumnIndices
): CurrencyFormValues | null {
  const values = parseCSVLine(line);

  const code = values[indices.codeIndex]?.trim()?.toUpperCase();
  const name = values[indices.nameIndex]?.trim();

  // Skip rows without required fields
  const missingRequired = !(code && name);
  if (missingRequired) {
    return null;
  }

  const rate = values[indices.rateIndex]?.trim() || "1";
  const symbol =
    indices.symbolIndex !== -1
      ? values[indices.symbolIndex]?.trim()
      : undefined;
  const decimalPlaces =
    indices.decimalPlacesIndex !== -1
      ? Number.parseInt(values[indices.decimalPlacesIndex]?.trim() || "2", 10)
      : 2;
  const isActive =
    indices.isActiveIndex !== -1
      ? values[indices.isActiveIndex]?.trim().toLowerCase() === "true"
      : true;
  const isDefault =
    indices.isDefaultIndex !== -1
      ? values[indices.isDefaultIndex]?.trim().toLowerCase() === "true"
      : false;

  return {
    code,
    name,
    symbol: symbol || undefined,
    rate: rate || "1",
    decimalPlaces: Number.isNaN(decimalPlaces) ? 2 : decimalPlaces,
    isActive,
    isDefault,
  };
}

/**
 * Handle a character inside quotes
 */
function handleQuotedChar(
  char: string,
  nextChar: string | undefined,
  current: string,
  inQuotes: boolean
): { current: string; inQuotes: boolean; skipNext: boolean } {
  if (char === '"' && nextChar === '"') {
    return { current: `${current}"`, inQuotes: true, skipNext: true };
  }
  if (char === '"') {
    return { current, inQuotes: false, skipNext: false };
  }
  return { current: current + char, inQuotes, skipNext: false };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  let skipNext = false;

  for (let i = 0; i < line.length; i += 1) {
    if (skipNext) {
      skipNext = false;
      continue;
    }

    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (inQuotes) {
      const result = handleQuotedChar(char, nextChar, current, inQuotes);
      current = result.current;
      inQuotes = result.inQuotes;
      skipNext = result.skipNext;
    } else if (char === ",") {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

/**
 * Parse JSON text into currency form values
 */
export function parseCurrenciesJson(text: string): CurrencyFormValues[] {
  try {
    const data = JSON.parse(text);
    const items = Array.isArray(data) ? data : [data];

    return items
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null
      )
      .map((item) => ({
        code: String(item.code || "")
          .toUpperCase()
          .trim(),
        name: String(item.name || "").trim(),
        symbol: item.symbol ? String(item.symbol).trim() : undefined,
        rate: String(item.rate || "1").trim(),
        decimalPlaces:
          typeof item.decimalPlaces === "number"
            ? item.decimalPlaces
            : Number.parseInt(String(item.decimalPlaces || "2"), 10) || 2,
        isActive: item.isActive !== false,
        isDefault: item.isDefault === true,
      }))
      .filter((c) => c.code && c.name);
  } catch {
    return [];
  }
}
