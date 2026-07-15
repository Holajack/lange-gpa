import type { Metadata } from "next";

const title = "Join the early-access list";
const description =
  "Tell Nurilang which language you want to grow into and join the early-access list.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/early",
  },
  openGraph: {
    type: "website",
    url: "/early",
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

export default function EarlyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
