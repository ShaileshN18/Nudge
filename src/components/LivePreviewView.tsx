"use client";

import React, { useMemo, useState } from "react";
import {
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Square,
  Play,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Globe,
  ChevronDown,
} from "lucide-react";

interface LivePreviewViewProps {
  previewUrl: string | null;
  serverPort: number | null;
  isServerRunning: boolean;
  startingServer: boolean;
  onStartServer: () => void | Promise<void>;
  previewPath?: string;
  onChangePreviewPath?: (path: string) => void;
  serverError?: string | null;
  isCompact?: boolean;
}

const FRONTEND_ROUTES = [{ label: "Dashboard", path: "/" }];

export default function LivePreviewView({
  previewUrl,
  serverPort,
  isServerRunning,
  startingServer,
  onStartServer,
  previewPath = "/",
  onChangePreviewPath,
  serverError,
  isCompact = false,
}: LivePreviewViewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  /*
   * IMPORTANT:
   * previewUrl is ONLY the WebContainer server origin.
   *
   * Example:
   * https://xxxxx-5000.xxxxx.webcontainer-api.io
   *
   * Never append /api/health or any backend health endpoint here.
   */
  const basePreviewUrl = useMemo(() => {
    if (!previewUrl) return null;

    return previewUrl.replace(/\/+$/, "");
  }, [previewUrl]);

  /*
   * Only frontend preview routes are allowed.
   *
   * At the moment we intentionally only expose "/".
   */
  const normalizedPreviewPath =
    previewPath && previewPath.startsWith("/") ? previewPath : "/";

  /*
   * URL displayed inside the iframe.
   *
   * This is the ONLY place where the selected frontend route is appended.
   */
  const iframeUrl = useMemo(() => {
    if (!basePreviewUrl) return null;

    if (normalizedPreviewPath === "/") {
      return `${basePreviewUrl}/`;
    }

    return `${basePreviewUrl}${normalizedPreviewPath}`;
  }, [basePreviewUrl, normalizedPreviewPath]);

  /*
   * IMPORTANT:
   *
   * Opening the preview should pass the BASE WebContainer URL
   * to /preview.
   *
   * Do NOT pass iframeUrl here.
   *
   * Otherwise a route such as /api/health could accidentally
   * become part of the preview URL.
   */
  const handleOpenExternalTab = () => {
    if (!basePreviewUrl) return;

    const portQuery = serverPort
      ? `&port=${encodeURIComponent(String(serverPort))}`
      : "";

    const previewPageUrl =
      `/preview?url=${encodeURIComponent(basePreviewUrl)}` +
      portQuery;

    window.open(previewPageUrl, "_blank", "noopener,noreferrer");
  };

  const handleRefresh = () => {
    if (!iframeUrl) return;

    setIsRefreshing(true);

    /*
     * Force iframe remount by briefly changing the key through
     * the refresh state below.
     */
    window.setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  };

  const handleRouteChange = (path: string) => {
    /*
     * Keep frontend navigation limited to actual frontend routes.
     */
    if (!path.startsWith("/")) return;

    onChangePreviewPath?.(path);
  };

  /*
   * ------------------------------------------------------------
   * SERVER NOT RUNNING
   * ------------------------------------------------------------
   */

  if (!isServerRunning && !startingServer) {
    return (
      <div className="flex h-full w-full flex-col bg-[#07090f] text-[#F4F7F6]">
        {/* Header */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#20282A] bg-[#0D1214] px-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#6BCDB4]" />

            <span className="text-xs font-semibold">
              LIVE PREVIEW
            </span>

            {serverPort && (
              <span className="rounded bg-[#151D1F] px-1.5 py-0.5 font-mono text-[10px] text-[#71807C]">
                PORT {serverPort}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {previewUrl && (
              <button
                type="button"
                onClick={handleOpenExternalTab}
                className="flex items-center gap-1.5 rounded-md border border-[#263234] bg-[#11181A] px-2 py-1.5 text-[11px] text-[#A9B5B2] transition-colors hover:bg-[#151D1F] hover:text-[#F4F7F6]"
                title="Open preview in a new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </button>
            )}
          </div>
        </div>

        {/* Offline state */}
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex max-w-sm flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#263234] bg-[#11181A]">
              <Globe className="h-5 w-5 text-[#71807C]" />
            </div>

            <h3 className="text-sm font-medium text-[#F4F7F6]">
              Preview is offline
            </h3>

            <p className="mt-1.5 text-xs leading-relaxed text-[#71807C]">
              Start the development server to preview your application.
            </p>

            {serverError && (
              <div className="mt-4 flex max-w-full items-start gap-2 rounded-lg border border-[#F06A6A]/30 bg-[#F06A6A]/5 px-3 py-2 text-left">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F06A6A]" />

                <p className="break-words text-[11px] leading-relaxed text-[#F0A0A0]">
                  {serverError}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => void onStartServer()}
              className="mt-5 flex items-center gap-2 rounded-lg bg-[#6BCDB4] px-4 py-2 text-xs font-semibold text-[#07100D] transition-opacity hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Start Server
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * SERVER STARTING
   * ------------------------------------------------------------
   */

  if (startingServer) {
    return (
      <div className="flex h-full w-full flex-col bg-[#07090f] text-[#F4F7F6]">
        {/* Header */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#20282A] bg-[#0D1214] px-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#6BCDB4]" />

            <span className="text-xs font-semibold">
              LIVE PREVIEW
            </span>

            {serverPort && (
              <span className="rounded bg-[#151D1F] px-1.5 py-0.5 font-mono text-[10px] text-[#71807C]">
                PORT {serverPort}
              </span>
            )}
          </div>
        </div>

        {/* Loading */}
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#6BCDB4]" />

            <p className="mt-3 text-xs font-medium text-[#F4F7F6]">
              Starting development server…
            </p>

            <p className="mt-1 text-[11px] text-[#71807C]">
              Waiting for WebContainer to become ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * SERVER RUNNING
   * ------------------------------------------------------------
   */

  return (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#07090f] text-[#F4F7F6]">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div
        className={`flex shrink-0 items-center justify-between border-b border-[#20282A] bg-[#0D1214] ${isCompact ? "h-10 px-2" : "h-11 px-3"
          }`}
      >
        {/* Left */}
        <div className="flex min-w-0 items-center gap-2">
          <Globe className="h-4 w-4 shrink-0 text-[#6BCDB4]" />

          <span className="shrink-0 text-xs font-semibold">
            LIVE PREVIEW
          </span>

          {serverPort && (
            <span className="shrink-0 rounded bg-[#151D1F] px-1.5 py-0.5 font-mono text-[10px] text-[#71807C]">
              PORT {serverPort}
            </span>
          )}

          <div className="flex items-center gap-1 rounded bg-[#10231E] px-1.5 py-0.5">
            <CheckCircle2 className="h-3 w-3 text-[#6BCDB4]" />

            <span className="text-[10px] font-medium text-[#6BCDB4]">
              Online
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Route selector */}
          {FRONTEND_ROUTES.length > 1 && (
            <div className="relative">
              <select
                value={normalizedPreviewPath}
                onChange={(event) =>
                  handleRouteChange(event.target.value)
                }
                className="appearance-none rounded-md border border-[#263234] bg-[#11181A] py-1.5 pl-2 pr-7 text-[10px] text-[#A9B5B2] outline-none transition-colors hover:bg-[#151D1F]"
                aria-label="Preview route"
              >
                {FRONTEND_ROUTES.map((route) => (
                  <option key={route.path} value={route.path}>
                    {route.label}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#71807C]" />
            </div>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={!iframeUrl || isRefreshing}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#263234] bg-[#11181A] text-[#A9B5B2] transition-colors hover:bg-[#151D1F] hover:text-[#F4F7F6] disabled:cursor-not-allowed disabled:opacity-40"
            title="Refresh preview"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""
                }`}
            />
          </button>

          {/* Open external */}
          <button
            type="button"
            onClick={handleOpenExternalTab}
            disabled={!basePreviewUrl}
            className="flex items-center gap-1.5 rounded-md border border-[#263234] bg-[#11181A] px-2 py-1.5 text-[11px] text-[#A9B5B2] transition-colors hover:bg-[#151D1F] hover:text-[#F4F7F6] disabled:cursor-not-allowed disabled:opacity-40"
            title="Open preview in a new browser tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />

            {!isCompact && <span>Open</span>}
          </button>
        </div>
      </div>

      {/* ====================================================== */}
      {/* URL BAR */}
      {/* ====================================================== */}

      {!isCompact && basePreviewUrl && (
        <div className="flex h-8 shrink-0 items-center border-b border-[#20282A] bg-[#0A0E10] px-3">
          <div className="flex min-w-0 flex-1 items-center rounded-md border border-[#20282A] bg-[#0D1214] px-2 py-1">
            <span className="mr-2 shrink-0 text-[9px] font-medium uppercase tracking-wide text-[#71807C]">
              URL
            </span>

            <span className="truncate font-mono text-[10px] text-[#8E9B98]">
              {iframeUrl}
            </span>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* PREVIEW */}
      {/* ====================================================== */}

      <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
        {iframeUrl ? (
          <iframe
            key={iframeUrl}
            src={iframeUrl}
            title="Live application preview"
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#07090f]">
            <div className="text-xs text-[#71807C]">
              Waiting for preview URL…
            </div>
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* FOOTER */}
      {/* ====================================================== */}

      {!isCompact && (
        <div className="flex h-7 shrink-0 items-center justify-between border-t border-[#20282A] bg-[#0D1214] px-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6BCDB4]" />

            <span className="text-[10px] text-[#71807C]">
              Preview connected
            </span>
          </div>

          <div className="font-mono text-[9px] text-[#596663]">
            {normalizedPreviewPath}
          </div>
        </div>
      )}
    </div>
  );
}