/**
 * google-sheets price-synchronization utility
 */

export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/);
  return lines
    .filter(line => line.trim().length > 0)
    .map(line => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(val => val.replace(/^"|"$/g, "").trim());
    });
}

export function extractSpreadsheetId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const clean = urlOrId.trim();
  if (/^[a-zA-Z0-9-_]{15,100}$/.test(clean)) {
    return clean;
  }
  const match = clean.match(/\/d\/([a-zA-Z0-9-_]{15,100})/);
  return match ? match[1] : null;
}

export async function fetchPricesFromGoogleSheets(
  spreadsheetIdOrUrl: string,
  accessToken?: string | null
): Promise<Record<string, number>> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
  if (!spreadsheetId) {
    throw new Error("Invalid Google Spreadsheet URL or ID format.");
  }

  const priceMap: Record<string, number> = {};

  try {
    if (accessToken) {
      // 1. Try authorized Google Sheets REST API
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:C100`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.values && Array.isArray(data.values)) {
          data.values.forEach((row: string[], idx: number) => {
            if (idx === 0) return; // Skip Header row [ID, Name/Title, Price]
            const itemKey = row[0]?.trim();
            const itemName = row[1]?.trim();
            const itemPriceStr = row[2]?.trim();

            if (itemPriceStr) {
              const numericPrice = parseFloat(itemPriceStr.toString().replace(/[^\d.]/g, ""));
              if (!isNaN(numericPrice)) {
                if (itemKey) priceMap[itemKey.toLowerCase()] = numericPrice;
                if (itemName) priceMap[itemName.toLowerCase()] = numericPrice;
              }
            }
          });
          return priceMap;
        }
      }
    }

    // 2. Fallback: Public viz endpoint that exports spreadsheet data as CSV
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets CSV export returned code ${response.status}`);
    }

    const text = await response.text();
    const rows = parseCSV(text);

    rows.forEach((row, idx) => {
      if (idx === 0) return; // Skip Header row [ID, Name/Title, Price]
      const itemKey = row[0];
      const itemName = row[1];
      const itemPriceStr = row[2];

      if (itemPriceStr) {
        const numericPrice = parseFloat(itemPriceStr.replace(/[^\d.]/g, ""));
        if (!isNaN(numericPrice)) {
          if (itemKey) priceMap[itemKey.toLowerCase()] = numericPrice;
          if (itemName) priceMap[itemName.toLowerCase()] = numericPrice;
        }
      }
    });

  } catch (error: any) {
    console.error("Sheets synchronization error:", error);
    throw new Error(error.message || "Failed to load Google Sheets content.");
  }

  return priceMap;
}
