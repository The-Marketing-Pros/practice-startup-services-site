// Minimal D1Database adapter over node:sqlite so endpoint tests run the real
// migration SQL (constraints, ON CONFLICT, RETURNING) instead of a mock.
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

export type Fault = { match: RegExp; error: string; times?: number; method?: "first" | "run" };

export function createD1(opts: { faults?: Fault[]; hideFirstSelects?: number } = {}) {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../../migrations/0001_research.sql", import.meta.url), "utf8"));
  const faults = opts.faults ?? [];
  let hide = opts.hideFirstSelects ?? 0;
  const statements: string[] = [];
  const check = (sql: string, method: "first" | "run") => {
    for (const f of faults) {
      if ((f.times ?? Infinity) <= 0) continue;
      if (f.method && f.method !== method) continue;
      if (f.match.test(sql)) {
        if (f.times !== undefined) f.times--;
        throw new Error(f.error);
      }
    }
  };
  const d1 = {
    prepare(sql: string) {
      let args: unknown[] = [];
      const stmt = {
        bind(...a: unknown[]) {
          args = a;
          return stmt;
        },
        async first<T>(): Promise<T | null> {
          statements.push(sql);
          check(sql, "first");
          if (hide > 0 && /^SELECT id, identity_hash/.test(sql)) {
            hide--;
            return null;
          }
          return (db.prepare(sql).get(...(args as never[])) as T) ?? null;
        },
        async run() {
          statements.push(sql);
          check(sql, "run");
          const r = db.prepare(sql).run(...(args as never[]));
          return { success: true, meta: { changes: Number(r.changes) } };
        },
      };
      return stmt;
    },
  };
  return { d1: d1 as unknown as D1Database, sqlite: db, statements };
}
