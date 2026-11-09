import type { Metadata } from "next";
import { Baloo_2, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Rounded, friendly display font to match the hand-drawn logo
const display = Baloo_2({
  variable: "--font-display",
  weight: ["600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BarkadAral – your AI study barkada",
  description:
    "Paste your notes or upload a PDF and get a summary, flashcards, and a practice quiz in seconds.",
  authors: [{ name: "Jhan Maurice De Roxas" }],
  metadataBase: new URL("https://barkadaral.vercel.app"),
  openGraph: {
    title: "BarkadAral – your AI study barkada",
    description: "Turn your notes into a summary, flashcards and a practice quiz in seconds.",
    images: ["/logo.webp"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
