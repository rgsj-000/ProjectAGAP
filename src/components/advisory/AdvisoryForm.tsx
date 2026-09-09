"use client";

import React, { FormEvent, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { getHelpContent, type HelpContentDefinition } from "@/lib/help-content";
import { AlertCircle, FileText, Image as ImageIcon, Plus, ShieldCheck, Trash2, UploadCloud } from "lucide-react";

export interface AdvisoryFormValues {
  title: string;
  source: string;
  status: "ACTIVE" | "MONITORING" | "ENDED";
  issuedTime: string;
  bulletinNumber: string;
  validity: string;
  affectedLocations: string;
  warningInformation: string;
  sourceUrl: string;
  verificationState: "UNVERIFIED" | "FOR_REVIEW" | "VERIFIED";
  message: string;
  precautions: string[];
}

interface AdvisoryFormProps {
  initialValues?: Partial<AdvisoryFormValues>;
  onCancel?: () => void;
  onSave?: (values: AdvisoryFormValues, sourceFile: File | null) => void | Promise<void>;
  onFileChange?: (file: File | null) => void;
}

const DEFAULT_VALUES: AdvisoryFormValues = {
  title: "",
  source: "PAGASA • DOST",
  status: "ACTIVE",
  issuedTime: "",
  bulletinNumber: "",
  validity: "",
  affectedLocations: "",
  warningInformation: "",
  sourceUrl: "",
  verificationState: "UNVERIFIED",
  message: "",
  precautions: [""],
};

const MAX_ADVISORY_FILE_BYTES = 6 * 1024 * 1024;
const ADVISORY_FILE_ACCEPT =
  ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";

const ALLOWED_ADVISORY_FILES = new Map([
  ["pdf", "application/pdf"],
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
]);

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${kilobytes.toFixed(kilobytes >= 100 ? 0 : 1)} KB`;
  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(megabytes >= 10 ? 1 : 2)} MB`;
};

const getFileExtension = (name: string) =>
  name.includes(".") ? name.split(".").pop()?.toLowerCase() ?? "" : "";

const toDateTimeLocalValue = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const AdvisoryForm: React.FC<AdvisoryFormProps> = ({
  initialValues,
  onCancel,
  onSave,
  onFileChange,
}) => {
  const { language } = useLanguage();
  const [values, setValues] = useState<AdvisoryFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
    issuedTime: toDateTimeLocalValue(initialValues?.issuedTime),
    validity: toDateTimeLocalValue(initialValues?.validity),
    precautions:
      initialValues?.precautions && initialValues.precautions.length > 0
        ? initialValues.precautions
        : DEFAULT_VALUES.precautions,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [localSuccess, setLocalSuccess] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copy = useMemo(
    () =>
      language === "en"
        ? {
            eyebrow: "Official advisory input",
            title: "Create or Update Advisory",
            description:
              "Record only verified information issued by PAGASA, DOST, Lucena CDRRMO, or another authorized source.",
            verificationTitle: "Before saving",
            verificationBody:
              "Use only official source information. Check the source, reference, time, validity, affected locations, and verification status.",
            titleLabel: "Advisory title",
            titlePlaceholder: "e.g. Severe Rainfall Advisory",
            sourceLabel: "Issuing source",
            sourcePlaceholder: "e.g. PAGASA • DOST",
            statusLabel: "Advisory status",
            issuedLabel: "Issued / updated time",
            issuedPlaceholder: "e.g. Updated 11:00 AM Today",
            bulletinLabel: "Bulletin / reference number",
            bulletinPlaceholder: "e.g. Bulletin #4",
            validityLabel: "Validity / effective period",
            validityPlaceholder: "e.g. Valid until 2:00 PM, 9 Sep 2026",
            affectedLocationsLabel: "Affected locations",
            affectedLocationsPlaceholder:
              "Enter only locations explicitly identified by the issuing source.",
            warningInformationLabel: "Warning information",
            warningInformationPlaceholder:
              "Enter the warning level, classification, rainfall range, wind signal, or other source-issued warning information.",
            sourceUrlLabel: "Official source link",
            sourceUrlPlaceholder: "https://...",
            verificationStateLabel: "Verification status",
            verificationStateHelp:
              "Verification status is confirmed through the authorized LGU review process.",
            messageLabel: "Main advisory message",
            messagePlaceholder: "Enter the verified advisory summary...",
            precautionsLabel: "Key directives / precautions",
            precautionPlaceholder: "Enter one verified directive or precaution",
            addPrecaution: "Add directive",
            cancel: "Cancel",
            save: "Save advisory",
            saving: "Saving...",
            localSuccess:
              "Advisory information is ready for authorized review. It is not treated as verified until the required review is completed.",
            required: "This field is required.",
            invalidDateRange: "Validity must be after the issued / updated time.",
            invalidUrl: "Enter a valid http:// or https:// source link.",
            precautionRequired: "Add at least one directive or precaution.",
            fileLabel: "Official advisory file",
            fileDescription:
              "Attach the official bulletin or advisory used as the source record.",
            fileFormats: "PDF, PNG, JPG, or JPEG • Maximum 6 MB • One file",
            chooseFile: "Choose file",
            dropFile: "Drop the file here",
            replaceFile: "Replace file",
            removeFile: "Remove file",
            fileReady: "Ready to upload when the advisory is saved",
            fileTooLarge: "File is larger than the 6 MB limit.",
            fileTypeInvalid: "Use a PDF, PNG, JPG, or JPEG file.",
          }
        : {
            eyebrow: "Official advisory input",
            title: "Gumawa o Mag-update ng Babala",
            description:
              "Itala lamang ang beripikadong impormasyong inilabas ng PAGASA, DOST, Lucena CDRRMO, o ibang awtorisadong ahensya.",
            verificationTitle: "Bago i-save",
            verificationBody:
              "Gamitin lamang ang official source information. Suriin ang source, reference, oras, validity, affected locations, at verification status.",
            titleLabel: "Pamagat ng babala",
            titlePlaceholder: "hal. Babala sa Malakas na Ulan",
            sourceLabel: "Ahensyang naglabas",
            sourcePlaceholder: "hal. PAGASA • DOST",
            statusLabel: "Advisory status",
            issuedLabel: "Oras ng paglabas / update",
            issuedPlaceholder: "hal. Na-update 11:00 AM Ngayon",
            bulletinLabel: "Bulletin / reference number",
            bulletinPlaceholder: "hal. Bulletin #4",
            validityLabel: "Validity / panahon ng bisa",
            validityPlaceholder: "hal. May bisa hanggang 2:00 PM, 9 Sep 2026",
            affectedLocationsLabel: "Mga apektadong lugar",
            affectedLocationsPlaceholder:
              "Ilagay lamang ang mga lugar na tahasang tinukoy ng ahensyang naglabas.",
            warningInformationLabel: "Impormasyon ng warning",
            warningInformationPlaceholder:
              "Ilagay ang warning level, classification, rainfall range, wind signal, o iba pang impormasyong inilabas ng source.",
            sourceUrlLabel: "Opisyal na source link",
            sourceUrlPlaceholder: "https://...",
            verificationStateLabel: "Verification status",
            verificationStateHelp:
              "Ang verification status ay kinukumpirma sa authorized LGU review process.",
            messageLabel: "Pangunahing mensahe",
            messagePlaceholder: "Ilagay ang beripikadong buod ng babala...",
            precautionsLabel: "Mga pangunahing tagubilin / pag-iingat",
            precautionPlaceholder: "Maglagay ng isang beripikadong tagubilin",
            addPrecaution: "Magdagdag ng tagubilin",
            cancel: "Kanselahin",
            save: "I-save ang babala",
            saving: "Sine-save...",
            localSuccess:
              "Handa na ang advisory information para sa authorized review. Hindi ito itinuturing na verified hangga't hindi tapos ang required review.",
            required: "Kinakailangan ang field na ito.",
            invalidDateRange: "Dapat ay mas huli ang validity kaysa sa oras ng paglabas / update.",
            invalidUrl: "Maglagay ng valid na http:// o https:// source link.",
            precautionRequired: "Magdagdag ng kahit isang tagubilin o pag-iingat.",
            fileLabel: "Official advisory file",
            fileDescription:
              "I-attach ang official bulletin o advisory na ginamit bilang source record.",
            fileFormats: "PDF, PNG, JPG, o JPEG • Maximum 6 MB • Isang file",
            chooseFile: "Pumili ng file",
            dropFile: "I-drop ang file dito",
            replaceFile: "Palitan ang file",
            removeFile: "Alisin ang file",
            fileReady: "Handa nang i-upload kapag sine-save ang advisory",
            fileTooLarge: "Lumampas ang file sa 6 MB limit.",
            fileTypeInvalid: "Gumamit ng PDF, PNG, JPG, o JPEG file.",
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

  const clearSourceFile = () => {
    setSourceFile(null);
    setFileError("");
    setLocalSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileChange?.(null);
  };

  const selectSourceFile = (file: File | null) => {
    if (!file) return;

    const extension = getFileExtension(file.name);
    const expectedMime = ALLOWED_ADVISORY_FILES.get(extension);
    const mimeMatches =
      Boolean(expectedMime) && (file.type === expectedMime || file.type === "");

    if (!expectedMime || !mimeMatches) {
      setSourceFile(null);
      setFileError(copy.fileTypeInvalid);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onFileChange?.(null);
      return;
    }

    if (file.size > MAX_ADVISORY_FILE_BYTES) {
      setSourceFile(null);
      setFileError(copy.fileTooLarge);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onFileChange?.(null);
      return;
    }

    setSourceFile(file);
    setFileError("");
    setLocalSuccess(false);
    onFileChange?.(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    selectSourceFile(event.target.files?.[0] ?? null);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    selectSourceFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleFileDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDraggingFile) setIsDraggingFile(true);
  };

  const handleFileDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setIsDraggingFile(false);
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
    if (!values.validity.trim()) nextErrors.validity = copy.required;
    if (values.issuedTime && values.validity) {
      const issuedTime = new Date(values.issuedTime);
      const validity = new Date(values.validity);
      if (
        Number.isNaN(issuedTime.valueOf()) ||
        Number.isNaN(validity.valueOf()) ||
        validity <= issuedTime
      ) {
        nextErrors.validity = copy.invalidDateRange;
      }
    }
    if (!values.affectedLocations.trim()) nextErrors.affectedLocations = copy.required;
    if (!values.warningInformation.trim()) nextErrors.warningInformation = copy.required;
    if (!values.sourceUrl.trim()) {
      nextErrors.sourceUrl = copy.required;
    } else {
      try {
        const parsedUrl = new URL(values.sourceUrl.trim());
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          nextErrors.sourceUrl = copy.invalidUrl;
        }
      } catch {
        nextErrors.sourceUrl = copy.invalidUrl;
      }
    }
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
      validity: values.validity.trim(),
      affectedLocations: values.affectedLocations.trim(),
      warningInformation: values.warningInformation.trim(),
      sourceUrl: values.sourceUrl.trim(),
      message: values.message.trim(),
      precautions: values.precautions.map((item) => item.trim()).filter(Boolean),
    };

    setErrors({});
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(sanitized, sourceFile);
      } else {
        setLocalSuccess(true);
      }
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : "Unable to save advisory. Try again." });
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
        <div className="mb-5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800">{copy.fileLabel}</span>
            <HelpTooltip
              content={{
                title: copy.fileLabel,
                description: copy.fileDescription,
              }}
              align="left"
            />
          </div>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">{copy.fileFormats}</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ADVISORY_FILE_ACCEPT}
          onChange={handleFileInputChange}
          className="sr-only"
          aria-label={copy.fileLabel}
        />

        {!sourceFile ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDrop={handleFileDrop}
            onDragOver={handleFileDragOver}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={handleFileDragLeave}
            className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-6 text-center outline-none transition-colors focus:ring-2 focus:ring-blue-600/20 ${
              isDraggingFile
                ? "border-blue-400 bg-blue-50/70"
                : fileError
                  ? "border-red-300 bg-red-50/40"
                  : "border-slate-300 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40"
            }`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-700 shadow-sm">
              <UploadCloud className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              {isDraggingFile ? copy.dropFile : copy.chooseFile}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              {copy.fileDescription}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/45 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700">
                  {sourceFile.type.startsWith("image/") ? (
                    <ImageIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {sourceFile.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {formatFileSize(sourceFile.size)} • {copy.fileReady}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {copy.replaceFile}
                </button>
                <button
                  type="button"
                  onClick={clearSourceFile}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-semibold text-red-700 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.removeFile}
                </button>
              </div>
            </div>
          </div>
        )}

        {fileError ? (
          <p
            role="alert"
            className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-red-700"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {fileError}
          </p>
        ) : null}
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

          <Field
            label={copy.sourceLabel}
            error={errors.source}
            helpContent={getHelpContent("advisoryIssuingSource", language)}
          >
            <input
              value={values.source}
              onChange={(event) => updateField("source", event.target.value)}
              placeholder={copy.sourcePlaceholder}
              className={inputClass(Boolean(errors.source))}
              aria-invalid={Boolean(errors.source)}
            />
          </Field>

          <Field
            label={copy.statusLabel}
            helpContent={getHelpContent("advisoryStatus", language)}
            helpAlign="right"
          >
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

          <Field
            label={copy.issuedLabel}
            error={errors.issuedTime}
            helpContent={getHelpContent("advisoryIssuedTime", language)}
          >
            <input
              type="datetime-local"
              step="60"
              value={values.issuedTime}
              onChange={(event) => updateField("issuedTime", event.target.value)}
              className={inputClass(Boolean(errors.issuedTime))}
              aria-invalid={Boolean(errors.issuedTime)}
            />
          </Field>

          <Field
            label={copy.bulletinLabel}
            error={errors.bulletinNumber}
            helpContent={getHelpContent("advisoryBulletinReference", language)}
            helpAlign="right"
          >
            <input
              value={values.bulletinNumber}
              onChange={(event) => updateField("bulletinNumber", event.target.value)}
              placeholder={copy.bulletinPlaceholder}
              className={inputClass(Boolean(errors.bulletinNumber))}
              aria-invalid={Boolean(errors.bulletinNumber)}
            />
          </Field>

          <Field
            label={copy.validityLabel}
            error={errors.validity}
            helpContent={getHelpContent("advisoryValidUntil", language)}
          >
            <input
              type="datetime-local"
              step="60"
              value={values.validity}
              onChange={(event) => updateField("validity", event.target.value)}
              className={inputClass(Boolean(errors.validity))}
              aria-invalid={Boolean(errors.validity)}
            />
          </Field>

          <Field
            label={copy.verificationStateLabel}
            helpContent={getHelpContent("advisoryVerificationStatus", language)}
            helpAlign="right"
          >
            <select
              value={values.verificationState}
              onChange={(event) =>
                updateField(
                  "verificationState",
                  event.target.value as AdvisoryFormValues["verificationState"]
                )
              }
              className={inputClass(false)}
            >
              <option value="UNVERIFIED">Unverified</option>
              <option value="FOR_REVIEW">For Review</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </Field>

          <Field
            label={copy.affectedLocationsLabel}
            error={errors.affectedLocations}
            className="sm:col-span-2"
            helpContent={getHelpContent("advisoryAffectedLocations", language)}
          >
            <textarea
              value={values.affectedLocations}
              onChange={(event) => updateField("affectedLocations", event.target.value)}
              placeholder={copy.affectedLocationsPlaceholder}
              className={`${inputClass(Boolean(errors.affectedLocations))} min-h-24 resize-y`}
              aria-invalid={Boolean(errors.affectedLocations)}
            />
          </Field>

          <Field
            label={copy.warningInformationLabel}
            error={errors.warningInformation}
            className="sm:col-span-2"
            helpContent={getHelpContent("advisoryWarningInformation", language)}
          >
            <textarea
              value={values.warningInformation}
              onChange={(event) => updateField("warningInformation", event.target.value)}
              placeholder={copy.warningInformationPlaceholder}
              className={`${inputClass(Boolean(errors.warningInformation))} min-h-24 resize-y`}
              aria-invalid={Boolean(errors.warningInformation)}
            />
          </Field>

          <Field
            label={copy.sourceUrlLabel}
            error={errors.sourceUrl}
            className="sm:col-span-2"
            helpContent={getHelpContent("advisorySourceLink", language)}
          >
            <input
              type="url"
              inputMode="url"
              value={values.sourceUrl}
              onChange={(event) => updateField("sourceUrl", event.target.value)}
              placeholder={copy.sourceUrlPlaceholder}
              className={inputClass(Boolean(errors.sourceUrl))}
              aria-invalid={Boolean(errors.sourceUrl)}
            />
          </Field>

          <Field
            label={copy.messageLabel}
            error={errors.message}
            className="sm:col-span-2"
            helpContent={getHelpContent("advisoryMainMessage", language)}
          >
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
            helpContent={getHelpContent("advisoryDirectives", language)}
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

      {errors.submit && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errors.submit}</p>}
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
  helpContent?: HelpContentDefinition;
  helpAlign?: "left" | "center" | "right";
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({
  label,
  error,
  className = "",
  helpContent,
  helpAlign = "left",
  children,
}) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
      <span>{label}</span>
      {helpContent ? (
        <HelpTooltip content={helpContent} align={helpAlign} />
      ) : null}
    </span>
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
