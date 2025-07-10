import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("ar-LY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// utils/format.ts

/**
 * Format a number with thousands separators (commas) and optional decimals.
 * @param value    The number (or numeric string) to format.
 * @param decimals Number of decimal places (default: 0).
 * @param locale   BCP 47 language tag (default: 'en-US').
 */
export function formatNumber(
  value: number | string,
  decimals = 0,
  locale = 'en-US'
): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a currency amount (adds currency symbol, thousands separators, decimals).
 * @param value    The number (or numeric string) to format.
 * @param currency ISO currency code (e.g. 'LYD', 'USD').
 * @param decimals Number of decimal places (default: 2).
 * @param locale   BCP 47 language tag (default: 'en-US').
 */
export function formatCurrency(
  value: number | string,
  decimals = 2,
  locale = 'en-US'
): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}
