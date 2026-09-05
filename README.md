# Generalist robot evaluation brief

An independent application demo prepared by Cathy Liu for Generalist's Research Assistant role.

The demo turns the eight data-mixture measurements in Table 1 of Generalist's GEN-0 article into a transparent experiment-prioritization tool. It does not claim access to Generalist's private trajectories, robots, models, or internal evaluation system.

## What it does

- compares prediction error and reverse KL for dexterity, applications, and generalization;
- exposes the weighting used to prioritize a data mixture rather than hiding it in a score;
- selects an informative A/B contrast and produces a controlled real-robot test plan;
- estimates the per-arm rollout count for a planned absolute success-rate improvement;
- keeps all source rows, formulas, assumptions, and limits visible.

## Reproduce the checked findings

```bash
python3 scripts/analyze_data.py
python3 -m unittest tests/test_analysis.py
```

## Source and license note

The eight measurement rows were transcribed from Table 1 in Generalist Team, “GEN-0: Embodied Foundation Models That Scale with Physical Interaction” (November 2025): <https://generalistai.com/blog/gen-0>. Generalist's page is cited as the source; this repository does not imply that its article content is relicensed.

Site code in this repository is released under the MIT License.
