import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nudge — AI-Guided Coding Environment",
  description:
    "Learn programming by building real projects. Write code, get stuck, receive progressive AI nudges, and advance through static evaluation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <Script src="https://js.puter.com/v2/" strategy="beforeInteractive" />
      </head>
      <body className="antialiased min-h-screen bg-[#080C0D] text-[#F4F7F6] selection:bg-[#67D6B2]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}

