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
       // Handles ISO strings
      date = parseISO(dateValue);
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
    if (formatType === "iso") {
      return formatFns(date, "yyyy-MM-dd");
    }
    // 'dateOnly' format
    return formatFns(date, "dd MMM yyyy");

  } catch (e) {
    return "Invalid Date";
  }
};


export const formatCurrency = (value: number) => {
    const ugxFormatter = (val: number, notation: 'compact' | 'standard', minDigits: number, maxDigits: number) => 
        new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: minDigits,
            maximumFractionDigits: maxDigits,
            notation: notation,
        }).format(val);

    if (value >= 1000000) {
        return ugxFormatter(value, 'compact', 1, 1);
    }
    if (value >= 1000) {
         return ugxFormatter(value, 'compact', 0, 0);
    }
    return ugxFormatter(value, 'standard', 0, 0);
};
