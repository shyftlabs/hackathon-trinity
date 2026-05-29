/**
 * Synapse AI API client — talks to the Python FastAPI backend on port 8000.
 */

const BASE = process.env.NEXT_PUBLIC_SYNAPSE_API ?? "http://localhost:8000";

export interface TopicStatus {
  topic: string;
  level: "strong" | "moderate" | "needs_improvement";
  evidence: string;
}

export interface KnowledgeMap {
  student_id: string;
  topics: TopicStatus[];
  overall_mastery: number;
}

export interface MCQChoice {
  label: string;
  text: string;
}

export interface DiagnosticQuestion {
  id: string;
  topic: string;
  prompt: string;
  choices: MCQChoice[];
  correct_label: string;
  rationale: string;
}

export interface DiagnosticQuiz {
  student_id: string;
  topics: string[];
  questions: DiagnosticQuestion[];
}

export interface AssessmentQuestion {
  id: string;
  topic: string;
  type: "mcq" | "short_answer";
  prompt: string;
  choices?: MCQChoice[];
  correct_label?: string;
  model_answer?: string;
  rationale: string;
}

export interface Assessment {
  id: string;
  topic: string;
  student_id: string;
  questions: AssessmentQuestion[];
}

export interface GradeReport {
  assessment_id: string;
  topic: string;
  student_id: string;
  score: number;
  per_question: { question_id: string; correct: boolean; student_response: string; correct_answer: string; rationale: string }[];
  updated_status: TopicStatus;
}

export interface NoteSection {
  heading: string;
  content: string;
  subsections: NoteSection[];
}

export interface SmartNotes {
  topic: string;
  student_id: string;
  summary: string;
  sections: NoteSection[];
  key_concepts: string[];
  sources: { title: string; locator: string; text: string }[];
}

export type TutorEvent =
  | { type: "start"; topic: string }
  | { type: "content"; content: string }
  | { type: "check"; data: { question: string; hint?: string; expected_insight: string } }
  | { type: "tool"; tool_name: string; status: "start" | "end" }
  | { type: "done" }
  | { type: "error"; error: string };

// ── Diagnostic ────────────────────────────────────────────────────────────────

export async function startDiagnostic(studentId: string, topics: string[]): Promise<DiagnosticQuiz> {
  const res = await fetch(`${BASE}/diagnose/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId, topics }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function evaluateDiagnostic(
  studentId: string,
  topics: string[],
  answers: { question_id: string; selected_label: string }[]
): Promise<KnowledgeMap> {
  const res = await fetch(`${BASE}/diagnose/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId, topics, answers }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Knowledge Map ─────────────────────────────────────────────────────────────

export async function getKnowledgeMap(studentId: string): Promise<KnowledgeMap | null> {
  const res = await fetch(`${BASE}/knowledge-map/${studentId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Tutor stream ──────────────────────────────────────────────────────────────

export async function* streamTutor(
  studentId: string,
  topic: string,
  message: string,
  profile: { modality: string; pace: string } = { modality: "text", pace: "methodical" }
): AsyncGenerator<TutorEvent> {
  const res = await fetch(`${BASE}/tutor/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId, topic, message, profile }),
  });
  if (!res.ok) throw new Error(await res.text());

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const json = line.slice(6).trim();
        if (json) {
          try {
            yield JSON.parse(json) as TutorEvent;
          } catch {
            // skip malformed
          }
        }
      }
    }
  }
}

// ── Assessment ────────────────────────────────────────────────────────────────

export async function createAssessment(studentId: string, topic: string): Promise<Assessment> {
  const res = await fetch(`${BASE}/assess/${encodeURIComponent(topic)}?student_id=${studentId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function gradeAssessment(
  assessmentId: string,
  studentId: string,
  topic: string,
  answers: { question_id: string; response: string }[]
): Promise<GradeReport> {
  const res = await fetch(`${BASE}/assess/grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assessment_id: assessmentId, student_id: studentId, topic, answers }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Smart Notes ───────────────────────────────────────────────────────────────

export async function generateNotes(
  studentId: string,
  topic: string,
  content = ""
): Promise<SmartNotes> {
  const res = await fetch(`${BASE}/notes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId, topic, content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Memory ────────────────────────────────────────────────────────────────────

export async function getMemories(studentId: string) {
  const res = await fetch(`${BASE}/memory/${studentId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteAllMemories(studentId: string) {
  const res = await fetch(`${BASE}/memory/${studentId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
