"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordTriageAction } from "@/lib/actions/triage";
import { promoteIntakeAction } from "@/lib/actions/promote";
import { REASON_CODES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/ui/error-banner";
import { toast } from "sonner";

export function TriagePanel({
  intakeId,
  status,
  canTriage,
  canPromote,
  checklistComplete,
}: {
  intakeId: string;
  status: string;
  canTriage: boolean;
  canPromote: boolean;
  checklistComplete: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(outcome: "ACCEPTED" | "DECLINED" | "NEEDS_INFO", form: FormData) {
    setBusy(true);
    setError("");
    const result = await recordTriageAction({
      intakeId,
      outcome,
      reasonCode: String(form.get("reasonCode") ?? ""),
      reasonNote: String(form.get("reasonNote") ?? ""),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(`Gate ${outcome === "ACCEPTED" ? "closed — accepted" : outcome === "DECLINED" ? "closed — declined" : "held — needs info"}`);
    router.refresh();
  }

  async function promote() {
    setBusy(true);
    setError("");
    const result = await promoteIntakeAction(intakeId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(
      result.data.dryRun
        ? `Dry-run promote · ${result.data.claimNumber}`
        : `Promoted to BLACKBOX · ${result.data.claimNumber}`
    );
    router.refresh();
  }

  return (
    <div className="panel space-y-4 p-5">
      <p className="eyebrow">Gatekeeper decision</p>
      {error ? <ErrorBanner message={error} onDismiss={() => setError("")} /> : null}

      {canTriage && status !== "PROMOTED" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="space-y-2">
            <Label htmlFor="reasonCode">Reason code</Label>
            <NativeSelect id="reasonCode" name="reasonCode" required>
              <option value="">Select</option>
              {REASON_CODES.map((code) => (
                <option key={code.value} value={code.value}>
                  {code.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reasonNote">Note</Label>
            <Textarea id="reasonNote" name="reasonNote" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="solid"
              disabled={busy}
              onClick={(e) => {
                const form = (e.currentTarget.closest("form") as HTMLFormElement) ?? undefined;
                if (form) void decide("ACCEPTED", new FormData(form));
              }}
            >
              Accept
            </Button>
            <Button
              type="button"
              variant="amber"
              disabled={busy}
              onClick={(e) => {
                const form = (e.currentTarget.closest("form") as HTMLFormElement) ?? undefined;
                if (form) void decide("NEEDS_INFO", new FormData(form));
              }}
            >
              Needs info
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={(e) => {
                const form = (e.currentTarget.closest("form") as HTMLFormElement) ?? undefined;
                if (form) void decide("DECLINED", new FormData(form));
              }}
            >
              Decline
            </Button>
          </div>
        </form>
      ) : null}

      {canPromote && status === "ACCEPTED" ? (
        <div className="space-y-3 border-t border-brand-white/10 pt-4">
          <p className="text-sm text-brand-white/75">
            One-click promote creates the BLACKBOX claim, carries collected
            documents, and closes the intake loop.
            {!checklistComplete
              ? " Required items still need a status — collected, generated later, waived, N/A, or field task. A field task does not hold the handoff; inspection can happen after the file is open."
              : " Field tasks stay open after promote — they do not hold this handoff."}
          </p>
          <Button
            type="button"
            variant="amber"
            disabled={busy || !checklistComplete}
            onClick={() => void promote()}
          >
            Promote to BLACKBOX claim
          </Button>
        </div>
      ) : null}

      {status === "PROMOTED" ? (
        <p className="text-sm text-brand-gold">This gate is closed. File lives in BLACKBOX.</p>
      ) : null}
    </div>
  );
}
