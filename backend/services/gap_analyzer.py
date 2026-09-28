import os
import json
import logging
from typing import Dict, Any
from services.prompts import GAP_ANALYSIS_PROMPT, SPEC_EXTRACT_PROMPT

logger = logging.getLogger(__name__)


def _call_claude(claude_client, system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> str:
    response = claude_client.messages.create(
        model=os.getenv("CLAUDE_DEPLOYMENT", "claude-sonnet-4-6"),
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}]
    )
    return response.content[0].text.strip()


def extract_spec_summary(claude_client, spec_text: str) -> str:
    prompt = SPEC_EXTRACT_PROMPT.format(spec_text=spec_text[:12000])
    return _call_claude(
        claude_client,
        "You are an electrical engineering document analyst. Extract monitoring information precisely.",
        prompt,
        max_tokens=2048
    )


def analyze_gaps(
    claude_client,
    asset_type: str,
    spec_text: str,
    knowledge_context: str
) -> Dict[str, Any]:
    # First summarize the spec to reduce tokens and focus analysis
    logger.info(f"Extracting monitoring summary from uploaded spec...")
    spec_summary = extract_spec_summary(claude_client, spec_text)
    logger.info(f"Spec summary extracted ({len(spec_summary)} chars)")

    prompt = GAP_ANALYSIS_PROMPT.format(
        asset_type=asset_type,
        knowledge_context=knowledge_context[:10000],
        tech_spec=spec_summary[:6000]
    )

    logger.info(f"Running gap analysis for {asset_type}...")
    raw_response = _call_claude(
        claude_client,
        "You are an ECM gap analysis expert. Always return valid JSON only.",
        prompt,
        max_tokens=4096
    )

    result = _parse_json_response(raw_response, asset_type)
    return result


def _parse_json_response(raw: str, asset_type: str) -> Dict[str, Any]:
    # Strip markdown code fences if present
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

    try:
        data = json.loads(text)
        return data
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse failed: {e}\nRaw response: {raw[:500]}")
        # Return a minimal fallback structure so the API doesn't crash
        return {
            "asset_type": asset_type,
            "overall_coverage_percent": 0,
            "total_failure_modes": 0,
            "covered_count": 0,
            "gap_count": 0,
            "failure_modes": [],
            "critical_gaps": ["Analysis failed — could not parse LLM response"],
            "summary": "Gap analysis encountered an error. Please try again."
        }
