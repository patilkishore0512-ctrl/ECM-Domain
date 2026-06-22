import os
import json
import pickle
import logging
from typing import List, Dict, Optional
from openai import AzureOpenAI
import faiss
import numpy as np
from services.document_parser import parse_knowledge_pdf

logger = logging.getLogger(__name__)

KNOWLEDGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge")
FAISS_INDEX_DIR = os.path.join(KNOWLEDGE_DIR, "faiss_index")
KNOWLEDGE_PDF = os.path.join(KNOWLEDGE_DIR, "4JNO000003-0816_Genix APM Predict Electrical Equipment_User Manual_Version 3.0 2.pdf")
INDEX_FILE = os.path.join(FAISS_INDEX_DIR, "index.faiss")
CHUNKS_FILE = os.path.join(FAISS_INDEX_DIR, "chunks.pkl")

EMBEDDING_DIMENSION = 3072  # text-embedding-3-large


class RAGService:
    def __init__(self):
        self.embedding_client: Optional[AzureOpenAI] = None
        self.claude_client = None
        self.index: Optional[faiss.Index] = None
        self.chunks: List[Dict] = []
        self._initialized = False
        # Stores uploaded spec text per asset_type for session-level chat context
        self._session_specs: Dict[str, str] = {}

    def initialize(self, embedding_client: AzureOpenAI, claude_client=None):
        self.embedding_client = embedding_client
        self.claude_client = claude_client

        if self._load_from_disk():
            logger.info(f"FAISS index loaded from disk — {len(self.chunks)} chunks")
            self._initialized = True
            return

        if not os.path.exists(KNOWLEDGE_PDF):
            raise FileNotFoundError(
                f"Knowledge PDF not found at {KNOWLEDGE_PDF}. "
                "Place ecm_user_manual.pdf in the knowledge/ folder."
            )

        logger.info("Building FAISS index from PDF (first run)...")
        self._build_index()
        self._initialized = True

    def _load_from_disk(self) -> bool:
        if os.path.exists(INDEX_FILE) and os.path.exists(CHUNKS_FILE):
            try:
                self.index = faiss.read_index(INDEX_FILE)
                with open(CHUNKS_FILE, "rb") as f:
                    self.chunks = pickle.load(f)
                return True
            except Exception as e:
                logger.warning(f"Failed to load FAISS index from disk: {e}")
        return False

    def _save_to_disk(self):
        os.makedirs(FAISS_INDEX_DIR, exist_ok=True)
        faiss.write_index(self.index, INDEX_FILE)
        with open(CHUNKS_FILE, "wb") as f:
            pickle.dump(self.chunks, f)
        logger.info(f"FAISS index saved to disk — {len(self.chunks)} chunks")

    def _build_index(self):
        self.chunks = parse_knowledge_pdf(KNOWLEDGE_PDF)
        logger.info(f"Parsed {len(self.chunks)} chunks from PDF")

        asset_counts = {}
        for chunk in self.chunks:
            at = chunk["asset_type"]
            asset_counts[at] = asset_counts.get(at, 0) + 1
        logger.info(f"Asset distribution: {asset_counts}")

        texts = [c["text"] for c in self.chunks]
        embeddings = self._embed_batch(texts)

        self.index = faiss.IndexFlatL2(EMBEDDING_DIMENSION)
        vectors = np.array(embeddings, dtype=np.float32)
        self.index.add(vectors)

        self._save_to_disk()

    def _embed_batch(self, texts: List[str], batch_size: int = 16) -> List[List[float]]:
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i: i + batch_size]
            batch = [t[:8000] for t in batch]  # token limit safety
            response = self.embedding_client.embeddings.create(
                model=os.getenv("AZURE_OPENAI_DEPLOYMENT", "text-embedding-3-large"),
                input=batch
            )
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)
            logger.info(f"Embedded batch {i // batch_size + 1} / {(len(texts) + batch_size - 1) // batch_size}")
        return all_embeddings

    def _embed_query(self, text: str) -> List[float]:
        response = self.embedding_client.embeddings.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT", "text-embedding-3-large"),
            input=[text[:8000]]
        )
        return response.data[0].embedding

    def query(self, query_text: str, asset_type: str, top_k: int = 8) -> str:
        if not self._initialized:
            raise RuntimeError("RAGService not initialized. Call initialize() first.")

        query_vector = np.array([self._embed_query(query_text)], dtype=np.float32)
        k_search = min(top_k * 5, len(self.chunks))
        distances, indices = self.index.search(query_vector, k_search)

        results = []
        for idx in indices[0]:
            if idx < 0 or idx >= len(self.chunks):
                continue
            chunk = self.chunks[idx]
            if chunk["asset_type"] in [asset_type, "general"]:
                results.append(chunk["text"])
            if len(results) >= top_k:
                break

        return "\n\n---\n\n".join(results)

    def get_all_asset_chunks(self, asset_type: str) -> str:
        matching = [
            c["text"] for c in self.chunks
            if c["asset_type"] in [asset_type, "general"]
        ]
        # Return first 50 chunks to avoid token overflow
        return "\n\n---\n\n".join(matching[:50])

    def store_spec(self, asset_type: str, spec_text: str):
        self._session_specs[asset_type] = spec_text
        logger.info(f"Stored uploaded spec for {asset_type} ({len(spec_text)} chars)")

    def get_spec(self, asset_type: str) -> str:
        return self._session_specs.get(asset_type, "")

    @property
    def is_ready(self) -> bool:
        return self._initialized


rag_service = RAGService()
