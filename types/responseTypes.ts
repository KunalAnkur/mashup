export type UserLoginResp = {
  data: {
    user: {
      email: string;
      name: string;
      id: string;
      profile?: string;
      username?: string;
      session_id?: string;
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
    type: "stream" | "sync";
    source: "file" | "url" | "stream";
    room_id: string;
    url: string;
    urls: string[];
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
}