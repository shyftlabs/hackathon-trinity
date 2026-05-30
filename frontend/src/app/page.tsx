"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, BookOpenText, Check, FileText, Layers, Mic, Network, Paperclip, Sparkles, Upload, Volume2, X, Zap } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";

const HOW_IT_WORKS = [
  {
    step: "01",
    role: "Teacher",
    title: "Upload your material.",
    body: "Drop in PDFs, slides, audio recordings, or lecture videos. Synapse reads everything and builds a knowledge base for your class.",
    dark: false,
  },
  {
    step: "02",
    role: "Teacher",
    title: "Choose study modes.",
    body: "Pick which formats your students can access — smart notes, flashcard decks, audio summaries, and mind maps. One toggle per mode.",
    dark: true,
  },
  {
    step: "03",
    role: "Student",
    title: "Tell Synapse what to focus on.",
    body: "Students chat with Synapse to explain what they want to learn. The AI builds a personalised study guide from your uploaded material.",
    dark: false,
  },
  {
    step: "04",
    role: "Student",
    title: "Study, then prove it.",
    body: "Work through notes, cards, and audio at your own pace. When ready, open the quiz window to test your knowledge and track growth.",
    dark: true,
  },
];

const FEATURES = [
  { icon: FileText, label: "Smart notes" },
  { icon: Layers, label: "Flashcards" },
  { icon: Volume2, label: "Audio" },
  { icon: Network, label: "Mind maps" },
  { icon: Check, label: "Adaptive quiz" },
  { icon: Sparkles, label: "AI summaries" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#0066cc]/15 selection:text-[#003f7f]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 liquid-canvas" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.96),rgba(245,245,247,0)_68%)]" />

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1440px] items-center px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <section className="grid w-full items-center gap-5 lg:grid-cols-[1fr_1fr]">
          {/* Left — copy */}
          <div className="px-2 py-6 sm:px-6 lg:py-12">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-[13px] font-medium text-[#424245] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl">
              <Zap className="size-3.5 text-[#0066cc]" strokeWidth={2} />
              AI study platform
            </div>

            <h1 className="max-w-[12ch] text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.96] tracking-[-0.03em] text-balance">
              Learning that connects.
            </h1>

            <p className="mt-6 max-w-[34rem] text-[19px] leading-8 text-[#6e6e73]">
              Teachers upload course material. Students get AI-powered study guides — personalised notes, cards, audio, and maps — all from a single class link.
            </p>

            {/* Stats */}
            <div className="mt-10 grid max-w-sm grid-cols-3 divide-x divide-[#1d1d1f]/10 overflow-hidden rounded-[22px] border border-white/70 bg-white/45 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl">
              <div className="px-4 py-4">
                <div className="text-2xl font-semibold tabular-nums">2</div>
                <div className="mt-1 text-xs text-[#6e6e73]">roles</div>
              </div>
              <div className="px-4 py-4">
                <div className="text-2xl font-semibold tabular-nums">5</div>
                <div className="mt-1 text-xs text-[#6e6e73]">study formats</div>
              </div>
              <div className="px-4 py-4">
                <div className="text-2xl font-semibold tabular-nums">1</div>
                <div className="mt-1 text-xs text-[#6e6e73]">class link</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/teacher"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1d1d1f] px-6 text-[15px] font-medium text-white transition-all duration-150 hover:bg-[#2d2d2f] active:scale-[0.97]"
              >
                I&apos;m a teacher
                <ArrowRight className="size-4" strokeWidth={1.8} />
              </Link>
              <Link
                href="/student"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-[#0066cc]/30 bg-white/60 px-6 text-[15px] font-medium text-[#0066cc] backdrop-blur-xl transition-all duration-150 hover:bg-[#0066cc]/5 active:scale-[0.97]"
              >
                I&apos;m a student
              </Link>
            </div>
          </div>

          {/* Right — preview card */}
          <div className="liquid-shell relative overflow-hidden rounded-[34px] p-3 sm:p-4">
            <div className="rounded-[26px] border border-white/70 bg-[#fbfbfd]/76 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-2xl">
              {/* Card header */}
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-[#6e6e73]">AP Biology · SYN-4829</p>
                  <h2 className="mt-1 text-[22px] font-semibold leading-none">Photosynthesis</h2>
                </div>
                <span className="rounded-full border border-[#1d1d1f]/10 bg-white/70 px-3 py-1.5 text-[13px] font-medium text-[#424245]">
                  Live
                </span>
              </div>

              {/* Chat preview */}
              <div className="rounded-[20px] border border-[#1d1d1f]/8 bg-white/70 p-3 mb-4 space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0066cc]/10 text-[#0066cc]">
                    <Zap className="size-3" strokeWidth={2} />
                  </div>
                  <p className="text-[13px] leading-5 text-[#1d1d1f]">
                    Hi! What would you like to study today in <strong>Photosynthesis</strong>?
                  </p>
                </div>
                <div className="flex items-start gap-2.5 justify-end">
                  <p className="rounded-[14px] rounded-tr-sm bg-[#0066cc] px-3 py-2 text-[13px] leading-5 text-white max-w-[80%]">
                    I need to understand the light-dependent reactions
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0066cc]/10 text-[#0066cc]">
                    <Zap className="size-3" strokeWidth={2} />
                  </div>
                  <p className="text-[13px] leading-5 text-[#1d1d1f]">
                    Got it — building your study guide focused on the light-dependent reactions...
                  </p>
                </div>
              </div>

              {/* Modes grid */}
              <div className="grid grid-cols-3 gap-2">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.label}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-[#1d1d1f]/8 bg-white/60 py-3 text-center"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <f.icon className="size-4 text-[#0066cc]" strokeWidth={1.8} />
                    <span className="text-[11px] font-medium text-[#424245]">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10">
        {HOW_IT_WORKS.map((item) => (
          <div
            key={item.step}
            className={`w-full py-24 px-6 ${item.dark ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"}`}
          >
            <div className="mx-auto max-w-4xl">
              <div className="flex items-start gap-8">
                <div className={`shrink-0 text-[80px] font-semibold leading-none tracking-[-0.04em] ${item.dark ? "text-white/10" : "text-[#1d1d1f]/10"}`}>
                  {item.step}
                </div>
                <div className="pt-3">
                  <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-medium ${item.dark ? "border-white/15 text-white/50" : "border-[#1d1d1f]/12 text-[#6e6e73]"}`}>
                    {item.role}
                  </div>
                  <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
                    {item.title}
                  </h2>
                  <p className={`mt-4 max-w-[42ch] text-[19px] leading-8 ${item.dark ? "text-white/60" : "text-[#6e6e73]"}`}>
                    {item.body}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────────── */}
      <section className="relative z-10 bg-[#f5f5f7] py-32 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.025em]">
            Ready to get started?
          </h2>
          <p className="mt-5 text-[19px] leading-8 text-[#6e6e73]">
            Set up a classroom in minutes. Students join with a code.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/teacher"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#0066cc] px-7 text-[15px] font-medium text-white transition-all duration-150 hover:bg-[#0071e3] active:scale-[0.97]"
            >
              Create a classroom
              <ArrowRight className="size-4" strokeWidth={1.8} />
            </Link>
            <Link
              href="/student"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[#1d1d1f]/15 bg-white/60 px-7 text-[15px] font-medium text-[#1d1d1f] backdrop-blur-xl transition-all duration-150 hover:bg-white active:scale-[0.97]"
            >
              Join as student
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
