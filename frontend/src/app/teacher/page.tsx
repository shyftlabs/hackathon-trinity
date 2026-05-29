"use client";

import Link from "next/link";
import { ArrowRight, Zap, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";

export default function TeacherPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router.push("/teacher/dashboard"), 600);
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
              <GraduationCap className="size-3.5 text-[#0066cc]" strokeWidth={1.8} />
              Teacher access
            </div>
          </div>

          <h1 className="mb-2 text-center text-[40px] font-semibold leading-[1.05] tracking-[-0.025em]">
            Welcome back.
          </h1>
          <p className="mb-10 text-center text-[17px] text-[#6e6e73]">
            Sign in to manage your classroom and track student progress.
          </p>

          {/* Glass card */}
          <div className="liquid-shell rounded-[34px] p-3">
            <div className="rounded-[26px] border border-white/70 bg-[#fbfbfd]/76 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-2xl">
              <form onSubmit={handleEnter} className="space-y-3">
                <div className="rounded-[18px] border border-[#1d1d1f]/10 bg-white/82 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition focus-within:border-[#0066cc]/45 focus-within:ring-4 focus-within:ring-[#0066cc]/10">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@school.edu"
                    className="h-12 w-full bg-transparent text-[17px] text-[#1d1d1f] outline-none placeholder:text-[#86868b]"
                    required
                  />
                </div>

                <div className="rounded-[18px] border border-[#1d1d1f]/10 bg-white/82 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition focus-within:border-[#0066cc]/45 focus-within:ring-4 focus-within:ring-[#0066cc]/10">
                  <input
                    type="password"
                    placeholder="Password"
                    className="h-12 w-full bg-transparent text-[17px] text-[#1d1d1f] outline-none placeholder:text-[#86868b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0066cc] text-[15px] font-medium text-white transition-all duration-150 hover:bg-[#0071e3] active:scale-[0.97] disabled:opacity-60"
                >
                  {loading ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Enter classroom
                      <ArrowRight className="size-4" strokeWidth={1.8} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center text-[13px] text-[#86868b]">
                For the demo, any credentials work.{" "}
                <button
                  onClick={() => { setLoading(true); setTimeout(() => router.push("/teacher/dashboard"), 400); }}
                  className="text-[#0066cc] transition hover:underline"
                >
                  Skip to dashboard →
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[13px] text-[#86868b]">
            Student?{" "}
            <Link href="/student" className="text-[#0066cc] transition hover:underline">
              Join a class instead
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
