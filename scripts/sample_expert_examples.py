#!/usr/bin/env python3
"""Pick 6 examples per expert (3 ground_truth true, 3 false).

Positives: the 3 with highest ``max_activation`` (ties broken by lowest ``id``).
Negatives: ``random.sample`` of 3 among all ground_truth=false rows (no
replacement), using ``NEGATIVE_SAMPLE_SEED`` for reproducibility. Experts in the
output are sorted by ``expert_id``.
"""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parent.parent
_DEFAULT_INPUT = _REPO_ROOT / "expert_all_explainations.json"
_DEFAULT_OUTPUT = _REPO_ROOT / "src" / "imports" / "expert-sample.json"

EXAMPLES_PER_EXPERT = 6
N_TRUE = N_FALSE = EXAMPLES_PER_EXPERT // 2
NEGATIVE_SAMPLE_SEED = 42


def _max_activation(ex: dict[str, Any]) -> float:
    v = ex.get("max_activation")
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        return float("-inf")
    return float(v)


def _split_by_ground_truth(
    examples: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    pos, neg = [], []
    for ex in examples:
        if not isinstance(ex, dict):
            continue
        if ex.get("ground_truth") is True:
            pos.append(ex)
        else:
            neg.append(ex)
    pos.sort(key=lambda e: (-_max_activation(e), e.get("id", 0)))
    return pos, neg


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "input",
        nargs="?",
        type=Path,
        default=_DEFAULT_INPUT,
        help=f"Expert JSON (array of experts). Default: {_DEFAULT_INPUT.name} at repo root.",
    )
    p.add_argument(
        "-o",
        "--output",
        type=Path,
        default=_DEFAULT_OUTPUT,
        help=f"Sampled JSON path. Default: {_DEFAULT_OUTPUT.relative_to(_REPO_ROOT)}",
    )
    args = p.parse_args()

    random.seed(NEGATIVE_SAMPLE_SEED)

    raw = json.loads(args.input.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise SystemExit("Expected top-level JSON array of experts.")

    out: list[dict[str, Any]] = []
    total_true = 0
    total_false = 0

    for row in raw:
        if not isinstance(row, dict):
            raise SystemExit("Each expert entry must be a JSON object.")
        eid = row.get("expert_id")
        if not isinstance(eid, int):
            raise SystemExit(f"expert_id must be int, got {eid!r}")
        examples = row.get("examples")
        if not isinstance(examples, list):
            raise SystemExit(f"expert_id={eid!r}: missing or invalid 'examples'.")

        pos, neg = _split_by_ground_truth(examples)
        if len(pos) < N_TRUE or len(neg) < N_FALSE:
            raise SystemExit(
                f"expert_id={eid!r}: need ≥{N_TRUE} ground_truth=true "
                f"and ≥{N_FALSE} ground_truth=false (have {len(pos)} / {len(neg)})."
            )

        neg_pick = random.sample(neg, N_FALSE)
        picked = pos[:N_TRUE] + neg_pick
        picked.sort(key=lambda e: e.get("id", 0))

        total_true += N_TRUE
        total_false += N_FALSE

        new_row = {**row, "examples": picked}
        out.append(new_row)

    out.sort(key=lambda r: r["expert_id"])

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    n_experts = len(out)
    print(
        f"Wrote {n_experts} experts to {args.output} "
        f"(negatives sampled with seed={NEGATIVE_SAMPLE_SEED})"
    )
    print(f"  ground_truth=true: {total_true}, ground_truth=false: {total_false}")
    expected = n_experts * EXAMPLES_PER_EXPERT
    if total_true + total_false != expected:
        raise SystemExit("internal count mismatch")
    if total_true != total_false:
        raise SystemExit(
            f"Expected equal ground_truth true/false totals; got {total_true} vs {total_false}"
        )


if __name__ == "__main__":
    main()
