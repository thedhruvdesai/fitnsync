import { LegalPage } from "@/components/LegalPage";

export default function Terms() {
  return (
    <LegalPage
      title="Terms of use"
      sections={[
        ["The service", "Fit&Sync provides personalised fitness and nutrition planning, logging, reports and AI-generated coaching feedback on a monthly subscription."],
        ["Not medical advice", "All content is general information. It is not medical, dietetic or physiotherapy advice and doesn't replace a qualified health professional. Consult your GP before starting a new diet or exercise program, especially if you have a medical condition, are pregnant, or have a history of disordered eating."],
        ["AI coaching", "Fit&Sync Coach is an artificial intelligence. Its feedback is generated automatically from the information you log and may contain errors. Use your judgement and stop any activity that causes pain."],
        ["Payments", "Our order process is conducted by our online reseller Paddle.com. Paddle.com is the merchant of record for all our orders and handles customer service inquiries and returns related to payment."],
        ["Subscriptions", "Plans renew monthly in your local currency until cancelled. You can cancel at any time from your account; access continues to the end of the paid period. Refunds: if you are unhappy, contact us within 14 days of a charge for a full refund. Nothing in these terms excludes your rights under the Australian Consumer Law."],
        ["Your account", "Keep your login secure. You must be 18 or older to use Fit&Sync."],
      ]}
    />
  );
}
