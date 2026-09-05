#!/usr/bin/env python3

import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("analysis", ROOT / "scripts" / "analyze_data.py")
analysis = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(analysis)


class AnalysisTests(unittest.TestCase):
    def test_rows_and_key_values(self):
        rows = analysis.read_rows()
        self.assertEqual(len(rows), 8)
        skills = next(row for row in rows if row["mixture"] == "Partner B Class 2 skills")
        self.assertEqual(skills["dexterity_pred_error"], 0.00301995)
        self.assertEqual(skills["dexterity_reverse_kl"], 0.00182561)

    def test_prediction_error_winners(self):
        rows = analysis.read_rows()
        winners = {
            family: min(rows, key=lambda row: row[f"{family}_pred_error"])["mixture"]
            for family in ("dexterity", "applications", "generalization")
        }
        self.assertEqual(winners, {
            "dexterity": "Partner B Class 2 skills",
            "applications": "Partner B Class 2 skills",
            "generalization": "Partner B Class 1",
        })

    def test_reported_application_tradeoff(self):
        rows = analysis.read_rows()
        skills = next(row for row in rows if row["mixture"] == "Partner B Class 2 skills")
        mixed = next(row for row in rows if row["mixture"] == "Partner A Class 2 + 3")
        pred_advantage = analysis.pct_difference(
            skills["applications_pred_error"], mixed["applications_pred_error"]
        )
        kl_disadvantage = (
            skills["applications_reverse_kl"] - mixed["applications_reverse_kl"]
        ) / mixed["applications_reverse_kl"] * 100
        self.assertEqual(round(pred_advantage, 2), 3.70)
        self.assertEqual(round(kl_disadvantage, 2), 6.00)


if __name__ == "__main__":
    unittest.main()
