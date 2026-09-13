"use client";

import React, { useState } from "react";
import {
  Globe,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Play,
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
} from "lucide-react";

interface LivePreviewViewProps {
  previewUrl: string | null;
  serverPort: number | null;
  isServerRunning: boolean;
  startingServer: boolean;
  onStartServer: () => void;
  previewPath: string;
  onChangePreviewPath: (path: string) => void;
  isCompact?: boolean;
}

export default function LivePreviewView({
  previewUrl,
  serverPort = 5000,
  isServerRunning,
  startingServer,
  onStartServer,
  previewPath,
  onChangePreviewPath,
  isCompact = false,
}: LivePreviewViewProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [viewportMode, setViewportMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const fullUrl = previewUrl ? `${previewUrl}${previewPath === "/" ? "" : previewPath}` : null;

  const handleCopyUrl = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternalTab = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!fullUrl) return;
    // Window.open without noopener to maintain window.opener link for WebContainer handshake
    window.open(fullUrl, "_blank");
  };

  const handleReload = () => {
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#07090f] overflow-hidden w-full h-full">
      {/* Address & Navigation Bar */}
      <div className="h-10 bg-[#0b0f1a] border-b border-slate-800/80 px-3 flex items-center justify-between gap-3 shrink-0 select-none">
        {/* Left: Status Badge & Reload */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 shrink-0">
            {isServerRunning ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono font-semibold text-emerald-300">
                  :{serverPort || 5000} ONLINE
                </span>
              </>
            ) : startingServer ? (
              <>
                <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" />
                <span className="text-[11px] font-mono font-semibold text-cyan-300">
                  STARTING...
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-500" />
                <span className="text-[11px] font-mono text-slate-400">
                  OFFLINE
                </span>
              </>
            )}
          </div>

          {isServerRunning && (
            <button
              onClick={handleReload}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reload preview"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Center: Interactive URL Bar */}
        <div className="flex items-center gap-1.5 flex-1 max-w-xl bg-[#131826] border border-slate-800/90 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-300 min-w-0 shadow-inner">
          <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span className="truncate text-slate-400 select-all flex-1">
            {previewUrl ||
              (isServerRunning
                ? "Connecting WebContainer tunnel..."
                : "http://localhost:5000")}
            <span className="text-indigo-400 font-bold">
              {previewPath === "/" ? "" : previewPath}
            </span>
          </span>

          {fullUrl && (
            <button
              onClick={handleCopyUrl}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
              title="Copy preview URL"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Right: Quick Paths, Viewport Switcher & External Tab */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Route Shortcuts */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {[
              { label: "Dashboard", path: "/" },
              { label: "/api/health", path: "/api/health" },
              { label: "/api/auth/me", path: "/api/auth/me" },
            ].map((rt) => (
              <button
                key={rt.path}
                onClick={() => onChangePreviewPath(rt.path)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                  previewPath === rt.path
                    ? "bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-500/30"
                    : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>

          {/* Viewport size controls (visible when not compact) */}
          {!isCompact && (
            <div className="hidden lg:flex items-center bg-slate-900/90 border border-slate-800 rounded-md p-0.5 gap-0.5">
              <button
                onClick={() => setViewportMode("desktop")}
                className={`p-1 rounded transition-colors ${
                  viewportMode === "desktop"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Desktop View (100%)"
              >
                <Monitor className="h-3 w-3" />
              </button>
              <button
                onClick={() => setViewportMode("tablet")}
                className={`p-1 rounded transition-colors ${
                  viewportMode === "tablet"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Tablet View (768px)"
              >
                <Tablet className="h-3 w-3" />
              </button>
              <button
                onClick={() => setViewportMode("mobile")}
                className={`p-1 rounded transition-colors ${
                  viewportMode === "mobile"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Mobile View (375px)"
              >
                <Smartphone className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Open in External Tab Button */}
          {previewUrl && (
            <button
              onClick={handleOpenExternalTab}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold transition-all cursor-pointer shadow-sm hover:shadow-indigo-500/20"
              title="Open Live Preview in an external browser tab"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Open in Tab</span>
            </button>
          )}
        </div>
      </div>

      {/* Preview Viewport Container */}
      <div className="flex-1 relative overflow-hidden bg-[#07090f] flex items-center justify-center p-0">
        {isServerRunning ? (
          previewUrl ? (
            <div
              className={`h-full transition-all duration-300 bg-[#080c14] ${
                viewportMode === "mobile" && !isCompact
                  ? "w-[375px] max-w-full my-3 border border-slate-700/60 rounded-xl shadow-2xl overflow-hidden"
                  : viewportMode === "tablet" && !isCompact
                  ? "w-[768px] max-w-full my-3 border border-slate-700/60 rounded-xl shadow-2xl overflow-hidden"
                  : "w-full"
              }`}
            >
              <iframe
                key={`${reloadKey}-${previewPath}`}
                src={`${previewUrl}${previewPath === "/" ? "" : previewPath}`}
                className="w-full h-full border-0 bg-[#080c14]"
                title="WebContainer Live Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Connecting Live Preview...
                </h3>
                <p className="text-xs text-slate-400">
                  Waiting for WebContainer port {serverPort || 5000} tunnel to establish...
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-indigo-950/50 border border-indigo-700/40 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-950/40">
              <Globe className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">
                WebContainer Preview Offline
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Start your Node.js application to see the interactive live frontend, test authentication API routes, and inspect real-time responses.
              </p>
            </div>
            <button
              onClick={onStartServer}
              disabled={startingServer}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {startingServer ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Starting Node.js Server...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Start Server on :5000</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
