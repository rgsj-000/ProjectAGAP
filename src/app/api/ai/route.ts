import { z } from "zod";
import { fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { explainWithGemini } from "@/lib/server/gemini";
import { uuid } from "@/lib/server/validation";
export async function POST(r: Request) {
 try { const { supabase } = await requireLguUser();
 const v=z.object({outputId:uuid,language:z.enum(["en","fil"]).default("en")}).parse(await r.json());
 const {data,error}=await supabase.from("generated_outputs").select("content,source_snapshot").eq("id",v.outputId).single();
 if(error)throw error;
 try {return ok({...await explainWithGemini({task:"Explain only the supplied output without adding actions or changing any values",verifiedInput:data,language:v.language}),fallback:false});}
 catch {return ok({text:v.language==="fil"?"Hindi magagamit ang AI. Gamitin ang beripikadong datos at mga aprubadong aksyon sa card.":"AI wording is unavailable. Use the verified values and approved actions on the card.",fallback:true,content:data.content});}
 } catch(e){return fail(e);}
}
