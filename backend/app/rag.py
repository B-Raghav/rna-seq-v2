"""Lightweight RAG utilities (PDF -> chunks -> embeddings -> retrieval)."""

from __future__ import annotations

from pathlib import Path
from typing import List, Tuple

import chromadb
from chromadb.config import Settings
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer

from .config import CHROMA_DIR, EMBED_MODEL, PDF_PATH


def load_pdf_text(pdf_path: str = PDF_PATH) -> str:
    reader = PdfReader(pdf_path)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return [c.strip() for c in chunks if c.strip()]


def build_vector_store(chunks: List[str]) -> chromadb.Collection:
    Path(CHROMA_DIR).mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(
        path=CHROMA_DIR,
        settings=Settings(allow_reset=True),
    )
    collection = client.get_or_create_collection("rna_seq_chunks")

    if collection.count() == 0:
        embedder = SentenceTransformer(EMBED_MODEL)
        embeddings = embedder.encode(chunks, normalize_embeddings=True)
        collection.add(
            documents=chunks,
            embeddings=embeddings.tolist(),
            ids=[f"chunk-{i}" for i in range(len(chunks))],
        )
    return collection


def retrieve(query: str, top_k: int = 4) -> List[Tuple[str, float]]:
    text = load_pdf_text()
    collection = build_vector_store(chunk_text(text))
    embedder = SentenceTransformer(EMBED_MODEL)
    query_embedding = embedder.encode([query], normalize_embeddings=True)[0]
    results = collection.query(query_embeddings=[query_embedding.tolist()], n_results=top_k)
    documents = results.get("documents", [[]])[0]
    distances = results.get("distances", [[]])[0]
    return list(zip(documents, distances))
