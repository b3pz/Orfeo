#!/usr/bin/env python3
"""Normalizza gli sprite e i ritratti caricati (strisce generate con nomi arbitrari) nelle
strisce che il gioco carica: assets/sprites/<personaggio>/<animazione>.png.

Perché serve: nelle strisce sorgente i fotogrammi sono stretti e le figure
sconfinano nella cella vicina (piedi, capelli), così un ritaglio a celle
uguali mostrerebbe pezzi del fotogramma accanto. Qui ogni figura viene
separata per componenti connesse, assegnata al fotogramma più vicino,
appoggiata sulla stessa linea dei piedi e ricomposta in celle pulite.

Ritratti: i busti scontornati (assets/beps, assets/kiki, …) vengono
composti su fondo carta 600x720 come gli altri ritratti, centrati sulla testa,
e salvati come assets/portraits/<personaggio>/<espressione>.png (PORTRAITS).

Uso:  pip install pillow numpy scipy && python3 tools/normalize-sprites.py
Poi:  node tools/scan-assets.mjs && node tools/build-data.mjs
Per aggiungere uno sprite: aggiungi una riga a MAP e rilancia.
I file sorgente non vengono modificati.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT_H = 512  # altezza delle celle in uscita (px)
MC = 'assets/sprites/main_characters'
NPC = 'assets/sprites/npc'

# (personaggio, animazione, sorgente, fotogrammi, fps)
MAP = [
    ('beps', 'idle', f'{MC}/beps/beps_idle_6f.png', 6, 6),
    ('beps', 'walk', f'{MC}/beps/beps_walk_8f.png', 8, 12),
    ('beps', 'run', f'{MC}/beps/beps_run_8f.png', 8, 16),
    ('beps', 'talk', f'{MC}/beps/beps_talk_6f.png', 6, 8),
    ('beps', 'use', f'{MC}/beps/beps_use_tablet_6f.png', 6, 8),
    ('beps', 'pickup', f'{MC}/beps/beps_pickup_6f.png', 6, 10),
    ('beps', 'inspect', f'{MC}/beps/beps_inspect_6f.png', 6, 6),
    ('beps', 'read', f'{MC}/beps/beps_read_document_6f.png', 6, 5),
    ('beps', 'phone', f'{MC}/beps/beps_phone_6f.png', 6, 5),
    ('beps', 'reaction', f'{MC}/beps/beps_reaction_6f.png', 6, 10),
    ('kiki', 'idle', f'{MC}/kiki/kiki_idle_6f.png', 6, 6),
    ('kiki', 'walk', f'{MC}/kiki/kiki_walk_8f.png', 8, 12),
    ('kiki', 'run', f'{MC}/kiki/kiki_run_8f.png', 8, 16),
    ('kiki', 'talk', f'{MC}/kiki/kiki_talk_6f.png', 6, 8),
    ('kiki', 'use', f'{MC}/kiki/kiki_hand_object_6f.png', 6, 8),
    ('kiki', 'pickup', f'{MC}/kiki/kiki_pickup_6f.png', 6, 10),
    ('kiki', 'inspect', f'{MC}/kiki/kiki_inspect_document_6f.png', 6, 6),
    ('kiki', 'read', f'{MC}/kiki/kiki_read_document_6f.png', 6, 5),
    ('kiki', 'reaction', f'{MC}/kiki/kiki_use_reaction_6f.png', 6, 8),
    ('varano', 'idle', f'{MC}/varano/varano_idle_6f.png', 6, 5),
    ('varano', 'talk', f'{MC}/varano/varano_talk_6f.png', 6, 7),
    ('varano', 'walk', f'{MC}/varano/varano_walk_8f.png', 8, 11),
    ('archivista', 'idle', f'{NPC}/archivista_firenze/archivista_firenze_pose_1_6f.png', 6, 4),
    ('archivista', 'talk', f'{NPC}/archivista_firenze/archivista_firenze_pose_2_6f.png', 6, 6),
    ('ilario', 'idle', f'{NPC}/bibliotecario_roma/bibliotecario_roma_pose_1_6f.png', 6, 4),
    ('ilario', 'talk', f'{NPC}/bibliotecario_roma/bibliotecario_roma_pose_2_6f.png', 6, 6),
    ('selim', 'idle', f'{NPC}/antiquario_istanbul/antiquario_istanbul_pose_2_6f.png', 6, 4),
    ('selim', 'talk', f'{NPC}/antiquario_istanbul/antiquario_istanbul_pose_1_6f.png', 6, 6),
    ('agente', 'idle', f'{NPC}/agente_orfeo_1/agente_orfeo_1_pose_1_6f.png', 6, 4),
    ('agente', 'talk', f'{NPC}/agente_orfeo_1/agente_orfeo_1_pose_2_6f.png', 6, 6),
    ('albert', 'idle', f'{NPC}/storico_parigi/storico_parigi_pose_2_6f.png', 6, 4),
    ('albert', 'talk', f'{NPC}/storico_parigi/storico_parigi_pose_1_6f.png', 6, 6),
    ('neri', 'idle', f'{NPC}/membro_consiglio_orfeo_2/membro_consiglio_orfeo_2_pose_2_6f.png', 6, 4),
    ('neri', 'talk', f'{NPC}/membro_consiglio_orfeo_2/membro_consiglio_orfeo_2_pose_1_6f.png', 6, 6),
    ('custode', 'idle', f'{NPC}/membro_consiglio_orfeo_1/membro_consiglio_orfeo_1_pose_2_6f.png', 6, 4),
    ('custode', 'talk', f'{NPC}/membro_consiglio_orfeo_1/membro_consiglio_orfeo_1_pose_1_6f.png', 6, 6),
    ('agente2', 'idle', f'{NPC}/agente_orfeo_2/agente_orfeo_2_pose_1_6f.png', 6, 4),
    ('agente2', 'talk', f'{NPC}/agente_orfeo_2/agente_orfeo_2_pose_2_6f.png', 6, 6),
]


def split(path, n):
    im = Image.open(os.path.join(ROOT, path)).convert('RGBA')
    a = np.asarray(im)
    W, H = im.size
    cell = W / n
    mask = a[:, :, 3] > 16
    lab, k = ndimage.label(ndimage.binary_dilation(mask, iterations=2))
    lab = lab * mask
    frames = [np.zeros_like(a) for _ in range(n)]
    cx = ndimage.center_of_mass(mask, lab, range(1, k + 1))
    sizes = ndimage.sum(mask, lab, range(1, k + 1))
    loose = []
    for i in range(k):
        if sizes[i] < 30:
            continue
        sel = lab == i + 1
        xs = np.nonzero(sel.any(axis=0))[0]
        # figure che si toccano formano un'unica componente: la si taglia
        # nella colonna più vuota vicino a ogni confine di cella
        centres = [f for f in range(n) if xs.min() <= (f + 0.5) * cell <= xs.max()]
        if len(centres) == 1:
            frames[centres[0]][sel] = a[sel]
            continue
        if not centres:
            loose.append(i)  # a detached shoe or strand: decided below
            continue
        # seed each figure with its torso (the part of the blob near the
        # centre of its cell, upper body only), then grow the seeds back
        # inside the shape: every pixel (a foot, a lock of hair) goes to the
        # figure it is attached to, not to whatever column it falls in
        ys = np.nonzero(sel.any(axis=1))[0]
        upper = ys.min() + int((ys.max() - ys.min()) * 0.6)
        core = ndimage.binary_erosion(sel, iterations=3)
        core[upper:] = False
        cores = np.zeros(sel.shape, np.int32)
        for j, f in enumerate(centres):
            c = (f + 0.5) * cell
            lo, hi = int(c - cell * 0.22), int(c + cell * 0.22)
            band = np.zeros_like(core)
            band[:, max(0, lo):hi] = True
            cores[core & band] = j + 1
        grown = cores.copy()
        while True:
            dil = ndimage.grey_dilation(grown, size=3)
            add = sel & (grown == 0) & (dil > 0)
            if not add.any():
                break
            grown[add] = dil[add]
        for j, f in enumerate(centres):
            part = grown == j + 1
            frames[f][part] = a[part]
    # detached pieces go to the figure whose body is nearest, not to the
    # cell their centre happens to fall in
    if loose:
        owner = np.zeros(mask.shape, np.int32)
        for f, fr in enumerate(frames):
            owner[fr[:, :, 3] > 16] = f + 1
        if owner.any():
            _, (iy, ix) = ndimage.distance_transform_edt(owner == 0, return_indices=True)
            mass = np.median([(fr[:, :, 3] > 16).sum() for fr in frames])
            for i in loose:
                if sizes[i] < mass * 0.03:
                    continue  # a toe or fingertip of the next figure, cut off in the sheet
                sel = lab == i + 1
                y, x = (int(v) for v in cx[i])
                f = owner[iy[y, x], ix[y, x]] - 1
                frames[f][sel] = a[sel]
    # offsets relative to the original cell centre
    boxes = []
    for f, fr in enumerate(frames):
        ys, xs = np.nonzero(fr[:, :, 3] > 16)
        if not len(xs):
            boxes.append(None)
            continue
        c = (f + 0.5) * cell
        boxes.append((xs.min() - c, xs.max() - c, ys.min(), ys.max()))
    return frames, boxes, cell


# (personaggio, espressione, sorgente, frazione d'altezza da tenere: toglie
# le etichette stampate sotto il busto)
PORTRAITS = [
    ('beps', 'determined', 'assets/beps/beps_determined.png', 1),
    ('beps', 'sad', 'assets/beps/beps_sad.png', 1),
    ('beps', 'scared', 'assets/beps/beps_scared.png', 1),
    ('beps', 'surprised', 'assets/beps/beps_scared.png', 1),
    ('beps', 'skeptical', 'assets/beps/beps_skeptical.png', 0.9),
    ('beps', 'tender', 'assets/beps/beps_tender.png', 0.9),
    ('kiki', 'sad', 'assets/kiki/kiki_sad_set_a.png', 1),
    ('kiki', 'scared', 'assets/kiki/kiki_scared_set_a.png', 1),
    ('kiki', 'think', 'assets/kiki/kiki_thinking_set_a.png', 1),
    ('kiki', 'worried', 'assets/kiki/kiki_worried_set_a.png', 1),
]
PAPER = (241, 233, 221)


def portrait(src, keep):
    im = Image.open(os.path.join(ROOT, src)).convert('RGBA')
    im = im.crop((0, 0, im.width, int(im.height * keep)))
    a = np.asarray(im)[:, :, 3] > 16
    ys, xs = np.nonzero(a)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    a = np.asarray(im)[:, :, 3] > 16
    head = np.nonzero(a[: int(im.height * 0.35)].any(axis=0))[0]
    hx = (head.min() + head.max()) / 2
    s = 660 / im.height
    im = im.resize((int(im.width * s), 660), Image.LANCZOS)
    out = Image.new('RGBA', (600, 720), PAPER + (255,))
    out.alpha_composite(im, (int(300 - hx * s), 60))
    return out.convert('RGB')


def portraits():
    for char, expr, src, keep in PORTRAITS:
        if not os.path.exists(os.path.join(ROOT, src)):
            print('manca', src)
            continue
        out = os.path.join(ROOT, 'assets/portraits', char, expr + '.png')
        portrait(src, keep).save(out, optimize=True)
        print(f'ritratto {char}/{expr} <- {src}')


def clean_items():
    """Toglie dagli oggetti d'inventario i frammenti degli oggetti vicini
    rimasti dal ritaglio del foglio (strisce sottili staccate dall'oggetto)."""
    d = os.path.join(ROOT, 'assets/items')
    for f in sorted(os.listdir(d)):
        if not f.endswith('.png'):
            continue
        path = os.path.join(d, f)
        im = Image.open(path).convert('RGBA')
        a = np.asarray(im).copy()
        mask = a[:, :, 3] > 8
        lab, k = ndimage.label(mask)
        if k < 2:
            continue
        sizes = ndimage.sum(mask, lab, range(1, k + 1))
        big = sizes.max()
        removed = 0
        for i in range(k):
            sel = lab == i + 1
            ys, xs = np.nonzero(sel)
            thin = min(xs.max() - xs.min(), ys.max() - ys.min()) < 45
            if sizes[i] < big * 0.1 and (thin or sizes[i] < 200):
                a[sel & mask] = 0
                removed += 1
        if removed:
            Image.fromarray(a).save(path, optimize=True)
            print(f'oggetto {f}: tolti {removed} frammenti')


def split_medallion():
    """Le due metà del medaglione (Beps / Kiki) dalle due componenti
    dell'immagine del medaglione spezzato."""
    src = os.path.join(ROOT, 'assets/items/medaglione.png')
    if not os.path.exists(src):
        return
    a = np.asarray(Image.open(src).convert('RGBA'))
    lab, k = ndimage.label(a[:, :, 3] > 8)
    sizes = ndimage.sum(a[:, :, 3] > 8, lab, range(1, k + 1))
    two = sorted(np.argsort(sizes)[-2:] + 1, key=lambda i: ndimage.center_of_mass(lab == i)[1])
    for name, i in zip(('medaglione_b', 'medaglione_k'), two):
        half = a.copy()
        half[lab != i] = 0
        Image.fromarray(half).save(os.path.join(ROOT, 'assets/items', name + '.png'), optimize=True)
        print('oggetto', name, '<- metà di medaglione.png')


def main():
    clean_items()
    split_medallion()
    portraits()
    meta = {}
    for char, anim, src, n, fps in MAP:
        if not os.path.exists(os.path.join(ROOT, src)):
            print('manca', src)
            continue
        frames, boxes, cell = split(src, n)
        ok = [b for b in boxes if b]
        top = min(b[2] for b in ok)
        bottom = max(b[3] for b in ok)
        # le strisce 724px del generatore hanno tutte la stessa scala; per le
        # altre usiamo l'altezza della figura in piedi
        srcH = frames[0].shape[0]
        scale = (OUT_H / srcH) if srcH == 724 else (OUT_H * 0.996 / (bottom - top + 1))
        half = max(max(-b[0], b[1]) for b in ok) + 4
        cw = int(round(2 * half * scale))
        cw += cw % 2
        strip = Image.new('RGBA', (cw * n, OUT_H))
        for f, (fr, b) in enumerate(zip(frames, boxes)):
            if not b:
                continue
            c = (f + 0.5) * cell
            x0, x1 = int(c - half), int(c + half)
            pad = np.zeros((fr.shape[0], x1 - x0, 4), np.uint8)
            s0, s1 = max(0, x0), min(fr.shape[1], x1)
            pad[:, s0 - x0:s1 - x0] = fr[:, s0:s1]
            img = Image.fromarray(pad[: bottom + 1])
            img = img.resize((cw, max(1, int(round((bottom + 1) * scale)))), Image.LANCZOS)
            strip.alpha_composite(img, (f * cw, OUT_H - img.height))
        out = os.path.join(ROOT, 'assets/sprites', char, anim + '.png')
        os.makedirs(os.path.dirname(out), exist_ok=True)
        strip.save(out, optimize=True)
        meta.setdefault(char, {})[anim] = {'src': f'assets/sprites/{char}/{anim}.png', 'frames': n, 'fps': fps, 'w': cw, 'h': OUT_H}
        print(f'{char}/{anim}: {n} x {cw}x{OUT_H}  <- {src}')
    # righe pronte da incollare nel blocco "sprites" di data/characters.json
    for char, anims in meta.items():
        print(f'\n{char}:')
        print(',\n'.join(f'  "{a}": {json.dumps(v)}' for a, v in anims.items()))


if __name__ == '__main__':
    sys.exit(main())
