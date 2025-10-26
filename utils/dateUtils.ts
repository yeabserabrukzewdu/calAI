/**
 * Utility functions for date operations
 */

/**
 * Returns an array of Date objects for all days in the given month.
 */
export const getDaysInMonth = (date: Date): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days: Date[] = [];
  const lastDay = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i <= lastDay; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
};

/**
 * Formats a date to a month-year string (e.g., "January 2024").
 */
export const getMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Returns the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
 */
export const getDayOfWeek = (date: Date): number => {
  // Sunday - 0, Monday - 1, ..., Saturday - 6
  return date.getDay();
};

/**
 * Checks if two dates are the same day (ignoring time).
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Formats a date to a YYYY-MM-DD string (e.g., "2024-01-15").
 */
export const getFormattedDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date to a readable string format (e.g., "Monday, January 15, 2024").
 */
export function formatReadableDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}