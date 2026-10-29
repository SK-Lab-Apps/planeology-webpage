/**
 * faq.ts — the home page FAQ and the support page answers, as data. The pages
 * render them with <Faq> and emit the matching FAQPage JSON-LD. Keep these
 * consistent with the privacy policy and the app's store listing.
 */
import { CONTACT_EMAIL, APPLE_MANAGE_SUBSCRIPTIONS_URL, APPLE_REFUND_URL, ROUTES } from '@/config';
import counts from '@/data/app/counts.json';

export type FaqItem = { question: string; answer: string };

export const homeFaq: FaqItem[] = [
  {
    question: 'Does Planeology teach you to fly?',
    answer:
      "No. Planeology is for aviation enthusiasts: people who love planes and want to understand how flight works, the stories behind the aircraft, and what happens at airports. It is not flight training and it does not prepare anyone to operate an aircraft.",
  },
  {
    question: 'Do I need an account?',
    answer:
      'No. There is nothing to sign up for. Your progress, streaks and Hangar are stored on your iPhone, and the app never asks for an email address.',
  },
  {
    question: 'Which devices does it run on?',
    answer: 'Planeology is an iPhone app, available on the App Store.',
  },
  {
    question: 'What is a Boarding Pass?',
    answer:
      `The Boarding Pass is what unlocks the lessons: a monthly or yearly subscription, or a one-time lifetime purchase. The price is shown in the app before you buy, payment goes through your Apple Account, and subscriptions can be managed or canceled in your App Store settings.`,
  },
  {
    question: 'Are the facts checked?',
    answer:
      `Yes. Every number, date and record in the ${counts.lessons} lessons is checked against official sources such as FAA handbooks, NASA's aeronautics guides and national air and space museums, and each lesson lists its sources. Where good sources disagree, the lesson says so.`,
  },
  {
    question: 'Is Planeology affiliated with an airline or aircraft manufacturer?',
    answer:
      'No. Planeology is independent. Aircraft, airline and manufacturer names appear in the lessons because that is what the aircraft are called; they belong to their owners, and no affiliation or endorsement is implied.',
  },
];

export const supportFaq: FaqItem[] = [
  {
    question: 'How do I restore my purchases?',
    answer:
      `Use an iPhone signed in to the Apple Account you bought the Boarding Pass with. Open the purchase screen, which appears after the opening questions on a new install or from Get Boarding Pass in Profile, and tap Restore Purchases at the bottom. If it does not come back, check in Settings that the iPhone is signed in with the Apple Account you used to buy it, then write to us in the support chat and we will look at it with you.`,
  },
  {
    question: 'How do I cancel my subscription?',
    answer:
      `Subscriptions are managed by Apple, not inside the app. On your iPhone, open Settings, tap your name, tap Subscriptions, choose Planeology and tap Cancel Subscription. Canceling at least 24 hours before the current period ends stops the next charge; you keep access until the period runs out. <a href="${APPLE_MANAGE_SUBSCRIPTIONS_URL}" rel="noopener">Apple's instructions</a> cover every case.`,
  },
  {
    question: 'Can I get a refund?',
    answer:
      `Refunds for the Boarding Pass are handled by Apple under App Store rules; we cannot issue them ourselves. Request one at <a href="https://reportaproblem.apple.com" rel="noopener">reportaproblem.apple.com</a> or follow <a href="${APPLE_REFUND_URL}" rel="noopener">Apple's refund steps</a>.`,
  },
  {
    question: 'Where is my progress stored? Will I lose it if I delete the app?',
    answer:
      'Your lessons, quiz results, streaks, Hangar and settings live on your iPhone, not on a server, because Planeology has no accounts. Deleting the app deletes them, and there is no way to bring them back. Your Boarding Pass is tied to your Apple Account, so it can always be restored.',
  },
  {
    question: 'How do I ask for my data to be deleted?',
    answer:
      `Use the support button on the Home screen: your request then comes with the random app ID that lets us find the little we hold (support messages, push registration and cancellation feedback, as the <a href="${ROUTES.privacy}">privacy policy</a> describes). You can also email ${CONTACT_EMAIL}. We reply within 30 days.`,
  },
  {
    question: 'The daily reminder is not arriving.',
    answer:
      'Reminders are scheduled on your iPhone at 19:00 local time for days you have not yet played. Check that notifications are allowed for Planeology in Settings, and that Focus modes are not silencing them. The app schedules a week ahead each time it opens.',
  },
  {
    question: 'I found a mistake in a lesson.',
    answer:
      'Please tell us. Every fact is checked against a listed source, but we would rather hear about a slip than leave it in. Send the lesson name and what looks wrong through the support chat or by email, and we will check it against the source and fix it in an update.',
  },
];
