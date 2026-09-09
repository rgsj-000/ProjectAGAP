import { z } from "zod";
import { fail, ok } from "@/lib/server/errors";
import { requireLguUser } from "@/lib/server/auth";
import { explainWithGemini } from "@/lib/server/gemini";
import { uuid } from "@/lib/server/validation";
export async function POST(r: Request) {
 try { const { supabase } = await requireLguUser();
 const v=z.object({outputId:uuid,language:z.enum(["en","fil"]).default("en"),mode:z.enum(["explain","brief"]).default("explain")}).parse(await r.json());
 const {data,error}=await supabase.from("generated_outputs").select("content,source_snapshot").eq("id",v.outputId).single();
 if(error)throw error;
 const task = v.mode === "brief"
	 ? "Create a concise operational barangay preparedness brief from only the supplied persisted output and source snapshot. Organize it as Situation, Why Attention Is Needed, Preparedness Capacity, Priority Checks, Information Still Needed, and LGU Actions. Preserve every supplied value exactly. Use only supplied recommendations and label missing values as not recorded. Do not create new facts, estimates, warnings, instructions, evacuation decisions, or actions."
	 : "Explain only the supplied output without adding actions or changing any values";
 try {return ok({...await explainWithGemini({task,verifiedInput:data,language:v.language}),fallback:false});}
 catch {return ok({text:v.language==="fil"?"Hindi magagamit ang AI. Gamitin ang beripikadong datos at mga aprubadong aksyon sa card.":"AI wording is unavailable. Use the verified values and approved actions on the card.",fallback:true,content:data.content});}
 } catch(e){return fail(e);}
}
