import { Elysia } from "elysia";
import { join } from "path";
import { mkdir } from "fs/promises";
import { nanoid } from "nanoid";
import { requireAuth } from "@/middlewares/auth";
import { requireTenant } from "@/middlewares/tenant";
import { requireSellerPermission } from "@/middlewares/seller-store-permission";
import { success } from "@/utils/response";
import { NotFoundError, ValidationError } from "@/utils/errors";
import {
    
    resolveKycFilePath,
    saveKycUpload,
} from "./kyc-media";

const UPLOAD_DIR = join(process.cwd(), "uploads", "seller");
const MAX_BYTES = 8 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

function extFromUpload(file: File, fallbackName: string): string {
    const mime = file.type?.toLowerCase() || "";
    if (MIME_EXT[mime]) return MIME_EXT[mime]!;
    const m = fallbackName.toLowerCase().match(/\.([a-z0-9]+)$/);
    if (m && ["jpg", "jpeg", "png", "webp", "gif"].includes(m[1]!)) {
        return m[1] === "jpeg" ? "jpg" : m[1]!;
    }
    throw new ValidationError("Only JPG, PNG, WebP, or GIF images are allowed");
}

export const sellerMediaController = new Elysia({ prefix: "/api/v1/seller/media" })
    .get("/files/:name", async ({ params }) => {
        if (!/^[a-zA-Z0-9_-]{8,64}\.[a-z]{3,4}$/.test(params.name)) {
            throw new ValidationError("Invalid file name");
        }
        const path = join(UPLOAD_DIR, params.name);
        const file = Bun.file(path);
        if (!(await file.exists())) {
            throw new NotFoundError("File not found");
        }
        return file;
    })
    .get("/kyc/:name", async ({ params }) => {
        const path = resolveKycFilePath(params.name);
        const file = Bun.file(path);
        if (!(await file.exists())) {
            throw new NotFoundError("KYC file not found");
        }
        return file;
    })
    .group("", (app) =>
        app
            .use(requireAuth())
            .post("/kyc-upload", async ({ request }) => {
                let form: FormData;
                try {
                    form = await request.formData();
                } catch {
                    throw new ValidationError("Failed to decode file payload. Please choose a valid PDF, JPG, or PNG document.");
                }
                const entry = form.get("file");
                if (!entry || typeof entry === "string" || !(entry instanceof File)) {
                    throw new ValidationError("Missing file field");
                }
                const origin = new URL(request.url).origin;
                const url = await saveKycUpload(entry, origin);
                return success({ url });
            })
            .group("", (app) =>
                app
                    .use(requireTenant())
                    .use(requireSellerPermission("products.manage"))
                    .post("/upload", async ({ request }) => {
                        await mkdir(UPLOAD_DIR, { recursive: true });
                        const form = await request.formData();
                        const entry = form.get("file");
                        if (!entry || typeof entry === "string") {
                            throw new ValidationError("Missing file field");
                        }
                        if (!(entry instanceof File)) {
                            throw new ValidationError("Invalid file upload");
                        }
                        if (entry.size > MAX_BYTES) {
                            throw new ValidationError("Image must be 8MB or smaller");
                        }
                        const ext = extFromUpload(entry, entry.name || "upload.jpg");
                        const fileName = `${nanoid(22)}.${ext}`;
                        const dest = join(UPLOAD_DIR, fileName);
                        const buf = await entry.arrayBuffer();
                        await Bun.write(dest, buf);
                        const origin = new URL(request.url).origin;
                        const url = `${origin}/api/v1/seller/media/files/${fileName}`;
                        return success({ url });
                    })
            )
    );
