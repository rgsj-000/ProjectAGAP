export function calculateCapacityGap(input: { estimatedExposure: number; validatedCapacity: number; confidence: "LOW" | "MEDIUM" | "HIGH"; evidence: string[] }) {
  if (input.estimatedExposure < 0 || input.validatedCapacity < 0) throw new Error("Exposure and capacity cannot be negative.");
  const capacityGap = input.estimatedExposure - input.validatedCapacity;
  return { ...input, capacityGap, hasPotentialShortfall: capacityGap > 0,
    validationRequirement: "Potential gaps require LGU validation and never constitute an evacuation order or automatic allocation." };
}
