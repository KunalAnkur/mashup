"use client";
import { useState } from "react";
import { LuX, LuSend, LuTriangleAlert } from "react-icons/lu";
import { submitFeedback } from "@/lib/store/api/feedbackApi";
import { showSuccess, showError } from "@/utils/toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
}

const FeedbackModal = ({ isOpen, onClose, roomId }: FeedbackModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "bug" as "bug" | "feature" | "other",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Validate Title (Backend requires min 3)
    if (formData.title.length < 3) {
      showError("Title too short", "Please provide a title with at least 3 characters.");
      return;
    }
  
    // Validate Description (Backend requires min 10)
    if (formData.description.length < 10) {
      showError("Description too short", "Please provide more detail (min 10 chars).");
      return;
    }
  
    setLoading(true);
    try {
      // Ensure room_id is only sent if it exists and is a valid UUID string
      const payload = {
        ...formData,
        room_id: roomId || undefined 
      };
      
      await submitFeedback(payload);
      showSuccess("success.Thank you        for helping us improve Movmash.");
      onClose();
      setFormData({ title: "", description: "", category: "bug" });
    } catch (err: any) {
      // Handle Joi validation errors specifically if they come back from server
      const serverMessage = err.response?.data?.errors?.[0]?.message;
      showError("Failed to send", serverMessage || "Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-gradient-to-br from-[#1a1a1d] to-[#151518] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h3 className="text-white font-bold flex items-center gap-2">
            <LuTriangleAlert className="text-amber-400" /> Report an Issue
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <LuX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Category</label>
            <div className="flex gap-2">
              {["bug", "feature", "other"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat as any })}
                  className={`flex-1 py-2 rounded-lg text-xs capitalize transition-all border ${
                    formData.category === cat 
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-400" 
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Short title..."
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <textarea
            placeholder="What happened? (Min 10 characters)"
            rows={4}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
          >
            {loading ? "Sending..." : <><LuSend size={18} /> Submit Report</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;