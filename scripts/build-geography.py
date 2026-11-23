"""Build public map files from GeoNames country ZIPs and Natural Earth 50m GeoJSON."""

import json
import math
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/geography"
SOURCE = Path(sys.argv[1])
SEATS = {"PPLC", "PPLA", "PPLA2", "PPLA3", "PPLA4", "PPLA5"}
REGION_PREFIX = re.compile(r"^(?:departamento|provincia|estado|región|distrito|department) d[eo]l? ", re.I)
REGION_SUFFIX = re.compile(r" (?:Province|Department|Region)$", re.I)
HAITI_REGIONS = {
    "Ouest": "Oeste", "Nord": "Norte", "Sud": "Sur", "Centre": "Centro",
    "Sud-Est": "Sudeste", "Nord-Est": "Nordeste", "Nord-Ouest": "Noroeste",
}
CATALOG_NAMES = {
    "AR": {"ciudad de buenos aires": "buenos aires"},
    "CO": {"bogota d c": "bogota"},
    "CU": {"isla de la juventud": "nueva gerona"},
    "GT": {"guatemala": "ciudad de guatemala", "ixcan": "playa grande"},
    "HT": {"puerto principe": "port au prince", "cabo haitiano": "cap haitien"},
    "PA": {"ciudad de panama": "panama"},
}
SEARCH_ALIASES = {"GT": {"quetzaltenango": ["Xela"], "ciudad de guatemala": ["Guatemala"]}}
REFERENCE_IDS = {
    "BR": {"santa maria|santa maria distrito federal": "12432973"},
    "CO": {"bogota d c|bogota d c": "3688689"},
    "CR": {"san carlos|san carlos alajuela": "3622190"},
    "MX": {"queretaro|santiago de queretaro queretaro": "3991164"},
    "PE": {"barranco|barranco lima": "8351030", "la victoria|la victoria lima": "8351034",
           "la victoria|la victoria lambayeque": "8351069", "surquillo|surquillo lima": "8350386",
           "san martin de porres|san martin de porres lima": "8351065"},
    "SV": {"colon|colon la libertad": "12031377"},
    "UY": {"lomas de solymar|lomas de solymar canelones": "osm-1987912394"},
    "VE": {"sucre|sucre miranda": "3630297"},
}
REGION_NAMES = {
    "AR": {"Buenos Aires F.D.": "Ciudad de Buenos Aires"},
    "CL": {"Santiago Metropolitan": "Región Metropolitana"},
    "CO": {"Bogota D.C.": "Distrito Capital"},
    "CU": {"Havana": "La Habana"},
    "HT": HAITI_REGIONS,
    "PE": {"Lima region": "Lima", "Lima Province": "Lima"},
}


def normal(text):
    text = unicodedata.normalize("NFD", text.lower())
    return " ".join(re.findall(r"[^\W_]+", "".join(ch for ch in text if not unicodedata.combining(ch))))


def write(name, value):
    (OUTPUT / name).write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def simplify(points, tolerance=0.018):
    first, last = points[0], points[-1]
    dx, dy = last[0] - first[0], last[1] - first[1]
    squared = dx * dx + dy * dy
    largest, split = 0, 0
    for index, (x, y, *_) in enumerate(points[1:-1], 1):
        fraction = max(0, min(1, ((x - first[0]) * dx + (y - first[1]) * dy) / squared)) if squared else 0
        distance = math.hypot(x - (first[0] + fraction * dx), y - (first[1] + fraction * dy))
        if distance > largest:
            largest, split = distance, index
    if largest <= tolerance:
        return [first, last]
    return simplify(points[:split + 1], tolerance)[:-1] + simplify(points[split:], tolerance)


def shape_ring(ring):
    reduced = simplify(ring)
    return [[round(lon, 3), round(lat, 3)] for lon, lat, *_ in (reduced if len(reduced) >= 4 else ring)]


def build_world():
    source = json.loads((SOURCE / "world.geojson").read_text(encoding="utf-8"))
    world = {}
    for feature in source["features"]:
        properties = feature["properties"]
        iso = properties["ISO_A2"]
        if iso == "-99":
            iso = properties["ISO_A2_EH"]
        code = properties["ADM0_A3"] if iso == "-99" else iso
        geometry = feature["geometry"]
        polygons = geometry["coordinates"]
        if geometry["type"] == "Polygon":
            polygons = [polygons]
        clean = [[shape_ring(ring) for ring in polygon] for polygon in polygons]
        if code in world:
            world[code][1].extend(clean)
        else:
            world[code] = [properties["NAME_ES"] or properties["ADMIN"], clean]
    write("world.json", world)


def build_country(code, catalog, regions):
    by_name = defaultdict(list)
    places = {}
    selected = set()
    districts = set()
    with ZipFile(SOURCE / f"{code}.zip") as archive:
        for row in archive.read(f"{code}.txt").decode("utf-8").splitlines():
            fields = row.split("\t")
            identity, name, ascii_name, aliases, lat, lon, kind, feature, _, _, admin = fields[:11]
            if kind != "P" and feature not in {"ADM2", "ADM3", "ADM4"}:
                continue
            if feature in {"PPLH", "PPLQ", "PPLX"}:
                continue
            region = regions.get(f"{code}.{admin}", "")
            population = int(fields[14] or 0)
            key = normal(name)
            preferred = [ascii_name, *SEARCH_ALIASES.get(code, {}).get(key, [])]
            places[identity] = [name, region, round(float(lat), 4), round(float(lon), 4),
                                sorted({alias for alias in preferred if normal(alias) != key})]
            for alias in {key, normal(ascii_name), *(normal(a) for a in aliases.split(",")),
                          *(normal(a) for a in preferred)} - {""}:
                by_name[alias].append((identity, key, normal(region), feature, population))
            if feature in SEATS or (kind == "P" and population >= 500):
                selected.add(identity)
            elif feature == "ADM2" and population > 0:
                districts.add(identity)

    if code == "UY":
        # OpenStreetMap node 1987912394, missing in the GeoNames country dump.
        places["osm-1987912394"] = ["Lomas de Solymar", "Canelones", -34.8178, -55.9441, []]

    references = {}
    for resource in catalog["resources"]:
        scope, area, municipality = (resource["coverage"][part] for part in ("scope", "area", "municipality"))
        if scope == "national" or not municipality:
            continue
        name, region = normal(municipality), normal(area.rsplit(",", 1)[-1]) if "," in area else ""
        key = name + "|" + normal(area)
        if key in references:
            continue
        candidates = by_name[CATALOG_NAMES.get(code, {}).get(name, name)]
        def priority(candidate):
            _, canonical, admin, feature, population = candidate
            return (bool(admin and (region == admin or admin in region or region and region in admin)), canonical == name,
                    not feature.startswith("ADM"), feature in SEATS, population)
        identity = REFERENCE_IDS.get(code, {}).get(key)
        if not identity:
            if not candidates:
                raise ValueError(f"Missing city for {code}: {municipality} ({area})")
            identity = max(candidates, key=priority)[0]
        selected.add(identity)
        references[key] = identity
        if name != normal(places[identity][0]) and name not in [normal(a) for a in places[identity][4]]:
            places[identity][4].append(municipality)
    names = {(normal(alias), normal(places[key][1])) for key in selected for alias in [places[key][0], *places[key][4]]}
    for identity in districts:
        name, region, *_ = places[identity]
        shorter = re.sub(r"^(?:departamento|provincia|municipio|distrito|cantón|partido) del? ", "", name, flags=re.I)
        if (normal(shorter), normal(region)) not in names:
            places[identity][0] = shorter
            selected.add(identity)
    write(f"{code}.json", {"places": {key: places[key] for key in sorted(selected)}, "references": references})
    print(code, len(selected), "places,", len(references), "catalog areas")


OUTPUT.mkdir(parents=True, exist_ok=True)
build_world()
regions = {}
for line in (SOURCE / "admin1CodesASCII.txt").read_text(encoding="utf-8").splitlines():
    key, name, *_ = line.split("\t")
    display = REGION_SUFFIX.sub("", REGION_PREFIX.sub("", name))
    regions[key] = REGION_NAMES.get(key.split(".")[0], {}).get(display, display)
for path in sorted((ROOT / "data/countries").glob("*/resources.json")):
    build_country(path.parent.name.upper(), json.loads(path.read_text(encoding="utf-8")), regions)
