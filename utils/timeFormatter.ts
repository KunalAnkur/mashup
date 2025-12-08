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
 * @param seconds - Duration in seconds (can be decimal)
 * @returns Formatted time string (e.g., "1:23:45" or "23:45")
 */
export const formatVideoTime = (seconds: number): string => {
  // Handle invalid input
  if (!isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  
  // Calculate hours, minutes, and seconds directly
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  // Format with leading zeros
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${minutes}:${pad(secs)}`;
};

