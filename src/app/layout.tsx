import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { SessionProvider } from "@/src/components/SessionProvider";
import { PostHogProvider } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://app.schedowl.com"
  ),
  title: "SchedOwl: AI-Powered LinkedIn Content Creation & Scheduling Tool",
  description:
    "Boost your LinkedIn brand with SchedOwl - the all-in-one AI tool for content creation, scheduling, engagement, and analytics. Save time, stay authentic, grow faster.",
  icons: [
    {
      rel: "icon",
      url: "https://app.schedowl.com/favicon-light.svg",
      media: "(prefers-color-scheme: light)",
    },
    {
      rel: "icon",
      url: "https://app.schedowl.com/favicon-dark.svg",
      media: "(prefers-color-scheme: dark)",
    },
  ],
  keywords: [
    "writing assistant",
    "AI writing",
    "essay writing",
    "research papers",
    "citation management",
    "academic writing",
    "free writing tools",
  ],
  authors: [{ name: "SchedOwl" }],
  creator: "SchedOwl",
  publisher: "SchedOwl",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://schedowl.com",
    title: "SchedOwl: AI-Powered LinkedIn Content Creation & Scheduling Tool",
    description:
      "Boost your LinkedIn brand with SchedOwl - the all-in-one AI tool for content creation, scheduling, engagement, and analytics. Save time, stay authentic, grow faster.",
    siteName: "SchedOwl",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SchedOwl: AI-Powered LinkedIn Content Creation & Scheduling Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SchedOwl: AI-Powered LinkedIn Content Creation & Scheduling Tool",
    description:
      "Boost your LinkedIn brand with SchedOwl - the all-in-one AI tool for content creation, scheduling, engagement, and analytics. Save time, stay authentic, grow faster.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <SessionProvider session={session}>
          <PostHogProvider>{children}</PostHogProvider>
        </SessionProvider>
        {/* simpleanalytics.com */}
        <script
          async
          src="https://scripts.simpleanalyticscdn.com/latest.js"
        ></script>
        {/* ahrefs.com */}
        <script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="dn7Sd63W3+gJlSIWtMe9ag"
          async
        ></script>
      </body>
    </html>
  );
}
