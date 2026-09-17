import React from "react";

interface NudgeLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  lightText?: boolean;
}

export function NudgeLogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <rect x="2" y="20" width="10" height="10" rx="3" fill="#5EEAD4" />
      <rect x="13" y="11" width="10" height="10" rx="3" fill="#4EE4A5" />
      <rect x="24" y="2" width="10" height="10" rx="3" fill="#34D399" />
    </svg>
  );
}

export default function NudgeLogo({
  className = "",
  iconOnly = false,
  size = "md",
  lightText = true,
}: NudgeLogoProps) {
  const sizeMap = {
    sm: { icon: 22, text: "text-lg", gap: "gap-2" },
    md: { icon: 28, text: "text-xl", gap: "gap-2.5" },
    lg: { icon: 34, text: "text-2xl", gap: "gap-3" },
    xl: { icon: 42, text: "text-3xl", gap: "gap-3.5" },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center ${current.gap} select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        <NudgeLogoMark size={current.icon} />
      </div>

      {!iconOnly && (
        <span
          className={`font-extrabold tracking-[-0.035em] leading-none ${current.text} ${
            lightText ? "text-white" : "text-[#081214]"
          }`}
          style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
        >
          nudge
        </span>
      )}
    </div>
  );
}
