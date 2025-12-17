import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8989/api/v1";

export interface FeedbackInput {
    title: string;
    description: string;
    category: "bug" | "feature" | "other";
    room_id?: string;
    room_details?: any; // Added to accept the Redux snapshot
  }
  
  export const submitFeedback = async (data: FeedbackInput) => {
    let token = null;
    const persistRoot = localStorage.getItem("persist:root");
    
    if (persistRoot) {
      try {
        const rootState = JSON.parse(persistRoot);
        if (rootState.auth) {
          const authData = JSON.parse(rootState.auth);
          token = authData.token;
        }
      } catch (e) {}
    }
  
    const response = await axios.post(`${API_URL}/feedback`, data, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  };

