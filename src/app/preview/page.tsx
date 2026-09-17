"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ExternalLink,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Zap,
} from "lucide-react";

export default function PreviewPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [statusMessage, setStatusMessage] = useState<string>("Initializing WebContainer...");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const connectedRef = useRef<boolean>(false);
  connectedRef.current = status === "connected" && Boolean(previewUrl);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Track elapsed seconds
  useEffect(() => {
    if (status === "connected") return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Connect to preview URL via query param, BroadcastChannel, or localStorage
  useEffect(() => {
    // 1. Check if URL was passed via query parameter (fastest, direct)
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    if (urlParam) {
      try {
        const decoded = decodeURIComponent(urlParam);
        setPreviewUrl(decoded);
        setStatus("connected");
        setStatusMessage("Connected to live server");
        localStorage.setItem("nudge-preview-url", decoded);
        localStorage.setItem("nudge-preview-status", "ready");
        return;
      } catch {
        // Fall through to channel
      }
    }

    // 2. Setup BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("nudge-preview");
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || typeof data !== "object") return;

        if (data.type === "preview-url" && data.url) {
          setPreviewUrl(data.url);
          setStatus("connected");
          setStatusMessage("Connected to live server");
          localStorage.setItem("nudge-preview-url", data.url);
          localStorage.setItem("nudge-preview-status", "ready");
        } else if (data.type === "server-status") {
          if (data.status === "ready" && data.url) {
            setPreviewUrl(data.url);
            setStatus("connected");
          } else if (data.status === "installing") {
            setStatusMessage(data.message || "Installing project dependencies (npm install)...");
          } else if (data.status === "starting") {
            setStatusMessage(data.message || "Starting dev server on port 5000...");
          } else if (data.status === "stopped") {
            setStatusMessage("Dev server stopped.");
          }
        } else if (data.type === "server-error") {
          setStatusMessage(data.message || "Failed to start dev server");
        }
      };

      // Request URL from workspace tab
      channel.postMessage({ type: "request-preview-url" });
    } catch {
      // BroadcastChannel unavailable
    }

    // 3. Poll localStorage and periodic channel request
    const pollInterval = setInterval(() => {
      if (connectedRef.current) return;

      const storedUrl = localStorage.getItem("nudge-preview-url");
      const storedStatus = localStorage.getItem("nudge-preview-status");
      const storedMsg = localStorage.getItem("nudge-preview-status-message");

      if (storedMsg) {
        setStatusMessage(storedMsg);
      }

      if (storedUrl && (storedStatus === "ready" || !storedStatus)) {
        setPreviewUrl(storedUrl);
        setStatus("connected");
        setStatusMessage("Connected to live server");
        return;
      }

      // Re-request via BroadcastChannel
      try {
        channelRef.current?.postMessage({ type: "request-preview-url" });
      } catch {
        // Ignore
      }
    }, 800);

    // 4. Generous timeout (90 seconds) with recovery actions
    const timeout = setTimeout(() => {
      if (!connectedRef.current) {
        setStatus("error");
      }
    }, 90000);

    return () => {
      channel?.close();
      channelRef.current = null;
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, []);

  const handleReloadIframe = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  const handleRestartServer = useCallback(() => {
    setStatus("connecting");
    setStatusMessage("Restarting dev server...");
    setElapsedSeconds(0);
    try {
      channelRef.current?.postMessage({ type: "restart-server" });
    } catch {
      // Ignore
    }
  }, []);

  const handleRetry = useCallback(() => {
    setStatus("connecting");
    setStatusMessage("Reconnecting to dev server...");
    setElapsedSeconds(0);
    try {
      channelRef.current?.postMessage({ type: "start-server" });
      channelRef.current?.postMessage({ type: "request-preview-url" });
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-[#080C0D] flex flex-col overflow-hidden select-none font-sans">
      {status === "connected" && previewUrl ? (
        <>
          {/* ── Top Bar ── */}
          <div className="h-11 bg-[#0D1214] border-b border-[#202A2C] px-4 flex items-center justify-between shrink-0 select-none z-10">
            {/* Left: Indicator & Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#67D6B2] animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-wider text-[#67D6B2]">
                  LIVE PREVIEW
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#11181A] text-[#A9B5B2] border border-[#202A2C]">
                PORT 5000
              </span>
            </div>

            {/* Center: Live URL display */}
            <div className="hidden md:flex items-center gap-2 max-w-[500px]">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#080C0D] border border-[#202A2C] text-xs font-mono text-[#71807C] truncate max-w-full">
                <span className="text-[#67D6B2]">🌐</span>
                <span className="truncate text-[#A9B5B2]">{previewUrl}</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleReloadIframe}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#11181A] hover:bg-[#162124] text-[#F4F7F6] border border-[#202A2C] hover:border-[#67D6B2]/30 transition-all cursor-pointer"
                title="Reload Preview Frame"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#67D6B2]" />
                <span>Reload</span>
              </button>

              <button
                onClick={handleRestartServer}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#11181A] hover:bg-[#162124] text-[#A9B5B2] hover:text-[#F4F7F6] border border-[#202A2C] transition-all cursor-pointer"
                title="Restart Dev Server in WebContainer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                <span>Restart Server</span>
              </button>

              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-[#71807C] hover:text-[#F4F7F6] hover:bg-[#11181A] border border-transparent hover:border-[#202A2C] transition-colors"
                title="Open Direct WebContainer URL in New Tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* ── Full-screen Iframe Preview ── */}
          <div className="flex-1 w-full h-full relative bg-[#0D1214]">
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0 bg-white"
              title="Nudge Live Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        </>
      ) : status === "error" ? (
        /* ── Timeout / Error State ── */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-[#F4F7F6]">
          <div className="max-w-md w-full rounded-2xl bg-[#0D1214] border border-[#202A2C] p-8 shadow-2xl text-center space-y-6 animate-in fade-in">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-[#F06A6A]/10 border border-[#F06A6A]/30 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-[#F06A6A]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-[#F4F7F6]">
                Dev Server Taking Longer Than Expected
              </h2>
              <p className="text-xs text-[#A9B5B2] leading-relaxed">
                The WebContainer dev server has not started or is still compiling dependencies. Make sure the workspace tab is still open and active.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080C0D] border border-[#202A2C] text-left space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2 text-[#71807C]">
                <Terminal className="h-3.5 w-3.5 text-[#67D6B2]" />
                <span>Last known status:</span>
              </div>
              <div className="text-[#A9B5B2] pl-5 text-[11px] break-words">
                {statusMessage}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleRetry}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#82CDBD] hover:bg-[#6BCDB4] text-[#080C0D] text-xs font-bold transition-all cursor-pointer shadow-lg shadow-[#82CDBD]/10"
              >
                <Zap className="h-4 w-4" />
                <span>Start Dev Server</span>
              </button>
              <button
                onClick={() => window.close()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#11181A] hover:bg-[#162124] text-[#A9B5B2] hover:text-[#F4F7F6] border border-[#202A2C] text-xs font-medium transition-colors cursor-pointer"
              >
                Close Tab
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Connecting / Booting State ── */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-[#F4F7F6]">
          <div className="max-w-md w-full rounded-2xl bg-[#0D1214] border border-[#202A2C] p-8 shadow-2xl text-center space-y-6 animate-in fade-in">
            {/* Animated Radar Pulse */}
            <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#67D6B2]/10 animate-ping" />
              <div className="relative h-16 w-16 rounded-2xl bg-[#11181A] border border-[#67D6B2]/40 flex items-center justify-center shadow-lg shadow-[#67D6B2]/10">
                <RefreshCw className="h-7 w-7 text-[#67D6B2] animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-[#F4F7F6] tracking-tight">
                Connecting to Live Preview
              </h2>
              <p className="text-xs text-[#A9B5B2] leading-relaxed">
                Booting your code inside the WebContainer sandbox. This tab will automatically connect once the server is ready.
              </p>
            </div>

            {/* Stepper Progression */}
            <div className="space-y-2 text-left bg-[#080C0D] p-4 rounded-xl border border-[#202A2C]">
              <div className="flex items-center gap-2.5 text-xs text-[#67D6B2]">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#67D6B2]" />
                <span className="font-medium">WebContainer micro-OS initialized</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#F4F7F6]">
                <RefreshCw className="h-4 w-4 shrink-0 text-amber-400 animate-spin" />
                <span className="font-medium truncate">{statusMessage}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#71807C]">
                <span className="h-4 w-4 rounded-full border border-[#71807C]/40 flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Mount live preview frame</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#71807C] px-1">
              <span>Elapsed: {elapsedSeconds}s</span>
              <button
                onClick={handleRestartServer}
                className="text-[#67D6B2] hover:underline cursor-pointer"
              >
                Force Restart Server
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
