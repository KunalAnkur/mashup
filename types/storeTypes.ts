export type User = {
    name: string,
    email?: string,
    profile?: string,
    username?: string,
    sessionId?: string,
    id: string,
}
export interface RoomState {
  haveRoom: boolean;
  loading: boolean;
  sourceType: "file" | "url";
  roomId: string | null;
  urls: string[];
  files: string[];
  host: boolean;
  settings: RoomSetting;
  selectedFileIndex: number;
  refer: boolean;
}

export type RoomSetting = {
  panelCollapsed: boolean
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
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