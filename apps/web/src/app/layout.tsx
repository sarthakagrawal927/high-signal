import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "High Signal — AI-infra signal log",
  description:
    "Public, evidence-backed, versioned signal log for AI infra and semiconductors. Every signal is auto-scored on a public hit-rate ledger.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
