import { LegalPage } from "@/components/LegalPage";

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy"
      sections={[
        ["What we collect", "Your email, the details you give at intake (age, height, weight, goals, diet, training), and the food, training, weight, sleep and notes you log."],
        ["How we use it", "To build and adjust your plan, produce reports, send your weekly email and generate AI coach feedback. Your logs and any food photos you scan are sent to our AI provider (Google Gemini or Anthropic) only to generate estimates and feedback. Please avoid including people or personal details in food photos."],
        ["Where it's stored", "Data is stored with Supabase. Payments are handled by Paddle.com, our online reseller and merchant of record, which processes your payment details; we never see or store your card number."],
        ["Your choices", "You can turn off weekly emails, update your details, or ask us to delete your account and data at any time by emailing us."],
        ["Australian Privacy Principles", "We handle personal and health information in line with the Privacy Act 1988 (Cth). Contact us with any privacy question or complaint."],
      ]}
    />
  );
}
