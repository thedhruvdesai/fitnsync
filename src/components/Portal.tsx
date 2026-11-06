"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders overlays (sheets, pickers) at the end of <body>, so they always cover the whole screen.
 * Without this, a modal opened inside a card with backdrop-blur is trapped inside that card,
 * and the mobile tab bar can sit on top of it.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
