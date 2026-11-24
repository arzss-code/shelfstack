import os
import numpy as np
from PIL import Image

PRODUCTS_DIR = os.path.join(os.getcwd(), 'public', 'images', 'products')

def rgb_to_hsv(rgb):
    """Vectorized RGB (0-1) to HSV (0-1)"""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    maxc = np.maximum(np.maximum(r, g), b)
    minc = np.minimum(np.minimum(r, g), b)
    v = maxc
    deltac = maxc - minc
    
    s = np.zeros_like(v)
    mask = maxc != 0
    s[mask] = deltac[mask] / maxc[mask]
    
    h = np.zeros_like(v)
    rc = (maxc - r) / (deltac + 1e-7)
    gc = (maxc - g) / (deltac + 1e-7)
    bc = (maxc - b) / (deltac + 1e-7)
    
    h[r == maxc] = bc[r == maxc] - gc[r == maxc]
    h[g == maxc] = 2.0 + rc[g == maxc] - bc[g == maxc]
    h[b == maxc] = 4.0 + gc[b == maxc] - rc[b == maxc]
    h = (h / 6.0) % 1.0
    h[deltac == 0] = 0.0
    
    return np.stack([h, s, v], axis=-1)

def hsv_to_rgb(hsv):
    """Vectorized HSV (0-1) to RGB (0-1)"""
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    i = np.floor(h * 6.0).astype(int)
    f = (h * 6.0) - i
    p = v * (1.0 - s)
    q = v * (1.0 - s * f)
    t = v * (1.0 - s * (1.0 - f))
    
    i = i % 6
    rgb = np.zeros((*h.shape, 3), dtype=np.float32)
    
    mask = (i == 0)
    rgb[mask] = np.stack([v[mask], t[mask], p[mask]], axis=-1)
    mask = (i == 1)
    rgb[mask] = np.stack([q[mask], v[mask], p[mask]], axis=-1)
    mask = (i == 2)
    rgb[mask] = np.stack([p[mask], v[mask], t[mask]], axis=-1)
    mask = (i == 3)
    rgb[mask] = np.stack([p[mask], q[mask], v[mask]], axis=-1)
    mask = (i == 4)
    rgb[mask] = np.stack([t[mask], p[mask], v[mask]], axis=-1)
    mask = (i == 5)
    rgb[mask] = np.stack([v[mask], p[mask], q[mask]], axis=-1)
    
    return np.clip(rgb, 0.0, 1.0)

def run_all_batches():
    print("=== Generating Consistent Product Variant Images ===")

    # --- Batch 1: Tech & Gadget ---
    print("\n[Batch 1/5] Tech & Gadget")
    hp_blk = os.path.join(PRODUCTS_DIR, 'headphone-anc-black.jpg')
    hp_slv = os.path.join(PRODUCTS_DIR, 'headphone-anc-silver.jpg')
    if os.path.exists(hp_blk):
        img = Image.open(hp_blk).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] < 0.75) | (hsv[..., 1] > 0.15)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = 0.55 + 0.35 * (v[mask] ** 0.6)
        hsv_out[mask, 1] = 0.04
        hsv_out[mask, 0] = 0.60
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(hp_slv, quality=92)
        print("  -> headphone-anc-silver.jpg")

    ms_gry = os.path.join(PRODUCTS_DIR, 'mouse-ergonomic-gray.jpg')
    ms_wht = os.path.join(PRODUCTS_DIR, 'mouse-ergonomic-white.jpg')
    if os.path.exists(ms_gry):
        img = Image.open(ms_gry).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] < 0.85)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = 0.75 + 0.22 * (v[mask] ** 0.5)
        hsv_out[mask, 1] = hsv[mask, 1] * 0.2
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(ms_wht, quality=92)
        print("  -> mouse-ergonomic-white.jpg")

    chg_blk = os.path.join(PRODUCTS_DIR, 'charger-gan-black.jpg')
    chg_wht = os.path.join(PRODUCTS_DIR, 'charger-gan-white.jpg')
    if os.path.exists(chg_blk):
        img = Image.open(chg_blk).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] < 0.70)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = 0.82 + 0.16 * (v[mask] ** 0.5)
        hsv_out[mask, 1] = 0.01
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(chg_wht, quality=92)
        print("  -> charger-gan-white.jpg")

    ls_slv = os.path.join(PRODUCTS_DIR, 'laptop-stand-silver.jpg')
    ls_gry = os.path.join(PRODUCTS_DIR, 'laptop-stand-gray.jpg')
    if os.path.exists(ls_slv):
        img = Image.open(ls_slv).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] < 0.95)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = v[mask] * 0.58
        hsv_out[mask, 0] = 0.60
        hsv_out[mask, 1] = 0.05
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(ls_gry, quality=92)
        print("  -> laptop-stand-gray.jpg")

    # --- Batch 2: Furnitur & Ruang Kerja ---
    print("\n[Batch 2/5] Furnitur & Ruang Kerja")
    dsk_nat = os.path.join(PRODUCTS_DIR, 'desk-oak-natural.jpg')
    dsk_wln = os.path.join(PRODUCTS_DIR, 'desk-oak-walnut.jpg')
    if os.path.exists(dsk_nat):
        img = Image.open(dsk_nat).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 0] >= 0.04) & (hsv[..., 0] <= 0.18) & (hsv[..., 1] >= 0.12)
        hsv_out = hsv.copy()
        hsv_out[mask, 0] = 0.055
        hsv_out[mask, 1] = np.clip(hsv[mask, 1] * 1.25, 0.25, 0.85)
        hsv_out[mask, 2] = hsv[mask, 2] * 0.58
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(dsk_wln, quality=92)
        print("  -> desk-oak-walnut.jpg")

    chr_blk = os.path.join(PRODUCTS_DIR, 'chair-mesh-black.jpg')
    chr_gry = os.path.join(PRODUCTS_DIR, 'chair-mesh-gray.jpg')
    if os.path.exists(chr_blk):
        img = Image.open(chr_blk).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] < 0.60)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = 0.38 + 0.42 * (v[mask] ** 0.6)
        hsv_out[mask, 1] = 0.04
        hsv_out[mask, 0] = 0.60
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(chr_gry, quality=92)
        print("  -> chair-mesh-gray.jpg")

    lmp_blk = os.path.join(PRODUCTS_DIR, 'lamp-task-black.jpg')
    lmp_wht = os.path.join(PRODUCTS_DIR, 'lamp-task-white.jpg')
    if os.path.exists(lmp_blk):
        img = Image.open(lmp_blk).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] < 0.35)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = 0.85 + 0.12 * (v[mask] / 0.35)
        hsv_out[mask, 1] = 0.01
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(lmp_wht, quality=92)
        print("  -> lamp-task-white.jpg")

    mnt_wln = os.path.join(PRODUCTS_DIR, 'monitor-stand-walnut.jpg')
    mnt_oak = os.path.join(PRODUCTS_DIR, 'monitor-stand-oak.jpg')
    if os.path.exists(mnt_wln):
        img = Image.open(mnt_wln).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 0] >= 0.03) & (hsv[..., 0] <= 0.18) & (hsv[..., 1] >= 0.10)
        hsv_out = hsv.copy()
        hsv_out[mask, 0] = 0.105
        hsv_out[mask, 1] = np.clip(hsv[mask, 1] * 0.85, 0.15, 0.50)
        hsv_out[mask, 2] = np.clip(hsv[mask, 2] * 1.55, 0.40, 0.95)
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(mnt_oak, quality=92)
        print("  -> monitor-stand-oak.jpg")

    mat_blk = os.path.join(PRODUCTS_DIR, 'desk-mat-black.jpg')
    mat_brn = os.path.join(PRODUCTS_DIR, 'desk-mat-brown.jpg')
    if os.path.exists(mat_blk):
        img = Image.open(mat_blk).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] < 0.40)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 0] = 0.072
        hsv_out[mask, 1] = 0.72
        hsv_out[mask, 2] = 0.28 + 0.40 * (v[mask] / 0.40)
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(mat_brn, quality=92)
        print("  -> desk-mat-brown.jpg")

    # --- Batch 3: Rumah & Dapur ---
    print("\n[Batch 3/5] Rumah & Dapur")
    drp_wht = os.path.join(PRODUCTS_DIR, 'dripper-v60-white.jpg')
    drp_blk = os.path.join(PRODUCTS_DIR, 'dripper-v60-black.jpg')
    if os.path.exists(drp_wht):
        img = Image.open(drp_wht).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] > 0.50) & (hsv[..., 1] < 0.35)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = 0.10 + 0.18 * ((v[mask] - 0.50) / 0.50)
        hsv_out[mask, 1] = 0.02
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(drp_blk, quality=92)
        print("  -> dripper-v60-black.jpg")

    gls_clr = os.path.join(PRODUCTS_DIR, 'glass-borosilicate-clear.jpg')
    gls_amb = os.path.join(PRODUCTS_DIR, 'glass-borosilicate-amber.jpg')
    if os.path.exists(gls_clr):
        img = Image.open(gls_clr).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] > 0.20) & (hsv[..., 2] < 0.95)
        hsv_out = hsv.copy()
        hsv_out[mask, 0] = 0.088
        hsv_out[mask, 1] = np.clip(hsv[mask, 1] + 0.50, 0.30, 0.85)
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(gls_amb, quality=92)
        print("  -> glass-borosilicate-amber.jpg")

    grn_slv = os.path.join(PRODUCTS_DIR, 'coffee-grinder-silver.jpg')
    grn_blk = os.path.join(PRODUCTS_DIR, 'coffee-grinder-black.jpg')
    if os.path.exists(grn_slv):
        img = Image.open(grn_slv).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 1] < 0.25) & (hsv[..., 2] > 0.25)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = v[mask] * 0.35
        hsv_out[mask, 1] = 0.02
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(grn_blk, quality=92)
        print("  -> coffee-grinder-black.jpg")

    can_blk = os.path.join(PRODUCTS_DIR, 'coffee-canister-black.jpg')
    can_slv = os.path.join(PRODUCTS_DIR, 'coffee-canister-silver.jpg')
    if os.path.exists(can_blk):
        img = Image.open(can_blk).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] < 0.55)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = 0.58 + 0.35 * (v[mask] / 0.55)
        hsv_out[mask, 1] = 0.03
        hsv_out[mask, 0] = 0.60
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(can_slv, quality=92)
        print("  -> coffee-canister-silver.jpg")

    # --- Batch 4: Pakaian & Aksesoris ---
    print("\n[Batch 4/5] Pakaian & Aksesoris")
    wlt_tan = os.path.join(PRODUCTS_DIR, 'wallet-leather-tan.jpg')
    wlt_blk = os.path.join(PRODUCTS_DIR, 'wallet-leather-black.jpg')
    if os.path.exists(wlt_tan):
        img = Image.open(wlt_tan).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 0] >= 0.04) & (hsv[..., 0] <= 0.16) & (hsv[..., 1] >= 0.20)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = np.clip(v[mask] * 0.35, 0.08, 0.32)
        hsv_out[mask, 1] = 0.03
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(wlt_blk, quality=92)
        print("  -> wallet-leather-black.jpg")

    wtc_blk = os.path.join(PRODUCTS_DIR, 'field-watch-black.jpg')
    wtc_olv = os.path.join(PRODUCTS_DIR, 'field-watch-olive.jpg')
    if os.path.exists(wtc_blk):
        img = Image.open(wtc_blk).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        h, w, _ = arr.shape
        cy, cx = h // 2, w // 2
        y_indices, x_indices = np.indices((h, w))
        dist = np.sqrt((x_indices - cx)**2 + (y_indices - cy)**2)
        strap_mask = (dist > 180) & (np.abs(x_indices - cx) < 160) & (hsv[..., 2] < 0.65)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[strap_mask, 0] = 0.25
        hsv_out[strap_mask, 1] = 0.42
        hsv_out[strap_mask, 2] = np.clip(v[strap_mask] * 1.35, 0.18, 0.48)
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(wtc_olv, quality=92)
        print("  -> field-watch-olive.jpg")

    bp_blk = os.path.join(PRODUCTS_DIR, 'backpack-edc-black.jpg')
    bp_grn = os.path.join(PRODUCTS_DIR, 'backpack-edc-green.jpg')
    if os.path.exists(bp_blk):
        img = Image.open(bp_blk).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        body_mask = (hsv[..., 2] >= 0.12) & (hsv[..., 2] <= 0.60) & (hsv[..., 1] < 0.30)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[body_mask, 0] = 0.24
        hsv_out[body_mask, 1] = 0.45
        hsv_out[body_mask, 2] = np.clip(v[body_mask] * 1.25, 0.20, 0.55)
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(bp_grn, quality=92)
        print("  -> backpack-edc-green.jpg")

    tsh_wht = os.path.join(PRODUCTS_DIR, 'tshirt-heavyweight-white.jpg')
    tsh_blk = os.path.join(PRODUCTS_DIR, 'tshirt-heavyweight-black.jpg')
    if os.path.exists(tsh_wht):
        img = Image.open(tsh_wht).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] > 0.55) & (hsv[..., 1] < 0.30)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = 0.10 + 0.18 * ((v[mask] - 0.55) / 0.45)
        hsv_out[mask, 1] = 0.02
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(tsh_blk, quality=92)
        print("  -> tshirt-heavyweight-black.jpg")

    cap_blk = os.path.join(PRODUCTS_DIR, 'cap-baseball-black.jpg')
    cap_khk = os.path.join(PRODUCTS_DIR, 'cap-baseball-khaki.jpg')
    if os.path.exists(cap_blk):
        img = Image.open(cap_blk).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] < 0.50)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 0] = 0.10
        hsv_out[mask, 1] = 0.38
        hsv_out[mask, 2] = 0.55 + 0.35 * (v[mask] / 0.50)
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(cap_khk, quality=92)
        print("  -> cap-baseball-khaki.jpg")

    # --- Batch 5: Alat Tulis & Kerajinan ---
    print("\n[Batch 5/5] Alat Tulis & Kerajinan")
    jrn_grn = os.path.join(PRODUCTS_DIR, 'journal-grid-green.jpg')
    jrn_blk = os.path.join(PRODUCTS_DIR, 'journal-grid-black.jpg')
    if os.path.exists(jrn_grn):
        img = Image.open(jrn_grn).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 0] >= 0.18) & (hsv[..., 0] <= 0.48) & (hsv[..., 1] >= 0.15)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = np.clip(v[mask] * 0.45, 0.10, 0.35)
        hsv_out[mask, 1] = 0.03
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(jrn_blk, quality=92)
        print("  -> journal-grid-black.jpg")

    pen_raw = os.path.join(PRODUCTS_DIR, 'pen-titanium-raw.jpg')
    pen_blk = os.path.join(PRODUCTS_DIR, 'pen-titanium-black.jpg')
    if os.path.exists(pen_raw):
        img = Image.open(pen_raw).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 1] < 0.25) & (hsv[..., 2] >= 0.30) & (hsv[..., 2] <= 0.85)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 2] = v[mask] * 0.35
        hsv_out[mask, 1] = 0.02
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(pen_blk, quality=92)
        print("  -> pen-titanium-black.jpg")

    pnc_brn = os.path.join(PRODUCTS_DIR, 'pencil-roll-brown.jpg')
    pnc_tan = os.path.join(PRODUCTS_DIR, 'pencil-roll-tan.jpg')
    if os.path.exists(pnc_brn):
        img = Image.open(pnc_brn).convert('RGB')
        arr = np.array(img, dtype=np.float32) / 255.0
        hsv = rgb_to_hsv(arr)
        mask = (hsv[..., 2] < 0.85)
        hsv_out = hsv.copy()
        v = hsv[..., 2]
        hsv_out[mask, 0] = 0.085
        hsv_out[mask, 1] = 0.65
        hsv_out[mask, 2] = np.clip(v[mask] * 1.35, 0.35, 0.85)
        Image.fromarray((hsv_to_rgb(hsv_out) * 255.0).astype(np.uint8)).save(pnc_tan, quality=92)
        print("  -> pencil-roll-tan.jpg")

    print("\n=== All batches processed successfully with 100% geometric consistency ===")

if __name__ == '__main__':
    run_all_batches()
