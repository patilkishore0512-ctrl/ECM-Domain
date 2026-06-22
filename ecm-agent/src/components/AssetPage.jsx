import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Layout from './Layout';
import '../App.css';

const ASSET_LABELS = {
  transformer: 'Transformer',
  switchgear: 'Switchgear',
  ups: 'UPS',
  motors: 'Motors',
};

const API_BASE = 'http://localhost:8000';

function mapApiReport(data) {
  return {
    total: data.summary.total_failure_modes,
    covered: data.summary.covered_count,
    gaps: data.summary.gap_count,
    coverage: data.summary.overall_coverage_percent,
    summary: data.summary.executive_summary,
    critical_gaps: data.critical_gaps || [],
    items: (data.failure_modes || []).map(fm => ({
      id: fm.id,
      name: fm.failure_mode,
      severity: fm.severity,
      status: fm.status,
      recommendation: fm.recommendation,
    })),
  };
}

export default function AssetPage({ assetId }) {
  const navigate = useNavigate();
  const assetLabel = ASSET_LABELS[assetId];

  const [uploadedFile, setUploadedFile]   = useState(null);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [progress, setProgress]           = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [report, setReport]               = useState(null);
  const [analyzeError, setAnalyzeError]   = useState(null);
  const [chatHistory, setChatHistory]     = useState([]);
  const [messages, setMessages] = useState(() => {
    const t = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return [{ role: 'bot', text: `Hello! Upload a technical specification for the ${assetLabel || 'asset'} and I'll analyze the monitoring coverage gaps. You can also ask me any electrical engineering question.`, time: t }];
  });
  const [chatInput, setChatInput]     = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef   = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  if (!assetLabel) {
    navigate('/');
    return null;
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  }

  async function handleGenerate() {
    if (!uploadedFile) return;
    setIsGenerating(true);
    setReport(null);
    setAnalyzeError(null);
    setProgress(0);

    const steps = [
      { pct: 15,  label: 'Parsing technical specification...', delay: 600 },
      { pct: 35,  label: 'Loading domain knowledge from RAG...', delay: 800 },
      { pct: 55,  label: 'Comparing against asset model library...', delay: 800 },
      { pct: 75,  label: 'Identifying monitoring gaps...', delay: 800 },
      { pct: 90,  label: 'Generating coverage report...', delay: 600 },
    ];

    // Animate progress while waiting for API
    let stepIndex = 0;
    const advanceProgress = () => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex++];
        setProgress(step.pct);
        setProgressLabel(step.label);
        setTimeout(advanceProgress, step.delay);
      }
    };
    advanceProgress();

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('asset_type', assetId);

      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setProgress(100);
      setProgressLabel('Report ready!');
      await new Promise(r => setTimeout(r, 400));
      setReport(mapApiReport(data));
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSendChat() {
    const text = chatInput.trim();
    if (!text) return;
    const t = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text, time: t() }]);
    setIsBotTyping(true);

    const updatedHistory = [...chatHistory, { role: 'user', content: text }];

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          asset_type: assetId,
          history: chatHistory,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      const answer = data.answer;
      setChatHistory([...updatedHistory, { role: 'assistant', content: answer }]);
      setMessages(prev => [...prev, { role: 'bot', text: answer, time: t() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: `Error: ${err.message}`, time: t() }]);
    } finally {
      setIsBotTyping(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSendChat();
  }

  const canGenerate = !!uploadedFile && !isGenerating;

  return (
    <Layout selectedAsset={assetId} chatOpen={chatOpen}>

      {/* ── Page heading ── */}
      <div className="page-heading">
        <div className="page-heading-text">
          <button className="back-btn" onClick={() => navigate('/')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Home
          </button>
          <h1 className="page-title">{assetLabel} — Gap Analysis</h1>
          <p className="page-sub">Upload a technical spec to generate a monitoring coverage report for {assetLabel}</p>
        </div>
        <span className="asset-tag">{assetLabel}</span>
      </div>

      {/* ── Upload Card ── */}
      <div className="card card-fill">
        <div className="section-title">Upload Technical Specification</div>
        <div
          className={`upload-area${uploadedFile ? ' has-file' : ''}`}
          onClick={() => fileInputRef.current.click()}
        >
          <div className="upload-icon-wrap">
            {uploadedFile ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            )}
          </div>
          {uploadedFile ? (
            <>
              <p className="upload-text">File ready for analysis</p>
              <p className="upload-filename">{uploadedFile.name}</p>
              <p className="upload-hint">Click or drop to replace</p>
            </>
          ) : (
            <>
              <p className="upload-text">Drag &amp; drop your {assetLabel} specification here</p>
              <p className="upload-hint">or <span className="upload-browse">click to browse</span> &mdash; PDF, Excel, Word</p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="upload-input"
          accept=".pdf,.xlsx,.xls,.docx,.doc"
          onChange={handleFileChange}
        />

        <button className="generate-btn" disabled={!canGenerate} onClick={handleGenerate}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          {isGenerating ? 'Analyzing\u2026' : `Generate Coverage Report`}
        </button>

        {analyzeError && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '6px', color: '#cc0000', fontSize: '13px' }}>
            ⚠ Analysis failed: {analyzeError}
          </div>
        )}

        {isGenerating && (
          <div className="progress-wrap">
            <div className="progress-meta">
              <span className="progress-label">{progressLabel}</span>
              <span className="progress-pct">{progress}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Coverage Report ── */}
      {report && (
        <div className="card">
          <div className="report-header">
            <div className="report-title">
              Coverage Report &mdash; <span className="report-asset">{assetLabel}</span>
            </div>
            <button className="export-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Report
            </button>
          </div>

          <div className="report-stats">
            <div className="stat-card">
              <div className="stat-number">{report.total}</div>
              <div className="stat-label">Total Failure Modes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number green">{report.covered}</div>
              <div className="stat-label">Covered</div>
            </div>
            <div className="stat-card">
              <div className="stat-number red">{report.gaps}</div>
              <div className="stat-label">Gaps Found</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{report.coverage}%</div>
              <div className="stat-label">Coverage Score</div>
            </div>
          </div>

          <div className="coverage-bar-wrap">
            <div className="coverage-label-row">
              <span>Overall Monitoring Coverage</span>
              <span className="coverage-pct">{report.coverage}%</span>
            </div>
            <div className="coverage-bar-bg">
              <div className="coverage-bar-fill" style={{ width: `${report.coverage}%` }} />
            </div>
          </div>

          {report.summary && (
            <div style={{ margin: '12px 0 18px', padding: '12px 16px', background: '#f8f9fa', borderLeft: '3px solid #cc0000', borderRadius: '4px', fontSize: '13.5px', color: '#444', lineHeight: '1.6' }}>
              {report.summary}
            </div>
          )}

          {report.critical_gaps && report.critical_gaps.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div className="table-title" style={{ marginBottom: '8px' }}>Critical Gaps</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {report.critical_gaps.map((gap, i) => (
                  <span key={i} style={{ padding: '4px 10px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '20px', fontSize: '12px', color: '#cc0000' }}>
                    ⚠ {gap}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="table-title">Failure Mode Analysis</div>
          <table className="fm-table">
            <thead>
              <tr>
                <th>#</th><th>Failure Mode</th><th>Severity</th><th>Status</th><th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {report.items.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td><strong>{item.name}</strong></td>
                  <td><span className={`badge badge-${item.severity.toLowerCase()}`}>{item.severity}</span></td>
                  <td>
                    <span className={`badge badge-${item.status === 'Covered' ? 'covered' : 'gap'}`}>
                      {item.status === 'Covered' ? '✓ Covered' : '⚠ Gap'}
                    </span>
                  </td>
                  <td className="td-recommendation">{item.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Chat Pull-Tab ── */}
      <button
        className={`chat-toggle-tab${chatOpen ? ' panel-open' : ''}`}
        onClick={() => setChatOpen(o => !o)}
        title={chatOpen ? 'Close chat' : 'Open ECM Agent chat'}
      >
        {chatOpen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        <span className="chat-toggle-label">{chatOpen ? 'Close' : 'AI Chat'}</span>
      </button>

      {/* ── Chat Sliding Panel ── */}
      <div className={`chat-panel${chatOpen ? ' open' : ''}`}>
        <div className="chat-panel-header">
          <div className="chat-panel-title">
            <span className="chat-panel-dot" />
            ECM Agent
          </div>
          <button className="chat-panel-close" onClick={() => setChatOpen(false)} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="chat-messages chat-panel-messages">
          {messages.map((m, i) => {
            const isFirst = i === 0 || messages[i - 1].role !== m.role;
            return (
              <div key={i} className={`msg msg-${m.role}${isFirst ? ' msg-first' : ''}`}>
                {isFirst && (
                  <div className="msg-sender-row">
                    <span className="msg-sender-name">{m.role === 'bot' ? 'ECM Agent' : 'You'}</span>
                    {m.time && <span className="msg-sender-time">{m.time}</span>}
                  </div>
                )}
                <div className="msg-bubble">
                  <span className="msg-bubble-text">{m.text}</span>
                </div>
              </div>
            );
          })}
          {isBotTyping && (
            <div className="msg msg-bot msg-first">
              <div className="msg-sender-row">
                <span className="msg-sender-name">ECM Agent</span>
              </div>
              <div className="msg-bubble">
                <span className="msg-bubble-text typing">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-row chat-panel-input">
          <input
            className="chat-input"
            placeholder="Ask about failure modes, gaps…"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="chat-send-btn"
            onClick={handleSendChat}
            disabled={isBotTyping || !chatInput.trim()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

    </Layout>
  );
}

AssetPage.propTypes = {
  assetId: PropTypes.string.isRequired,
};
