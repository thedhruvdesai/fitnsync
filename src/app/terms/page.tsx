import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { TRIAL_DAYS } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Terms & Conditions · Liftkai",
  description: "The terms that apply when you use Liftkai, including subscriptions, free trials, refunds, AI coaching and health information.",
};

const EMAIL = "liftkai.fit@gmail.com";

export default function Terms() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="9 November 2026"
      intro="These terms explain how Liftkai works, what you can expect from us and what we expect from you. Please read them before you sign up. By creating an account or using Liftkai, you agree to these terms and to our Privacy Policy."
      sections={[
        [
          "Who we are",
          [
            `Liftkai ("Liftkai", "we", "us", "our") is an online fitness and nutrition service operated from Queensland, Australia. You can reach us any time at ${EMAIL} or through the contact form on our website.`,
            `In these terms, "you" means the person using Liftkai, and "the service" means the Liftkai website, web app, emails and any related features.`,
          ],
        ],
        [
          "Who can use Liftkai",
          [
            "You must be at least 18 years old to create an account and use the service.",
            "You must give accurate information when you sign up and during your intake (for example your age, height, weight, goals and any injuries), because your plan is built from it. Inaccurate information can lead to unsuitable targets or programs.",
          ],
        ],
        [
          "Your account",
          [
            "You are responsible for keeping your login details secure and for all activity on your account. Tell us straight away if you think someone else has accessed it.",
            "Accounts are personal. Please don't share your account or resell access to the service.",
          ],
        ],
        [
          "What the service includes",
          [
            "Depending on your plan, Liftkai provides personalised calorie, protein and macro targets; weekly meal plans that follow your diet; training programs for your goal, schedule and equipment; food, workout, water, weight and sleep logging (including AI food photo and barcode tools); progress charts, reports and weekly emails; and AI coaching feedback.",
            "Features available on each plan are shown on our pricing page at the time you subscribe. We continually improve Liftkai and may add, change or remove features. If we remove a core feature of your paid plan, we'll tell you in advance and you can cancel.",
          ],
        ],
        [
          "Health and safety: not medical advice",
          [
            "Liftkai provides general fitness and nutrition information only. It is not medical, dietetic, physiotherapy or psychological advice, and it does not replace a doctor, Accredited Practising Dietitian or other qualified health professional.",
            "Talk to your GP before starting a new diet or exercise program, especially if you have a medical condition or injury, take medication, are pregnant or breastfeeding, or have a history of disordered eating.",
            "Listen to your body. Stop exercising and seek medical help if you feel pain, dizziness, chest discomfort or shortness of breath. Calorie and macro targets are estimates and individual needs vary.",
            "If you are in an emergency, call 000 (in Australia) or your local emergency number.",
          ],
        ],
        [
          "AI features and Liftkai Coach",
          [
            "Liftkai Coach and our AI food tools are artificial intelligence, not a human coach. Their feedback, estimates and suggestions are generated automatically from the information you provide and may be incomplete or wrong, including nutrition estimates from photos or barcodes.",
            "Use your own judgement before acting on AI output, and check anything that matters (for example allergens or medical needs) with a qualified professional. To provide these features, the relevant information is processed by our AI providers as described in our Privacy Policy.",
          ],
        ],
        [
          "Subscriptions, free trial and billing",
          [
            `Our order process is conducted by our online reseller Paddle.com. Paddle.com is the merchant of record for all our orders and processes payments, taxes, invoices and payment-related customer service and returns.`,
            `New subscribers get a ${TRIAL_DAYS}-day free trial on their first paid plan. If you don't cancel before the trial ends, your subscription starts automatically and you'll be charged the plan price.`,
            "Subscriptions renew automatically each month on your billing date until you cancel. Prices are shown in your local currency and include any applicable taxes such as GST where required. Pricing is based on the country you live in.",
            "We may change our prices from time to time. We'll give you at least 30 days' notice by email before a price change affects your subscription, and you can cancel before it takes effect.",
            "You can upgrade or downgrade your plan in your account. Changes and any adjustments to charges are handled by Paddle at the time of the change.",
          ],
        ],
        [
          "Cancelling and refunds",
          [
            "You can cancel at any time from Plan & account in the app. When you cancel, you keep access until the end of the billing period you've already paid for, and you won't be charged again.",
            `If you're not happy, email ${EMAIL} within 14 days of a charge and we'll refund that charge in full. After 14 days, payments are generally non-refundable for the remainder of the billing period, except where the law requires otherwise.`,
            "Nothing in these terms excludes, restricts or modifies any rights you have under the Australian Consumer Law or other laws that cannot be excluded, including your right to a remedy if the service has a major failure.",
          ],
        ],
        [
          "Acceptable use",
          [
            "Please use Liftkai lawfully and respectfully. You must not: misuse, disrupt or try to gain unauthorised access to the service or other users' data; copy, scrape, reverse engineer or resell any part of the service; use automated tools to overload our systems or AI features; upload unlawful, offensive or infringing content, or photos of other people without their consent; or use the service to harm yourself or others.",
            "We may suspend or close accounts that break these rules.",
          ],
        ],
        [
          "Your content and data",
          [
            "You own the information you add to Liftkai, such as your logs, notes and progress photos. You give us permission to store and process it only so we can provide, secure and improve the service for you, including generating your plans, reports and AI feedback.",
            "You can download a copy of your data or permanently delete your account at any time from Plan & account. Our Privacy Policy explains how we collect, use and protect your personal and health information.",
          ],
        ],
        [
          "Our intellectual property",
          [
            "The Liftkai name, logo, website, app, designs, meal plans, programs, text and software are owned by or licensed to us and are protected by intellectual property laws. We give you a personal, non-transferable licence to use the service for your own fitness and nutrition while your account is active. You may not copy, publish or commercially use our content without written permission.",
          ],
        ],
        [
          "Third-party services",
          [
            "Liftkai relies on trusted third parties, including Paddle (payments), Supabase (data storage and sign-in), AI providers (coaching and food recognition), Open Food Facts (barcode nutrition data) and email providers. Their services are subject to their own terms. We aren't responsible for third-party content such as product nutrition data, which may sometimes be inaccurate.",
          ],
        ],
        [
          "Availability",
          [
            "We work hard to keep Liftkai available and secure, but we can't guarantee it will always be uninterrupted or error-free. We may need to pause the service for maintenance, updates or reasons outside our control.",
          ],
        ],
        [
          "Limitation of liability",
          [
            "To the maximum extent permitted by law, and subject to your rights under the Australian Consumer Law, we are not liable for any indirect or consequential loss, or for any injury, illness or loss arising from following general fitness, nutrition or AI-generated information without appropriate professional advice.",
            "Where our liability for failing to comply with a consumer guarantee can be limited, it is limited (at our choice) to supplying the service again or paying the cost of having it supplied again. Otherwise, our total liability to you is limited to the amount you paid us in the 3 months before the event giving rise to the claim.",
          ],
        ],
        [
          "Ending your use of Liftkai",
          [
            "You can stop using Liftkai and delete your account at any time. We may suspend or end your access if you seriously or repeatedly breach these terms, if required by law, or if we stop offering the service. If we end the service for reasons other than your breach, we'll give you reasonable notice and refund any unused, prepaid period.",
          ],
        ],
        [
          "Changes to these terms",
          [
            "We may update these terms as Liftkai grows or the law changes. If we make a significant change, we'll let you know by email or in the app before it takes effect. The date at the top shows when they were last updated. Continuing to use Liftkai after a change means you accept the updated terms.",
          ],
        ],
        [
          "Governing law",
          [
            "These terms are governed by the laws of Queensland, Australia. You and we submit to the non-exclusive jurisdiction of the courts of Queensland and the courts that can hear appeals from them. If you live elsewhere, you may also have rights under the consumer laws of your country.",
          ],
        ],
        [
          "Contact us",
          [
            `Questions, complaints or refund requests: email ${EMAIL} or use the contact form at liftkai.fit/contact. We aim to reply within 1–2 business days.`,
          ],
        ],
      ]}
    />
  );
}
