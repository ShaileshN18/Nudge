"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, AlertCircle, Sparkles, Lock, Mail } from "lucide-react";
import NudgeLogo from "@/components/NudgeLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid email or password");
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080C0D] text-[#F4F7F6] p-6 relative overflow-hidden bg-developer-grid">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#67D6B2]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full rounded-3xl bg-[#0D1214] border border-[#202A2C] p-8 space-y-6 shadow-2xl relative z-10">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <NudgeLogo size="md" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-[#A9B5B2]">
            Log in to resume your active projects and task progression.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#F06A6A]/10 border border-[#F06A6A]/20 text-[#F06A6A] text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A9B5B2] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#11181A] border border-[#202A2C] text-sm text-white placeholder-[#4B5754] focus:outline-none focus:border-[#67D6B2] focus:ring-1 focus:ring-[#67D6B2] transition-colors"
              />
              <Mail className="w-4 h-4 text-[#71807C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A9B5B2] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#11181A] border border-[#202A2C] text-sm text-white placeholder-[#4B5754] focus:outline-none focus:border-[#67D6B2] focus:ring-1 focus:ring-[#67D6B2] transition-colors"
              />
              <Lock className="w-4 h-4 text-[#71807C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#67D6B2] to-[#10B981] hover:opacity-90 disabled:opacity-50 text-[#080C0D] text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#67D6B2]/20 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-[#71807C] pt-2 border-t border-[#202A2C]">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup?redirect=${encodeURIComponent(redirectPath)}`}
            className="text-[#67D6B2] font-semibold hover:underline"
          >
            Create one free
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080C0D]" />}>
      <LoginForm />
    </Suspense>
  );
}
