import type { Metadata } from "next";
import Link from "next/link";

/**
 * /legal/privacy — the Nurilang Privacy Policy.
 *
 * Server component: static long-form legal text, no client state. Every fact
 * asserted here was checked against the code (convex/schema.ts, convex/*.ts,
 * src/components/CallProvider.tsx, src/lib/geocode.ts, src/middleware.ts,
 * package.json). Anything that could not be verified from the repository —
 * legal entity, jurisdiction, addresses, retention windows, dates — is left as
 * a [BRACKETED PLACEHOLDER] rather than invented.
 *
 * The surrounding chrome (nav/footer) is expected from src/app/legal/layout.tsx.
 */

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Nurilang collects, uses, shares, and retains personal data — including account data, profile data, age assurance, messages, voice notes, call metadata, and safety reports.",
  alternates: { canonical: "/legal/privacy" },
};

/* ------------------------------- primitives ------------------------------- */

/** An unverifiable value that must be completed before publication. */
function Ph({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-0.5 inline-block rounded-md border border-amber/40 bg-amber/10 px-1.5 py-px align-baseline font-mono text-[0.82em] font-semibold uppercase tracking-wide text-amber">
      [{children}]
    </span>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-7 text-muted">{children}</p>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

/** A defined term, on first use. */
function Term({ children }: { children: React.ReactNode }) {
  return <dfn className="font-semibold not-italic text-ink">{children}</dfn>;
}

function List({ children, ordered = false }: { children: React.ReactNode; ordered?: boolean }) {
  const cls =
    "mt-1 space-y-2 pl-5 text-[15px] leading-7 text-muted marker:font-semibold marker:text-lime";
  return ordered ? (
    <ol className={`list-decimal ${cls}`}>{children}</ol>
  ) : (
    <ul className={`list-disc ${cls}`}>{children}</ul>
  );
}

function Section({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-10">
      <h2 className="headline text-2xl leading-tight sm:text-[2rem]">
        <span className="mr-3 tabular-nums text-lime">{n}.</span>
        {title}
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Clause({ n, title, children }: { n: string; title?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      {title ? (
        <h3 className="text-base font-semibold leading-snug text-ink">
          <span className="mr-2 tabular-nums font-normal text-muted">{n}</span>
          {title}
        </h3>
      ) : null}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="card border-violet/25 bg-violet/5 p-5">
      <div className="space-y-3 text-[15px] leading-7 text-muted">{children}</div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-raised-2/60">
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="border-b border-line px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="align-top">
              {cells.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 leading-6 text-muted ${
                    i < rows.length - 1 ? "border-b border-line" : ""
                  } ${j === 0 ? "font-semibold text-ink" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

const CONTENTS: { id: string; n: number; title: string }[] = [
  { id: "introduction", n: 1, title: "Introduction and scope" },
  { id: "definitions", n: 2, title: "Defined terms" },
  { id: "controller", n: 3, title: "Data controller and contact details" },
  { id: "service", n: 4, title: "The two layers of the Service" },
  { id: "categories", n: 5, title: "Categories of personal data we process" },
  { id: "not-collected", n: 6, title: "What we do not collect" },
  { id: "purposes", n: 7, title: "Purposes and legal bases" },
  { id: "dob", n: 8, title: "Date of birth and age assurance" },
  { id: "consent", n: 9, title: "Consent, opt-in and withdrawal" },
  { id: "recipients", n: 10, title: "Recipients, processors and sub-processors" },
  { id: "transfers", n: 11, title: "International transfers" },
  { id: "retention", n: 12, title: "Retention" },
  { id: "security", n: 13, title: "Security measures" },
  { id: "rights", n: 14, title: "Your rights and how to exercise them" },
  { id: "automated", n: 15, title: "Automated decision-making and profiling" },
  { id: "children", n: 16, title: "Children, minors and the 18+ policy" },
  { id: "breach", n: 17, title: "Personal data breach notification" },
  { id: "liability", n: 18, title: "Limitation of liability" },
  { id: "law", n: 19, title: "Governing law and jurisdiction" },
  { id: "changes", n: 20, title: "Changes to this Policy" },
  { id: "complaints", n: 21, title: "Contact and complaints" },
];

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      {/* ------------------------------- masthead ------------------------------ */}
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">
          Nurilang — Legal
        </p>
        <h1 className="headline mt-3 text-4xl leading-[1.05] sm:text-5xl">Privacy Policy</h1>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
          <div className="flex items-center gap-2">
            <dt className="font-semibold text-ink">Effective date:</dt>
            <dd>
              <Ph>EFFECTIVE DATE</Ph>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="font-semibold text-ink">Last updated:</dt>
            <dd>
              <Ph>LAST UPDATED DATE</Ph>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="font-semibold text-ink">Version:</dt>
            <dd>
              <Ph>VERSION NUMBER</Ph>
            </dd>
          </div>
        </dl>
        <p className="mt-7 text-base leading-7 text-muted">
          This Privacy Policy explains what personal data Nurilang collects, why we collect it, on
          what legal basis, who we share it with, how long we keep it, and what rights you have. It
          applies to the Nurilang website at{" "}
          <Strong>nurilang.app</Strong> and to the Nurilang application accessed through it.
        </p>
      </header>

      {/* ------------------------------- contents ------------------------------ */}
      <nav aria-labelledby="toc-heading" className="card mt-10 p-6">
        <h2 id="toc-heading" className="text-xs font-bold uppercase tracking-[0.22em] text-muted">
          Contents
        </h2>
        <ol className="mt-4 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
          {CONTENTS.map((c) => (
            <li key={c.id} className="text-sm leading-6">
              <a
                href={`#${c.id}`}
                className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-lime"
              >
                <span className="mr-2 tabular-nums text-lime">{c.n}.</span>
                {c.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12">
        {/* ------------------------------------------------------------------ 1 */}
        <Section id="introduction" n={1} title="Introduction and scope">
          <Clause n="1.1">
            <P>
              Nurilang is a language-learning service built on the Growing Participator Approach. It
              combines self-directed learning activities with optional community features that allow
              adult users to find one another, connect, exchange messages and voice notes, and hold
              one-to-one voice and video calls.
            </P>
          </Clause>
          <Clause n="1.2">
            <P>
              This Policy applies to all personal data processed by the Controller in connection with
              the Service. It does not apply to third-party websites, applications, or services that
              you may reach from the Service, which are governed by their own privacy notices.
            </P>
          </Clause>
          <Clause n="1.3">
            <P>
              Where this Policy refers to the General Data Protection Regulation (Regulation (EU)
              2016/679, the <Term>GDPR</Term>), those provisions apply to users located in the
              European Economic Area, and, as incorporated into domestic law, to users located in the
              United Kingdom. Users in other territories are afforded the substantive protections set
              out in this Policy as a matter of contract, subject to Section 19.
            </P>
          </Clause>
          <Clause n="1.4">
            <P>
              If you do not agree with this Policy, you must not use the Service. Where a specific
              processing activity depends on your consent, you may use the remainder of the Service
              without giving that consent, as described in Section 9.
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 2 */}
        <Section id="definitions" n={2} title="Defined terms">
          <P>
            In this Policy, capitalised terms have the following meanings. Terms defined in the GDPR
            and not otherwise defined here carry their GDPR meaning.
          </P>
          <List>
            <li>
              <Term>Controller</Term> means <Ph>LEGAL ENTITY NAME</Ph>, the entity identified in
              Section 3 that determines the purposes and means of processing.
            </li>
            <li>
              <Term>Service</Term> means the Nurilang website, application, and associated
              functionality, comprising the Learning Service and the Community Features.
            </li>
            <li>
              <Term>Learning Service</Term> means the individual learning functionality — picture
              cards, listening activities, vocabulary and speaking practice, phase progress, and the
              session tools — which does not require you to be discoverable by, or to communicate
              with, any other user.
            </li>
            <li>
              <Term>Community Features</Term> means discovery on the world map, connection requests,
              one-to-one text messaging, voice notes, and one-to-one voice and video calls.
            </li>
            <li>
              <Term>Connection</Term> means a relationship between two users created when one user
              sends a session request and the other accepts it. A Connection is required before
              messaging or calling is permitted.
            </li>
            <li>
              <Term>Grower</Term> means a user learning a language through the Service;{" "}
              <Term>Nurturer</Term> means a user supporting a Grower in a live session.
            </li>
            <li>
              <Term>Personal Data</Term>, <Term>Processing</Term>, <Term>Processor</Term>,{" "}
              <Term>Data Subject</Term>, and <Term>Supervisory Authority</Term> have the meanings
              given in Article 4 GDPR.
            </li>
            <li>
              <Term>Sub-processor</Term> means a processor engaged by the Controller, or by a
              processor on the Controller&rsquo;s behalf, to carry out processing activities on
              Personal Data.
            </li>
            <li>
              <Term>you</Term> and <Term>your</Term> mean the individual using the Service.
            </li>
          </List>
        </Section>

        {/* ------------------------------------------------------------------ 3 */}
        <Section id="controller" n={3} title="Data controller and contact details">
          <Clause n="3.1" title="Controller">
            <P>
              The controller of your Personal Data is <Ph>LEGAL ENTITY NAME</Ph>, a{" "}
              <Ph>ENTITY TYPE</Ph> registered in <Ph>JURISDICTION OF INCORPORATION</Ph> under company
              number <Ph>COMPANY REGISTRATION NUMBER</Ph>, whose registered address is{" "}
              <Ph>REGISTERED ADDRESS</Ph>.
            </P>
          </Clause>
          <Clause n="3.2" title="Privacy contact">
            <P>
              Privacy enquiries and data-subject requests should be sent to{" "}
              <Ph>PRIVACY CONTACT EMAIL</Ph>, marked for the attention of{" "}
              <Ph>PRIVACY CONTACT NAME OR ROLE</Ph>.
            </P>
          </Clause>
          <Clause n="3.3" title="Data protection officer">
            <P>
              <Ph>DPO STATUS — APPOINTED / NOT APPOINTED</Ph>. Where a data protection officer has
              been appointed, their contact details are <Ph>DPO NAME AND CONTACT DETAILS</Ph>. Where
              no data protection officer is required under Article 37 GDPR, privacy enquiries are
              handled by the contact named in clause 3.2.
            </P>
          </Clause>
          <Clause n="3.4" title="Representative">
            <P>
              Where required by Article 27 GDPR, our representative in the European Union is{" "}
              <Ph>EU REPRESENTATIVE NAME AND ADDRESS</Ph>, and our representative in the United
              Kingdom is <Ph>UK REPRESENTATIVE NAME AND ADDRESS</Ph>.
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 4 */}
        <Section id="service" n={4} title="The two layers of the Service">
          <Clause n="4.1" title="The Learning Service">
            <P>
              You may use the Learning Service without appearing to any other user. Learning activity
              does not place you on the world map, does not create a public profile, and does not
              expose you to messages or calls.
            </P>
          </Clause>
          <Clause n="4.2" title="The Community Features are opt-in and default-off">
            <P>
              Community Features are switched off by default. A new account is created with the
              language-exchange setting disabled, and you appear in another user&rsquo;s discovery
              results only if you have expressly enabled it in your profile. Disabling the setting
              removes you from other users&rsquo; discovery results.
            </P>
          </Clause>
          <Clause n="4.3" title="Connection required before contact">
            <P>
              Messaging and calling are enforced server-side against an accepted Connection. A user
              who is not connected to you cannot send you a message, a voice note, or a call, even if
              they can see you in discovery.
            </P>
          </Clause>
          <Clause n="4.4" title="Availability">
            <P>
              Community Features are additionally controlled by a server-side configuration flag. When
              that flag is not enabled for a deployment, discovery, messaging, and calling are
              unavailable and the associated processing described in this Policy does not occur.
              Current availability status: <Ph>COMMUNITY FEATURES AVAILABILITY STATEMENT</Ph>.
            </P>
          </Clause>
          <Clause n="4.5" title="Adults only">
            <P>
              Community Features are restricted to individuals aged 18 or over. See Sections 8 and 16.
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 5 */}
        <Section id="categories" n={5} title="Categories of personal data we process">
          <P>
            We process the categories of Personal Data set out below. Not every category applies to
            every user: categories 5.6 to 5.11 arise only if you enable and use the Community
            Features.
          </P>

          <Clause n="5.1" title="Account and authentication data">
            <P>
              Authentication is provided by Clerk. Clerk holds your sign-in credentials and issues the
              account identifier used throughout the Service. We process the account identifier, your
              email address, your account profile image where you have one, and the authentication
              state associated with your session. <Strong>We never see or store your password.</Strong>{" "}
              Your account identifier is treated as a server-side value: it is not disclosed to other
              users, who see only an opaque record reference.
            </P>
          </Clause>

          <Clause n="5.2" title="Profile data">
            <P>
              The profile you build in the Service, which may include: your display name; whether you
              act as a Grower, a Nurturer, or both; the language you are learning; the languages you
              already speak; the languages you can support others in; your learning phase and
              progress; your biography; your interests; your stated goals and the kind of exchange
              partner you are hoping to meet; your motivations for learning; your profile photograph;
              and any certifications recorded against your account.
            </P>
          </Clause>

          <Clause n="5.3" title="Date of birth">
            <P>
              Where age assurance is applied to Community Features, your date of birth is collected
              for that purpose only. This category is dealt with separately and in full in Section 8.
            </P>
          </Clause>

          <Clause n="5.4" title="Approximate location — city and country">
            <P>
              If you choose to provide them, we process the <Strong>city and country</Strong> you
              enter in your profile. We do not collect satellite, GPS, or device-level location data,
              and we do not derive your location from your IP address. Where you appear on the world
              map, you are placed at the geographic centre of the city you named, never at an exact
              address or device position. To convert a city name into map coordinates, your browser
              sends the city name — and nothing else about you — to the third-party geocoding service
              identified in Section 10, and caches the result locally so the lookup is not repeated.
            </P>
          </Clause>

          <Clause n="5.5" title="Learning and progress data">
            <P>
              Hours of listening recorded, words met, activities completed, phase and meeting
              progress, advancement checkpoints, streak information, bookings, and immersion
              preferences. Where the credit and marketplace functionality is enabled for your account,
              this also includes wallet balances and an append-only ledger of credit movements, each
              entry of which may record the counterparty, language, duration, and a short note.
            </P>
          </Clause>

          <Clause n="5.6" title="Text messages">
            <P>
              The content of one-to-one text messages you send and receive, together with the sender
              and recipient references, the sender&rsquo;s display name, the timestamp, and whether the
              message has been read. Message bodies are limited to 2,000 characters.{" "}
              <Strong>
                Message content is stored on our backend in a form we are technically able to read.
              </Strong>{" "}
              It is not end-to-end encrypted. We do not read message content routinely; we access it
              only where Section 7 provides a lawful basis to do so, in practice a safety
              investigation or a legal obligation.
            </P>
          </Clause>

          <Clause n="5.7" title="Voice notes">
            <P>
              <Strong>Voice notes are recorded and stored.</Strong> When you send a voice note, the
              audio file is uploaded to our backend file storage and retained there so that the
              recipient can play it back. We also store its duration, sender and recipient references,
              and timestamp. Voice notes must be between one second and five minutes long. Like text
              messages, voice notes are not end-to-end encrypted and are stored in a form we are
              technically able to access.
            </P>
          </Clause>

          <Clause n="5.8" title="Call set-up and signalling data">
            <P>
              One-to-one voice and video calls are carried peer-to-peer between the two
              participants&rsquo; browsers. <Strong>We do not record, store, or listen to call
              media.</Strong> We do, however, process the technical data required to establish the
              call, which is written to our backend:
            </P>
            <List>
              <li>
                the caller and recipient references, the caller&rsquo;s display name, the call status
                (ringing, active, declined, or ended), and the time the call was initiated;
              </li>
              <li>
                the session description exchanged between the two browsers to negotiate the call; and
              </li>
              <li>
                the network candidates exchanged between the two browsers to find a route between
                them.
              </li>
            </List>
            <P>
              <Strong>
                You should be aware that network candidates ordinarily contain IP addresses,
              </Strong>{" "}
              including your device&rsquo;s local network address and its public address as seen by
              the relay servers described in Section 10. These records are retained on our backend in
              accordance with Section 12. A fuller technical description of how calls work is set out
              in our{" "}
              <Link
                href="/legal/recording-consent"
                className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-lime"
              >
                Recording, Consent and Communications
              </Link>{" "}
              notice.
            </P>
          </Clause>

          <Clause n="5.9" title="Connection and interaction metadata">
            <P>
              Session requests you send or receive, including the display names of both parties, the
              language proposed, any short message you attach to the request, the status of the
              request, and the time it was made; the Connections that result; and, where group
              sessions are enabled for your account, the sessions you host or attend.
            </P>
          </Clause>

          <Clause n="5.10" title="Safety reports, blocks and moderation records">
            <P>
              If you block another user, we record that you have done so and when. If you submit a
              safety report, we record who reported whom, the category selected (harassment, hate,
              sexual content, spam, impersonation, dangerous behaviour, privacy, minor safety, or
              other), any free-text description you provide of up to 500 characters, the surface the
              report was made from, the report status, and the times it was created and last updated.
              Reports are visible only to authorised moderators on a fail-closed allowlist. They are
              never shown to the person reported and never appear in discovery.
            </P>
          </Clause>

          <Clause n="5.11" title="Waitlist and pre-release interest data">
            <P>
              If you join the early-access list, we process the email address you submit, any name you
              give, the language you express interest in, and the page the submission came from.
            </P>
          </Clause>

          <Clause n="5.12" title="Data held on your own device">
            <P>
              The Service caches your profile and progress in your browser&rsquo;s local storage so
              that the application works responsively. This data stays on your device. It is cleared
              when you sign out, and a signed-in account never inherits a cache belonging to a
              different account on the same browser. The geocoding cache described in clause 5.4 is
              also held locally.
            </P>
          </Clause>

          <Clause n="5.13" title="Technical and log data">
            <P>
              Our hosting and backend providers process technical data inherent in delivering an
              internet service, such as IP address, request metadata, user-agent string, and error
              logs. The retention and configuration of those logs is governed by the providers
              identified in Section 10 and by <Ph>LOG RETENTION CONFIGURATION</Ph>.
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 6 */}
        <Section id="not-collected" n={6} title="What we do not collect">
          <P>
            For the avoidance of doubt, and as verified against the current build of the Service:
          </P>
          <List>
            <li>
              <Strong>No analytics or advertising technology.</Strong> The Service contains no
              third-party analytics, product-telemetry, session-replay, advertising, or
              cross-site-tracking software, and no advertising cookies. We do not sell or share
              Personal Data for advertising purposes.
            </li>
            <li>
              <Strong>No call recording.</Strong> We do not record, retain, or process the audio or
              video content of one-to-one calls.
            </li>
            <li>
              <Strong>No precise location.</Strong> We do not collect GPS or device location, and we
              do not track your movements or infer a location trail.
            </li>
            <li>
              <Strong>No special category data is requested.</Strong> We do not ask for data revealing
              racial or ethnic origin, political opinions, religious or philosophical beliefs, trade
              union membership, genetic or biometric data, health data, or data concerning sex life or
              sexual orientation. You should not include such data in free-text fields, and you should
              be aware that anything you volunteer in a biography, message, or report is processed as
              you have written it.
            </li>
            <li>
              <Strong>No payment card data.</Strong> Where paid functionality is enabled, payment
              processing arrangements will be described at <Ph>PAYMENT PROCESSOR DISCLOSURE</Ph>. We
              do not store card numbers.
            </li>
          </List>
        </Section>

        {/* ------------------------------------------------------------------ 7 */}
        <Section id="purposes" n={7} title="Purposes and legal bases">
          <Clause n="7.1">
            <P>
              We process Personal Data only where a lawful basis under Article 6(1) GDPR applies. The
              table below sets out each purpose, the categories of data involved, and the basis relied
              on.
            </P>
          </Clause>

          <Table
            head={["Purpose", "Data categories", "Legal basis (Art. 6(1) GDPR)"]}
            rows={[
              [
                "Creating and maintaining your account; authenticating you",
                "5.1, 5.2",
                <>
                  Performance of a contract — Art. 6(1)(b)
                </>,
              ],
              [
                "Delivering the Learning Service and saving your progress across devices",
                "5.2, 5.5, 5.12",
                <>Performance of a contract — Art. 6(1)(b)</>,
              ],
              [
                "Placing you in discovery and showing your city-level location on the world map",
                "5.2, 5.4",
                <>
                  Consent — Art. 6(1)(a), given by enabling the language-exchange setting and
                  withdrawable at any time
                </>,
              ],
              [
                "Delivering connection requests, messages, voice notes, and calls between connected users",
                "5.6, 5.7, 5.8, 5.9",
                <>
                  Performance of a contract — Art. 6(1)(b), on the basis of the optional Community
                  Features you have chosen to enable
                </>,
              ],
              [
                "Age assurance for Community Features",
                "5.3",
                <>
                  Compliance with a legal obligation — Art. 6(1)(c) — and our legitimate interest in
                  keeping minors out of an adults-only social environment — Art. 6(1)(f)
                </>,
              ],
              [
                "Trust and safety: blocking, reporting, moderation, investigating abuse, enforcing our terms, and preventing recurrence",
                "5.1, 5.2, 5.6, 5.7, 5.8, 5.9, 5.10",
                <>
                  Legitimate interests — Art. 6(1)(f) — namely protecting users from harassment,
                  abuse, and unlawful conduct, and protecting the integrity of the Service
                </>,
              ],
              [
                "Rate limiting, abuse prevention, and platform security",
                "5.1, 5.6, 5.7, 5.8, 5.13",
                <>Legitimate interests — Art. 6(1)(f) — securing the Service against misuse</>,
              ],
              [
                "Responding to your support and data-subject requests",
                "5.1, 5.2, and the content of your request",
                <>
                  Compliance with a legal obligation — Art. 6(1)(c) — and legitimate interests — Art.
                  6(1)(f)
                </>,
              ],
              [
                "Sending early-access and launch communications",
                "5.11",
                <>Consent — Art. 6(1)(a), withdrawable at any time</>,
              ],
              [
                "Establishing, exercising, or defending legal claims; complying with lawful requests",
                "Any category, as strictly necessary",
                <>
                  Legal obligation — Art. 6(1)(c) — and legitimate interests — Art. 6(1)(f)
                </>,
              ],
            ]}
          />

          <Clause n="7.2" title="Legitimate interests assessment">
            <P>
              Where we rely on Article 6(1)(f), we have balanced our interests against your rights and
              freedoms. In summary: safety processing is limited to what is necessary to act on a
              report; report content is restricted to a small allowlisted group of moderators; reports
              are never disclosed to the person reported; and users retain the right to object under
              Article 21 GDPR as described in Section 14. You may request a summary of the relevant
              balancing test by contacting us at <Ph>PRIVACY CONTACT EMAIL</Ph>.
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 8 */}
        <Section id="dob" n={8} title="Date of birth and age assurance">
          <Callout>
            <p>
              <Strong>Purpose limitation.</Strong> Your date of birth is collected for one purpose
              only: to establish that you are aged 18 or over and therefore eligible to use the
              Community Features. It is not used for personalisation, for marketing, for
              recommendation, for segmentation, or for any other purpose whatsoever.
            </p>
          </Callout>

          <Clause n="8.1" title="When it is collected">
            <P>
              Your date of birth is requested at the point you seek access to the Community Features,
              not on general sign-up. You can use the Learning Service without providing it.
            </P>
            <P>
              <Ph>
                IMPLEMENTATION NOTE — CONFIRM THE DEPLOYED AGE-ASSURANCE MECHANISM, THE EXACT FIELDS
                STORED, AND THE POINT OF COLLECTION BEFORE THIS POLICY IS PUBLISHED
              </Ph>
            </P>
          </Clause>

          <Clause n="8.2" title="How it is evaluated">
            <P>
              Eligibility is determined <Strong>server-side</Strong>. The check cannot be bypassed by
              altering values in your browser, and a client that claims to be eligible without a
              server-side determination is refused.
            </P>
          </Clause>

          <Clause n="8.3" title="What is retained">
            <P>
              We retain <Ph>DATE OF BIRTH RETENTION FORM — FULL DATE OR DERIVED ELIGIBILITY FLAG</Ph>{" "}
              for <Ph>DATE OF BIRTH RETENTION PERIOD</Ph>. Retaining a record of the age determination
              is necessary so that we can demonstrate compliance with our adults-only rule and so that
              the check is not silently re-run in your favour.
            </P>
          </Clause>

          <Clause n="8.4" title="Who can see it">
            <P>
              Your date of birth is never displayed to other users, never included in discovery
              results, and never included in the data returned to another user&rsquo;s browser. It is
              accessible only to <Ph>ROLES AUTHORISED TO ACCESS AGE DATA</Ph>.
            </P>
          </Clause>

          <Clause n="8.5" title="Consequences of a failed or refused check">
            <P>
              If you decline to provide a date of birth, or the check does not establish that you are
              18 or over, Community Features remain unavailable to you. The Learning Service is
              unaffected. If you state an age below 18, Section 16 applies.
            </P>
          </Clause>

          <Clause n="8.6" title="Accuracy">
            <P>
              An age declaration is a self-report. It is a control, not a guarantee. If you believe a
              user is misrepresenting their age, report them using the minor-safety category described
              in clause 5.10.
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 9 */}
        <Section id="consent" n={9} title="Consent, opt-in and withdrawal">
          <Clause n="9.1" title="Consent is specific and separate">
            <P>
              Consent to appear in discovery is given by an affirmative act — enabling the
              language-exchange setting on your profile — and is separate from your agreement to this
              Policy or to our terms. It is never pre-ticked and never bundled with account creation.
            </P>
          </Clause>
          <Clause n="9.2" title="Withdrawal">
            <P>
              You may withdraw that consent at any time by disabling the setting. Withdrawal is as
              easy as giving consent. On withdrawal you cease to appear in other users&rsquo; discovery
              results.
            </P>
          </Clause>
          <Clause n="9.3" title="Effect of withdrawal">
            <P>
              Withdrawal does not affect the lawfulness of processing carried out before withdrawal.
              It does not, on its own, delete messages or voice notes already exchanged, or recall
              content already delivered to another user&rsquo;s device. To delete content or your
              account, see Section 14.
            </P>
          </Clause>
          <Clause n="9.4" title="Consent to recording is separate again">
            <P>
              Consent to record a live learning session is asked for separately, in-session, and is not
              retained between sessions. This is dealt with in the Recording, Consent and
              Communications notice.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 10 */}
        <Section id="recipients" n={10} title="Recipients, processors and sub-processors">
          <Clause n="10.1" title="Other users">
            <P>
              If you enable discovery, the following profile fields are made available to other
              signed-in, non-blocked users: your display name, role, the language you are learning,
              the languages you speak and can support, your learning phase, your city and country,
              your biography, your interests, your stated goals and ideal partner, hours logged, any
              certifications, and your profile photograph. Your email address, account identifier, and
              date of birth are never included. Other users address you through an opaque record
              reference, not an account identifier.
            </P>
          </Clause>

          <Clause n="10.2" title="Sub-processors and service providers">
            <P>
              We rely on the providers below. Each processes Personal Data on our documented
              instructions under a written agreement meeting the requirements of Article 28 GDPR, save
              where indicated otherwise.
            </P>
            <Table
              head={["Provider", "Function", "Data involved"]}
              rows={[
                [
                  "Clerk",
                  "Authentication and account management",
                  "Account identifiers, email address, credentials, profile image, session state",
                ],
                [
                  "Convex",
                  "Backend database, server functions, and file storage",
                  "All application data described in Section 5, including message content, stored voice-note audio, call signalling records, and safety reports",
                ],
                [
                  "Vercel",
                  "Application hosting and content delivery",
                  "Request and technical data described in clause 5.13",
                ],
                [
                  <>
                    TURN relay provider — <Ph>TURN PROVIDER NAME</Ph>
                  </>,
                  "Relaying encrypted call media where a direct peer-to-peer connection cannot be established",
                  "Network addresses of the participants and encrypted media packets in transit. The relay carries encrypted media only; it does not hold the keys to the call and does not store the media.",
                ],
                [
                  "Google public STUN servers",
                  "Discovering the public network address of your device so a direct call route can be found",
                  "Your device's network address. This is an unauthenticated public internet service and is a recipient rather than a contracted processor.",
                ],
                [
                  "Open-Meteo geocoding API",
                  "Converting a city name into map coordinates, called directly from your browser",
                  "The city name only. No account identifier, email address, or other profile field is sent.",
                ],
              ]}
            />
            <P>
              The TURN relay is configured by deployment. Unless a dedicated relay is configured, the
              Service falls back to the free Open Relay Project service operated by Metered. The
              provider in effect for this deployment is <Ph>TURN PROVIDER IN EFFECT</Ph>, and the
              current list of sub-processors is maintained at <Ph>SUB-PROCESSOR LIST URL</Ph>.
            </P>
            <P>
              Typefaces are self-hosted and served from our own origin; no font request is made to a
              third party while you use the Service.
            </P>
          </Clause>

          <Clause n="10.3" title="Other disclosures">
            <P>We may also disclose Personal Data:</P>
            <List>
              <li>
                to professional advisers — lawyers, auditors, insurers — where necessary and under a
                duty of confidentiality;
              </li>
              <li>
                to law enforcement, regulators, or courts where we are legally compelled to do so, or
                where disclosure is necessary to prevent or investigate a serious risk to a
                person&rsquo;s life or safety;
              </li>
              <li>
                to an acquirer or successor in the context of a merger, acquisition, or transfer of
                assets, subject to this Policy continuing to apply to the transferred data.
              </li>
            </List>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 11 */}
        <Section id="transfers" n={11} title="International transfers">
          <Clause n="11.1">
            <P>
              Our providers operate global infrastructure. Personal Data may therefore be transferred
              to, stored in, or accessed from countries outside the European Economic Area and the
              United Kingdom, including <Ph>TRANSFER DESTINATION COUNTRIES</Ph>.
            </P>
          </Clause>
          <Clause n="11.2">
            <P>
              Where a transfer is made to a country without an adequacy decision under Article 45
              GDPR, we rely on the Standard Contractual Clauses adopted by the European Commission
              (Implementing Decision (EU) 2021/914) and, for the United Kingdom, the UK International
              Data Transfer Addendum, together with any supplementary technical and organisational
              measures identified by a transfer impact assessment.
            </P>
          </Clause>
          <Clause n="11.3">
            <P>
              A call between two users routes directly between the participants&rsquo; devices wherever
              possible. Where a relay is required, media transits the relay infrastructure identified
              in clause 10.2, which may be located outside your country. The relay carries encrypted
              packets and does not hold the keys required to decrypt them.
            </P>
          </Clause>
          <Clause n="11.4">
            <P>
              You may request a copy of the safeguards applied to a transfer, with commercially
              confidential terms redacted, by writing to <Ph>PRIVACY CONTACT EMAIL</Ph>. The primary
              data hosting region for this deployment is <Ph>PRIMARY HOSTING REGION</Ph>.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 12 */}
        <Section id="retention" n={12} title="Retention">
          <Clause n="12.1">
            <P>
              We keep Personal Data only for as long as necessary for the purposes set out in Section
              7, and thereafter for any period required by law or necessary for the establishment,
              exercise, or defence of legal claims.
            </P>
          </Clause>

          <Table
            head={["Data", "Retention period", "Trigger"]}
            rows={[
              [
                "Account and profile data",
                <Ph>ACCOUNT RETENTION PERIOD</Ph>,
                "Deleted following account closure, subject to clause 12.3",
              ],
              [
                "Date of birth or derived eligibility record",
                <Ph>DATE OF BIRTH RETENTION PERIOD</Ph>,
                "Retained while the account is active and for the compliance period thereafter",
              ],
              [
                "Learning and progress data",
                <Ph>PROGRESS DATA RETENTION PERIOD</Ph>,
                "Deleted following account closure",
              ],
              [
                "Text messages",
                <Ph>MESSAGE RETENTION PERIOD</Ph>,
                "Retained for the life of the conversation unless deleted earlier",
              ],
              [
                "Voice-note audio files",
                <Ph>VOICE NOTE RETENTION PERIOD</Ph>,
                "Retained in file storage for the life of the conversation unless deleted earlier",
              ],
              [
                "Call signalling records and network candidates",
                <Ph>CALL SIGNALLING RETENTION PERIOD</Ph>,
                "Written when a call is set up; retained for the period stated",
              ],
              [
                "Connection requests and Connections",
                <Ph>CONNECTION RETENTION PERIOD</Ph>,
                "Retained while the relationship exists and for the period stated thereafter",
              ],
              [
                "Blocks",
                <Ph>BLOCK RETENTION PERIOD</Ph>,
                "Retained for as long as the block is in force; see clause 12.3",
              ],
              [
                "Safety reports and moderation records",
                <Ph>SAFETY REPORT RETENTION PERIOD</Ph>,
                "Retained after closure of the report so that repeat conduct can be identified",
              ],
              [
                "Waitlist entries",
                <Ph>WAITLIST RETENTION PERIOD</Ph>,
                "Deleted on withdrawal of consent or at the end of the period stated",
              ],
              [
                "Provider infrastructure logs",
                <Ph>LOG RETENTION PERIOD</Ph>,
                "Governed by the providers named in clause 10.2",
              ],
            ]}
          />

          <Clause n="12.2" title="Deletion is not always instantaneous">
            <P>
              Deleted records may persist for a limited period in encrypted backups and in provider
              replication systems before being overwritten in the ordinary course. During that period
              the data is not available in the Service.
            </P>
          </Clause>

          <Clause n="12.3" title="Safety retention">
            <P>
              Where a record is necessary to enforce a block, to investigate or substantiate a safety
              report, to comply with a legal obligation, or to defend a legal claim, we retain it for
              the period necessary for that purpose even where the underlying account has been closed.
              This is explained further in the Recording, Consent and Communications notice.
            </P>
          </Clause>

          <Clause n="12.4" title="Automation">
            <P>
              <Ph>
                IMPLEMENTATION NOTE — CONFIRM WHICH RETENTION PERIODS ARE ENFORCED AUTOMATICALLY AND
                WHICH ARE APPLIED BY OPERATIONAL PROCESS BEFORE PUBLICATION
              </Ph>
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 13 */}
        <Section id="security" n={13} title="Security measures">
          <Clause n="13.1">
            <P>
              We implement technical and organisational measures appropriate to the risk, as required
              by Article 32 GDPR. The measures currently implemented in the Service include:
            </P>
            <List>
              <li>
                <Strong>Encryption in transit.</Strong> All traffic between your browser and our
                systems is served over HTTPS. Call media is encrypted by the browser between the two
                participants under the WebRTC security model.
              </li>
              <li>
                <Strong>Delegated credential handling.</Strong> Authentication is delegated to a
                specialist provider; we do not hold your password.
              </li>
              <li>
                <Strong>Server-side authorisation.</Strong> Every backend function that touches
                another person&rsquo;s data verifies the caller&rsquo;s identity, that a Connection
                exists where one is required, and that neither party has blocked the other.
                Authorisation is never inferred from a value supplied by the browser.
              </li>
              <li>
                <Strong>Identifier minimisation.</Strong> Account identifiers are resolved server-side
                and are never disclosed to other users, who address one another through opaque record
                references.
              </li>
              <li>
                <Strong>Fail-closed moderation access.</Strong> The moderation queue is restricted to
                an explicit allowlist; if the allowlist cannot be evaluated, access is denied rather
                than granted.
              </li>
              <li>
                <Strong>Rate limiting and input bounds.</Strong> Messages, voice notes, calls, and
                reports are subject to rate limits and size limits to constrain abuse and resource
                exhaustion.
              </li>
              <li>
                <Strong>Default-off community surfaces.</Strong> Discovery, messaging, and calling are
                disabled unless expressly enabled at deployment level and, separately, by you.
              </li>
            </List>
          </Clause>
          <Clause n="13.2" title="Organisational measures">
            <P>
              Access control, staff confidentiality obligations, onboarding and offboarding procedures,
              logging and review, and periodic security testing are described at{" "}
              <Ph>SECURITY PROGRAMME REFERENCE</Ph>.
            </P>
          </Clause>
          <Clause n="13.3" title="No absolute guarantee">
            <P>
              No internet service can be guaranteed secure. Message and voice-note content is stored in
              a form we are able to access and should not be used for information you would not want
              disclosed in the event of a compromise or a lawful request.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 14 */}
        <Section id="rights" n={14} title="Your rights and how to exercise them">
          <Clause n="14.1" title="Your rights">
            <P>
              Subject to the conditions and exemptions in applicable law, you have the following
              rights:
            </P>
            <List>
              <li>
                <Strong>Access</Strong> — Article 15 — to obtain confirmation of whether we process
                your Personal Data and, if so, a copy of it and the information set out in that
                Article.
              </li>
              <li>
                <Strong>Rectification</Strong> — Article 16 — to have inaccurate data corrected and
                incomplete data completed. Most profile fields can be corrected directly in the
                Service.
              </li>
              <li>
                <Strong>Erasure</Strong> — Article 17 — to have your data deleted where one of the
                grounds in that Article applies. Erasure is subject to the safety and legal retention
                described in clause 12.3 and Section 16.
              </li>
              <li>
                <Strong>Restriction</Strong> — Article 18 — to have processing restricted in the
                circumstances set out in that Article.
              </li>
              <li>
                <Strong>Portability</Strong> — Article 20 — to receive the data you provided to us,
                and data generated by your use of the Service that we process by automated means on
                the basis of consent or contract, in a structured, commonly used, machine-readable
                format, and to have it transmitted to another controller where technically feasible.
              </li>
              <li>
                <Strong>Objection</Strong> — Article 21 — to object at any time, on grounds relating
                to your particular situation, to processing based on our legitimate interests. We will
                stop unless we demonstrate compelling legitimate grounds that override your interests,
                rights, and freedoms, or the processing is for the establishment, exercise, or defence
                of legal claims.
              </li>
              <li>
                <Strong>Withdrawal of consent</Strong> — Article 7(3) — to withdraw consent at any
                time, without affecting the lawfulness of processing before withdrawal.
              </li>
              <li>
                <Strong>Complaint</Strong> — Article 77 — to lodge a complaint with a Supervisory
                Authority, as described in Section 21.
              </li>
            </List>
          </Clause>

          <Clause n="14.2" title="How to exercise them">
            <P>
              Several rights can be exercised directly in the Service: you can edit profile fields, turn
              discovery off, block a user, and report a user without contacting us. For access,
              portability, erasure, restriction, or objection, write to <Ph>PRIVACY CONTACT EMAIL</Ph>{" "}
              from the email address associated with your account, stating the right you wish to
              exercise and the data concerned.
            </P>
          </Clause>

          <Clause n="14.3" title="Verification">
            <P>
              We will take reasonable steps to verify your identity before acting, so that we do not
              disclose one person&rsquo;s data to another. Where we cannot verify you from your
              request, we may ask for further information, limited to what is necessary for
              verification.
            </P>
          </Clause>

          <Clause n="14.4" title="Timescales and cost">
            <P>
              We respond without undue delay and in any event within one month of receipt, extendable
              by a further two months where the request is complex or numerous, in which case we will
              tell you within the first month. Requests are free of charge unless manifestly unfounded
              or excessive, in which case we may charge a reasonable fee or refuse to act, giving
              reasons.
            </P>
          </Clause>

          <Clause n="14.5" title="Third-party data in a request">
            <P>
              A conversation involves two people. When responding to an access or portability request,
              we may redact or withhold content authored by another user where disclosure would
              adversely affect their rights and freedoms.
            </P>
          </Clause>

          <Clause n="14.6" title="Account closure">
            <P>
              To close your account and request deletion of the associated data, follow the process at{" "}
              <Ph>ACCOUNT DELETION PROCESS OR URL</Ph>, or write to <Ph>PRIVACY CONTACT EMAIL</Ph>.
              Closure is subject to clause 12.3.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 15 */}
        <Section id="automated" n={15} title="Automated decision-making and profiling">
          <Clause n="15.1">
            <P>
              We do not carry out automated decision-making producing legal effects concerning you or
              similarly significantly affecting you within the meaning of Article 22 GDPR.
            </P>
          </Clause>
          <Clause n="15.2">
            <P>
              Automated rules are applied to eligibility for Community Features, to rate limiting, and
              to the suppression of blocked users. Where an automated control restricts your access,
              you may contest it by writing to <Ph>PRIVACY CONTACT EMAIL</Ph>, and a person will review
              the decision.
            </P>
          </Clause>
          <Clause n="15.3">
            <P>
              Moderation decisions arising from a safety report are taken by a human reviewer, not by
              an automated system.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 16 */}
        <Section id="children" n={16} title="Children, minors and the 18+ policy">
          <Callout>
            <p>
              <Strong>
                The Community Features of Nurilang are for adults aged 18 and over only.
              </Strong>{" "}
              A user under 18 may not appear in discovery, may not send or receive connection requests,
              may not message any other user, may not send or receive voice notes, and may not place or
              receive calls.
            </p>
          </Callout>

          <Clause n="16.1" title="The Learning Service">
            <P>
              The Learning Service may be used by people under 18 where permitted by our terms and by
              applicable law, and where any parental or guardian consent required in your jurisdiction
              has been given. Using the Learning Service does not expose a user to any other user.
            </P>
            <P>
              The minimum age for the Learning Service in your territory is{" "}
              <Ph>MINIMUM AGE FOR THE LEARNING SERVICE</Ph>, and the age of digital consent applied
              under Article 8 GDPR is <Ph>AGE OF DIGITAL CONSENT APPLIED</Ph>.
            </P>
          </Clause>

          <Clause n="16.2" title="If we discover an under-18 account with community access">
            <P>
              Where we learn, by report, by review, or otherwise, that a user with access to Community
              Features is under 18, we will:
            </P>
            <List ordered>
              <li>
                suspend that user&rsquo;s access to all Community Features immediately, removing them
                from discovery and preventing further messages and calls;
              </li>
              <li>
                where the circumstances warrant it, suspend the account in full pending review;
              </li>
              <li>
                delete the Personal Data collected through the Community Features — profile fields
                published to other users, messages, voice notes, and call signalling records — except
                for the minimum necessary to enforce the suspension, to comply with a legal
                obligation, or to support a safety investigation or report to the competent
                authorities;
              </li>
              <li>
                notify the account holder at the email address on file and, where required and
                practicable, a parent or guardian; and
              </li>
              <li>
                where the report concerns the safety of a minor, escalate it in accordance with{" "}
                <Ph>MINOR SAFETY ESCALATION AND REPORTING PROCEDURE</Ph>, which may include reporting
                to law enforcement or to the competent child-protection authority.
              </li>
            </List>
          </Clause>

          <Clause n="16.3" title="Reporting a suspected minor">
            <P>
              If you believe a user is under 18, report them using the minor-safety category. Reports
              in that category are treated as a priority. You may also write to{" "}
              <Ph>SAFETY CONTACT EMAIL</Ph>.
            </P>
          </Clause>

          <Clause n="16.4" title="Parents and guardians">
            <P>
              A parent or guardian who believes their child has created an account or supplied Personal
              Data may contact <Ph>PRIVACY CONTACT EMAIL</Ph> to request its deletion. We will act
              without undue delay once we have verified the request.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 17 */}
        <Section id="breach" n={17} title="Personal data breach notification">
          <Clause n="17.1">
            <P>
              We maintain procedures to detect, investigate, record, and respond to personal data
              breaches, and we keep an internal record of every breach as required by Article 33(5)
              GDPR.
            </P>
          </Clause>
          <Clause n="17.2">
            <P>
              Where a breach is likely to result in a risk to the rights and freedoms of natural
              persons, we will notify the competent Supervisory Authority without undue delay and,
              where feasible, within 72 hours of becoming aware of it, in accordance with Article 33
              GDPR.
            </P>
          </Clause>
          <Clause n="17.3">
            <P>
              Where a breach is likely to result in a <Strong>high</Strong> risk to your rights and
              freedoms, we will inform you without undue delay in accordance with Article 34 GDPR,
              describing the nature of the breach, the likely consequences, the measures taken, and the
              contact point for further information. Notice will be sent to the email address on your
              account or, where individual notice would involve disproportionate effort, by public
              communication on <Strong>nurilang.app</Strong>.
            </P>
          </Clause>
          <Clause n="17.4">
            <P>
              Where a breach occurs at a processor, that processor is contractually required to notify
              us without undue delay so that we can meet the deadlines above.
            </P>
          </Clause>
          <Clause n="17.5">
            <P>
              Our breach response procedure and named incident owner are recorded at{" "}
              <Ph>INCIDENT RESPONSE PROCEDURE REFERENCE</Ph>.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 18 */}
        <Section id="liability" n={18} title="Limitation of liability">
          <Clause n="18.1">
            <P>
              Nothing in this Policy limits or excludes any liability that cannot lawfully be limited
              or excluded, including liability for death or personal injury caused by negligence, for
              fraud or fraudulent misrepresentation, or any right or remedy you have under applicable
              data protection law, which is unaffected by this Section.
            </P>
          </Clause>
          <Clause n="18.2">
            <P>
              Subject to clause 18.1, the Controller&rsquo;s liability arising out of or in connection
              with the Service is limited as set out in the Nurilang Terms of Service at{" "}
              <Ph>TERMS OF SERVICE URL</Ph>, and in particular the aggregate liability cap of{" "}
              <Ph>LIABILITY CAP</Ph> and the exclusion of indirect and consequential loss set out at{" "}
              <Ph>TERMS OF SERVICE LIABILITY CLAUSE REFERENCE</Ph>.
            </P>
          </Clause>
          <Clause n="18.3">
            <P>
              Subject to clause 18.1, we are not liable for the acts or omissions of other users,
              including any unlawful recording, redistribution, or misuse by another user of content
              you share with them. Section 5 of the Recording, Consent and Communications notice sets
              out the rules that bind users and the practical limits of our ability to enforce them.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 19 */}
        <Section id="law" n={19} title="Governing law and jurisdiction">
          <Clause n="19.1">
            <P>
              This Policy and any dispute arising out of or in connection with it are governed by the
              law of <Ph>GOVERNING LAW JURISDICTION</Ph>, without regard to its conflict-of-laws rules.
            </P>
          </Clause>
          <Clause n="19.2">
            <P>
              The courts of <Ph>COURTS OF EXCLUSIVE OR NON-EXCLUSIVE JURISDICTION</Ph> have{" "}
              <Ph>EXCLUSIVE OR NON-EXCLUSIVE</Ph> jurisdiction to settle any such dispute.
            </P>
          </Clause>
          <Clause n="19.3">
            <P>
              Clauses 19.1 and 19.2 do not deprive a consumer of the protection of the mandatory rules
              of the law of their country of habitual residence, nor of the right to bring proceedings
              in the courts of that country where applicable law so provides, nor of the rights and
              remedies conferred by applicable data protection law.
            </P>
          </Clause>
          <Clause n="19.4" title="Regional supplements">
            <P>
              Supplementary disclosures for specific territories — including any notice required for
              residents of California under the California Consumer Privacy Act, and any notice
              required in <Ph>OTHER TERRITORIES REQUIRING SUPPLEMENTAL DISCLOSURE</Ph> — are set out at{" "}
              <Ph>REGIONAL SUPPLEMENT URL OR ANNEX REFERENCE</Ph>. Where a supplement conflicts with
              the body of this Policy, the supplement prevails for residents of that territory.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 20 */}
        <Section id="changes" n={20} title="Changes to this Policy">
          <Clause n="20.1">
            <P>
              We may amend this Policy from time to time. The version in force is the one published on
              this page, identified by the version number and the last-updated date at the top.
            </P>
          </Clause>
          <Clause n="20.2">
            <P>
              Where a change materially affects your rights or the way your Personal Data is used, we
              will give you notice by email or by prominent notice in the Service at least{" "}
              <Ph>MATERIAL CHANGE NOTICE PERIOD</Ph> before it takes effect. Where the change requires
              your consent, we will ask for it before relying on it.
            </P>
          </Clause>
          <Clause n="20.3">
            <P>
              Previous versions are available on request from <Ph>PRIVACY CONTACT EMAIL</Ph>.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 21 */}
        <Section id="complaints" n={21} title="Contact and complaints">
          <Clause n="21.1" title="Contact us first">
            <P>
              If you have a concern about how we handle your Personal Data, please raise it with us at{" "}
              <Ph>PRIVACY CONTACT EMAIL</Ph>. We aim to acknowledge within{" "}
              <Ph>ACKNOWLEDGEMENT TARGET</Ph> and to resolve within <Ph>RESOLUTION TARGET</Ph>.
            </P>
          </Clause>
          <Clause n="21.2" title="Safety concerns">
            <P>
              Reports of harassment, abuse, or risk to a person&rsquo;s safety should be made through
              the in-product reporting tool, which routes to the moderation queue, or, in urgent cases,
              to <Ph>SAFETY CONTACT EMAIL</Ph>. If someone is in immediate danger, contact your local
              emergency services first.
            </P>
          </Clause>
          <Clause n="21.3" title="Supervisory authority">
            <P>
              You have the right to lodge a complaint with a Supervisory Authority, in particular in
              the Member State of your habitual residence, place of work, or the place of the alleged
              infringement. Our lead Supervisory Authority is{" "}
              <Ph>LEAD SUPERVISORY AUTHORITY AND CONTACT DETAILS</Ph>. Users in the United Kingdom may
              complain to the Information Commissioner&rsquo;s Office. Exercising this right does not
              require you to contact us first.
            </P>
          </Clause>
          <Clause n="21.4" title="Related notices">
            <P>
              This Policy should be read together with the{" "}
              <Link
                href="/legal/recording-consent"
                className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-lime"
              >
                Recording, Consent and Communications
              </Link>{" "}
              notice, which describes how calls work and what is and is not stored, and with the
              Nurilang Terms of Service at <Ph>TERMS OF SERVICE URL</Ph>.
            </P>
          </Clause>
        </Section>
      </div>

      <footer className="mt-14 border-t border-line pt-6">
        <p className="text-xs leading-6 text-muted">
          Bracketed text marks a value that must be completed by the operator before this document is
          relied on. This page describes the Service as implemented at the date stated above.
        </p>
      </footer>
    </article>
  );
}
