// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (val: number | null) => {
  if (val === null || isNaN(val)) return '---';
  const abs = Math.abs(val);
  if (abs >= 1e9) return (val / 1e9).toFixed(2) + ' مليار';
  if (abs >= 1e6) return (val / 1e6).toFixed(2) + ' م';
  return val.toLocaleString('en-US'); // Force clear Western (English) numerals 0-9
}
