export function classifyIncomingRecord(existing: { version: number; evidence: unknown } | null, incoming: { baseVersion: number; evidence: unknown }) {
  if (!existing) return "CREATE" as const;
  const identical = existing.version === incoming.baseVersion && JSON.stringify(existing.evidence) === JSON.stringify(incoming.evidence);
  return identical ? "DUPLICATE" as const : "CONFLICT" as const;
}
