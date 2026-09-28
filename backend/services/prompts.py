ASSET_CLASSIFY_PROMPT = """You are an electrical engineering expert. Read the following text chunk extracted from a technical manual and determine which electrical asset type it primarily belongs to.

Asset types:
- transformer: power transformers, distribution transformers, winding, Buchholz, tap changer, DGA, oil, core
- switchgear: circuit breakers, SF6, busbar, arc flash, CB, contactors, switchboard, MV/LV panels
- ups: battery, inverter, rectifier, charger, IGBT, bypass, UPS, static switch
- motors: rotor, stator, bearing, shaft, insulation resistance, slip, induction motor, winding temperature
- general: introduction, index, standards references, general electrical theory (not specific to one asset)

Text chunk:
{chunk}

Respond with ONLY one word: transformer, switchgear, ups, motors, or general."""


ASSET_CLASSIFY_SYSTEM = "You are an electrical asset classification expert. Respond with exactly one word."


GAP_ANALYSIS_PROMPT = """You are an expert Electrical Condition Monitoring (ECM) engineer specializing in {asset_type} assets.

## Knowledge Base (Known Failure Modes & Monitoring Requirements)
{knowledge_context}

## Uploaded Technical Specification
{tech_spec}

## Your Task
Analyze the uploaded technical specification against the knowledge base. For each known failure mode or monitoring requirement in the knowledge base, determine whether adequate monitoring coverage exists in the tech spec.

Return a JSON object with this exact structure:
{{
  "asset_type": "{asset_type}",
  "overall_coverage_percent": <number 0-100>,
  "total_failure_modes": <number>,
  "covered_count": <number>,
  "gap_count": <number>,
  "failure_modes": [
    {{
      "id": <number>,
      "failure_mode": "<name>",
      "severity": "High" | "Medium" | "Low",
      "status": "Covered" | "Gap",
      "monitoring_parameter": "<what parameter monitors this>",
      "current_coverage": "<what the spec says, or 'Not mentioned'>",
      "recommendation": "<what should be added if gap, or 'Adequate' if covered>"
    }}
  ],
  "critical_gaps": ["<top 3 most critical gaps as short strings>"],
  "summary": "<2-3 sentence executive summary of findings>"
}}

Rules:
- Be thorough — check every failure mode in the knowledge base
- Mark as "Covered" only if the spec explicitly mentions monitoring for that failure mode
- Severity: High = safety/major damage risk, Medium = performance impact, Low = efficiency/maintenance
- Recommendations must be specific and actionable
- Return ONLY valid JSON, no extra text"""


CHAT_PROMPT = """You are an expert Electrical Condition Monitoring (ECM) engineer with deep knowledge of electrical assets, protection systems, and condition monitoring best practices.

You have access to three sources of information:

## Source 1 — ECM Knowledge Base (User Manual)
{knowledge_context}

## Source 2 — Uploaded Technical Specification
{spec_context}

## Conversation History
{chat_history}

## User Question
{question}

## Instructions
- Answer using all available sources above
- If the question is about the uploaded spec specifically, refer to Source 2
- If the question is about general ECM knowledge, refer to Source 1
- If neither source covers it, use your own electrical engineering expertise to answer — you are encouraged to answer general electrical questions from your knowledge
- Be concise, technical, and accurate
- Clearly mention if you are answering from the spec, the knowledge base, or your own expertise"""


SPEC_EXTRACT_PROMPT = """You are an electrical engineering document analyst.

Extract all monitoring-related information from the following technical specification text. Focus on:
- Protection functions and relays mentioned
- Sensors and measurement devices
- Monitoring parameters (temperature, current, voltage, etc.)
- Alarm and trip setpoints
- Condition monitoring features
- Diagnostic functions

Text:
{spec_text}

Summarize what monitoring and protection is present in this specification as a structured list. Be thorough."""
