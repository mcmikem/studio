
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatFns, formatDistanceToNow, isValid, parseISO } from "date-fns";
import type { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDateSafe = (
  dateValue: Timestamp | Date | string | null | undefined,
  formatType: "distance" | "dateOnly" | "iso" = "distance"
): string => {
  if (!dateValue) return "N/A";

  let date: Date;

  try {
    if (dateValue && typeof (dateValue as any).toDate === 'function') {
      // Handles Firestore Timestamps
      date = (dateValue as Timestamp).toDate();
    } else if (typeof dateValue === "string") {
      date = new Date(dateValue); // More robust for various string formats
      if (!isValid(date)) {
        date = parseISO(dateValue); // Fallback for strict ISO strings
      }
    } else {
      // Handles native Date objects
      date = dateValue as Date;
    }

    if (!isValid(date)) {
      return "Invalid Date";
    }

    if (formatType === "distance") {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    if (formatType === "iso") {
      return formatFns(date, "yyyy-MM-dd");
    }
    // 'dateOnly' format
    return formatFns(date, "dd MMM yyyy");

  } catch (e) {
    return "Invalid Date";
  }
};


export const formatCurrency = (value: number, compact = false) => {
  if (compact && value >= 1000000) {
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
        notation: 'compact'
    }).format(value);
  }
   if (compact && value >= 1000) {
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        notation: 'compact'
    }).format(value);
  }
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(value);
};
