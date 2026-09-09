import { execFileSync } from "node:child_process";

const projectRef = "xxaqxcwsyawpqwphxuix";
const keyRows = JSON.parse(
  execFileSync(
    "rtk",
    [
      "proxy",
      "npx.cmd",
      "supabase",
      "projects",
      "api-keys",
      "--project-ref",
      projectRef,
      "--output",
      "json",
    ],
    { encoding: "utf8" },
  ),
);
const serviceKey = keyRows.find((row) => row.name === "service_role")?.api_key;
if (!serviceKey) throw new Error("Supabase service-role key is unavailable.");

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
};

async function read(table, select, query = "") {
  const response = await fetch(
    `https://${projectRef}.supabase.co/rest/v1/${table}?select=${encodeURIComponent(select)}${query}`,
    { headers },
  );
  if (!response.ok) throw new Error(`${table}: ${await response.text()}`);
  return response.json();
}

const barangays = await read(
  "barangays",
  "id,psgc_code,name,barangay_name,population,source,is_demo,data_classification",
  "&barangay_name=in.(Dalahican,Cotta,Barra,Gulang-gulang,Ibabang%20Dupay,Mayao%20Crossing,Ransohan)&order=barangay_name",
);

const [risks, exposures, capacities, facilities, advisories, hazards, methodologies] = await Promise.all([
  read("risk_assessments", "barangay_id,hazard_id,likelihood,severity,risk_result,risk_category,relative_vulnerability,confidence_level", "&hazard_id=eq.20000000-0000-4000-8000-000000000001"),
  read("population_exposure_estimates", "barangay_id,hazard_id,estimated_exposed_population,estimated_households,confidence_level,is_demo", "&hazard_id=eq.20000000-0000-4000-8000-000000000001&is_demo=eq.true"),
  read("preparedness_capacities", "barangay_id,evacuation_capacity,temporary_shelter_capacity,responders,validation_date,is_demo", "&is_demo=eq.true"),
  read("critical_facilities", "barangay_id,name,operational_status,capacity,is_demo", "&is_demo=eq.true"),
  read("advisories", "id,verification_status,validity_start,validity_end,affected_areas,is_demo", "&id=eq.40000000-0000-4000-8000-000000000001"),
  read("hazards", "id,name,hazard_type,is_demo", "&id=eq.20000000-0000-4000-8000-000000000001"),
  read("methodologies", "id,name,version,active_status", "&id=eq.30000000-0000-4000-8000-000000000001"),
]);

const byBarangay = (rows) => new Map(rows.map((row) => [row.barangay_id, row]));
const riskByBarangay = byBarangay(risks);
const exposureByBarangay = byBarangay(exposures);
const capacityByBarangay = byBarangay(capacities);
const facilityByBarangay = byBarangay(facilities);
const summary = barangays.map((barangay) => {
  const risk = riskByBarangay.get(barangay.id);
  const exposure = exposureByBarangay.get(barangay.id);
  const capacity = capacityByBarangay.get(barangay.id);
  const facility = facilityByBarangay.get(barangay.id);
  return {
    barangay: barangay.barangay_name,
    population: barangay.population,
    risk: risk ? `${risk.likelihood}x${risk.severity}=${risk.risk_result} ${risk.risk_category}` : null,
    exposedPopulation: exposure?.estimated_exposed_population ?? null,
    planningCapacity: capacity
      ? capacity.evacuation_capacity + capacity.temporary_shelter_capacity
      : null,
    facility: facility?.name ?? null,
  };
});

const incomplete = summary.filter((row) =>
  [row.population, row.risk, row.exposedPopulation, row.planningCapacity, row.facility].some(
    (value) => value === null,
  ),
);
console.table(summary);
const advisory = advisories[0];
const ready =
  advisory?.verification_status === "VERIFIED" &&
  Date.parse(advisory.validity_start) <= Date.now() &&
  Date.parse(advisory.validity_end) > Date.now() &&
  summary.every((row) => advisory.affected_areas.includes(row.barangay)) &&
  hazards.length === 1 &&
  methodologies[0]?.active_status === true;
console.log(JSON.stringify({ barangays: summary.length, risks: risks.length, exposures: exposures.length, capacities: capacities.length, demoFacilities: facilities.length, activeAdvisory: ready, hazards: hazards.length, activeMethodologies: methodologies.filter((row) => row.active_status).length }));
if (summary.length !== 7 || incomplete.length || !ready) {
  throw new Error(`Incomplete demo coverage: ${JSON.stringify(incomplete)}`);
}
