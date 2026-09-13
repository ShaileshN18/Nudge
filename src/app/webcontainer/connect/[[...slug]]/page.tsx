"use client";

import React, { useEffect, useState } from "react";
import { setupConnect } from "@webcontainer/api/connect";

export default function WebContainerConnectPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      setupConnect();
    } catch (err: any) {
      console.error("Failed to setup WebContainer connect:", err);
      setErrorMsg(err?.message || "Failed to establish connection to preview");
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-[#07090f] flex flex-col items-center justify-center text-white font-sans p-6 space-y-4 select-none">
      {!errorMsg ? (
        <>
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="space-y-1 text-center">
            <h2 className="text-base font-bold text-white">Connecting Live Preview...</h2>
            <p className="text-xs text-slate-400 max-w-sm">
              Establishing communication with your running WebContainer project. This window will close automatically.
            </p>
          </div>
        </>
      ) : (
        <div className="space-y-2 text-center max-w-md p-6 bg-rose-950/30 border border-rose-800/50 rounded-2xl">
          <h2 className="text-base font-bold text-rose-400">Connection Handshake</h2>
          <p className="text-xs text-slate-300">{errorMsg}</p>
          <p className="text-[11px] text-slate-500">
            You can return to the main workspace and use the Split View or Preview View mode directly in the app.
          </p>
        </div>
      )}
    </div>
  );
}
