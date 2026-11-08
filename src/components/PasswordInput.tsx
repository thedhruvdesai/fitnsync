"use client";
import { useState } from "react";

/** Password field with an eye button to show or hide what you typed. */
export function PasswordInput({ value, onChange, autoComplete, minLength, ariaLabel = "Password" }: { value: string; onChange: (v: string) => void; autoComplete?: string; minLength?: number; ariaLabel?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        className="input !pr-12"
        type={show ? "text" : "password"}
        required
        minLength={minLength}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-bone-dim transition hover:text-bone"
      >
        {show ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.3 2.5-2.7 3.9M6.6 6.6C4.4 8 2.9 10.1 2 12c1 2.5 5 7 10 7 1.6 0 3.1-.4 4.4-1.1" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
