import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nudge | Learn by Building Real Fullstack Projects",
  description: "Interactive project-based learning platform for developers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
