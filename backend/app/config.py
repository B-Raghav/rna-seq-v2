"""Core configuration constants for the RNA-seq Visual Assistant backend."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")

# Use absolute paths based on this file's location
_BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
PDF_PATH = str(_BASE_DIR / "data" / "rna_seq_tutorial.pdf")
CHROMA_DIR = str(_BASE_DIR / "vectorstore" / "chroma")
EMBED_MODEL = "all-MiniLM-L6-v2"
