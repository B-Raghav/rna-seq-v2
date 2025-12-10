# Backend

FastAPI backend for the RNA-seq Visual Assistant.

## Components
- `app/main.py` – FastAPI app with `/health`, `/chat`, `/run-code`
- `config.py` – Loads env vars + constants (Ollama, paths)
- `rag.py` – PDF loading, chunking, embeddings, retrieval, prompt assembly
- `code_executor.py` – Sandboxed Python execution, stdout + base64 plots
- `models.py` – Pydantic models for requests/responses
- `utils.py` – Shared helpers (chunking, image encoding, etc.)

## RAG Pipeline
1. Load `backend/data/rna_seq_tutorial.pdf`
2. Chunk text (500–800 chars, overlap)
3. Embed with SentenceTransformers `all-MiniLM-L6-v2`
4. Persist vectors in `backend/vectorstore/chroma`
5. Retrieve top matches per query and send to Ollama Mistral via `/api/chat`
6. Return markdown answer + cited snippets

## Code Execution
- Supports matplotlib/seaborn plots via base64 images
- Limited safe builtins (`print`, `range`, etc.) plus `np`, `pd`, `plt`, `sns`
- Response: `{stdout, image_base64, error}`

## Running
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
