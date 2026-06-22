import os
import logging
from typing import List, Dict
from services.prompts import CHAT_PROMPT
from services.rag_service import rag_service

logger = logging.getLogger(__name__)


def _format_history(history: List[Dict]) -> str:
    if not history:
        return "No previous messages."
    lines = []
    for msg in history[-6:]:  # Last 3 exchanges
        role = "Engineer" if msg.get("role") == "user" else "Assistant"
        lines.append(f"{role}: {msg.get('content', '')}")
    return "\n".join(lines)


def answer_question(
    claude_client,
    question: str,
    asset_type: str,
    chat_history: List[Dict] = None
) -> str:
    if chat_history is None:
        chat_history = []

    # Source 1: RAG knowledge base
    knowledge_context = rag_service.query(question, asset_type, top_k=6)

    # Source 2: Uploaded tech spec for this session
    spec_text = rag_service.get_spec(asset_type)
    spec_context = spec_text[:4000] if spec_text else "No technical specification uploaded for this session."

    prompt = CHAT_PROMPT.format(
        asset_type=asset_type,
        knowledge_context=knowledge_context[:6000],
        spec_context=spec_context,
        chat_history=_format_history(chat_history),
        question=question
    )

    response = claude_client.messages.create(
        model=os.getenv("CLAUDE_DEPLOYMENT", "claude-sonnet-4-6"),
        max_tokens=1024,
        system=(
            f"You are an expert ECM engineer for {asset_type} assets and general electrical systems. "
            "Answer from provided sources or your own deep electrical engineering knowledge. "
            "Never refuse a question just because it is not in the provided context."
        ),
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text.strip()
