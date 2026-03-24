import type { ScanResult } from "./db/schema";

export async function sendToPipeline(
  result: ScanResult,
  sponsor: string
): Promise<{ id: string }> {
  const url = process.env.PIPELINE_API_URL;
  const secret = process.env.PIPELINE_API_SECRET;

  if (!url || !secret) {
    throw new Error("Pipeline connection not configured");
  }

  const res = await fetch(`${url}/api/opportunities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": secret,
    },
    body: JSON.stringify({
      companyName: result.companyName,
      sector: result.sector,
      sponsor,
      scoutSummary: [
        result.source.headline,
        result.signal,
        result.whyEnso,
        `At Stake: ${result.urgency}`,
      ].filter(Boolean).join('\n\n'),
      decisionMaker: `${result.decisionMaker.name}, ${result.decisionMaker.title}`,
      source: result.source.url
        ? `${result.source.publication} — ${result.source.headline}\n${result.source.url}`
        : result.source.publication,
      entrySource: "Signal Scout",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pipeline API error ${res.status}: ${text}`);
  }

  return res.json();
}
