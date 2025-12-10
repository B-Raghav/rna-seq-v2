"""FastAPI app wiring RAG + code executor endpoints."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests

from .code_executor import run_code
from .config import OLLAMA_MODEL, OLLAMA_URL
from .models import (
    ChatRequest,
    ChatResponse,
    CodeRunRequest,
    CodeRunResponse,
    SourceChunk,
)
from .rag import retrieve
from .utils import format_sources

app = FastAPI(title="RNA-seq Visual Assistant")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest) -> ChatResponse:
    retrieved = retrieve(request.question)
    sources = [chunk for chunk, _score in retrieved]
    context_block = format_sources(sources)

    system_prompt = """You are an RNA-seq analysis assistant.

ANSWERING RULES:
- Answer based on the PDF context below
- Be concise

VISUALIZATION CODE RULES - FOLLOW EXACTLY:
- COPY the template code EXACTLY as shown - do not modify it
- Do NOT use .columns, .T, enumerate(), or for loops on data
- Do NOT use import statements
- These are pre-loaded: np, pd, plt, sns, PCA, StandardScaler

When asked for a VOLCANO PLOT, output THIS EXACT CODE:
```python
n_genes = 500
log2fc = np.random.normal(0, 1.5, n_genes)
pvalues = np.random.uniform(0.001, 1, n_genes)
colors = ['red' if (abs(fc) > 1 and p < 0.05) else 'gray' for fc, p in zip(log2fc, pvalues)]
fig, ax = plt.subplots(figsize=(8, 6))
ax.scatter(log2fc, -np.log10(pvalues), c=colors, alpha=0.6, s=20)
ax.axhline(-np.log10(0.05), color='blue', linestyle='--')
ax.axvline(-1, color='green', linestyle='--')
ax.axvline(1, color='green', linestyle='--')
ax.set_xlabel('Log2 Fold Change')
ax.set_ylabel('-Log10 P-value')
ax.set_title('Volcano Plot')
plt.tight_layout()
plt.show()
```

When asked for a PCA PLOT, output THIS EXACT CODE:
```python
n_samples, n_genes = 20, 100
data = np.random.randn(n_samples, n_genes)
conditions = ['Control']*10 + ['Treated']*10
pca = PCA(n_components=2)
coords = pca.fit_transform(data)
colors = ['steelblue' if c == 'Control' else 'firebrick' for c in conditions]
fig, ax = plt.subplots(figsize=(8, 6))
ax.scatter(coords[:, 0], coords[:, 1], c=colors, s=100)
ax.set_xlabel('PC1')
ax.set_ylabel('PC2')
ax.set_title('PCA Plot')
plt.tight_layout()
plt.show()
```

When asked for a HEATMAP, output THIS EXACT CODE:
```python
data = np.random.randn(20, 10)
fig, ax = plt.subplots(figsize=(10, 8))
im = ax.imshow(data, cmap='RdBu_r', aspect='auto')
plt.colorbar(im, ax=ax, label='Expression')
ax.set_xlabel('Samples')
ax.set_ylabel('Genes')
ax.set_title('Gene Expression Heatmap')
plt.tight_layout()
plt.show()
```

CONTEXT FROM PDF:
{context}"""

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {
                "role": "system",
                "content": system_prompt.format(context=context_block),
            },
            {"role": "user", "content": request.question},
        ],
        "stream": False,
    }

    try:
        response = requests.post(f"{OLLAMA_URL}/api/chat", json=payload, timeout=120)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    data = response.json()
    answer = data.get("message", {}).get("content", "")
    return ChatResponse(
        answer=answer,
        sources=[SourceChunk(chunk=chunk) for chunk in sources],
    )


@app.post("/run-code", response_model=CodeRunResponse)
def run_code_endpoint(request: CodeRunRequest) -> CodeRunResponse:
    result = run_code(request.code)
    return CodeRunResponse(**result)
