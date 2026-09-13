"use client";

import React from "react";
import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
  type PanelImperativeHandle,
} from "react-resizable-panels";

export type { PanelImperativeHandle };
import { GripVertical, GripHorizontal } from "lucide-react";

export function ResizablePanelGroup({
  className = "",
  orientation = "horizontal",
  ...props
}: GroupProps) {
  return (
    <Group
      orientation={orientation}
      className={`flex h-full w-full ${
        orientation === "vertical" ? "flex-col" : "flex-row"
      } ${className}`}
      {...props}
    />
  );
}

export function ResizablePanel({
  className = "",
  ...props
}: PanelProps) {
  return (
    <Panel
      className={`relative overflow-hidden ${className}`}
      {...props}
    />
  );
}

export interface ResizableHandleProps extends SeparatorProps {
  withHandle?: boolean;
  orientation?: "horizontal" | "vertical";
}

export function ResizableHandle({
  withHandle = true,
  orientation = "horizontal",
  className = "",
  ...props
}: ResizableHandleProps) {
  const isVertical = orientation === "vertical";

  return (
    <Separator
      className={`group relative flex items-center justify-center transition-colors duration-150 select-none shrink-0 ${
        isVertical
          ? "h-1.5 w-full cursor-row-resize bg-[#090d16] hover:bg-indigo-600/40 data-[separator=active]:bg-indigo-500 border-y border-slate-800/80"
          : "w-1.5 h-full cursor-col-resize bg-[#090d16] hover:bg-indigo-600/40 data-[separator=active]:bg-indigo-500 border-x border-slate-800/80"
      } ${className}`}
      {...props}
    >
      {withHandle && (
        <div
          className={`z-20 flex items-center justify-center rounded bg-slate-800/90 border border-slate-700/80 group-hover:bg-indigo-500 group-hover:border-indigo-400 group-data-[separator=active]:bg-indigo-500 group-data-[separator=active]:border-indigo-400 text-slate-400 group-hover:text-white transition-all shadow-sm ${
            isVertical ? "h-2 w-7" : "h-7 w-2"
          }`}
        >
          {isVertical ? (
            <GripHorizontal className="h-2.5 w-2.5" />
          ) : (
            <GripVertical className="h-2.5 w-2.5" />
          )}
        </div>
      )}
    </Separator>
  );
}
