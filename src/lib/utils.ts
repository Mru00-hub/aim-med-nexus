// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a unique, consistent UI Avatars URL for a user.
 * @param name The user's full name.
 * @param userId The user's unique ID.
 * @returns {string} The generated avatar URL.
 */
export const generateAvatarUrl = (name: string, userId: string): string => {
  // A simple deterministic hashing function to create a color from a user ID.
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert the hash to a 6-digit hex color.
  let color = '#';
  for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
  }
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=${color.substring(1)}&color=fff&size=256&bold=true`;
};
