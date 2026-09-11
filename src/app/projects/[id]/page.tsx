"use client";

import React, { use } from "react";
import CodingEnvironment from "@/components/CodingEnvironment";

export default function ProjectWorkspaceIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  return <CodingEnvironment projectIdOrSlug={projectId} />;
}
