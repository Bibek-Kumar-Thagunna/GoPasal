import { join } from "path";
import { mkdir } from "fs/promises";
import { nanoid } from "nanoid";
import { ValidationError } from "@/utils/errors";

export const KYC_UPLOAD_DIR = join(process.cwd(), "uploads", "seller", "kyc");
export const KYC_MAX_BYTES = 10 * 1024 * 1024;

const KYC_MIME_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
};

export function kycExtFromFile(file: File, fallbackName: string): string {
    const mime = file.type?.toLowerCase() || "";
    if (KYC_MIME_EXT[mime]) return KYC_MIME_EXT[mime]!;
    const m = fallbackName.toLowerCase().match(/\.([a-z0-9]+)$/);
    if (m && ["jpg", "jpeg", "png", "webp", "pdf"].includes(m[1]!)) {
        return m[1] === "jpeg" ? "jpg" : m[1]!;
    }
    throw new ValidationError("KYC files must be JPG, PNG, WebP, or PDF");
}

export async function saveKycUpload(file: File, origin: string): Promise<string> {
    await mkdir(KYC_UPLOAD_DIR, { recursive: true });
    if (file.size > KYC_MAX_BYTES) {
        throw new ValidationError("File must be 10MB or smaller");
    }
    const ext = kycExtFromFile(file, file.name || "document.pdf");
    const fileName = `${nanoid(22)}.${ext}`;
    const dest = join(KYC_UPLOAD_DIR, fileName);
    const buf = await file.arrayBuffer();
    await Bun.write(dest, buf);
    return `${origin}/api/v1/seller/media/kyc/${fileName}`;
}

export function resolveKycFilePath(name: string): string {
    if (!/^[a-zA-Z0-9_-]{8,64}\.[a-z]{3,4}$/.test(name)) {
        throw new ValidationError("Invalid file name");
    }
    return join(KYC_UPLOAD_DIR, name);
}
