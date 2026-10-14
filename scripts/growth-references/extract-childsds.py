#!/usr/bin/env python3
"""
Extract national growth-reference LMS parameters from the `childsds` R package
data files into the JSON files under src/data/growth-references/.

Only the numeric L/M/S values are taken. They are the published parameters of
the cited studies (see src/data/growth-references/README.md); no code from
childsds is used. The .rda files are parsed as data, never executed.

Usage (one-off, not part of the build):
    git clone --depth 1 https://github.com/cran/childsds /tmp/childsds
    python -m venv /tmp/venv && /tmp/venv/bin/pip install rdata
    /tmp/venv/bin/python scripts/growth-references/extract-childsds.py \
        /tmp/childsds src/data/growth-references
"""
import json
import os
import subprocess
import sys
import warnings

import rdata

warnings.filterwarnings("ignore")

# reference id -> (childsds dataset, {measurement: childsds item})
REFERENCES = {
    "IT-SIEDP": ("italian.ref", {"length": "heightall", "weight": "weightall"}),
    "IT-SIEDP-N": ("italian.ref", {"length": "height_N", "weight": "weight_N"}),
    "IT-SIEDP-S": ("italian.ref", {"length": "height_S", "weight": "weight_S"}),
    "DE-KIGGS": ("kiggs.ref", {"length": "height", "weight": "weight", "head_circumference": "hc"}),
    "BE-FLANDERS": ("belgium.ref", {"length": "height", "weight": "weight", "head_circumference": "hc"}),
    "NL-1997": ("nl4.ref", {"length": "heightN", "weight": "weightN", "head_circumference": "hcN"}),
    "NL-1997-TR": ("nl4.ref", {"length": "heightT", "weight": "weightT", "head_circumference": "hcT"}),
    "NL-1997-MA": ("nl4.ref", {"length": "heightM", "weight": "weightM", "head_circumference": "hcM"}),
    "CN-2005": ("zong13.ref", {"length": "height", "weight": "weight", "head_circumference": "hc"}),
}

LMS_DISTRIBUTIONS = {"BCCG", "BCCGo"}  # Box-Cox Cole-Green == LMS
SEXES = {"male": "1", "female": "2"}


def load_dataset(data_dir, name):
    parsed = rdata.parser.parse_file(os.path.join(data_dir, "data", f"{name}.rda"))
    return rdata.conversion.convert(parsed, default_encoding="utf8")[name]


def extract_item(item):
    out = {}
    for sex_name, sex_key in SEXES.items():
        dist = str(item.dist[sex_name][0])
        if dist not in LMS_DISTRIBUTIONS:
            raise ValueError(f"{item.item[0]}: {dist} is not an LMS distribution")
        df = item.params[sex_name]
        rows = []
        for _, r in df.iterrows():
            age_months = round(float(r["age"]) * 12, 4)
            rows.append([age_months, float(r["nu"]), float(r["mu"]), float(r["sigma"])])
        rows.sort(key=lambda row: row[0])
        out[sex_key] = rows
    return out


def main(childsds_dir, out_dir):
    version = next(
        line.split(":", 1)[1].strip()
        for line in open(os.path.join(childsds_dir, "DESCRIPTION"), encoding="utf8")
        if line.startswith("Version:")
    )
    commit = subprocess.run(
        ["git", "-C", childsds_dir, "rev-parse", "HEAD"], capture_output=True, text=True
    ).stdout.strip()
    os.makedirs(out_dir, exist_ok=True)
    cache = {}
    for ref_id, (dataset, items) in REFERENCES.items():
        if dataset not in cache:
            cache[dataset] = load_dataset(childsds_dir, dataset)
        refs = cache[dataset].refs
        data = {
            "id": ref_id,
            "provenance": {
                "extractedFrom": f"childsds {version} ({dataset})",
                "repository": "https://github.com/cran/childsds",
                "commit": commit,
                "items": items,
            },
            "columns": ["ageMonths", "L", "M", "S"],
            "lms": {m: extract_item(refs[item]) for m, item in items.items()},
        }
        path = os.path.join(out_dir, f"{ref_id.lower()}.json")
        with open(path, "w", encoding="utf8") as f:
            json.dump(data, f, separators=(",", ":"))
            f.write("\n")
        print(f"wrote {path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
