import "dotenv/config";
import { createClient, type InValue } from "@libsql/client";

type SessionRecord = {
  id: string;
  title: string;
  date: string;
  lastStudied: string;
  progress: number;
  pdfCount: number;
  audioCount: number;
  videoCount: number;
  imageCount: number;
  notes: string | null;
  flashcards: string | null;
  quiz: string | null;
  quest: string | null;
  podcast: string | null;
  visual: string | null;
  activeModes: string | null;
  notesProgress: number;
  flashcardsProgress: number;
  quizProgress: number;
  questProgress: number;
  podcastProgress: number;
  visualProgress: number;
  audioProgress: number;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  files: string | null;
};

type WhereUnique = {
  id: string;
};

type FindManyArgs = {
  orderBy?: Record<string, "asc" | "desc">;
};

type FindUniqueArgs = {
  where: WhereUnique;
  select?: Record<string, boolean>;
};

type IncrementValue = { increment: number };
type WriteValue = string | number | null | IncrementValue;

type WriteData = Record<string, WriteValue>;

const SESSION_COLUMNS = new Set([
  "id",
  "title",
  "date",
  "lastStudied",
  "progress",
  "pdfCount",
  "audioCount",
  "videoCount",
  "imageCount",
  "notes",
  "flashcards",
  "quiz",
  "quest",
  "podcast",
  "visual",
  "activeModes",
  "notesProgress",
  "flashcardsProgress",
  "quizProgress",
  "questProgress",
  "podcastProgress",
  "visualProgress",
  "audioProgress",
  "userId",
  "createdAt",
  "updatedAt",
  "files",
]);

function databaseUrl(): string {
  const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
  if (url === "file:./dev.db") {
    return "file:./prisma/dev.db";
  }
  return url;
}

const db = createClient({
  url: databaseUrl(),
});

function createId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 16)}`;
}

function now(): string {
  return new Date().toISOString();
}

function assertSessionColumn(column: string): void {
  if (!SESSION_COLUMNS.has(column)) {
    throw new Error(`Unsupported Session column: ${column}`);
  }
}

function selectClause(select?: Record<string, boolean>): string {
  if (!select) {
    return "*";
  }

  const columns = Object.entries(select)
    .filter(([, enabled]) => enabled)
    .map(([column]) => {
      assertSessionColumn(column);
      return `"${column}"`;
    });

  return columns.length > 0 ? columns.join(", ") : "*";
}

function isIncrementValue(value: WriteValue): value is IncrementValue {
  return typeof value === "object" && value !== null && "increment" in value;
}

function rowToSession(row: Record<string, unknown> | undefined): SessionRecord | null {
  return row ? row as SessionRecord : null;
}

function normalizeCreateData(data: WriteData): WriteData {
  const timestamp = now();
  return {
    id: createId(),
    progress: 0,
    pdfCount: 0,
    audioCount: 0,
    videoCount: 0,
    imageCount: 0,
    notesProgress: 0,
    flashcardsProgress: 0,
    quizProgress: 0,
    questProgress: 0,
    podcastProgress: 0,
    visualProgress: 0,
    audioProgress: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...data,
  };
}

function buildInsert(data: WriteData): { sql: string; args: InValue[] } {
  const normalized = normalizeCreateData(data);
  const entries = Object.entries(normalized);
  for (const [column] of entries) assertSessionColumn(column);

  const columns = entries.map(([column]) => `"${column}"`).join(", ");
  const placeholders = entries.map(() => "?").join(", ");

  return {
    sql: `INSERT INTO "Session" (${columns}) VALUES (${placeholders}) RETURNING *`,
    args: entries.map(([, value]) => value as InValue),
  };
}

function buildUpdate(id: string, data: WriteData): { sql: string; args: InValue[] } {
  const entries = Object.entries({ ...data, updatedAt: now() });
  for (const [column] of entries) assertSessionColumn(column);

  const assignments = entries.map(([column, value]) => {
    if (isIncrementValue(value)) {
      return `"${column}" = "${column}" + ?`;
    }
    return `"${column}" = ?`;
  });

  return {
    sql: `UPDATE "Session" SET ${assignments.join(", ")} WHERE id = ? RETURNING *`,
    args: [
      ...entries.map(([, value]) => (
        isIncrementValue(value)
          ? value.increment
          : value
      ) as InValue),
      id,
    ],
  };
}

export const prisma = {
  session: {
    async findMany(args: FindManyArgs = {}) {
      let sql = 'SELECT * FROM "Session"';

      if (args.orderBy) {
        const [[column, direction]] = Object.entries(args.orderBy);
        assertSessionColumn(column);
        sql += ` ORDER BY "${column}" ${direction.toLowerCase() === "asc" ? "ASC" : "DESC"}`;
      }

      const result = await db.execute(sql);
      return result.rows.map((row) => row as unknown as SessionRecord);
    },

    async findUnique(args: FindUniqueArgs) {
      const result = await db.execute({
        sql: `SELECT ${selectClause(args.select)} FROM "Session" WHERE id = ? LIMIT 1`,
        args: [args.where.id],
      });

      return rowToSession(result.rows[0]);
    },

    async create({ data }: { data: WriteData }): Promise<SessionRecord> {
      const insert = buildInsert(data);
      const result = await db.execute(insert);
      const session = rowToSession(result.rows[0]);
      if (!session) throw new Error("Failed to create session");
      return session;
    },

    async update({ where, data }: { where: WhereUnique; data: WriteData }): Promise<SessionRecord> {
      const update = buildUpdate(where.id, data);
      const result = await db.execute(update);
      const session = rowToSession(result.rows[0]);
      if (!session) throw new Error(`Session not found: ${where.id}`);
      return session;
    },

    async delete({ where }: { where: WhereUnique }) {
      const result = await db.execute({
        sql: 'DELETE FROM "Session" WHERE id = ? RETURNING *',
        args: [where.id],
      });
      return rowToSession(result.rows[0]);
    },

    async deleteMany(_args?: unknown) {
      const result = await db.execute('DELETE FROM "Session"');
      return { count: result.rowsAffected };
    },
  },
};
