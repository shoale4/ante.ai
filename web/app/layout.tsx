import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hedj - Bet Smarter | Sports Betting Odds Comparison",
  description: "Compare odds across 7+ sportsbooks, track line movements, and find the best prices. NFL, NBA, MLB, NHL, and more.",
  keywords: ["sports betting", "odds comparison", "line movements", "sportsbook", "NFL odds", "NBA odds", "betting tools"],
  authors: [{ name: "Hedj" }],
  creator: "Hedj",
  metadataBase: new URL("https://hedj.io"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hedj.io",
    siteName: "Hedj",
    title: "Hedj - Bet Smarter",
    description: "Compare odds across 7+ sportsbooks and find the best prices for NFL, NBA, MLB, NHL, and more.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hedj - Sports Betting Odds Comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hedj - Bet Smarter",
    description: "Compare odds across 7+ sportsbooks and find the best prices.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
