"use client";

import { useState } from "react";
import { LuSparkles, LuVideo } from "react-icons/lu";
import { useCallStream } from "@/context/CallStreamContext";
import UpgradeSubscriptionModal from "@/components/Modals/UpgradeSubscriptionModal";

export default function CallUpsellTeaser() {
  const { isHost } = useCallStream();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/[0.08] via-amber-400/[0.06] to-transparent px-3 py-2.5 ring-1 ring-amber-400/15">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
            <LuVideo size={14} className="text-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold leading-tight text-white/85">
              Video and audio calls
            </p>
            <p className="mt-0.5 truncate text-[10px] leading-tight text-white/45">
              {isHost
                ? "Upgrade to enable calls for this room"
                : "Host needs Premium to enable calls"}
            </p>
          </div>
          {isHost && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1.5 text-[10px] font-semibold text-amber-200 ring-1 ring-amber-400/20 transition-colors hover:bg-amber-500/25"
            >
              <LuSparkles size={10} />
              Upgrade
            </button>
          )}
        </div>
      </div>

      <UpgradeSubscriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isHost={true}
      />
    </>
  );
}
