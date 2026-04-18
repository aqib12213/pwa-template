import { utils, write } from "xlsx";

// CSV template headers for currency import
const CURRENCY_IMPORT_HEADERS = [
  "code",
  "name",
  "symbol",
  "rate",
  "decimalPlaces",
  "isActive",
] as const;

// Sample data for templates
const SAMPLE_CURRENCIES = [
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    rate: "1.0",
    decimalPlaces: 2,
    isActive: true,
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    rate: "0.85",
    decimalPlaces: 2,
    isActive: true,
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    rate: "0.73",
    decimalPlaces: 2,
    isActive: true,
  },
];

/**
 * Build CSV template string for currency import
 */
export function buildCurrenciesCsvTemplate(): string {
  const headers = CURRENCY_IMPORT_HEADERS.join(",");
  const rows = SAMPLE_CURRENCIES.map((c) =>
    [c.code, c.name, c.symbol, c.rate, c.decimalPlaces, c.isActive].join(",")
  );
  return [headers, ...rows].join("\n");
}

/**
 * Build JSON template string for currency import
 */
export function buildCurrenciesJsonTemplate(): string {
  return JSON.stringify(SAMPLE_CURRENCIES, null, 2);
}

/**
 * Build XLSX template blob for currency import
 */
export function buildCurrenciesXlsxTemplate(): Blob {
  // Create workbook
  const workbook = utils.book_new();

  // Currencies sheet - need to spread headers to make mutable
  const currenciesData: (string | number | boolean)[][] = [
    [...CURRENCY_IMPORT_HEADERS],
    ...SAMPLE_CURRENCIES.map((c) => [
      c.code,
      c.name,
      c.symbol,
      c.rate,
      c.decimalPlaces,
      c.isActive,
    ]),
  ];
  const currenciesSheet = utils.aoa_to_sheet(currenciesData);
  utils.book_append_sheet(workbook, currenciesSheet, "Currencies");

  // Reference sheet
  const referenceData = [
    ["Field", "Description", "Required", "Example Values"],
    ["code", "3-10 character currency code", "Yes", "USD, EUR, GBP"],
    ["name", "Currency name", "Yes", "US Dollar, Euro"],
    ["symbol", "Currency symbol", "No", "$, €, £"],
    ["rate", "Exchange rate (relative to base)", "Yes", "1.0, 0.85"],
    ["decimalPlaces", "Number of decimal places (0-8)", "No", "2 (default)"],
    [
      "isActive",
      "Whether currency is active",
      "No",
      "true, false (default: true)",
    ],
  ];
  const referenceSheet = utils.aoa_to_sheet(referenceData);
  utils.book_append_sheet(workbook, referenceSheet, "Field Reference");

  // Set column widths
  currenciesSheet["!cols"] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
  ];
  referenceSheet["!cols"] = [
    { wch: 15 },
    { wch: 35 },
    { wch: 10 },
    { wch: 25 },
  ];

  // Write to blob
  const buffer = write(workbook, { type: "array", bookType: "xlsx" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
