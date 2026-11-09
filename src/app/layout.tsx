import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (bundled) fonts: no request to Google, preloaded, no layout shift. Both are SIL OFL licensed.
const bricolage = localFont({
  src: [
    { path: "../fonts/bricolage-grotesque-latin-opsz-normal.woff2", weight: "200 800", style: "normal" },
  ],
  variable: "--font-bricolage",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
const interTight = localFont({
  src: [
    { path: "../fonts/inter-tight-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-inter-tight",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://liftkai.fit"),
  title: { default: "Liftkai: AI meal plans & workouts, built around you", template: "%s" },
  description: "Liftkai builds your personal meal plan, training program and calorie targets, then coaches you every week with AI feedback. Food you love, workouts that fit.",
  applicationName: "Liftkai",
  keywords: ["meal plan app", "workout planner", "AI fitness coach", "macro tracker", "calorie counter", "gym meal plan", "Liftkai"],
  openGraph: { type: "website", siteName: "Liftkai", title: "Liftkai: AI meal plans & workouts", description: "Your meal plan, training program and AI coach in one app." },
  twitter: { card: "summary_large_image", title: "Liftkai: AI meal plans & workouts", description: "Your meal plan, training program and AI coach in one app." },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Liftkai" },
};

export const viewport: Viewport = { themeColor: "#0A0A0B", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${bricolage.variable} ${interTight.variable}`}>
      <body className="grain min-h-screen">{children}</body>
    </html>
  );
}
