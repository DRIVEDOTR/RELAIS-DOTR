#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère data/catalogue.js à partir du contenu du dossier documents/.

  - Chaque fichier déposé dans documents/<rubrique>/<sous-rubrique>/ apparaît automatiquement sur le site.
  - Les titres, descriptions, tags… éditables sont dans data/meta.json (facultatif : sans entrée, le titre est déduit du nom de fichier).
  - Les rubriques (bulles de l'accueil), le nom du site et les parcours sont dans data/config.json.
  - Les liens externes (YouTube, Drive…) sont dans data/liens.json.

Lancé automatiquement par GitHub (voir .github/workflows/catalogue.yml). Peut aussi être lancé à la main :  python3 outils/generer_catalogue.py
"""
import os, re, json, hashlib, subprocess, shutil, datetime, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "documents")
THUMBS = os.path.join(ROOT, "assets", "thumbs")
DATA = os.path.join(ROOT, "data")

TYPES = {
    "pdf": "pdf", "doc": "word", "docx": "word", "dotx": "word", "odt": "word",
    "xls": "excel", "xlsx": "excel", "xlsm": "excel", "csv": "excel", "ods": "excel",
    "ppt": "ppt", "pptx": "ppt", "key": "ppt",
    "mp4": "video", "mov": "video", "m4v": "video", "webm": "video",
    "png": "image", "jpg": "image", "jpeg": "image", "gif": "image", "webp": "image", "svg": "image",
    "mp3": "audio", "zip": "zip", "txt": "texte", "md": "texte",
}
COLORS = ["blue", "cyan", "night", "yellow"]


def load(name, default):
    p = os.path.join(DATA, name)
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def pretty(s):
    s = re.sub(r"^\d+[-_ ]+", "", s)
    s = re.sub(r"[-_]+", " ", s).strip()
    return s[:1].upper() + s[1:] if s else s


def run(cmd, timeout=120):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except Exception:
        return None


def git_date(rel):
    if os.path.isdir(os.path.join(ROOT, ".git")):
        r = run(["git", "-C", ROOT, "log", "-1", "--format=%cs", "--", rel], 30)
        if r and r.returncode == 0 and r.stdout.strip():
            return r.stdout.strip()
    return None


def office_thumb(path, out):
    """Vignette d'un document Word / Excel / PowerPoint : conversion en PDF par LibreOffice (si installé), puis 1re page."""
    exe = shutil.which("soffice") or shutil.which("libreoffice")
    if not exe or not shutil.which("pdftoppm"):
        return False
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        prof = "file://" + os.path.join(tmp, "profil")
        r = run([exe, "--headless", "--norestore", "-env:UserInstallation=" + prof, "--convert-to", "pdf", "--outdir", tmp, path], 240)
        pdf = os.path.join(tmp, os.path.splitext(os.path.basename(path))[0] + ".pdf")
        if not (r and os.path.exists(pdf)):
            return False
        r2 = run(["pdftoppm", "-f", "1", "-l", "1", "-jpeg", "-jpegopt", "quality=75", "-scale-to-x", "440", "-scale-to-y", "-1", "-singlefile", pdf, out[:-4]], 120)
        return bool(r2 and r2.returncode == 0 and os.path.exists(out))


def make_thumb(path, ext, out):
    """Crée une vignette 440 px de large (si les outils sont disponibles)."""
    os.makedirs(THUMBS, exist_ok=True)
    t = TYPES.get(ext)
    if t == "pdf" and shutil.which("pdftoppm"):
        base = out[:-4]
        r = run(["pdftoppm", "-f", "1", "-l", "1", "-jpeg", "-jpegopt", "quality=75", "-scale-to-x", "440", "-scale-to-y", "-1", "-singlefile", path, base], 120)
        return bool(r and r.returncode == 0 and os.path.exists(out))
    if t in ("word", "excel", "ppt"):
        return office_thumb(path, out)
    if t == "video" and shutil.which("ffmpeg"):
        for ss in ("3", "0"):
            r = run(["ffmpeg", "-y", "-loglevel", "error", "-ss", ss, "-i", path, "-vframes", "1", "-vf", "scale=440:-2", "-q:v", "4", out], 120)
            if r and r.returncode == 0 and os.path.exists(out):
                return True
        return False
    if t == "image" and ext != "svg":
        try:
            from PIL import Image
            im = Image.open(path)
            im.load()
            if im.mode in ("RGBA", "LA", "P"):
                im = im.convert("RGBA")
                bg = Image.new("RGB", im.size, (226, 232, 246))
                bg.paste(im, mask=im.getchannel("A"))
                im = bg
            else:
                im = im.convert("RGB")
            im.thumbnail((440, 440))
            im.save(out, "JPEG", quality=78)
            return True
        except Exception:
            return False
    return False


def pdf_pages(path):
    if shutil.which("pdfinfo"):
        r = run(["pdfinfo", path], 60)
        if r:
            m = re.search(r"Pages:\s+(\d+)", r.stdout)
            if m:
                return int(m.group(1))
    return 0


def duration(path):
    if shutil.which("ffprobe"):
        r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path], 60)
        try:
            return int(float(r.stdout.strip()))
        except Exception:
            pass
    return 0


def main():
    config = load("config.json", {})
    meta = load("meta.json", {})
    etat = load("etat.json", {})
    new_etat = {}
    today = datetime.date.today().isoformat()
    liens = load("liens.json", [])
    rubs = config.setdefault("rubriques", [])
    known = {r["id"]: r for r in rubs}
    docs, used_thumbs = [], set()
    for d, dirs, files in os.walk(DOCS):
        dirs[:] = sorted(x for x in dirs if not x.startswith("."))
        for f in sorted(files):
            if f.startswith(".") or f.lower() in ("thumbs.db", "desktop.ini"):
                continue
            full = os.path.join(d, f)
            rel = os.path.relpath(full, ROOT).replace(os.sep, "/")
            parts = rel.split("/")
            if len(parts) < 3:
                continue
            rub = parts[1]
            sous = "/".join(parts[2:-1])
            ext = os.path.splitext(f)[1].lower().lstrip(".")
            m = meta.get(rel, {})
            if rub not in known:
                r = {"id": rub, "label": pretty(rub), "icon": "folder", "color": COLORS[len(known) % 4],
                     "desc": "", "profils": [], "sous": {}}
                rubs.append(r)
                known[rub] = r
            size = os.path.getsize(full)
            h = hashlib.sha1()
            with open(full, "rb") as fh:
                for blk in iter(lambda: fh.read(1 << 20), b""):
                    h.update(blk)
            digest = h.hexdigest()
            prev = etat.get(rel)
            base_date = m.get("date") or git_date(rel) or datetime.date.fromtimestamp(os.path.getmtime(full)).isoformat()
            if prev and prev.get("h") != digest:
                fdate = today
            elif prev and prev.get("date"):
                fdate = m.get("date") or prev["date"]
            else:
                fdate = base_date
            new_etat[rel] = {"h": digest, "date": fdate}
            stem = os.path.splitext(f)[0]
            thumb = ""
            if TYPES.get(ext) in ("pdf", "video", "image", "word", "excel", "ppt"):
                key = hashlib.sha1(f"{rel}|{size}".encode()).hexdigest()[:12]
                tp = os.path.join(THUMBS, key + ".jpg")
                if os.path.exists(tp) or make_thumb(full, ext, tp):
                    thumb = "assets/thumbs/" + key + ".jpg"
                    used_thumbs.add(key + ".jpg")
            e = {
                "id": rel, "path": rel, "title": m.get("title") or pretty(stem),
                "desc": m.get("desc", ""), "when": m.get("when", ""),
                "tags": m.get("tags", []), "profils": m.get("profils") or known[rub].get("profils", []),
                "date": fdate,
                "order": m.get("order", 100), "rub": rub, "sous": sous,
                "type": TYPES.get(ext, "autre"), "ext": ext, "size": size, "thumb": thumb,
            }
            if TYPES.get(ext) == "pdf":
                e["pages"] = pdf_pages(full)
            if TYPES.get(ext) == "video":
                e["duree"] = duration(full)
            if m.get("essentiel"):
                e["essentiel"] = True
            if m.get("edit"):
                e["edit"] = m["edit"]
            docs.append(e)
    # nettoyage des vignettes orphelines
    if os.path.isdir(THUMBS):
        for t in os.listdir(THUMBS):
            if t.endswith(".jpg") and t not in used_thumbs:
                os.remove(os.path.join(THUMBS, t))
    out = {"config": config, "docs": docs, "liens": liens,
           "generated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")}
    os.makedirs(DATA, exist_ok=True)
    with open(os.path.join(DATA, "etat.json"), "w", encoding="utf-8") as f:
        json.dump(new_etat, f, ensure_ascii=False, indent=0, sort_keys=True)
    with open(os.path.join(DATA, "catalogue.js"), "w", encoding="utf-8") as f:
        f.write("window.HUB = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"Catalogue généré : {len(docs)} documents, {len(liens)} liens, {len(rubs)} rubriques.")


if __name__ == "__main__":
    main()
