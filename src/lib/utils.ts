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
      // Handles ISO strings like '2025-10-31'
      date = parseISO(dateValue);
    } else if ("toDate" in dateValue) {
      // Handles Firestore Timestamps
      date = dateValue.toDate();
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
    // 'dateOnly' format
    return format(date, "dd MMM yyyy");

  } catch (e) {
    return "Invalid Date";
  }
};
