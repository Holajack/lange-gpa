import type { Metadata } from "next";
import Link from "next/link";

/**
 * /legal/recording-consent — the Recording, Consent and Communications notice.
 *
 * Server component: static long-form legal text, no client state. The technical
 * description was checked against src/components/CallProvider.tsx, convex/calls.ts,
 * convex/messages.ts, convex/schema.ts, src/app/(app)/session/useRecorder.ts and
 * src/app/(app)/session/ConsentDialog.tsx. Values that cannot be established from
 * the repository are left as [BRACKETED PLACEHOLDERS].
 *
 * The surrounding chrome (nav/footer) is expected from src/app/legal/layout.tsx.
 */

export const metadata: Metadata = {
  title: "Recording, Consent & Communications",
  description:
    "How Nurilang calls work technically, why Nurilang does not record them, the rules on recording other users, what is stored and for how long, and how to withdraw consent, block, or delete.",
  alternates: { canonical: "/legal/recording-consent" },
};

/* ------------------------------- primitives ------------------------------- */

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

function Callout({
  children,
  tone = "violet",
}: {
  children: React.ReactNode;
  tone?: "violet" | "coral";
}) {
  const skin =
    tone === "coral" ? "border-coral/30 bg-coral/5" : "border-violet/25 bg-violet/5";
  return (
    <div className={`card p-5 ${skin}`}>
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
  { id: "purpose", n: 1, title: "Purpose and scope" },
  { id: "definitions", n: 2, title: "Defined terms" },
  { id: "how-calls-work", n: 3, title: "How one-to-one calls work" },
  { id: "no-recording", n: 4, title: "Nurilang does not record calls" },
  { id: "user-recording", n: 5, title: "Recording by users is prohibited without consent" },
  { id: "jurisdiction", n: 6, title: "Recording law varies by jurisdiction" },
  { id: "session-recorder", n: 7, title: "The in-session recording tool" },
  { id: "practice", n: 8, title: "Practice recordings" },
  { id: "stored", n: 9, title: "What is stored, and for how long" },
  { id: "withdraw", n: 10, title: "Withdrawing consent, blocking and deleting" },
  { id: "safety-retention", n: 11, title: "Data preserved for safety investigations" },
  { id: "reporting", n: 12, title: "Reporting unlawful recording or misuse" },
  { id: "enforcement", n: 13, title: "Enforcement" },
  { id: "liability", n: 14, title: "Limitation of liability" },
  { id: "law", n: 15, title: "Governing law and jurisdiction" },
  { id: "changes", n: 16, title: "Changes and contact" },
];

export default function RecordingConsentPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      {/* ------------------------------- masthead ------------------------------ */}
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">
          Nurilang — Legal
        </p>
        <h1 className="headline mt-3 text-4xl leading-[1.05] sm:text-5xl">
          Recording, Consent &amp; Communications
        </h1>
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
          This notice explains, in technical and legal terms, how communication between Nurilang users
          actually works: what happens to a call, what the platform stores, what it does not store,
          what you are and are not permitted to record, and how to withdraw from all of it. It forms
          part of, and should be read with, the{" "}
          <Link
            href="/legal/privacy"
            className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-lime"
          >
            Nurilang Privacy Policy
          </Link>
          .
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
        <Section id="purpose" n={1} title="Purpose and scope">
          <Clause n="1.1">
            <P>
              Language learning is intimate. You will speak badly in front of someone, laugh at
              yourself, and say things you would not put in writing. That only works if both people
              know exactly what is being captured and what is not. This notice states it precisely.
            </P>
          </Clause>
          <Clause n="1.2">
            <P>
              This notice applies to all communication surfaces of the Service: one-to-one text
              messages, voice notes, one-to-one voice and video calls, and the recording tool provided
              inside a live learning session.
            </P>
          </Clause>
          <Clause n="1.3">
            <P>
              It binds every user. Breaching Section 5 is a breach of the Nurilang Terms of Service at{" "}
              <Ph>TERMS OF SERVICE URL</Ph> and may also be a criminal offence or an actionable civil
              wrong in your jurisdiction.
            </P>
          </Clause>
          <Clause n="1.4">
            <P>
              This notice is not legal advice. Recording law is territorial and fact-sensitive. If you
              intend to record another person, take your own advice.
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 2 */}
        <Section id="definitions" n={2} title="Defined terms">
          <P>Terms defined in the Privacy Policy have the same meaning here. In addition:</P>
          <List>
            <li>
              <Term>Call</Term> means a one-to-one voice or video conversation between two connected
              users, carried over WebRTC.
            </li>
            <li>
              <Term>Call Media</Term> means the live audio and video streams exchanged during a Call.
            </li>
            <li>
              <Term>Signalling Data</Term> means the technical information exchanged through our
              backend to set a Call up: the session description negotiated between the two browsers,
              the network candidates each browser offers, and the associated call record.
            </li>
            <li>
              <Term>Session Recording</Term> means a recording made using the recording tool built into
              a live learning session, as described in Section 7.
            </li>
            <li>
              <Term>Voice Note</Term> means a recorded audio message sent to a connected user through
              the messaging surface.
            </li>
            <li>
              <Term>Record</Term> means to capture, copy, or fix in any medium the audio, video,
              image, or text of a communication, by any means, including screen recording,
              screenshotting, an external device, or third-party software.
            </li>
          </List>
        </Section>

        {/* ------------------------------------------------------------------ 3 */}
        <Section id="how-calls-work" n={3} title="How one-to-one calls work">
          <Clause n="3.1" title="Calls are peer-to-peer">
            <P>
              A Call is established directly between the two participants&rsquo; browsers using WebRTC.
              When a direct route exists, <Strong>Call Media travels from one device to the other and
              does not pass through Nurilang&rsquo;s servers at all.</Strong> There is no server-side
              media pipeline, no mixing service, and no recording infrastructure in the path.
            </P>
          </Clause>

          <Clause n="3.2" title="What our backend actually handles">
            <P>
              Our backend performs signalling only. To let two browsers find each other, it stores and
              relays:
            </P>
            <List>
              <li>a call record — who is calling whom, the caller&rsquo;s display name, the status of
                the Call (ringing, active, declined, or ended), and the time it started;</li>
              <li>
                the session description each browser produces to describe its media capabilities; and
              </li>
              <li>the network candidates each browser produces so a route can be found.</li>
            </List>
            <P>
              <Strong>
                Network candidates ordinarily contain IP addresses, including your device&rsquo;s local
                network address and its public address.
              </Strong>{" "}
              We disclose this because it is inherent to WebRTC rather than a choice we made, and
              because it is the one piece of call data that is genuinely revealing. It is stored on our
              backend as described in Section 9 and is not shown to other users in the interface,
              although it is by design transmitted to the other participant&rsquo;s browser in order
              to establish the Call.
            </P>
          </Clause>

          <Clause n="3.3" title="Finding a route: STUN">
            <P>
              To discover how your device appears from the public internet, your browser queries public
              STUN servers operated by Google. A STUN query reveals your public network address to that
              server. It carries no account information, no message content, and no media.
            </P>
          </Clause>

          <Clause n="3.4" title="When a direct connection fails: the TURN relay">
            <P>
              Some networks — many mobile carriers, corporate networks, hotel Wi-Fi — will not permit a
              direct connection between two devices. In that case the Call falls back to a{" "}
              <Term>TURN relay</Term>: a server that forwards packets between the two participants.
            </P>
            <P>
              <Strong>
                The relay carries encrypted media only. It forwards ciphertext, does not hold the keys
                to the Call, and does not store the media.
              </Strong>{" "}
              WebRTC encrypts media between the two endpoints, and that encryption is not terminated at
              the relay. The relay does necessarily see the network addresses of both participants
              because it sits between them.
            </P>
            <P>
              The relay in use for this deployment is <Ph>TURN PROVIDER IN EFFECT</Ph>. Where no
              dedicated relay is configured, the Service falls back to a free public relay service, in
              which case the operator of that service is a recipient of the relayed traffic on its own
              terms rather than a processor engaged by us. Confirm the configured provider at{" "}
              <Ph>TURN PROVIDER CONFIGURATION REFERENCE</Ph> before relying on this clause.
            </P>
          </Clause>

          <Clause n="3.5" title="Encryption">
            <P>
              WebRTC media is encrypted by the browser using DTLS-SRTP. This is mandatory in the
              protocol and is not something either participant can switch off. Signalling to our
              backend travels over HTTPS.
            </P>
            <P>
              Note the distinction: <Strong>Call Media is encrypted between the two of you</Strong>,
              whereas <Strong>text messages and Voice Notes are not end-to-end encrypted</Strong> and
              are stored in a form we can technically read. See Section 9.
            </P>
          </Clause>

          <Clause n="3.6" title="Who may call you">
            <P>
              A Call can only be placed where every one of the following is true, each enforced on the
              server rather than in your browser:
            </P>
            <List ordered>
              <li>calling is enabled for the deployment;</li>
              <li>both people are eligible to use the Community Features, including the 18+ rule;</li>
              <li>the person being called has opted in to the community exchange;</li>
              <li>the two of you have an accepted Connection; and</li>
              <li>neither of you has blocked the other.</li>
            </List>
            <P>
              A stranger cannot ring you. An unanswered Call stops ringing after sixty seconds, and a
              short cooldown prevents a caller from ringing you repeatedly in quick succession.
            </P>
          </Clause>

          <Clause n="3.7" title="Controls during a Call">
            <P>
              During a Call you can mute your microphone, turn your camera off, and end the Call at any
              time. Muting and camera-off disable the relevant track at your device, so nothing is
              captured or sent while they are engaged. Before a Call connects, the Service checks that
              it can access your microphone and camera and tells you if it cannot, rather than failing
              silently.
            </P>
            <P>
              Blocking someone ends any Call in progress between you and prevents further contact. See
              Section 10.
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 4 */}
        <Section id="no-recording" n={4} title="Nurilang does not record calls">
          <Callout>
            <p>
              <Strong>
                Nurilang does not record, store, transcribe, analyse, or listen to the audio or video
                of a Call.
              </Strong>{" "}
              No recording of Call Media is created on our systems, because Call Media never reaches
              our systems in a readable form. There is no archive of your calls for us to search, hand
              over, lose, or repurpose — and none for you to request, because none exists.
            </p>
          </Callout>
          <Clause n="4.1">
            <P>
              It follows that a subject access request for the content of a Call cannot be satisfied:
              we hold no such content. We can provide the Signalling Data described in Section 9, which
              tells you that a Call happened, with whom, and when, but not what was said.
            </P>
          </Clause>
          <Clause n="4.2">
            <P>
              It also follows that we cannot substantiate a report about what was said on a Call from
              our own records. Where a Call is the subject of a safety report, we assess it on the
              surrounding evidence — the reporter&rsquo;s account, the connection and call metadata, the
              text and voice-note history between the parties, and the reported user&rsquo;s wider
              record. This limitation is the direct consequence of not recording, and we accept it
              deliberately.
            </P>
          </Clause>
          <Clause n="4.3">
            <P>
              If this ever changes — if any form of server-side call recording, transcription, or
              analysis is introduced — we will not do it silently. We will update this notice, notify
              affected users in advance, and obtain consent where consent is the applicable basis.
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 5 */}
        <Section id="user-recording" n={5} title="Recording by users is prohibited without consent">
          <Callout tone="coral">
            <p>
              <Strong>
                You must not Record another user, in whole or in part, without their express, informed,
                prior consent.
              </Strong>{" "}
              This applies to Calls, Voice Notes, text conversations, live learning sessions, and every
              other communication surface of the Service.
            </p>
          </Callout>

          <Clause n="5.1" title="What the prohibition covers">
            <P>Without the other person&rsquo;s express prior consent, you must not:</P>
            <List>
              <li>record the audio or video of a Call, by any means;</li>
              <li>
                screen-record, screenshot, or photograph a Call, a chat thread, a profile, or any part
                of the interface showing another person;
              </li>
              <li>
                use a second device, a virtual camera or microphone, a browser extension, or any
                third-party capture or transcription software to capture another person;
              </li>
              <li>re-record, forward, or re-publish a Voice Note another person sent you; or</li>
              <li>
                run automated transcription, voice cloning, voice or facial recognition, or any other
                biometric or machine-learning process on another person&rsquo;s voice or image.
              </li>
            </List>
          </Clause>

          <Clause n="5.2" title="What valid consent looks like">
            <P>Consent under this Section must be:</P>
            <List>
              <li>
                <Strong>Express</Strong> — actually asked for and actually given. Silence, absence of
                objection, or a general assumption that recording is normal is not consent.
              </li>
              <li>
                <Strong>Informed</Strong> — the other person must know what will be captured, why, where
                it will be stored, how long you will keep it, and who else will see it.
              </li>
              <li>
                <Strong>Prior</Strong> — obtained before recording starts. Retrospective consent does not
                cure an unlawful recording.
              </li>
              <li>
                <Strong>Specific</Strong> — for this occasion. Consent once is not consent always.
              </li>
              <li>
                <Strong>Freely given and revocable</Strong> — the other person may refuse without
                explanation and may withdraw at any point, at which moment you must stop recording.
              </li>
            </List>
          </Clause>

          <Clause n="5.3" title="If you do record with consent, you take on obligations">
            <P>
              A recording of another person is that person&rsquo;s personal data. If you record them
              lawfully, <Strong>you</Strong>, not Nurilang, are the controller of that recording. You are
              responsible for keeping it secure, for using it only for the purpose you stated, for not
              publishing or sharing it beyond that purpose, for deleting it when asked or when the
              purpose ends, and for complying with the data protection law that applies to you.
            </P>
          </Clause>

          <Clause n="5.4" title="Never for these purposes">
            <P>
              Even with consent, a recording made through the Service must never be used to harass,
              intimidate, blackmail, dox, defame, or sexually exploit any person; to train a machine
              learning model on a person&rsquo;s voice or likeness; to create synthetic or manipulated
              media of a person; or for any commercial purpose not expressly agreed by that person.
            </P>
          </Clause>

          <Clause n="5.5" title="What we can and cannot do about it">
            <P>
              We are candid about the limits here. Because Call Media never reaches our servers, we
              cannot technically detect or block a recording made by the other participant&rsquo;s
              device. No platform can. This prohibition is a contractual and legal control, not a
              technical one. Treat any Call as you would treat a conversation in a room with someone you
              have recently met.
            </P>
            <P>
              What we can do, and will, is act on reports. See Sections 12 and 13.
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 6 */}
        <Section id="jurisdiction" n={6} title="Recording law varies by jurisdiction">
          <Clause n="6.1" title="One-party and all-party consent">
            <P>
              Whether recording a conversation is lawful depends on where each participant is. Broadly,
              two regimes exist:
            </P>
            <List>
              <li>
                <Strong>One-party consent</Strong> — it is lawful for a participant to record a
                conversation they are part of, without telling the others.
              </li>
              <li>
                <Strong>All-party consent</Strong> — every participant must consent. Recording without
                that consent can be a criminal offence and can give rise to civil liability, statutory
                damages, and the recording being inadmissible.
              </li>
            </List>
            <P>
              Both regimes exist within single countries. Several jurisdictions apply all-party consent
              while their neighbours do not.
            </P>
          </Clause>

          <Clause n="6.2" title="Cross-border calls">
            <P>
              Nurilang exists to connect people in different countries, so a Call will frequently span
              two legal systems. The law of more than one of them may apply at once, and the safe
              assumption is that{" "}
              <Strong>
                the strictest rule applicable to any participant governs the whole conversation.
              </Strong>
            </P>
          </Clause>

          <Clause n="6.3" title="Other laws may also apply">
            <P>
              Beyond wiretapping and interception statutes, a recording may engage data protection law,
              image and personality rights, copyright in the recorded performance, and criminal
              provisions on intimate imagery and synthetic media. The absence of a wiretapping offence
              in your jurisdiction does not make a recording lawful.
            </P>
          </Clause>

          <Clause n="6.4" title="You are responsible for your own jurisdiction">
            <P>
              <Strong>
                It is your responsibility, not ours, to know and comply with the law that applies to
                you and to the person you are speaking to.
              </Strong>{" "}
              We do not advise on it, and we do not determine it for you. Our rule in Section 5 —
              express prior consent, every time — is deliberately stricter than the most permissive
              regimes, because following it keeps you compliant in all of them.
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 7 */}
        <Section id="session-recorder" n={7} title="The in-session recording tool">
          <Clause n="7.1" title="Why it exists">
            <P>
              A live learning session may be recorded using a tool built into the session screen. Its
              purpose is the Growing Participator Approach practice of the &ldquo;talking picture
              dictionary&rdquo;: the learner listens back afterwards to the same voice, the same
              pictures, and the same laughter, without translation. It is optional. Declining leaves the
              session entirely unaffected.
            </P>
          </Clause>

          <Clause n="7.2" title="What it captures">
            <P>
              The microphone by default, and the camera additionally only if you have switched the
              camera on before starting. Recording runs on <Strong>your</Strong> device and captures
              what your device can hear and see — which, in a live session, includes the other
              participant.
            </P>
          </Clause>

          <Clause n="7.3" title="The consent gate">
            <P>
              Nothing records until consent has been given through the in-session consent dialog. The
              dialog states what is captured, why, and where it is stored, before anyone agrees. Where a
              live session involves another person, <Strong>both participants must be named and both
              must agree</Strong> before recording can begin; the agreement box is never pre-ticked, and
              a fresh agreement is required each time the dialog opens.
            </P>
            <P>
              <Strong>Consent is not persisted.</Strong> It lasts for the running session only. There is
              no setting that keeps a session partner on the record indefinitely, deliberately.
            </P>
          </Clause>

          <Clause n="7.4" title="Where the recording lives">
            <P>
              <Strong>On your device only.</Strong> The recording is assembled in your browser and never
              uploaded to Nurilang. We do not receive it, store it, or have any means of retrieving it.
              You may play it back and save it locally. Once you save a copy, that copy is entirely
              outside the Service and outside our control.
            </P>
          </Clause>

          <Clause n="7.5" title="Your obligations for a saved recording">
            <P>
              A saved Session Recording contains another identifiable person. Clause 5.3 applies to it in
              full: you are the controller of that file. In particular you must not share or publish it
              without that person&rsquo;s separate consent, and you must delete it if they ask you to.
            </P>
          </Clause>

          <Clause n="7.6" title="If a partner declines">
            <P>
              Declining is a complete answer. Pressuring a partner to agree, or starting a recording
              after they have declined, is a breach of Section 5 and of our community standards, and is
              reportable.
            </P>
          </Clause>

          <Clause n="7.7">
            <P>
              <Ph>
                IMPLEMENTATION NOTE — CONFIRM THAT THE IN-SESSION RECORDING TOOL AND ITS CONSENT DIALOG
                ARE ENABLED IN THE DEPLOYED BUILD BEFORE PUBLICATION
              </Ph>
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 8 */}
        <Section id="practice" n={8} title="Practice recordings">
          <Clause n="8.1">
            <P>
              Speaking practice lets you record your own voice and play it back to compare it with a
              model. That recording is created in your browser, held in memory for the exercise, and{" "}
              <Strong>never uploaded</Strong>. It is discarded when you leave the exercise. No other
              person is involved and no consent question arises.
            </P>
          </Clause>
          <Clause n="8.2">
            <P>
              Your browser will ask for microphone permission. Refusing it does not block the exercise;
              the Service falls back to a simulated take.
            </P>
          </Clause>
        </Section>

        {/* ------------------------------------------------------------------ 9 */}
        <Section id="stored" n={9} title="What is stored, and for how long">
          <Clause n="9.1">
            <P>
              The table below is the complete picture for the communication surfaces. Retention periods
              are set out in Section 12 of the{" "}
              <Link
                href="/legal/privacy"
                className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-lime"
              >
                Privacy Policy
              </Link>{" "}
              and repeated here for convenience.
            </P>
          </Clause>

          <Table
            head={["Surface", "Stored on our systems?", "Retention"]}
            rows={[
              [
                "Call audio and video",
                <>
                  <Strong>No.</Strong> Never captured, never stored, never transcribed.
                </>,
                "Not applicable",
              ],
              [
                "Call record and signalling",
                <>
                  <Strong>Yes.</Strong> Participants, caller display name, status, timestamp, the
                  negotiated session description, and the network candidates — which contain IP
                  addresses.
                </>,
                <Ph>CALL SIGNALLING RETENTION PERIOD</Ph>,
              ],
              [
                "Text messages",
                <>
                  <Strong>Yes.</Strong> Full message content, sender and recipient, display name,
                  timestamp, and read state. Not end-to-end encrypted; readable by us.
                </>,
                <Ph>MESSAGE RETENTION PERIOD</Ph>,
              ],
              [
                "Voice notes",
                <>
                  <Strong>Yes — the audio file itself is stored</Strong> in our backend file storage, so
                  the recipient can play it back, together with its duration and timestamp. Not
                  end-to-end encrypted.
                </>,
                <Ph>VOICE NOTE RETENTION PERIOD</Ph>,
              ],
              [
                "Connection requests and Connections",
                <>
                  <Strong>Yes.</Strong> Both display names, the language proposed, any message attached
                  to the request, status, and timestamp.
                </>,
                <Ph>CONNECTION RETENTION PERIOD</Ph>,
              ],
              [
                "Blocks",
                <>
                  <Strong>Yes.</Strong> Who blocked whom, and when. Never shown to the person blocked.
                </>,
                <Ph>BLOCK RETENTION PERIOD</Ph>,
              ],
              [
                "Safety reports",
                <>
                  <Strong>Yes.</Strong> Reporter, reported user, category, your description of up to 500
                  characters, status, and timestamps. Visible only to allowlisted moderators.
                </>,
                <Ph>SAFETY REPORT RETENTION PERIOD</Ph>,
              ],
              [
                "In-session recordings",
                <>
                  <Strong>No.</Strong> Held on your device only; never uploaded.
                </>,
                "Controlled entirely by you",
              ],
              [
                "Speaking-practice recordings",
                <>
                  <Strong>No.</Strong> Held in your browser for the exercise only.
                </>,
                "Discarded when you leave the exercise",
              ],
            ]}
          />

          <Clause n="9.2" title="Limits that apply">
            <P>
              A text message may be up to 2,000 characters. A Voice Note must be between one second and
              five minutes. Messages, Voice Notes, Calls, and reports are rate-limited to constrain
              abuse.
            </P>
          </Clause>

          <Clause n="9.3" title="Who can see stored communications">
            <P>
              Your conversations are returned only to the two participants. Message content is not
              exposed in discovery, in the moderation queue by default, or to any other user. Access by
              our personnel is limited to the circumstances in clause 11.2.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 10 */}
        <Section id="withdraw" n={10} title="Withdrawing consent, blocking and deleting">
          <Clause n="10.1" title="Turn off discovery">
            <P>
              Disabling the language-exchange setting in your profile withdraws your consent to appear
              in discovery. You stop appearing in other users&rsquo; results. Existing Connections and
              conversations are not deleted by this step; use clauses 10.2 to 10.4 for that.
            </P>
          </Clause>

          <Clause n="10.2" title="Block someone">
            <P>Blocking a user takes effect immediately and, on our systems:</P>
            <List>
              <li>hides each of you from the other in discovery, in both directions;</li>
              <li>declines any pending connection request between you;</li>
              <li>ends any Call in progress between you and prevents new ones;</li>
              <li>prevents any further message or Voice Note in either direction; and</li>
              <li>
                removes the conversation and any unread count from the interface for both of you.
              </li>
            </List>
            <P>
              A block is private. The person blocked is not told. You can see and reverse your own
              blocks in your settings.
            </P>
          </Clause>

          <Clause n="10.3" title="Report someone">
            <P>
              Reporting is separate from blocking and you should usually do both. A report goes to a
              moderation queue reviewed by a person on a restricted allowlist. Reports are never shown
              to the person reported.
            </P>
          </Clause>

          <Clause n="10.4" title="Delete content, or your account">
            <P>
              To delete specific messages or Voice Notes, or to close your account and delete the
              associated data, follow the process at <Ph>DELETION PROCESS OR URL</Ph> or write to{" "}
              <Ph>PRIVACY CONTACT EMAIL</Ph>. We act on verified requests within the timescales in
              Section 14 of the Privacy Policy.
            </P>
          </Clause>

          <Clause n="10.5" title="What withdrawal cannot undo">
            <P>Be realistic about the limits of any deletion right:</P>
            <List>
              <li>
                withdrawal is not retroactive — it does not affect the lawfulness of processing carried
                out beforehand;
              </li>
              <li>
                deleting a conversation on our systems does not recall a copy the other person has
                already read, screenshotted, downloaded, or saved elsewhere;
              </li>
              <li>
                deleted data may persist briefly in encrypted backups before being overwritten in the
                ordinary course; and
              </li>
              <li>
                the records in Section 11 are retained even where the rest of your data is deleted.
              </li>
            </List>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 11 */}
        <Section id="safety-retention" n={11} title="Data preserved for safety investigations">
          <Callout>
            <p>
              Some records survive deletion. A person who harasses someone and then deletes their
              account must not be able to erase the trail and return. Article 17(3) GDPR permits
              retention where processing is necessary for compliance with a legal obligation or for the
              establishment, exercise, or defence of legal claims, and we rely on that.
            </p>
          </Callout>

          <Clause n="11.1" title="What is preserved">
            <P>
              Where necessary and proportionate for a safety, legal, or enforcement purpose, we retain:
            </P>
            <List>
              <li>
                <Strong>Safety reports</Strong> — the report, its category, your description, and its
                outcome, so that a pattern across multiple reporters can be identified;
              </li>
              <li>
                <Strong>Block records</Strong> — so that a block continues to be enforced and cannot be
                circumvented;
              </li>
              <li>
                <Strong>Moderation and enforcement records</Strong> — the decision taken, its reasons,
                and the identifiers necessary to enforce it, including against a re-registration
                attempt;
              </li>
              <li>
                <Strong>Evidence relevant to an open investigation</Strong> — including message or
                Voice Note content preserved under a hold, retained for the investigation and any
                resulting proceedings;
              </li>
              <li>
                <Strong>Records required by law</Strong> — including anything subject to a legal
                preservation obligation or lawful request.
              </li>
            </List>
          </Clause>

          <Clause n="11.2" title="Limits on that retention">
            <P>
              Preserved records are held for <Ph>SAFETY PRESERVATION PERIOD</Ph>, or for the duration of
              the investigation, dispute, or legal obligation if longer, and are then deleted. They are
              restricted to <Ph>ROLES AUTHORISED TO ACCESS PRESERVED SAFETY RECORDS</Ph>, are not used
              for any purpose other than safety, legal compliance, and enforcement, and are never used
              for personalisation or marketing.
            </P>
          </Clause>

          <Clause n="11.3" title="Your rights are not extinguished">
            <P>
              You may still request access to preserved records and may object to their retention under
              Article 21 GDPR. We will consider each request on its merits and will explain our reasons
              if we decline. Content authored by another person, and information that would identify a
              reporter, may be withheld or redacted to protect that person&rsquo;s rights.
            </P>
          </Clause>

          <Clause n="11.4" title="Reporters are protected">
            <P>
              The identity of a reporter is not disclosed to the person reported. If you report someone
              and then delete your account, your report is not withdrawn and continues to be assessed.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 12 */}
        <Section id="reporting" n={12} title="Reporting unlawful recording or misuse">
          <Clause n="12.1">
            <P>
              If you believe someone has recorded you without consent, or has shared, published, or
              misused a recording of you, report it immediately through the in-product reporting tool
              and block them. Use the privacy category, or the sexual-content or dangerous-behaviour
              category where those better describe what happened. You may also write to{" "}
              <Ph>SAFETY CONTACT EMAIL</Ph>.
            </P>
          </Clause>
          <Clause n="12.2">
            <P>
              Include as much detail as you can: when it happened, what was captured, where it has been
              shared, and any evidence you hold. Report descriptions are limited to 500 characters, so
              send longer accounts and any files to the safety contact address rather than truncating
              them.
            </P>
          </Clause>
          <Clause n="12.3">
            <P>
              We will acknowledge a report within <Ph>REPORT ACKNOWLEDGEMENT TARGET</Ph> and aim to
              reach an outcome within <Ph>REPORT RESOLUTION TARGET</Ph>. Reports concerning intimate
              imagery, the safety of a minor, or a credible threat are escalated immediately under{" "}
              <Ph>PRIORITY ESCALATION PROCEDURE</Ph>.
            </P>
          </Clause>
          <Clause n="12.4">
            <P>
              Reporting to us does not replace reporting to the authorities. Non-consensual recording
              and the distribution of intimate images are criminal offences in many jurisdictions. If
              you are in immediate danger, contact your local emergency services first. We will
              cooperate with lawful requests from law enforcement.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 13 */}
        <Section id="enforcement" n={13} title="Enforcement">
          <Clause n="13.1">
            <P>
              Where we determine that a user has breached this notice, we may take any action
              proportionate to the breach, including issuing a warning, removing content, withdrawing
              access to some or all Community Features, suspending or terminating the account,
              preventing re-registration, and reporting the matter to law enforcement or a competent
              authority.
            </P>
          </Clause>
          <Clause n="13.2">
            <P>
              Serious breaches — non-consensual recording of an intimate nature, distribution of a
              recording to harass, the creation of synthetic media from a person&rsquo;s voice or
              likeness, or conduct endangering a minor — will normally result in immediate permanent
              termination without prior warning.
            </P>
          </Clause>
          <Clause n="13.3">
            <P>
              You may appeal an enforcement decision by writing to <Ph>APPEALS CONTACT EMAIL</Ph> within{" "}
              <Ph>APPEAL WINDOW</Ph>. An appeal is reviewed by a person who did not take the original
              decision, where operationally possible.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 14 */}
        <Section id="liability" n={14} title="Limitation of liability">
          <Clause n="14.1">
            <P>
              Nothing in this notice limits or excludes any liability that cannot lawfully be limited or
              excluded, including liability for death or personal injury caused by negligence, for fraud
              or fraudulent misrepresentation, or any right or remedy conferred by applicable data
              protection or consumer law.
            </P>
          </Clause>
          <Clause n="14.2">
            <P>
              Subject to clause 14.1, the Controller&rsquo;s liability arising out of or in connection
              with the Service is limited as set out in the Nurilang Terms of Service at{" "}
              <Ph>TERMS OF SERVICE URL</Ph>, including the aggregate liability cap of{" "}
              <Ph>LIABILITY CAP</Ph> and the exclusion of indirect and consequential loss at{" "}
              <Ph>TERMS OF SERVICE LIABILITY CLAUSE REFERENCE</Ph>.
            </P>
          </Clause>
          <Clause n="14.3">
            <P>
              Subject to clause 14.1, and because Call Media does not pass through our systems in a
              readable form, we accept no liability for a recording made by another user in breach of
              Section 5, for the onward use or publication of such a recording, or for any loss arising
              from a user&rsquo;s failure to comply with the recording law applicable to them. Liability
              for those acts rests with the user who committed them.
            </P>
          </Clause>
          <Clause n="14.4">
            <P>
              Subject to clause 14.1, we accept no liability for the availability or performance of a
              Call, including a Call that cannot be established because a network prevents a direct or
              relayed connection.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 15 */}
        <Section id="law" n={15} title="Governing law and jurisdiction">
          <Clause n="15.1">
            <P>
              This notice and any dispute arising out of or in connection with it are governed by the
              law of <Ph>GOVERNING LAW JURISDICTION</Ph>, without regard to its conflict-of-laws rules.
            </P>
          </Clause>
          <Clause n="15.2">
            <P>
              The courts of <Ph>COURTS OF EXCLUSIVE OR NON-EXCLUSIVE JURISDICTION</Ph> have{" "}
              <Ph>EXCLUSIVE OR NON-EXCLUSIVE</Ph> jurisdiction to settle any such dispute.
            </P>
          </Clause>
          <Clause n="15.3">
            <P>
              Clauses 15.1 and 15.2 do not deprive a consumer of the protection of the mandatory rules
              of the law of their country of habitual residence, and do not affect the application of
              the criminal or data protection law of any jurisdiction to a recording made in it. In
              particular, choosing the governing law of this notice does not make a recording lawful
              that is unlawful where it was made.
            </P>
          </Clause>
        </Section>

        {/* ----------------------------------------------------------------- 16 */}
        <Section id="changes" n={16} title="Changes and contact">
          <Clause n="16.1">
            <P>
              We may amend this notice. The version in force is the one published on this page,
              identified by the version number and last-updated date at the top. Where a change
              materially affects what is recorded or stored, we will give notice at least{" "}
              <Ph>MATERIAL CHANGE NOTICE PERIOD</Ph> before it takes effect and, where consent is the
              applicable basis, ask for it first.
            </P>
          </Clause>
          <Clause n="16.2" title="Contact">
            <P>
              Privacy and data-subject matters: <Ph>PRIVACY CONTACT EMAIL</Ph>. Safety and recording
              complaints: <Ph>SAFETY CONTACT EMAIL</Ph>. Enforcement appeals:{" "}
              <Ph>APPEALS CONTACT EMAIL</Ph>. Postal correspondence: <Ph>REGISTERED ADDRESS</Ph>.
            </P>
          </Clause>
          <Clause n="16.3" title="Related notices">
            <P>
              Read this notice with the{" "}
              <Link
                href="/legal/privacy"
                className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-lime"
              >
                Nurilang Privacy Policy
              </Link>{" "}
              and the Nurilang Terms of Service at <Ph>TERMS OF SERVICE URL</Ph>. Where this notice
              conflicts with the Privacy Policy on a technical description of how communications work,
              this notice prevails.
            </P>
          </Clause>
        </Section>
      </div>

      <footer className="mt-14 border-t border-line pt-6">
        <p className="text-xs leading-6 text-muted">
          Bracketed text marks a value that must be completed by the operator before this document is
          relied on. This notice describes the Service as implemented at the date stated above.
        </p>
      </footer>
    </article>
  );
}
