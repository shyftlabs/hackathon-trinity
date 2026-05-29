"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, BookOpenText, ChevronRight, FileText, Layers,
  Network, Volume2, Zap, CheckSquare, RotateCcw, Send, Trophy, X, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_CLASS, MOCK_NOTES, MOCK_FLASHCARDS, MOCK_VISUAL } from "@/lib/mockData";
import { useSyncClass } from "@/lib/useSyncClass";

type Mode = "notes" | "flashcards" | "podcast" | "visual";

const MODES: { id: Mode; icon: typeof FileText; label: string; color: string }[] = [
  { id: "notes",      icon: FileText,     label: "Notes",      color: "#0066cc" },
  { id: "flashcards", icon: Layers,       label: "Flashcards", color: "#8b5cf6" },
  { id: "podcast",    icon: Volume2,      label: "Audio",      color: "#10b981" },
  { id: "visual",     icon: Network,      label: "Mind Map",   color: "#f59e0b" },
];

const SUGGESTIONS = [
  "Give me a full overview",
  "Focus on light-dependent reactions",
  "I'm struggling with ATP synthesis",
  "Summarise the key differences between PSI and PSII",
];

// ── Simple mind-map renderer ────────────────────────────────────────────────
function MindMapView() {
  const nodes = [
    { id: "photosynthesis", label: "Photosynthesis", x: 50, y: 50, main: true },
    { id: "light", label: "Light Reactions", x: 20, y: 25 },
    { id: "calvin", label: "Calvin Cycle", x: 80, y: 25 },
    { id: "psii", label: "Photosystem II", x: 10, y: 10 },
    { id: "psi", label: "Photosystem I", x: 30, y: 10 },
    { id: "atp", label: "ATP", x: 15, y: 42 },
    { id: "nadph", label: "NADPH", x: 30, y: 42 },
    { id: "g3p", label: "G3P", x: 80, y: 42 },
    { id: "co2", label: "CO₂ fixation", x: 90, y: 10 },
  ];
  const edges = [
    ["photosynthesis","light"], ["photosynthesis","calvin"],
    ["light","psii"], ["light","psi"], ["light","atp"], ["light","nadph"],
    ["calvin","g3p"], ["calvin","co2"],
  ];

  return (
    <div className="relative h-full w-full min-h-[360px]">
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        {edges.map(([a, b], i) => {
          const na = nodes.find(n => n.id === a)!;
          const nb = nodes.find(n => n.id === b)!;
          return (
            <line
              key={i}
              x1={`${na.x}%`} y1={`${na.y}%`}
              x2={`${nb.x}%`} y2={`${nb.y}%`}
              stroke="rgba(0,102,204,0.15)" strokeWidth={1.5}
            />
          );
        })}
      </svg>
      {nodes.map((n) => (
        <div
          key={n.id}
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-center text-[12px] font-medium transition hover:scale-105 cursor-default whitespace-nowrap",
            n.main
              ? "border-[#0066cc]/30 bg-[#0066cc] text-white text-[14px] font-semibold px-5 py-2.5 shadow-[0_8px_24px_rgba(0,102,204,0.25)]"
              : "border-[#1d1d1f]/12 bg-white text-[#424245] shadow-sm"
          )}
          style={{ left: `${n.x}%`, top: `${n.y}%`, zIndex: 1 }}
        >
          {n.label}
        </div>
      ))}
    </div>
  );
}

// ── Notes renderer (markdown-lite) ─────────────────────────────────────────
function NotesView({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-[#1d1d1f]">
      {content.split("\n").map((line, i) => {
        if (line.startsWith("## ")) return <h2 key={i} className="text-[22px] font-semibold tracking-[-0.02em] mt-6 mb-3">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-[17px] font-semibold mt-5 mb-2">{line.slice(4)}</h3>;
        if (line.startsWith("#### ")) return <h4 key={i} className="text-[15px] font-semibold mt-4 mb-1.5">{line.slice(5)}</h4>;
        if (line.startsWith("- ")) return <li key={i} className="ml-4 text-[15px] leading-7 text-[#424245] list-disc">{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</li>;
        if (line.startsWith("| ")) return null; // skip table rows
        if (line.trim() === "") return <div key={i} className="h-2" />;
        const formatted = line
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>");
        return <p key={i} className="text-[15px] leading-7 text-[#424245]" dangerouslySetInnerHTML={{ __html: formatted }} />;
      })}
    </div>
  );
}

// ── Flashcards view ─────────────────────────────────────────────────────────
function FlashcardsView() {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setFlipped(p => { const s = new Set(p); s.has(i) ? s.delete(i) : s.add(i); return s; });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {MOCK_FLASHCARDS.map((card, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          className="group relative h-44 w-full cursor-pointer [perspective:1000px] text-left"
        >
          <div className={cn(
            "absolute inset-0 w-full h-full transition-transform duration-500 [transform-style:preserve-3d]",
            flipped.has(i) ? "[transform:rotateY(180deg)]" : ""
          )}>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[20px] border border-[#1d1d1f]/10 bg-white p-5 text-center [backface-visibility:hidden]">
              <p className="font-medium text-[15px] text-[#1d1d1f] leading-6">{card.front}</p>
              <span className="absolute bottom-3 right-4 text-[11px] text-[#86868b]">tap to reveal</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-[20px] border border-[#0066cc]/20 bg-[#0066cc]/5 p-5 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
              <p className="text-[15px] font-medium text-[#1d1d1f] leading-6">{card.back}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Audio view ──────────────────────────────────────────────────────────────
function AudioView() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full border border-[#10b981]/20 bg-[#10b981]/8">
        <Volume2 className="size-9 text-[#10b981]" strokeWidth={1.5} />
      </div>
      <h3 className="text-[22px] font-semibold tracking-[-0.02em]">Audio Summary</h3>
      <p className="mt-2 max-w-[32ch] text-[15px] text-[#6e6e73]">
        A narrated walkthrough of Photosynthesis & the Light-Dependent Reactions.
      </p>
      <div className="mt-8 w-full max-w-sm rounded-[20px] border border-[#1d1d1f]/8 bg-white p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="size-10 shrink-0 rounded-full bg-[#10b981]/10 flex items-center justify-center">
            <Volume2 className="size-4 text-[#10b981]" strokeWidth={1.8} />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold">AP Biology · Audio Guide</p>
            <p className="text-[12px] text-[#86868b]">12 min · Dr. Chen&apos;s class</p>
          </div>
        </div>
        {/* Mock audio player */}
        <div className="h-1.5 overflow-hidden rounded-full bg-[#1d1d1f]/8">
          <div className="h-full w-1/3 rounded-full bg-[#10b981]" />
        </div>
        <div className="mt-2 flex justify-between text-[12px] text-[#86868b]">
          <span>4:02</span><span>12:00</span>
        </div>
      </div>
      <p className="mt-6 text-[13px] text-[#86868b]">Audio generation requires backend connection.</p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function StudentClassPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [activeMode, setActiveMode] = useState<Mode>("notes");
  const [chatInput, setChatInput] = useState("");
  const [studyStarted, setStudyStarted] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: `Hi! I'm Synapse. You're in **${MOCK_CLASS.name}** with ${MOCK_CLASS.teacher}. What would you like to study today?` }
  ]);
  const [generating, setGenerating] = useState(false);

  const handleSend = (text?: string) => {
    const msg = (text ?? chatInput).trim();
    if (!msg) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: msg }]);
    setGenerating(true);
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: "ai",
        text: `Got it — I'll build your study guide focused on **"${msg}"**. Here's your personalised Photosynthesis session ready to go. Use the sidebar to switch between modes.`
      }]);
      setGenerating(false);
      setStudyStarted(true);
    }, 1200);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-[#1d1d1f]/8 bg-white/60 backdrop-blur-2xl">
        {/* Header */}
        <div className="border-b border-[#1d1d1f]/8 px-4 py-4">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="flex size-7 items-center justify-center rounded-full border border-[#0066cc]/18 bg-[#0066cc]/8 text-[#0066cc]">
              <Zap className="size-3" strokeWidth={2} />
            </div>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">Synapse</span>
          </Link>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#86868b]">{MOCK_CLASS.name}</p>
          <p className="text-[14px] font-semibold text-[#1d1d1f] mt-0.5">{MOCK_CLASS.topic}</p>
          <p className="text-[12px] text-[#86868b]">{MOCK_CLASS.teacher}</p>
        </div>

        {/* Study modes */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">Study</p>
          <nav className="space-y-1">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[14px] font-medium transition-all duration-150 active:scale-[0.98]",
                  activeMode === mode.id
                    ? "bg-[#0066cc]/10 text-[#0066cc]"
                    : "text-[#424245] hover:bg-[#1d1d1f]/5"
                )}
              >
                <mode.icon
                  className="size-4 shrink-0"
                  style={{ color: activeMode === mode.id ? mode.color : "#86868b" }}
                  strokeWidth={1.8}
                />
                {mode.label}
                {activeMode === mode.id && <ChevronRight className="ml-auto size-3.5 text-[#0066cc]" />}
              </button>
            ))}
          </nav>

          {/* Quiz — separate section */}
          <div className="mt-4 border-t border-[#1d1d1f]/8 pt-4">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">Assessment</p>
            <Link
              href={`/student/class/${code}/quiz`}
              className="flex w-full items-center gap-3 rounded-[14px] border border-[#f59e0b]/20 bg-[#f59e0b]/6 px-3 py-2.5 text-left text-[14px] font-medium text-[#92400e] transition-all duration-150 hover:bg-[#f59e0b]/12 active:scale-[0.98]"
            >
              <Trophy className="size-4 shrink-0 text-[#f59e0b]" strokeWidth={1.8} />
              Take the quiz
              <ChevronRight className="ml-auto size-3.5" />
            </Link>
            <p className="mt-2 px-1 text-[11px] leading-4 text-[#86868b]">
              Open when you feel ready. You can always return to study first.
            </p>
          </div>
        </div>

        {/* Progress */}
        {studyStarted && (
          <div className="border-t border-[#1d1d1f]/8 px-4 py-4">
            <div className="flex items-center justify-between mb-1.5 text-[12px]">
              <span className="text-[#6e6e73]">Session progress</span>
              <span className="font-semibold">34%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#1d1d1f]/8">
              <div className="h-full w-1/3 rounded-full bg-[#0066cc] transition-all duration-700" />
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex h-14 items-center justify-between border-b border-[#1d1d1f]/8 bg-white/50 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-semibold">{MODES.find(m => m.id === activeMode)?.label ?? "Study"}</span>
            <span className="rounded-full border border-[#1d1d1f]/10 bg-[#f5f5f7] px-2 py-0.5 text-[12px] text-[#6e6e73]">
              {MOCK_CLASS.code}
            </span>
          </div>
          <Link
            href="/student"
            className="flex items-center gap-1.5 rounded-full border border-[#1d1d1f]/10 bg-white/60 px-3 py-1.5 text-[12px] text-[#6e6e73] transition hover:text-[#1d1d1f]"
          >
            <X className="size-3" strokeWidth={2} />
            Leave class
          </Link>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat panel (always visible left side of body, or full if not started) */}
          {!studyStarted ? (
            /* ── Pre-study: full chat ── */
            <div className="flex flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-8">
                {/* AI greeting */}
                <div className="mx-auto max-w-xl">
                  <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-[#0066cc]/20 bg-[#0066cc]/8">
                      <Zap className="size-6 text-[#0066cc]" strokeWidth={2} />
                    </div>
                    <h2 className="text-[26px] font-semibold tracking-[-0.025em]">What do you want to learn?</h2>
                    <p className="mt-2 text-[15px] text-[#6e6e73]">Tell me what to focus on and I&apos;ll build your study guide from Dr. Chen&apos;s materials.</p>
                  </div>

                  {/* Suggestions */}
                  <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="rounded-[16px] border border-[#1d1d1f]/10 bg-white/70 px-4 py-3 text-left text-[14px] text-[#424245] backdrop-blur-sm transition-all duration-150 hover:border-[#0066cc]/25 hover:bg-white hover:text-[#1d1d1f] active:scale-[0.98]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Messages */}
                  <div className="space-y-3 mb-4">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={cn("flex gap-3", m.role === "user" && "justify-end")}>
                        {m.role === "ai" && (
                          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0066cc]/10">
                            <Zap className="size-3.5 text-[#0066cc]" strokeWidth={2} />
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[80%] rounded-[16px] px-4 py-3 text-[14px] leading-6",
                          m.role === "ai"
                            ? "rounded-tl-sm bg-white border border-[#1d1d1f]/8 text-[#424245]"
                            : "rounded-tr-sm bg-[#0066cc] text-white"
                        )}>
                          {m.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                        </div>
                      </div>
                    ))}
                    {generating && (
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0066cc]/10">
                          <Zap className="size-3.5 text-[#0066cc]" strokeWidth={2} />
                        </div>
                        <div className="flex items-center gap-1.5 rounded-[16px] rounded-tl-sm border border-[#1d1d1f]/8 bg-white px-4 py-3">
                          {[0, 1, 2].map((j) => (
                            <div key={j} className="size-1.5 animate-bounce rounded-full bg-[#0066cc]/40" style={{ animationDelay: `${j * 120}ms` }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat input */}
              <div className="border-t border-[#1d1d1f]/8 bg-white/60 p-4 backdrop-blur-xl">
                <div className="mx-auto flex max-w-xl items-center gap-2 rounded-[20px] border border-[#1d1d1f]/10 bg-white/90 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition focus-within:border-[#0066cc]/40 focus-within:ring-4 focus-within:ring-[#0066cc]/8">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Tell me what you want to focus on..."
                    className="flex-1 bg-transparent px-3 text-[15px] text-[#1d1d1f] outline-none placeholder:text-[#86868b]"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!chatInput.trim() || generating}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0066cc] text-white transition-all duration-150 hover:bg-[#0071e3] active:scale-[0.97] disabled:opacity-40"
                  >
                    <Send className="size-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── Post-study: sidebar chat + main content ── */
            <div className="flex flex-1 overflow-hidden">
              {/* Content area */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="mx-auto max-w-3xl">
                  {activeMode === "notes" && <NotesView content={MOCK_NOTES} />}
                  {activeMode === "flashcards" && <FlashcardsView />}
                  {activeMode === "podcast" && <AudioView />}
                  {activeMode === "visual" && (
                    <div>
                      <h3 className="mb-4 text-[20px] font-semibold tracking-[-0.02em]">Knowledge Map</h3>
                      <div className="relative h-96 overflow-hidden rounded-[24px] border border-[#1d1d1f]/8 bg-white p-4">
                        <MindMapView />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact chat strip */}
              <div className="flex w-72 shrink-0 flex-col border-l border-[#1d1d1f]/8 bg-white/50 backdrop-blur-xl">
                <div className="border-b border-[#1d1d1f]/8 px-4 py-3">
                  <p className="text-[13px] font-semibold">Ask Synapse</p>
                  <p className="text-[11px] text-[#86868b]">Refine your study guide</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={cn("flex gap-2", m.role === "user" && "justify-end")}>
                      {m.role === "ai" && (
                        <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#0066cc]/10">
                          <Zap className="size-2.5 text-[#0066cc]" strokeWidth={2} />
                        </div>
                      )}
                      <p className={cn(
                        "max-w-[85%] rounded-[12px] px-3 py-2 text-[12px] leading-5",
                        m.role === "ai"
                          ? "rounded-tl-sm bg-[#f5f5f7] text-[#424245]"
                          : "rounded-tr-sm bg-[#0066cc] text-white"
                      )}>
                        {m.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                      </p>
                    </div>
                  ))}
                  {generating && (
                    <div className="flex gap-2">
                      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#0066cc]/10">
                        <Zap className="size-2.5 text-[#0066cc]" strokeWidth={2} />
                      </div>
                      <div className="flex items-center gap-1 rounded-[12px] rounded-tl-sm bg-[#f5f5f7] px-3 py-2">
                        {[0,1,2].map(j => <div key={j} className="size-1 animate-bounce rounded-full bg-[#0066cc]/40" style={{ animationDelay: `${j*120}ms` }} />)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-[#1d1d1f]/8 p-3">
                  <div className="flex items-center gap-2 rounded-[14px] border border-[#1d1d1f]/10 bg-white/90 px-3 py-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Ask something..."
                      className="flex-1 bg-transparent text-[13px] text-[#1d1d1f] outline-none placeholder:text-[#86868b]"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!chatInput.trim() || generating}
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0066cc] text-white transition active:scale-[0.97] disabled:opacity-40"
                    >
                      <Send className="size-3" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
