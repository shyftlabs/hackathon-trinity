"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenText,
  Check,
  FileText,
  Image as ImageIcon,
  Layers,
  Loader2,
  Mic,
  Network,
  Paperclip,
  Sparkles,
  Volume2,
  X,
  Zap,
} from "lucide-react";

import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STUDY_MODES = [
  { id: "notes", icon: BookOpenText, label: "Notes" },
  { id: "flashcards", icon: Layers, label: "Cards" },
  { id: "quiz", icon: Check, label: "Quiz" },
  { id: "podcast", icon: Volume2, label: "Audio" },
  { id: "quest", icon: Zap, label: "Quest" },
  { id: "visual", icon: Network, label: "Map" },
] as const;

const WORKFLOW_STEPS = [
  "Read the source",
  "Find the structure",
  "Build the session",
  "Save your path",
];

export default function LandingPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [selectedModes, setSelectedModes] = useState<string[]>(["notes"]);
  const [isDragging, setIsDragging] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addSession } = useAppStore();

  const toggleMode = (id: string) => {
    setSelectedModes((prev) =>
      prev.includes(id) && prev.length > 1
        ? prev.filter((mode) => mode !== id)
        : prev.includes(id)
          ? prev
          : [...prev, id],
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (
      e.relatedTarget === null ||
      (e.currentTarget.contains && !e.currentTarget.contains(e.relatedTarget as Node))
    ) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && attachedFiles.length === 0) return;

    setIsProcessing(true);
    try {
      const finalTopic = topic.trim();
      const response = await addSession(finalTopic, attachedFiles, selectedModes);

      if (response?.id) {
        const params = new URLSearchParams({
          sessionId: response.id,
          modes: selectedModes.join(","),
          topic: finalTopic,
        });
        router.push(`/loading?${params.toString()}`);
      }
    } catch (error) {
      console.error("Session creation failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#0066cc]/15 selection:text-[#003f7f]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="pointer-events-none absolute inset-0 liquid-canvas" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.96),rgba(245,245,247,0)_68%)]" />
      <Navbar />

      {isDragging && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f5f5f7]/80 p-6 backdrop-blur-2xl">
          <div className="liquid-panel flex w-full max-w-md flex-col items-center px-8 py-10 text-center">
            <div className="mb-6 flex size-14 items-center justify-center rounded-[18px] border border-white/80 bg-white/70 text-[#0066cc] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <Paperclip className="size-6" strokeWidth={1.8} />
            </div>
            <h2 className="text-[28px] font-semibold leading-tight">
              Drop materials here
            </h2>
            <p className="mt-3 max-w-[28ch] text-[15px] leading-6 text-[#6e6e73]">
              Add PDFs, docs, audio, video, or images to start a study session.
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1440px] items-center px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <section className="grid w-full items-center gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="px-2 py-6 sm:px-6 lg:py-12">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-[13px] font-medium text-[#424245] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl">
              <Sparkles className="size-3.5 text-[#0066cc]" strokeWidth={1.8} />
              Flux workspace
            </div>

            <h1 className="max-w-[11ch] text-6xl font-semibold leading-[0.98] text-balance sm:text-7xl lg:text-8xl xl:text-9xl">
              Study from the source.
            </h1>
            <p className="mt-6 max-w-[34rem] text-[19px] leading-8 text-[#6e6e73]">
              Upload course material, choose the formats you need, and Flux turns it into a focused session you can review, hear, map, or test.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-[#1d1d1f]/10 overflow-hidden rounded-[22px] border border-white/70 bg-white/45 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl">
              <div className="px-4 py-4">
                <div className="text-2xl font-semibold tabular-nums">6</div>
                <div className="mt-1 text-xs text-[#6e6e73]">study formats</div>
              </div>
              <div className="px-4 py-4">
                <div className="text-2xl font-semibold tabular-nums">4</div>
                <div className="mt-1 text-xs text-[#6e6e73]">build steps</div>
              </div>
              <div className="px-4 py-4">
                <div className="text-2xl font-semibold tabular-nums">1</div>
                <div className="mt-1 text-xs text-[#6e6e73]">clean path</div>
              </div>
            </div>
          </div>

          <div className="liquid-shell relative overflow-hidden rounded-[34px] p-3 sm:p-4">
            <div className="rounded-[26px] border border-white/70 bg-[#fbfbfd]/76 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-2xl sm:p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-[#6e6e73]">New session</p>
                  <h2 className="mt-1 text-[28px] font-semibold leading-none">
                    Build your study set
                  </h2>
                </div>
                <div className="hidden rounded-full border border-[#1d1d1f]/10 bg-white/70 px-3 py-1.5 text-[13px] font-medium text-[#424245] sm:block">
                  Ready
                </div>
              </div>

              <form onSubmit={handleStartSession} className="space-y-4">
                <div className="rounded-[22px] border border-[#1d1d1f]/10 bg-white/82 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition focus-within:border-[#0066cc]/45 focus-within:ring-4 focus-within:ring-[#0066cc]/10">
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What do you want to study?"
                    className="h-12 w-full bg-transparent px-3 text-[17px] text-[#1d1d1f] outline-none placeholder:text-[#86868b]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {STUDY_MODES.map((mode) => {
                    const isSelected = selectedModes.includes(mode.id);
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => toggleMode(mode.id)}
                        className={cn(
                          "group flex min-h-20 flex-col items-center justify-center gap-2 rounded-[18px] border px-2 text-[13px] font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0066cc]/20 active:scale-[0.98]",
                          isSelected
                            ? "border-[#0066cc]/35 bg-[#0066cc] text-white shadow-[0_10px_30px_rgba(0,102,204,0.18)]"
                            : "border-[#1d1d1f]/10 bg-white/68 text-[#424245] hover:border-[#0066cc]/25 hover:bg-white",
                        )}
                      >
                        <mode.icon
                          className={cn("size-4", isSelected ? "text-white" : "text-[#0066cc]")}
                          strokeWidth={1.8}
                        />
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 rounded-[18px] border border-[#1d1d1f]/10 bg-white/58 p-3">
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex max-w-full items-center gap-2 rounded-[12px] border border-[#1d1d1f]/10 bg-white/80 px-3 py-2 text-[13px] font-medium text-[#424245]"
                      >
                        <FileText className="size-3.5 text-[#0066cc]" strokeWidth={1.8} />
                        <span className="max-w-[180px] truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="rounded-full p-0.5 text-[#86868b] transition hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[#1d1d1f]/10 bg-white/56 p-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="flex size-10 items-center justify-center rounded-[14px] text-[#6e6e73] transition hover:bg-white hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0066cc]/20"
                      title="Attach document"
                    >
                      <Paperclip className="size-4" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="flex size-10 items-center justify-center rounded-[14px] text-[#6e6e73] transition hover:bg-white hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0066cc]/20"
                      title="Upload image"
                    >
                      <ImageIcon className="size-4" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="flex size-10 items-center justify-center rounded-[14px] text-[#6e6e73] transition hover:bg-white hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0066cc]/20"
                      title="Add audio"
                    >
                      <Mic className="size-4" strokeWidth={1.8} />
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={(!topic.trim() && attachedFiles.length === 0) || isProcessing}
                    className="h-10 rounded-full bg-[#0066cc] px-5 text-[14px] font-medium text-white shadow-none transition hover:bg-[#0071e3] active:scale-95 disabled:opacity-45"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        Start
                        <ArrowRight className="size-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-5 grid gap-3 lg:grid-cols-[0.88fr_1.12fr]">
                <div className="rounded-[22px] border border-[#1d1d1f]/10 bg-white/58 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold">Pipeline</h3>
                    <span className="text-[12px] text-[#86868b]">local preview</span>
                  </div>
                  <div className="space-y-3">
                    {WORKFLOW_STEPS.map((step, index) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className="flex size-7 items-center justify-center rounded-full border border-[#0066cc]/20 bg-[#0066cc]/8 text-[12px] font-semibold text-[#0066cc]">
                          {index + 1}
                        </div>
                        <div className="h-px flex-1 bg-[#1d1d1f]/10" />
                        <span className="w-28 text-right text-[13px] text-[#6e6e73]">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[22px] border border-[#1d1d1f]/10 bg-[#1d1d1f] p-4 text-white">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.16),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(0,102,204,0.35),transparent_30%)]" />
                  <div className="relative">
                    <div className="mb-8 flex items-center justify-between text-[12px] text-white/62">
                      <span>session map</span>
                      <span>{selectedModes.length} formats</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedModes.map((mode, index) => (
                        <div
                          key={mode}
                          className={cn(
                            "h-20 rounded-[14px] border border-white/12 bg-white/[0.08] backdrop-blur-md",
                            index === 0 && "col-span-2",
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-5 max-w-[28ch] text-[13px] leading-5 text-white/70">
                      Selected formats become a single session with notes, checks, and review paths kept together.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
