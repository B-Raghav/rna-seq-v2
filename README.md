# RNA-seq Visual Assistant

A local RAG chatbot + Python visualization runner for RNA-seq analysis.

## 🚀 Features
- PDF-based Retrieval-Augmented Generation
- Local LLM: Ollama + Mistral
- Generates executable Python visualization code
- Run plots inside the chat UI
- Windows + Mac supported

## 🛠 Installation

### 1. Install Ollama

Download from https://ollama.com

```bash
ollama pull mistral
```

### 2. Backend Setup

**Mac:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Windows (CMD):**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate.bat
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

## 🧪 API Endpoints
- GET /health
- POST /chat
- POST /run-code

## 📁 Project Structure
```
rna-seq-v2/
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI app
│   │   ├── config.py      # Configuration
│   │   ├── rag.py         # RAG pipeline
│   │   ├── code_executor.py # Python sandbox
│   │   ├── models.py      # Pydantic models
│   │   └── utils.py       # Utilities
│   ├── data/
│   │   └── rna_seq_tutorial.pdf
│   ├── vectorstore/       # ChromaDB (auto-created)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

## 🧬 How It Works
1. PDF is loaded and split into chunks
2. SentenceTransformers embeds chunks
3. ChromaDB stores and retrieves relevant context
4. Ollama Mistral generates answers and Python code
5. Code runs in a sandboxed executor with matplotlib

## ⚠️ Troubleshooting

**Windows: "python not found"**
- Use `python3` or ensure Python is in your PATH

**"Unable to fetch answer"**
- Make sure Ollama is running: `ollama serve`
- Check backend is on port 8000

**Matplotlib errors on Mac**
- Already fixed: uses 'Agg' backend

## 📜 License
MIT
