import type { Metadata } from "next";

/** Unlisted: reachable by link for an invited reviewer, never indexed. */
export const metadata: Metadata = {
  title: "Native-speaker review",
  robots: { index: false, follow: false },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
