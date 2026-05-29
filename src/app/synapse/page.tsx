"use client";

import { useState, useRef, useEffect } from "react";
import { Brain, BookOpen, CheckCircle, ClipboardList, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  startDiagnostic,
  evaluateDiagnostic,
  streamTutor,
  createAssessment,
  gradeAssessment,
  generateNotes,
  type DiagnosticQuiz,
  type KnowledgeMap,
  type TutorEvent,
  type SmartNotes,
  type Assessment,
  type GradeReport,
} from "@/lib/synapseApi";

// ── Types ──────────────────────────────────────────────────────────────────────

type Stage = "onboarding" | "diagnostic" | "knowledge-map" | "tutor" | "assess" | "results" | "notes";

const AVAILABLE_TOPICS = [
  "calculus",
  "linear algebra",
  "data structures",
  "statistics",
  "python programming",
  "physics",
];

const STUDENT_ID = "student-demo-001"; // In production, use auth session

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SynapsePage() {
  const [stage, setStage] = useState<Stage>("onboarding");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Diagnostic state
  const [quiz, setQuiz] = useState<DiagnosticQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [knowledgeMap, setKnowledgeMap] = useState<KnowledgeMap | null>(null);

  // Tutor state
  const [activeTopic, setActiveTopic] = useState("");
  const [tutorMessages, setTutorMessages] = useState<{ role: "user" | "assistant" | "check"; content: string; checkData?: object }[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorStreaming, setTutorStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Assessment state
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessAnswers, setAssessAnswers] = useState<Record<string, string>>({});
  const [gradeReport, setGradeReport] = useState<GradeReport | null>(null);

  // Notes state
  const [notes, setNotes] = useState<SmartNotes | null>(null);
  const [notesProfile, setNotesProfile] = useState<{ modality: string; pace: string }>({
    modality: "text", pace: "methodical",
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tutorMessages]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleStartDiagnostic = async () => {
    if (!selectedTopics.length) return setError("Select at least one topic");
    setLoading(true);
    setError("");
    try {
      const q = await startDiagnostic(STUDENT_ID, selectedTopics);
      setQuiz(q);
      setStage("diagnostic");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleSubmitDiagnostic = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter(q => !answers[q.id]);
    if (unanswered.length) return setError(`Answer all ${unanswered.length} remaining questions`);
    setLoading(true);
    setError("");
    try {
      const answerList = quiz.questions.map(q => ({
        question_id: q.id,
        selected_label: answers[q.id],
      }));
      const km = await evaluateDiagnostic(STUDENT_ID, selectedTopics, answerList);
      setKnowledgeMap(km);
      setStage("knowledge-map");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleStartTutor = async (topic: string) => {
    setActiveTopic(topic);
    setTutorMessages([]);
    setTutorInput("");
    setStage("tutor");
  };

  const handleTutorSend = async () => {
    if (!tutorInput.trim() || tutorStreaming) return;
    const userMsg = tutorInput.trim();
    setTutorInput("");
    setTutorMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setTutorStreaming(true);

    let assistantContent = "";
    setTutorMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      for await (const event of streamTutor(STUDENT_ID, activeTopic, userMsg, notesProfile)) {
        if (event.type === "content") {
          assistantContent += event.content;
          setTutorMessages(prev => {
            const msgs = [...prev];
            msgs[msgs.length - 1] = { role: "assistant", content: assistantContent };
            return msgs;
          });
        } else if (event.type === "check") {
          setTutorMessages(prev => [
            ...prev,
            { role: "check", content: (event as any).data.question, checkData: (event as any).data },
          ]);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTutorStreaming(false);
    }
  };

  const handleStartAssessment = async (topic: string) => {
    setActiveTopic(topic);
    setLoading(true);
    setError("");
    try {
      const a = await createAssessment(STUDENT_ID, topic);
      setAssessment(a);
      setAssessAnswers({});
      setStage("assess");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleSubmitAssessment = async () => {
    if (!assessment) return;
    setLoading(true);
    setError("");
    try {
      const answerList = assessment.questions.map(q => ({
        question_id: q.id,
        response: assessAnswers[q.id] ?? "",
      }));
      const report = await gradeAssessment(assessment.id, STUDENT_ID, activeTopic, answerList);
      setGradeReport(report);
      // Update local knowledge map
      if (knowledgeMap) {
        const updated = { ...knowledgeMap };
        const idx = updated.topics.findIndex(t => t.topic.toLowerCase() === activeTopic.toLowerCase());
        if (idx >= 0) updated.topics[idx] = report.updated_status;
        else updated.topics.push(report.updated_status);
        setKnowledgeMap(updated);
      }
      setStage("results");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleGenerateNotes = async (topic: string) => {
    setActiveTopic(topic);
    setLoading(true);
    setError("");
    setNotes(null);
    setStage("notes");
    try {
      const n = await generateNotes(STUDENT_ID, topic);
      setNotes(n);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      {/* Header */}
      <div className="border-b border-blue-900/40 bg-slate-950/60 backdrop-blur-xl px-6 py-4 flex items-center gap-3">
        <Brain className="text-blue-400 w-6 h-6" />
        <span className="font-bold text-lg">Synapse AI</span>
        <div className="flex gap-2 ml-6">
          {(["knowledge-map", "tutor", "assess", "notes"] as Stage[]).includes(stage) && (
            <button
              onClick={() => setStage("knowledge-map")}
              className="text-sm text-blue-300 hover:text-blue-100 transition-colors"
            >
              ← Knowledge Map
            </button>
          )}
        </div>
        {error && (
          <div className="ml-auto text-sm text-red-400 bg-red-900/20 rounded px-3 py-1">
            {error}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Onboarding ── */}
        {stage === "onboarding" && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-bold gradient-text">What are you studying?</h1>
              <p className="text-slate-400 text-lg">
                Select your topics and Synapse AI will diagnose your knowledge, teach you, and verify mastery.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_TOPICS.map(topic => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopics(prev =>
                    prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
                  )}
                  className={`px-4 py-3 rounded-xl border text-left capitalize font-medium transition-all ${
                    selectedTopics.includes(topic)
                      ? "border-blue-500 bg-blue-900/40 text-blue-100"
                      : "border-slate-700 bg-slate-800/40 text-slate-300 hover:border-blue-700 hover:bg-slate-700/40"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleStartDiagnostic}
                disabled={loading || !selectedTopics.length}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 py-3 font-semibold"
              >
                {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2 inline" /> : null}
                Start Diagnostic
              </Button>
              {selectedTopics.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => handleGenerateNotes(selectedTopics[0])}
                  className="border-slate-600 text-slate-300 hover:text-white rounded-full px-8 py-3"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Smart Notes
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── Diagnostic Quiz ── */}
        {stage === "diagnostic" && quiz && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Diagnostic Quiz</h2>
              <p className="text-slate-400 mt-1">
                {quiz.questions.length} questions across {selectedTopics.length} topics
              </p>
            </div>

            {quiz.questions.map((q, i) => (
              <Card key={q.id} className="bg-slate-800/60 border-slate-700 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-900 text-blue-200 text-xs mt-0.5">{q.topic}</Badge>
                  <p className="text-white font-medium leading-relaxed">{q.prompt}</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {q.choices.map(c => (
                    <button
                      key={c.label}
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: c.label }))}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                        answers[q.id] === c.label
                          ? "border-blue-500 bg-blue-900/40 text-blue-100"
                          : "border-slate-600 bg-slate-700/30 text-slate-300 hover:border-blue-700"
                      }`}
                    >
                      <span className="font-mono font-bold text-blue-400 w-5">{c.label}</span>
                      <span>{c.text}</span>
                    </button>
                  ))}
                </div>
              </Card>
            ))}

            <Button
              onClick={handleSubmitDiagnostic}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2 inline" /> : null}
              Submit & See Results
            </Button>
          </div>
        )}

        {/* ── Knowledge Map ── */}
        {stage === "knowledge-map" && knowledgeMap && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Your Knowledge Map</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="text-slate-400">Overall mastery:</span>
                <span className="text-2xl font-bold text-blue-400">
                  {Math.round(knowledgeMap.overall_mastery * 100)}%
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              {knowledgeMap.topics.map(t => (
                <Card key={t.topic} className="bg-slate-800/60 border-slate-700 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold capitalize text-white">{t.topic}</span>
                        <Badge
                          className={
                            t.level === "strong"
                              ? "bg-green-900/60 text-green-300 border-green-700"
                              : t.level === "moderate"
                              ? "bg-amber-900/60 text-amber-300 border-amber-700"
                              : "bg-red-900/60 text-red-300 border-red-700"
                          }
                        >
                          {t.level.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">{t.evidence}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartTutor(t.topic)}
                        className="border-blue-700 text-blue-300 hover:bg-blue-900/40 text-xs"
                      >
                        <BookOpen className="w-3 h-3 mr-1" /> Tutor
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartAssessment(t.topic)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700/40 text-xs"
                      >
                        <ClipboardList className="w-3 h-3 mr-1" /> Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateNotes(t.topic)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700/40 text-xs"
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> Notes
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Suggest weakest topic */}
            {(() => {
              const weak = knowledgeMap.topics.find(t => t.level === "needs_improvement")
                ?? knowledgeMap.topics.find(t => t.level === "moderate");
              return weak ? (
                <Card className="border-blue-700/40 bg-blue-950/40 p-4">
                  <p className="text-sm text-blue-200">
                    <span className="font-semibold">Suggested:</span> Start with{" "}
                    <span className="font-bold capitalize">{weak.topic}</span> — it needs the most work.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleStartTutor(weak.topic)}
                    className="mt-3 bg-blue-600 hover:bg-blue-500 text-white text-xs"
                  >
                    Study {weak.topic} now <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Card>
              ) : null;
            })()}
          </div>
        )}

        {/* ── Tutor Chat ── */}
        {stage === "tutor" && (
          <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="text-blue-400 w-5 h-5" />
              <h2 className="text-xl font-bold capitalize">{activeTopic}</h2>
              <div className="ml-auto flex gap-2">
                <select
                  value={notesProfile.modality}
                  onChange={e => setNotesProfile(p => ({ ...p, modality: e.target.value }))}
                  className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-300"
                >
                  <option value="text">Text</option>
                  <option value="visual">Visual</option>
                  <option value="audio">Conversational</option>
                </select>
                <select
                  value={notesProfile.pace}
                  onChange={e => setNotesProfile(p => ({ ...p, pace: e.target.value }))}
                  className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-300"
                >
                  <option value="methodical">Methodical</option>
                  <option value="deep">Deep dive</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {tutorMessages.length === 0 && (
                <div className="text-center text-slate-500 py-12">
                  <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Ask anything about <span className="capitalize">{activeTopic}</span></p>
                  <p className="text-sm mt-1">
                    Try: <em>"Explain the fundamentals"</em> or <em>"Give me an example"</em>
                  </p>
                </div>
              )}

              {tutorMessages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "user" && (
                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[75%] text-sm">
                        {msg.content}
                      </div>
                    </div>
                  )}
                  {msg.role === "assistant" && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-900 flex items-center justify-center shrink-0 mt-1">
                        <Brain className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                        {tutorStreaming && i === tutorMessages.length - 1 && (
                          <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-1 align-middle" />
                        )}
                      </div>
                    </div>
                  )}
                  {msg.role === "check" && (
                    <Card className="border-amber-700/50 bg-amber-950/30 p-4 mx-8">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-amber-400 mb-1">Comprehension Check</p>
                          <p className="text-sm text-amber-100">{msg.content}</p>
                          {(msg.checkData as any)?.hint && (
                            <p className="text-xs text-amber-300/70 mt-1">
                              Hint: {(msg.checkData as any).hint}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
              <input
                value={tutorInput}
                onChange={e => setTutorInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleTutorSend()}
                placeholder={`Ask about ${activeTopic}...`}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                disabled={tutorStreaming}
              />
              <Button
                onClick={handleTutorSend}
                disabled={tutorStreaming || !tutorInput.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl"
              >
                {tutorStreaming ? <Loader2 className="animate-spin w-4 h-4" /> : "Send"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Assessment ── */}
        {stage === "assess" && assessment && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white capitalize">
                Assessment: {activeTopic}
              </h2>
              <p className="text-slate-400 mt-1">{assessment.questions.length} questions</p>
            </div>

            {assessment.questions.map((q, i) => (
              <Card key={q.id} className="bg-slate-800/60 border-slate-700 p-5 space-y-4">
                <p className="text-white font-medium">
                  <span className="text-blue-400 mr-2">Q{i + 1}.</span>
                  {q.prompt}
                </p>

                {q.type === "mcq" && q.choices ? (
                  <div className="grid gap-2">
                    {q.choices.map(c => (
                      <button
                        key={c.label}
                        onClick={() => setAssessAnswers(prev => ({ ...prev, [q.id]: c.label }))}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-left transition-all ${
                          assessAnswers[q.id] === c.label
                            ? "border-blue-500 bg-blue-900/40 text-blue-100"
                            : "border-slate-600 bg-slate-700/30 text-slate-300 hover:border-blue-700"
                        }`}
                      >
                        <span className="font-mono font-bold text-blue-400 w-5">{c.label}</span>
                        <span>{c.text}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={assessAnswers[q.id] ?? ""}
                    onChange={e => setAssessAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Your answer..."
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                )}
              </Card>
            ))}

            <Button
              onClick={handleSubmitAssessment}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2 inline" /> : null}
              Submit Assessment
            </Button>
          </div>
        )}

        {/* ── Results ── */}
        {stage === "results" && gradeReport && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-white capitalize">
                Results: {gradeReport.topic}
              </h2>
              <div
                className={`text-5xl font-bold ${
                  gradeReport.score >= 0.85
                    ? "text-green-400"
                    : gradeReport.score >= 0.6
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {Math.round(gradeReport.score * 100)}%
              </div>
              <Badge
                className={
                  gradeReport.updated_status.level === "strong"
                    ? "bg-green-900/60 text-green-300 border-green-700 text-sm px-4 py-1"
                    : gradeReport.updated_status.level === "moderate"
                    ? "bg-amber-900/60 text-amber-300 border-amber-700 text-sm px-4 py-1"
                    : "bg-red-900/60 text-red-300 border-red-700 text-sm px-4 py-1"
                }
              >
                {gradeReport.updated_status.level.replace("_", " ")} — {gradeReport.updated_status.evidence}
              </Badge>
            </div>

            <div className="space-y-3">
              {gradeReport.per_question.map((r, i) => (
                <Card
                  key={r.question_id}
                  className={`p-4 border ${
                    r.correct
                      ? "border-green-800/40 bg-green-950/20"
                      : "border-red-800/40 bg-red-950/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-lg ${r.correct ? "text-green-400" : "text-red-400"}`}>
                      {r.correct ? "✓" : "✗"}
                    </span>
                    <div>
                      <p className="text-sm text-white">Your answer: <span className="font-semibold">{r.student_response}</span></p>
                      {!r.correct && (
                        <p className="text-sm text-slate-400">Correct: <span className="font-semibold">{r.correct_answer}</span></p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">{r.rationale}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setStage("knowledge-map")}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6"
              >
                Back to Knowledge Map
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStartTutor(gradeReport.topic)}
                className="border-slate-600 text-slate-300 hover:text-white rounded-full px-6"
              >
                Review with Tutor
              </Button>
            </div>
          </div>
        )}

        {/* ── Smart Notes ── */}
        {stage === "notes" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Sparkles className="text-blue-400 w-5 h-5" />
              <h2 className="text-2xl font-bold capitalize">{activeTopic}</h2>
              <Badge className="bg-blue-900/60 text-blue-300 border-blue-700">Smart Notes</Badge>
            </div>

            {loading && (
              <div className="text-center py-16 text-slate-400">
                <Loader2 className="animate-spin w-8 h-8 mx-auto mb-3 text-blue-400" />
                <p>Generating notes from source material…</p>
              </div>
            )}

            {notes && !loading && (
              <div className="space-y-6">
                {/* Summary */}
                <Card className="bg-blue-950/40 border-blue-700/40 p-5">
                  <h3 className="font-semibold text-blue-300 mb-2">Overview</h3>
                  <p className="text-slate-200 leading-relaxed">{notes.summary}</p>
                </Card>

                {/* Key Concepts */}
                <div className="flex flex-wrap gap-2">
                  {notes.key_concepts.map(c => (
                    <Badge key={c} className="bg-slate-800 text-slate-300 border-slate-600">{c}</Badge>
                  ))}
                </div>

                {/* Sections */}
                {notes.sections.map((sec, i) => (
                  <Card key={i} className="bg-slate-800/60 border-slate-700 p-5 space-y-3">
                    <h3 className="font-bold text-white text-lg">{sec.heading}</h3>
                    <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-sm">
                      {sec.content}
                    </div>
                    {sec.subsections?.map((sub, j) => (
                      <div key={j} className="ml-4 pl-4 border-l border-slate-600 space-y-2">
                        <h4 className="font-semibold text-blue-300">{sub.heading}</h4>
                        <p className="text-slate-300 text-sm leading-relaxed">{sub.content}</p>
                      </div>
                    ))}
                  </Card>
                ))}

                {/* Sources */}
                {notes.sources.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-400 mb-2 text-sm uppercase tracking-wide">Sources</h3>
                    <div className="space-y-2">
                      {notes.sources.map((s, i) => (
                        <div key={i} className="text-xs text-slate-500 flex gap-2">
                          <span className="text-blue-500">■</span>
                          <span>{s.title} — <em>{s.locator}</em></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStage("knowledge-map")}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:text-white rounded-full px-6"
                  >
                    Back to Knowledge Map
                  </Button>
                  <Button
                    onClick={() => handleStartTutor(activeTopic)}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Continue with Tutor
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
