"""Misc helpers for prompt construction and formatting."""

from typing import List


def format_sources(chunks: List[str]) -> str:
    return "\n\n".join(f"Source {idx+1}:\n{chunk}" for idx, chunk in enumerate(chunks))
