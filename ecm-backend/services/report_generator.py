from typing import Dict, Any, List
from datetime import datetime


def build_report(gap_analysis: Dict[str, Any], asset_type: str, filename: str) -> Dict[str, Any]:
    failure_modes: List[Dict] = gap_analysis.get("failure_modes", [])

    covered = [f for f in failure_modes if f.get("status") == "Covered"]
    gaps = [f for f in failure_modes if f.get("status") == "Gap"]

    high_gaps = [f for f in gaps if f.get("severity") == "High"]
    medium_gaps = [f for f in gaps if f.get("severity") == "Medium"]
    low_gaps = [f for f in gaps if f.get("severity") == "Low"]

    coverage_percent = gap_analysis.get("overall_coverage_percent", 0)
    if coverage_percent == 0 and failure_modes:
        coverage_percent = round(len(covered) / len(failure_modes) * 100, 1)

    return {
        "report_id": f"ECM-{asset_type.upper()}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "generated_at": datetime.now().isoformat(),
        "asset_type": asset_type,
        "source_document": filename,
        "summary": {
            "overall_coverage_percent": coverage_percent,
            "total_failure_modes": len(failure_modes),
            "covered_count": len(covered),
            "gap_count": len(gaps),
            "high_severity_gaps": len(high_gaps),
            "medium_severity_gaps": len(medium_gaps),
            "low_severity_gaps": len(low_gaps),
            "executive_summary": gap_analysis.get("summary", "")
        },
        "critical_gaps": gap_analysis.get("critical_gaps", []),
        "failure_modes": failure_modes,
        "recommendations": _build_recommendations(gaps)
    }


def _build_recommendations(gaps: List[Dict]) -> List[Dict]:
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    sorted_gaps = sorted(gaps, key=lambda g: priority_order.get(g.get("severity", "Low"), 2))

    recommendations = []
    for i, gap in enumerate(sorted_gaps, start=1):
        recommendations.append({
            "priority": i,
            "failure_mode": gap.get("failure_mode", ""),
            "severity": gap.get("severity", ""),
            "action": gap.get("recommendation", ""),
            "monitoring_parameter": gap.get("monitoring_parameter", "")
        })
    return recommendations
