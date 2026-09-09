export type Operator = "EQ" | "NEQ" | "GT" | "GTE" | "LT" | "LTE" | "IN" | "CONTAINS" | "TRUTHY";
export interface ActionRule { approvedActionFil?: string; whyItAppliesFil?: string; ruleId: string; disasterPhase: string; field: string; operator: Operator; threshold: unknown; approvedAction: string; whyItApplies: string; sourceAgency: string; sourceDocument: string; targetAudience: string; responsibleUnit: string; requiresLguConfirmation: boolean; version: string; activeStatus: boolean; }
const blocked = [/evacuation order/i, /evacuation route/i, /\barea is safe\b/i, /automatically allocate/i, /infrastructure project/i];
function matches(actual: unknown, operator: Operator, expected: unknown) {
  switch (operator) {
    case "EQ": return actual === expected; case "NEQ": return actual !== expected;
    case "GT": return Number(actual) > Number(expected); case "GTE": return Number(actual) >= Number(expected);
    case "LT": return Number(actual) < Number(expected); case "LTE": return Number(actual) <= Number(expected);
    case "IN": return Array.isArray(expected) && expected.includes(actual);
    case "CONTAINS": return Array.isArray(actual) ? actual.includes(expected) : String(actual ?? "").includes(String(expected));
    case "TRUTHY": return Boolean(actual); default: return false;
  }
}
export function evaluateActionRules(rules: ActionRule[], facts: Record<string, unknown>, phase?: string) {
  return rules.filter(r => r.activeStatus && (!phase || r.disasterPhase === phase) && matches(facts[r.field], r.operator, r.threshold)).map(r => {
    if (blocked.some(pattern => pattern.test(r.approvedAction))) throw new Error(`Unsupported action in approved rule ${r.ruleId}.`);
    return { actionRuleId: r.ruleId, trigger: `${r.field} ${r.operator} ${JSON.stringify(r.threshold)}`, action: r.approvedAction,
      whyItApplies: r.whyItApplies, evidence: { field: r.field, value: facts[r.field] }, source: `${r.sourceAgency} — ${r.sourceDocument}`,
      responsibleUnit: r.responsibleUnit, requiresLguConfirmation: r.requiresLguConfirmation, status: "RECOMMENDED" as const, version: r.version };
  });
}
