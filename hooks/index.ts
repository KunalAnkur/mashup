/**
 * Hooks V2 - Unified Socket Architecture
 *
 * Usage:
 * - RoomContext handles room management (use useRoomContext)
 * - useStream for MediaSoup streaming ("stream" rooms)
 * - useSync for video sync ("sync" rooms)
 * - useChat for chat functionality
 */

export { useStream } from "./useStream";
export { useSync } from "./useSync";
export { useChat } from "./useChat";
export { useRoom } from "./useRoom"; // For standalone use, prefer RoomContext
