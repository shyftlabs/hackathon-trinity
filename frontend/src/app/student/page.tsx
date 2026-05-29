"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { MOCK_CLASS } from "@/lib/mockData";

export default function StudentPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("Please enter a class code."); return; }
    if (trimmed !== MOCK_CLASS.code) {
      setError(`No class found for "${trimmed}". Try SYN-4829 for the demo.`);
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => router.push(`/student/class/${trimmed}`), 500);
  };

  const handleDemo = () => {
    setLoading(true);
    setTimeout(() => router.push(`/student/class/${MOCK_CLASS.code}`), 300);
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#0066cc]/15">
      <div className="pointer-events-none absolute inset-0 liquid-canvas" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.96),rgba(245,245,247,0)_68%)]" />
      <Navbar />

      <main className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          {/* Pill badge */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-[13px] font-medium text-[#424245] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl">
              <BookOpen className="size-3.5 text-[#0066cc]" strokeWidth={1.8} />
              Join a class
            </div>
          </div>

          <h1 className="mb-2 text-center text-[40px] font-semibold leading-[1.05] tracking-[-0.025em]">
            Enter your class code.
          </h1>
          <p className="mb-10 text-center text-[17px] text-[#6e6e73]">
            Your teacher will share a code or link to get you in.
          </p>

          {/* Glass card */}
          <div className="liquid-shell rounded-[34px] p-3">
            <div className="rounded-[26px] border border-white/70 bg-[#fbfbfd]/76 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-2xl">
              <form onSubmit={handleJoin} className="space-y-3">
                <div className={`rounded-[18px] border bg-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition focus-within:ring-4 ${error ? "border-red-300 focus-within:ring-red-200/40" : "border-[#1d1d1f]/10 focus-within:border-[#0066cc]/45 focus-within:ring-[#0066cc]/10"}`}>
                  <input
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setError(""); }}
                    placeholder="e.g. SYN-4829"
                    className="h-14 w-full bg-transparent px-4 font-mono text-[20px] tracking-wider text-[#1d1d1f] outline-none placeholder:text-[#86868b] placeholder:font-sans placeholder:tracking-normal placeholder:text-[17px]"
                    autoFocus
                    autoCapitalize="characters"
                  />
                </div>

                {error && (
                  <p className="text-[13px] text-red-500 px-1">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0066cc] text-[15px] font-medium text-white transition-all duration-150 hover:bg-[#0071e3] active:scale-[0.97] disabled:opacity-60"
                >
                  {loading ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Join class
                      <ArrowRight className="size-4" strokeWidth={1.8} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#1d1d1f]/8" />
                <span className="text-[12px] text-[#86868b]">or</span>
                <div className="h-px flex-1 bg-[#1d1d1f]/8" />
              </div>

              <button
                onClick={handleDemo}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#1d1d1f]/12 bg-white/60 text-[14px] font-medium text-[#424245] transition-all duration-150 hover:bg-white active:scale-[0.97]"
              >
                <Zap className="size-3.5 text-[#0066cc]" strokeWidth={2} />
                Open demo class (AP Biology)
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-[13px] text-[#86868b]">
            Teacher?{" "}
            <Link href="/teacher" className="text-[#0066cc] transition hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
