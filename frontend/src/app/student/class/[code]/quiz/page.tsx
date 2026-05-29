"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RotateCcw, Trophy, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_CLASS, MOCK_QUIZ } from "@/lib/mockData";

export default function StudentQuizPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleSubmit = () => {
    let correct = 0;
    MOCK_QUIZ.forEach((q, i) => {
      if (selectedAnswers[i] === q.answer_index) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    // scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const percent = score !== null ? Math.round((score / MOCK_QUIZ.length) * 100) : null;

  const getGrade = (pct: number) => {
    if (pct >= 90) return { label: "Excellent", color: "#10b981" };
    if (pct >= 70) return { label: "Good", color: "#0066cc" };
    if (pct >= 50) return { label: "Keep studying", color: "#f59e0b" };
    return { label: "Review needed", color: "#ef4444" };
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-[#1d1d1f]/8 bg-white/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link
            href={`/student/class/${code}`}
            className="flex items-center gap-2 text-[14px] font-medium text-[#6e6e73] transition hover:text-[#1d1d1f]"
          >
            <ArrowLeft className="size-4" strokeWidth={1.8} />
            Back to study guide
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full border border-[#0066cc]/18 bg-[#0066cc]/8">
              <Zap className="size-3.5 text-[#0066cc]" strokeWidth={2} />
            </div>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">Synapse</span>
          </div>

          <div className="text-[13px] text-[#86868b]">
            {submitted
              ? `Score: ${score}/${MOCK_QUIZ.length}`
              : `${answeredCount} / ${MOCK_QUIZ.length} answered`}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/25 bg-[#f59e0b]/8 px-3 py-1.5 text-[13px] font-medium text-[#92400e]">
            <Trophy className="size-3.5 text-[#f59e0b]" strokeWidth={1.8} />
            Knowledge check
          </div>
          <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.025em]">
            {MOCK_CLASS.name} Quiz
          </h1>
          <p className="mt-2 text-[17px] text-[#6e6e73]">
            {MOCK_CLASS.topic} · {MOCK_QUIZ.length} questions
          </p>
        </div>

        {/* Score card (shown after submit) */}
        {submitted && score !== null && (() => {
          const grade = getGrade(percent!);
          return (
            <div
              className="mb-8 overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)]"
            >
              <div className="px-8 py-8 text-center">
                <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full border-4" style={{ borderColor: `${grade.color}30`, backgroundColor: `${grade.color}10` }}>
                  <span className="text-[28px] font-bold" style={{ color: grade.color }}>
                    {percent}%
                  </span>
                </div>
                <h2 className="text-[26px] font-semibold">{grade.label}</h2>
                <p className="mt-1 text-[17px] text-[#6e6e73]">
                  {score} out of {MOCK_QUIZ.length} correct
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 rounded-full border border-[#1d1d1f]/12 bg-[#f5f5f7] px-5 py-2.5 text-[14px] font-medium text-[#1d1d1f] transition hover:bg-white active:scale-[0.97]"
                  >
                    <RotateCcw className="size-4" strokeWidth={1.8} />
                    Try again
                  </button>
                  <Link
                    href={`/student/class/${code}`}
                    className="flex items-center gap-2 rounded-full bg-[#0066cc] px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#0071e3] active:scale-[0.97]"
                  >
                    Keep studying
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Questions */}
        <div className="space-y-6">
          {MOCK_QUIZ.map((q, i) => {
            const selected = selectedAnswers[i];
            const isCorrect = submitted && selected === q.answer_index;
            const isWrong = submitted && selected !== undefined && selected !== q.answer_index;

            return (
              <div
                key={i}
                className={cn(
                  "rounded-[24px] border bg-white p-6 transition-all",
                  submitted
                    ? isCorrect
                      ? "border-[#10b981]/30 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]"
                      : isWrong
                        ? "border-[#ef4444]/30 shadow-[0_0_0_1px_rgba(239,68,68,0.12)]"
                        : selected === undefined
                          ? "border-[#f59e0b]/30"
                          : "border-[#1d1d1f]/10"
                    : "border-[#1d1d1f]/8 hover:border-[#1d1d1f]/16"
                )}
              >
                {/* Question header */}
                <div className="mb-5 flex items-start gap-3">
                  <div className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
                    submitted && isCorrect
                      ? "bg-[#10b981] text-white"
                      : submitted && isWrong
                        ? "bg-[#ef4444] text-white"
                        : "border border-[#1d1d1f]/10 bg-[#f5f5f7] text-[#6e6e73]"
                  )}>
                    {submitted
                      ? isCorrect ? <Check className="size-4" strokeWidth={2.5} /> : isWrong ? <X className="size-4" strokeWidth={2.5} /> : i + 1
                      : i + 1}
                  </div>
                  <p className="text-[16px] font-medium leading-6 text-[#1d1d1f]">{q.question}</p>
                </div>

                {/* Options */}
                <div className="space-y-2 pl-10">
                  {q.options.map((opt, oi) => {
                    const isSelected = selected === oi;
                    const isCorrectOption = submitted && oi === q.answer_index;
                    const isWrongSelected = submitted && isSelected && oi !== q.answer_index;

                    return (
                      <button
                        key={oi}
                        onClick={() => !submitted && setSelectedAnswers(prev => ({ ...prev, [i]: oi }))}
                        disabled={submitted}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left text-[14px] transition-all duration-150",
                          submitted
                            ? isCorrectOption
                              ? "border-[#10b981]/40 bg-[#10b981]/8 text-[#065f46]"
                              : isWrongSelected
                                ? "border-[#ef4444]/40 bg-[#ef4444]/8 text-[#991b1b]"
                                : "border-[#1d1d1f]/8 bg-white/50 text-[#86868b]"
                            : isSelected
                              ? "border-[#0066cc]/40 bg-[#0066cc]/6 text-[#1d1d1f]"
                              : "border-[#1d1d1f]/8 bg-white/60 text-[#424245] hover:border-[#1d1d1f]/20 hover:bg-white active:scale-[0.99]"
                        )}
                      >
                        <span className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                          submitted
                            ? isCorrectOption
                              ? "border-[#10b981] bg-[#10b981] text-white"
                              : isWrongSelected
                                ? "border-[#ef4444] bg-[#ef4444] text-white"
                                : "border-[#1d1d1f]/15 text-[#86868b]"
                            : isSelected
                              ? "border-[#0066cc] bg-[#0066cc] text-white"
                              : "border-[#1d1d1f]/20 text-[#6e6e73]"
                        )}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {submitted && (
                  <div className={cn(
                    "mt-4 rounded-[12px] px-4 py-3 text-[13px] leading-5 pl-10",
                    isCorrect ? "bg-[#10b981]/8 text-[#065f46]" : "bg-[#f5f5f7] text-[#424245]"
                  )}>
                    <span className="font-semibold">Explanation: </span>{q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        {!submitted && (
          <div className="sticky bottom-6 mt-8 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={answeredCount < MOCK_QUIZ.length}
              className={cn(
                "flex h-12 items-center gap-2.5 rounded-full px-8 text-[15px] font-medium text-white shadow-[0_8px_24px_rgba(0,102,204,0.25)] transition-all duration-150",
                answeredCount < MOCK_QUIZ.length
                  ? "bg-[#0066cc]/50 cursor-not-allowed"
                  : "bg-[#0066cc] hover:bg-[#0071e3] active:scale-[0.97]"
              )}
            >
              <Trophy className="size-4" strokeWidth={1.8} />
              Submit quiz
              {answeredCount < MOCK_QUIZ.length && (
                <span className="text-white/70 text-[13px]">
                  ({answeredCount}/{MOCK_QUIZ.length})
                </span>
              )}
            </button>
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-20" />
      </main>
    </div>
  );
}
