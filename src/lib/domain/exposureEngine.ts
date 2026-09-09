export type Confidence = "LOW" | "MEDIUM" | "HIGH";
type Base = { source: string; referenceDate: string; population: number; households: number; vulnerableGroups?: Record<string, number>; limitations?: string[] };
export type ExposureInput =
  | (Base & { populationGridIntersected: number })
  | (Base & { residentialBuildingRatio: number })
  | (Base & { inhabitedAreaRatio: number });

export function estimateExposure(input: ExposureInput) {
  let ratio: number; let method: string; let confidence: Confidence;
  if ("populationGridIntersected" in input) { ratio = input.populationGridIntersected / input.population; method = "POPULATION_GRID_HAZARD_INTERSECTION"; confidence = "HIGH"; }
  else if ("residentialBuildingRatio" in input) { ratio = input.residentialBuildingRatio; method = "RESIDENTIAL_BUILDING_FOOTPRINT_RATIO"; confidence = "MEDIUM"; }
  else { ratio = input.inhabitedAreaRatio; method = "INHABITED_AREA_PROPORTION_FALLBACK"; confidence = "LOW"; }
  ratio = Math.min(1, Math.max(0, ratio));
  const estimatedPopulation = "populationGridIntersected" in input ? Math.round(input.populationGridIntersected) : Math.round(input.population * ratio);
  const scale = input.population === 0 ? 0 : estimatedPopulation / input.population;
  return {
    label: "Estimated Potentially Exposed Population", estimatedPopulation,
    estimatedHouseholds: Math.round(input.households * scale),
    vulnerableGroupEstimates: Object.fromEntries(Object.entries(input.vulnerableGroups ?? {}).map(([k, v]) => [k, Math.round(v * scale)])),
    estimationMethod: method, source: input.source, referenceDate: input.referenceDate, confidenceLevel: confidence,
    generatedAt: new Date().toISOString(), limitations: ["This is a pre-disaster estimate, not a count of affected persons or specific households.", ...(input.limitations ?? [])],
  };
}
