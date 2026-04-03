/**
 * Format a number to at most `decimals` significant decimal places.
 * E.g. fmt(67.59131919802505) → "67.59"
 *      fmt(99) → "99"
 *      fmt(0.123456, 3) → "0.123"
 */
export const fmt = (val, decimals = 2) => {
  const n = parseFloat(val);
  if (isNaN(n)) return val ?? '—';
  // Strip trailing zeros from fixed representation
  return parseFloat(n.toFixed(decimals)).toString();
};

/**
 * Format a number as a percentage string, trimmed to `decimals` places.
 * E.g. fmtPct(67.59131919802505) → "67.59%"
 */
export const fmtPct = (val, decimals = 2) => `${fmt(val, decimals)}%`;

/**
 * Safely round to integer, returning '—' for NaN.
 */
export const fmtInt = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? '—' : Math.round(n).toString();
};
