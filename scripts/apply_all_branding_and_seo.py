import os
import base64
import io
from PIL import Image

def run():
    print("🚀 Starting GoPasal Multi-Platform Logo & Branding Setup...")
    
    # 1. Load Master Image
    if os.path.exists("scripts/logo_b64.txt"):
        with open("scripts/logo_b64.txt", "r") as f:
            b64_data = f.read().strip()
        img_bytes = base64.b64decode(b64_data)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    elif os.path.exists("apps/customer/assets/icon.png"):
        img = Image.open("apps/customer/assets/icon.png").convert("RGBA")
    else:
        raise Exception("Source logo not found")

    dirs = [
        "apps/customer/assets",
        "apps/customer/public",
        "apps/customer/dist",
        "apps/seller/assets",
        "apps/seller/public",
        "apps/seller/dist",
        "apps/admin-web/public",
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

    # 2. Master App Icons (1024x1024)
    icon_1024 = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    icon_1024.save("apps/customer/assets/icon.png", "PNG")
    icon_1024.save("apps/customer/assets/adaptive-icon.png", "PNG")
    icon_1024.save("apps/seller/assets/icon.png", "PNG")
    icon_1024.save("apps/seller/assets/adaptive-icon.png", "PNG")

    # 3. Master Web Logo (512x512)
    icon_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    for p in [
        "apps/customer/public/icon-512.png", "apps/customer/public/logo.png",
        "apps/customer/dist/icon-512.png", "apps/customer/dist/logo.png",
        "apps/seller/public/icon-512.png", "apps/seller/public/logo.png",
        "apps/seller/dist/icon-512.png", "apps/seller/dist/logo.png",
        "apps/admin-web/public/icon-512.png", "apps/admin-web/public/logo.png"
    ]:
        icon_512.save(p, "PNG")

    # 4. PWA Icons (192x192)
    icon_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    for p in [
        "apps/customer/public/icon-192.png", "apps/customer/dist/icon-192.png",
        "apps/seller/public/icon-192.png", "apps/seller/dist/icon-192.png",
        "apps/admin-web/public/icon-192.png"
    ]:
        icon_192.save(p, "PNG")

    # 5. Apple Touch Icons (180x180)
    icon_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
    for p in [
        "apps/customer/public/apple-touch-icon.png", "apps/customer/dist/apple-touch-icon.png",
        "apps/seller/public/apple-touch-icon.png", "apps/seller/dist/apple-touch-icon.png",
        "apps/admin-web/public/apple-touch-icon.png"
    ]:
        icon_180.save(p, "PNG")

    # 6. Tab Favicons (48, 32, 16)
    icon_48 = img.resize((48, 48), Image.Resampling.LANCZOS)
    icon_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
    icon_16 = img.resize((16, 16), Image.Resampling.LANCZOS)

    icon_48.save("apps/customer/assets/favicon.png", "PNG")
    icon_48.save("apps/seller/assets/favicon.png", "PNG")

    for p in [
        "apps/customer/public/favicon.png", "apps/customer/dist/favicon.png",
        "apps/customer/public/favicon-32x32.png", "apps/customer/dist/favicon-32x32.png",
        "apps/seller/public/favicon.png", "apps/seller/dist/favicon.png",
        "apps/seller/public/favicon-32x32.png", "apps/seller/dist/favicon-32x32.png",
        "apps/admin-web/public/favicon.png", "apps/admin-web/public/favicon-32x32.png",
        "apps/admin-web/public/favicon-16x16.png"
    ]:
        icon_32.save(p, "PNG")

    # 7. Multi-layer ICOs for desktop browser tabs
    for p in [
        "apps/customer/public/favicon.ico", "apps/customer/dist/favicon.ico",
        "apps/seller/public/favicon.ico", "apps/seller/dist/favicon.ico",
        "apps/admin-web/public/favicon.ico"
    ]:
        img.save(p, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

    print("✅ All icons, logos, and favicons successfully generated across all platforms!")

if __name__ == "__main__":
    run()
