import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const scans = pgTable("scans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  focusArea: text("focus_area"),
  results: jsonb("results").notNull(), // ScanResult[]
  statuses: jsonb("statuses").$type<Record<string, 'Pursuing' | 'Watch' | 'Passed'>>(),
  pipelineSent: jsonb("pipeline_sent").$type<Record<string, boolean>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;

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
