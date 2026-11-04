"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Paddle?: any;
  }
}

let ready: Promise<any> | null = null;

/** Loads Paddle.js v2 once and initialises it with the public client-side token. */
export function loadPaddle(token: string, environment: "sandbox" | "production") {
  if (ready) return ready;
  ready = new Promise((resolve, reject) => {
    const init = () => {
      try {
        if (environment === "sandbox") window.Paddle.Environment.set("sandbox");
        window.Paddle.Initialize({ token });
        resolve(window.Paddle);
      } catch (e) {
        reject(e);
      }
    };
    if (window.Paddle) return init();
    const s = document.createElement("script");
    s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    s.async = true;
    s.onload = init;
    s.onerror = () => {
      ready = null;
      reject(new Error("Couldn't load checkout. Check your connection or ad-blocker."));
    };
    document.head.appendChild(s);
  });
  return ready;
}

export interface CheckoutInfo {
  priceId: string;
  email: string;
  userId: string;
  countryCode?: string;
  clientToken: string;
  environment: "sandbox" | "production";
}

export async function openCheckout(c: CheckoutInfo) {
  const Paddle = await loadPaddle(c.clientToken, c.environment);
  Paddle.Checkout.open({
    items: [{ priceId: c.priceId, quantity: 1 }],
    customer: { email: c.email, ...(c.countryCode ? { address: { countryCode: c.countryCode } } : {}) },
    customData: { user_id: c.userId },
    settings: {
      displayMode: "overlay",
      theme: "dark",
      successUrl: `${window.location.origin}/app/billing?success=1`,
    },
  });
}
