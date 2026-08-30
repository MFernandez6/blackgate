import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "public/uploads";

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
}

export async function storeIntakeDocument(
  intakeId: string,
  file: File
): Promise<{ fileUrl: string; fileName: string; fileSizeBytes: number; mimeType: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const stamp = Date.now();
  const fileName = file.name || "upload.bin";
  const stored = `${stamp}-${safeName(fileName)}`;
  const dir = path.join(process.cwd(), UPLOAD_DIR, intakeId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, stored), bytes);
  return {
    fileUrl: `/uploads/${intakeId}/${stored}`,
    fileName,
    fileSizeBytes: bytes.length,
    mimeType: file.type || "application/octet-stream",
  };
}

export function absoluteFilePath(fileUrl: string): string {
  if (fileUrl.startsWith("/uploads/")) {
    return path.join(process.cwd(), "public", fileUrl);
  }
  return fileUrl;
}
