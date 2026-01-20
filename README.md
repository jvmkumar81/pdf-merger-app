# PDF Merger App


This repository contains a minimal React frontend (Vite) with the `PDFMerger` UI component you provided and a small FastAPI backend which attempts to integrate the existing Python script `combinePdfs.py` .

Quick start (Windows):

1. Backend

- Create and activate a Python virtualenv, then install dependencies:

```powershell
python -m venv pdfmerger
.\\pdfmerger\\Scripts\\Activate.ps1
pip install -r backend/requirements.txt
```

- Run backend:

```powershell
cd backend
uvicorn app:app --reload --port 8001```

The backend exposes `POST /api/merge` that accepts multipart `files` and returns the merged PDF.

2. Frontend

- Install node deps and run dev server:

```bash
cd frontend
npm install
npm run dev
```

Open the dev server URL shown by Vite (usually `http://localhost:5173`). The UI will merge PDFs client-side using `pdf-lib` (CDN import). The frontend also contains a function to call the backend `POST /api/merge` if you prefer server-side merging.