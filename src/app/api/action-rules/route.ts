import{fail,ok}from"@/lib/server/errors";import{requireLguUser}from"@/lib/server/auth";
export async function GET(){try{const{supabase}=await requireLguUser();const{data,error}=await supabase.from("action_rules").select("*").eq("active_status",true);if(error)throw error;return ok(data)}catch(e){return fail(e)}}
