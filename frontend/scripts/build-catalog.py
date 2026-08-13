#!/usr/bin/env python3
"""Build frontend catalog from local seed Go files (no network)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "backend/internal/seed"
OUT = ROOT / "frontend/src/data/catalog.json"

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
    "pilot": "Gel, dolma kalem ve mekanik kalemde referans marka.",
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
        return bytes(s[1:-1], "utf-8").decode("unicode_escape")
    return s


def parse_tags(s: str) -> list[str]:
    return re.findall(r'"([^"]+)"', s)


def parse_pens(text: str) -> list[dict]:
    pens = []
    for m in re.finditer(r"\{\s*(\"[a-z0-9-]+\")\s*,", text):
        start = m.start()
        if text[start : start + 2] != "{:":
            pass
        # find matching close for this composite
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
        body = text[start + 1 : end]
        args = split_go_args(body)
        if len(args) < 26:
            continue
        if not args[0].startswith('"') or not args[2].startswith('"'):
            continue
        try:
            brand = unquote(args[0])
            name = unquote(args[1])
            slug = unquote(args[2])
            if "-" not in slug:
                continue
            tags = parse_tags(args[24])
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
                    "tags": tags,
                }
            )
        except Exception:
            continue
    return pens


def main() -> None:
    seen = set()
    pens = []
    for name in ("seed.go", "catalog_pens.go", "more_pens.go", "even_more.go"):
        text = (SEED / name).read_text()
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
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"pens": pens, "brands": brands}, ensure_ascii=False, separators=(",", ":")))
    print(f"wrote {len(pens)} pens, {len(brands)} brands -> {OUT}")


if __name__ == "__main__":
    main()
