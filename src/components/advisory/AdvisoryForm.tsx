"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { AlertCircle, Plus, ShieldCheck, Trash2 } from "lucide-react";

export interface AdvisoryFormValues {
  title: string;
  source: string;
  status: "ACTIVE" | "MONITORING" | "ENDED";
  issuedTime: string;
  bulletinNumber: string;
  message: string;
  precautions: string[];
}

interface AdvisoryFormProps {
  initialValues?: Partial<AdvisoryFormValues>;
  onCancel?: () => void;
  onSave?: (values: AdvisoryFormValues) => void | Promise<void>;
}

const DEFAULT_VALUES: AdvisoryFormValues = {
  title: "",
  source: "PAGASA • DOST",
  status: "ACTIVE",
  issuedTime: "",
  bulletinNumber: "",
  message: "",
  precautions: [""],
};

export const AdvisoryForm: React.FC<AdvisoryFormProps> = ({
  initialValues,
  onCancel,
  onSave,
}) => {
  const { language } = useLanguage();
  const [values, setValues] = useState<AdvisoryFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
    precautions:
      initialValues?.precautions && initialValues.precautions.length > 0
        ? initialValues.precautions
        : DEFAULT_VALUES.precautions,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [localSuccess, setLocalSuccess] = useState(false);

  const copy = useMemo(
    () =>
      language === "en"
        ? {
            eyebrow: "OFFICIAL ADVISORY INPUT",
            title: "Create or Update Advisory",
            description:
              "Record only verified information issued by PAGASA, DOST, Lucena CDRRMO, or another authorized source.",
            verificationTitle: "Verification required",
            verificationBody:
              "Project AGAP does not generate disaster advisories. Confirm the source, bulletin reference, and issued time before saving.",
            titleLabel: "Advisory title",
            titlePlaceholder: "e.g. Severe Rainfall Advisory",
            sourceLabel: "Issuing source",
            sourcePlaceholder: "e.g. PAGASA • DOST",
            statusLabel: "Status",
            issuedLabel: "Issued / updated time",
            issuedPlaceholder: "e.g. Updated 11:00 AM Today",
            bulletinLabel: "Bulletin / reference number",
            bulletinPlaceholder: "e.g. Bulletin #4",
            messageLabel: "Main advisory message",
            messagePlaceholder: "Enter the verified advisory summary...",
            precautionsLabel: "Key directives / precautions",
            precautionPlaceholder: "Enter one verified directive or precaution",
            addPrecaution: "Add directive",
            cancel: "Cancel",
            save: "Save advisory",
            saving: "Saving...",
            localSuccess:
              "Advisory validated locally. Backend publishing is not connected yet.",
            required: "This field is required.",
            precautionRequired: "Add at least one directive or precaution.",
          }
        : {
            eyebrow: "PAGLALAGAY NG OPISYAL NA BABALA",
            title: "Gumawa o Mag-update ng Babala",
            description:
              "Itala lamang ang beripikadong impormasyong inilabas ng PAGASA, DOST, Lucena CDRRMO, o ibang awtorisadong ahensya.",
            verificationTitle: "Kailangang beripikado",
            verificationBody:
              "Hindi gumagawa ng sariling disaster advisory ang Project AGAP. Tiyakin ang pinagmulan, bulletin reference, at oras bago i-save.",
            titleLabel: "Pamagat ng babala",
            titlePlaceholder: "hal. Babala sa Malakas na Ulan",
            sourceLabel: "Ahensyang naglabas",
            sourcePlaceholder: "hal. PAGASA • DOST",
            statusLabel: "Katayuan",
            issuedLabel: "Oras ng paglabas / update",
            issuedPlaceholder: "hal. Na-update 11:00 AM Ngayon",
            bulletinLabel: "Bulletin / reference number",
            bulletinPlaceholder: "hal. Bulletin #4",
            messageLabel: "Pangunahing mensahe",
            messagePlaceholder: "Ilagay ang beripikadong buod ng babala...",
            precautionsLabel: "Mga pangunahing tagubilin / pag-iingat",
            precautionPlaceholder: "Maglagay ng isang beripikadong tagubilin",
            addPrecaution: "Magdagdag ng tagubilin",
            cancel: "Kanselahin",
            save: "I-save ang babala",
            saving: "Sine-save...",
            localSuccess:
              "Na-validate ang advisory sa frontend. Hindi pa nakakonekta ang backend publishing.",
            required: "Kinakailangan ang field na ito.",
            precautionRequired: "Magdagdag ng kahit isang tagubilin o pag-iingat.",
          },
    [language]
  );

  const updateField = <K extends keyof AdvisoryFormValues>(
    field: K,
    value: AdvisoryFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setLocalSuccess(false);
  };

  const updatePrecaution = (index: number, value: string) => {
    const next = [...values.precautions];
    next[index] = value;
    updateField("precautions", next);
    setErrors((current) => ({ ...current, precautions: "" }));
  };

  const addPrecaution = () => {
    updateField("precautions", [...values.precautions, ""]);
  };

  const removePrecaution = (index: number) => {
    if (values.precautions.length === 1) {
      updatePrecaution(0, "");
      return;
    }
    updateField(
      "precautions",
      values.precautions.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!values.title.trim()) nextErrors.title = copy.required;
    if (!values.source.trim()) nextErrors.source = copy.required;
    if (!values.issuedTime.trim()) nextErrors.issuedTime = copy.required;
    if (!values.bulletinNumber.trim()) nextErrors.bulletinNumber = copy.required;
    if (!values.message.trim()) nextErrors.message = copy.required;
    if (!values.precautions.some((item) => item.trim())) {
      nextErrors.precautions = copy.precautionRequired;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const sanitized: AdvisoryFormValues = {
      ...values,
      title: values.title.trim(),
      source: values.source.trim(),
      issuedTime: values.issuedTime.trim(),
      bulletinNumber: values.bulletinNumber.trim(),
      message: values.message.trim(),
      precautions: values.precautions.map((item) => item.trim()).filter(Boolean),
    };

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(sanitized);
      } else {
        setLocalSuccess(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
          {copy.eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
          {copy.title}
        </h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
          {copy.description}
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
        <div>
          <p className="text-xs font-bold text-amber-900">{copy.verificationTitle}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
            {copy.verificationBody}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={copy.titleLabel} error={errors.title} className="sm:col-span-2">
            <input
              value={values.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder={copy.titlePlaceholder}
              className={inputClass(Boolean(errors.title))}
              aria-invalid={Boolean(errors.title)}
            />
          </Field>

          <Field label={copy.sourceLabel} error={errors.source}>
            <input
              value={values.source}
              onChange={(event) => updateField("source", event.target.value)}
              placeholder={copy.sourcePlaceholder}
              className={inputClass(Boolean(errors.source))}
              aria-invalid={Boolean(errors.source)}
            />
          </Field>

          <Field label={copy.statusLabel}>
            <select
              value={values.status}
              onChange={(event) =>
                updateField("status", event.target.value as AdvisoryFormValues["status"])
              }
              className={inputClass(false)}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="MONITORING">MONITORING</option>
              <option value="ENDED">ENDED</option>
            </select>
          </Field>

          <Field label={copy.issuedLabel} error={errors.issuedTime}>
            <input
              value={values.issuedTime}
              onChange={(event) => updateField("issuedTime", event.target.value)}
              placeholder={copy.issuedPlaceholder}
              className={inputClass(Boolean(errors.issuedTime))}
              aria-invalid={Boolean(errors.issuedTime)}
            />
          </Field>

          <Field label={copy.bulletinLabel} error={errors.bulletinNumber}>
            <input
              value={values.bulletinNumber}
              onChange={(event) => updateField("bulletinNumber", event.target.value)}
              placeholder={copy.bulletinPlaceholder}
              className={inputClass(Boolean(errors.bulletinNumber))}
              aria-invalid={Boolean(errors.bulletinNumber)}
            />
          </Field>

          <Field label={copy.messageLabel} error={errors.message} className="sm:col-span-2">
            <textarea
              value={values.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder={copy.messagePlaceholder}
              className={`${inputClass(Boolean(errors.message))} min-h-28 resize-y`}
              aria-invalid={Boolean(errors.message)}
            />
          </Field>

          <Field
            label={copy.precautionsLabel}
            error={errors.precautions}
            className="sm:col-span-2"
          >
            <div className="space-y-2.5">
              {values.precautions.map((precaution, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="mt-3 w-5 shrink-0 text-center text-xs font-bold text-slate-400">
                    {index + 1}.
                  </span>
                  <textarea
                    value={precaution}
                    onChange={(event) => updatePrecaution(index, event.target.value)}
                    placeholder={copy.precautionPlaceholder}
                    className={`${inputClass(Boolean(errors.precautions))} min-h-20 flex-1 resize-y`}
                  />
                  <button
                    type="button"
                    onClick={() => removePrecaution(index)}
                    className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700"
                    aria-label={language === "en" ? "Remove directive" : "Alisin ang tagubilin"}
                    title={language === "en" ? "Remove directive" : "Alisin ang tagubilin"}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addPrecaution}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.addPrecaution}
              </button>
            </div>
          </Field>
        </div>
      </div>

      {localSuccess && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{copy.localSuccess}</span>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            {copy.cancel}
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-11 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? copy.saving : copy.save}
        </button>
      </div>
    </form>
  );
};

interface FieldProps {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, error, className = "", children }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-xs font-bold text-slate-800">{label}</span>
    {children}
    {error && (
      <span className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-700">
        <AlertCircle className="h-3 w-3" aria-hidden="true" />
        {error}
      </span>
    )}
  </label>
);

const inputClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/20 ${
    hasError
      ? "border-red-300 focus:border-red-500"
      : "border-slate-200 focus:border-blue-500"
  }`;
