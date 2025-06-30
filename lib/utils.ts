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
