import { z } from "zod";
import { assertCurrentAdvisory } from "@/lib/domain/advisory";
import { calculateRisk } from "@/lib/domain/riskEngine";
import { audit } from "@/lib/server/audit";
import { requireLguUser } from "@/lib/server/auth";
import { AppError, fail, ok } from "@/lib/server/errors";
import { camelAdvisory } from "@/lib/server/repositories";
import { uuid } from "@/lib/server/validation";

const schema = z.object({
  barangayId: uuid,
  advisoryId: uuid,
  hazardId: uuid,
});

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireLguUser([
      "admin",
      "lgu_reviewer",
    ]);
    const value = schema.parse(await request.json());

    const [{ data: advisory, error: advisoryError }, { data: barangay, error: barangayError }] =
      await Promise.all([
        supabase
          .from("advisories")
          .select("*")
          .eq("id", value.advisoryId)
          .single(),
        supabase
          .from("barangays")
          .select("id,barangay_name")
          .eq("id", value.barangayId)
          .single(),
      ]);

    if (advisoryError) throw advisoryError;
    if (barangayError) throw barangayError;

    assertCurrentAdvisory(
      camelAdvisory(advisory),
      barangay.barangay_name,
    );

    const { data: existing, error: existingError } = await supabase
      .from("risk_assessments")
      .select("*")
      .eq("barangay_id", value.barangayId)
      .eq("advisory_id", value.advisoryId)
      .eq("hazard_id", value.hazardId)
      .order("assessment_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return ok({
        assessment: existing,
        created: false,
        sourceAssessmentId: existing.id,
      });
    }

    const { data: baseline, error: baselineError } = await supabase
      .from("risk_assessments")
      .select("*")
      .eq("barangay_id", value.barangayId)
      .eq("hazard_id", value.hazardId)
      .neq("advisory_id", value.advisoryId)
      .order("assessment_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (baselineError) throw baselineError;
    if (!baseline) {
      throw new AppError(
        "RECORD_NOT_FOUND",
        "No stored barangay-hazard baseline assessment is available for this advisory. Add or import a validated baseline assessment before generating an advisory-specific result.",
        409,
      );
    }

    const { data: methodology, error: methodologyError } = await supabase
      .from("methodologies")
      .select("*")
      .eq("id", baseline.methodology_id)
      .eq("active_status", true)
      .single();

    if (methodologyError || !methodology) {
      throw new AppError(
        "METHODOLOGY_MISSING",
        "The methodology used by the stored baseline assessment is not active or cannot be found.",
        409,
      );
    }

    const baselineEvidence = stringList(baseline.evidence);
    const baselineLimitations = stringList(baseline.limitations);
    const provenance =
      `Assessment inputs carried forward from stored barangay-hazard baseline ${baseline.id} dated ${baseline.data_date}. The verified advisory link is new; LGU reviewers must confirm that the baseline evidence remains applicable.`;

    const result = calculateRisk(
      {
        name: methodology.name,
        version: methodology.version,
        likelihoodScale: methodology.likelihood_scale,
        severityScale: methodology.severity_scale,
        parameters: methodology.parameters,
      },
      {
        likelihood: Number(baseline.likelihood),
        severity: Number(baseline.severity),
        threatLevel:
          baseline.threat_level === null || baseline.threat_level === undefined
            ? undefined
            : Number(baseline.threat_level),
        adaptiveCapacity:
          baseline.adaptive_capacity === null ||
          baseline.adaptive_capacity === undefined
            ? undefined
            : Number(baseline.adaptive_capacity),
        evidence: [...baselineEvidence, provenance],
        limitations: [
          ...baselineLimitations,
          "This advisory-specific assessment reuses the latest stored barangay-hazard methodology inputs. Confirm applicability against the verified advisory and current local conditions before operational use.",
        ],
        assessmentDate: new Date().toISOString(),
      },
    );

    const { data: assessment, error: insertError } = await supabase
      .from("risk_assessments")
      .insert({
        barangay_id: value.barangayId,
        hazard_id: value.hazardId,
        advisory_id: value.advisoryId,
        methodology_id: baseline.methodology_id,
        likelihood: result.likelihood,
        severity: result.severity,
        risk_result: result.riskResult,
        risk_category: result.riskCategory,
        threat_level:
          baseline.threat_level === null ? null : baseline.threat_level,
        adaptive_capacity:
          baseline.adaptive_capacity === null
            ? null
            : baseline.adaptive_capacity,
        relative_vulnerability: result.relativeVulnerability,
        evidence: result.evidence,
        data_date: baseline.data_date,
        confidence_level: baseline.confidence_level,
        limitations: result.limitations,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await audit(supabase, {
      userId: user.id,
      action: "GENERATED_ASSESSMENT",
      entityType: "risk_assessment",
      entityId: assessment.id,
      newValue: {
        ...result,
        advisoryId: value.advisoryId,
        barangayId: value.barangayId,
        hazardId: value.hazardId,
        sourceAssessmentId: baseline.id,
        generationMode: "STORED_BASELINE",
      },
    });

    return ok(
      {
        assessment,
        created: true,
        sourceAssessmentId: baseline.id,
      },
      201,
    );
  } catch (error) {
    return fail(error);
  }
}
