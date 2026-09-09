import{fail,ok}from"@/lib/server/errors";import{requireLguUser}from"@/lib/server/auth";
export async function GET(){try{const{supabase}=await requireLguUser();const{data,error}=await supabase.from("hazards").select("id,name,hazard_type,source,is_demo").order("name");if(error)throw error;return ok(data)}catch(e){return fail(e)}}
