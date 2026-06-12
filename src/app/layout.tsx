import type { Metadata } from "next";
import { Bricolage_Grotesque, Onest } from "next/font/google";
import { AppProvider } from "@/lib/store";
import { Providers } from "@/components/Providers";
import "./globals.css";

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
  title: "LANGE — Grow into a language, not just learn it",
  description:
    "Language growth through the Growing Participator Approach: real people, picture cards, zero translation. From your first hundred words to truly belonging.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${onest.variable}`}>
      <body className="grain min-h-screen">
        <Providers>
          <AppProvider>{children}</AppProvider>
        </Providers>
      </body>
    </html>
  );
}
