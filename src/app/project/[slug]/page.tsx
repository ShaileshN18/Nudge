"use client";

import React, { use } from "react";
import CodingEnvironment from "@/components/CodingEnvironment";
import { authSeedProject } from "@/lib/seedProject";

export default function ProjectWorkspaceSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  // Pass seed project directly for the "build-auth" slug to avoid API round-trips
  // and ensure the workspace loads instantly even when MongoDB is offline.
  const isAuthSlug =
    slug === "build-auth" ||
    slug === "build_auth" ||
    slug === "build-express-mongodb-auth" ||
    slug === "default";

  return (
    <CodingEnvironment
      projectIdOrSlug={slug}
      initialProject={isAuthSlug ? (authSeedProject as any) : undefined}
    />
  );
}
