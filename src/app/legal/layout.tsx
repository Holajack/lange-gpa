import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * Shared shell for every /legal/* document.
 *
 * Deliberately plain: a header that gets you back into the app, a strip of
 * sibling documents, and a single readable measure for the body text. No
 * client JS, so each document stays a server component and can export its
 * own metadata. Pages supply their own <h1>; this file supplies the frame.
 */

const DOCUMENTS = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/conduct", label: "Community Conduct Rules" },
  { href: "/legal/recording-consent", label: "Recording and Consent" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <a
        href="#legal-document"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-lime focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-canvas"
      >
        Skip to document
      </a>

      {/* ───────────────────────── header ───────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
        <nav
          aria-label="Site"
          className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3.5"
        >
          <Logo size="sm" />
          <Link
            href="/"
            className="pill border border-line bg-white/5 px-4 py-2 text-xs font-semibold text-ink"
          >
            ← Back to Nuri
          </Link>
        </nav>
      </header>

      <div className="orb -left-40 -top-32 h-[380px] w-[380px] bg-violet/15" aria-hidden />

      {/* ─────────────────── sibling legal documents ─────────────────── */}
      <nav aria-label="Legal documents" className="relative border-b border-line">
        <ul className="no-scrollbar mx-auto flex max-w-3xl gap-2 overflow-x-auto px-5 py-3">
          {DOCUMENTS.map((doc) => (
            <li key={doc.href} className="shrink-0">
              <Link
                href={doc.href}
                className="pill border border-line bg-white/5 px-4 py-2 text-xs font-semibold text-muted transition-colors hover:border-white/20 hover:text-ink"
              >
                {doc.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ───────────────────────── document ───────────────────────── */}
      <main
        id="legal-document"
        className="relative mx-auto max-w-3xl px-5 pb-24 pt-12 text-[15px] leading-relaxed text-muted sm:text-base"
      >
        {children}
      </main>

      {/* ───────────────────────── footer ───────────────────────── */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-5 py-7 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Nurilang. All rights reserved.</p>
          <Link href="/" className="font-semibold transition-colors hover:text-ink">
            ← Back to Nuri
          </Link>
        </div>
      </footer>
    </div>
  );
}
