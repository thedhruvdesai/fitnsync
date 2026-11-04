"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Paddle?: any;
  }
}

export interface PaddleEvent {
  name?: string;
  data?: any;
}

let ready: Promise<any> | null = null;
const listeners = new Set<(e: PaddleEvent) => void>();

/** Subscribe to Paddle.js checkout events (checkout.loaded, checkout.updated, checkout.completed, ...). */
export function onPaddleEvent(fn: (e: PaddleEvent) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Loads Paddle.js v2 once and initialises it with the public client-side token. */
export function loadPaddle(token: string, environment: "sandbox" | "production") {
  if (ready) return ready;
  ready = new Promise((resolve, reject) => {
    const init = () => {
      try {
        if (environment === "sandbox") window.Paddle.Environment.set("sandbox");
        window.Paddle.Initialize({ token, eventCallback: (e: PaddleEvent) => listeners.forEach((l) => l(e)) });
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
      reject(new Error("Couldn't load checkout. Check your connection or turn off your ad-blocker."));
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

/** Embeds Paddle's payment form inside an element with the given class name. */
export async function openInlineCheckout(c: CheckoutInfo, frameTarget: string) {
  const Paddle = await loadPaddle(c.clientToken, c.environment);
  Paddle.Checkout.open({
    items: [{ priceId: c.priceId, quantity: 1 }],
    customer: { email: c.email, ...(c.countryCode ? { address: { countryCode: c.countryCode } } : {}) },
    customData: { user_id: c.userId },
    settings: {
      displayMode: "inline",
      variant: "one-page",
      theme: "dark",
      frameTarget,
      frameInitialHeight: 460,
      frameStyle: "width: 100%; min-width: 300px; background-color: transparent; border: none;",
      allowLogout: false,
      showAddDiscounts: true,
      showAddTaxId: false, // hide "Add ABN / VAT number" (consumer app)
    },
  });
}

export function closeCheckout() {
  try {
    window.Paddle?.Checkout?.close();
  } catch {
    /* ignore */
  }
}
