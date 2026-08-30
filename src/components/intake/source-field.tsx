import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";

export type SourceOption = {
  slug: string;
  label: string;
  isReferral: boolean;
};

type Props = {
  sources: SourceOption[];
  value: string;
  onChange: (slug: string) => void;
  detail?: string;
  onDetailChange?: (value: string) => void;
  locked?: boolean;
  required?: boolean;
  id?: string;
};

export function SourceField({
  sources,
  value,
  onChange,
  detail,
  onDetailChange,
  locked,
  required = true,
  id = "sourceSlug",
}: Props) {
  const selected = sources.find((s) => s.slug === value);

  return (
    <div className="space-y-3 border border-brand-amber/30 bg-brand-amber/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-brand-amber">
          How did you hear about us?
        </Label>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-brand-amber">
          Required
        </span>
      </div>
      <p className="text-xs leading-relaxed text-brand-white/70">
        Every intake needs a source — referral link, phone call, walk-in, ad,
        or word of mouth. We never assume the link is the only entry point.
      </p>
      <NativeSelect
        id={id}
        name="sourceSlug"
        required={required}
        value={value}
        disabled={locked}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select a source</option>
        {sources.map((source) => (
          <option key={source.slug} value={source.slug}>
            {source.label}
          </option>
        ))}
      </NativeSelect>
      {selected?.isReferral || value === "marketing_campaign" || value === "other" ? (
        <div className="space-y-2">
          <Label htmlFor={`${id}-detail`}>
            {value === "marketing_campaign"
              ? "Campaign name"
              : selected?.isReferral
                ? "Referring person or office"
                : "More detail"}
          </Label>
          <Input
            id={`${id}-detail`}
            name="sourceDetail"
            value={detail ?? ""}
            onChange={(e) => onDetailChange?.(e.target.value)}
            placeholder={
              value === "marketing_campaign"
                ? "e.g. Storm season 2026 — Facebook"
                : "Name, firm, or other detail"
            }
          />
        </div>
      ) : null}
    </div>
  );
}
