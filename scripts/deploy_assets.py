import os, base64, io
from PIL import Image

def run():
    print("🚀 Generating and placing all brand logo assets...")
    
    with open("scripts/logo.b64", "r") as f:
        b64 = f.read().strip()
    
    img_bytes = base64.b64decode(b64)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    
    dirs = [
        "apps/customer/public",
        "apps/customer/dist",
        "apps/customer/assets",
        "apps/seller/public",
        "apps/seller/dist",
        "apps/seller/assets",
        "apps/admin-web/public",
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        
    # 1. Save standard 512 & 256 logo.png
    for d in dirs:
        img.save(os.path.join(d, "logo.png"), "PNG")
        img.save(os.path.join(d, "icon.png"), "PNG")
        img.save(os.path.join(d, "favicon.png"), "PNG")
        
        # Save ICO
        img.save(os.path.join(d, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
        
        # Save SVG
        svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <image href="data:image/png;base64,{b64}" width="256" height="256" />
</svg>'''
        with open(os.path.join(d, "favicon.svg"), "w") as sf:
            sf.write(svg_content)
            
    print("✅ All logo.png, favicon.png, favicon.ico, and favicon.svg files successfully deployed!")

if __name__ == "__main__":
    run()
