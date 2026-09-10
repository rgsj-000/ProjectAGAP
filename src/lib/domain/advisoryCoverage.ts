export type AdvisoryCoverageLevel =
  | "PROVINCE"
  | "CITY_MUNICIPALITY"
  | "BARANGAY"
  | "SPECIFIC_AREA";

const normalize = (value: string) =>
  value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function resolveAdvisoryApplicability(input: {
  coverageLevel: AdvisoryCoverageLevel;
  sourceAreas: string[];
  barangays: Array<{ barangay_name: string; city?: string | null }>;
}) {
  const source = input.sourceAreas.map(normalize).filter(Boolean);
  const allBarangays = input.barangays.map((b) => b.barangay_name);
  const localCities = [...new Set(input.barangays.map((b) => b.city).filter(Boolean))] as string[];

  if (input.coverageLevel === "PROVINCE") {
    const coversQuezon = source.some((area) => area === "quezon" || area.includes("quezon province"));
    return coversQuezon ? allBarangays : [];
  }

  if (input.coverageLevel === "CITY_MUNICIPALITY") {
    const coversLocalCity = localCities.some((city) => {
      const normalizedCity = normalize(city);
      return source.some(
        (area) =>
          area === normalizedCity ||
          area.includes(normalizedCity) ||
          normalizedCity.includes(area),
      );
    });
    return coversLocalCity ? allBarangays : [];
  }

  const matched = input.barangays
    .filter((barangay) => {
      const barangayName = normalize(barangay.barangay_name);
      return source.some(
        (area) =>
          area === barangayName ||
          area.endsWith(` ${barangayName}`) ||
          area.includes(`barangay ${barangayName}`),
      );
    })
    .map((barangay) => barangay.barangay_name);

  return [...new Set(matched)];
}

export function inferCoverageLevel(
  sourceAreas: string[],
  barangays: Array<{ barangay_name: string; city?: string | null }>,
): AdvisoryCoverageLevel {
  const normalized = sourceAreas.map(normalize);
  if (normalized.some((area) => area === "quezon" || area.includes("quezon province"))) {
    return "PROVINCE";
  }

  const localCities = [...new Set(barangays.map((b) => b.city).filter(Boolean))] as string[];
  if (
    localCities.some((city) => {
      const normalizedCity = normalize(city);
      return normalized.some((area) => area === normalizedCity || area.includes(normalizedCity));
    })
  ) {
    return "CITY_MUNICIPALITY";
  }

  const barangayNames = new Set(barangays.map((b) => normalize(b.barangay_name)));
  if (normalized.some((area) => barangayNames.has(area))) return "BARANGAY";

  return "SPECIFIC_AREA";
}
