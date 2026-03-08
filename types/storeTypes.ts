/**
 * User type definition
 * Represents a user in the application
 */
export type User = {
  /** Unique user identifier */
  id: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email?: string;
  /** User's profile picture URL */
  profile?: string;
  /** User's username */
  username?: string;
  /** Session identifier */
  sessionId?: string;
};
/** Metadata for a URL in the playlist */
export interface UrlMetadata {
  title?: string;
  description?: string;
  thumbnail?: string | null;
  author?: string;
}

// export interface RoomState {
//   haveRoom: boolean;
//   loading: boolean;
//   type: "stream" | "sync";
//   source: "file" | "url" | "stream"; // "file" for file upload, "stream" for screen sharing, "url" for sync
//   roomId: string | null;
//   urls: string[];
//   files: string[];
//   host: boolean;
//   settings: RoomSetting;
//   selectedFileIndex: number;
//   refer: boolean;
//   focused: boolean;
//   /** Cached metadata for URLs (keyed by URL string) */
//   urlMetadataCache: Record<string, UrlMetadata>;
// }

export interface RoomState {
  haveRoom: boolean;
  playlist: Playlist[];
  loading: boolean;
  focused: boolean;
  roomId: string | null;
  watchTime: number;
  host: boolean;
  // selectedIndex: number;
  refer: boolean;
  settings: RoomSetting;
  hostPlayback: {
    playing: boolean;
  };
}
export type Playlist = {
  id: string;
  type: "stream" | "sync";
  source: "file" | "url" | "screen";
  onlyAudio: boolean;
  link: string;
  selected: boolean;
  metadata: UrlMetadata;
}

export type RoomSetting = {
  panelCollapsed: boolean
}

/**
 * Authentication state interface
 * Manages the authentication state of the application
 */
export interface AuthState {
  /** Current authenticated user, null if not authenticated */
  user: User | null;
  /** JWT authentication token */
  token: string | null;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Loading state for async authentication operations */
  loading: boolean;
  /** Error message if authentication fails */
  error: string | null;
}

export enum OnboardStep {
  SELECT_SOURCE = "select_source",
  SOURCE_INFO = "source_info",
  URL_SELECTION = "url_selection",
  FILE_SELECTION = "file_selection",
  AUTH_STEP = "auth_step",
}
export enum OnboardStatus {
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export interface OnboardState {
  step: OnboardStep;
  status: OnboardStatus;
  info: OnboardSourceInfo | null;
  loading: boolean;
}

export interface OnboardSourceInfo {
    selection: "url" | "file";
    value: string;
}


export interface Chat {
  message: string,
  type: 'text',
  sendBy: User
}
export interface PanelState {
  chats: Chat[],
  people: User[],
  loading: boolean
}