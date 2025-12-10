# Frontend

Anity Gravity + React UI for RNA-seq Visual Assistant. Keep interface clean: focused chat column, markdown rendering, code blocks with run button + output panes.

## Features
- Chat transcript with PDF-backed answers
- `react-markdown` display
- Custom code block component with Run button hitting `/run-code`
- stdout/image/error panes with skeleton loaders
- Smooth scroll to latest message

## Getting Started
```bash
npm install
npm run dev
```

Optional: create `.env` with `VITE_API_BASE=http://localhost:8000`.
