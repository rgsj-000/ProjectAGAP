import { generateHouseholdCard } from "@/lib/domain/actionCards";
import { fail, ok, AppError } from "@/lib/server/errors";
import {
  activeRules,
  activeVerifiedAdvisory,
  camelAdvisory,
} from "@/lib/server/repositories";
import {
  createAdminClient,
  createPublicDataClient,
} from "@/lib/server/supabase";
import { householdRequest } from "@/lib/server/validation";

export async function POST(request: Request) {
  try {
    const v = householdRequest.parse(await request.json());

    let barangay: string;
    let profile: Record<string, unknown>;
    let code: string | undefined;
    const language = v.language;

    /*
     * Quick Profile and Generic Barangay Card are intentionally public and
     * contain no stored household identity. Use the anon-key client for those
     * flows so a service-role configuration problem cannot break public
     * preparedness guidance.
     *
     * Household Code remains server-mediated with the service-role client
     * because household_profiles must never be directly readable by anon.
     */
    const db =
      v.mode === "code" ? createAdminClient() : createPublicDataClient();

    if (v.mode === "code") {
      const { data, error } = await db
        .from("household_profiles")
        .select(
          "household_code,household_members,has_children,has_older_person,has_pwd_or_mobility_limitation,needs_essential_medicine,has_pets,housing_characteristics,communication_methods,barangays!inner(barangay_name)",
        )
        .eq("household_code", v.householdCode.toUpperCase())
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new AppError(
          "RECORD_NOT_FOUND",
          "Household code was not found.",
          404,
        );
      }

      const linkedBarangay = data.barangays as unknown as {
        barangay_name: string;
      };

      barangay = linkedBarangay.barangay_name;
      code = data.household_code;
      profile = {
        householdSize: data.household_members,
        hasInfantOrChild: data.has_children,
        hasOlderPerson: data.has_older_person,
        hasPwdOrMobilityLimitation: data.has_pwd_or_mobility_limitation,
        hasEssentialMedicineNeed: data.needs_essential_medicine,
        hasPets: data.has_pets,
        housingCharacteristics: data.housing_characteristics,
        communicationMethods: data.communication_methods,
      };
    } else {
      barangay = v.barangay;
      profile =
        v.mode === "quick-profile" ? v : { genericBarangay: true };
    }

    const advisory = camelAdvisory(
      await activeVerifiedAdvisory(db, barangay),
    );
    const rules = await activeRules(db, "HOUSEHOLD");

    if (!rules.length) {
      throw new AppError(
        "ACTION_RULE_MISSING",
        "No approved household preparedness rules are available for the current advisory.",
        503,
      );
    }

    const card = generateHouseholdCard({
      barangay,
      householdCode: code,
      profile,
      advisory,
      rules,
      language,
    });

    /*
     * Persisting a generated public card is useful for audit/analytics but is
     * not required to safely deliver guidance. Only the privileged code flow
     * persists here; quick/generic generation must not depend on a secret.
     */
    if (v.mode === "code") {
      const { error } = await db.from("generated_outputs").insert({
        output_type: "HOUSEHOLD_ACTION_CARD",
        content: card,
        language,
        source_snapshot: {
          advisoryId: advisory.id,
          ruleIds: card.actions.map((action) => action.id),
        },
      });

      if (error) {
        console.error("Unable to persist household action card", {
          message: error.message,
          code: error.code,
        });
      }
    }

    return ok(card, 201);
  } catch (e) {
    return fail(e);
  }
}
