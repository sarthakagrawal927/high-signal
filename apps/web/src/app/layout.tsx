import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { AnalyticsProvider } from "@/components/posthog-provider";
import { SaaSMakerFeedback } from "@/components/saasmaker-feedback";
import { AuthNav } from "@/components/auth/AuthNav";

export const metadata: Metadata = {
  title: "High Signal — signal intelligence",
  description:
    "Signal intelligence for mentions, communities, and markets. Extract what matters from noisy public information streams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-dvh font-sans antialiased">
          <AnalyticsProvider>
            <AuthNav />
            {children}
            <SaaSMakerFeedback />
          </AnalyticsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
