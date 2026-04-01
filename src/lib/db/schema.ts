import { pgTable, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const savedSearches = pgTable("saved_searches", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  focusArea: text("focus_area").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SavedSearch = typeof savedSearches.$inferSelect;

export const scans = pgTable("scans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  focusArea: text("focus_area"),
  results: jsonb("results").notNull(), // ScanResult[]
  statuses: jsonb("statuses").$type<Record<string, 'Pursuing' | 'Watch' | 'Passed'>>(),
  pipelineSent: jsonb("pipeline_sent").$type<Record<string, boolean>>(),
  isLab: boolean("is_lab").default(false).notNull(),
  promptVersionId: text("prompt_version_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;

export const promptVersions = pgTable("prompt_versions", {
  id: text("id").primaryKey(),
  label: text("label"),
  body: text("body").notNull(),
  focusAreaInstruction: text("focus_area_instruction").notNull(),
  status: text("status").notNull().default("draft"), // 'draft' | 'active' | 'archived'
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  activatedAt: timestamp("activated_at"),
});

export type PromptVersion = typeof promptVersions.$inferSelect;
export type NewPromptVersion = typeof promptVersions.$inferInsert;

// Shape of each result returned by Claude
export type ScanResult = {
  id: string;
  opportunity: string;
  signal: string;
  whyEnso: string;
  decisionMaker: { name: string; title: string };
  source: { publication: string; headline: string; url: string };
  urgency: string;
  companyName: string;
  sector?: string;
};
