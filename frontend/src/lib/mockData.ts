// ─── Synapse Mock Data ────────────────────────────────────────────────────────

// Legacy export for existing ModeSelector component (dashboard/session/[id])
export const fluxModes = [
  {
    id: "notes",
    name: "Smart Notes",
    description: "AI-written notes",
    icon: "FileText",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    id: "flashcards",
    name: "Flashcards",
    description: "Spaced repetition",
    icon: "Layers",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    id: "quiz",
    name: "Quiz",
    description: "Test your knowledge",
    icon: "CheckSquare",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    id: "podcast",
    name: "Audio",
    description: "Listen & learn",
    icon: "Volume2",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    id: "quest",
    name: "Quest",
    description: "Gamified learning",
    icon: "Zap",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    id: "visual",
    name: "Mind Map",
    description: "Visual learning",
    icon: "Network",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
  },
];

export const MOCK_CLASS = {
  code: "SYN-4829",
  name: "AP Biology",
  subject: "Biology",
  teacher: "Dr. Sarah Chen",
  teacherInitials: "SC",
  studentCount: 8,
  enabledModes: ["notes", "flashcards", "podcast", "visual"] as const,
  topic: "Photosynthesis & the Light-Dependent Reactions",
};

export const MOCK_STUDENTS = [
  {
    id: "s1",
    name: "Amir Hassan",
    initials: "AH",
    color: "#0066cc",
    lastActive: "2 min ago",
    progress: 82,
    timeSpent: "3h 14m",
    strongTopics: ["Light reactions", "Chlorophyll absorption"],
    weakTopics: ["ATP synthesis", "Photosystem II"],
    mostUsedMode: "Flashcards",
    aiSummary:
      "Amir has a strong conceptual grasp of the light-dependent reactions and can identify the role of photosystems I and II. He struggles with the mechanistic detail of ATP synthase and proton gradients — recommend revisiting the chemiosmosis section.",
    quizAttempts: 3,
    bestScore: 8,
    totalQuestions: 10,
  },
  {
    id: "s2",
    name: "Priya Nair",
    initials: "PN",
    color: "#8b5cf6",
    lastActive: "15 min ago",
    progress: 95,
    timeSpent: "4h 42m",
    strongTopics: ["Calvin cycle", "ATP synthesis", "NADPH"],
    weakTopics: ["Photorespiration"],
    mostUsedMode: "Notes",
    aiSummary:
      "Priya is the top performer in the class on this topic. She has mastered both phases of photosynthesis and demonstrates nuanced understanding of the electron transport chain. Her one gap is photorespiration under C3 vs C4 conditions.",
    quizAttempts: 5,
    bestScore: 10,
    totalQuestions: 10,
  },
  {
    id: "s3",
    name: "Jordan Lee",
    initials: "JL",
    color: "#10b981",
    lastActive: "1 hr ago",
    progress: 61,
    timeSpent: "1h 58m",
    strongTopics: ["Basic definition of photosynthesis"],
    weakTopics: ["Light reactions", "Electron transport", "Calvin cycle"],
    mostUsedMode: "Audio",
    aiSummary:
      "Jordan is engaging primarily with the audio summaries and has a surface-level understanding of photosynthesis. They have not yet attempted the flashcard deck or quiz. Recommend prompting them to interact with the mind map to build structural understanding.",
    quizAttempts: 1,
    bestScore: 4,
    totalQuestions: 10,
  },
  {
    id: "s4",
    name: "Sofia Reyes",
    initials: "SR",
    color: "#f59e0b",
    lastActive: "3 hr ago",
    progress: 74,
    timeSpent: "2h 30m",
    strongTopics: ["Chloroplast structure", "Thylakoid membrane"],
    weakTopics: ["G3P", "RuBisCO"],
    mostUsedMode: "Mind Map",
    aiSummary:
      "Sofia demonstrates strong spatial understanding from her mind map usage — she can correctly place organelles and membranes. Her weakness is in the biochemical detail of the Calvin cycle, specifically the role of RuBisCO and the G3P pathway.",
    quizAttempts: 2,
    bestScore: 7,
    totalQuestions: 10,
  },
  {
    id: "s5",
    name: "Marcus Webb",
    initials: "MW",
    color: "#ef4444",
    lastActive: "Yesterday",
    progress: 45,
    timeSpent: "1h 12m",
    strongTopics: ["Photosynthesis equation"],
    weakTopics: ["Light reactions", "Dark reactions", "Electron carriers"],
    mostUsedMode: "Notes",
    aiSummary:
      "Marcus has only skimmed the notes and has not revisited the material since yesterday. His quiz score suggests he can recall the overall equation but cannot explain the mechanism. Immediate follow-up recommended.",
    quizAttempts: 1,
    bestScore: 3,
    totalQuestions: 10,
  },
  {
    id: "s6",
    name: "Lena Kovacs",
    initials: "LK",
    color: "#ec4899",
    lastActive: "5 min ago",
    progress: 88,
    timeSpent: "3h 55m",
    strongTopics: ["Electron transport chain", "NADPH", "Water splitting"],
    weakTopics: ["Cyclic vs non-cyclic photophosphorylation"],
    mostUsedMode: "Flashcards",
    aiSummary:
      "Lena is a consistent, high-effort student who has completed the flashcard deck three times. Her weak area is distinguishing cyclic from non-cyclic photophosphorylation — she conflates the two pathways on quiz questions.",
    quizAttempts: 4,
    bestScore: 9,
    totalQuestions: 10,
  },
  {
    id: "s7",
    name: "Kwame Asante",
    initials: "KA",
    color: "#14b8a6",
    lastActive: "30 min ago",
    progress: 70,
    timeSpent: "2h 18m",
    strongTopics: ["Photosystem I", "NADP+ reduction"],
    weakTopics: ["Photosystem II", "Oxygen evolution"],
    mostUsedMode: "Notes",
    aiSummary:
      "Kwame has a good understanding of the downstream steps of the light reactions but consistently misses questions about Photosystem II and oxygen evolution. He may benefit from the audio summary which covers the splitting of water in depth.",
    quizAttempts: 2,
    bestScore: 7,
    totalQuestions: 10,
  },
  {
    id: "s8",
    name: "Isla Morrison",
    initials: "IM",
    color: "#6366f1",
    lastActive: "2 days ago",
    progress: 22,
    timeSpent: "28m",
    strongTopics: [],
    weakTopics: ["All topics — insufficient engagement"],
    mostUsedMode: "—",
    aiSummary:
      "Isla has minimal engagement with the material. She has only opened the notes once and has not attempted the quiz. This student may need direct outreach.",
    quizAttempts: 0,
    bestScore: 0,
    totalQuestions: 10,
  },
];

export const MOCK_CLASS_STATS = {
  avgProgress: 67,
  mostUsedMode: "Flashcards",
  activeToday: 5,
  avgQuizScore: 6.6,
};

export const MOCK_NOTES = `## Photosynthesis & the Light-Dependent Reactions

Photosynthesis is the process by which plants, algae, and certain bacteria convert light energy into chemical energy stored as glucose. The overall equation is:

**6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂**

### Chloroplast Structure

The chloroplast is the site of photosynthesis in plant cells. Key regions:

- **Outer & inner membrane** — encloses the organelle
- **Stroma** — fluid-filled space where the Calvin cycle occurs
- **Thylakoids** — flattened membrane sacs stacked into grana
- **Lumen** — interior space of the thylakoid, critical for proton gradients

### The Light-Dependent Reactions

These occur in the **thylakoid membranes** and require direct light input.

#### Photosystem II (PSII)
1. Light strikes the P680 reaction centre, exciting electrons to a higher energy state
2. Excited electrons are passed to the electron transport chain (ETC)
3. To replace lost electrons, water molecules are **split (photolysis)**: 2H₂O → 4H⁺ + 4e⁻ + O₂
4. The oxygen released is a byproduct — the O₂ we breathe

#### Electron Transport Chain
- Electrons move through plastoquinone (PQ) → cytochrome b6f complex → plastocyanin (PC)
- At each step, protons (H⁺) are pumped from the stroma into the thylakoid lumen
- This builds a **proton gradient** (high [H⁺] in lumen vs stroma)

#### ATP Synthesis (Chemiosmosis)
- Protons flow back through **ATP synthase** (an enzyme embedded in the thylakoid membrane)
- This flow drives the phosphorylation of ADP + Pi → **ATP**
- This process is called **photophosphorylation**

#### Photosystem I (PSI)
1. Receives electrons from the ETC via plastocyanin
2. Light re-energises electrons at the P700 reaction centre
3. Electrons are passed to ferredoxin, then to **NADP⁺ reductase**
4. NADP⁺ + 2e⁻ + H⁺ → **NADPH**

### Products of the Light Reactions
| Product | Used for |
|---------|----------|
| ATP | Powers the Calvin cycle |
| NADPH | Reduces CO₂ in the Calvin cycle |
| O₂ | Released as a byproduct |

### Key Vocabulary
- **Photophosphorylation** — ATP synthesis driven by light-excited electron flow
- **Chemiosmosis** — ATP generation via proton gradient across a membrane
- **Photolysis** — splitting of water using light energy
- **Reaction centre** — chlorophyll molecule that directly absorbs light in a photosystem
`;

export const MOCK_FLASHCARDS = [
  { front: "What is the overall equation for photosynthesis?", back: "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂" },
  { front: "Where do the light-dependent reactions take place?", back: "In the thylakoid membranes of the chloroplast" },
  { front: "What is the role of Photosystem II?", back: "Absorbs light at P680, excites electrons, and splits water to replenish them — releasing O₂ as a byproduct" },
  { front: "What is photolysis?", back: "The splitting of water molecules using light energy: 2H₂O → 4H⁺ + 4e⁻ + O₂" },
  { front: "What drives ATP synthesis in the thylakoid?", back: "Chemiosmosis — protons flow down their gradient through ATP synthase from the lumen to the stroma" },
  { front: "What does Photosystem I produce?", back: "NADPH — by reducing NADP⁺ using re-energised electrons" },
  { front: "What is chemiosmosis?", back: "The generation of ATP using the potential energy of a proton gradient across a membrane" },
  { front: "What are the two products of the light reactions used in the Calvin cycle?", back: "ATP and NADPH" },
  { front: "What is the reaction centre of PSII?", back: "P680 — a chlorophyll molecule that absorbs light at 680nm" },
  { front: "What is the reaction centre of PSI?", back: "P700 — a chlorophyll molecule that absorbs light at 700nm" },
];

export const MOCK_QUIZ = [
  {
    question: "Where do the light-dependent reactions of photosynthesis occur?",
    options: ["Stroma", "Thylakoid membrane", "Outer membrane", "Cytoplasm"],
    answer_index: 1,
    explanation: "The light-dependent reactions occur in the thylakoid membranes, where the photosystems and ATP synthase are embedded.",
  },
  {
    question: "Which molecule is split during the light-dependent reactions to release oxygen?",
    options: ["CO₂", "NADPH", "H₂O", "Glucose"],
    answer_index: 2,
    explanation: "Water (H₂O) is split by photolysis in Photosystem II: 2H₂O → 4H⁺ + 4e⁻ + O₂.",
  },
  {
    question: "What is the primary function of ATP synthase in the thylakoid?",
    options: [
      "Absorb light energy",
      "Split water molecules",
      "Synthesise ATP from a proton gradient",
      "Reduce NADP⁺ to NADPH",
    ],
    answer_index: 2,
    explanation: "ATP synthase uses the flow of protons (H⁺) from the lumen back to the stroma to phosphorylate ADP, producing ATP via chemiosmosis.",
  },
  {
    question: "What does Photosystem I produce?",
    options: ["ATP", "O₂", "Glucose", "NADPH"],
    answer_index: 3,
    explanation: "PSI re-energises electrons and uses them to reduce NADP⁺ to NADPH via NADP⁺ reductase.",
  },
  {
    question: "The wavelength of light absorbed by the P680 reaction centre is approximately:",
    options: ["580 nm", "650 nm", "680 nm", "700 nm"],
    answer_index: 2,
    explanation: "P680 absorbs red light at ~680 nm. It is the reaction centre of Photosystem II.",
  },
  {
    question: "Which of the following correctly describes chemiosmosis?",
    options: [
      "The splitting of water using light",
      "The direct phosphorylation of ADP by NADPH",
      "ATP generation using the potential energy of a proton gradient",
      "Electron transfer from PSII to PSI",
    ],
    answer_index: 2,
    explanation: "Chemiosmosis refers specifically to ATP synthesis driven by the movement of protons down their electrochemical gradient through ATP synthase.",
  },
  {
    question: "In which order do electrons travel through the light-dependent reactions?",
    options: [
      "PSI → ETC → PSII",
      "PSII → ETC → PSI → NADPH",
      "Water → PSI → PSII → NADPH",
      "NADPH → PSI → ETC → PSII",
    ],
    answer_index: 1,
    explanation: "Electrons flow from water splitting (PSII) → electron transport chain → PSI → ultimately reducing NADP⁺ to NADPH.",
  },
  {
    question: "What is photophosphorylation?",
    options: [
      "The reduction of CO₂ using light",
      "ATP synthesis driven by light-excited electron flow",
      "The splitting of water by light",
      "The absorption of photons by chlorophyll",
    ],
    answer_index: 1,
    explanation: "Photophosphorylation is the synthesis of ATP from ADP + Pi driven by the proton gradient established during the light reactions.",
  },
  {
    question: "Where does the Calvin cycle take place?",
    options: ["Thylakoid lumen", "Outer membrane", "Stroma", "Grana"],
    answer_index: 2,
    explanation: "The Calvin cycle (light-independent reactions) occurs in the stroma of the chloroplast, using the ATP and NADPH produced by the light reactions.",
  },
  {
    question: "Which component of the electron transport chain directly pumps protons into the lumen?",
    options: ["Plastocyanin", "Ferredoxin", "NADP⁺ reductase", "Cytochrome b6f complex"],
    answer_index: 3,
    explanation: "The cytochrome b6f complex pumps H⁺ from the stroma into the thylakoid lumen, contributing to the proton gradient used by ATP synthase.",
  },
];

export const MOCK_VISUAL = {
  nodes: [
    { id: "photosynthesis", label: "Photosynthesis", size: 24 },
    { id: "light-reactions", label: "Light Reactions", size: 18 },
    { id: "calvin-cycle", label: "Calvin Cycle", size: 18 },
    { id: "psii", label: "Photosystem II", size: 14 },
    { id: "psi", label: "Photosystem I", size: 14 },
    { id: "etc", label: "Electron Transport Chain", size: 14 },
    { id: "atp-synthase", label: "ATP Synthase", size: 12 },
    { id: "nadph", label: "NADPH", size: 12 },
    { id: "atp", label: "ATP", size: 12 },
    { id: "water", label: "Water (H₂O)", size: 10 },
    { id: "oxygen", label: "Oxygen (O₂)", size: 10 },
  ],
  edges: [
    { from: "photosynthesis", to: "light-reactions" },
    { from: "photosynthesis", to: "calvin-cycle" },
    { from: "light-reactions", to: "psii" },
    { from: "light-reactions", to: "psi" },
    { from: "light-reactions", to: "etc" },
    { from: "psii", to: "water" },
    { from: "psii", to: "oxygen" },
    { from: "psii", to: "etc" },
    { from: "etc", to: "atp-synthase" },
    { from: "atp-synthase", to: "atp" },
    { from: "psi", to: "nadph" },
    { from: "atp", to: "calvin-cycle" },
    { from: "nadph", to: "calvin-cycle" },
  ],
};

export type MockStudent = typeof MOCK_STUDENTS[number];
