import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date/timestamp into a friendly readable format.
 * e.g. "Saturday, 28 March 2026, 5:40 PM"
 */
export function formatFriendlyDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "—";
    return format(d, "EEEE, d MMMM yyyy, h:mm a");
  } catch {
    return "—";
  }
}

/**
 * Shorter friendly date without day name. e.g. "28 March 2026, 5:40 PM"
 */
export function formatFriendlyDateShort(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "—";
    return format(d, "d MMM yyyy, h:mm a");
  } catch {
    return "—";
  }
}
