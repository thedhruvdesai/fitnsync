"use client";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    if (/ChunkLoadError|Loading chunk|dynamically imported module/i.test(`${error.name} ${error.message}`) && !sessionStorage.getItem("fs_reloaded")) {
      sessionStorage.setItem("fs_reloaded", "1");
      window.location.reload();
    }
  }, [error]);
  return (
    <html lang="en">
      <body style={{ background: "#0A0A0B", color: "#F4F1EC", fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center", padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Something went wrong</h1>
          <p style={{ opacity: 0.7, fontSize: 14 }}>The app may have just updated.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, background: "#E11D2E", color: "#fff", border: 0, borderRadius: 999, padding: "10px 22px", fontSize: 15 }}>Reload</button>
          <p style={{ opacity: 0.4, fontSize: 11, marginTop: 16 }}>{error.message?.slice(0, 160)}</p>
        </div>
      </body>
    </html>
  );
}
