"use client";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { useUpdateProfileMutation } from "@/lib/store/api/userApi";
import { updateProfile as updateProfileAction } from "@/lib/store/slices/authSlice";
import { LuCheck, LuLink, LuPencil, LuMessageSquare, LuX } from "react-icons/lu";
import { showError, showSuccess } from "@/utils/toast";
import { useRoomContext } from "@/context/RoomContext";
import { validateUsername } from "@/utils/validation";
import { trackRoomLinkCopied } from "@/lib/analytics";
import { useTranslations } from "@/i18n/I18nProvider";
import FeedbackModal from "@/components/Modals/FeedbackModal";
import {
  panelFramedCardClass,
  panelMetaMutedLabelClass,
  panelTabRootClass,
  panelTabScrollAreaClass,
} from "./panelCardStyles";
import { appInputRadiusClass } from "@/components/UI/classTokens";

const sectionClass = "space-y-3";
const sectionLabelClass = panelMetaMutedLabelClass;
const fieldLabelClass =
  "text-[9px] font-semibold uppercase tracking-[0.12em] text-white/[0.36]";
const rowLabelClass = fieldLabelClass;
const cardShellClass =
  `${panelFramedCardClass} px-3.5 py-4`;
const actionCardShellClass =
  `${panelFramedCardClass} px-3.5 py-2`;
const actionCardButtonClass =
  `${panelFramedCardClass} w-full px-3.5 py-2 text-left transition-colors duration-200 hover:border-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50`;
const actionPillClass =
  "shrink-0 rounded-full bg-[linear-gradient(135deg,rgba(244,63,94,0.18),rgba(236,72,153,0.16),rgba(217,70,239,0.18))] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.86] transition-colors duration-200 hover:text-white";
const actionPillSuccessClass =
  "shrink-0 rounded-full bg-emerald-400/14 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300";
const valueRowClass =
  "flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0";
const valueBoxClass =
  `flex min-w-0 items-center gap-2 ${appInputRadiusClass} border border-white/[0.06] bg-transparent px-3 h-10`;
const inputCardClass =
  `flex min-w-0 items-center gap-2 ${appInputRadiusClass} border border-white/[0.07] bg-transparent px-3 h-10 transition-colors duration-200 focus-within:border-pink-400/26`;
const textInputClass =
  "settings-input min-w-0 flex-1 appearance-none bg-transparent text-sm leading-5 text-white placeholder:text-gray-500 outline-none";
const rowActionButtonClass =
  "flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-30";
const rowEditButtonClass = `${rowActionButtonClass} text-white/42 hover:text-white`;
const rowConfirmButtonClass = `${rowActionButtonClass} text-emerald-300 hover:text-emerald-200`;
const rowCancelButtonClass = `${rowActionButtonClass} text-rose-300 hover:text-rose-200`;

type EditableField = "name" | "username";

const SettingTab = () => {
  const roomId = useSelector((state: RootState) => state.room.roomId);
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const { updateUserName } = useRoomContext();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const t = useTranslations("panel.settings");
  const tHome = useTranslations("home");
  const tToast = useTranslations("toast");
  const tCommon = useTranslations("common");
  const tFeedback = useTranslations("feedback");

  const [copied, setCopied] = useState(false);
  const [name, setName] = useState<string>(authState.user?.name || "");
  const [username, setUsername] = useState<string>(authState.user?.username || "");
  const [email, setEmail] = useState<string>(authState.user?.email || "");
  const [activeEditField, setActiveEditField] = useState<EditableField | null>(null);
  const [usernameError, setUsernameError] = useState<string>("");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const showEmailField = !authState.user?.isGuestUser;

  const roomUrl = roomId
    ? typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}`
      : ""
    : "";

  const handleCopyLink = () => {
    if (roomUrl && roomId) {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      trackRoomLinkCopied(roomId);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleStartFieldEdit = (field: EditableField) => {
    if (activeEditField && activeEditField !== field) {
      return;
    }

    if (field === "name") {
      setName(authState.user?.name || "");
    }

    if (field === "username") {
      setUsername(authState.user?.username || "");
      setUsernameError("");
    }

    setActiveEditField(field);
  };

  const handleCancelFieldEdit = (field: EditableField) => {
    if (field === "name") {
      setName(authState.user?.name || "");
    }

    if (field === "username") {
      setUsername(authState.user?.username || "");
      setUsernameError("");
    }

    setEmail(authState.user?.email || "");
    setActiveEditField(null);
  };

  const handleUpdateProfile = async () => {
    if (!authState.user?.id) {
      showError(tCommon("error"), tToast("userNotFound"));
      return;
    }

    if (!name.trim() || !username.trim()) {
      showError(tToast("validationError"), tToast("fillFields"));
      return;
    }

    // Validate username format
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      setUsernameError(usernameValidation.error || "");
      showError(tToast("invalidUsername"), usernameValidation.error || tToast("enterValidUsername"));
      return;
    }

    // Clear any previous errors
    setUsernameError("");

    try {
      const result = await updateProfile({
        id: authState.user.id,
        name: name.trim(),
        username: username.trim(),
      }).unwrap();

      // Update Redux state with new user data
      if (result.data) {
        dispatch(updateProfileAction({
          name: result.data.name,
          username: result.data.username,
        }));
      }

      // Emit username update to socket so all users in the room see the updated username
      // if (socket && (roomId || roomIdFromContext)) {
      //   const currentRoomId = roomId || roomIdFromContext;
      //   socket.emit(SocketEvent.USERNAME_UPDATED, {
      //     username: result.data?.username || username.trim(),
      //     name: result.data?.name || name.trim(),
      //     profile: result.data?.picture || authState.user?.profile,
      //   });
      // }

      await updateUserName(result.data?.username || username.trim(), result.data?.name || name.trim(), result.data?.picture || authState.user?.profile || "");

      showSuccess(tToast("profileUpdated"));
      setActiveEditField(null);
    } catch (error: unknown) {
      console.error("Failed to update profile:", error);
      const errorMessage =
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message === "string"
          ? (error as { data?: { message?: string } }).data?.message || "Failed to update profile"
          : typeof error === "object" &&
              error !== null &&
              "message" in error &&
              typeof (error as { message?: string }).message === "string"
            ? (error as { message?: string }).message || "Failed to update profile"
            : "Failed to update profile";

      if (errorMessage.toLowerCase().includes("username already exists") ||
        errorMessage.toLowerCase().includes("already exists")) {
        setUsernameError(tToast("usernameTaken"));
      }

      showError(tToast("updateFailed"), errorMessage);
    }
  };

  return (
    <div className={panelTabRootClass}>
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        roomId={roomId}
      />

      {/* Room Settings */}
      <div className={panelTabScrollAreaClass}>
        <div className="flex flex-col gap-5 pb-4">
          <section className={sectionClass}>
            <div className="space-y-1.5">
              <p className={sectionLabelClass}>{t("roomLink")}</p>
              <div className={actionCardShellClass}>
                <div className="relative flex min-h-[48px] items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/12 text-cyan-200">
                      <LuLink size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium leading-4 text-white">
                        Invite friends
                      </p>
                      {roomId ? (
                        <p className="mt-1 flex items-center gap-1 truncate text-[9px] leading-3 text-white/42">
                          <span>{tHome("roomIdPlaceholder")}</span>
                          <span className="font-mono">{roomId}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={!roomUrl || !roomId}
                    className={`disabled:cursor-not-allowed disabled:opacity-50 ${
                      copied
                        ? actionPillSuccessClass
                        : actionPillClass
                    }`}
                  >
                    {copied ? t("linkCopied") : "Copy Link"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Profile Update Section */}
          <section className={sectionClass}>
            <p className={sectionLabelClass}>{t("profileSettings")}</p>
            <div className={cardShellClass}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.08),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.06),transparent_24%)]" />
              <div className="relative">
                <div className={valueRowClass}>
                  <label className={rowLabelClass}>{t("name")}</label>
                  {activeEditField === "name" ? (
                    <div className={inputCardClass}>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={textInputClass}
                        placeholder={t("enterName")}
                        disabled={isUpdatingProfile}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleUpdateProfile}
                        className={rowConfirmButtonClass}
                        disabled={isUpdatingProfile || !name.trim()}
                        aria-label={t("saveChanges")}
                      >
                        <LuCheck size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelFieldEdit("name")}
                        className={rowCancelButtonClass}
                        disabled={isUpdatingProfile}
                        aria-label={tCommon("cancel")}
                      >
                        <LuX size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className={valueBoxClass}>
                      <p className="min-w-0 flex-1 truncate text-sm text-white/82">{name || t("notSet")}</p>
                      <button
                        type="button"
                        onClick={() => handleStartFieldEdit("name")}
                        className={rowEditButtonClass}
                        disabled={Boolean(activeEditField)}
                        aria-label={tCommon("edit")}
                      >
                        <LuPencil size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className={valueRowClass}>
                  <label className={rowLabelClass}>{t("username")}</label>
                  {activeEditField === "username" ? (
                    <div className="space-y-1.5">
                      <div
                        className={`${inputCardClass} ${
                          usernameError ? "border-red-500/30" : ""
                        }`}
                      >
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => {
                            const newUsername = e.target.value;
                            setUsername(newUsername);

                            if (newUsername.trim()) {
                              const validation = validateUsername(newUsername);
                              if (!validation.valid) {
                                setUsernameError(validation.error || "");
                              } else {
                                setUsernameError("");
                              }
                            } else {
                              setUsernameError("");
                            }
                          }}
                          className={textInputClass}
                          placeholder={t("enterUsername")}
                          disabled={isUpdatingProfile}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleUpdateProfile}
                          className={rowConfirmButtonClass}
                          disabled={isUpdatingProfile || !username.trim() || !!usernameError}
                          aria-label={t("saveChanges")}
                        >
                          <LuCheck size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelFieldEdit("username")}
                          className={rowCancelButtonClass}
                          disabled={isUpdatingProfile}
                          aria-label={tCommon("cancel")}
                        >
                          <LuX size={16} />
                        </button>
                      </div>
                      {usernameError ? (
                        <p className="px-1 text-[11px] font-medium text-red-400">{usernameError}</p>
                      ) : username.trim() ? (
                        <p className="px-1 text-[11px] text-gray-500">{t("usernameRules")}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className={valueBoxClass}>
                      <p className="min-w-0 flex-1 truncate text-sm text-white/82">{username || t("notSet")}</p>
                      <button
                        type="button"
                        onClick={() => handleStartFieldEdit("username")}
                        className={rowEditButtonClass}
                        disabled={Boolean(activeEditField)}
                        aria-label={tCommon("edit")}
                      >
                        <LuPencil size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {showEmailField ? (
                  <div className={`${valueRowClass} group relative`}>
                    <label className={`${rowLabelClass} text-white/[0.18]`}>
                      {t("emailAddress")}
                    </label>
                    <div
                      id="settings-email-tooltip"
                      className="pointer-events-none absolute right-0 top-[10px] z-10 rounded-lg border border-white/[0.06] bg-[#141418]/95 px-2.5 py-1.5 text-[10px] font-medium leading-4 text-white/62 opacity-0 translate-y-1 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
                    >
                      {t("emailCannotBeChanged")}
                    </div>
                    <div
                      className={`${valueBoxClass} cursor-not-allowed border-white/[0.04] text-white/40`}
                      aria-label={`${email}. ${t("emailCannotBeChanged")}`}
                      aria-describedby="settings-email-tooltip"
                      tabIndex={0}
                    >
                      <p className="min-w-0 flex-1 truncate text-sm text-white/40">{email}</p>
                    </div>
                  </div>
                ) : null}
              </div>

            </div>
          </section>

          <section className={sectionClass}>
            <div className="space-y-1.5">
              <p className={sectionLabelClass}>{tFeedback("title")}</p>
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className={actionCardButtonClass}
              >
                <div className="relative flex min-h-[48px] items-center justify-between gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-400/12 text-rose-200">
                    <LuMessageSquare size={14} />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-[13px] font-medium leading-4 text-white">
                    {tFeedback("helpUsImprove")}
                  </p>
                  <span className={actionPillClass}>
                    Give Feedback
                  </span>
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>


      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }

        .settings-input:-webkit-autofill,
        .settings-input:-webkit-autofill:hover,
        .settings-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff;
          caret-color: #ffffff;
          -webkit-box-shadow: 0 0 0 1000px rgba(15, 15, 18, 0.18) inset;
          box-shadow: 0 0 0 1000px rgba(15, 15, 18, 0.18) inset;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
};

export default SettingTab;
