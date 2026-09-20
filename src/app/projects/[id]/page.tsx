"use client";

import React, { use } from "react";
import ProjectWorkspaceSlugPage from "@/app/project/[slug]/page";

export default function ProjectWorkspaceIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  return (
    <ProjectWorkspaceSlugPage
      params={Promise.resolve({ slug: projectId })}
    />
  );
}
