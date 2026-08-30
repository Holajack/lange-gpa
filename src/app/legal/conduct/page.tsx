import type { Metadata } from "next";
import Link from "next/link";

/**
 * /legal/conduct — the Community Conduct Rules.
 *
 * Binding rules for the community side of Nurilang (discovery, connection
 * requests, 1:1 text, voice notes, and 1:1 voice/video calls). Statements of
 * fact about how the product behaves are kept to what the codebase actually
 * does; everything the operator must supply before publication is marked with
 * a bracketed placeholder.
 */

const title = "Community Conduct Rules";
const description =
  "The binding rules for Nurilang's adults-only community features: eligibility, consent and connections, prohibited conduct, video-call expectations, reporting, enforcement, and appeals.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/legal/conduct" },
  openGraph: {
    type: "article",
    url: "/legal/conduct",
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
};

/* ------------------------------- typography ------------------------------- */

/** An operator-supplied value that must be filled in before publication. */
function Ph({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-amber/15 px-1.5 py-0.5 text-[0.9em] font-bold text-amber">
      [{children}]
    </span>
  );
}

/** A defined term, or an emphasised obligation. */
function T({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

function Section({
  id,
  num,
  title: heading,
  children,
}: {
  id: string;
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mt-12 scroll-mt-28 border-t border-line pt-10 first:mt-0 first:border-0 first:pt-0"
    >
      <h2 className="headline text-2xl text-ink sm:text-[1.75rem]">
        <span className="mr-3 tabular-nums text-lime">{num}</span>
        {heading}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Clauses({ children }: { children: React.ReactNode }) {
  return <ol className="space-y-5">{children}</ol>;
}

function Clause({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[2.75rem_1fr] sm:grid-cols-[3.5rem_1fr]">
      <span className="pt-px font-semibold tabular-nums text-ink/60">{n}</span>
      <div className="space-y-3">{children}</div>
    </li>
  );
}

function Bullets({ children }: { children: React.ReactNode }) {
  return <ul className="mt-3 space-y-2.5 border-l border-line pl-4">{children}</ul>;
}

function Bullet({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <li>
      {label ? <T>{label}</T> : null}
      {label ? " " : null}
      {children}
    </li>
  );
}

function Callout({
  tone = "neutral",
  title: heading,
  children,
}: {
  tone?: "neutral" | "alert";
  title: string;
  children: React.ReactNode;
}) {
  // Deliberately not the `.card` class: that rule is unlayered in globals.css and
  // would beat these Tailwind border/background utilities in the cascade.
  const accent = tone === "alert" ? "border-coral/40 bg-coral/5" : "border-line bg-white/5";
  return (
    <aside
      className={`mt-6 rounded-[var(--radius-card)] border p-5 sm:p-6 ${accent}`}
    >
      <h3 className={`headline text-base ${tone === "alert" ? "text-coral" : "text-ink"}`}>
        {heading}
      </h3>
      <div className="mt-2.5 space-y-3 text-sm">{children}</div>
    </aside>
  );
}

/* ---------------------------------- page ---------------------------------- */

const CONTENTS = [
  { id: "scope", num: "1", label: "Scope and interpretation" },
  { id: "eligibility", num: "2", label: "Eligibility and your account" },
  { id: "consent", num: "3", label: "Consent, connections, and blocking" },
  { id: "prohibited", num: "4", label: "Prohibited conduct" },
  { id: "calls", num: "5", label: "Voice and video calls" },
  { id: "content", num: "6", label: "Messages, voice notes, and content" },
  { id: "reporting", num: "7", label: "Reporting" },
  { id: "enforcement", num: "8", label: "Enforcement" },
  { id: "appeals", num: "9", label: "Appeals" },
  { id: "changes", num: "10", label: "Changes to these Rules" },
  { id: "risk", num: "11", label: "No verification, risk, and liability" },
  { id: "law", num: "12", label: "Governing law and general terms" },
  { id: "contact", num: "13", label: "Contact" },
];

export default function ConductPage() {
  return (
    <article>
      {/* ───────────────────────── masthead ───────────────────────── */}
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">
          Nurilang · Legal
        </p>
        <h1 className="headline mt-3 text-4xl leading-[1.08] text-ink sm:text-5xl">
          Community Conduct Rules
        </h1>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="font-semibold text-ink">Effective date:</dt>
            <dd>
              <Ph>EFFECTIVE DATE</Ph>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold text-ink">Last updated:</dt>
            <dd>
              <Ph>LAST UPDATED DATE</Ph>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold text-ink">Version:</dt>
            <dd>
              <Ph>VERSION</Ph>
            </dd>
          </div>
        </dl>
      </header>

      <Callout title="In short (not part of the Rules)">
        <p>
          Nurilang&rsquo;s community side is for adults only. Nobody can message or call you
          unless you have accepted a connection with them, and you can withdraw that at any
          time. Treat the people you meet here as you would a stranger who has kindly agreed to
          help you learn: no harassment, no sexual content, no recording without consent, no
          asking for money. If something goes wrong, block and report.
        </p>
        <p className="text-muted">
          This summary is provided for convenience only. It is not part of the Rules and does
          not modify them. Sections 1 to 13 below are the binding text.
        </p>
      </Callout>

      {/* ───────────────────────── contents ───────────────────────── */}
      <nav aria-labelledby="contents-heading" className="mt-10">
        <h2
          id="contents-heading"
          className="text-xs font-bold uppercase tracking-[0.22em] text-muted"
        >
          Contents
        </h2>
        <ol className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {CONTENTS.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span className="tabular-nums text-ink/50">{item.num}</span>
              <a
                href={`#${item.id}`}
                className="underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-lime"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12">
        {/* ═══════════════════════════ 1 ═══════════════════════════ */}
        <Section id="scope" num="1" title="Scope and interpretation">
          <Clauses>
            <Clause n="1.1">
              <p>
                These Community Conduct Rules (the <T>&ldquo;Rules&rdquo;</T>) govern your access
                to and use of the Community Features of the Nurilang application and website at
                nurilang.app (together, the <T>&ldquo;Service&rdquo;</T>). The Service is
                operated by <Ph>LEGAL ENTITY NAME</Ph>, a <Ph>ENTITY TYPE</Ph> registered in{" "}
                <Ph>JURISDICTION OF INCORPORATION</Ph> under number{" "}
                <Ph>COMPANY REGISTRATION NUMBER</Ph>, with its registered address at{" "}
                <Ph>REGISTERED ADDRESS</Ph> (the <T>&ldquo;Operator&rdquo;</T>,{" "}
                <T>&ldquo;we&rdquo;</T>, <T>&ldquo;us&rdquo;</T>).
              </p>
            </Clause>

            <Clause n="1.2">
              <p>
                These Rules are incorporated by reference into, and form part of, the{" "}
                <Link
                  href="/legal/terms"
                  className="font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-lime"
                >
                  Terms of Service
                </Link>{" "}
                (the <T>&ldquo;Terms&rdquo;</T>). By accessing or using any Community Feature you
                agree to be bound by these Rules. If you do not agree, you must not use the
                Community Features.
              </p>
            </Clause>

            <Clause n="1.3">
              <p>In these Rules, the following defined terms apply:</p>
              <Bullets>
                <Bullet label="&ldquo;Member&rdquo;, &ldquo;you&rdquo;">
                  means an individual who holds a Nurilang account.
                </Bullet>
                <Bullet label="&ldquo;Community Features&rdquo;">
                  means those parts of the Service through which Members may become visible to,
                  or communicate with, other Members, including the community discovery roster,
                  connection requests, one-to-one text messages, voice notes, one-to-one voice
                  and video calls, and group language sessions.
                </Bullet>
                <Bullet label="&ldquo;Learning Features&rdquo;">
                  means all other parts of the Service, including lessons, picture cards,
                  practice activities, and progress tracking, which do not put you in contact
                  with another Member.
                </Bullet>
                <Bullet label="&ldquo;Connection&rdquo;">
                  means the relationship created when one Member sends a connection request and
                  the receiving Member accepts it.
                </Bullet>
                <Bullet label="&ldquo;Content&rdquo;">
                  means any text, audio, image, video, link, profile information, or other
                  material that you transmit, upload, display, or otherwise make available
                  through the Community Features.
                </Bullet>
                <Bullet label="&ldquo;Report&rdquo;">
                  means a report submitted through the in-product reporting control described in
                  section 7.
                </Bullet>
              </Bullets>
            </Clause>

            <Clause n="1.4">
              <p>
                <T>Precedence.</T> If there is any conflict between these Rules and the Terms,
                the Terms prevail, except in respect of standards of conduct and enforcement,
                where these Rules prevail. Our handling of personal data is governed by the{" "}
                <Link
                  href="/legal/privacy"
                  className="font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-lime"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </Clause>

            <Clause n="1.5">
              <p>
                <T>Non-exhaustive.</T> The examples given in these Rules are illustrative and not
                exhaustive. Conduct that is not expressly listed may still breach these Rules
                where it is inconsistent with their purpose, which is to keep the Community
                Features safe, consensual, and usable for language learning.
              </p>
            </Clause>

            <Clause n="1.6">
              <p>
                <T>Interpretation.</T> Headings are for convenience only and do not affect
                interpretation. &ldquo;Including&rdquo; and &ldquo;in particular&rdquo; are
                without limitation. References to a section are to a section of these Rules.
              </p>
            </Clause>

            <Clause n="1.7">
              <p>
                <T>Availability.</T> The Community Features are optional and separable from the
                Learning Features. We may enable, disable, restrict, or withdraw any Community
                Feature, in whole or in part, at any time and without notice, including in a
                given territory or for a given Member.
              </p>
            </Clause>
          </Clauses>
        </Section>

        {/* ═══════════════════════════ 2 ═══════════════════════════ */}
        <Section id="eligibility" num="2" title="Eligibility and your account">
          <Clauses>
            <Clause n="2.1">
              <p>
                <T>Adults only.</T> The Community Features are restricted to adults. You must be
                at least 18 years of age, or such higher age of majority as applies where you
                live, to access or use any Community Feature. By accessing or using a Community
                Feature you represent and warrant that you meet this requirement.
              </p>
            </Clause>

            <Clause n="2.2">
              <p>
                <T>Under-18 Members.</T> Individuals under 18 may use the Learning Features where
                the Terms permit, subject to any parental-consent requirements set out in the
                Terms and the Privacy Policy. Individuals under 18 must not access, attempt to
                access, or arrange for another person to give them access to, any Community
                Feature, and must not appear in the community discovery roster, send or accept
                connection requests, exchange messages or voice notes, or join voice or video
                calls with other Members.
              </p>
            </Clause>

            <Clause n="2.3">
              <p>
                <T>How the age requirement is applied.</T> Before the Community Features are made
                available to you, we ask for your date of birth. That date is recorded against
                your account and your eligibility is determined by our servers from that date
                each time you attempt to use a Community Feature. A date of birth indicating that
                you are under 18 will be refused, and the Community Features will remain closed
                to you until the recorded date shows that you have reached 18.
              </p>
              <p>
                This is a declaration-based control. It is <T>not</T> identity verification, and
                we do not currently require documentary or third-party proof of age. We rely on
                the accuracy of the date you give us, on the controls in these Rules, and on
                Reports from Members. Supplying a false date of birth is a serious breach of
                these Rules and of the Terms.
              </p>
            </Clause>

            <Clause n="2.4">
              <p>
                <T>Further assurance.</T> We may at any time require you to re-confirm your age,
                and we may suspend or terminate access to the Community Features, or to your
                account, where we reasonably believe that you are under 18 or that you have given
                a false date of birth. Where we adopt additional age-assurance measures, they will
                be described at <Ph>AGE ASSURANCE NOTICE LOCATION</Ph>.
              </p>
            </Clause>

            <Clause n="2.5">
              <p>
                <T>One account.</T> You may hold only one Nurilang account. You must not create,
                operate, or control more than one account, share your account with any other
                person, allow another person to use your account, or transfer, sell, or offer
                your account to anyone.
              </p>
            </Clause>

            <Clause n="2.6">
              <p>
                <T>Accurate identity.</T> Your profile must describe you, truthfully. In
                particular you must ensure that:
              </p>
              <Bullets>
                <Bullet label="Name.">
                  the name on your profile is the name you are genuinely known by;
                </Bullet>
                <Bullet label="Photograph.">
                  any profile photograph is a genuine likeness of you, and is not a photograph of
                  another person, a stock image, or a synthetic or AI-generated likeness
                  presented as you;
                </Bullet>
                <Bullet label="Languages and location.">
                  the languages, city, and country on your profile are accurate; and
                </Bullet>
                <Bullet label="Credentials.">
                  any qualification, certificate, or teaching credential you list is one you
                  actually hold, and you do not overstate your fluency, experience, or
                  professional standing.
                </Bullet>
              </Bullets>
            </Clause>

            <Clause n="2.7">
              <p>
                <T>Re-registration.</T> If your access to the Community Features or your account
                has been suspended or terminated under section 8, you must not create a new
                account, or use another person&rsquo;s account, to regain access, unless we
                expressly permit it in writing.
              </p>
            </Clause>

            <Clause n="2.8">
              <p>
                <T>Account security.</T> Authentication is provided through our identity
                provider. You are responsible for keeping your credentials confidential and for
                all activity carried out through your account. You must notify us at{" "}
                <Ph>SECURITY CONTACT EMAIL</Ph> without undue delay if you suspect unauthorised
                use.
              </p>
            </Clause>
          </Clauses>
        </Section>

        {/* ═══════════════════════════ 3 ═══════════════════════════ */}
        <Section id="consent" num="3" title="Consent, connections, and blocking">
          <Clauses>
            <Clause n="3.1">
              <p>
                <T>Discovery is opt-in.</T> You are not visible to other Members by default. You
                appear in the community discovery roster only after you have enabled the exchange
                setting on your profile. You may disable it at any time, after which you will no
                longer appear to other Members in discovery.
              </p>
            </Clause>

            <Clause n="3.2">
              <p>
                <T>No contact without an accepted Connection.</T> You may not send a message or a
                voice note to, or start a voice or video call with, another Member unless a
                connection request between you has been accepted. Sending a connection request is
                the only means of first contact.
              </p>
            </Clause>

            <Clause n="3.3">
              <p>
                <T>Requests.</T> A connection request must be a genuine invitation to practise a
                language together. Any message included with a request must comply with section
                4. You must not use the request message field to deliver advertising, sexual
                content, abuse, or solicitations of any kind.
              </p>
            </Clause>

            <Clause n="3.4">
              <p>
                <T>A decline is a complete answer.</T> A Member who declines your request, or who
                does not respond to it, owes you no explanation. You must not send repeated
                requests to a Member who has declined or ignored you, and you must not use a
                second account or ask another Member to approach them on your behalf.
              </p>
            </Clause>

            <Clause n="3.5">
              <p>
                <T>Consent is continuing and may be withdrawn.</T> Accepting a Connection is
                consent to be contacted; it is not consent to any particular kind of contact, to
                contact at any frequency, or to contact indefinitely. A Member may withdraw
                consent at any time and without giving reasons, including by ceasing to reply,
                asking you to stop, declining a call, disabling discovery, or blocking you. Once
                consent is withdrawn you must stop contacting that Member through the Service and
                through any other channel.
              </p>
            </Clause>

            <Clause n="3.6">
              <p>
                <T>Blocking.</T> Every Member may block any other Member at any time. Blocking
                takes effect immediately and, at present, has the following effects: the two
                Members are hidden from one another in the discovery roster and in conversation
                lists; any pending connection request between them is declined; and any ringing
                or active call between them is ended.
              </p>
            </Clause>

            <Clause n="3.7">
              <p>
                <T>No circumvention.</T> You must not attempt to evade a block, a decline, or a
                withdrawal of consent, whether by creating another account, using another
                Member&rsquo;s account, asking a third party to make contact for you, or
                approaching the Member off the Service.
              </p>
            </Clause>

            <Clause n="3.8">
              <p>
                <T>Off-platform contact.</T> Moving a conversation to another platform, or meeting
                in person, is entirely a matter between you and the other Member and is at your
                own risk. The protections described in these Rules, including blocking and
                Reports, operate only within the Service. You must not pressure, persuade, or
                condition your participation on another Member giving you contact details, social
                media handles, or an in-person meeting.
              </p>
            </Clause>
          </Clauses>
        </Section>

        {/* ═══════════════════════════ 4 ═══════════════════════════ */}
        <Section id="prohibited" num="4" title="Prohibited conduct">
          <p className="mb-6">
            You must not do any of the following through the Community Features, whether directed
            at a Member, at the Operator, or at any third party, and whether in a profile,
            request message, text message, voice note, call, or group session.
          </p>
          <Clauses>
            <Clause n="4.1">
              <p>
                <T>Harassment and abuse.</T> Insults, degrading or demeaning remarks, persistent
                unwanted contact, intimidation, stalking, coordinated pile-ons, mocking a
                Member&rsquo;s accent, errors, or level of ability, or any conduct intended or
                reasonably likely to humiliate, distress, or wear down another Member.
              </p>
            </Clause>

            <Clause n="4.2">
              <p>
                <T>Hate speech and discrimination.</T> Content or conduct that attacks,
                dehumanises, demeans, or promotes hatred, violence, exclusion, or segregation
                against a person or group on the basis of race, ethnicity, national origin,
                immigration status, caste, colour, religion or belief, sex, gender, gender
                identity or expression, sexual orientation, age, disability, medical condition,
                pregnancy, marital status, or any other protected characteristic. This includes
                slurs, hateful symbols, and the denial or glorification of atrocities.
              </p>
            </Clause>

            <Clause n="4.3">
              <p>
                <T>Sexual content, nudity, and solicitation.</T> Sexually explicit or
                pornographic content; nudity or partial nudity; depictions or descriptions of
                sexual acts; sexual advances, propositions, or comments about a Member&rsquo;s
                body or appearance; requests for sexual images or performances; offering or
                soliciting sexual services, whether or not for payment; and use of the Community
                Features for dating, hook-ups, or romantic pursuit where the other Member has not
                clearly invited it. Nurilang is a language-learning service and not a dating
                service.
              </p>
            </Clause>

            <Clause n="4.4">
              <p>
                <T>Minors.</T> Any of the following is prohibited absolutely and without
                exception:
              </p>
              <Bullets>
                <Bullet>
                  contacting, or attempting to contact, any person you know or reasonably suspect
                  to be under 18 through the Community Features;
                </Bullet>
                <Bullet>
                  grooming, or any conduct intended to build a relationship with a minor for the
                  purpose of sexual exploitation, abuse, or exploitation of any other kind;
                </Bullet>
                <Bullet>
                  any sexualised content, discussion, or imagery involving a minor, including
                  drawn, animated, or synthetic material;
                </Bullet>
                <Bullet>
                  soliciting personal information, images, or private contact from a minor; and
                </Bullet>
                <Bullet>
                  facilitating a minor&rsquo;s access to the Community Features, including by
                  lending or sharing an account.
                </Bullet>
              </Bullets>
              <p>
                If you believe a Member is under 18, you must stop communicating with them and
                submit a Report under the underage-safety category immediately.
              </p>
            </Clause>

            <Clause n="4.5">
              <p>
                <T>Threats and violence.</T> Threats of violence or harm against any person;
                incitement, glorification, or coordination of violence; content supporting
                terrorist or violent extremist organisations; and threats to a Member&rsquo;s
                family, property, livelihood, or immigration status.
              </p>
            </Clause>

            <Clause n="4.6">
              <p>
                <T>Self-harm and dangerous behaviour.</T> Encouraging, instructing in, or
                glorifying suicide, self-harm, or disordered eating. This does not prevent a
                Member from disclosing their own experience in good faith. If you are concerned
                for someone&rsquo;s immediate safety, contact your local emergency services;
                Nurilang is not a crisis or emergency service and cannot intervene.
              </p>
            </Clause>

            <Clause n="4.7">
              <p>
                <T>Illegal activity.</T> Using the Community Features to commit, plan, promote,
                or facilitate any criminal offence or unlawful act, including the sale or supply
                of controlled drugs, weapons, stolen goods, counterfeit items, or other regulated
                or prohibited goods and services; human trafficking; money laundering; and the
                infringement of intellectual property rights.
              </p>
            </Clause>

            <Clause n="4.8">
              <p>
                <T>Spam and platform manipulation.</T> Unsolicited advertising or promotional
                material; bulk, repetitive, or automated messaging or connection requests;
                recruiting Members to other platforms, services, or causes; link-spamming;
                creating accounts by automated means; scraping, harvesting, or systematically
                collecting profile data; and circumventing or attempting to circumvent rate
                limits or other technical controls.
              </p>
            </Clause>

            <Clause n="4.9">
              <p>
                <T>Scams, fraud, and financial solicitation.</T> Deceiving a Member for financial
                or personal gain, including advance-fee, romance, investment, cryptocurrency, and
                employment scams; phishing for credentials or payment details; and asking any
                Member for money, gifts, loans, donations, top-ups, or financial assistance of
                any kind, whether framed as an emergency, a favour, or a business opportunity.
                Any payment for tuition must be made through the Service&rsquo;s own credit and
                marketplace features; arrangements made outside those features are at your own
                risk and are not supported, mediated, or refunded by us.
              </p>
            </Clause>

            <Clause n="4.10">
              <p>
                <T>Impersonation and misrepresentation.</T> Pretending to be another person, a
                Nurilang employee or moderator, a public figure, or a representative of any
                organisation; using another person&rsquo;s name, likeness, or credentials;
                falsely stating your age, identity, or qualifications; and misrepresenting your
                affiliation with the Operator.
              </p>
            </Clause>

            <Clause n="4.11">
              <p>
                <T>Recording and capture without consent.</T> Recording, screen-recording,
                screenshotting, photographing, transcribing, live-streaming, or otherwise
                capturing any call, message, voice note, or profile of another Member without
                that Member&rsquo;s prior express consent; and publishing, sharing, or
                redistributing any such capture. Section 5 sets out the position for calls in
                detail.
              </p>
            </Clause>

            <Clause n="4.12">
              <p>
                <T>Other people&rsquo;s personal data.</T> Disclosing or publishing another
                person&rsquo;s personal information without their consent, including their real
                name, home or work address, telephone number, email address, employer, place of
                study, immigration or health status, financial details, or exact location; and
                aggregating information about a Member from the Service and elsewhere. This
                applies equally to information about people who are not Members.
              </p>
            </Clause>

            <Clause n="4.13">
              <p>
                <T>Off-platform pressure.</T> Using contact obtained through the Service to
                pursue, pressure, or retaliate against a Member elsewhere, including contacting
                them on other platforms after they have withdrawn consent, contacting their
                employer, family, or associates, or threatening to disclose information about
                them.
              </p>
            </Clause>

            <Clause n="4.14">
              <p>
                <T>Misuse of safety tools.</T> Submitting Reports that you know to be false or
                that are made in bad faith, to harass a Member, to gain an advantage, or to
                overwhelm our review process.
              </p>
            </Clause>

            <Clause n="4.15">
              <p>
                <T>Technical abuse.</T> Interfering with or attempting to interfere with the
                Service, including probing or exploiting the signalling layer used to establish
                calls, injecting malformed data, attempting to obtain another Member&rsquo;s
                account identifiers, reverse engineering, or introducing malware.
              </p>
            </Clause>
          </Clauses>

          <Callout tone="alert" title="Zero tolerance">
            <p>
              Conduct falling within section 4.4 (minors), 4.5 (threats and violence), or 4.9
              (scams, fraud, and financial solicitation) will ordinarily result in immediate
              termination without prior warning, and may be referred to law enforcement or to the
              relevant child-protection authority in accordance with section 8.6.
            </p>
          </Callout>
        </Section>

        {/* ═══════════════════════════ 5 ═══════════════════════════ */}
        <Section id="calls" num="5" title="Voice and video calls">
          <Clauses>
            <Clause n="5.1">
              <p>
                <T>When a call may be placed.</T> You may call a Member only where you have an
                accepted Connection with them and they have discovery enabled. A call rings for a
                limited period and then lapses. Placing repeated calls to a Member who does not
                answer, or who has declined, is harassment under section 4.1.
              </p>
            </Clause>

            <Clause n="5.2">
              <p>
                <T>Everything in section 4 applies on camera.</T> The prohibitions in section 4
                apply in full to anything said, shown, worn, or displayed during a call.
              </p>
            </Clause>

            <Clause n="5.3">
              <p>
                <T>Appearance and setting.</T> You must be fully clothed and appropriately
                presented for the duration of any call. You must not appear nude or partially
                nude, engage in sexual activity, expose any part of the body that would
                ordinarily be covered, or display sexual content, weapons, illegal drugs, or
                hateful symbols on camera or in your background.
              </p>
            </Clause>

            <Clause n="5.4">
              <p>
                <T>Other people in frame.</T> You are responsible for your surroundings. You must
                not bring any other person into a call, or allow them to appear or be heard,
                without the informed consent of every participant. You must never bring a minor
                into frame or within audible range of a call.
              </p>
            </Clause>

            <Clause n="5.5">
              <p>
                <T>No recording without consent.</T> You must not record, capture, or retransmit
                a call, in whole or in part, by any means, unless every participant has given
                prior express consent. Consent to record must be sought before recording begins,
                may be limited in scope, and may be withdrawn at any time, at which point you
                must stop recording and must not use or share what was already captured. Consent
                to a recording is not consent to publish it.
              </p>
            </Clause>

            <Clause n="5.6">
              <p>
                <T>Ending a call.</T> Either participant may mute their microphone, turn off
                their camera, or end a call at any time, for any reason or none, and without
                explanation. You must not pressure a Member to keep their camera on, to stay on a
                call, or to justify leaving.
              </p>
            </Clause>

            <Clause n="5.7">
              <p>
                <T>How calls work, and what that means for you.</T> You should understand the
                following before you place or accept a call:
              </p>
              <Bullets>
                <Bullet label="Peer-to-peer.">
                  Calls use WebRTC and are established directly between the two participants
                  wherever the network allows.
                </Bullet>
                <Bullet label="No recording by us.">
                  We do not record, store, or retain the audio or video of calls. Our backend
                  relays only the signalling data needed to set up a call, namely session
                  descriptions and network candidates.
                </Bullet>
                <Bullet label="Relay servers.">
                  Where a direct connection cannot be established, encrypted call media may be
                  routed through a relay (TURN) server, which may be operated by a third-party
                  provider. Details of the providers we use are set out in the Privacy Policy.
                </Bullet>
                <Bullet label="Network information.">
                  Because calls are established directly between participants, network address
                  information about your device may be disclosed to the other participant, as is
                  inherent in this technology.
                </Bullet>
                <Bullet label="Consequences for investigation.">
                  Because we hold no recording of a call, we cannot independently verify what was
                  said or shown during one. Reports about calls are assessed on the basis of the
                  surrounding evidence available to us, including account and call metadata,
                  message history, and patterns of Reports across Members.
                </Bullet>
              </Bullets>
              <p>
                Nothing in this section 5.7 is a security guarantee. Do not use calls to
                communicate information you would not wish another participant to have.
              </p>
            </Clause>

            <Clause n="5.8">
              <p>
                <T>Local law on recording.</T> Recording a call may be a criminal offence or give
                rise to civil liability in your jurisdiction or in the other participant&rsquo;s
                jurisdiction, irrespective of these Rules. Complying with those laws is your
                responsibility.
              </p>
            </Clause>
          </Clauses>
        </Section>

        {/* ═══════════════════════════ 6 ═══════════════════════════ */}
        <Section id="content" num="6" title="Messages, voice notes, and content">
          <Clauses>
            <Clause n="6.1">
              <p>
                <T>Messages and voice notes are stored.</T> Unlike call media, text messages and
                voice notes sent through the Community Features are transmitted to and stored on
                our backend so that they can be delivered and re-read or replayed. They are not
                ephemeral and they are not end-to-end encrypted. Retention is described in the
                Privacy Policy.
              </p>
            </Clause>

            <Clause n="6.2">
              <p>
                <T>Access by the Operator.</T> We do not proactively monitor or read the content
                of one-to-one conversations. We retain the technical ability to access stored
                Content and will do so only where reasonably necessary to investigate a Report,
                to enforce these Rules or the Terms, to comply with a legal obligation or valid
                legal process, or to protect the rights, safety, or property of any person.
              </p>
            </Clause>

            <Clause n="6.3">
              <p>
                <T>Retention after enforcement.</T> Blocking a Member hides that Member from you
                but does not delete the messages already exchanged. Content and Reports may be
                retained after a block, suspension, or termination for audit, safety, and legal
                purposes, as described in the Privacy Policy.
              </p>
            </Clause>

            <Clause n="6.4">
              <p>
                <T>Responsibility for your Content.</T> You are solely responsible for your
                Content and you warrant that you have all rights necessary to send it and that it
                does not infringe the rights of any third party. Ownership and licensing of
                Content are dealt with in the Terms.
              </p>
            </Clause>

            <Clause n="6.5">
              <p>
                <T>Rate limits.</T> We apply limits to the number of messages, voice notes,
                connection requests, calls, and Reports that an account may generate in a given
                period. These limits exist to prevent abuse. You must not circumvent them, and we
                may vary them at any time.
              </p>
            </Clause>

            <Clause n="6.6">
              <p>
                <T>Removal.</T> We may remove, restrict access to, or refuse to transmit any
                Content that we reasonably consider to breach these Rules, the Terms, or
                applicable law, without prior notice.
              </p>
            </Clause>
          </Clauses>
        </Section>

        {/* ═══════════════════════════ 7 ═══════════════════════════ */}
        <Section id="reporting" num="7" title="Reporting">
          <Clauses>
            <Clause n="7.1">
              <p>
                <T>How to report.</T> A reporting control is available on a Member&rsquo;s
                profile within the community surface. When you submit a Report you select a
                category and may add a short description. The categories currently available are
                harassment, hate speech, sexual content, spam, impersonation, dangerous
                behaviour, privacy, underage safety, and other. Where you select
                &ldquo;other&rdquo;, a description is required.
              </p>
            </Clause>

            <Clause n="7.2">
              <p>
                <T>Blocking and reporting are different.</T> Blocking takes effect immediately
                and is a private matter between you and the blocked Member. Reporting brings the
                matter to our attention. You may do either, or both. Blocking a Member does not
                submit a Report.
              </p>
            </Clause>

            <Clause n="7.3">
              <p>
                <T>Confidentiality.</T> Reports are private. We do not tell the reported Member
                who reported them, and Reports are not shown to other Members. We may, however,
                be required to disclose the fact and content of a Report where compelled by law
                or valid legal process, or where disclosure is necessary to protect a person from
                serious harm.
              </p>
            </Clause>

            <Clause n="7.4">
              <p>
                <T>What happens next.</T> A submitted Report enters a private moderation queue
                and is assigned a status of open, under review, or closed. The queue is
                accessible only to personnel the Operator has expressly authorised. Reports are
                assessed against these Rules on the basis of the information available to us,
                which may include the Report itself, related Reports, account metadata, and
                stored Content where section 6.2 permits.
              </p>
            </Clause>

            <Clause n="7.5">
              <p>
                <T>No service level.</T> We aim to review Reports promptly and to prioritise
                those concerning safety of life, minors, and threats. We do not, however,
                guarantee any response time, any particular outcome, or that we will inform you
                of the outcome. Where we are required by applicable law to provide a statement of
                reasons or an acknowledgement, we will do so as required.
              </p>
            </Clause>

            <Clause n="7.6">
              <p>
                <T>Limits on reporting.</T> Repeat Reports about the same Member in the same
                category, while an earlier Report remains open, are consolidated rather than
                duplicated. A daily limit applies to the number of Reports one account may
                submit, currently ten in any twenty-four-hour period.
              </p>
            </Clause>

            <Clause n="7.7">
              <p>
                <T>Emergencies and crime.</T> Nurilang is not an emergency service. If you
                believe there is a risk to life or a crime is in progress, contact your local
                emergency services first. You may report a matter to us in addition to, but never
                instead of, reporting it to the competent authorities.
              </p>
            </Clause>

            <Clause n="7.8">
              <p>
                <T>Alternative channel.</T> If you cannot use the in-product control, or your
                concern relates to the conduct of the Operator, you may write to{" "}
                <Ph>SAFETY CONTACT EMAIL</Ph>. Legal notices should be sent to{" "}
                <Ph>LEGAL CONTACT EMAIL</Ph>.
              </p>
            </Clause>
          </Clauses>
        </Section>

        {/* ═══════════════════════════ 8 ═══════════════════════════ */}
        <Section id="enforcement" num="8" title="Enforcement">
          <Clauses>
            <Clause n="8.1">
              <p>
                <T>Our discretion.</T> We may take enforcement action where we reasonably
                consider that you have breached these Rules or the Terms, that your conduct
                presents a risk to another Member or to the Service, or that action is required
                by law. We may act with or without prior notice, and whether or not a Report has
                been made.
              </p>
            </Clause>

            <Clause n="8.2">
              <p>
                <T>Factors.</T> In deciding what action to take we may consider the seriousness
                of the conduct, whether it was deliberate, the harm caused or risked, whether it
                was repeated, your history on the Service, the reliability of the available
                evidence, and any explanation you have given.
              </p>
            </Clause>

            <Clause n="8.3">
              <p>
                <T>Enforcement ladder.</T> The measures available to us include, in ascending
                order of severity:
              </p>
              <Bullets>
                <Bullet label="(a) Informal warning.">
                  a notice reminding you of the standard expected.
                </Bullet>
                <Bullet label="(b) Formal warning.">
                  a recorded warning, which will be taken into account in any later decision.
                </Bullet>
                <Bullet label="(c) Content removal.">
                  removal of, or restriction of access to, specific Content, and removal or reset
                  of profile fields.
                </Bullet>
                <Bullet label="(d) Feature suspension.">
                  removal from the discovery roster, or suspension of your ability to send
                  connection requests, to message, to send voice notes, or to place or receive
                  calls, for a fixed or indefinite period.
                </Bullet>
                <Bullet label="(e) Account suspension.">
                  temporary suspension of access to the Service or to the Community Features.
                </Bullet>
                <Bullet label="(f) Termination.">
                  permanent termination of your access to the Community Features or of your
                  account.
                </Bullet>
              </Bullets>
            </Clause>

            <Clause n="8.4">
              <p>
                <T>No fixed sequence.</T> The ladder in section 8.3 describes the measures
                available to us; it does not create an entitlement to progress through them. We
                may apply any measure, including immediate termination, at first instance where
                the conduct is sufficiently serious, and in particular in the cases identified in
                section 4 as attracting zero tolerance.
              </p>
            </Clause>

            <Clause n="8.5">
              <p>
                <T>Effect of termination.</T> On termination your profile will cease to be
                visible in the Community Features and your Connections will end. The treatment of
                any credits, purchased hours, or scheduled sessions on termination is governed by
                the Terms at <Ph>TERMS SECTION REFERENCE</Ph>. Section 2.7 restricts
                re-registration.
              </p>
            </Clause>

            <Clause n="8.6">
              <p>
                <T>Referral to authorities.</T> We may report conduct to law enforcement, to a
                child-protection authority, or to another competent body, and may preserve and
                disclose related account records and Content, where we are required to do so by
                law or where we believe in good faith that doing so is necessary to prevent or
                address a serious crime or a risk of serious harm to any person.
              </p>
            </Clause>

            <Clause n="8.7">
              <p>
                <T>No obligation to act; no waiver.</T> Nothing in these Rules obliges us to
                monitor the Community Features or to take enforcement action in any particular
                case. A failure or delay in enforcing any provision of these Rules is not a
                waiver of that provision or of our right to enforce it later.
              </p>
            </Clause>

            <Clause n="8.8">
              <p>
                <T>Notice.</T> Where we take action under section 8.3(d) to (f) we will, where
                practicable and where not prohibited by law or inadvisable for safety reasons,
                notify you at the email address associated with your account, identify the
                measure taken, and indicate the basis for it.
              </p>
            </Clause>
          </Clauses>
        </Section>

        {/* ═══════════════════════════ 9 ═══════════════════════════ */}
        <Section id="appeals" num="9" title="Appeals">
          <Clauses>
            <Clause n="9.1">
              <p>
                <T>Right to appeal.</T> If we suspend or terminate your access under section
                8.3(d) to (f), you may appeal by writing to <Ph>APPEALS CONTACT EMAIL</Ph> within{" "}
                <Ph>NUMBER</Ph> days of the date of our notice, or of the date you became aware
                of the measure if no notice was given.
              </p>
            </Clause>

            <Clause n="9.2">
              <p>
                <T>What to include.</T> Your appeal should identify the account concerned and the
                measure appealed, and set out concisely why you consider the decision wrong,
                together with any information you wish us to take into account. You may submit an
                appeal in <Ph>APPEAL LANGUAGES</Ph>.
              </p>
            </Clause>

            <Clause n="9.3">
              <p>
                <T>How appeals are handled.</T> We will review the original decision together
                with any information you provide. Where operationally practicable the review will
                be carried out by a person who was not responsible for the original decision. We
                aim to respond within <Ph>NUMBER</Ph> days.
              </p>
            </Clause>

            <Clause n="9.4">
              <p>
                <T>Outcome.</T> On an appeal we may confirm, vary, or reverse the original
                decision, including by reinstating access on conditions. Our decision on appeal
                is final as a matter of these Rules.
              </p>
            </Clause>

            <Clause n="9.5">
              <p>
                <T>Abuse of the appeals process.</T> We may decline to consider appeals that are
                repetitive, manifestly unfounded, or abusive, and appeals from accounts
                terminated for conduct within section 4.4.
              </p>
            </Clause>

            <Clause n="9.6">
              <p>
                <T>Your other rights are unaffected.</T> Nothing in this section limits any right
                you have to bring a complaint before a competent authority or court, or any
                mandatory right you have under the law of your place of residence. Where
                applicable law provides for out-of-court dispute settlement in respect of content
                moderation decisions, details are set out at{" "}
                <Ph>OUT-OF-COURT DISPUTE SETTLEMENT DETAILS, IF APPLICABLE</Ph>.
              </p>
            </Clause>
          </Clauses>
        </Section>

        {/* ═══════════════════════════ 10 ═══════════════════════════ */}
        <Section id="changes" num="10" title="Changes to these Rules">
          <Clauses>
            <Clause n="10.1">
              <p>
                We may amend these Rules from time to time, including to reflect changes to the
                Community Features, to our safety practices, or to applicable law.
              </p>
            </Clause>

            <Clause n="10.2">
              <p>
                The current version is always published at this page. Every amendment updates the{" "}
                <T>Last updated</T> date shown at the top, and the amended Rules take effect on
                the <T>Effective date</T> stated there.
              </p>
            </Clause>

            <Clause n="10.3">
              <p>
                <T>Material changes.</T> Where an amendment materially affects your rights or
                obligations, we will give notice by <Ph>NOTICE METHOD</Ph> at least{" "}
                <Ph>NUMBER</Ph> days before it takes effect, unless the change is required to
                take effect sooner for legal or safety reasons.
              </p>
            </Clause>

            <Clause n="10.4">
              <p>
                <T>Acceptance.</T> Your continued use of the Community Features on or after the
                Effective date of an amendment constitutes acceptance of the amended Rules. If
                you do not accept them, you must stop using the Community Features and may close
                your account in accordance with the Terms.
              </p>
            </Clause>

            <Clause n="10.5">
              <p>
                <T>Superseded versions.</T> Previous versions of these Rules are available on
                request from <Ph>LEGAL CONTACT EMAIL</Ph>.
              </p>
            </Clause>
          </Clauses>
        </Section>

        {/* ═══════════════════════════ 11 ═══════════════════════════ */}
        <Section id="risk" num="11" title="No verification, risk, and liability">
          <Clauses>
            <Clause n="11.1">
              <p>
                <T>Members are independent third parties.</T> Members are not our employees,
                agents, or contractors. We do not select, endorse, supervise, or direct them.
              </p>
            </Clause>

            <Clause n="11.2">
              <p>
                <T>No verification.</T> Except for the declaration-based age control described in
                section 2.3, we do not verify the identity, age, nationality, location,
                qualifications, character, or criminal record of any Member, and we do not carry
                out background checks. Profile information is supplied by Members and is not
                checked by us. You are responsible for exercising your own judgement about whom
                you connect with, what you disclose, and whether to meet or transact with anyone
                off the Service.
              </p>
            </Clause>

            <Clause n="11.3">
              <p>
                <T>As is.</T> The Community Features are provided on an &ldquo;as is&rdquo; and
                &ldquo;as available&rdquo; basis. To the fullest extent permitted by law, we
                exclude all warranties, conditions, and representations that are not expressly
                set out in the Terms, including any warranty that the Community Features will be
                uninterrupted, secure, or free of objectionable Content or conduct.
              </p>
            </Clause>

            <Clause n="11.4">
              <p>
                <T>Limitation of liability.</T> Our liability arising out of or in connection
                with these Rules and your use of the Community Features is limited as set out in
                the Terms at <Ph>TERMS LIMITATION OF LIABILITY SECTION REFERENCE</Ph>. Subject to
                section 11.6, and to the fullest extent permitted by law: we are not liable for
                the acts or omissions of any Member; we are not liable for any indirect or
                consequential loss, or for loss of profit, revenue, goodwill, data, or
                opportunity; and our total aggregate liability is limited to{" "}
                <Ph>LIABILITY CAP</Ph>.
              </p>
            </Clause>

            <Clause n="11.5">
              <p>
                <T>Indemnity.</T> You agree to indemnify us in respect of claims arising from
                your breach of these Rules, on the terms set out in the Terms at{" "}
                <Ph>TERMS INDEMNITY SECTION REFERENCE</Ph>.
              </p>
            </Clause>

            <Clause n="11.6">
              <p>
                <T>Liabilities that cannot be excluded.</T> Nothing in these Rules excludes or
                limits our liability for death or personal injury caused by our negligence, for
                fraud or fraudulent misrepresentation, or for any other liability that cannot
                lawfully be excluded or limited. If you are a consumer, your statutory rights are
                not affected.
              </p>
            </Clause>
          </Clauses>
        </Section>

        {/* ═══════════════════════════ 12 ═══════════════════════════ */}
        <Section id="law" num="12" title="Governing law and general terms">
          <Clauses>
            <Clause n="12.1">
              <p>
                <T>Governing law.</T> These Rules and any dispute or claim arising out of or in
                connection with them, their subject matter, or their formation, whether
                contractual or non-contractual, are governed by and construed in accordance with
                the laws of <Ph>GOVERNING LAW JURISDICTION</Ph>, without regard to its
                conflict-of-laws rules.
              </p>
            </Clause>

            <Clause n="12.2">
              <p>
                <T>Jurisdiction.</T> The courts of <Ph>COURTS / EXCLUSIVE JURISDICTION</Ph> have{" "}
                <Ph>EXCLUSIVE OR NON-EXCLUSIVE</Ph> jurisdiction to settle any such dispute or
                claim, subject to any dispute-resolution procedure set out in the Terms at{" "}
                <Ph>TERMS DISPUTE RESOLUTION SECTION REFERENCE</Ph>.
              </p>
            </Clause>

            <Clause n="12.3">
              <p>
                <T>Mandatory consumer rights.</T> If you are a consumer resident in a
                jurisdiction whose law gives you the benefit of mandatory protections or the
                right to bring proceedings in your local courts, sections 12.1 and 12.2 do not
                deprive you of those rights.
              </p>
            </Clause>

            <Clause n="12.4">
              <p>
                <T>Severability.</T> If any provision of these Rules is held to be invalid,
                unlawful, or unenforceable, it will be severed to the minimum extent necessary
                and the remaining provisions will continue in full force.
              </p>
            </Clause>

            <Clause n="12.5">
              <p>
                <T>Survival.</T> Sections 6.3, 8.5, 8.6, 11, and 12 survive the termination of
                your account or of these Rules.
              </p>
            </Clause>

            <Clause n="12.6">
              <p>
                <T>Language.</T> These Rules are drafted in English. Where we provide a
                translation, the English version prevails in the event of any inconsistency, to
                the extent permitted by applicable law.
              </p>
            </Clause>

            <Clause n="12.7">
              <p>
                <T>Third parties.</T> A person who is not a party to these Rules has no right to
                enforce any of their provisions.
              </p>
            </Clause>
          </Clauses>
        </Section>

        {/* ═══════════════════════════ 13 ═══════════════════════════ */}
        <Section id="contact" num="13" title="Contact">
          <Clauses>
            <Clause n="13.1">
              <p>You can reach us as follows:</p>
              <Bullets>
                <Bullet label="Safety and conduct concerns:">
                  <Ph>SAFETY CONTACT EMAIL</Ph>
                </Bullet>
                <Bullet label="Appeals:">
                  <Ph>APPEALS CONTACT EMAIL</Ph>
                </Bullet>
                <Bullet label="Legal notices:">
                  <Ph>LEGAL CONTACT EMAIL</Ph>
                </Bullet>
                <Bullet label="Account security:">
                  <Ph>SECURITY CONTACT EMAIL</Ph>
                </Bullet>
                <Bullet label="Privacy and data protection:">
                  <Ph>DATA PROTECTION CONTACT</Ph>
                  {", "}
                  <Ph>DPO NAME AND CONTACT DETAILS, IF APPOINTED</Ph>
                </Bullet>
                <Bullet label="Postal address:">
                  <Ph>LEGAL ENTITY NAME</Ph>
                  {", "}
                  <Ph>REGISTERED ADDRESS</Ph>
                </Bullet>
              </Bullets>
            </Clause>

            <Clause n="13.2">
              <p>
                Where applicable law requires us to designate a point of contact for authorities
                or a legal representative, those details are set out at{" "}
                <Ph>REGULATORY POINT OF CONTACT / LEGAL REPRESENTATIVE, IF REQUIRED</Ph>.
              </p>
            </Clause>
          </Clauses>
        </Section>
      </div>

      {/* ───────────────────────── related documents ───────────────────────── */}
      <nav aria-label="Related documents" className="mt-14 border-t border-line pt-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">Read next</p>
        <ul className="mt-4 flex flex-wrap gap-3">
          <li>
            <Link
              href="/legal/terms"
              className="pill border border-line bg-white/5 px-5 py-2.5 text-sm font-semibold text-ink"
            >
              Terms of Service
            </Link>
          </li>
          <li>
            <Link
              href="/legal/privacy"
              className="pill border border-line bg-white/5 px-5 py-2.5 text-sm font-semibold text-ink"
            >
              Privacy Policy
            </Link>
          </li>
        </ul>
      </nav>
    </article>
  );
}
