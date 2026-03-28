#!/usr/bin/env python3
"""One-off: randomly sample N examples per expert; keep prediction and original id."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parent.parent
_DEFAULT_INPUT = _REPO_ROOT / "expert_all_explainations.json"
_DEFAULT_OUTPUT = _REPO_ROOT / "src" / "imports" / "expert-sample.json"


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
        help="Max examples per expert (default: 5).",
    )
    p.add_argument(
        "--seed",
        type=int,
        default=42,
        help="RNG seed for reproducible sampling (default: 42).",
    )
    args = p.parse_args()

    raw = json.loads(args.input.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise SystemExit("Expected top-level JSON array of experts.")

    random.seed(args.seed)
    out: list[dict[str, Any]] = []

    for row in raw:
        if not isinstance(row, dict):
            raise SystemExit("Each expert entry must be a JSON object.")
        examples = row.get("examples")
        if not isinstance(examples, list):
            raise SystemExit(f"expert_id={row.get('expert_id')!r}: missing or invalid 'examples'.")

        k = min(args.num, len(examples))
        picked = random.sample(examples, k=k) if k else []
        # Stable ordering in file: by original example id
        picked.sort(key=lambda e: e.get("id", 0) if isinstance(e, dict) else 0)

        new_row = {**row, "examples": picked}
        out.append(new_row)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(out)} experts to {args.output}")


if __name__ == "__main__":
    main()
