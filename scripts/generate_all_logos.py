import os
import io
from PIL import Image

def generate_assets(source_image_path):
    print(f"Reading source image from {source_image_path}...")
    img = Image.open(source_image_path).convert("RGBA")
    print(f"Loaded image size: {img.size}")

    dirs = [
        "apps/customer/assets",
        "apps/customer/public",
        "apps/seller/assets",
        "apps/seller/public",
        "apps/admin-web/public"
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

    # 1. 1024x1024 Master Logo / App Icon
    icon_1024 = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    icon_1024.save("apps/customer/assets/icon.png", "PNG")
    icon_1024.save("apps/customer/assets/adaptive-icon.png", "PNG")
    icon_1024.save("apps/seller/assets/icon.png", "PNG")
    icon_1024.save("apps/seller/assets/adaptive-icon.png", "PNG")

    # 2. 512x512 Master Web Logo
    icon_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save("apps/customer/public/icon-512.png", "PNG")
    icon_512.save("apps/customer/public/logo.png", "PNG")
    icon_512.save("apps/seller/public/icon-512.png", "PNG")
    icon_512.save("apps/seller/public/logo.png", "PNG")
    icon_512.save("apps/admin-web/public/icon-512.png", "PNG")
    icon_512.save("apps/admin-web/public/logo.png", "PNG")

    # 3. 192x192 PWA Icon
    icon_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save("apps/customer/public/icon-192.png", "PNG")
    icon_192.save("apps/seller/public/icon-192.png", "PNG")
    icon_192.save("apps/admin-web/public/icon-192.png", "PNG")

    # 4. 180x180 Apple Touch Icon
    icon_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
    icon_180.save("apps/customer/public/apple-touch-icon.png", "PNG")
    icon_180.save("apps/seller/public/apple-touch-icon.png", "PNG")
    icon_180.save("apps/admin-web/public/apple-touch-icon.png", "PNG")

    # 5. Favicons (48x48, 32x32, 16x16)
    icon_48 = img.resize((48, 48), Image.Resampling.LANCZOS)
    icon_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
    icon_16 = img.resize((16, 16), Image.Resampling.LANCZOS)

    icon_48.save("apps/customer/assets/favicon.png", "PNG")
    icon_48.save("apps/seller/assets/favicon.png", "PNG")
    icon_32.save("apps/customer/public/favicon.png", "PNG")
    icon_32.save("apps/seller/public/favicon.png", "PNG")
    icon_32.save("apps/admin-web/public/favicon-32x32.png", "PNG")
    icon_16.save("apps/admin-web/public/favicon-16x16.png", "PNG")

    # 6. Multi-layer ICO for desktop browser tabs
    img.save("apps/customer/public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    img.save("apps/seller/public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    img.save("apps/admin-web/public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

    print("Successfully generated all logo, app icon, and tab favicon assets across Customer, Seller, and Admin apps!")

if __name__ == "__main__":
    import sys
    src = sys.argv[1] if len(sys.argv) > 1 else "apps/customer/assets/icon.png"
    generate_assets(src)
