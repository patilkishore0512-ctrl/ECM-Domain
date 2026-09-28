# ECM Domain Agent

An AI assistant for **Electrical Condition Monitoring (ECM)**. Upload the technical specification of an electrical asset (transformer, switchgear, UPS or motor). The agent compares it against a condition-monitoring knowledge base and produces a **coverage and gap report**: which failure modes the spec monitors, which it misses, how severe each gap is, and what to add. A chat assistant then answers follow-up questions using both the knowledge base and the uploaded spec.

---

## How it works

```
 ┌──────────────── frontend (React, :3000) ────────────────┐
 │ Home → pick asset → upload spec → report + chat → PDF   │
 └───────────────┬───────────────────────────┬─────────────┘
                 │ POST /analyze             │ POST /chat
 ┌───────────────▼───────────────────────────▼─────────────┐
 │                 backend (FastAPI, :8000)                 │
 │                                                          │
 │  1. Parse spec (PDF / XLSX / DOCX)                       │
 │  2. RAG: embed query (Azure OpenAI) → FAISS top-k chunks │
 │     filtered by asset type                               │
 │  3. Claude: summarise spec's monitoring provisions       │
 │  4. Claude: compare against knowledge → JSON gap result  │
 │  5. Build report (coverage %, severity counts,           │
 │     prioritised recommendations)                         │
 └──────────────────────────────────────────────────────────┘
```

**Knowledge base.** On first start, the backend parses the PDF in `backend/knowledge/`. It splits the text into ~800-word chunks with 150-word overlap, tags each chunk with an asset type by keyword matching, embeds the chunks with `text-embedding-3-large` (3072-dim), and saves a FAISS index to `backend/knowledge/faiss_index/`. Later starts load the saved index from disk.

**Gap analysis (`/analyze`).**
1. Retrieves the 10 most relevant knowledge chunks for the chosen asset.
2. Asks Claude to extract the monitoring provisions from the uploaded spec.
3. Asks Claude to classify every known failure mode as `Covered` or `Gap`, with a severity (`High` / `Medium` / `Low`) and a recommendation.

**Chat (`/chat`).** Answers questions using the knowledge base, the last uploaded spec for that asset type, and the last 3 chat exchanges.

**Frontend pages.**

| Route              | Purpose                                                                  |
|--------------------|--------------------------------------------------------------------------|
| `/`                | Landing page with the four asset types (clears the previous session)    |
| `/asset/:assetId`  | Upload spec, run the analysis, view the report, chat, export to PDF      |
| `/dashboard`       | Coverage summary across all assets analysed in this browser session     |

Reports are kept in `sessionStorage`, so they last until the tab closes or you return to the home page.

---

## Repository structure

```
.
├── backend/                         FastAPI service (Python)
│   ├── main.py                      App, CORS, endpoints
│   ├── services/
│   │   ├── rag_service.py           FAISS index build/load, retrieval, per-asset spec store
│   │   ├── document_parser.py       Knowledge PDF chunking + spec parsing (PDF/XLSX/DOCX)
│   │   ├── gap_analyzer.py          Two-step Claude gap analysis → JSON
│   │   ├── report_generator.py      Coverage stats + prioritised recommendations
│   │   ├── chat_service.py          RAG + spec-aware Q&A
│   │   └── prompts.py               All LLM prompt templates
│   ├── knowledge/                   Source PDF (faiss_index/ is generated, git-ignored)
│   ├── requirements.txt
│   └── .env.example
├── frontend/                        React 19 app (Create React App)
│   ├── public/                      index.html, logos, asset images
│   ├── src/
│   │   ├── App.js                   Routes
│   │   └── components/              HomePage, AssetPage, DashboardPage, Layout, Header, Sidebar
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## Prerequisites

- **Python** 3.12
- **Node.js** 22+ and npm
- An **Azure OpenAI** resource with a `text-embedding-3-large` deployment
- A **Claude** endpoint and API key (Anthropic API or a compatible gateway)

---

## Running locally

Run the backend and frontend in **two separate terminals**.

### 1. Backend

**Windows (PowerShell)**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env        # then edit .env and add your keys
uvicorn main:app --reload --port 8000
```

**macOS / Linux**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then edit .env and add your keys
uvicorn main:app --reload --port 8000
```

Look for `RAG service ready.` in the log, then check the API:

- http://localhost:8000/health returns `{"status":"ok","rag_ready":true,...}`
- http://localhost:8000/rag/status shows the chunk count per asset type
- http://localhost:8000/docs has interactive Swagger docs

> **First run:** if `knowledge/faiss_index/` doesn't exist, the backend embeds the whole knowledge PDF (~1,250 chunks). This takes a few minutes and calls the Azure OpenAI embeddings API. Later starts load the saved index in seconds. To rebuild it, for example after replacing the PDF, delete `backend/knowledge/faiss_index/`.

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000.

If the backend runs somewhere other than `http://localhost:8000`, copy `.env.example` to `.env`, set `REACT_APP_API_BASE`, and restart `npm start`.

### 3. Try it

1. Choose an asset type on the home page.
2. Upload a technical specification (`.pdf`, `.xlsx` or `.docx`).
3. Click **Generate Coverage Report**.
4. Open the chat panel to ask follow-up questions, or click **Export Report** to download a PDF.
5. Open **Dashboard** in the sidebar to compare coverage across assets.

---

## API reference

| Method | Path          | Body                                                    | Returns                                  |
|--------|---------------|---------------------------------------------------------|------------------------------------------|
| GET    | `/health`     | —                                                       | Service status and loaded chunk count    |
| GET    | `/rag/status` | —                                                       | Index readiness and chunks per asset     |
| POST   | `/analyze`    | multipart: `file`, `asset_type`                         | Coverage report JSON                     |
| POST   | `/chat`       | JSON: `{ question, asset_type, history: [{role, content}] }` | `{ answer, asset_type }`             |

`asset_type` must be one of `transformer`, `switchgear`, `ups`, `motors`.

---

## Environment variables

**`backend/.env`**

| Variable                   | Required | Description                                                  |
|----------------------------|----------|--------------------------------------------------------------|
| `AZURE_OPENAI_API_KEY`     | yes      | Azure OpenAI key used for embeddings                         |
| `AZURE_OPENAI_ENDPOINT`    | yes      | Azure OpenAI endpoint URL                                    |
| `AZURE_OPENAI_DEPLOYMENT`  | yes      | Embedding deployment name (default `text-embedding-3-large`) |
| `AZURE_OPENAI_API_VERSION` | no       | Default `2024-10-21`                                         |
| `CLAUDE_ENDPOINT`          | yes      | Claude API base URL                                          |
| `CLAUDE_API_KEY`           | yes      | Claude API key                                               |
| `CLAUDE_DEPLOYMENT`        | yes      | Claude model / deployment name                               |
| `CLAUDE_API_VERSION`       | no       | Reserved; not currently read by the code                     |
| `CORS_ORIGINS`             | no       | Comma-separated allowed origins (default `http://localhost:3000`) |

**`frontend/.env`**

| Variable             | Required | Description                                          |
|----------------------|----------|------------------------------------------------------|
| `REACT_APP_API_BASE` | no       | Backend base URL (default `http://localhost:8000`)   |

> Never commit `.env` files. Only the `.env.example` templates are tracked.

---

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| `503 RAG service not ready` | The index failed to build or load. Check the backend log for errors, usually missing or invalid Azure OpenAI credentials or a missing knowledge PDF. |
| Browser shows a CORS error | The frontend origin isn't in `CORS_ORIGINS`. Add it and restart the backend. |
| `Failed to fetch` in the UI | The backend isn't running, or `REACT_APP_API_BASE` points to the wrong URL. |
| `400 Unsupported file type` | Only `.pdf`, `.xlsx` and `.docx` are supported. Save older `.doc` / `.xls` files in the newer format first. |
| Report says "Analysis failed — could not parse LLM response" | Claude returned invalid JSON. Retry. Very large specs are truncated before analysis. |
| `venv\Scripts\activate` doesn't work after moving the folder | A virtual environment can't be moved. Delete `venv/` and create it again. |
| PowerShell blocks `activate` | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once. |
