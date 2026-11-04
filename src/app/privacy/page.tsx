import { LegalPage } from "@/components/LegalPage";

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy"
      sections={[
        ["What we collect", "Your email, the details you give at intake (age, height, weight, goals, diet, training), and the food, training, weight, sleep and notes you log."],
        ["How we use it", "To build and adjust your plan, produce reports, send your weekly email and generate AI coach feedback. Your logs are sent to our AI provider (Anthropic) only to generate your feedback."],
        ["Where it's stored", "Data is stored with Supabase, and payments are processed by Stripe. We never see or store your card number."],
        ["Your choices", "You can turn off weekly emails, update your details, or ask us to delete your account and data at any time by emailing us."],
        ["Australian Privacy Principles", "We handle personal and health information in line with the Privacy Act 1988 (Cth). Contact us with any privacy question or complaint."],
      ]}
    />
  );
}
