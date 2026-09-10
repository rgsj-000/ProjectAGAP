import { generateHouseholdCard } from "@/lib/domain/actionCards";
import { fail, ok, AppError } from "@/lib/server/errors";
import {
  activeRules,
  activeVerifiedAdvisory,
  camelAdvisory,
} from "@/lib/server/repositories";
import { createPublicDataClient } from "@/lib/server/supabase";
import { householdRequest } from "@/lib/server/validation";

type HouseholdLookupRow = {
  household_code: string;
  barangay_name: string;
  household_members: number | null;
  has_children: boolean;
  has_older_person: boolean;
  has_pwd_or_mobility_limitation: boolean;
  needs_essential_medicine: boolean;
  has_pets: boolean;
  housing_characteristics: unknown;
  communication_methods: string[];
};

export async function POST(request: Request) {
  try {
    const v = householdRequest.parse(await request.json());
    const db = createPublicDataClient();

    let barangay: string;
    let profile: Record<string, unknown>;
    let code: string | undefined;
    const language = v.language;

    if (v.mode === "code") {
      /*
       * Exact-code lookup is implemented as a SECURITY DEFINER RPC that exposes
       * only the minimum non-identifying preparedness fields. anon still has
       * no direct SELECT permission on household_profiles.
       */
      const normalizedCode = v.householdCode.trim().toUpperCase();
      const { data, error } = await db.rpc("lookup_household_profile", {
        p_household_code: normalizedCode,
      });

      if (error) throw error;

      const row = (Array.isArray(data) ? data[0] : data) as
        | HouseholdLookupRow
        | undefined;

      if (!row) {
        throw new AppError(
          "RECORD_NOT_FOUND",
          "Household code was not found.",
          404,
        );
      }

      barangay = row.barangay_name;
      code = row.household_code;
      profile = {
        householdSize: row.household_members,
        hasInfantOrChild: row.has_children,
        hasOlderPerson: row.has_older_person,
        hasPwdOrMobilityLimitation: row.has_pwd_or_mobility_limitation,
        hasEssentialMedicineNeed: row.needs_essential_medicine,
        hasPets: row.has_pets,
        housingCharacteristics: row.housing_characteristics,
        communicationMethods: row.communication_methods ?? [],
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

    return ok(card, 201);
  } catch (e) {
    return fail(e);
  }
}
