#!/usr/bin/env python3
"""Pick N examples per expert with fixed ground_truth balance (no randomness).

Default: 5 per expert, global totals 50/50 — for 32 experts → 160 rows (80
ground_truth true, 80 false). With odd ``--num``, each expert gets either
``(num+1)/2`` positives and ``(num-1)/2`` negatives or the swap; even
``expert_id`` gets the extra positive, odd ``expert_id`` the extra negative, so
with 16 even and 16 odd IDs the dataset is balanced. Examples are chosen
deterministically (lowest ``id`` first within each class). Input order does
not matter.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parent.parent
_DEFAULT_INPUT = _REPO_ROOT / "expert_all_explainations.json"
_DEFAULT_OUTPUT = _REPO_ROOT / "src" / "imports" / "expert-sample.json"


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
    pos.sort(key=lambda e: e.get("id", 0))
    neg.sort(key=lambda e: e.get("id", 0))
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
    p.add_argument(
        "-n",
        "--num",
        type=int,
        default=5,
        help="Examples per expert (default: 5). Must be odd for a 50/50 global split with alternating (k+1)/2 and (k-1)/2 per half of experts.",
    )
    args = p.parse_args()

    if args.num < 1:
        raise SystemExit("--num must be >= 1")
    if args.num % 2 == 0:
        raise SystemExit(
            "For global 50/50 split with alternating per-expert quotas, --num must be odd (e.g. 5)."
        )

    half = (args.num + 1) // 2
    low = args.num - half  # e.g. n=5 → half=3, low=2

    raw = json.loads(args.input.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise SystemExit("Expected top-level JSON array of experts.")

    expert_ids: list[int] = []
    for row in raw:
        if not isinstance(row, dict):
            raise SystemExit("Each expert entry must be a JSON object.")
        eid = row.get("expert_id")
        if not isinstance(eid, int):
            raise SystemExit(f"expert_id must be int, got {eid!r}")
        expert_ids.append(eid)

    n_even_id = sum(1 for i in expert_ids if i % 2 == 0)
    n_odd_id = len(expert_ids) - n_even_id
    if n_even_id != n_odd_id:
        raise SystemExit(
            "For a 50/50 global ground_truth split with alternating per-expert "
            f"quotas, need equal counts of even vs odd expert_id (got {n_even_id} even, "
            f"{n_odd_id} odd among {len(expert_ids)} experts)."
        )

    out: list[dict[str, Any]] = []
    total_true = 0
    total_false = 0

    for row in raw:
        examples = row.get("examples")
        if not isinstance(examples, list):
            raise SystemExit(f"expert_id={row.get('expert_id')!r}: missing or invalid 'examples'.")

        pos, neg = _split_by_ground_truth(examples)
        eid = row["expert_id"]
        # Even expert_id: more positives; odd: more negatives → 50/50 when counts of each parity match.
        if eid % 2 == 0:
            n_true, n_false = half, low
        else:
            n_true, n_false = low, half

        if len(pos) < n_true or len(neg) < n_false:
            raise SystemExit(
                f"expert_id={row.get('expert_id')!r}: need ≥{n_true} ground_truth=true "
                f"and ≥{n_false} ground_truth=false (have {len(pos)} / {len(neg)})."
            )

        picked = pos[:n_true] + neg[:n_false]
        picked.sort(key=lambda e: e.get("id", 0))

        total_true += n_true
        total_false += n_false

        new_row = {**row, "examples": picked}
        out.append(new_row)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    n_experts = len(out)
    print(f"Wrote {n_experts} experts to {args.output}")
    print(f"  ground_truth=true: {total_true}, ground_truth=false: {total_false}")
    expected = n_experts * args.num
    if total_true + total_false != expected:
        raise SystemExit("internal count mismatch")
    if total_true != total_false:
        raise SystemExit(
            f"Expected equal ground_truth true/false totals; got {total_true} vs {total_false}"
        )


if __name__ == "__main__":
    main()
