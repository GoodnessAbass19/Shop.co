import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  // Check if the input is valid
  if (!name || typeof name !== "string") {
    return "";
  }

  // Remove leading and trailing spaces, and replace multiple spaces with a single space.
  const cleanName = name.trim().replace(/\s+/g, " ");

  // Split the name into an array of words.
  const words = cleanName.split(" ");

  // Extract the first letter of each word and convert it to uppercase.
  const initials = words.map((word) => word[0]?.toUpperCase()).join("");

  return initials;
}

export function getFirstName(name: string): string {
  // Check if the input is valid
  if (!name || typeof name !== "string") {
    return "";
  }

  // Remove leading and trailing spaces, and replace multiple spaces with a single space.
  const cleanName = name.trim().replace(/\s+/g, " ");

  // Split the name into an array of words.
  const words = cleanName.split(" ");

  // Return the first word as the first name.
  return words[0] || "";
}
export function getLastName(name: string): string {
  // Check if the input is valid
  if (!name || typeof name !== "string") {
    return "";
  }

  // Remove leading and trailing spaces, and replace multiple spaces with a single space.
  const cleanName = name.trim().replace(/\s+/g, " ");

  // Split the name into an array of words.
  const words = cleanName.split(" ");
  const names = getInitials(words[1]);
  // Return the first word as the first name.
  return names || "";
}

// utils/sortOptions.ts
export const SORT_OPTIONS = [
  { label: "Recent", value: "recent" },
  { label: "Highest Price", value: "highest_price" },
  { label: "Lowest Price", value: "lowest_price" },
  // { label: "Top Customer Reviews", value: "top_reviews" },
];

export function separateStringByComma(string: string) {
  /**
   * Separates a string of words by commas and returns an array of words.
   *
   * @param {string} string - The input string containing words separated by commas.
   * @returns {string[]} An array of words.
   */
  return string
    .split("_")
    .map((word) => word.trim())
    .join(" ");
}
