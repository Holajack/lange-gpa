import type { Metadata } from "next";
import { Bricolage_Grotesque, Onest } from "next/font/google";
import { AppProvider } from "@/lib/store";
import { CloudProfileBridge } from "@/components/CloudProfileBridge";
import { Providers } from "@/components/Providers";
import "./globals.css";

const siteUrl = new URL("https://nurilang.app");
const siteTitle = "Nurilang — Grow into a language";
const siteDescription =
  "Nurilang is designed around comprehension-first language learning, using pictures, listening, and guided practice to build understanding before speaking.";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "Nurilang",
  title: {
    default: siteTitle,
    template: "%s | Nurilang",
  },
  description: siteDescription,
  alternates: {
    canonical: siteUrl,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Nurilang",
    title: siteTitle,
    description: siteDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
  },
  category: "education",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Nurilang",
  url: siteUrl.toString(),
  description: siteDescription,
  inLanguage: "en",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${onest.variable}`}>
      <body className="grain min-h-screen">
        <Providers>
          <AppProvider>
            <CloudProfileBridge />
            {children}
          </AppProvider>
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
