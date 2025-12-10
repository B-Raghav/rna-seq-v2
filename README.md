# RNA-seq Visual Assistant

A local RAG chatbot + Python visualization runner.

## 🚀 Features
- PDF-based Retrieval-Augmented Generation
- Local LLM: Ollama + Mistral
- Generates executable Python visualization code
- Run plots inside the chat UI
- Windows + Mac supported
- Zero LangChain dependency → super stable

## 🛠 Installation

### 1. Install Ollama

https://ollama.com

```bash
ollama pull mistral
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
# Windows
venv\\Scripts\\activate
# Mac
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## 🧪 API Testing
- GET /health
- POST /chat
- POST /run-code

## 🧱 Project Structure
```
rna-seq-visual-assistant/
├─ backend/
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ config.py
│  │  ├─ rag.py
│  │  ├─ code_executor.py
│  │  ├─ models.py
│  │  ├─ utils.py
│  │  └─ __init__.py
│  ├─ data/
│  │  └─ rna_seq_tutorial.pdf
│  ├─ vectorstore/
│  │  └─ chroma/
│  ├─ requirements.txt
│  └─ README.md
├─ frontend/
│  └─ README.md
└─ README.md
```

## 🧬 RAG Pipeline Description
- Load PDF
- Split into 500–800 char overlapping chunks
- Embed via SentenceTransformers (`all-MiniLM-L6-v2`)
- Persist in ChromaDB (`backend/vectorstore/chroma`)
- Retrieve relevant chunks for each query
- Build system prompt enforcing PDF-only answers + self-contained Python code
- Call Ollama Mistral via `POST /api/chat`
- Return Markdown answer plus cited chunks

## ✨ Acknowledgments
PDF source: *Unlocking Biological Insights: A Data Science Primer for RNA-seq Analysis*

## 🔒 Disclaimer
Python code execution is sandboxed but not secure for untrusted users. Use only locally.

## 📜 License
MIT
