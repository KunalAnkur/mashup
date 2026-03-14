"use client";
import { useState } from "react";
import { trackRoomLinkCopied, trackInviteSent } from "@/lib/analytics";
import { useTranslations } from "@/i18n/I18nProvider";
import { LuCheck, LuCopy } from "react-icons/lu";
import {
  modalBalancedContentClass,
  Modal,
  ModalCloseButton,
  modalBrandActionButtonClass,
  modalCornerCloseButtonClass,
  modalConfirmSurfaceClass,
} from "@/components/UI";

interface ModalOnRoomCreateProps {
  isHost: boolean;
  hostUsername: string | null;
  showModal: boolean;
  onClose: () => void;
  roomUrl: string;
  onJoinRoom?: () => void;
}

const ModalOnRoomCreate = ({
  isHost,
  hostUsername,
  showModal,
  onClose,
  roomUrl,
  onJoinRoom,
}: ModalOnRoomCreateProps) => {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("room");
  const tCommon = useTranslations("common");
  const heroIcon = isHost ? "🎉" : "🎬";
  const heroTitle = isHost
    ? t("yourWatchPartyReady")
    : hostUsername
      ? t("invitedBy", { host: hostUsername })
      : t("invitedToWatchParty");
  const heroSubtitle = isHost ? t("inviteFriendsToStart") : t("watchVideosTogether");
  const shareButtonBaseClass =
    "flex items-center justify-center rounded-lg bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 p-2 transition-all duration-200 backdrop-blur-xl md:p-2.5";

  // Extract roomId from roomUrl (e.g., /room/abc123 -> abc123)
  const roomId = roomUrl?.split('/room/')[1] || '';

  // Handle copying invite link
  const handleCopyLink = () => {
    if (roomUrl) {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      if (roomId) trackRoomLinkCopied(roomId);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle sharing via WhatsApp
  const handleShareWhatsApp = () => {
    const text = `${t("joinMyWatchParty")} ${roomUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    if (roomId) trackInviteSent(roomId, "whatsapp");
  };

  // Handle sharing via Telegram
  const handleShareTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(roomUrl)}&text=${encodeURIComponent(t("joinMyWatchParty"))}`,
      '_blank'
    );
    if (roomId) trackInviteSent(roomId, "telegram");
  };

  // Handle sharing via Instagram (copy link and open Instagram)
  const handleShareInstagram = () => {
    if (roomUrl) {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      if (roomId) trackInviteSent(roomId, "copy_link");
      setTimeout(() => setCopied(false), 2000);
      // Try to open Instagram website
      window.open('https://www.instagram.com/', '_blank');
    }
  };

  // Handle sharing via Discord (copy link and open Discord)
  const handleShareDiscord = () => {
    if (roomUrl) {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      if (roomId) trackInviteSent(roomId, "copy_link");
      setTimeout(() => setCopied(false), 2000);
      // Try to open Discord website
      window.open('https://discord.com/app', '_blank');
    }
  };

  // Handle sharing via Twitter
  const handleShareTwitter = () => {
    const text = `${t("joinMyWatchPartyOnMovmash")} ${roomUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    if (roomId) trackInviteSent(roomId, "share_api");
  };

  const primaryAction = isHost
    ? copied
      ? {
          label: tCommon("linkCopied"),
          icon: <LuCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />,
          onClick: handleCopyLink,
        }
      : {
          label: t("copyInviteLink"),
          icon: <LuCopy className="h-3.5 w-3.5 md:h-4 md:w-4" />,
          onClick: handleCopyLink,
        }
    : {
        label: t("joinRoom"),
        icon: null,
        onClick: onJoinRoom || onClose,
      };

  const shareButtons = [
    {
      key: "whatsapp",
      label: "Share via WhatsApp",
      onClick: handleShareWhatsApp,
      hoverClass: "hover:from-green-600/20 hover:via-emerald-600/20 hover:to-teal-600/20",
      icon: (
        <svg className="w-4 h-4 md:w-5 md:h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      ),
    },
    {
      key: "telegram",
      label: "Share via Telegram",
      onClick: handleShareTelegram,
      hoverClass: "hover:from-blue-600/20 hover:via-cyan-600/20 hover:to-sky-600/20",
      icon: (
        <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
    },
    {
      key: "twitter",
      label: "Share via Twitter",
      onClick: handleShareTwitter,
      hoverClass: "hover:from-sky-600/20 hover:via-blue-600/20 hover:to-cyan-600/20",
      icon: (
        <svg className="w-4 h-4 md:w-5 md:h-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      key: "instagram",
      label: "Share via Instagram",
      onClick: handleShareInstagram,
      hoverClass: "hover:from-pink-600/20 hover:via-rose-600/20 hover:to-fuchsia-600/20",
      icon: (
        <svg className="w-4 h-4 md:w-5 md:h-5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162 0 3.403 2.759 6.162 6.162 6.162 3.403 0 6.162-2.759 6.162-6.162 0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4 2.209 0 4 1.791 4 4 0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
    },
    {
      key: "discord",
      label: "Share via Discord",
      onClick: handleShareDiscord,
      hoverClass: "hover:from-indigo-600/20 hover:via-purple-600/20 hover:to-violet-600/20",
      icon: (
        <svg className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      ),
    },
  ];

  // Share buttons component
  const ShareButtons = () => (
    <div className="grid grid-cols-5 gap-1.5 md:gap-2">
      {shareButtons.map((button) => (
        <button
          key={button.key}
          onClick={button.onClick}
          className={`${shareButtonBaseClass} ${button.hoverClass}`}
          aria-label={button.label}
        >
          {button.icon}
        </button>
      ))}
    </div>
  );

  return (
    <Modal
      open={showModal}
      onClose={onClose}
      overlayClassName="z-[99999]"
      panelClassName={modalConfirmSurfaceClass}
    >
      <div className="relative w-full">
        <ModalCloseButton
          onClick={onClose}
          className={`${modalCornerCloseButtonClass} text-white/45 hover:text-white/82`}
          label={tCommon("close")}
        />

        <div className={modalBalancedContentClass}>
          <div className="mb-4 text-center md:mb-5">
            <div className="mb-2 text-center text-[34px] leading-none md:mb-2.5 md:text-[38px]">
              <span aria-hidden="true">{heroIcon}</span>
            </div>
            <div>
              <h3 className="font-parkinsans text-[17px] font-semibold leading-tight text-white md:text-[20px]">
                {heroTitle}
              </h3>
              <p className="mx-auto mt-1.5 max-w-[18rem] text-[11px] leading-5 text-white/58 md:mt-2 md:text-xs">
                {heroSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={primaryAction.onClick}
            className={`${modalBrandActionButtonClass} mb-4 flex w-full items-center justify-center gap-1.5 md:mb-5`}
          >
            {primaryAction.icon}
            <span>{primaryAction.label}</span>
          </button>

          {/* Separator */}
          <div className="mb-3 flex items-center gap-1.5 md:mb-4 md:gap-2">
            <div className="h-px flex-1 bg-white/10"></div>
            <span className="text-[10px] text-white/40 md:text-xs">{tCommon("or")}</span>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          {/* Share buttons */}
          <ShareButtons />
        </div>
      </div>
    </Modal>
  );
};

export default ModalOnRoomCreate;
