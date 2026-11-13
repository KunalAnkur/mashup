"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  appEntryActionButtonBaseClass,
  appEntrySecondaryButtonClass,
} from "@/components/UI/classTokens";
import { useTranslations } from "@/i18n/I18nProvider";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8989";

type Status = "working" | "done" | "invalid";

// Reached from the "Unsubscribe" link in our emails. No login: the signed token in the link
// identifies the user, so one click from any inbox is enough.
export default function UnsubscribePage() {
  const t = useTranslations("unsubscribe");
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<Status>(token ? "working" : "invalid");

  useEffect(() => {
    if (!token) return;
    fetch(`${baseUrl}/api/v1/user/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => setStatus(res.ok ? "done" : "invalid"))
      .catch(() => setStatus("invalid"));
  }, [token]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-black/30 p-8 text-center">
        <h1 className="text-3xl font-semibold text-white">{t(`${status}Title`)}</h1>
        <p className="mt-3 text-white/70">{t(`${status}Message`)}</p>
        {status !== "working" && (
          <div className="mt-6 flex gap-3 justify-center">
            <Link href="/" className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass}`}>
              {t("backHome")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
