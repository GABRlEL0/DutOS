// Date-only helpers.
//
// We store some dates (like pinned_date) as a calendar day coming from <input type="date">.
// Using `new Date('YYYY-MM-DD')` creates a Date at 00:00 UTC which can display as the
// previous day in negative timezones. To avoid off-by-one issues, we normalize date-only
// values to local noon.

export function dateOnlyFromInput(dateStr: string): Date {
  // Expected format: YYYY-MM-DD
  const [y, m, d] = dateStr.split('-').map((p) => Number(p));
  if (!y || !m || !d) {
    // Fall back to native parsing; caller can validate.
    return new Date(dateStr);
  }

  // Local noon avoids DST edge-cases around midnight.
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

// Normalize a date-only value that may have been stored as UTC midnight.
// We interpret the UTC calendar components as the intended day.
export function normalizeDateOnlyToLocalNoon(date: Date): Date {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    12,
    0,
    0,
    0
  );
}
