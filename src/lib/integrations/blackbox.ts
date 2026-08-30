/**
 * BLACKBOX handoff — instantiate a claim from an accepted intake.
 *
 * Expected BLACKBOX contract (not yet shipped in blackbox; reserved at
 * /api/claims/intake): POST JSON matching fnolIntakeSchema, return
 * { id, claimNumber }. Documents follow via POST /api/upload.
 */

export type BlackboxClaimPayload = {
  claimants: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    mailingAddress: string;
    preferredContactMethod: "EMAIL" | "PHONE" | "TEXT";
    isPrimaryContact: boolean;
  }>;
  property: {
    propertyAddress: string;
    zipCode: string;
    county: string;
    lossType: "WIND" | "FIRE" | "WATER" | "HAIL" | "VANDALISM" | "OTHER";
    dateOfLoss: string;
    lossDescription: string;
    isCatClaim: boolean;
  };
  policy: {
    policyNumber: string | null;
    carrierName: string | null;
    insurerClaimNumber: string | null;
  };
  source: {
    product: "BLACKGATE";
    intakeNumber: string;
    intakeId: string;
  };
};

export type BlackboxResult =
  | { ok: true; dryRun: boolean; id: string; claimNumber: string }
  | { ok: false; error: string };

export function mapLossTypeForBlackbox(
  lossType: string | null | undefined
): BlackboxClaimPayload["property"]["lossType"] {
  if (
    lossType === "WIND" ||
    lossType === "FIRE" ||
    lossType === "WATER" ||
    lossType === "HAIL" ||
    lossType === "VANDALISM"
  ) {
    return lossType;
  }
  return "OTHER";
}

export async function createBlackboxClaim(
  payload: BlackboxClaimPayload
): Promise<BlackboxResult> {
  const dryRun = process.env.BLACKBOX_DRY_RUN === "1" || !process.env.BLACKBOX_API_KEY;
  if (dryRun) {
    const yy = String(new Date().getFullYear()).slice(-2);
    const stamp = String(Date.now()).slice(-4);
    return {
      ok: true,
      dryRun: true,
      id: `dry-${payload.source.intakeId}`,
      claimNumber: `BL-${yy}-${stamp}`,
    };
  }

  const base = process.env.BLACKBOX_API_URL?.replace(/\/$/, "");
  if (!base) {
    return { ok: false, error: "BLACKBOX_API_URL is not configured." };
  }

  try {
    const res = await fetch(`${base}/api/claims/intake`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BLACKBOX_API_KEY}`,
        "X-Blackgate-Intake": payload.source.intakeNumber,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `BLACKBOX ${res.status}: ${text.slice(0, 240)}` };
    }
    const data = (await res.json()) as { id?: string; claimNumber?: string };
    if (!data.id || !data.claimNumber) {
      return { ok: false, error: "BLACKBOX response missing id or claimNumber." };
    }
    return { ok: true, dryRun: false, id: data.id, claimNumber: data.claimNumber };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "BLACKBOX request failed.",
    };
  }
}

export async function attachDocumentToBlackboxClaim(opts: {
  claimId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (process.env.BLACKBOX_DRY_RUN === "1" || !process.env.BLACKBOX_API_KEY) {
    return { ok: true };
  }
  const base = process.env.BLACKBOX_API_URL?.replace(/\/$/, "");
  if (!base) return { ok: false, error: "BLACKBOX_API_URL is not configured." };

  try {
    const res = await fetch(`${base}/api/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BLACKBOX_API_KEY}`,
      },
      body: JSON.stringify({
        claimId: opts.claimId,
        fileName: opts.fileName,
        fileUrl: opts.fileUrl,
        mimeType: opts.mimeType,
        docType: "OTHER",
        source: "BLACKGATE",
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `Upload failed (${res.status})` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed.",
    };
  }
}
