
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import type { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDateSafe = (
  dateValue: Timestamp | Date | string | null | undefined,
  formatType: "distance" | "dateOnly" = "distance"
): string => {
  if (!dateValue) return "N/A";

  let date: Date;

  try {
    if (typeof dateValue === "string") {
      // Handles ISO strings like '2025-10-31' or full ISO strings
      // parseISO is more reliable than new Date() for strings.
      date = parseISO(dateValue);
    } else if (dateValue && typeof (dateValue as any).toDate === 'function') {
      // Handles Firestore Timestamps
      date = (dateValue as Timestamp).toDate();
    } else {
      // Handles native Date objects
      date = dateValue as Date;
    }

    if (!isValid(date)) {
      // Fallback for non-standard date strings that parseISO fails on but new Date might handle
      date = new Date(dateValue as string);
      if (!isValid(date)) return "Invalid Date";
    }

    if (formatType === "distance") {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    // 'dateOnly' format
    return format(date, "dd MMM yyyy");

  } catch (e) {
    return "Invalid Date";
  }
};


export const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
            notation: 'compact'
        }).format(value);
    }
    return new Intl.NumberFormat('en-UG', { 
        style: 'currency', 
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};
