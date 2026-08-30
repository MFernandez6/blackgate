"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClaimType } from "@/lib/types";
import { createStaffIntakeAction } from "@/lib/actions/intake";
import { CLAIM_TYPE_LABELS, ENGAGEMENT_DISCLOSURE, LOSS_TYPE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/ui/error-banner";
import { SourceField, type SourceOption } from "@/components/intake/source-field";

type Props = {
  sources: SourceOption[];
};

export function StaffIntakeForm({ sources }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sourceSlug, setSourceSlug] = useState("direct_phone");
  const [sourceDetail, setSourceDetail] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>("PROPERTY");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const result = await createStaffIntakeAction({
      ...raw,
      sourceSlug,
      sourceDetail,
      claimType,
      disclosureAccepted: fd.get("disclosureAccepted") === "on",
    });
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    router.push(`/intakes/${result.data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error ? <ErrorBanner message={error} onDismiss={() => setError("")} /> : null}

      <SourceField
        sources={sources}
        value={sourceSlug}
        onChange={setSourceSlug}
        detail={sourceDetail}
        onDetailChange={setSourceDetail}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="claimType">Claim type</Label>
          <NativeSelect
            id="claimType"
            name="claimType"
            value={claimType}
            onChange={(e) => setClaimType(e.target.value as ClaimType)}
          >
            {(Object.keys(CLAIM_TYPE_LABELS) as ClaimType[]).map((type) => (
              <option key={type} value={type}>
                {CLAIM_TYPE_LABELS[type]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredContactMethod">Preferred contact</Label>
          <NativeSelect id="preferredContactMethod" name="preferredContactMethod" defaultValue="PHONE">
            <option value="PHONE">Phone</option>
            <option value="EMAIL">Email</option>
            <option value="TEXT">Text</option>
          </NativeSelect>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="mailingAddress">Mailing address</Label>
          <Input id="mailingAddress" name="mailingAddress" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="propertyAddress">Property / risk address</Label>
          <Input id="propertyAddress" name="propertyAddress" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP</Label>
          <Input id="zipCode" name="zipCode" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="county">County</Label>
          <Input id="county" name="county" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="occupancy">Occupancy</Label>
          <NativeSelect id="occupancy" name="occupancy" defaultValue="">
            <option value="">Unknown</option>
            <option value="OWNER">Owner</option>
            <option value="RENTER">Renter / tenant</option>
            <option value="OTHER">Other</option>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfLoss">Date of loss</Label>
          <Input id="dateOfLoss" name="dateOfLoss" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lossType">Loss type</Label>
          <NativeSelect id="lossType" name="lossType" defaultValue="">
            <option value="">Unknown</option>
            {(Object.keys(LOSS_TYPE_LABELS) as Array<keyof typeof LOSS_TYPE_LABELS>).map(
              (key) => (
                <option key={key} value={key}>
                  {LOSS_TYPE_LABELS[key]}
                </option>
              )
            )}
          </NativeSelect>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="lossDescription">What happened</Label>
          <Textarea id="lossDescription" name="lossDescription" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="carrierName">Carrier</Label>
          <Input id="carrierName" name="carrierName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="policyNumber">Policy number</Label>
          <Input id="policyNumber" name="policyNumber" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="insurerClaimNumber">Carrier claim number</Label>
          <Input id="insurerClaimNumber" name="insurerClaimNumber" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mortgageeName">Mortgage / lienholder</Label>
          <Input id="mortgageeName" name="mortgageeName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="referringContact">Referring contact</Label>
          <Input id="referringContact" name="referringContact" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feeTerms">Referral fee terms</Label>
          <Input id="feeTerms" name="feeTerms" placeholder="e.g. 10% of PA fee — BLACKLEDGER" />
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm text-brand-white/80">
        <input type="checkbox" name="disclosureAccepted" className="mt-1 accent-[#C6A85B]" required />
        <span>
          Claimant acknowledged the intake disclosure (read aloud if this is a
          phone or walk-in). {ENGAGEMENT_DISCLOSURE}
        </span>
      </label>
      <div className="space-y-2">
        <Label htmlFor="disclosureName">Acknowledged by (claimant name)</Label>
        <Input id="disclosureName" name="disclosureName" required />
      </div>

      <Button type="submit" variant="solid" disabled={submitting}>
        {submitting ? "Opening file…" : "Open intake"}
      </Button>
    </form>
  );
}
