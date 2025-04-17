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
  title: "Schedowl",
  description: "An all-in-one LinkedIn content management solution",
  icons: [
    {
      rel: "icon",
      url: "http://localhost:3000/favicon-light.svg",
      media: "(prefers-color-scheme: light)",
    },
    {
      rel: "icon",
      url: "http://localhost:3000/favicon-dark.svg",
      media: "(prefers-color-scheme: dark)",
    },
  ],
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
        <div id="0cred.com" className="hidden">
          0791629a-dbb3-4785-bb88-c85d3105ae03
        </div>
        <SessionProvider session={session}>
          <PostHogProvider>{children}</PostHogProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
