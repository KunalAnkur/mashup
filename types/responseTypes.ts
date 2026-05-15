import { Playlist } from "./storeTypes";

export type UserLoginResp = {
  data: {
    user: {
      email: string;
      name: string;
      id: string;
      profile?: string;
      username?: string;
      session_id?: string;
      is_email_verified: boolean;
      guest_account: boolean;
      marketing_emails_opt_in?: boolean | null;
    };
    token: string;
  };
  success: boolean;
  status: string;
  message: string;
};

export interface RoomCreateResponse {
  success: boolean;
  status: string;
  message: string;
  authId: string;
  data: {
    id: string;
    user_id: string;
    playlist: Playlist[];
    room_id: string;
    is_active: boolean;
    total_playtime_seconds: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
}