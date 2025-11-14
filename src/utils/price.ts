/**
 * Prompt used in Cursor:
 * "Write a robust function to parse Romanian price strings into numbers.
 * Handle '1.234,56', '12,34', optional currency symbols, whitespace, and 'lei' suffix.
 * The function should strip all non-numeric characters except . and ,
 * then remove thousand separators (dots) and convert comma decimal separator to dot."
 */

export function parseRon(priceText: string): number {
  const cleaned = priceText
    .replace(/[^\d.,]/g, '')  // keep only digits, dots, and commas
    .replace(/\./g, '')       // remove thousand separators (dots)
    .replace(/,/, '.');       // convert comma decimal separator to dot
  
  const number = Number(cleaned);
  
  if (Number.isNaN(number)) {
    throw new Error(`Cannot parse price from: "${priceText}"`);
  }
  
  return number;
}
