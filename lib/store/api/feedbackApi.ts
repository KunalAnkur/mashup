import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8989/api/v1";

export interface FeedbackInput {
  title: string;
  description: string;
  category: "bug" | "feature" | "other";
  room_id?: string;
}

export const submitFeedback = async (data: FeedbackInput) => {
  let token = null;

  // 1. Extract token from Redux Persist (persist:root)
  const persistRoot = localStorage.getItem("persist:root");
  
  if (persistRoot) {
    try {
      // persist:root is a stringified object
      const rootState = JSON.parse(persistRoot);
      
      // rootState.auth is also a stringified object because of how redux-persist works
      if (rootState.auth) {
        const authData = JSON.parse(rootState.auth);
        token = authData.token;
      }
    } catch (error) {
      console.error("Failed to parse local storage for feedback token:", error);
    }
  }

  const response = await axios.post(`${API_URL}/feedback`, data, {
    headers: {
      // Attach the found token (works for both Guest and Google users)
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });
  
  return response.data;
};