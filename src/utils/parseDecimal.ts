/**
 * Parses a decimal number entered on a numeric keyboard, accepting both the
 * "." and "," decimal separators (some locales, e.g. pt-PT, use ","), and
 * ignoring stray spaces and thousands separators.
 *
 * parseFloat is not used directly on user input because it stops at a comma
 * (so "5,5" reads as 5 and ",5" reads as NaN).
 */
export function parseDecimal(text: string): number {
  const normalized = text.replace(/\s/g, "").replace(/,/g, ".");
  return parseFloat(normalized);
}
