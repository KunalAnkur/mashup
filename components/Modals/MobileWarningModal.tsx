"use client";

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaDesktop, FaMobileAlt, FaExclamationTriangle } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

interface MobileWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const MobileWarningModal = ({
  isOpen,
  onClose,
  onContinue,
}: MobileWarningModalProps) => {
  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-sm bg-gradient-to-br from-zinc-900/95 via-zinc-800/95 to-zinc-900/95 backdrop-blur-2xl border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
          
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5 pointer-events-none" />
 
            {/* Content */}
            <div className="relative z-10 p-5">
              {/* Icon Section */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {/* Mobile icon with warning */}
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                    <FaMobileAlt className="text-2xl text-amber-400" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                      <FaExclamationTriangle className="text-[10px] text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div className="text-center mb-5">
                <h3 className="text-lg font-bold text-white mb-2">
                  Better on Desktop
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  For the best watch party experience, we recommend using a desktop or laptop. 
                  Mobile viewing may have limited features.
                </p>
              </div>

              {/* Feature comparison */}
              <div className="flex gap-3 mb-5">
                {/* Mobile limitations */}
                <div className="flex-1 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FaMobileAlt className="text-amber-400 text-sm" />
                    <span className="text-xs font-medium text-white/80">Mobile</span>
                  </div>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-1.5 text-[10px] text-white/50">
                      <span className="text-red-400">✗</span>
                      Screen share not available
                    </li>
                    <li className="flex items-center gap-1.5 text-[10px] text-white/50">
                      <span className="text-amber-400">•</span>
                      Limited screen space
                    </li>
                    <li className="flex items-center gap-1.5 text-[10px] text-white/50">
                      <span className="text-amber-400">•</span>
                      Reduced chat visibility
                    </li>
                  </ul>
                </div>

                {/* Desktop benefits */}
                <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FaDesktop className="text-green-400 text-sm" />
                    <span className="text-xs font-medium text-white/80">Desktop</span>
                  </div>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-1.5 text-[10px] text-white/50">
                      <span className="text-green-400">✓</span>
                      Screen share works
                    </li>
                    <li className="flex items-center gap-1.5 text-[10px] text-white/50">
                      <span className="text-green-400">✓</span>
                      Better stream quality
                    </li>
                    <li className="flex items-center gap-1.5 text-[10px] text-white/50">
                      <span className="text-green-400">✓</span>
                      Full-screen viewing
                    </li>
                    <li className="flex items-center gap-1.5 text-[10px] text-white/50">
                      <span className="text-green-400">✓</span>
                      Better chat experience
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={onContinue}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30"
                >
                  Continue Anyway
                </button>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2.5 bg-gradient-to-br from-zinc-800/50 via-zinc-700/50 to-zinc-800/50 hover:from-zinc-700/50 hover:via-zinc-600/50 hover:to-zinc-700/50 border border-zinc-600/30 text-white/80 hover:text-white font-medium text-sm rounded-xl transition-all duration-200"
                >
                  Go Back
                </button>
              </div>

              {/* Tip */}
              <p className="text-center text-[10px] text-white/40 mt-4">
                💡 Tip: Open this link on your computer for the best experience
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MobileWarningModal;

