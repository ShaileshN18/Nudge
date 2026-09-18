"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  RotateCcw,
  Terminal,
} from "lucide-react";

type PreviewStatus = "connecting" | "connected" | "error";

export default function PreviewPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [serverPort, setServerPort] = useState<string | null>(null);
  const [status, setStatus] = useState<PreviewStatus>("connecting");
  const [statusMessage, setStatusMessage] = useState(
    "Connecting to the WebContainer..."
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const connectedRef = useRef(false);

  /*
   * ------------------------------------------------------------
   * Normalize the WebContainer URL
   * ------------------------------------------------------------
   *
   * The URL passed to this page should be the BASE WebContainer
   * origin only.
   *
   * Example:
   * https://xxxxx-5000.xxxxx.webcontainer-api.io
   *
   * We intentionally do NOT append:
   * /api/health
   * /api/auth/me
   * or any other backend route.
   */
  const normalizePreviewUrl = useCallback((url: string) => {
    try {
      const parsed = new URL(url);

      /*
       * Remove any accidental pathname/query/hash that might
       * have been passed into the preview page.
       *
       * The preview should always point at the application root.
       */
      parsed.pathname = "/";
      parsed.search = "";
      parsed.hash = "";

      return parsed.toString().replace(/\/$/, "");
    } catch {
      return url
        .split("?")[0]
        .split("#")[0]
        .replace(/\/+$/, "");
    }
  }, []);

  /*
   * ------------------------------------------------------------
   * Read URL parameters
   * ------------------------------------------------------------
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const urlParam = params.get("url");
    const portParam = params.get("port");

    if (!urlParam) {
      setStatus("error");
      setStatusMessage("No WebContainer preview URL was provided.");
      return;
    }

    try {
      const decodedUrl = decodeURIComponent(urlParam);
      const normalizedUrl = normalizePreviewUrl(decodedUrl);

      setPreviewUrl(normalizedUrl);
      setStatus("connected");
      setStatusMessage("Connected to live server");
      connectedRef.current = true;

      if (portParam) {
        setServerPort(portParam);
      }

      /*
       * Store ONLY the base WebContainer URL.
       */
      localStorage.setItem("nudge-preview-url", normalizedUrl);

      if (portParam) {
        localStorage.setItem("nudge-preview-port", portParam);
      }

      localStorage.setItem("nudge-preview-status", "ready");
    } catch (error) {
      console.error("Failed to parse preview URL:", error);

      setStatus("error");
      setStatusMessage("Invalid WebContainer preview URL.");
    }
  }, [normalizePreviewUrl]);

  /*
   * ------------------------------------------------------------
   * BroadcastChannel
   * ------------------------------------------------------------
   */
  useEffect(() => {
    let channel: BroadcastChannel | null = null;

    try {
      channel = new BroadcastChannel("nudge-preview");
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;

        if (!data || typeof data !== "object") {
          return;
        }

        /*
         * Workspace says the dev server is ready.
         */
        if (data.type === "preview-url" && data.url) {
          const normalizedUrl = normalizePreviewUrl(data.url);

          setPreviewUrl(normalizedUrl);

          if (data.port) {
            setServerPort(String(data.port));
          }

          setStatus("connected");
          setStatusMessage("Connected to live server");
          connectedRef.current = true;

          /*
           * Store the BASE URL only.
           */
          localStorage.setItem("nudge-preview-url", normalizedUrl);

          if (data.port) {
            localStorage.setItem(
              "nudge-preview-port",
              String(data.port)
            );
          }

          localStorage.setItem("nudge-preview-status", "ready");

          return;
        }

        /*
         * Server lifecycle status.
         */
        if (data.type === "server-status") {
          if (data.status === "ready" && data.url) {
            const normalizedUrl = normalizePreviewUrl(data.url);

            setPreviewUrl(normalizedUrl);

            if (data.port) {
              setServerPort(String(data.port));
            }

            setStatus("connected");
            setStatusMessage("Connected to live server");
            connectedRef.current = true;

            localStorage.setItem(
              "nudge-preview-url",
              normalizedUrl
            );

            if (data.port) {
              localStorage.setItem(
                "nudge-preview-port",
                String(data.port)
              );
            }

            localStorage.setItem(
              "nudge-preview-status",
              "ready"
            );
          } else if (data.status === "installing") {
            setStatus("connecting");
            setStatusMessage(
              data.message ||
              "Installing project dependencies..."
            );
          } else if (data.status === "starting") {
            setStatus("connecting");
            setStatusMessage(
              data.message || "Starting dev server..."
            );
          } else if (data.status === "stopped") {
            setStatus("connecting");
            setStatusMessage("Dev server stopped.");
            connectedRef.current = false;
          }

          return;
        }

        /*
         * Server failed.
         */
        if (data.type === "server-error") {
          setStatus("error");
          setStatusMessage(
            data.message || "Failed to start dev server."
          );
          connectedRef.current = false;

          return;
        }
      };

      /*
       * Ask the workspace tab for the current server URL.
       */
      channel.postMessage({
        type: "request-preview-url",
      });
    } catch (error) {
      console.warn(
        "BroadcastChannel unavailable:",
        error
      );
    }

    return () => {
      channel?.close();
      channelRef.current = null;
    };
  }, [normalizePreviewUrl]);

  /*
   * ------------------------------------------------------------
   * localStorage fallback
   * ------------------------------------------------------------
   */
  useEffect(() => {
    const pollInterval = window.setInterval(() => {
      if (connectedRef.current) {
        return;
      }

      const storedUrl = localStorage.getItem(
        "nudge-preview-url"
      );

      const storedPort = localStorage.getItem(
        "nudge-preview-port"
      );

      const storedStatus = localStorage.getItem(
        "nudge-preview-status"
      );

      const storedMessage = localStorage.getItem(
        "nudge-preview-status-message"
      );

      if (storedPort) {
        setServerPort((current) => current || storedPort);
      }

      if (storedMessage) {
        setStatusMessage(storedMessage);
      }

      if (storedStatus === "error") {
        setStatus("error");
        return;
      }

      if (
        storedUrl &&
        (storedStatus === "ready" || !storedStatus)
      ) {
        const normalizedUrl =
          normalizePreviewUrl(storedUrl);

        setPreviewUrl(normalizedUrl);
        setStatus("connected");
        setStatusMessage("Connected to live server");
        connectedRef.current = true;

        return;
      }

      /*
       * Ask the workspace tab again.
       */
      try {
        channelRef.current?.postMessage({
          type: "request-preview-url",
        });
      } catch {
        // Ignore BroadcastChannel errors.
      }
    }, 800);

    return () => {
      window.clearInterval(pollInterval);
    };
  }, [normalizePreviewUrl]);

  /*
   * ------------------------------------------------------------
   * Timeout
   * ------------------------------------------------------------
   */
  useEffect(() => {
    if (status === "connected") {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (!connectedRef.current) {
        setStatus("error");
        setStatusMessage(
          "The WebContainer preview could not be connected."
        );
      }
    }, 90000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [status]);

  /*
   * ------------------------------------------------------------
   * Elapsed connection time
   * ------------------------------------------------------------
   */
  useEffect(() => {
    if (status === "connected") {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [status]);

  /*
   * ------------------------------------------------------------
   * Reload iframe
   * ------------------------------------------------------------
   */
  const handleReloadIframe = useCallback(() => {
    setIframeKey((key) => key + 1);
  }, []);

  /*
   * ------------------------------------------------------------
   * Restart server
   * ------------------------------------------------------------
   */
  const handleRestartServer = useCallback(() => {
    setStatus("connecting");
    setStatusMessage("Restarting dev server...");
    setElapsedSeconds(0);
    connectedRef.current = false;

    try {
      channelRef.current?.postMessage({
        type: "restart-server",
      });
    } catch (error) {
      console.warn(
        "Failed to request server restart:",
        error
      );
    }
  }, []);

  /*
   * ------------------------------------------------------------
   * Retry connection
   * ------------------------------------------------------------
   */
  const handleRetry = useCallback(() => {
    setStatus("connecting");
    setStatusMessage(
      "Requesting preview URL from workspace..."
    );
    setElapsedSeconds(0);
    connectedRef.current = false;

    try {
      channelRef.current?.postMessage({
        type: "request-preview-url",
      });
    } catch (error) {
      console.warn(
        "Failed to request preview URL:",
        error
      );
    }
  }, []);

  /*
   * ------------------------------------------------------------
   * Open RAW WebContainer URL
   * ------------------------------------------------------------
   *
   * This is intentionally NOT /api/health.
   */
  const handleOpenDirect = useCallback(() => {
    if (!previewUrl) {
      return;
    }

    window.open(
      `${previewUrl}/`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [previewUrl]);

  /*
   * ------------------------------------------------------------
   * Render
   * ------------------------------------------------------------
   */

  return (
    <div className="flex h-screen w-full flex-col bg-[#07090f] text-[#F4F7F6]">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#202A2C] bg-[#0D1214] px-3">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#263234] bg-[#11181A]">
            <Globe className="h-3.5 w-3.5 text-[#67D6B2]" />
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <span className="text-xs font-semibold">
              LIVE PREVIEW
            </span>

            {serverPort && (
              <span className="rounded bg-[#151D1F] px-1.5 py-0.5 font-mono text-[10px] text-[#71807C]">
                PORT {serverPort}
              </span>
            )}

            {status === "connected" && (
              <span className="flex items-center gap-1 rounded bg-[#10231E] px-1.5 py-0.5 text-[10px] font-medium text-[#67D6B2]">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </span>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {status === "connected" && previewUrl && (
            <>
              <button
                type="button"
                onClick={handleReloadIframe}
                className="flex items-center gap-1.5 rounded-md border border-[#263234] bg-[#11181A] px-2 py-1.5 text-[11px] text-[#A9B5B2] transition-colors hover:bg-[#151D1F] hover:text-[#F4F7F6]"
                title="Reload preview"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload
              </button>

              <button
                type="button"
                onClick={handleRestartServer}
                className="flex items-center gap-1.5 rounded-md border border-[#263234] bg-[#11181A] px-2 py-1.5 text-[11px] text-[#A9B5B2] transition-colors hover:bg-[#151D1F] hover:text-[#F4F7F6]"
                title="Restart development server"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restart
              </button>

              <button
                type="button"
                onClick={handleOpenDirect}
                className="flex items-center gap-1.5 rounded-md border border-[#263234] bg-[#11181A] px-2 py-1.5 text-[11px] text-[#A9B5B2] transition-colors hover:bg-[#151D1F] hover:text-[#F4F7F6]"
                title="Open raw WebContainer URL"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </button>
            </>
          )}
        </div>
      </header>

      {/* URL bar */}
      {previewUrl && (
        <div className="flex h-8 shrink-0 items-center border-b border-[#202A2C] bg-[#080C0D] px-3">
          <div className="flex min-w-0 flex-1 items-center rounded-md border border-[#202A2C] bg-[#0D1214] px-2 py-1">
            <span className="mr-2 shrink-0 text-[9px] font-semibold uppercase tracking-wider text-[#596663]">
              URL
            </span>

            <span className="truncate font-mono text-[10px] text-[#A9B5B2]">
              {previewUrl}/
            </span>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="relative min-h-0 flex-1 overflow-hidden bg-white">
        {status === "connected" && previewUrl ? (
          <iframe
            key={iframeKey}
            src={`${previewUrl}/`}
            className="h-full w-full border-0 bg-white"
            title="Nudge Live Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : status === "error" ? (
          <div className="flex h-full items-center justify-center bg-[#07090f] p-6">
            <div className="w-full max-w-md rounded-2xl border border-[#202A2C] bg-[#0D1214] p-7 text-center shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F06A6A]/30 bg-[#F06A6A]/10">
                <AlertCircle className="h-7 w-7 text-[#F06A6A]" />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-[#F4F7F6]">
                Preview connection failed
              </h2>

              <p className="mt-2 text-xs leading-relaxed text-[#71807C]">
                {statusMessage}
              </p>

              <div className="mt-4 rounded-lg border border-[#202A2C] bg-[#080C0D] p-3 text-left">
                <div className="flex items-center gap-2 text-[10px] text-[#71807C]">
                  <Terminal className="h-3.5 w-3.5 text-[#67D6B2]" />
                  <span>Last known status</span>
                </div>

                <p className="mt-1.5 break-words pl-5 font-mono text-[10px] text-[#A9B5B2]">
                  {statusMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRetry}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#67D6B2] px-4 py-2 text-xs font-semibold text-[#07100D] transition-opacity hover:opacity-90"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-[#07090f]">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-7 w-7 animate-spin text-[#67D6B2]" />

              <h2 className="mt-4 text-sm font-semibold text-[#F4F7F6]">
                Connecting Live Preview...
              </h2>

              <p className="mt-1.5 text-xs text-[#71807C]">
                {statusMessage}
              </p>

              {elapsedSeconds > 3 && (
                <p className="mt-2 font-mono text-[10px] text-[#596663]">
                  {elapsedSeconds}s
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}