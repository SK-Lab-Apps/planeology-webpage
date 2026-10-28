/**
 * legal.ts — the Terms of Use as data, driven by the constants in src/config.ts.
 * The privacy policy is ported faithfully in src/pages/privacy.astro (its wording
 * was checked against the app's code on 2026-10-28, so it is not rewritten).
 */
import {
  APPLE_MANAGE_SUBSCRIPTIONS_URL,
  APPLE_REFUND_URL,
  APPLE_STANDARD_EULA_URL,
  CONTACT_EMAIL,
  DOMAIN,
  GOVERNING_LAW,
  LEGAL_UPDATED,
  NOUNS,
  PUBLISHER,
  SITE_NAME,
  STORE_NAME,
} from '@/config';

export type LegalBlock = { p: string } | { list: string[] } | { email: string };
export type LegalSection = { id: string; heading: string; blocks: LegalBlock[] };

const governingLawClause = GOVERNING_LAW
  ? `These Terms are governed by the laws of ${GOVERNING_LAW}, without regard to its conflict-of-law rules. Any dispute that cannot be settled informally will be brought in the courts of that jurisdiction, except where the law of the country you live in gives you the right to bring it at home.`
  : `These Terms are governed by the laws of the jurisdiction in which the publisher is established, without regard to its conflict-of-law rules. Any dispute that cannot be settled informally will be brought in the courts of that jurisdiction, except where the law of the country you live in gives you the right to bring it at home.`;

export const terms = {
  title: 'Terms of Use',
  updated: LEGAL_UPDATED,
  intro: `These Terms of Use cover the ${STORE_NAME} app for iPhone (the "app") and this website at ${DOMAIN.replace('https://', '')} (the "site"). By downloading or using the app, or by using the site, you agree to them. Please read them together with our Privacy Policy, which explains what information the app collects and why.`,
  sections: [
    {
      id: 'publisher',
      heading: 'Who publishes Planeology',
      blocks: [
        { p: `${SITE_NAME} is published by ${PUBLISHER} ("we", "us"), an independent developer. You can reach us through the support button on the app's Home screen or by email:` },
        { email: CONTACT_EMAIL },
      ],
    },
    {
      id: 'what-it-is',
      heading: 'What the app is, and what it is not',
      blocks: [
        { p: `${SITE_NAME} is enthusiast education: short lessons, quizzes, a daily challenge and a collection of aircraft fact cards about how flight works, aviation history, airliners, military aviation and airports. It is made for curious people who enjoy aviation.` },
        { p: `It is not flight training, ground instruction, exam preparation or professional advice of any kind, and nothing in it is written for operational use. Do not rely on the app to fly, maintain or operate anything, or to make safety, medical or legal decisions.` },
        { p: `We check every number, date and record against official sources and list those sources in each lesson, but we cannot guarantee that the content is complete, current or free of error. Aviation changes, sources sometimes disagree, and we fix mistakes when we learn of them.` },
      ],
    },
    {
      id: 'boarding-pass',
      heading: `The ${NOUNS.pass}: subscriptions and the lifetime purchase`,
      blocks: [
        { p: `The app's lessons are unlocked with a ${NOUNS.pass}: a monthly or yearly subscription, or a one-time lifetime purchase. The price of each plan is shown in the app before you buy. Payment is charged to your Apple Account when you confirm the purchase, and Apple, not us, handles the transaction.` },
        { p: `Subscriptions renew automatically unless they are canceled at least 24 hours before the end of the current period. You can manage or cancel a subscription at any time in your Apple Account settings; canceling stops the next renewal and you keep access until the paid period ends. Apple's instructions for managing subscriptions are at ${APPLE_MANAGE_SUBSCRIPTIONS_URL}. The lifetime purchase is not a subscription and never renews.` },
        { p: `Refunds are decided and issued by Apple under the App Store's rules, and requests go to Apple (${APPLE_REFUND_URL}). We cannot process payments or refunds ourselves. Purchases can be restored on any iPhone signed in to the same Apple Account.` },
        { p: `We may change plans and prices for the future. A change never affects a period you have already paid for, and you will always see the current price before any new purchase.` },
      ],
    },
    {
      id: 'licence',
      heading: 'Your licence to use the app',
      blocks: [
        { p: `The iOS app is licensed, not sold, to you under Apple's Licensed Application End User License Agreement (the "Standard EULA"), available at ${APPLE_STANDARD_EULA_URL}. These Terms cover everything the Standard EULA does not, including the ${NOUNS.pass}, the site and the content. If the two conflict, the Standard EULA governs the licence to the app itself.` },
        { p: `Within that licence, you may use the app on iPhones you own or control, for your personal, non-commercial enjoyment.` },
      ],
    },
    {
      id: 'intellectual-property',
      heading: 'Intellectual property',
      blocks: [
        { p: `The lessons, quizzes, fact cards, illustrations, aircraft art, the ${NOUNS.collection} and the words on this site were written and drawn for ${SITE_NAME}, and we own them. You may read them, learn from them and quote short passages with credit, but you may not copy, republish, sell or build a product on them without our written permission.` },
        { p: `Aircraft, airline and manufacturer names and designations in the lessons belong to their respective owners. They appear because that is what the aircraft are called. ${SITE_NAME} is not affiliated with, sponsored by or endorsed by any airline, aircraft manufacturer or aviation authority.` },
        { p: `Apple, iPhone and App Store are trademarks of Apple Inc.` },
      ],
    },
    {
      id: 'acceptable-use',
      heading: 'Acceptable use',
      blocks: [
        { p: 'When using the app or the site, you agree not to:' },
        {
          list: [
            'scrape, crawl, download in bulk or otherwise extract the lessons, quizzes, fact cards or art, by hand or with software, or republish them anywhere;',
            'reverse-engineer, decompile or tamper with the app, or try to get around the Boarding Pass;',
            'use the support chat to harass, threaten or deceive the people who answer it, or to send unlawful or abusive content;',
            'use the app or the site for anything unlawful.',
          ],
        },
        { p: 'The support chat is there for help with the app. We may close conversations that misuse it.' },
      ],
    },
    {
      id: 'third-parties',
      heading: 'Third-party services',
      blocks: [
        { p: `The app relies on a small number of service providers to work: Apple for payments, and the providers of purchase management, analytics, crash reporting, our server and the support chat, which the Privacy Policy names. Each is bound by its own terms and privacy policy. The app and this site also link to outside sources such as NASA, the FAA and museums; we do not control those pages and are not responsible for their content.` },
      ],
    },
    {
      id: 'disclaimers',
      heading: 'Disclaimers',
      blocks: [
        { p: `The app and the site are provided "as is" and "as available". To the fullest extent the law allows, we make no warranties of any kind, express or implied, including that the content will be accurate, complete or current, that the app will be uninterrupted or error-free, or that it will meet your expectations. Nothing in these Terms limits rights that consumer law gives you and that cannot be excluded.` },
      ],
    },
    {
      id: 'liability',
      heading: 'Limitation of liability',
      blocks: [
        { p: `To the fullest extent the law allows, ${PUBLISHER} will not be liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of data, profits or goodwill, arising from your use of, or inability to use, the app or the site, or from any decision you make based on their content. Where liability cannot be excluded, it is limited to the amount you paid us for the ${NOUNS.pass} in the twelve months before the claim.` },
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to the app and these Terms',
      blocks: [
        { p: `We may add, change or remove lessons and features over time, and we may update these Terms. If a change to the Terms is significant, we will tell you in the app before it takes effect, and the date at the top of this page will change. Using the app after a change takes effect means you accept the updated Terms.` },
        { p: `We may end these Terms, and your access to the app, if you break them. You may end them at any time by deleting the app.` },
      ],
    },
    {
      id: 'governing-law',
      heading: 'Governing law',
      blocks: [{ p: governingLawClause }],
    },
    {
      id: 'contact',
      heading: 'Contact',
      blocks: [
        { p: `Questions about these Terms? Use the support button on the app's Home screen, or write to ${PUBLISHER} at:` },
        { email: CONTACT_EMAIL },
      ],
    },
  ] satisfies LegalSection[],
};
