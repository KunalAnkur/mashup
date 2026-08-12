"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LuCheck } from "react-icons/lu";
import { ImSpinner2 } from "react-icons/im";
import { RootState } from "@/lib/store";
import { useUpdateProfileMutation } from "@/lib/store/api/userApi";
import { updateProfile as updateProfileAction } from "@/lib/store/slices/authSlice";
import { validateUsername } from "@/utils/validation";
import { showError, showSuccess } from "@/utils/toast";
import { useLocale, useTranslations } from "@/i18n/I18nProvider";
import { locales, languageNames, isRtlLocale, type Locale } from "@/i18n/config";
import { Input } from "@/components/UI";
import SidebarAvatarChip from "@/components/Sidebar/SidebarAvatarChip";
import {
  appSectionTitleTextClass,
  dashPageTitleWrapClass,
  dashPageContentWrapClass,
  dashSettingsSectionLabelClass,
  dashSettingsFieldLabelClass,
  dashSettingsFieldWrapClass,
  dashSettingsFieldInputClass,
  dashSettingsFieldStaticClass,
  dashSettingsSaveButtonClass,
  dashPopoverRowClass,
  dashLanguageRowActiveClass,
} from "@/components/UI/classTokens";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const t = useTranslations("panel.settings");
  const tCommon = useTranslations("common");
  const currentLocale = useLocale();

  const [name, setName] = useState(authState.user?.name || "");
  const [username, setUsername] = useState(authState.user?.username || "");
  const [usernameError, setUsernameError] = useState("");
  const [isChangingLocale, setIsChangingLocale] = useState(false);

  const isGuest = !!authState.user?.isGuestUser;
  const showEmailField = !isGuest;
  const displayName = authState.user?.name || authState.user?.username || "Guest";

  const handleSave = async () => {
    if (!authState.user?.id) {
      showError(tCommon("error"), t("userNotFound"));
      return;
    }
    if (!name.trim() || !username.trim()) {
      showError(t("validationError"), t("fillFields"));
      return;
    }

    const validation = validateUsername(username);
    if (!validation.valid) {
      setUsernameError(validation.error || "");
      showError(t("invalidUsername"), validation.error || t("enterValidUsername"));
      return;
    }
    setUsernameError("");

    try {
      const result = await updateProfile({
        id: authState.user.id,
        name: name.trim(),
        username: username.trim(),
      }).unwrap();

      if (result.data) {
        dispatch(
          updateProfileAction({
            name: result.data.name,
            username: result.data.username,
          }),
        );
      }
      showSuccess(t("profileUpdated"));
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message === "string"
          ? (error as { data?: { message?: string } }).data?.message || t("updateFailedDescription")
          : typeof error === "object" &&
              error !== null &&
              "message" in error &&
              typeof (error as { message?: string }).message === "string"
            ? (error as { message?: string }).message || t("updateFailedDescription")
            : t("updateFailedDescription");

      if (errorMessage.toLowerCase().includes("already exists")) {
        setUsernameError(t("usernameTaken"));
      }
      showError(t("updateFailed"), errorMessage);
    }
  };

  const handleLanguageChange = (locale: Locale) => {
    if (locale === currentLocale || isChangingLocale) return;
    setIsChangingLocale(true);
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;SameSite=Lax`;
    setTimeout(() => {
      window.location.href = window.location.pathname + window.location.search;
    }, 100);
  };

  return (
    <div className={dashPageContentWrapClass}>
      {/* Horizontally centered only — top-aligned vertically (owner: "yukarı yaslansın,
          dikey center olmasın"), scoped to this page only. */}
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
      <div className={`${dashPageTitleWrapClass} justify-center`}>
        <h1 className={appSectionTitleTextClass}>{t("profileSettings")}</h1>
      </div>

      <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2">
        {/* Profile column — no "Settings" section label here on purpose: the page's own
            <h1> already says "Profile Settings", a second label right under it was redundant. */}
        <div>
          {!isGuest ? (
            <div className="mb-5 flex items-center gap-3.5">
              <SidebarAvatarChip name={displayName} photoUrl={authState.user?.profile} large />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-dashText">
                  {t("profilePicture")}
                </div>
                <div className="truncate text-[12px] text-dashTextMute">
                  {t("syncedFromGoogle")}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-5 flex items-center gap-3.5">
              <SidebarAvatarChip name={displayName} large />
              <div className="min-w-0 truncate text-[13px] font-semibold text-dashText">
                {displayName}
              </div>
            </div>
          )}

          {showEmailField ? (
            <div className="mb-4 flex flex-col gap-1.5">
              <span className={dashSettingsFieldLabelClass}>{t("emailAddress")}</span>
              <div className={dashSettingsFieldStaticClass}>
                <span className="truncate">{authState.user?.email}</span>
              </div>
            </div>
          ) : null}

          <div className="mb-4 flex flex-col gap-1.5">
            <span className={dashSettingsFieldLabelClass}>{t("name")}</span>
            <div className={dashSettingsFieldWrapClass}>
              <Input
                variant="raw"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("enterName")}
                className={dashSettingsFieldInputClass}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-1.5">
            <span className={dashSettingsFieldLabelClass}>{t("username")}</span>
            <div className={dashSettingsFieldWrapClass}>
              <span className="shrink-0 pr-0.5 text-[13.5px] text-dashTextMute">@</span>
              <Input
                variant="raw"
                type="text"
                value={username}
                onChange={(e) => {
                  const next = e.target.value;
                  setUsername(next);
                  if (!next.trim()) {
                    setUsernameError("");
                    return;
                  }
                  const validation = validateUsername(next);
                  setUsernameError(validation.valid ? "" : validation.error || "");
                }}
                placeholder={t("enterUsername")}
                className={dashSettingsFieldInputClass}
                disabled={isSaving}
              />
            </div>
            {usernameError ? (
              <p className="px-1 text-[11px] font-medium text-rose-400">{usernameError}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !username.trim() || !!usernameError}
            className={dashSettingsSaveButtonClass}
          >
            {isSaving ? <ImSpinner2 className="animate-spin" /> : null}
            {t("saveChanges")}
          </button>
        </div>

        {/* Language column */}
        <div className="sm:border-l sm:border-dashBorder sm:pl-8">
          <p className={`${dashSettingsSectionLabelClass} mb-4`}>{t("language")}</p>
          <div className="flex flex-col gap-0.5">
            {locales.map((loc) => {
              const lang = languageNames[loc];
              const isActive = loc === currentLocale;
              const isRtl = isRtlLocale(loc);
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleLanguageChange(loc)}
                  disabled={isChangingLocale}
                  className={`${dashPopoverRowClass} ${isActive ? dashLanguageRowActiveClass : ""} ${
                    isChangingLocale ? "opacity-50" : ""
                  } ${isRtl ? "flex-row-reverse text-right" : ""}`}
                >
                  <span className="shrink-0 text-base leading-none">{lang.flag}</span>
                  <span className="min-w-0 flex-1 truncate">{lang.nativeName}</span>
                  {isActive ? <LuCheck size={14} className="shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ProfilePage;
