"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { studentApi, type Assessment, type GradeReport } from "@/lib/synapseApi";

const DEMO_STUDENT_ID = "demo-student-001";
const getStudentId = () =>
  (typeof window !== "undefined" && localStorage.getItem("synapse_student_id")) || DEMO_STUDENT_ID;

export default function QuizPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const search = useSearchParams();
  const topic = search.get("topic") ?? "";
  const studentId = getStudentId();

  const [phase, setPhase] = useState<"loading" | "quiz" | "result" | "error">("loading");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [report, setReport] = useState<GradeReport | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!topic) { setError("No topic selected — go back and start studying first."); setPhase("error"); return; }
    studentApi.memoryQuiz(studentId, topic, "")
      .then(a => { setAssessment(a); setPhase("quiz"); })
      .catch(() => {
        studentApi.createAssessment(studentId, topic)
          .then(a => { setAssessment(a); setPhase("quiz"); })
          .catch(e => { setError(String(e)); setPhase("error"); });
      });
  }, [topic, studentId]);

  const handleSelect = (questionId: string, label: string) =>
    setAnswers(prev => ({ ...prev, [questionId]: label }));

  const handleSubmit = async () => {
    if (!assessment) return;
    setSubmitting(true);
    try {
      const r = await studentApi.gradeAssessment(
        assessment.id, studentId, topic,
        assessment.questions.map(q => ({ question_id: q.id, response: answers[q.id] ?? "" }))
      );
      setReport(r);
      setPhase("result");
    } catch (e) { setError(String(e)); setPhase("error"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href={`/student/class/${code}`} className="mb-6 inline-flex items-center gap-2 text-[14px] text-[#6e6e73] transition hover:text-[#1d1d1f]">
          <ArrowLeft className="size-4" strokeWidth={1.8} />Back to study
        </Link>

        {phase === "loading" && (
          <div className="flex flex-col items-center py-24">
            <div className="mb-4 size-10 animate-spin rounded-full border-2 border-[#0066cc]/20 border-t-[#0066cc]" />
            <p className="text-[15px] text-[#6e6e73]">Generating personalized quiz using your memory…</p>
            <p className="mt-2 text-[13px] text-[#86868b]">Targeting gaps from your tutor session</p>
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-[15px] text-red-600">{error}</p>
            <Link href={`/student/class/${code}`} className="mt-4 inline-block text-[14px] text-[#0066cc] hover:underline">← Back</Link>
          </div>
        )}

        {phase === "quiz" && assessment && (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex size-8 items-center justify-center rounded-full bg-[#0066cc]/10">
                  <Zap className="size-4 text-[#0066cc]" strokeWidth={2} />
                </div>
                <h1 className="text-[26px] font-semibold tracking-[-0.025em]">{topic}</h1>
              </div>
              <p className="text-[14px] text-[#6e6e73]">{assessment.questions.length} questions · Personalized to your learning</p>
            </div>

            <div className="space-y-5">
              {assessment.questions.map((q, qi) => (
                <div key={q.id} className="rounded-[24px] border border-[#1d1d1f]/8 bg-white p-5">
                  <p className="mb-4 text-[15px] font-medium leading-6">
                    <span className="mr-2 text-[#86868b]">{qi + 1}.</span>{q.prompt}
                  </p>
                  {q.type === "mcq" && q.choices ? (
                    <div className="space-y-2">
                      {q.choices.map(c => (
                        <button key={c.label} onClick={() => handleSelect(q.id, c.label)}
                          className={cn("flex w-full items-center gap-3 rounded-[16px] border px-4 py-3 text-left text-[14px] transition-all",
                            answers[q.id] === c.label ? "border-[#0066cc]/40 bg-[#0066cc]/8 text-[#0066cc]" : "border-[#1d1d1f]/10 hover:border-[#0066cc]/20 hover:bg-[#0066cc]/4")}>
                          <span className="size-6 shrink-0 rounded-full border border-current flex items-center justify-center text-[12px] font-semibold">{c.label}</span>
                          {c.text}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea value={answers[q.id] ?? ""} onChange={e => handleSelect(q.id, e.target.value)}
                      placeholder="Type your answer…"
                      className="w-full rounded-[16px] border border-[#1d1d1f]/10 bg-[#f5f5f7] p-3 text-[14px] outline-none focus:border-[#0066cc]/40 min-h-[80px] resize-none" />
                  )}
                </div>
              ))}
            </div>

            <button onClick={handleSubmit} disabled={!assessment.questions.every(q => answers[q.id]) || submitting}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0066cc] text-[15px] font-medium text-white transition-all hover:bg-[#0071e3] disabled:opacity-50">
              {submitting ? <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <><Trophy className="size-4" strokeWidth={1.8} />Submit quiz</>}
            </button>
          </>
        )}

        {phase === "result" && report && (
          <div>
            <div className={cn("mb-6 rounded-[28px] p-6 text-center",
              report.score >= 0.85 ? "bg-[#10b981]/10 border border-[#10b981]/20" :
              report.score >= 0.60 ? "bg-[#f59e0b]/10 border border-[#f59e0b]/20" :
              "bg-red-50 border border-red-200")}>
              <p className="text-[48px] font-bold leading-none">{Math.round(report.score * 100)}%</p>
              <p className="mt-2 text-[17px] font-semibold capitalize">{report.updated_status.level.replace(/_/g, " ")}</p>
              <p className="mt-2 text-[14px] text-[#6e6e73]">{report.updated_status.evidence}</p>
            </div>

            <div className="space-y-3 mb-6">
              {report.per_question.map((r, i) => {
                const q = assessment?.questions.find(q => q.id === r.question_id);
                return (
                  <div key={r.question_id} className={cn("rounded-[20px] border p-4",
                    r.correct ? "border-[#10b981]/20 bg-[#10b981]/5" : "border-red-200 bg-red-50")}>
                    <div className="flex items-start gap-3">
                      {r.correct ? <CheckCircle className="size-5 shrink-0 text-[#10b981] mt-0.5" strokeWidth={1.8} />
                        : <XCircle className="size-5 shrink-0 text-red-400 mt-0.5" strokeWidth={1.8} />}
                      <div>
                        <p className="text-[14px] font-medium">{q?.prompt ?? `Q${i + 1}`}</p>
                        <p className="mt-1 text-[12px] text-[#6e6e73]">
                          Your: <strong>{r.student_response || "—"}</strong> · Correct: <strong>{r.correct_answer}</strong>
                        </p>
                        <p className="mt-1 text-[12px] text-[#424245]">{r.rationale}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link href={`/student/class/${code}`}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0066cc] text-[15px] font-medium text-white transition-all hover:bg-[#0071e3]">
              <ArrowLeft className="size-4" strokeWidth={1.8} />Back to study
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
