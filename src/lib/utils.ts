// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const generateUniqueColor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = hash % 360;
  const saturation = 70 + (hash % 21);
  const lightness = 40 + (hash % 21);
  return `${hue}, ${saturation}%, ${lightness}%`;
};

/**
 * Generates a unique, consistent UI Avatars URL for a user.
 * @param name The user's full name.
 * @param userId The user's unique ID.
 * @returns {string} The generated avatar URL.
 */
export const generateAvatarUrl = (name: string, userId: string): string => {
  const uniqueColor = generateUniqueColor(userId);
  // Note: ui-avatars.com wants the background color without the HSL parts or '#'
  const backgroundColor = uniqueColor.split(',')[0]; // Just the hue value might not work as intended. Let's simplify.
  
  // A simpler color generation for the URL background parameter which expects hex.
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
  }
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=${color.substring(1)}&color=fff&size=256&bold=true`;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
