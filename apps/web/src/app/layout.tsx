import type { Metadata } from "next";
import "./globals.css";
import { AnalyticsProvider } from "@/components/posthog-provider";
import { SaaSMakerFeedback } from "@/components/saasmaker-feedback";

export const metadata: Metadata = {
  title: "High Signal — signal intelligence",
  description:
    "Signal intelligence for mentions, communities, and markets. Extract what matters from noisy public information streams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">
        <AnalyticsProvider>
          {children}
          <SaaSMakerFeedback />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
