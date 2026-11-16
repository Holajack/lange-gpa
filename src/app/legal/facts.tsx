/**
 * The facts every legal page repeats — who operates Nurilang, how to reach
 * them, and the handful of values the documents share. Change them here,
 * once, and all four pages follow. Bump EFFECTIVE_DATE and VERSION whenever
 * the wording of any page changes.
 */

/** The person who operates Nurilang. Nurilang is not a company. */
export const OPERATOR_NAME = "Jacken Holland";
export const POSTAL_ADDRESS = "2570 Jasmine Road, Port Orange, Florida 32128, United States";

/** One monitored inbox for every kind of enquiry, for now. */
export const CONTACT_EMAIL = "marketmindsj@gmail.com";

export const EFFECTIVE_DATE = "16 November 2026";
export const VERSION = "1.0";

export const GOVERNING_LAW = "the State of Florida, United States";
/** Completes the sentence "The courts of … have exclusive jurisdiction". */
export const COURTS =
  "the State of Florida sitting in Volusia County, and the United States District Court for the Middle District of Florida,";

/** Stated in full in Section 14 of the Terms; the other pages refer to it. */
export const LIABILITY_CAP =
  "the greater of (a) the total amount you paid us for the Service in the twelve months before the event giving rise to the claim and (b) one hundred US dollars (USD 100)";

export function Email() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-lime"
    >
      {CONTACT_EMAIL}
    </a>
  );
}
