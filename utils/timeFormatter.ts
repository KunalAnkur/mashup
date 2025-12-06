/**
 * Time formatting utilities
 * 
 * Centralized time formatting functions using date-fns for modern,
 * tree-shakeable date formatting across the application.
 */

import { format } from 'date-fns';

/**
 * Format timestamp to readable time (HH:MM AM/PM)
 * Used in: ChatTab, OverlayMessageBubble
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "3:45 PM")
 */
export const formatChatTime = (timestamp: number): string => {
  return format(new Date(timestamp), 'h:mm a');
};

/**
 * Format seconds to video time format (HH:MM:SS or MM:SS)
 * Used in: Player, ProgressBar
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted time string (e.g., "1:23:45" or "23:45")
 */
export const formatVideoTime = (seconds: number): string => {
  const date = new Date(seconds * 1000);
  const hours = date.getUTCHours();
  
  if (hours > 0) {
    return format(date, 'H:mm:ss');
  }
  return format(date, 'm:ss');
};

