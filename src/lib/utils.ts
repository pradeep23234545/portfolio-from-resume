import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/** Real error text in development, a generic message in production. */
export function serverErrorMessage(error: unknown, fallback = 'Internal Server Error'): string {
  if (process.env.NODE_ENV !== 'production') {
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  }
  return fallback;
}
