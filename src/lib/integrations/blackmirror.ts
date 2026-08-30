/**
 * BLACKMIRROR field-task creation for outstanding intake evidence
 * (typically damage photos the claimant could not provide).
 */

export type FieldTaskInput = {
  title: string;
  description: string;
  claimId?: string | null;
  claimNumber?: string | null;
  intakeNumber: string;
};

export async function createFieldTask(
  task: FieldTaskInput
): Promise<{ ok: boolean; dryRun: boolean; error?: string }> {
  const dryRun = !process.env.BLACKMIRROR_API_KEY;
  if (dryRun) {
    return { ok: true, dryRun: true };
  }

  const base = process.env.BLACKMIRROR_API_URL?.replace(/\/$/, "");
  if (!base) {
    return { ok: false, dryRun: false, error: "BLACKMIRROR_API_URL is not configured." };
  }

  try {
    const res = await fetch(`${base}/api/field-tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BLACKMIRROR_API_KEY}`,
      },
      body: JSON.stringify(task),
    });
    if (!res.ok) {
      return { ok: false, dryRun: false, error: `BLACKMIRROR ${res.status}` };
    }
    return { ok: true, dryRun: false };
  } catch (err) {
    return {
      ok: false,
      dryRun: false,
      error: err instanceof Error ? err.message : "BLACKMIRROR request failed.",
    };
  }
}
