import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== '' && value !== '-';
}
