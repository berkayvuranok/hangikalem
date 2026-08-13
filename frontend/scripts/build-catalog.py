#!/usr/bin/env python3
"""Build frontend catalog from the local API, then seed files. Enrich missing photos."""
from __future__ import annotations

import ast
import json
import re
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "backend/internal/seed"
OUT_SRC = ROOT / "frontend/src/data/catalog.json"
OUT_PUBLIC = ROOT / "frontend/public/catalog.json"
API = "http://localhost:8080"
UA = "HangiKalem/1.0 (https://github.com/berkayvuranok/hangikalem; catalog-build)"
CTX = ssl.create_default_context()

BRAND_NAMES = {
    "uni": "Uni-ball",
    "pilot": "Pilot",
    "lamy": "Lamy",
    "pentel": "Pentel",
    "zebra": "Zebra",
    "parker": "Parker",
    "kaweco": "Kaweco",
    "rotring": "rOtring",
    "tombow": "Tombow",
    "faber-castell": "Faber-Castell",
    "sailor": "Sailor",
    "caran-dache": "Caran d'Ache",
    "staedtler": "Staedtler",
    "muji": "Muji",
    "cross": "Cross",
    "bic": "BIC",
    "platinum": "Platinum",
    "twsbi": "TWSBI",
    "pelikan": "Pelikan",
    "waterman": "Waterman",
    "montblanc": "Montblanc",
    "sakura": "Sakura",
    "paper-mate": "Paper Mate",
    "schneider": "Schneider",
    "ohto": "Ohto",
    "serve": "Serve",
    "adel": "Adel",
    "diplomat": "Diplomat",
    "fisher": "Fisher",
    "jinhao": "Jinhao",
    "hongdian": "Hongdian",
    "sheaffer": "Sheaffer",
    "leuchtturm": "Leuchtturm",
    "sharpie": "Sharpie",
    "stabilo": "Stabilo",
    "monami": "Monami",
    "graf-von-faber": "Faber-Castell Graf",
}

BRAND_DESC = {
    "uni": "Japon hassasiyeti ve Jetstream akıcılığı.",
    "pilot": "Jel, dolma kalem ve mekanik kalemde referans marka.",
    "lamy": "Bauhaus çizgisinde Alman tasarımı.",
    "pentel": "EnerGel ve teknik çizim kalemlerinin evi.",
    "zebra": "Sarasa ve çelik gövdeli ofis efsaneleri.",
    "parker": "Klasik imza kalemleri.",
    "kaweco": "Cep boyu Alman dolma kalem geleneği.",
    "rotring": "Mühendislik hassasiyeti.",
    "tombow": "Japon kırtasiye ve yazım konforu.",
    "faber-castell": "İki asırlık yazım ve çizim geleneği.",
    "sailor": "Japon dolma kalem zanaatı.",
    "caran-dache": "İsviçre lüksü ve 849 ikonu.",
    "staedtler": "Teknik kalem ve çizim.",
    "muji": "Sade, işlevsel, günlük.",
    "cross": "Amerikan imza geleneği.",
    "bic": "Herkesin tanıdığı, her yerde bulunan tükenmez.",
    "platinum": "Preppy’den 3776’ya Japon dolma kalem.",
    "twsbi": "Şeffaf piston doldurmalı dolma kalemler.",
    "pelikan": "Alman mürekkep ve dolma kalem geleneği.",
    "waterman": "Fransız imza kalemleri.",
    "montblanc": "Lüks yazımın ikonu.",
    "sakura": "Gelly Roll ve pigment mürekkep.",
    "paper-mate": "Amerikan okul ve ofis jeli.",
    "schneider": "Alman ofis yazımı, Slider serisi.",
    "ohto": "Japon iğne uç ve alüminyum gövde.",
    "serve": "Türkiye’de her kırtasiyede bulunan günlük kalem.",
    "adel": "Türk okul kalemi klasiği.",
    "diplomat": "Alman dolma kalem, Aero ve Magnum.",
    "fisher": "Uzayda yazan basınçlı tükenmez.",
    "jinhao": "Uygun fiyatlı Çin dolma kalemleri.",
    "hongdian": "Bütçe dolma kalemde orman ve pirinç.",
    "sheaffer": "Amerikan imza kalemi geleneği.",
    "leuchtturm": "Drehgriffel ve defter dünyası.",
    "sharpie": "Jel ve keçeli yazım.",
    "stabilo": "Worker ve bionic ofis kalemleri.",
    "monami": "Kore’nin 153 klasiği.",
    "graf-von-faber": "Faber-Castell’in lüks hattı.",
}

BAD_IMAGE = (
    "collage",
    "collection",
    "newspaper",
    "zeitung",
    "giornale",
    "magazine",
    "daily_times",
    "victoria_daily",
    "fun_pen",
    "logo.svg",
)


def get_json(url: str, timeout: float = 12) -> dict | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as res:
            return json.loads(res.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ssl.SSLError):
        return None


def is_photo(url: str | None) -> bool:
    if not url or not url.startswith("http"):
        return False
    low = url.lower()
    return not any(part in low for part in BAD_IMAGE)


def split_go_args(body: str) -> list[str]:
    args: list[str] = []
    cur: list[str] = []
    depth = 0
    in_str = False
    i = 0
    while i < len(body):
        ch = body[i]
        if in_str:
            cur.append(ch)
            if ch == "\\" and i + 1 < len(body):
                cur.append(body[i + 1])
                i += 2
                continue
            if ch == '"':
                in_str = False
            i += 1
            continue
        if ch == '"':
            in_str = True
            cur.append(ch)
            i += 1
            continue
        if ch in "{[":
            depth += 1
            cur.append(ch)
            i += 1
            continue
        if ch in "}]":
            depth -= 1
            cur.append(ch)
            i += 1
            continue
        if ch == "," and depth == 0:
            args.append("".join(cur).strip())
            cur = []
            i += 1
            continue
        cur.append(ch)
        i += 1
    if "".join(cur).strip():
        args.append("".join(cur).strip())
    return args


def unquote(s: str) -> str:
    s = s.strip()
    if s.startswith('"') and s.endswith('"'):
        try:
            return ast.literal_eval(s)
        except (SyntaxError, ValueError):
            return s[1:-1]
    return s


def parse_tags(s: str) -> list[str]:
    return re.findall(r'"([^"]+)"', s)


def parse_pens(text: str) -> list[dict]:
    pens = []
    for m in re.finditer(r"\{\s*(\"[a-z0-9-]+\")\s*,", text):
        start = m.start()
        depth = 0
        in_str = False
        end = None
        i = start
        while i < len(text):
            ch = text[i]
            if in_str:
                if ch == "\\" and i + 1 < len(text):
                    i += 2
                    continue
                if ch == '"':
                    in_str = False
                i += 1
                continue
            if ch == '"':
                in_str = True
                i += 1
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break
            i += 1
        if end is None:
            continue
        args = split_go_args(text[start + 1 : end])
        if len(args) < 26 or not args[0].startswith('"') or not args[2].startswith('"'):
            continue
        try:
            brand = unquote(args[0])
            name = unquote(args[1])
            slug = unquote(args[2])
            if "-" not in slug:
                continue
            pens.append(
                {
                    "id": slug,
                    "brand_id": brand,
                    "brand_name": BRAND_NAMES.get(brand, brand),
                    "brand_slug": brand,
                    "name": name,
                    "slug": slug,
                    "description": unquote(args[3]),
                    "type": unquote(args[4]),
                    "ink_type": unquote(args[5]),
                    "tip_size": unquote(args[6]),
                    "price": float(args[7]),
                    "weight": float(args[8]),
                    "length": float(args[9]),
                    "grip_material": unquote(args[10]),
                    "body_material": unquote(args[11]),
                    "color": unquote(args[12]),
                    "image_url": unquote(args[13]),
                    "smoothness_score": float(args[14]),
                    "comfort_score": float(args[15]),
                    "durability_score": float(args[16]),
                    "precision_score": float(args[17]),
                    "design_score": float(args[18]),
                    "grip_score": float(args[19]),
                    "ink_quality": float(args[20]),
                    "why_good": unquote(args[21]),
                    "suitable_for": unquote(args[22]),
                    "not_suitable_for": unquote(args[23]),
                    "avg_rating": 4.6,
                    "review_count": 3,
                    "tags": parse_tags(args[24]),
                }
            )
        except Exception:
            continue
    return pens


def load_from_seed() -> dict:
    seen: set[str] = set()
    pens = []
    for name in ("seed.go", "catalog_pens.go", "more_pens.go", "even_more.go"):
        text = (SEED / name).read_text(encoding="utf-8")
        for p in parse_pens(text):
            if p["slug"] in seen:
                continue
            seen.add(p["slug"])
            pens.append(p)
    brands = [
        {"id": slug, "name": BRAND_NAMES[slug], "slug": slug, "description": BRAND_DESC[slug]}
        for slug in BRAND_NAMES
        if any(p["brand_slug"] == slug for p in pens)
    ]
    return {"pens": pens, "brands": brands}


def slim_pen(p: dict) -> dict:
    keep = (
        "id",
        "brand_id",
        "brand_name",
        "brand_slug",
        "name",
        "slug",
        "description",
        "type",
        "ink_type",
        "tip_size",
        "price",
        "weight",
        "length",
        "grip_material",
        "body_material",
        "color",
        "smoothness_score",
        "comfort_score",
        "durability_score",
        "precision_score",
        "design_score",
        "grip_score",
        "ink_quality",
        "image_url",
        "why_good",
        "suitable_for",
        "not_suitable_for",
        "avg_rating",
        "review_count",
        "tags",
    )
    return {k: p[k] for k in keep if k in p}


def load_from_api() -> dict | None:
    pens_payload = get_json(f"{API}/api/pens?limit=500", timeout=8)
    brands_payload = get_json(f"{API}/api/brands", timeout=8)
    if not pens_payload or not brands_payload:
        return None
    pens = [slim_pen(p) for p in pens_payload.get("items", [])]
    brands = [
        {
            "id": b.get("id") or b.get("slug"),
            "name": b["name"],
            "slug": b["slug"],
            "description": BRAND_DESC.get(b["slug"]) or b.get("description") or "",
        }
        for b in brands_payload.get("items", [])
    ]
    if not pens:
        return None
    return {"pens": pens, "brands": brands}


def wiki_image(brand: str, name: str) -> str:
    titles = [f"{brand} {name}", f"{brand} {name.split()[0]}", name]
    for host in ("https://en.wikipedia.org", "https://tr.wikipedia.org"):
        for title in titles:
            path = urllib.parse.quote(title.replace(" ", "_"), safe="")
            data = get_json(f"{host}/api/rest_v1/page/summary/{path}")
            if not data:
                continue
            src = ""
            if isinstance(data.get("originalimage"), dict):
                src = data["originalimage"].get("source") or ""
            if not src and isinstance(data.get("thumbnail"), dict):
                src = data["thumbnail"].get("source") or ""
            if is_photo(src):
                return src
    return ""


def commons_image(query: str) -> str:
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": "6",
            "gsrlimit": "8",
            "prop": "imageinfo",
            "iiprop": "url",
            "iiurlwidth": "800",
        }
    )
    data = get_json(f"https://commons.wikimedia.org/w/api.php?{params}")
    if not data:
        return ""
    pages = (data.get("query") or {}).get("pages") or {}
    generic = {"pen", "pens", "fountain", "gel", "ink", "ballpoint", "mechanical", "pencil", "clip"}
    keys = [p.strip(".-") for p in query.lower().split() if len(p.strip(".-")) >= 3 and p.strip(".-") not in generic]
    best, best_score = "", 0
    for page in pages.values():
        title = str(page.get("title") or "").lower()
        if any(bad in title for bad in BAD_IMAGE):
            continue
        info = (page.get("imageinfo") or [{}])[0]
        src = info.get("thumburl") or info.get("url") or ""
        if not is_photo(src):
            continue
        score = 0
        matched_long = False
        for part in keys:
            if part in title:
                score += 2
                if len(part) >= 4:
                    matched_long = True
        if score == 0 or (any(len(p) >= 4 for p in keys) and not matched_long):
            continue
        if score > best_score:
            best, best_score = src, score
    return best


def resolve_image(pen: dict) -> str:
    current = pen.get("image_url") or ""
    if is_photo(current):
        return current
    brand = pen.get("brand_name") or ""
    name = pen.get("name") or ""
    return wiki_image(brand, name) or commons_image(f"{brand} {name} pen") or current


def enrich_images(pens: list[dict]) -> None:
    missing = [p for p in pens if not is_photo(p.get("image_url"))]
    if not missing:
        return
    print(f"enriching {len(missing)} photos…", flush=True)
    found = 0
    with ThreadPoolExecutor(max_workers=6) as pool:
        futs = {pool.submit(resolve_image, p): p for p in missing}
        for i, fut in enumerate(as_completed(futs), 1):
            pen = futs[fut]
            try:
                url = fut.result()
            except Exception as exc:
                print(f"  {pen.get('slug')}: {exc}", file=sys.stderr)
                continue
            if is_photo(url):
                pen["image_url"] = url
                found += 1
            if i % 25 == 0 or i == len(missing):
                print(f"  {i}/{len(missing)} ({found} bulundu)", flush=True)


def write_catalog(data: dict) -> None:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    for path in (OUT_SRC, OUT_PUBLIC):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(payload, encoding="utf-8")
    http = sum(1 for p in data["pens"] if is_photo(p.get("image_url")))
    print(f"wrote {len(data['pens'])} pens, {len(data['brands'])} brands, {http} photos -> {OUT_SRC}")


def main() -> None:
    data = load_from_api()
    if data:
        print(f"api: {len(data['pens'])} pens")
    else:
        print("api yok, seed dosyalarından okunuyor")
        data = load_from_seed()
    enrich_images(data["pens"])
    write_catalog(data)


if __name__ == "__main__":
    main()
