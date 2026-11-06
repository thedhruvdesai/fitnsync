"use client";
import { useEffect } from "react";

/** After a new deploy, an open tab can request JS chunks that no longer exist. Reload once to pick up the new version. */
function isStaleChunk(e: Error) {
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(`${e.name} ${e.message}`);
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    if (isStaleChunk(error) && !sessionStorage.getItem("fs_reloaded")) {
      sessionStorage.setItem("fs_reloaded", "1");
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div className="max-w-sm">
        <p className="eyebrow">Hiccup</p>
        <h1 className="h-display mt-2 text-3xl">Something went wrong</h1>
        <p className="mt-3 text-sm text-bone-dim">The app may have just updated. Reloading usually fixes it.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="btn-red" onClick={() => window.location.reload()}>Reload</button>
          <button className="btn-ghost" onClick={reset}>Try again</button>
        </div>
        <p className="mt-6 break-words text-[11px] text-bone-mute">{error.digest ? `Ref ${error.digest} · ` : ""}{error.message?.slice(0, 160)}</p>
      </div>
    </div>
  );
}
