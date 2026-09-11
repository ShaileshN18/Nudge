"use client";

import React, { use } from "react";
import CodingEnvironment from "@/components/CodingEnvironment";

export default function ProjectWorkspaceSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  return <CodingEnvironment projectIdOrSlug={slug} />;
}
