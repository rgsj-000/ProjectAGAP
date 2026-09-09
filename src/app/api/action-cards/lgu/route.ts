import { z } from "zod";
import { uuid } from "@/lib/server/validation";
import { fail, ok, AppError } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { activeRules, camelAdvisory } from "@/lib/server/repositories";
import { generateLGUActionCard } from "@/lib/domain/actionCards";
import { audit } from "@/lib/server/audit";

const schema = z.object({ barangayId: uuid, hazardId: uuid });
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireLguUser(); const value = schema.parse(await request.json());
    const [barangay, advisory, risk, exposure, capacity, facilities, hazard] = await Promise.all([
      supabase.from("barangays").select("barangay_name").eq("id", value.barangayId).single(),
      supabase.from("advisories").select("*").eq("verification_status", "VERIFIED").gt("validity_end", new Date().toISOString()).order("issue_time", { ascending: false }).limit(1).single(),
      supabase.from("risk_assessments").select("*").eq("barangay_id", value.barangayId).order("assessment_date", { ascending: false }).limit(1).single(),
      supabase.from("population_exposure_estimates").select("*").eq("barangay_id", value.barangayId).eq("hazard_id", value.hazardId).order("generated_at", { ascending: false }).limit(1).single(),
      supabase.from("preparedness_capacities").select("*").eq("barangay_id", value.barangayId).order("validation_date", { ascending: false }).limit(1).single(),
      supabase.from("critical_facilities").select("*").eq("barangay_id", value.barangayId), supabase.from("hazards").select("name").eq("id", value.hazardId).single(),
    ]);
    for (const result of [barangay, advisory, risk, exposure, capacity, facilities, hazard]) if (result.error) throw new AppError("RECORD_NOT_FOUND", result.error.message, 404);
    const a = camelAdvisory(advisory.data); const r: any = risk.data; const e: any = exposure.data; const c: any = capacity.data;
    const card = generateLGUActionCard({ barangay: barangay.data!.barangay_name, hazard: hazard.data!.name, advisory: a,
      risk: { likelihood:r.likelihood,severity:r.severity,riskResult:r.risk_result,riskCategory:r.risk_category,calculation:`${r.likelihood} × ${r.severity} = ${r.risk_result}`,assessmentDate:r.assessment_date,evidence:r.evidence },
      exposure: { estimatedPopulation:e.estimated_exposed_population,estimatedHouseholds:e.estimated_households,vulnerableGroupEstimates:e.vulnerable_group_estimates,estimationMethod:e.estimation_method,confidenceLevel:e.confidence_level,source:e.source,referenceDate:e.reference_date,generatedAt:e.generated_at,limitations:e.limitations },
      capacity: { evacuationCapacity:c.evacuation_capacity,temporaryShelterCapacity:c.temporary_shelter_capacity,communicationAccess:c.communication_access,evidence:[c.source],limitations:c.limitations }, facilities: (facilities.data??[]).map((f:any)=>({...f,operationalStatus:f.operational_status})), rules: await activeRules(supabase,"LGU") });
    const { data: output, error } = await supabase.from("generated_outputs").insert({ output_type:"LGU_ACTION_CARD",reference_id:value.barangayId,content:card,generated_by:user.id,source_snapshot:{advisoryId:a.id,riskAssessmentId:r.id,exposureEstimateId:e.id,methodologyId:r.methodology_id} }).select().single(); if(error)throw error;
    await audit(supabase,{userId:user.id,action:"GENERATED_OUTPUT",entityType:"generated_output",entityId:output.id,newValue:{outputType:"LGU_ACTION_CARD"}}); return ok(card,201);
  } catch(error){return fail(error)}
}
