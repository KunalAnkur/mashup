"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { LuX, LuSend, LuSparkles, LuMessageSquare } from "react-icons/lu";
import { submitFeedback } from "@/lib/store/api/feedbackApi";
import { showSuccess, showError } from "@/utils/toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string | null;
}

const FeedbackModal = ({ isOpen, onClose, roomId }: FeedbackModalProps) => {
  const [loading, setLoading] = useState(false);
  const roomState = useSelector((state: RootState) => state.room);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "bug" as "bug" | "feature" | "other",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.length < 3 || formData.description.length < 10) {
      showError("Invalid Input", "Please fill in all fields correctly.");
      return;
    }

    setLoading(true);
    try {
      const roomDetailsSnapshot = roomState;

      await submitFeedback({
        ...formData,
        room_id: roomId || undefined,
        room_details: roomDetailsSnapshot
      });
      
      showSuccess("Feedback Sent! 🎉\nThank you for helping us grow!");
      onClose();
      setFormData({ title: "", description: "", category: "bug" });
    } catch (err: any) {
      showError("Error", "Could not send feedback. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md bg-gradient-to-br from-[#151518] via-[#1a1a1d] to-[#151518]  rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Dynamic Background Glows (Matching Panel Style) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[60px]" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-[60px]" />

        {/* Header */}
        <div className="relative px-6 pt-6 pb-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-fuchsia-500/20 ">
              <LuMessageSquare className="text-rose-400" size={20} />
            </div>
            <div>
              <h3 className="text-white text-lg font-bold font-parkinsans">Feedback</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Help us improve</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
            <LuX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative p-6 space-y-5">
          {/* Category Chips - Matching Tab Style */}
          <div className="flex p-1 bg-zinc-900/50 rounded-2xl ">
            {["bug", "feature", "other"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat as any })}
                className={`flex-1 py-2 text-[11px] font-bold capitalize transition-all duration-300 rounded-xl ${
                  formData.category === cat 
                    ? "bg-gradient-to-r from-rose-500/20 to-fuchsia-500/20 text-white " 
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Topic"
              className="w-full bg-zinc-800/20  rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:outline-none focus:border-rose-500/30 transition-all font-medium"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <textarea
              placeholder="Tell us what's on your mind..."
              rows={4}
              className="w-full bg-zinc-800/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:outline-none focus:border-rose-500/30 transition-all resize-none font-medium"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-4 bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 text-white font-bold text-sm rounded-2xl transition-all duration-300 shadow-lg shadow-rose-500/20 overflow-hidden active:scale-95 disabled:opacity-50"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LuSend size={18} />
                  <span>Send Feedback</span>
                </>
              )}
            </div>
            {/* Glossy light effect from chat bubbles */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;