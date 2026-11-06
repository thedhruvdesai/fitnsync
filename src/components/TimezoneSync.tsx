"use client";
import { useEffect } from "react";
import { TZ_COOKIE } from "@/lib/tz";

/**
 * Remembers the device's time zone in a cookie (so server pages know the user's "today")
 * and, for signed-in users, saves it to their profile when it changes (travel, moving).
 */
export function TimezoneSync({ saved, reloadFirst = false }: { saved?: string | null; reloadFirst?: boolean }) {
  useEffect(() => {
    let tz = "";
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!tz) return;
    const current = document.cookie.split("; ").find((c) => c.startsWith(`${TZ_COOKIE}=`))?.split("=")[1];
    if (current !== encodeURIComponent(tz)) {
      document.cookie = `${TZ_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
      // first visit: refresh so server-rendered dates use the right day
      if (!current && reloadFirst) setTimeout(() => window.location.reload(), 50);
    }
    if (saved !== undefined && saved !== tz) {
      fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ timezone: tz }) }).catch(() => {});
    }
  }, [saved, reloadFirst]);
  return null;
}
