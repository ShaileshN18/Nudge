"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CodingEnvironment from "@/components/CodingEnvironment";
import { RotateCw, Lock } from "lucide-react";

export default function ProjectWorkspaceSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    async function verifyAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (isSubscribed) {
          if (res.ok && data.success && data.user) {
            setIsAuthenticated(true);
            setAuthChecking(false);
          } else {
            setIsAuthenticated(false);
            setAuthChecking(false);
            router.replace(`/login?redirect=/project/${encodeURIComponent(slug)}`);
          }
        }
      } catch {
        if (isSubscribed) {
          setIsAuthenticated(false);
          setAuthChecking(false);
          router.replace(`/login?redirect=/project/${encodeURIComponent(slug)}`);
        }
      }
    }

    verifyAuth();

    return () => {
      isSubscribed = false;
    };
  }, [slug, router]);

  if (authChecking) {
    return (
      <div className="h-screen w-screen bg-[#080C0D] flex flex-col items-center justify-center space-y-4 text-white">
        <RotateCw className="h-8 w-8 text-[#67D6B2] animate-spin" />
        <p className="text-[#A9B5B2] text-xs font-medium">
          Loading workspace & checking authorization...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-[#080C0D] flex flex-col items-center justify-center space-y-4 text-white">
        <div className="h-12 w-12 rounded-2xl bg-[#E9C46A]/10 border border-[#E9C46A]/20 flex items-center justify-center">
          <Lock className="h-6 w-6 text-[#E9C46A]" />
        </div>
        <p className="text-white text-sm font-semibold">
          Authentication required to access workspace
        </p>
        <p className="text-[#71807C] text-xs">Redirecting to login...</p>
      </div>
    );
  }

  return <CodingEnvironment projectSlug={slug} />;
}
