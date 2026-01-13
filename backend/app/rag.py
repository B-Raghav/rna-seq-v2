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
    path_obj = Path(pdf_path)
    if not path_obj.exists():
        return ""
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


def get_collection() -> chromadb.Collection:
    Path(CHROMA_DIR).mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(
        path=CHROMA_DIR,
        settings=Settings(allow_reset=True),
    )
    return client.get_or_create_collection("rna_seq_chunks")


def add_to_vector_store(chunks: List[str], collection: chromadb.Collection):
    if not chunks:
        return
    
    print(f"DEBUG: Adding {len(chunks)} chunks to vector store...")
    # Simple ID generation strategy: current count + index
    # Note: In a production app, you might want hash-based IDs or UUIDs
    # to avoid duplicates if the same file is uploaded twice.
    current_count = collection.count()
    
    print("DEBUG: Loading SentenceTransformer model...")
    embedder = SentenceTransformer(EMBED_MODEL)
    print("DEBUG: Encoding chunks...")
    embeddings = embedder.encode(chunks, normalize_embeddings=True)
    print("DEBUG: Finished encoding. Adding to collection...")
    
    collection.add(
        documents=chunks,
        embeddings=embeddings.tolist(),
        ids=[f"chunk-{current_count + i}" for i in range(len(chunks))],
    )
    print("DEBUG: Added to collection.")


def process_pdf(pdf_path: str):
    """Reads a PDF, chunks it, and adds it to the vector store."""
    print(f"DEBUG: Processing PDF locally: {pdf_path}")
    text = load_pdf_text(pdf_path)
    if not text:
        print("DEBUG: No text found in PDF.")
        return 0
    
    print(f"DEBUG: Extracted {len(text)} characters.")
    chunks = chunk_text(text)
    print(f"DEBUG: Created {len(chunks)} chunks.")
    collection = get_collection()
    add_to_vector_store(chunks, collection)
    return len(chunks)


def retrieve(query: str, top_k: int = 4) -> List[Tuple[str, float]]:
    collection = get_collection()
    
    # If empty, try to load default PDF
    if collection.count() == 0:
         process_pdf(PDF_PATH)
    
    # If still empty, return nothing
    if collection.count() == 0:
        return []

    embedder = SentenceTransformer(EMBED_MODEL)
    query_embedding = embedder.encode([query], normalize_embeddings=True)[0]
    results = collection.query(query_embeddings=[query_embedding.tolist()], n_results=top_k)
    documents = results.get("documents", [[]])[0]
    distances = results.get("distances", [[]])[0]
    return list(zip(documents, distances))
