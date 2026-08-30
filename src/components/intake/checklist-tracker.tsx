"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ChecklistItemStatus } from "@/lib/types";
import { updateChecklistItemAction } from "@/lib/actions/triage";
import { CHECKLIST_STATUS_LABELS } from "@/lib/constants";
import { checklistProgress } from "@/lib/checklists";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Item = {
  id: string;
  status: ChecklistItemStatus;
  note: string | null;
  itemDef: {
    slug: string;
    label: string;
    helpText: string | null;
    required: boolean;
    canDeferToBlackletter: boolean;
    canDeferToBlackmirror: boolean;
  };
  documents: Array<{ id: string; fileName: string; fileUrl: string }>;
};

export function ChecklistTracker({
  intakeId,
  items,
  canEdit,
}: {
  intakeId: string;
  items: Item[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const progress = checklistProgress(items);
  const [uploading, setUploading] = useState<string | null>(null);

  async function changeStatus(itemId: string, status: ChecklistItemStatus) {
    const result = await updateChecklistItemAction({ itemId, status });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Checklist updated");
    router.refresh();
  }

  async function upload(itemId: string, file: File | undefined) {
    if (!file) return;
    setUploading(itemId);
    const body = new FormData();
    body.set("intakeId", intakeId);
    body.set("checklistItemId", itemId);
    body.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setUploading(null);
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Upload failed");
      return;
    }
    toast.success("Document collected");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Document checklist</p>
          <p className="mt-1 font-serif text-2xl text-brand-gold">
            {progress.collected}/{progress.total} collected
          </p>
        </div>
        <div className="h-2 w-40 border border-brand-white/10 bg-brand-navy-deep">
          <div
            className="h-full bg-brand-amber"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <ul className="divide-y divide-brand-white/10 border border-brand-white/10">
        {items.map((item) => (
          <li key={item.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-brand-white">{item.itemDef.label}</p>
                {item.itemDef.required ? (
                  <Badge tone="amber">Required</Badge>
                ) : (
                  <Badge>Optional</Badge>
                )}
                <Badge
                  tone={
                    item.status === "COLLECTED" ||
                    item.status === "TO_BE_GENERATED" ||
                    item.status === "WAIVED"
                      ? "gold"
                      : item.status === "FLAGGED_FIELD"
                        ? "amber"
                        : item.status === "MISSING"
                          ? "denied"
                          : "slate"
                  }
                >
                  {CHECKLIST_STATUS_LABELS[item.status]}
                </Badge>
              </div>
              {item.itemDef.helpText ? (
                <p className="mt-1 text-xs text-brand-slate">{item.itemDef.helpText}</p>
              ) : null}
              {item.note ? (
                <p className="mt-1 text-xs text-brand-white/70">{item.note}</p>
              ) : null}
              {item.documents.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {item.documents.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.fileUrl}
                        className="font-mono text-[10px] text-brand-gold hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {doc.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {canEdit ? (
              <div className="flex flex-col gap-2 md:w-56">
                <NativeSelect
                  value={item.status}
                  onChange={(e) =>
                    void changeStatus(item.id, e.target.value as ChecklistItemStatus)
                  }
                >
                  {Object.entries(CHECKLIST_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
                <Input
                  type="file"
                  disabled={uploading === item.id}
                  onChange={(e) => void upload(item.id, e.target.files?.[0])}
                />
                {item.itemDef.canDeferToBlackletter ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void changeStatus(item.id, "TO_BE_GENERATED")}
                  >
                    BLACKLETTER later
                  </Button>
                ) : null}
                {item.itemDef.canDeferToBlackmirror ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="amber"
                    onClick={() => void changeStatus(item.id, "FLAGGED_FIELD")}
                  >
                    BLACKMIRROR field task
                  </Button>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
