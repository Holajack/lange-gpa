import type { Metadata } from "next";
import Link from "next/link";

/**
 * /legal/terms — Nurilang Terms of Service.
 *
 * A server component: no client state, no motion, so the whole document is in
 * the HTML for crawlers, printers, and readers with JS off. Chrome (header /
 * footer / back link) belongs to src/app/legal/layout.tsx; this file owns the
 * reading column only.
 *
 * Every factual statement about how the product behaves is drawn from the
 * code (convex/*.ts, src/components/CallProvider.tsx, src/lib/*), and anything
 * that cannot be established from the code is left as a [BRACKETED
 * PLACEHOLDER] for counsel to complete before publication.
 */

const title = "Terms of Service";
const description =
  "The agreement between you and Nurilang covering account eligibility, the learning service, the adults-only community features, acceptable use, liability, and termination.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/legal/terms" },
  openGraph: {
    type: "article",
    url: "/legal/terms",
    siteName: "Nurilang",
    title: `${title} | Nurilang`,
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: `${title} | Nurilang`,
    description,
  },
  robots: { index: true, follow: true },
};

/* ------------------------------- primitives ------------------------------- */

const SECTIONS: { id: string; n: number; title: string }[] = [
  { id: "acceptance", n: 1, title: "Acceptance and formation of the contract" },
  { id: "definitions", n: 2, title: "Defined terms" },
  { id: "eligibility", n: 3, title: "Eligibility and the 18+ requirement" },
  { id: "accounts", n: 4, title: "Accounts, registration and security" },
  { id: "service", n: 5, title: "The Service" },
  { id: "connections", n: 6, title: "The connection-consent model" },
  { id: "content", n: 7, title: "Your Content and the licence you grant" },
  { id: "acceptable-use", n: 8, title: "Acceptable use and the Conduct Rules" },
  { id: "safety", n: 9, title: "Safety, moderation and enforcement" },
  { id: "assumption-of-risk", n: 10, title: "Assumption of risk: live contact with other adults" },
  { id: "third-parties", n: 11, title: "Third-party services and infrastructure" },
  { id: "credits", n: 12, title: "Hours, credits and paid features" },
  { id: "disclaimers", n: 13, title: "Disclaimer of warranties" },
  { id: "liability", n: 14, title: "Limitation of liability" },
  { id: "indemnity", n: 15, title: "Indemnity" },
  { id: "termination", n: 16, title: "Suspension and termination" },
  { id: "disputes", n: 17, title: "Governing law and dispute resolution" },
  { id: "changes", n: 18, title: "Changes to these Terms" },
  { id: "general", n: 19, title: "General provisions" },
  { id: "contact", n: 20, title: "How to contact us" },
];

function Section({
  id,
  n,
  title: heading,
  children,
}: {
  id: string;
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 pt-12 first:pt-0">
      <h2
        id={`${id}-heading`}
        className="headline text-2xl leading-tight text-ink sm:text-3xl"
      >
        <span className="mr-2 text-violet-soft tabular-nums">{n}.</span>{" "}
        {heading}
      </h2>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

function Clause({
  n,
  title: heading,
  children,
}: {
  n: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[3rem_1fr] gap-x-2 sm:grid-cols-[3.75rem_1fr] sm:gap-x-4">
      <span
        className="pt-1 font-display text-sm font-bold tabular-nums text-violet-soft"
        aria-hidden
      >
        {n}
      </span>
      <div className="space-y-3">
        {heading && (
          // The number is rendered once, in the hanging column. Folding it into
          // the heading's accessible name keeps clause cross-references usable
          // when navigating by heading, without duplicating it in the copied or
          // printed text.
          <h3
            aria-label={`${n} ${heading}`}
            className="font-display text-base font-bold tracking-tight text-ink"
          >
            {heading}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-7 text-muted">{children}</p>;
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <ul className="ml-5 list-disc space-y-2 text-[15px] leading-7 text-muted marker:text-violet-soft">
      {children}
    </ul>
  );
}

function Term({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-line pl-4">
      <dt className="font-display text-sm font-bold text-ink">{term}</dt>
      <dd className="mt-1 text-[15px] leading-7 text-muted">{children}</dd>
    </div>
  );
}

function Callout({
  tone,
  label,
  children,
}: {
  tone: "coral" | "amber" | "lime";
  label: string;
  children: React.ReactNode;
}) {
  const skin = {
    coral: "border-coral/35 bg-coral/8",
    amber: "border-amber/35 bg-amber/8",
    lime: "border-lime/35 bg-lime/8",
  }[tone];
  const ink = { coral: "text-coral", amber: "text-amber", lime: "text-lime" }[tone];
  return (
    <aside className={`rounded-card border px-5 py-5 sm:px-6 ${skin}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${ink}`}>{label}</p>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-ink/85">{children}</div>
    </aside>
  );
}

/** Text the operator must complete before publication. */
function Ph({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[0.82em] font-semibold text-lemon">
      [{children}]
    </span>
  );
}

function Xref({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-ink">{children}</span>;
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-lime"
    >
      {children}
    </Link>
  );
}

/* ----------------------------------- page ---------------------------------- */

export default function TermsPage() {
  return (
    <article>
      {/* ───────────────────────── masthead ───────────────────────── */}
      <header id="top">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">
          Nurilang · Legal
        </p>
        <h1 className="headline mt-3 text-4xl leading-[1.05] sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted">
          These Terms of Service (the <strong className="text-ink">&ldquo;Terms&rdquo;</strong>)
          govern your access to and use of the Nurilang website at nurilang.app, the Nurilang
          application, and all related features and services (together, the{" "}
          <strong className="text-ink">&ldquo;Service&rdquo;</strong>). Please read them
          carefully. They contain provisions that limit our liability to you and that require
          you to accept certain risks, including in{" "}
          <Xref>Section 10</Xref> and <Xref>Section 14</Xref>.
        </p>

        <dl className="mt-8 grid gap-3 rounded-card border border-line bg-raised/60 px-5 py-5 text-sm sm:grid-cols-2 sm:px-6">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Effective date
            </dt>
            <dd className="mt-1.5 text-ink">
              <Ph>EFFECTIVE DATE</Ph>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Last updated
            </dt>
            <dd className="mt-1.5 text-ink">
              <Ph>LAST UPDATED DATE</Ph>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Provider of the Service
            </dt>
            <dd className="mt-1.5 leading-7 text-ink">
              <Ph>LEGAL ENTITY NAME</Ph>, a <Ph>ENTITY TYPE</Ph> registered in{" "}
              <Ph>JURISDICTION OF INCORPORATION</Ph> under company number{" "}
              <Ph>COMPANY REGISTRATION NUMBER</Ph>, with its registered office at{" "}
              <Ph>REGISTERED ADDRESS</Ph> (<strong>&ldquo;Nurilang&rdquo;</strong>,{" "}
              <strong>&ldquo;we&rdquo;</strong>, <strong>&ldquo;us&rdquo;</strong>,{" "}
              <strong>&ldquo;our&rdquo;</strong>).
            </dd>
          </div>
        </dl>
      </header>

      {/* ───────────────────────── 18+ notice ───────────────────────── */}
      <div className="mt-10">
        <Callout tone="coral" label="Adults only — 18+">
          <p>
            The Nurilang <strong>Community Features</strong> — appearing in discovery,
            connection requests, one-to-one text chat, voice notes, and voice and video calls
            with other users — are available <strong>only to people aged 18 or over</strong>.
          </p>
          <p>
            If you are under 18 you may use the learning parts of the Service where permitted
            under <Xref>Section 3</Xref>, but you must not access, attempt to access, or appear
            in any Community Feature. We may suspend or permanently terminate any account we
            believe belongs to a person under 18, or that has misrepresented its holder&rsquo;s
            age.
          </p>
        </Callout>
      </div>

      {/* ───────────────────────── contents ───────────────────────── */}
      <nav aria-labelledby="toc-heading" className="mt-12">
        <h2
          id="toc-heading"
          className="text-xs font-bold uppercase tracking-[0.22em] text-muted"
        >
          Contents
        </h2>
        <ol className="mt-4 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <li key={s.id} className="text-sm leading-6">
              <a
                href={`#${s.id}`}
                className="text-muted transition-colors hover:text-ink focus-visible:text-ink"
              >
                <span className="mr-2 tabular-nums text-violet-soft">{s.n}.</span>{" "}
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <hr className="mt-12 border-line" />

      {/* ═════════════════════════ 1 ═════════════════════════ */}
      <Section {...SECTIONS[0]}>
        <Clause n="1.1" title="A binding agreement">
          <P>
            These Terms form a legally binding contract between you and Nurilang. By creating an
            account, signing in, or otherwise accessing or using any part of the Service, you
            confirm that you have read and understood these Terms and that you agree to be bound
            by them. If you do not agree, you must not use the Service.
          </P>
        </Clause>

        <Clause n="1.2" title="When the contract is formed">
          <P>
            The contract between you and Nurilang is formed at the earlier of (a) the moment you
            complete account registration, and (b) the moment you first use any part of the
            Service that does not require an account. Your continued use of the Service
            following any change made in accordance with <Xref>Section 18</Xref> constitutes
            acceptance of the Terms as amended.
          </P>
        </Clause>

        <Clause n="1.3" title="Documents incorporated by reference">
          <P>
            The following documents are incorporated into and form part of these Terms, and you
            agree to them by agreeing to these Terms:
          </P>
          <List>
            <li>
              the <A href="/legal/conduct">Conduct Rules</A>, which set out the standards of
              behaviour required of every participant in the Community Features; and
            </li>
            <li>
              the{" "}
              <A href="/legal/recording-consent">Recording, Consent &amp; Communications policy</A>,
              which governs how calls, voice notes, and recordings are treated; and
            </li>
            <li>
              the <A href="/legal/privacy">Privacy Policy</A>, which explains what personal data
              we process, on what basis, and for how long.
            </li>
          </List>
          <P>
            Where these Terms conflict with an incorporated document, these Terms prevail, except
            that the Privacy Policy prevails on any question of how personal data is processed.
          </P>
        </Clause>

        <Clause n="1.4" title="If you are agreeing on behalf of an organisation">
          <P>
            If you use the Service on behalf of a school, employer, or other organisation, you
            represent that you have authority to bind that organisation to these Terms, and
            &ldquo;you&rdquo; includes that organisation.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 2 ═════════════════════════ */}
      <Section {...SECTIONS[1]}>
        <Clause n="2.1" title="Interpretation">
          <P>
            Capitalised terms have the meanings given below. Headings are for convenience only
            and do not affect interpretation. &ldquo;Including&rdquo; and &ldquo;in
            particular&rdquo; are not words of limitation.
          </P>
        </Clause>

        <dl className="grid gap-5 pl-0 sm:pl-[4.75rem]">
          <Term term="Account">
            The credentials and profile through which you access the Service, created and
            authenticated through our identity provider.
          </Term>
          <Term term="Call">
            A real-time one-to-one voice or video session between two Connected users, carried
            peer-to-peer using WebRTC as described in <Xref>Section 7.5</Xref>.
          </Term>
          <Term term="Community Features">
            Those parts of the Service that expose you to, or allow you to contact, other users:
            the discovery map and roster, Connection Requests, one-to-one text messages, voice
            notes, Calls, and any group session or event feature we make available.
          </Term>
          <Term term="Connection">
            The relationship created when a Connection Request sent by one user is accepted by
            the other. Messaging and Calls between two users require a subsisting Connection.
          </Term>
          <Term term="Connection Request">
            A request sent by one user to another asking to practise together, which the
            recipient may accept, decline, or ignore.
          </Term>
          <Term term="Learning Service">
            Those parts of the Service that do not involve contact with other users, including
            the picture-card vocabulary, listening, speaking and repetition practice, phase
            progression, and course material.
          </Term>
          <Term term="Hours">
            The internal units used by the Service to record time given and received, described
            in <Xref>Section 12</Xref>. Hours are not money, not a payment instrument, and not
            redeemable for cash.
          </Term>
          <Term term="User Content">
            Anything you submit, upload, transmit, display, or otherwise make available through
            the Service, including profile information, photographs, text messages, voice notes,
            reports, and the live audio and video you transmit during a Call.
          </Term>
        </dl>
      </Section>

      {/* ═════════════════════════ 3 ═════════════════════════ */}
      <Section {...SECTIONS[2]}>
        <Clause n="3.1" title="Minimum age for the Service as a whole">
          <P>
            You may use the Learning Service only if you are at least{" "}
            <Ph>MINIMUM AGE FOR THE LEARNING SERVICE</Ph> years old, or such higher minimum age
            as applies in your country of residence. Where the law of your country requires
            parental or guardian consent for a person of your age to enter into this contract or
            to have their personal data processed, you may use the Service only with that
            consent, and your parent or guardian accepts these Terms on your behalf.
          </P>
        </Clause>

        <Clause n="3.2" title="Community Features are restricted to adults">
          <P>
            <strong className="text-ink">
              You may access, use, or appear in any Community Feature only if you are at least
              eighteen (18) years old.
            </strong>{" "}
            This restriction applies without exception and regardless of any lower age of
            majority or age of digital consent in your country of residence.
          </P>
          <P>
            By accessing or attempting to access any Community Feature, you represent and warrant
            on each occasion that you are aged 18 or over.
          </P>
        </Clause>

        <Clause n="3.3" title="Declaring your date of birth">
          <P>
            Community Features are gated. They are closed unless we have enabled them for the
            Service, you satisfy the eligibility conditions in this Section, and you have opted
            in under <Xref>Section 5.3</Xref>.
          </P>
          <P>
            As a condition of that access, you must declare your date of birth. The declaration is
            held on your Account and is re-checked by our servers each time you attempt to appear
            in discovery, to send or accept a Connection Request, to send a message or voice note,
            or to place or receive a Call. Access is refused, on both sides of any interaction,
            unless the stored date shows an age of 18 or over. A date of birth showing an age under
            18 is refused and is not recorded, and the declaration can be made only through the
            dedicated age-confirmation step and not through any other part of the Service.
          </P>
          <P>
            The declaration is self-made. We do not carry out documentary age verification or
            identity verification, and the presence of a user in the Community Features is not a
            representation by us that their declared age or identity is accurate. See{" "}
            <Xref>Section 10</Xref>.
          </P>
        </Clause>

        <Clause n="3.4" title="Misrepresentation of age">
          <P>
            Misrepresenting your age, or assisting another person to misrepresent theirs, is a
            material breach of these Terms. Where we believe on reasonable grounds that an
            account is held by a person under 18 and that account has accessed or sought access
            to the Community Features, we may, without notice and at our discretion, remove that
            account from discovery, withdraw access to the Community Features, suspend the
            account, or terminate it permanently. We may take the same action where an account
            declines to confirm its holder&rsquo;s age when asked.
          </P>
        </Clause>

        <Clause n="3.5" title="Other eligibility conditions">
          <P>You may not use the Service if:</P>
          <List>
            <li>
              you are barred from receiving it under the laws of your country of residence, of{" "}
              <Ph>GOVERNING LAW JURISDICTION</Ph>, or under any applicable sanctions regime;
            </li>
            <li>
              we have previously terminated your account or withdrawn your access to the
              Community Features, unless we expressly agree otherwise in writing; or
            </li>
            <li>
              you have been convicted of, or are subject to any order or registration
              requirement arising from, an offence involving violence, sexual misconduct, or the
              abuse or exploitation of children or vulnerable people.
            </li>
          </List>
        </Clause>
      </Section>

      {/* ═════════════════════════ 4 ═════════════════════════ */}
      <Section {...SECTIONS[3]}>
        <Clause n="4.1" title="Registration">
          <P>
            Some parts of the Service require an Account. Authentication is provided through our
            third-party identity provider (see <Xref>Section 11</Xref>), and your use of it is
            additionally subject to that provider&rsquo;s own terms. You agree to supply accurate
            and complete registration information and to keep it up to date.
          </P>
        </Clause>

        <Clause n="4.2" title="One person, one account">
          <P>
            An Account is personal to you. You must not share your Account, allow another person
            to use it, sell or transfer it, or hold more than one Account without our written
            agreement. You must not impersonate any person or misrepresent your affiliation with
            any person or organisation.
          </P>
        </Clause>

        <Clause n="4.3" title="Security">
          <P>
            You are responsible for maintaining the confidentiality of your sign-in credentials
            and for all activity that occurs under your Account. You must notify us at{" "}
            <Ph>SECURITY CONTACT EMAIL</Ph> promptly on becoming aware of any unauthorised use of
            your Account or any other breach of security. We are not liable for loss arising from
            unauthorised use of your Account before you notify us, except to the extent that loss
            is caused by our breach of these Terms or our negligence.
          </P>
        </Clause>

        <Clause n="4.4" title="Accuracy of your profile">
          <P>
            Other users decide whether to connect with you on the basis of what your profile
            says. Profile information must be truthful, must relate to you, and must not include
            another living person&rsquo;s image or details without their consent.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 5 ═════════════════════════ */}
      <Section {...SECTIONS[4]}>
        <Clause n="5.1" title="What the Service is">
          <P>
            Nurilang is a language-learning service built around comprehension-first practice.
            It has two distinct parts: the Learning Service, which you use on your own, and the
            Community Features, which put you in contact with other adults who are learning or
            helping others learn.
          </P>
        </Clause>

        <Clause n="5.2" title="No guarantee of outcome">
          <P>
            The Service is an educational tool. We do not warrant that you will reach any
            particular level of proficiency, pass any examination, or obtain any qualification.
            Any phase, progress indicator, certificate reference, or completion marker within the
            Service is an internal feature of the product and is not an accredited or externally
            recognised qualification.
          </P>
        </Clause>

        <Clause n="5.3" title="Community Features are optional and off by default">
          <P>
            The Community Features are opt-in. Your Account does not appear in discovery, and
            other users cannot find, message, or call you through the Service, unless you have
            switched on the language-exchange setting on your profile. You may switch it off at
            any time, which removes you from discovery.
          </P>
          <P>
            Where you provide a city and country, other users are shown that city and country
            only. The Service does not publish your precise location.
          </P>
        </Clause>

        <Clause n="5.4" title="Availability, staging and change">
          <P>
            We are still building Nurilang. Features may be released in stages, offered to a
            limited group, labelled as beta or preview, changed, or withdrawn. We may modify,
            suspend, or discontinue any part of the Service, in whole or in part, at any time. We
            will give reasonable notice of any change that we consider materially adverse to you,
            unless the change is required for legal, safety, or security reasons.
          </P>
        </Clause>

        <Clause n="5.5" title="Your equipment and connection">
          <P>
            You are responsible for the device, operating system, browser, microphone, camera,
            internet connection, and any data charges needed to use the Service. Real-time
            features depend on network conditions outside our control and may be unavailable,
            degraded, or fail to connect.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 6 ═════════════════════════ */}
      <Section {...SECTIONS[5]}>
        <Clause n="6.1" title="Consent before contact">
          <P>
            Contact between users is consent-based. Discovery lets you see other users who have
            opted in, and lets you send them a Connection Request. Until that request has been
            accepted, you may not send one-to-one messages or voice notes to that person, and you
            may not call them. The Service enforces this: messaging and Call functions are
            refused between users who are not Connected.
          </P>
        </Clause>

        <Clause n="6.2" title="Requests are not obligations">
          <P>
            No user is obliged to accept a Connection Request, to reply to a message, to answer a
            Call, or to give any reason for declining. Repeatedly sending requests to a person
            who has declined or ignored them is a breach of the Conduct Rules.
          </P>
        </Clause>

        <Clause n="6.3" title="Withdrawing consent">
          <P>
            You may end contact with another user at any time by blocking them. Blocking is
            mutual in effect: it hides each of you from the other in discovery, declines any
            pending Connection Request between you, ends any Call in progress between you, and
            suppresses your conversation from both inboxes. Blocking does not delete messages
            already sent; see the <A href="/legal/privacy">Privacy Policy</A> for retention.
          </P>
        </Clause>

        <Clause n="6.4" title="Rate limits and anti-abuse measures">
          <P>
            We apply limits to the frequency of messages, Calls, and reports, and we may apply
            further technical measures to prevent spam, harassment, and automated abuse. You must
            not circumvent, or attempt to circumvent, any such measure.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 7 ═════════════════════════ */}
      <Section {...SECTIONS[6]}>
        <Clause n="7.1" title="You keep ownership">
          <P>
            You retain all rights you already have in your User Content. These Terms do not
            transfer ownership of your User Content to us.
          </P>
        </Clause>

        <Clause n="7.2" title="The licence you grant to us">
          <P>
            You grant Nurilang a worldwide, non-exclusive, royalty-free, transferable, and
            sublicensable licence to host, store, reproduce, adapt (for formatting and technical
            purposes), transmit, and display your User Content, strictly for the purposes of:
          </P>
          <List>
            <li>operating, providing, and maintaining the Service to you and to the users you have chosen to communicate with;</li>
            <li>keeping backups and ensuring continuity of the Service;</li>
            <li>investigating reports, enforcing these Terms and the Conduct Rules, and protecting the safety of users; and</li>
            <li>complying with law or responding to a valid legal request.</li>
          </List>
          <P>
            This licence lasts as long as your User Content remains on the Service and for such
            further period as is reasonably necessary for backup, audit, safety, or legal
            purposes. It does not permit us to use your User Content for advertising, or to
            publish it outside the Service, without your separate consent.
          </P>
        </Clause>

        <Clause n="7.3" title="Your warranties about your Content">
          <P>
            You represent and warrant that you own or are licensed to use your User Content, that
            it does not infringe any third party&rsquo;s rights, and that it does not breach{" "}
            <Xref>Section 8</Xref> or the Conduct Rules.
          </P>
        </Clause>

        <Clause n="7.4" title="What is stored">
          <P>
            One-to-one text messages are stored by the Service so that a conversation persists
            between sessions. Voice notes are recorded by you in your browser, uploaded, and
            stored by the Service so that the recipient can play them back. Profile information,
            including any photograph, is stored. Reports you submit are stored and are available
            to our moderators.
          </P>
        </Clause>

        <Clause n="7.5" title="Calls are not recorded by us">
          <P>
            Voice and video Calls use WebRTC and are peer-to-peer. Our backend relays only the
            signalling data needed to establish the connection — the session description
            (SDP) offer and answer, and ICE candidates. The audio and video streams themselves
            do not pass through, and are not recorded or stored on, our servers.
          </P>
          <P>
            Where a direct peer-to-peer connection cannot be established, for example because one
            participant is behind a restrictive network, the encrypted media may be routed
            through a third-party TURN relay so that the Call can connect. A TURN relay forwards
            the encrypted stream; it is not used by us to record or retain the Call. The relay
            operator is a third party and its own terms and practices apply to the traffic it
            carries. See <Xref>Section 11</Xref>.
          </P>
          <P>
            We do not warrant that a Call is confidential. Any participant can record a Call
            using tools outside the Service, and we have no ability to detect or prevent this.
          </P>
        </Clause>

        <Clause n="7.6" title="Recording and re-publication by users">
          <P>
            You must not record, screenshot, transcribe, or otherwise capture a Call, a voice
            note, a message, or another user&rsquo;s image, without that user&rsquo;s prior
            consent, and you must not publish or share any such capture. In some countries
            recording a conversation without consent is a criminal offence. The{" "}
            <A href="/legal/recording-consent">Recording, Consent &amp; Communications policy</A>{" "}
            sets out this obligation in full. It survives the ending of your Connection and of
            your Account.
          </P>
        </Clause>

        <Clause n="7.7" title="Our content">
          <P>
            The Service, including its software, design, text, illustrations, mascots, course
            structure, and picture-card materials, is owned by Nurilang or its licensors and is
            protected by intellectual property law. We grant you a personal, non-exclusive,
            non-transferable, revocable licence to use the Service for your own language
            learning. You may not copy, adapt, reverse engineer, scrape, resell, or create
            derivative works from any part of the Service except as permitted by law.
          </P>
        </Clause>

        <Clause n="7.8" title="Feedback">
          <P>
            If you send us suggestions or feedback about the Service, we may use them without
            restriction and without any obligation to you.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 8 ═════════════════════════ */}
      <Section {...SECTIONS[7]}>
        <Clause n="8.1" title="The Conduct Rules apply in full">
          <P>
            The <A href="/legal/conduct">Conduct Rules</A> are incorporated into these Terms by
            reference and apply to everything you do in the Community Features, including text
            messages, voice notes, profile content, and anything you say or show during a Call. A
            breach of the Conduct Rules is a breach of these Terms.
          </P>
        </Clause>

        <Clause n="8.2" title="Prohibited conduct">
          <P>Without limiting the Conduct Rules, you must not:</P>
          <List>
            <li>
              harass, threaten, stalk, defame, or intimidate any person, or encourage others to
              do so;
            </li>
            <li>
              send, display, or transmit sexual content, or engage in sexual conduct on a Call,
              including exposing yourself on camera;
            </li>
            <li>
              promote hatred against, or degrade, any person or group by reference to a protected
              characteristic;
            </li>
            <li>
              contact, attempt to contact, or seek to arrange contact with a person you know or
              suspect to be under 18;
            </li>
            <li>
              solicit money, investment, donations, or financial or personal information from
              other users, or use the Service for recruitment into any scheme;
            </li>
            <li>
              advertise, spam, or use the Service for any commercial purpose we have not
              authorised;
            </li>
            <li>
              upload malware, or probe, scan, overload, or interfere with the Service or any
              network or system connected to it;
            </li>
            <li>
              use bots, scrapers, or automated means to access the Service, or collect or compile
              data about other users;
            </li>
            <li>
              share another user&rsquo;s personal information, image, or communications outside
              the Service without their consent; or
            </li>
            <li>
              do anything unlawful, or anything that assists another person to breach these Terms.
            </li>
          </List>
        </Clause>

        <Clause n="8.3" title="Your dealings with other users">
          <P>
            Any arrangement you make with another user — to meet, to teach, to exchange
            time, to pay or be paid outside the Service, or anything else — is between you
            and that user. Nurilang is not a party to it and has no responsibility for it.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 9 ═════════════════════════ */}
      <Section {...SECTIONS[8]}>
        <Clause n="9.1" title="Blocking and reporting">
          <P>
            Every user can block another user and can report another user to us. Reports are
            private: the person you report is not told that you reported them, and reports are
            never shown in discovery or to other users.
          </P>
        </Clause>

        <Clause n="9.2" title="How reports are handled">
          <P>
            A report is placed in a moderation queue and is reviewed by the operator of the
            Service or by moderators the operator has authorised. Access to that queue is
            restricted to those people. We aim to review reports promptly, but we do not commit to
            a response time, and we are not obliged to tell you the outcome of a report you make
            about someone else.
          </P>
          <P>
            If you believe someone is at risk of immediate harm, contact your local emergency
            services. Nurilang is not an emergency service and cannot intervene in real time.
          </P>
        </Clause>

        <Clause n="9.3" title="No general monitoring obligation">
          <P>
            We do not pre-screen or routinely monitor User Content, and we do not monitor Calls,
            which we could not do in any event because Call media does not pass through our
            servers. We reserve the right, but assume no obligation, to review, refuse, remove, or
            restrict any User Content, and nothing in these Terms creates a duty on us to do so.
          </P>
        </Clause>

        <Clause n="9.4" title="Enforcement action we may take">
          <P>
            Where we consider on reasonable grounds that these Terms or the Conduct Rules have
            been breached, or that action is necessary to protect users or the Service, we may
            take any of the following steps, alone or together, with or without prior notice and
            in proportion to the seriousness of the matter:
          </P>
          <List>
            <li>issue a warning;</li>
            <li>remove or restrict access to User Content;</li>
            <li>remove your Account from discovery, or withdraw access to some or all Community Features;</li>
            <li>suspend your Account for a period;</li>
            <li>terminate your Account permanently and refuse you future access; and</li>
            <li>report the matter to law enforcement or another competent authority, and preserve and disclose relevant records where required or permitted by law.</li>
          </List>
        </Clause>

        <Clause n="9.5" title="Appeals">
          <P>
            If your Account is suspended or terminated and you believe we have made a mistake, you
            may ask us to review the decision by writing to <Ph>APPEALS CONTACT EMAIL</Ph> within{" "}
            <Ph>APPEAL WINDOW, e.g. 30 days</Ph> of being notified. We will review the decision and
            tell you the outcome. This does not affect any right you have to bring a complaint to a
            regulator or a court.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 10 ═════════════════════════ */}
      <Section {...SECTIONS[9]}>
        <Callout tone="amber" label="Read this section carefully">
          <p>
            The Community Features put you in unmediated, real-time contact with adults you do not
            know, over live video and audio. That carries risk. You accept that risk when you use
            them.
          </p>
        </Callout>

        <Clause n="10.1" title="We do not vet users">
          <P>
            <strong className="text-ink">
              We do not conduct criminal record checks, background checks, identity verification,
              or reference checks on any user.
            </strong>{" "}
            We do not verify that a user is who they say they are, that they are the age they say
            they are, that they live where they say they live, that they speak the languages they
            claim, or that any qualification, certificate, or experience shown on their profile is
            genuine. Nothing in the Service should be read as an endorsement, recommendation,
            approval, or accreditation of any user.
          </P>
        </Clause>

        <Clause n="10.2" title="Live video and audio">
          <P>
            A Call is live and unmoderated. Another participant may behave unexpectedly, may say
            or show something you find offensive, distressing, or unlawful, may record you without
            your knowledge, and may attempt to obtain personal information from you. Your camera
            and microphone transmit whatever is in front of and around them, including your
            surroundings, other people present, and anything visible behind you. You are
            responsible for what you choose to transmit.
          </P>
          <P>
            You can decline any Call, mute your microphone, turn off your camera, end a Call at any
            moment, and block the other participant afterwards. You are encouraged to do so
            whenever you feel uncomfortable, for any reason or none.
          </P>
        </Clause>

        <Clause n="10.3" title="Assumption of risk">
          <P>
            To the fullest extent permitted by law, you knowingly and voluntarily assume all risk
            arising from your interaction with other users, whether online through the Service or
            offline, including the risk of offensive, deceptive, harassing, fraudulent, or
            unlawful conduct by another user, and of any resulting emotional distress, financial
            loss, reputational harm, or physical injury.
          </P>
        </Clause>

        <Clause n="10.4" title="Meeting in person and sharing details">
          <P>
            The Service is not designed to arrange meetings in the physical world. If you choose to
            share contact details, move a conversation to another platform, or meet another user in
            person, you do so entirely at your own risk and outside the Service. We strongly
            recommend that you do not share your home address, financial details, identity
            documents, or workplace, that you keep conversations within the Service until you have
            good reason to trust the other person, and that you tell someone you trust where you are
            going if you do arrange to meet.
          </P>
        </Clause>

        <Clause n="10.5" title="Nurilang is not a party to your interactions">
          <P>
            We provide a platform. We are not a party to, and do not supervise, direct, or control,
            any conversation, lesson, exchange, or arrangement between users. Users are not our
            employees, agents, or contractors, and we are not responsible for their acts or
            omissions.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 11 ═════════════════════════ */}
      <Section {...SECTIONS[10]}>
        <Clause n="11.1" title="Services we rely on">
          <P>
            The Service is built on third-party infrastructure. As at the date of these Terms we
            rely on the following categories of provider:
          </P>
          <List>
            <li>
              <strong className="text-ink">Authentication</strong> — Clerk, which manages
              sign-in, sessions, and account credentials;
            </li>
            <li>
              <strong className="text-ink">Backend and file storage</strong> — Convex, which
              stores profiles, messages, voice-note files, Connection Requests, reports, and Call
              signalling data;
            </li>
            <li>
              <strong className="text-ink">Hosting and content delivery</strong> —{" "}
              <Ph>HOSTING PROVIDER</Ph>;
            </li>
            <li>
              <strong className="text-ink">Call connectivity</strong> — public STUN servers
              and a TURN relay used for network traversal, as described in{" "}
              <Xref>Section 7.5</Xref>; and
            </li>
            <li>
              <strong className="text-ink">City geocoding</strong> — a public geocoding API
              used to convert a city name into approximate coordinates for the discovery map. Only
              the city name is sent.
            </li>
          </List>
          <P>
            The <A href="/legal/privacy">Privacy Policy</A> identifies these providers and their
            roles in more detail and is the authoritative statement of what personal data reaches
            them.
          </P>
        </Clause>

        <Clause n="11.2" title="No responsibility for third parties">
          <P>
            Third-party services are governed by their own terms and privacy policies. We are not
            responsible for their acts, omissions, availability, or content. We may change
            provider at any time.
          </P>
        </Clause>

        <Clause n="11.3" title="External links">
          <P>
            The Service may link to websites we do not control. Those links are provided for
            convenience only and do not imply endorsement.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 12 ═════════════════════════ */}
      <Section {...SECTIONS[11]}>
        <Clause n="12.1" title="Hours are an internal record, not money">
          <P>
            The Service uses internal units called Hours to record time given and time received
            between users, together with a ledger of the movements between them. Hours have no
            monetary value, are not electronic money, are not a stored-value or payment
            instrument, cannot be exchanged for cash, and cannot be transferred to another person
            except through the features we provide. Any balance displayed to you is a record of
            your activity within the Service, not a debt owed to you.
          </P>
        </Clause>

        <Clause n="12.2" title="How Hours may be credited">
          <P>
            The Service distinguishes between Hours earned by taking part in exchanges and Hours
            obtained through a paid transaction. Credits and debits may be applied only by the
            Service itself, arising from a verified session or a verified payment event. A balance
            claimed by your device, or arrived at by any means other than those workflows, will not
            be recognised. We may correct, reverse, or cancel any balance or ledger entry that we
            determine was created in error, through a fault, or through abuse.
          </P>
        </Clause>

        <Clause n="12.3" title="Paid features">
          <P>
            We may offer paid features, including the purchase of Hours or paid sessions with
            other users. Where we do:
          </P>
          <List>
            <li>
              prices, currencies, applicable taxes, any platform or service fee, and the payment
              methods accepted will be shown to you before you commit to the transaction;
            </li>
            <li>
              payment will be taken by our payment provider, <Ph>PAYMENT PROVIDER</Ph>, whose terms
              will additionally apply, and we do not receive or store your full payment card
              details;
            </li>
            <li>
              the terms of sale, including any right to cancel and our refund policy, are set out
              at <Ph>REFUND AND CANCELLATION POLICY LOCATION</Ph> and form part of these Terms in
              respect of that purchase; and
            </li>
            <li>
              nothing in this Section limits any statutory cancellation or refund right you have as
              a consumer under the law of your country of residence.
            </li>
          </List>
          <P>
            Where a paid feature has not yet been enabled, any pricing, pack, or purchase interface
            shown in the Service is illustrative only, and no payment is taken and no contract of
            sale is formed.
          </P>
        </Clause>

        <Clause n="12.4" title="Forfeiture on termination">
          <P>
            If your Account is terminated for breach of these Terms, any unused Hours are
            forfeited, save where forfeiture of Hours you paid for is prohibited by law. If your
            Account is terminated for any other reason, we will deal with any Hours you paid for in
            accordance with the policy referred to in <Xref>Section 12.3</Xref>.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 13 ═════════════════════════ */}
      <Section {...SECTIONS[12]}>
        <Clause n="13.1" title="Provided as is">
          <P>
            To the fullest extent permitted by law, the Service is provided{" "}
            <strong className="text-ink">&ldquo;as is&rdquo;</strong> and{" "}
            <strong className="text-ink">&ldquo;as available&rdquo;</strong>, and we exclude all
            conditions, warranties, representations, and other terms that might otherwise be
            implied by statute, common law, or otherwise.
          </P>
        </Clause>

        <Clause n="13.2" title="In particular, we do not warrant that">
          <List>
            <li>the Service will be uninterrupted, timely, secure, or free from error or defect;</li>
            <li>any Call will connect, or will be of any particular quality;</li>
            <li>any content on the Service, including course material and translations, is accurate, complete, or suitable for your purpose;</li>
            <li>any other user is who they claim to be, is suitable to practise with, or will behave lawfully or courteously; or</li>
            <li>the Service, or any content you transmit through it, will be free from interception, loss, or unauthorised access.</li>
          </List>
        </Clause>

        <Clause n="13.3" title="Consumer rights preserved">
          <P>
            Nothing in this Section affects rights you have as a consumer that cannot lawfully be
            excluded or limited under the law of your country of residence.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 14 ═════════════════════════ */}
      <Section {...SECTIONS[13]}>
        <Callout tone="lime" label="Limitation of liability">
          <p>
            This Section limits what we can be required to pay you. Please read it. It applies to
            the fullest extent permitted by law, and it does not take away rights that cannot
            lawfully be taken away.
          </p>
        </Callout>

        <Clause n="14.1" title="Liabilities we never exclude">
          <P>
            Nothing in these Terms excludes or limits our liability for death or personal injury
            caused by our negligence, for fraud or fraudulent misrepresentation, or for any other
            liability that cannot be excluded or limited under the law of{" "}
            <Ph>GOVERNING LAW JURISDICTION</Ph> or under the mandatory consumer law of your
            country of residence.
          </P>
        </Clause>

        <Clause n="14.2" title="Excluded losses">
          <P>
            Subject to <Xref>Section 14.1</Xref>, we are not liable to you for any:
          </P>
          <List>
            <li>indirect, special, incidental, punitive, or consequential loss;</li>
            <li>loss of profit, revenue, business, contract, opportunity, anticipated saving, or goodwill;</li>
            <li>loss or corruption of data, or cost of procuring substitute services;</li>
            <li>
              loss or harm arising from the conduct of another user, whether on the Service or
              offline, including harassment, deception, fraud, defamation, infringement of your
              rights, recording or misuse of your image or voice, or any physical or emotional
              harm; or
            </li>
            <li>
              loss or harm arising from your reliance on any user&rsquo;s claimed identity, age,
              qualification, or experience.
            </li>
          </List>
        </Clause>

        <Clause n="14.3" title="Cap on liability">
          <P>
            Subject to <Xref>Section 14.1</Xref>, our total aggregate liability to you arising out
            of or in connection with these Terms and the Service, whether in contract, tort
            (including negligence), breach of statutory duty, or otherwise, is limited to the
            greater of (a) the total amount you paid to us for the Service in the{" "}
            <Ph>CAP PERIOD, e.g. twelve (12) months</Ph> immediately preceding the event giving
            rise to the claim, and (b) <Ph>MINIMUM CAP AMOUNT AND CURRENCY</Ph>.
          </P>
        </Clause>

        <Clause n="14.4" title="Basis of the bargain">
          <P>
            The allocation of risk in this Section and in <Xref>Section 10</Xref> is a fundamental
            basis on which we provide the Service to you, and it reflects the fact that much of the
            Service is provided free of charge.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 15 ═════════════════════════ */}
      <Section {...SECTIONS[14]}>
        <Clause n="15.1" title="Your indemnity">
          <P>
            To the fullest extent permitted by law, you agree to indemnify and hold harmless
            Nurilang and its officers, employees, and agents from and against all claims, demands,
            proceedings, losses, damages, liabilities, and reasonable costs and expenses (including
            reasonable legal fees) arising out of or in connection with:
          </P>
          <List>
            <li>your breach of these Terms or of the Conduct Rules;</li>
            <li>your User Content, or your conduct on a Call;</li>
            <li>your interaction or arrangement with any other user, whether on the Service or offline; or</li>
            <li>your violation of any law or of the rights of any third party.</li>
          </List>
        </Clause>

        <Clause n="15.2" title="Conduct of claims">
          <P>
            We will notify you promptly of any claim to which this indemnity applies, will not
            settle it without your consent (not to be unreasonably withheld), and will give you
            reasonable assistance at your cost. We reserve the right to assume the exclusive
            defence and control of any such matter, in which case you will cooperate with us.
          </P>
        </Clause>

        <Clause n="15.3" title="Consumers">
          <P>
            This Section applies only to the extent permitted by law and does not apply where you
            are acting as a consumer and the law of your country of residence prohibits an
            indemnity of this kind.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 16 ═════════════════════════ */}
      <Section {...SECTIONS[15]}>
        <Clause n="16.1" title="Ending your Account">
          <P>
            You may stop using the Service at any time, and you may delete your Account through the
            Service or by writing to <Ph>SUPPORT CONTACT EMAIL</Ph>. Deletion is handled as
            described in the <A href="/legal/privacy">Privacy Policy</A>.
          </P>
        </Clause>

        <Clause n="16.2" title="Suspension and termination by us">
          <P>
            We may suspend or terminate your Account, or withdraw your access to any part of the
            Service, immediately and without notice where we reasonably believe that you have
            materially breached these Terms or the Conduct Rules, that you are under 18 and have
            accessed or sought to access the Community Features, that your continued access poses a
            risk to another user or to the Service, or that we are required to do so by law.
          </P>
          <P>
            In less serious cases, or where we are discontinuing the Service or a feature, we will
            give you reasonable notice before terminating your Account.
          </P>
        </Clause>

        <Clause n="16.3" title="Effect of termination">
          <P>
            On termination, your right to use the Service ends immediately, your Account is removed
            from discovery, and any subsisting Connections end. Termination does not affect any
            right, remedy, obligation, or liability that has accrued before it takes effect.
          </P>
        </Clause>

        <Clause n="16.4" title="Survival">
          <P>
            Sections <Xref>2</Xref>, <Xref>7.2</Xref>, <Xref>7.3</Xref>, <Xref>7.6</Xref>,{" "}
            <Xref>7.7</Xref>, <Xref>7.8</Xref>, <Xref>10</Xref>, <Xref>12.1</Xref>,{" "}
            <Xref>12.4</Xref>, <Xref>13</Xref>, <Xref>14</Xref>, <Xref>15</Xref>,{" "}
            <Xref>16.3</Xref>, <Xref>17</Xref>, and <Xref>19</Xref> survive termination, together
            with any other provision which by its nature is intended to survive.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 17 ═════════════════════════ */}
      <Section {...SECTIONS[16]}>
        <Clause n="17.1" title="Governing law">
          <P>
            These Terms, and any dispute or claim arising out of or in connection with them, their
            subject matter, or their formation (including non-contractual disputes or claims), are
            governed by and construed in accordance with the laws of{" "}
            <Ph>GOVERNING LAW JURISDICTION</Ph>, without regard to its conflict-of-laws rules.
          </P>
        </Clause>

        <Clause n="17.2" title="Talk to us first">
          <P>
            If you have a complaint, please contact us at <Ph>LEGAL NOTICES EMAIL</Ph> before
            starting formal proceedings. We will try in good faith to resolve the matter with you
            within <Ph>INFORMAL RESOLUTION PERIOD, e.g. 30 days</Ph>. This step does not suspend any
            limitation period unless the law provides otherwise.
          </P>
        </Clause>

        <Clause n="17.3" title="Forum">
          <P>
            Subject to <Xref>Section 17.4</Xref>, the courts of{" "}
            <Ph>COURTS / EXCLUSIVE OR NON-EXCLUSIVE JURISDICTION</Ph> have{" "}
            <Ph>EXCLUSIVE OR NON-EXCLUSIVE</Ph> jurisdiction to settle any dispute or claim arising
            out of or in connection with these Terms.{" "}
            <Ph>
              IF ARBITRATION IS ADOPTED, SET OUT THE ARBITRATION AGREEMENT, PROVIDER, RULES, SEAT,
              LANGUAGE, CLASS-ACTION WAIVER AND ANY OPT-OUT MECHANISM HERE
            </Ph>
            .
          </P>
        </Clause>

        <Clause n="17.4" title="Consumers">
          <P>
            If you are a consumer, nothing in this Section deprives you of the protection of the
            mandatory law of your country of residence, or of your right to bring proceedings in
            the courts of that country. <Ph>ONLINE DISPUTE RESOLUTION / ADR BODY, IF APPLICABLE</Ph>
            .
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 18 ═════════════════════════ */}
      <Section {...SECTIONS[17]}>
        <Clause n="18.1" title="How we change these Terms">
          <P>
            We may amend these Terms from time to time, for example to reflect a change in the
            Service, in our infrastructure, or in the law. The current version is always available
            at nurilang.app/legal/terms, and the &ldquo;Last updated&rdquo; date at the top records
            when it last changed.
          </P>
        </Clause>

        <Clause n="18.2" title="Notice of material changes">
          <P>
            Where a change is material and adverse to you, we will give you at least{" "}
            <Ph>NOTICE PERIOD, e.g. 30 days</Ph> notice before it takes effect, by email to the
            address on your Account or by a prominent notice in the Service. Changes required for
            legal, regulatory, safety, or security reasons may take effect immediately.
          </P>
        </Clause>

        <Clause n="18.3" title="If you do not accept a change">
          <P>
            If you do not accept a change, you must stop using the Service and may delete your
            Account before the change takes effect. Continuing to use the Service after that date
            means you accept the amended Terms.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 19 ═════════════════════════ */}
      <Section {...SECTIONS[18]}>
        <Clause n="19.1" title="Entire agreement">
          <P>
            These Terms, together with the documents incorporated by reference in{" "}
            <Xref>Section 1.3</Xref>, constitute the entire agreement between you and Nurilang
            relating to the Service and supersede all previous agreements, representations, and
            understandings on that subject. Nothing in this Section limits liability for fraud or
            fraudulent misrepresentation.
          </P>
        </Clause>

        <Clause n="19.2" title="Severability">
          <P>
            If any provision of these Terms is held to be invalid, unlawful, or unenforceable, it
            is to be modified to the minimum extent necessary to make it enforceable, or, if that
            is not possible, severed. Severance or modification of a provision does not affect the
            validity or enforceability of the remainder of these Terms.
          </P>
        </Clause>

        <Clause n="19.3" title="No waiver">
          <P>
            A failure or delay by us in exercising any right or remedy is not a waiver of it, and
            a single or partial exercise does not prevent any further exercise.
          </P>
        </Clause>

        <Clause n="19.4" title="Assignment">
          <P>
            You may not assign, transfer, or sub-contract any of your rights or obligations under
            these Terms without our prior written consent. We may assign or transfer our rights and
            obligations to an affiliate, or in connection with a merger, acquisition, or sale of
            assets, provided this does not materially reduce your rights.
          </P>
        </Clause>

        <Clause n="19.5" title="Third-party rights">
          <P>
            Except as expressly stated, no person other than you and Nurilang has any right to
            enforce any provision of these Terms.
          </P>
        </Clause>

        <Clause n="19.6" title="Force majeure">
          <P>
            We are not liable for any failure or delay in performing our obligations caused by an
            event beyond our reasonable control, including network or infrastructure failure, the
            failure of a third-party provider, industrial action, act of government, or natural
            disaster.
          </P>
        </Clause>

        <Clause n="19.7" title="Notices">
          <P>
            We may give you notice by email to the address on your Account or by a notice in the
            Service. You must give us notice in writing to <Ph>LEGAL NOTICES EMAIL</Ph> or to our
            registered address above.
          </P>
        </Clause>

        <Clause n="19.8" title="Language">
          <P>
            These Terms are drawn up in English. Any translation is provided for convenience only,
            and the English version prevails in the event of conflict, except where the law of your
            country of residence provides otherwise.
          </P>
        </Clause>
      </Section>

      {/* ═════════════════════════ 20 ═════════════════════════ */}
      <Section {...SECTIONS[19]}>
        <Clause n="20.1" title="Contact details">
          <P>
            Questions about these Terms, notices, and legal correspondence should be sent to{" "}
            <Ph>LEGAL NOTICES EMAIL</Ph>. General support enquiries should be sent to{" "}
            <Ph>SUPPORT CONTACT EMAIL</Ph>. Safety concerns should be reported through the report
            function in the Service, or, if that is not possible, to{" "}
            <Ph>SAFETY CONTACT EMAIL</Ph>.
          </P>
          <P>
            Our postal address is <Ph>REGISTERED ADDRESS</Ph>. Data protection enquiries should be
            addressed to <Ph>DATA PROTECTION CONTACT / DPO NAME AND EMAIL, IF APPOINTED</Ph>, and
            are dealt with in the <A href="/legal/privacy">Privacy Policy</A>.
          </P>
        </Clause>
      </Section>

      {/* ───────────────────────── foot ───────────────────────── */}
      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8 text-sm text-muted">
        <p>
          Read alongside the <A href="/legal/conduct">Conduct Rules</A> and the{" "}
          <A href="/legal/privacy">Privacy Policy</A>.
        </p>
        <a href="#top" className="text-xs font-semibold transition-colors hover:text-ink">
          ↑ Back to top
        </a>
      </div>
    </article>
  );
}
