import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy · Liftkai", description: "How Liftkai collects, uses and protects your personal and health information." };

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="9 November 2026"
      sections={[
        ["What we collect", "Your email, the details you give at intake (age, height, weight, goals, diet, training), and the food, training, weight, sleep and notes you log."],
        ["How we use it", "To build and adjust your plan, produce reports, send your weekly email and generate AI coach feedback. Your logs and any food photos you scan are sent to our AI provider (Google Gemini or Anthropic) only to generate estimates and feedback. Please avoid including people or personal details in food photos."],
        ["Where it's stored", "Data is stored with Supabase. Payments are handled by Paddle.com, our online reseller and merchant of record, which processes your payment details; we never see or store your card number."],
        ["Your choices", "You can turn off weekly emails, update your details, download a copy of your data, or permanently delete your account at any time from Plan & account in the app. Progress photos are stored privately and only you can view them; they are deleted with your account."],
        ["Australian Privacy Principles", "We handle personal and health information in line with the Privacy Act 1988 (Cth). Email liftkai.fit@gmail.com with any privacy question or complaint."],
      ]}
    />
  );
}
