"""Simple Python execution sandbox with Matplotlib capture."""

from __future__ import annotations

import base64
import io
import re
from contextlib import redirect_stdout
from typing import Dict, Optional

import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend to prevent crashes
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler


# Pre-loaded modules available in the sandbox
PRELOADED_MODULES = {
    "np": np,
    "numpy": np,
    "pd": pd,
    "pandas": pd,
    "plt": plt,
    "matplotlib": plt,
    "matplotlib.pyplot": plt,
    "sns": sns,
    "seaborn": sns,
    "PCA": PCA,
    "StandardScaler": StandardScaler,
}

SAFE_GLOBALS: Dict[str, object] = {
    "__builtins__": {
        "print": print,
        "range": range,
        "len": len,
        "sum": sum,
        "min": min,
        "max": max,
        "abs": abs,
        "round": round,
        "sorted": sorted,
        "list": list,
        "dict": dict,
        "tuple": tuple,
        "set": set,
        "zip": zip,
        "enumerate": enumerate,
        "int": int,
        "float": float,
        "str": str,
        "bool": bool,
        "map": map,
        "filter": filter,
        "True": True,
        "False": False,
        "None": None,
    },
    **PRELOADED_MODULES,
}


def _strip_imports(code: str) -> str:
    """Remove import statements since modules are pre-loaded."""
    lines = code.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # Skip import lines
        if stripped.startswith('import ') or stripped.startswith('from '):
            continue
        cleaned_lines.append(line)
    return '\n'.join(cleaned_lines)


def _plot_to_base64() -> Optional[str]:
    buf = io.BytesIO()
    if plt.get_fignums():
        plt.savefig(buf, format="png", bbox_inches="tight", dpi=150)
        plt.close("all")
        buf.seek(0)
        return base64.b64encode(buf.read()).decode("utf-8")
    return None


def run_code(code: str) -> Dict[str, Optional[str]]:
    stdout_buffer = io.StringIO()
    local_ns: Dict[str, object] = {}
    
    # Strip import statements since modules are pre-loaded
    cleaned_code = _strip_imports(code)

    try:
        with redirect_stdout(stdout_buffer):
            exec(cleaned_code, SAFE_GLOBALS, local_ns)
    except Exception as exc:  # pylint: disable=broad-except
        return {
            "stdout": stdout_buffer.getvalue(),
            "image_base64": None,
            "error": str(exc),
        }

    return {
        "stdout": stdout_buffer.getvalue(),
        "image_base64": _plot_to_base64(),
        "error": None,
    }
