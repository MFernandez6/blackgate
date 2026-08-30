/**
 * BLACKLEDGER tag — fee-sharing calculations for attorney / partner referrals.
 * BLACKGATE only flags the relationship; ledger math lives in BLACKLEDGER.
 */

export type LedgerTag = {
  intakeNumber: string;
  claimNumber?: string | null;
  partnerName?: string | null;
  referringContact?: string | null;
  feeTerms?: string | null;
  feePercent?: number | null;
};

export async function tagReferralForLedger(
  tag: LedgerTag
): Promise<{ ok: boolean; dryRun: boolean; error?: string }> {
  if (!process.env.BLACKLEDGER_API_URL || !process.env.BLACKLEDGER_API_KEY) {
    return { ok: true, dryRun: true };
  }

  try {
    const res = await fetch(
      `${process.env.BLACKLEDGER_API_URL.replace(/\/$/, "")}/api/referral-tags`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BLACKLEDGER_API_KEY}`,
        },
        body: JSON.stringify(tag),
      }
    );
    if (!res.ok) {
      return { ok: false, dryRun: false, error: `BLACKLEDGER ${res.status}` };
    }
    return { ok: true, dryRun: false };
  } catch (err) {
    return {
      ok: false,
      dryRun: false,
      error: err instanceof Error ? err.message : "BLACKLEDGER request failed.",
    };
  }
}
