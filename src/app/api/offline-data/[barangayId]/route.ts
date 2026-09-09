import { uuid } from "@/lib/server/validation";
import { fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { activeVerifiedAdvisory, activeRules } from "@/lib/server/repositories";
export async function GET(_:Request,ctx:{params:Promise<{barangayId:string}>}) {
 try {const {barangayId}=await ctx.params;uuid.parse(barangayId);const {supabase}=await requireLguUser();
 const {data:barangay,error:be}=await supabase.from("barangays").select("id,psgc_code,city,barangay_name,population,source,reference_year").eq("id",barangayId).single();if(be)throw be;
 const advisory=await activeVerifiedAdvisory(supabase,barangay.barangay_name);
 const [risk,exposure,capacity,facilities,cards,methods]=await Promise.all([
 supabase.from("risk_assessments").select("*").eq("barangay_id",barangayId).eq("advisory_id",advisory.id).order("assessment_date",{ascending:false}),
 supabase.from("population_exposure_estimates").select("*").eq("barangay_id",barangayId).order("generated_at",{ascending:false}),
 supabase.from("preparedness_capacities").select("*").eq("barangay_id",barangayId).order("validation_date",{ascending:false}),
 supabase.from("critical_facilities").select("id,name,type,operational_status,capacity,last_validation_date,source").eq("barangay_id",barangayId),
 supabase.from("generated_outputs").select("*").eq("reference_id",barangayId).order("generated_at",{ascending:false}).limit(10),
 supabase.from("methodologies").select("*").eq("active_status",true)]);
 for(const result of [risk,exposure,capacity,facilities,cards,methods])if(result.error)throw result.error;
 return ok({barangay,advisory,riskAssessments:risk.data,exposureEstimates:exposure.data,preparednessCapacities:capacity.data,criticalFacilities:facilities.data,generatedCards:cards.data,methodologies:methods.data,approvedActionRules:await activeRules(supabase),synchronization:{lastSyncAt:new Date().toISOString(),sourceDate:advisory.issue_time,advisoryValidity:advisory.validity_end,staleData:false}});
 }catch(e){return fail(e);}
}
