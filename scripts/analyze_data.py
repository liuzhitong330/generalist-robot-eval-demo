#!/usr/bin/env python3
"""Reproduce the checked findings displayed in the Generalist demo."""

from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "generalist_gen0_table1.csv"


def read_rows():
    with DATA.open(newline="", encoding="utf-8") as handle:
        return [
            {key: (float(value) if key != "mixture" else value) for key, value in row.items()}
            for row in csv.DictReader(handle)
        ]


def pct_difference(lower: float, higher: float) -> float:
    return (higher - lower) / higher * 100


def main():
    rows = read_rows()
    skills = next(row for row in rows if row["mixture"] == "Partner B Class 2 skills")
    mixed = next(row for row in rows if row["mixture"] == "Partner A Class 2 + 3")

    pred_wins = {}
    kl_wins = {}
    for family in ("dexterity", "applications", "generalization"):
        pred_key = f"{family}_pred_error"
        kl_key = f"{family}_reverse_kl"
        pred_wins[family] = min(rows, key=lambda row: row[pred_key])["mixture"]
        kl_wins[family] = min(rows, key=lambda row: row[kl_key])["mixture"]

    result = {
        "rows": len(rows),
        "prediction_error_winners": pred_wins,
        "reverse_kl_winners": kl_wins,
        "checked_findings": {
            "partner_b_class_2_skills_prediction_error_wins": sum(
                winner == "Partner B Class 2 skills" for winner in pred_wins.values()
            ),
            "applications_prediction_error_advantage_pct_vs_a_2_plus_3": round(
                pct_difference(
                    skills["applications_pred_error"], mixed["applications_pred_error"]
                ),
                2,
            ),
            "applications_reverse_kl_disadvantage_pct_vs_a_2_plus_3": round(
                (skills["applications_reverse_kl"] - mixed["applications_reverse_kl"])
                / mixed["applications_reverse_kl"]
                * 100,
                2,
            ),
        },
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
