/**
 * Vendor terms shown before a store application is submitted.
 *
 * ⚠️ PLACEHOLDER — NOT LEGAL ADVICE, NOT REVIEWED BY A LAWYER.
 *
 * These are plausible marketplace terms written to give the flow real content
 * and correct structure. They must be replaced with terms drafted or approved
 * by your legal counsel before launch. `VENDOR_TERMS_VERSION` is recorded with
 * each acceptance, so bump it whenever the wording changes materially — that's
 * what lets you prove which version a given vendor agreed to.
 */

export const VENDOR_TERMS_VERSION = '2026-08-draft-1';

export const VENDOR_TERMS_IS_PLACEHOLDER = true;

export interface TermsSection {
  heading: string;
  body: string[];
}

export const VENDOR_TERMS: TermsSection[] = [
  {
    heading: '1. Becoming a vendor',
    body: [
      'Submitting this application does not create a vendor account. Your store is reviewed by our team before it becomes visible to shoppers, and we may approve or decline any application at our discretion.',
      'You confirm that the business details and documents you provide are accurate and that you are authorised to sell the goods you list.',
    ],
  },
  {
    heading: '2. Commission',
    body: [
      'We charge a commission on the value of each completed sale. The standard rate is shown in your vendor dashboard and may be changed with reasonable notice.',
      'Commission is calculated when an order is delivered and invoiced periodically. Sales already recorded keep the rate they were charged at, so a rate change never applies retroactively.',
      'Invoices are payable within the window stated on the invoice. Persistent non-payment may result in your store being suspended.',
    ],
  },
  {
    heading: '3. Listings and pricing',
    body: [
      'You are responsible for the accuracy of your listings, including descriptions, images, prices and availability.',
      'You may not list counterfeit, stolen, unsafe, or otherwise prohibited goods. We may remove any listing that breaches these terms or applicable law.',
      'We may apply a platform-level price adjustment in limited circumstances, such as correcting an obvious pricing error.',
    ],
  },
  {
    heading: '4. Orders and fulfilment',
    body: [
      'You are responsible for fulfilling accepted orders promptly and for the condition of goods until they reach the customer.',
      'Repeated cancellations, late dispatch or unfulfilled orders may lead to your store being flagged, restricted or removed.',
      'You must respond to customer and support enquiries within a reasonable time.',
    ],
  },
  {
    heading: '5. Returns and refunds',
    body: [
      'You will honour returns and refunds where required by law or by the platform policy in force at the time of sale.',
      'Where a refund is issued, any commission charged on that sale is credited back to you.',
    ],
  },
  {
    heading: '6. Suspension and removal',
    body: [
      'We may suspend or remove a store that breaches these terms, harms customers, or exposes the platform to legal or reputational risk.',
      'Where circumstances allow, we will tell you why and give you an opportunity to put things right.',
      'You may close your store at any time. Obligations relating to orders already placed, and to commission already incurred, survive closure.',
    ],
  },
  {
    heading: '7. Your data',
    body: [
      'We process your business information to operate the marketplace, and customer information is shared with you only as needed to fulfil orders.',
      'You must not use customer data for any purpose other than fulfilling their order, and you must not sell or share it.',
    ],
  },
  {
    heading: '8. Changes to these terms',
    body: [
      'We may update these terms. If a change materially affects you, we will give notice and ask you to accept the updated version before continuing to sell.',
    ],
  },
];
