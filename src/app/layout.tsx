import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nudge — Learn by Building. Get Nudged When You're Stuck.",
  description:
    "The AI-guided developer learning platform where you learn by building real projects without tutorials or copy-pasting. In-browser WebContainer workspace with progressive AI hints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="antialiased min-h-screen bg-[#070a0e] text-slate-100 selection:bg-[#5eead4]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
