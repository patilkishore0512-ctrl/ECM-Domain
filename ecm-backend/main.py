import os
import logging
import tempfile
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from openai import AzureOpenAI
import anthropic

from services.rag_service import rag_service
from services.document_parser import parse_tech_spec
from services.gap_analyzer import analyze_gaps
from services.report_generator import build_report
from services.chat_service import answer_question

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

VALID_ASSET_TYPES = {"transformer", "switchgear", "ups", "motors"}

embedding_client: Optional[AzureOpenAI] = None
claude_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global embedding_client, claude_client

    embedding_client = AzureOpenAI(
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21")
    )

    claude_client = anthropic.Anthropic(
        api_key=os.getenv("CLAUDE_API_KEY"),
        base_url=os.getenv("CLAUDE_ENDPOINT")
    )

    logger.info("Initializing RAG service...")
    try:
        rag_service.initialize(embedding_client, claude_client)
        logger.info("RAG service ready.")
    except Exception as e:
        logger.error(f"RAG initialization failed: {e}")

    yield

    logger.info("Shutting down ECM backend.")


app = FastAPI(title="ECM Domain Agent API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "rag_ready": rag_service.is_ready,
        "chunks_loaded": len(rag_service.chunks)
    }


@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    asset_type: str = Form(...)
):
    if asset_type not in VALID_ASSET_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid asset_type. Must be one of: {VALID_ASSET_TYPES}")

    if not rag_service.is_ready:
        raise HTTPException(status_code=503, detail="RAG service not ready. Please wait and retry.")

    filename = file.filename or "uploaded_file"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "pdf"

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        logger.info(f"Parsing tech spec: {filename}")
        spec_text = parse_tech_spec(tmp_path, ext)

        logger.info(f"Querying knowledge base for {asset_type}...")
        knowledge_context = rag_service.query(
            f"{asset_type} failure modes monitoring condition assessment",
            asset_type,
            top_k=10
        )

        logger.info("Running gap analysis...")
        gap_result = analyze_gaps(claude_client, asset_type, spec_text, knowledge_context)

        # Store spec in session so chat can reference it
        rag_service.store_spec(asset_type, spec_text)

        report = build_report(gap_result, asset_type, filename)
        return report

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)


class ChatRequest(BaseModel):
    question: str
    asset_type: str
    history: List[Dict] = []


@app.post("/chat")
async def chat(request: ChatRequest):
    if request.asset_type not in VALID_ASSET_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid asset_type.")

    if not rag_service.is_ready:
        raise HTTPException(status_code=503, detail="RAG service not ready.")

    try:
        answer = answer_question(
            claude_client,
            request.question,
            request.asset_type,
            request.history
        )
        return {"answer": answer, "asset_type": request.asset_type}
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/rag/status")
async def rag_status():
    if not rag_service.is_ready:
        return {"ready": False, "message": "Index not built yet"}

    from collections import Counter
    asset_counts = Counter(c["asset_type"] for c in rag_service.chunks)
    return {
        "ready": True,
        "total_chunks": len(rag_service.chunks),
        "asset_distribution": dict(asset_counts)
    }
