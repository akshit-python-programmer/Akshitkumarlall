#!/usr/bin/env python3
"""Generate the x-* image assets for the NOIR / CV redesign.

usage:  python3 -I make_assets.py <repo root>
writes: <repo>/assets/x/portrait-1200.webp  1235x1100 cut-out, fingers cropped (hero + knockout mask)
        <repo>/assets/x/avatar-96.webp      96x96 face crop (floating contact pill)
        <repo>/assets/x/about-builder.webp  900x1200 "builder at his desk" (About figure)
        <repo>/assets/x/aw-ncsc.webp        1200 wide NCSC prize photo (award #06 / #10 image fix)
        <repo>/assets/x/favicon.svg         detection-bracket monogram
Needs Pillow only. Source cut-out: /home/user/Akshitkumarlall/.design-lab/noir/img/portrait-hd.webp
"""
import os, sys
from PIL import Image, ImageOps

REPO = sys.argv[1]
OUT = os.path.join(REPO, 'assets', 'x')
os.makedirs(OUT, exist_ok=True)
CUTOUT = '/home/user/Akshitkumarlall/.design-lab/noir/img/portrait-hd.webp'

# 1. hero portrait — crop the bottom 54px so the fingers at x≈980,y≥1106 never show
p = Image.open(CUTOUT).convert('RGBA').crop((0, 0, 1235, 1100))
p.save(os.path.join(OUT, 'portrait-1200.webp'), 'WEBP', quality=82, method=6)

# 2. avatar for the floating pill (face centred)
W, H = p.size
cx, cy, r = int(W * 0.535), int(H * 0.33), int(W * 0.2)
a = p.crop((cx - r, cy - r, cx + r, cy + r)).resize((96, 96), Image.LANCZOS)
bg = Image.new('RGBA', a.size, (27, 25, 23, 255)); bg.alpha_composite(a)
bg.convert('RGB').save(os.path.join(OUT, 'avatar-96.webp'), 'WEBP', quality=82, method=6)

# 3. About figure — him at his workbench (3:4)
im = ImageOps.exif_transpose(Image.open(os.path.join(REPO, 'assets/my images/20220412_181042.jpg'))).convert('RGB')
w, h = im.size
cw, ch = w, int(w * 4 / 3)
if ch > h: ch, cw = h, int(h * 3 / 4)
x0, y0 = (w - cw) // 2, max(0, (h - ch) // 2)
im.crop((x0, y0, x0 + cw, y0 + ch)).resize((900, 1200), Image.LANCZOS).save(os.path.join(OUT, 'about-builder.webp'), 'WEBP', quality=78, method=6)

# 4. NCSC prize photo (replaces the duplicated BIC carousel on award #06 and the self-duplicating #10 carousel)
im = ImageOps.exif_transpose(Image.open(os.path.join(REPO, 'assets/my images/NCSC_me_with_prize.jpg'))).convert('RGB')
im.thumbnail((1200, 1200), Image.LANCZOS)
im.save(os.path.join(OUT, 'aw-ncsc.webp'), 'WEBP', quality=76, method=6)

# 5. favicon (also referenced as mask-icon / apple-touch fallback is not needed)
open(os.path.join(OUT, 'favicon.svg'), 'w').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
    '<rect width="64" height="64" rx="14" fill="#0b0a09"/>'
    '<path d="M14 25V14h11M39 14h11v11M50 39v11H39M25 50H14V39" fill="none" stroke="#efe8dc" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
    '<circle cx="32" cy="32" r="8" fill="#ff4f1f"/></svg>\n')

for f in sorted(os.listdir(OUT)):
    print(f, os.path.getsize(os.path.join(OUT, f)))
