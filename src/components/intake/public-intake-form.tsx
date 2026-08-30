"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClaimType } from "@/lib/types";
import { ENGAGEMENT_DISCLOSURE, UPL_NOTICE, CLAIM_TYPE_LABELS } from "@/lib/constants";
import { formSchemaFor } from "@/lib/forms/schemas";
import type { FormField } from "@/lib/forms/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/ui/error-banner";
import { SourceField, type SourceOption } from "@/components/intake/source-field";

type Props = {
  sources: SourceOption[];
  presetSource?: string;
  lockSource?: boolean;
  partnerCode?: string;
  embed?: boolean;
};

type Values = Record<string, string>;

const STEPS = ["Source", "Type", "Details", "Documents", "Disclosure"] as const;

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "textarea") {
    return (
      <Textarea
        id={field.id}
        name={field.id}
        required={field.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (field.type === "select") {
    return (
      <NativeSelect
        id={field.id}
        name={field.id}
        required={field.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </NativeSelect>
    );
  }
  return (
    <Input
      id={field.id}
      name={field.id}
      type={field.type}
      required={field.required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function PublicIntakeForm({
  sources,
  presetSource = "",
  lockSource,
  partnerCode,
  embed,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sourceSlug, setSourceSlug] = useState(presetSource);
  const [sourceDetail, setSourceDetail] = useState("");
  const [claimType, setClaimType] = useState<ClaimType | "">("");
  const [values, setValues] = useState<Values>({
    preferredContactMethod: "PHONE",
  });
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [disclosureName, setDisclosureName] = useState("");

  const schema = useMemo(
    () => (claimType ? formSchemaFor(claimType) : null),
    [claimType]
  );

  function setField(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  function validateStep(): string | null {
    if (step === 0 && !sourceSlug) return "Select how you heard about us.";
    if (step === 1 && !claimType) return "Select a claim type.";
    if (step === 2 && schema) {
      for (const section of schema.sections) {
        for (const field of section.fields) {
          if (field.required && !values[field.id]?.trim()) {
            return `${field.label} is required.`;
          }
        }
      }
    }
    if (step === 4) {
      if (!disclosureAccepted) return "Please acknowledge the intake disclosure.";
      if (disclosureName.trim().length < 2) return "Type your full name to sign.";
    }
    return null;
  }

  function next() {
    const msg = validateStep();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    const msg = validateStep();
    if (msg) {
      setError(msg);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const body = new FormData();
      body.set("sourceSlug", sourceSlug);
      body.set("sourceDetail", sourceDetail);
      body.set("claimType", claimType);
      body.set("disclosureAccepted", "true");
      body.set("disclosureName", disclosureName);
      if (partnerCode) body.set("partnerCode", partnerCode);
      for (const [key, value] of Object.entries(values)) {
        if (value) body.set(key, value);
      }
      for (const [key, file] of Object.entries(files)) {
        if (file) body.set(`file_${key}`, file);
      }

      const res = await fetch("/api/intake", { method: "POST", body });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        intakeNumber?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Submission failed.");
        setSubmitting(false);
        return;
      }
      const thanks = embed
        ? `/intake/thanks?n=${data.intakeNumber}&embed=1`
        : `/intake/thanks?n=${data.intakeNumber}`;
      router.push(thanks);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className={embed ? "space-y-6" : "space-y-8"}>
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] ${
              i === step
                ? "border-brand-amber text-brand-amber"
                : i < step
                  ? "border-brand-gold/40 text-brand-gold"
                  : "border-brand-white/10 text-brand-slate"
            }`}
          >
            {i + 1} · {label}
          </li>
        ))}
      </ol>

      {error ? (
        <ErrorBanner message={error} onDismiss={() => setError("")} />
      ) : null}

      {step === 0 ? (
        <SourceField
          sources={sources}
          value={sourceSlug}
          onChange={setSourceSlug}
          detail={sourceDetail}
          onDetailChange={setSourceDetail}
          locked={lockSource && Boolean(presetSource)}
        />
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <p className="eyebrow">What kind of matter is this?</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(CLAIM_TYPE_LABELS) as ClaimType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setClaimType(type)}
                className={`border px-4 py-5 text-left transition-colors ${
                  claimType === type
                    ? "border-brand-gold bg-brand-gold/10"
                    : "border-brand-white/10 hover:border-brand-gold/40"
                }`}
              >
                <p className="font-serif text-lg text-brand-gold">
                  {CLAIM_TYPE_LABELS[type]}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-brand-white/70">
                  {type === "PROPERTY"
                    ? "Home, condo, or commercial property damage."
                    : type === "PIP"
                      ? "Florida no-fault / personal injury protection."
                      : "A claim the carrier already denied or underpaid."}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 && schema ? (
        <div className="space-y-8">
          {schema.sections.map((section) => (
            <section key={section.id} className="space-y-4">
              <div>
                <h2 className="font-serif text-xl text-brand-gold">{section.title}</h2>
                {section.description ? (
                  <p className="mt-1 text-sm text-brand-white/70">{section.description}</p>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div
                    key={field.id}
                    className={
                      field.type === "textarea" ? "space-y-2 sm:col-span-2" : "space-y-2"
                    }
                  >
                    <Label htmlFor={field.id}>
                      {field.label}
                      {field.required ? " *" : ""}
                    </Label>
                    <FieldControl
                      field={field}
                      value={values[field.id] ?? ""}
                      onChange={(v) => setField(field.id, v)}
                    />
                    {field.help ? (
                      <p className="text-xs text-brand-slate">{field.help}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-xl text-brand-gold">Documents you already have</h2>
            <p className="mt-1 text-sm text-brand-white/70">
              Optional. Upload what you have now. Missing items stay on the
              intake checklist — staff can collect them later, or flag a
              BLACKMIRROR field visit for photos.
            </p>
          </div>
          {[
            { key: "photo_id", label: "Photo ID" },
            { key: "declarations_page", label: "Declarations page / proof of coverage" },
            { key: "carrier_correspondence", label: "Denial, ROR, or other carrier letter" },
            { key: "damage_photos", label: "Photos or video of damage" },
            { key: "proof_of_ownership", label: "Deed, title, or lease" },
          ].map((item) => (
            <div key={item.key} className="space-y-2">
              <Label htmlFor={item.key}>{item.label}</Label>
              <Input
                id={item.key}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  setFiles((prev) => ({
                    ...prev,
                    [item.key]: e.target.files?.[0] ?? null,
                  }))
                }
              />
            </div>
          ))}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-5">
          <div className="panel p-4 text-sm leading-relaxed text-brand-white/80">
            <p className="eyebrow mb-3">Important notice</p>
            <p>{UPL_NOTICE}</p>
          </div>
          <label className="flex items-start gap-3 text-sm text-brand-white/85">
            <input
              type="checkbox"
              className="mt-1 accent-[#C6A85B]"
              checked={disclosureAccepted}
              onChange={(e) => setDisclosureAccepted(e.target.checked)}
            />
            <span>{ENGAGEMENT_DISCLOSURE}</span>
          </label>
          <div className="space-y-2">
            <Label htmlFor="disclosureName">Type your full name to acknowledge</Label>
            <Input
              id="disclosureName"
              value={disclosureName}
              onChange={(e) => setDisclosureName(e.target.value)}
              autoComplete="name"
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setError("");
            setStep((s) => Math.max(0, s - 1));
          }}
          disabled={step === 0 || submitting}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" variant="amber" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button type="button" variant="solid" onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit intake"}
          </Button>
        )}
      </div>
    </div>
  );
}
