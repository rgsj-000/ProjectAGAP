import { fail,ok } from "@/lib/server/errors";import{requireLguUser}from"@/lib/server/auth";
export async function GET(){try{const{supabase}=await requireLguUser();const{data,error}=await supabase.from("barangays").select("id,psgc_code,city,barangay_name,population,source,reference_year,is_demo").order("barangay_name");if(error)throw error;return ok(data)}catch(e){return fail(e)}}
