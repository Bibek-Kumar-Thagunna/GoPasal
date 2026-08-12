import os, base64, io
from PIL import Image

master_img = Image.open("logo.png").convert("RGBA")
img_256 = master_img.resize((256, 256), Image.Resampling.LANCZOS)
buf = io.BytesIO()
img_256.save(buf, format="PNG", optimize=True)
b64_256 = base64.b64encode(buf.getvalue()).decode("utf-8")

lines = [b64_256[i:i+70] for i in range(0, len(b64_256), 70)]
formatted_chunks = "\n".join([f"    \"{l}\"," for l in lines])

code = """import os, base64, io
from PIL import Image

chunks = [
""" + formatted_chunks + """
]
master_b64 = "".join(chunks)
img_bytes = base64.b64decode(master_b64)
img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")

base_dir = "/opt/gopasal" if os.path.exists("/opt/gopasal") else os.getcwd()

dirs = [
    os.path.join(base_dir, "apps/customer/public"),
    os.path.join(base_dir, "apps/customer/dist"),
    os.path.join(base_dir, "apps/customer/assets"),
    os.path.join(base_dir, "apps/seller/public"),
    os.path.join(base_dir, "apps/seller/dist"),
    os.path.join(base_dir, "apps/seller/assets"),
    os.path.join(base_dir, "apps/admin-web/public"),
]

for d in dirs:
    os.makedirs(d, exist_ok=True)
    img.save(os.path.join(d, "logo.png"), "PNG")
    img.save(os.path.join(d, "icon.png"), "PNG")
    img.save(os.path.join(d, "favicon.png"), "PNG")
    img.save(os.path.join(d, "favicon-32x32.png"), "PNG")
    img.save(os.path.join(d, "favicon-16x16.png"), "PNG")
    img.save(os.path.join(d, "apple-touch-icon.png"), "PNG")
    img.save(os.path.join(d, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    
    svg_str = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256"><image href="data:image/png;base64,{master_b64}" width="256" height="256" /></svg>'
    with open(os.path.join(d, "favicon.svg"), "w") as sf:
        sf.write(svg_str)

# Also write to root
img.save(os.path.join(base_dir, "logo.png"), "PNG")
print("✅ Deployed exact master 3D logo and favicon files to all apps!")
"""

with open("scripts/deploy_master_official_logo.py", "w") as f:
    f.write(code)

print("Generated scripts/deploy_master_official_logo.py successfully!")
