"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CodingEnvironment from "@/components/CodingEnvironment";
import { authSeedProject, feedbackBoardSeedProject } from "@/lib/seedProject";
import { RefreshCw, Lock } from "lucide-react";

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
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    async function verifyAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (isSubscribed) {
          if (res.ok && data.success && data.user) {
            setIsAuthenticated(true);
            setUser(data.user);
            setAuthChecking(false);
          } else {
            setIsAuthenticated(false);
            setAuthChecking(false);
            router.replace(`/login?redirect=/project/${encodeURIComponent(slug)}`);
          }
        }
      } catch (err) {
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
      <div className="h-screen w-screen bg-[#07090f] flex flex-col items-center justify-center space-y-4 text-white">
        <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Verifying authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-[#07090f] flex flex-col items-center justify-center space-y-4 text-white">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Lock className="h-6 w-6 text-amber-400" />
        </div>
        <p className="text-slate-300 text-sm font-semibold">Authentication required to access projects</p>
        <p className="text-slate-500 text-xs">Redirecting to login...</p>
      </div>
    );
  }

  const isFeedbackSlug =
    slug === "feedback-board" ||
    slug === "feedback_board" ||
    slug === "build-feedback-board";

  const isAuthSlug =
    slug === "build-auth" ||
    slug === "build_auth" ||
    slug === "build-express-mongodb-auth" ||
    slug === "default";

  let initialProject = undefined;
  if (isFeedbackSlug) {
    initialProject = feedbackBoardSeedProject as any;
  } else if (isAuthSlug) {
    initialProject = authSeedProject as any;
  }

  return (
    <CodingEnvironment
      projectIdOrSlug={slug}
      initialProject={initialProject}
      user={user}
    />
  );
}
