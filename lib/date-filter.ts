import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  subWeeks,
  subMonths,
} from "date-fns";

/**
 * Defines the available types of predefined date ranges.
 */
export type DateRangeType =
  | "TODAY"
  | "THIS_WEEK"
  | "LAST_WEEK"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "CUSTOM";

/**
 * Represents a date range with a start and end date.
 * Both dates are inclusive.
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Generates a date range based on the selected type or custom start/end dates.
 *
 * @param type The type of date range to generate (e.g., "THIS_WEEK", "CUSTOM").
 * @param customStart Optional: The start date string for a "CUSTOM" range.
 * @param customEnd Optional: The end date string for a "CUSTOM" range.
 * @returns A DateRange object containing the calculated startDate and endDate.
 * @throws Error if an invalid date range type is provided or custom dates are missing for "CUSTOM" type.
 */
export function getDateRange(
  type: DateRangeType,
  customStart?: string,
  customEnd?: string
): DateRange {
  const now = new Date(); // Current date and time
  // Options for startOfWeek/endOfWeek to ensure Monday is the first day
  const weekOptions = { weekStartsOn: 1 as const }; // 1 = Monday

  switch (type) {
    // case "TODAY":
    //   return {
    //     startDate: startOfDay(now),
    //     endDate: endOfDay(now),
    //   };

    case "THIS_WEEK":
      return {
        startDate: startOfWeek(now, weekOptions),
        endDate: endOfWeek(now, weekOptions),
      };

    case "LAST_WEEK":
      const lastWeek = subWeeks(now, 1);
      return {
        startDate: startOfWeek(lastWeek, weekOptions),
        endDate: endOfWeek(lastWeek, weekOptions),
      };

    case "THIS_MONTH":
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };

    case "LAST_MONTH":
      const lastMonth = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth),
      };

    case "CUSTOM":
      if (!customStart || !customEnd) {
        throw new Error("Custom range requires both start and end dates.");
      }
      // Ensure custom dates cover the full day
      return {
        startDate: startOfDay(new Date(customStart)),
        endDate: endOfDay(new Date(customEnd)),
      };

    default:
      // This case should ideally not be reached if `type` is strictly typed
      throw new Error("Invalid date range type provided.");
  }
}

export function formatDateRange(range: DateRange): string {
  const start = range.startDate.toISOString().split("T")[0];
  const end = range.endDate.toISOString().split("T")[0];
  return `${start} to ${end}`;
}
