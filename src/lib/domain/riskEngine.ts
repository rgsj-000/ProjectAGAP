import { DomainError as AppError } from "./errors";

export interface Methodology {
  name: string; version: string; likelihoodScale: { min: number; max: number };
  severityScale: { min: number; max: number }; parameters: { categories: Array<{ min: number; max: number; label: string }> };
}
export interface RiskEngineInput { likelihood: number; severity: number; threatLevel?: number; adaptiveCapacity?: number; evidence: string[]; limitations?: string[]; assessmentDate?: string; }

export function calculateRisk(methodology: Methodology, input: RiskEngineInput) {
  const inRange = (n: number, scale: { min: number; max: number }) => Number.isInteger(n) && n >= scale.min && n <= scale.max;
  if (!inRange(input.likelihood, methodology.likelihoodScale) || !inRange(input.severity, methodology.severityScale)) {
    throw new AppError("INVALID_INPUT", "Likelihood or severity is outside the methodology scale.", 422);
  }
  if ((input.threatLevel === undefined) !== (input.adaptiveCapacity === undefined)) {
    throw new AppError("INVALID_INPUT", "Threat level and adaptive capacity must be supplied together.", 422);
  }
  if (input.adaptiveCapacity !== undefined && input.adaptiveCapacity <= 0) throw new AppError("INVALID_INPUT", "Adaptive capacity must be greater than zero.", 422);
  const result = input.likelihood * input.severity;
  const category = methodology.parameters.categories.find(c => result >= c.min && result <= c.max)?.label;
  if (!category) throw new AppError("METHODOLOGY_MISSING", "The methodology does not define a category for this result.", 422);
  const relativeVulnerability = input.threatLevel !== undefined ? input.threatLevel / input.adaptiveCapacity! : null;
  return {
    likelihood: input.likelihood, severity: input.severity,
    calculation: `${input.likelihood} × ${input.severity} = ${result}`,
    riskResult: result, riskCategory: category, methodologyName: methodology.name,
    methodologyVersion: methodology.version, assessmentDate: input.assessmentDate ?? new Date().toISOString(),
    relativeVulnerability, evidence: [...input.evidence], limitations: [...(input.limitations ?? [])],
  } as const;
}
