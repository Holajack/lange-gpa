# Legal pages — facts worksheet

The four draft pages at `src/app/legal/{terms,privacy,conduct,recording-consent}/`
were written by tracing the actual code (Convex functions, `CallProvider.tsx`,
`src/lib/*`) so every statement about what the product *does* is accurate.
Everything that can't come from code — who you are as a business, what law
governs, how long you keep data, who to contact — is marked with a `<Ph>`
(placeholder) component and needs a real answer.

**This is not legal advice.** It's a worksheet organizing what's being asked
and, where there's an obvious reasonable default for an early-stage solo
founder, a starting point — so a lawyer's review is a check on real answers,
not a cold read. Extracted directly from the source files: 173 placeholder
occurrences, 87 distinct facts, grouped below. (Reusable structure for any
other app that needs the same kind of legal setup — the categories don't
change, only the answers do.)

**Do not merge the legal-pages PR until this is filled in and reviewed.**
Merging deploys them to production as reachable URLs even before they're
linked from navigation.

---

## 1. Who you are, legally

The single highest-leverage decision on this list — almost everything else
either follows from it or matters *more* without it.

| Placeholder | What it's asking |
|---|---|
| `LEGAL ENTITY NAME` | The exact legal name that signs the contract with users |
| `ENTITY TYPE` | LLC, corporation, sole proprietorship... |
| `JURISDICTION OF INCORPORATION` | Which state/country the entity is registered in |
| `COMPANY REGISTRATION NUMBER` | Your state's business registration/EIN-adjacent number |
| `REGISTERED ADDRESS` | The address of record |

**If you haven't formed a company yet:** that's the real first step here, not
a form-filling detail. Without one, *you personally* are the contracting
party — meaning a lawsuit against "Nurilang" is a lawsuit against you, with
no liability shield. An LLC is the common, inexpensive starting point for a
solo founder; costs and speed vary by state (some are same-week, ~$50–500).
Worth doing before this goes live, not after.

## 2. Governing law & disputes

| Placeholder | What it's asking |
|---|---|
| `GOVERNING LAW JURISDICTION` (x6) | Which state/country's law applies if there's a dispute |
| `COURTS / EXCLUSIVE OR NON-EXCLUSIVE JURISDICTION` (x6) | Which courts hear disputes, and whether that's the *only* option |
| `ONLINE DISPUTE RESOLUTION / ADR BODY, IF APPLICABLE` | Only relevant if you expect EU consumers |
| `OUT-OF-COURT DISPUTE SETTLEMENT DETAILS, IF APPLICABLE` | Same |

**Typical default:** the state where your entity is incorporated, non-exclusive
jurisdiction (lets you sue elsewhere if you need to, doesn't lock you in).
Follows directly from §1.

## 3. Contacts

Nine distinct roles are named, but they don't need nine different inboxes to
start — most early-stage apps route several of these to one real, monitored
address until volume justifies splitting them out.

| Placeholder | Suggested inbox (to start) |
|---|---|
| `PRIVACY CONTACT EMAIL` (x11), `DATA PROTECTION CONTACT` | privacy@ |
| `SAFETY CONTACT EMAIL` (x7), `APPEALS CONTACT EMAIL` (x5) | safety@ |
| `SECURITY CONTACT EMAIL` (x3) | security@ (or fold into safety@) |
| `LEGAL NOTICES EMAIL`, `LEGAL CONTACT EMAIL` (x3 each) | legal@ |
| `SUPPORT CONTACT EMAIL` (x2) | support@ |
| `PRIVACY CONTACT NAME OR ROLE` | Whoever actually reads privacy@ — can be "the Nurilang team" if it's just you |

**Real decision needed:** these addresses turn into *commitments* elsewhere on
this list (response-time targets, below) — don't point five roles at an inbox
nobody checks daily.

## 4. Response-time & process commitments

These aren't facts to look up — they're operational promises you're making.
Set them to something you can actually hit.

| Placeholder | What you're promising |
|---|---|
| `REPORT ACKNOWLEDGEMENT TARGET` / `ACKNOWLEDGEMENT TARGET` | How fast a safety report gets a first response |
| `REPORT RESOLUTION TARGET` / `RESOLUTION TARGET` | How fast it gets resolved |
| `APPEAL WINDOW` (x2, "e.g. 30 days") | How long someone has to appeal a decision |
| `PRIORITY ESCALATION PROCEDURE` | What happens for urgent/safety-critical reports |
| `MINOR SAFETY ESCALATION AND REPORTING PROCEDURE` | Specifically: what happens if you learn a minor got through |
| `INCIDENT RESPONSE PROCEDURE REFERENCE` | Your internal playbook for a real incident |
| `MATERIAL CHANGE NOTICE PERIOD`, `NOTICE PERIOD, e.g. 30 days` | How much warning before Terms changes take effect |
| `INFORMAL RESOLUTION PERIOD, e.g. 30 days` | Cool-off window before a dispute escalates |

**Given the app is a solo/small team right now:** conservative numbers (e.g.,
"acknowledge within 2 business days, resolve within 7") are safer than fast
ones you can't actually staff yet.

## 5. Data retention periods

Ten distinct retention clocks. They don't all need to be the same, but they
should follow one policy you can actually explain if asked.

| Placeholder | The data |
|---|---|
| `ACCOUNT RETENTION PERIOD` | How long after deletion request before the account is gone |
| `MESSAGE RETENTION PERIOD` | Chat messages |
| `VOICE NOTE RETENTION PERIOD` | Recorded voice notes |
| `CALL SIGNALLING RETENTION PERIOD` | WebRTC connection metadata (not call content — Nurilang doesn't record calls) |
| `CONNECTION RETENTION PERIOD` | Who-connected-to-whom records |
| `BLOCK RETENTION PERIOD` | Block-list entries (safety-relevant — usually kept *longer* than other data) |
| `WAITLIST RETENTION PERIOD` | Pre-signup waitlist entries |
| `PROGRESS DATA RETENTION PERIOD` | Learning history, hours, words met |
| `DATE OF BIRTH RETENTION PERIOD` + `DATE OF BIRTH RETENTION FORM — FULL DATE OR DERIVED ELIGIBILITY FLAG` | Whether you keep the actual birthdate or just "is 18+" |
| `LOG RETENTION PERIOD` / `LOG RETENTION CONFIGURATION` | Server/infra logs |
| `SAFETY REPORT RETENTION PERIOD` / `SAFETY PRESERVATION PERIOD` | Reports and their evidence — usually the *longest* retention on this list, for legal/liability reasons |

**Reasonable starting policy:** most user content, 30–90 days post-deletion;
safety reports and block records, much longer (a year or more — these are
exactly what you'd need if a dispute or legal request came in later); date of
birth — worth storing only the *derived* over-18 flag if you don't need the
exact date for anything else, since that's less sensitive data to hold.

## 6. Vendor & infrastructure disclosure

Privacy law generally requires naming who processes user data on your behalf.

| Placeholder | Answer (from what's actually running) |
|---|---|
| `HOSTING PROVIDER` | Vercel (app) + Convex (backend/database) |
| `PRIMARY HOSTING REGION` | Whichever Vercel/Convex region is configured — check the dashboards |
| `TURN PROVIDER NAME` / `TURN PROVIDER IN EFFECT` / `TURN PROVIDER CONFIGURATION REFERENCE` | Whatever TURN relay service `CallProvider.tsx` is configured against |
| `PAYMENT PROVIDER` / `PAYMENT PROCESSOR DISCLOSURE` | Not chosen yet — this is the same open item from the roadmap (`credits.ts` still throws by design) |
| `SUB-PROCESSOR LIST URL` | A page listing all of the above, once decided |

## 7. Liability terms

| Placeholder | What it's asking |
|---|---|
| `LIABILITY CAP`, `MINIMUM CAP AMOUNT AND CURRENCY` | The maximum you could be on the hook for |
| `CAP PERIOD, e.g. twelve (12) months` | Over what window |
| `TERMS LIMITATION OF LIABILITY SECTION REFERENCE`, `TERMS INDEMNITY SECTION REFERENCE`, `TERMS DISPUTE RESOLUTION SECTION REFERENCE`, `TERMS SECTION REFERENCE` | Cross-references between documents — mechanical, fill in once section numbers are final |

**This is the one category worth an actual lawyer's eyes before publishing**,
more than the others — liability caps are where "reasonable default" advice
is least safe to take from an AI, since it depends on your risk tolerance,
insurance (if any), and what a court in your governing-law jurisdiction would
actually enforce.

## 8. Age & minors

| Placeholder | What it's asking |
|---|---|
| `MINIMUM AGE FOR THE LEARNING SERVICE` | **Important distinction:** this is separate from the 18+ gate. The 18+ check (just merged) only covers messaging/calls/parties — the *base* learning app (solo practice, AI-nurturer sessions) currently has no age floor at all. Decide deliberately whether that's intentional. |
| `AGE OF DIGITAL CONSENT APPLIED` | The GDPR-adjacent concept — varies 13–16 by EU country, only matters if you have EU users |
| `AGE ASSURANCE NOTICE LOCATION` | Where the site discloses how age is checked |
| `ROLES AUTHORISED TO ACCESS AGE DATA` | Who on your team (even if just you) can see birthdates |

## 9. International / GDPR-specific

**Only fill these in if you expect EU or UK users soon.** If Nurilang is
US-only for the foreseeable future, these can stay open longer than the rest
of the list without meaningful risk — but decide that deliberately rather than
by default.

| Placeholder | Only matters if... |
|---|---|
| `EU REPRESENTATIVE NAME AND ADDRESS`, `UK REPRESENTATIVE NAME AND ADDRESS` | You have EU/UK users and aren't established there yourself |
| `LEAD SUPERVISORY AUTHORITY AND CONTACT DETAILS` | Same |
| `DPO STATUS — APPOINTED / NOT APPOINTED`, `DPO NAME AND CONTACT DETAILS` | You're required to appoint a Data Protection Officer (usually a scale threshold, not day one) |
| `TRANSFER DESTINATION COUNTRIES` | You move EU user data outside the EU (likely yes, given US hosting) |
| `OTHER TERRITORIES REQUIRING SUPPLEMENTAL DISCLOSURE`, `REGIONAL SUPPLEMENT URL OR ANNEX REFERENCE` | Same idea, other regions (e.g. California) |

## 10. Dates, versioning & misc

| Placeholder | Notes |
|---|---|
| `EFFECTIVE DATE`, `LAST UPDATED DATE`, `VERSION NUMBER` / `VERSION` | Set once, together, the day these actually go live |
| `TERMS OF SERVICE URL` | Self-referential — `/legal/terms`, once live |
| `ACCOUNT DELETION PROCESS OR URL` / `DELETION PROCESS OR URL` | **Checked — no account-deletion flow exists anywhere in the codebase yet.** Promising one in the Privacy Policy that doesn't exist is worse than not mentioning it. This needs to be built (even a manual "email us and we'll delete it" process is a valid answer) before these pages can honestly point to it. |
| `REFUND AND CANCELLATION POLICY LOCATION` | Depends on the payment-provider decision (§6) |
| `COMMUNITY FEATURES AVAILABILITY STATEMENT` | Honest note that community exchange isn't broadly live yet — matches the current flag state |
| `SECURITY PROGRAMME REFERENCE` | Only needed if you have a formal security policy doc; otherwise can note "no formal certification at this stage" |
| `REGULATORY POINT OF CONTACT / LEGAL REPRESENTATIVE, IF REQUIRED` | Usually N/A for a US solo-founder app; revisit if that changes |

---

## Once this is filled in

Bring the answers back and the `<Ph>` placeholders get replaced with the real
values across all four pages, then the pages get a final read-through before
merging and linking from navigation. Recommend an actual lawyer's pass on
§7 (liability) and §2 (governing law) specifically before publishing, even
if everything else here is answered from this worksheet.
