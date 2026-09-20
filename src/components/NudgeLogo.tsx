import React from "react";
import Link from "next/link";

interface NudgeLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withLink?: boolean;
}

export default function NudgeLogo({
  className = "",
  size = "md",
  withLink = true,
}: NudgeLogoProps) {
  const sizeClasses = {
    sm: "text-lg gap-1.5",
    md: "text-xl gap-2",
    lg: "text-2xl gap-2.5",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const content = (
    <div
      className={`inline-flex items-center font-bold tracking-tight text-white select-none group ${sizeClasses[size]} ${className}`}
    >
      <div className={`relative flex items-center justify-center rounded-lg bg-gradient-to-br from-[#67D6B2] to-[#10B981] p-1 shadow-lg shadow-[#67D6B2]/20 transition-transform duration-200 group-hover:scale-105 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#080C0D"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#67D6B2] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#67D6B2]"></span>
        </span>
      </div>
      <span className="bg-gradient-to-r from-white via-[#F4F7F6] to-[#A9B5B2] bg-clip-text text-transparent">
        Nudge
      </span>
      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#1A2428] text-[#67D6B2] border border-[#67D6B2]/30 tracking-wider">
        AI
      </span>
    </div>
  );

  if (withLink) {
    return (
      <Link href="/" className="inline-flex focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
