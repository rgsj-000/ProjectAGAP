import{fail,ok}from"@/lib/server/errors";import{requireLguUser}from"@/lib/server/auth";
export async function GET(){try{const{supabase}=await requireLguUser(["admin","lgu_reviewer"]);const{data,error}=await supabase.from("sync_conflicts").select("*").eq("status","ACTION_REQUIRED").order("created_at");if(error)throw error;return ok(data)}catch(e){return fail(e)}}
