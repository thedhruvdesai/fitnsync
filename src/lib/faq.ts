import { TRIAL_DAYS } from "./tiers";

export type Faq = { q: string; a: string };
export type FaqGroup = { id: string; title: string; items: Faq[] };

export const CONTACT_EMAIL = "liftkai.fit@gmail.com";

export const INQUIRY_TYPES = [
  "General question",
  "Billing & subscriptions",
  "Technical support",
  "Meal plans & nutrition",
  "Training programs",
  "AI coach",
  "Privacy & data",
  "Partnerships & business",
  "Feedback & ideas",
] as const;

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "start",
    title: "Getting started",
    items: [
      { q: "What is Liftkai?", a: "Liftkai is an AI-powered fitness and nutrition app. It builds your personal calorie and protein targets, a weekly meal plan for how you eat and a training program for where you train, then helps you log your day and coaches you every week." },
      { q: "How does Liftkai build my plan?", a: "You answer a two-minute intake: your body, goal, experience, how many days a week you can train, your equipment, any injuries and how you eat. Liftkai uses that to set your targets and write a meal plan and program around you. No generic templates." },
      { q: "I'm a complete beginner. Is Liftkai for me?", a: "Yes. Tell us your experience at intake and your program matches it, from your first weeks in the gym to advanced lifters. Every exercise has clear instructions so you know what to do." },
      { q: "Do I need a gym?", a: "No. Choose the equipment you actually have, whether that's a full gym, a home setup with dumbbells or just your bodyweight, and your program is built for it." },
      { q: "Which devices does Liftkai work on?", a: "Liftkai runs in your browser on any phone, tablet or computer, and your data syncs across all of them. On your phone, use \"Add to Home Screen\" for an app-like experience." },
    ],
  },
  {
    id: "food",
    title: "Food & nutrition",
    items: [
      { q: "Does it work with my diet?", a: "Yes. Eat everything, or choose pescatarian, vegetarian, vegetarian with eggs or vegan, and exclude any foods you don't eat. Your meal plan, protein targets and quick-add foods follow your choices." },
      { q: "Can I log food from a photo?", a: "Yes. Snap a photo of your meal and the AI food log estimates what's on the plate, along with the calories and macros. It recognises meals from any cuisine, from Indian thalis to poke bowls. You can always edit the result." },
      { q: "Can I scan barcodes?", a: "Yes. Scan a packaged food's barcode to pull its nutrition information from the Open Food Facts database, then adjust the serving size." },
      { q: "How accurate are the calorie and macro numbers?", a: "Targets are calculated from your details using established formulas, and food estimates come from AI and food databases. They're good working estimates, not lab measurements, and Liftkai adjusts your plan as your weight and progress change." },
      { q: "Are there recipes?", a: "Yes. Liftkai includes recipes that fit your diet and targets, so hitting your protein is easy and the food still tastes good." },
    ],
  },
  {
    id: "training",
    title: "Training",
    items: [
      { q: "What kind of workouts will I get?", a: "A structured program for your goal (fat loss, muscle gain or general fitness), sized to the days per week you can train. Log your sets and reps in seconds, and track personal records over time." },
      { q: "What if I have an injury?", a: "Tell us about injuries during intake and your program is built to work around them. Liftkai isn't a physiotherapist, so always follow your health professional's advice and stop any exercise that causes pain." },
      { q: "Can I change my plan later?", a: "Yes. Update your details, schedule or equipment any time and your plan updates. On Pro and Elite, your plan is refreshed monthly as your body changes." },
    ],
  },
  {
    id: "coach",
    title: "AI coach",
    items: [
      { q: "Who writes the coach feedback?", a: "Liftkai Coach is an AI coach. It reads your logs, notes and targets each week and writes specific, honest feedback the way an experienced coach would. We tell you it's AI because you deserve to know." },
      { q: "What does Liftkai Coach help with?", a: "Elite members get an in-depth weekly review plus up to 8 on-demand check-ins a month, with specific fixes for food, training, sleep and recovery, and plan adjustments written for your week." },
      { q: "Is this medical advice?", a: "No. Liftkai gives general fitness and nutrition guidance. If you have a medical condition, are pregnant, or have a history of disordered eating, please speak with your GP or an Accredited Practising Dietitian first." },
    ],
  },
  {
    id: "billing",
    title: "Plans & billing",
    items: [
      { q: "What's the difference between Starter, Pro and Elite?", a: "Starter gives you your targets, meal plan, training program, logging and progress charts. Pro adds weekly emailed reports, full adherence and trend reports, PDF downloads and a monthly plan refresh. Elite adds Liftkai Coach's weekly in-depth review and on-demand check-ins." },
      { q: "How does the free trial work?", a: `Every plan starts with ${TRIAL_DAYS} days free. Cancel before day ${TRIAL_DAYS} and you pay nothing. Otherwise your plan starts automatically and renews monthly.` },
      { q: "Why are prices different in my country?", a: "Liftkai prices each plan fairly for the country you live in and charges in your local currency, for example AUD in Australia." },
      { q: "Can I cancel anytime?", a: "Yes. Manage or cancel from your account in two clicks. You keep access until the end of your billing month." },
      { q: "Do you offer refunds?", a: `Yes. If you're not happy, email ${CONTACT_EMAIL} within 14 days of a charge for a full refund. Your rights under the Australian Consumer Law always apply.` },
      { q: "Who processes my payment?", a: "Payments are handled securely by Paddle.com, our online reseller and merchant of record. They send your receipts and tax invoices, and we never see or store your card number." },
      { q: "Can I switch plans?", a: "Yes. Upgrade or downgrade any time from Plan & account. Changes and any price adjustments are handled automatically." },
    ],
  },
  {
    id: "privacy",
    title: "Account & privacy",
    items: [
      { q: "Is my data private?", a: "Yes. Your data is stored securely and is only used to run your plan, reports and coaching. Progress photos are private to you. We handle personal and health information in line with Australia's Privacy Act." },
      { q: "Can I download or delete my data?", a: "Yes. From Plan & account you can download a copy of your data or permanently delete your account, including progress photos, at any time." },
      { q: "Can I turn off the weekly emails?", a: "Yes. Switch weekly emails on or off any time in your settings." },
      { q: "How do I contact Liftkai?", a: `Use the contact form on our Contact page or email ${CONTACT_EMAIL}. We aim to reply within 1–2 business days.` },
    ],
  },
];

/** The short list shown on the homepage. */
export const HOME_FAQ: Faq[] = [
  FAQ_GROUPS[0].items[0],
  FAQ_GROUPS[1].items[0],
  FAQ_GROUPS[1].items[1],
  FAQ_GROUPS[3].items[0],
  FAQ_GROUPS[4].items[1],
  FAQ_GROUPS[4].items[3],
  FAQ_GROUPS[3].items[2],
];
