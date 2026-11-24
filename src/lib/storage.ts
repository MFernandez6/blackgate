import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  ALLOWED_UPLOAD_SUMMARY,
  detectAllowedFile,
} from "@/lib/security/file-signature";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "public/uploads";
const MAX_BYTES = 20 * 1024 * 1024;

export class UnsupportedUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedUploadError";
  }
}

export function assertAllowedUpload(bytes: Uint8Array, fileName: string) {
  if (bytes.byteLength > MAX_BYTES) {
    throw new UnsupportedUploadError("File exceeds 20MB limit.");
  }
  const detected = detectAllowedFile(bytes, fileName);
  if (!detected) {
    throw new UnsupportedUploadError(
      `Unsupported file type. Allowed: ${ALLOWED_UPLOAD_SUMMARY}.`
    );
  }
  return detected;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
}

export async function storeIntakeDocument(
  intakeId: string,
  file: { fileName: string; bytes: Buffer }
): Promise<{ fileUrl: string; fileName: string; fileSizeBytes: number; mimeType: string }> {
  const bytes = file.bytes;
  const detected = assertAllowedUpload(bytes, file.fileName);
  const stamp = Date.now();
  const fileName = file.fileName || "upload.bin";
  const stored = `${stamp}-${safeName(fileName)}`;
  const dir = path.join(process.cwd(), UPLOAD_DIR, intakeId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, stored), bytes);
  return {
    fileUrl: `/uploads/${intakeId}/${stored}`,
    fileName,
    fileSizeBytes: bytes.length,
    mimeType: detected.mime,
  };
}

export function absoluteFilePath(fileUrl: string): string {
  if (fileUrl.startsWith("/uploads/")) {
    return path.join(process.cwd(), "public", fileUrl);
  }
  return fileUrl;
}
