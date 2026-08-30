import { formatDateTime } from "@/lib/utils";

type LetterDoc = {
  id: string;
  documentType: string;
  title: string;
  status: string;
  generatedAt: string;
  claimNumber: string;
};

export async function LetterTrail({ intakeNumber }: { intakeNumber: string }) {
  const base = process.env.BLACKLETTER_API_URL?.replace(/\/$/, "");
  const key = process.env.BLACKLETTER_API_KEY;
  if (!base || !key) {
    return (
      <section className="panel p-5">
        <p className="eyebrow mb-3">BLACKLETTER</p>
        <p className="text-sm text-brand-slate">
          Executed contracts generated after intake will appear here once
          BLACKLETTER_API_URL is set.
        </p>
      </section>
    );
  }

  let documents: LetterDoc[] = [];
  try {
    const res = await fetch(
      `${base}/api/documents/by-intake?intakeNumber=${encodeURIComponent(intakeNumber)}`,
      {
        headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const data = (await res.json()) as { documents?: LetterDoc[] };
      documents = data.documents ?? [];
    }
  } catch {
    documents = [];
  }

  return (
    <section className="panel p-5">
      <p className="eyebrow mb-3">BLACKLETTER trail</p>
      {documents.length === 0 ? (
        <p className="text-sm text-brand-slate">
          No generated contracts linked to this intake yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {documents.map((d) => (
            <li key={d.id} className="text-sm">
              <p className="text-brand-white/90">{d.title}</p>
              <p className="text-xs text-brand-slate">
                {d.claimNumber} · {d.status} · {formatDateTime(d.generatedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
