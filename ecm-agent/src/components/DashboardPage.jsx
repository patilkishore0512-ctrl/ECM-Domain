import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import styles from './DashboardPage.module.css';

const ASSETS = [
  {
    id: 'transformer',
    label: 'Transformer',
    subtitle: 'Power & Distribution',
    totalModes: 24,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/>
        <path d="M7 8V4M7 20v-4M17 8V4M17 20v-4"/>
      </svg>
    ),
  },
  {
    id: 'switchgear',
    label: 'Switchgear',
    subtitle: 'Medium Voltage',
    totalModes: 18,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <circle cx="8" cy="10" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="16" cy="10" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    id: 'ups',
    label: 'UPS',
    subtitle: 'Critical Power',
    totalModes: 20,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
  },
  {
    id: 'motors',
    label: 'Motors',
    subtitle: 'LV Industrial',
    totalModes: 22,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
  },
];

function gaugeColor(pct) {
  if (pct >= 70) return '#22c55e';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

function statusLabel(pct) {
  if (pct >= 70) return { text: 'Good', cls: styles.statusGood };
  if (pct >= 40) return { text: 'Moderate', cls: styles.statusMod };
  return { text: 'Critical', cls: styles.statusCrit };
}

function RadialGauge({ value, animate }) {
  const r = 48;
  const size = 130;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (value / 100) * circumference;
  const color = gaugeColor(value);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={animate ? styles.gaugeAnimate : ''}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="9" />
      {/* Progress */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* Glow ring */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)', opacity: 0.2, filter: 'blur(4px)' }}
      />
      {/* Value */}
      <text x={cx} y={cy - 7} textAnchor="middle" dominantBaseline="middle"
        fontSize="20" fontWeight="800" fill={color} fontFamily="inherit">
        {value}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
        fontSize="9.5" fontWeight="600" fill="var(--text-muted)" fontFamily="inherit" letterSpacing="0.5">
        COVERAGE
      </text>
    </svg>
  );
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [assetData, setAssetData] = useState({});
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const data = {};
    ASSETS.forEach(a => {
      const raw = sessionStorage.getItem(`ecm_asset_${a.id}`);
      if (raw) {
        try { data[a.id] = JSON.parse(raw); } catch { /* ignore */ }
      }
    });
    setAssetData(data);
    // Trigger gauge animation after mount
    setTimeout(() => setAnimated(true), 100);
  }, []);

  const analyzed = Object.keys(assetData).length;
  const avgCoverage = analyzed > 0
    ? Math.round(Object.values(assetData).reduce((s, d) => s + d.coverage, 0) / analyzed)
    : 0;
  const totalGaps = Object.values(assetData).reduce((s, d) => s + d.gaps, 0);

  return (
    <Layout>
      <div className={styles.page}>

        {/* ── Page Header ── */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Asset Health Dashboard</h1>
            <p className={styles.pageSub}>Real-time monitoring coverage across all electrical assets</p>
          </div>
        </div>

        {/* ── Summary Bar ── */}
        <div className={styles.summaryBar}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue}>{analyzed} / 4</span>
            <span className={styles.summaryLabel}>Assets Analyzed</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue} style={{ color: gaugeColor(avgCoverage) }}>
              {analyzed > 0 ? `${avgCoverage}%` : '—'}
            </span>
            <span className={styles.summaryLabel}>Avg Coverage</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue} style={{ color: totalGaps > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
              {analyzed > 0 ? totalGaps : '—'}
            </span>
            <span className={styles.summaryLabel}>Total Gaps Found</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue}>84</span>
            <span className={styles.summaryLabel}>Total Failure Modes</span>
          </div>
        </div>

        {/* ── Asset Grid ── */}
        <div className={styles.assetGrid}>
          {ASSETS.map(asset => {
            const d = assetData[asset.id];
            const hasData = !!d;

            return (
              <div key={asset.id} className={`${styles.assetCard} ${hasData ? styles.analyzed : styles.pending}`}>

                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardIconWrap}>
                    {asset.icon}
                  </div>
                  <div className={styles.cardTitle}>
                    <span className={styles.cardName}>{asset.label}</span>
                    <span className={styles.cardSub}>{asset.subtitle}</span>
                  </div>
                  {hasData && (
                    <span className={`${styles.statusBadge} ${statusLabel(d.coverage).cls}`}>
                      {statusLabel(d.coverage).text}
                    </span>
                  )}
                  {!hasData && (
                    <span className={styles.statusPending}>Not Analyzed</span>
                  )}
                </div>

                {/* Gauge */}
                <div className={styles.gaugeWrap}>
                  {hasData ? (
                    <RadialGauge value={d.coverage} animate={animated} />
                  ) : (
                    <div className={styles.emptyGauge}>
                      <svg width="130" height="130" viewBox="0 0 130 130">
                        <circle cx="65" cy="65" r="48" fill="none" stroke="var(--border)" strokeWidth="9" strokeDasharray="6 6"/>
                        <text x="65" y="58" textAnchor="middle" fontSize="13" fill="var(--text-faint)" fontFamily="inherit">No data</text>
                        <text x="65" y="75" textAnchor="middle" fontSize="11" fill="var(--text-faint)" fontFamily="inherit">yet</text>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Stats Row */}
                {hasData ? (
                  <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                      <span className={styles.statVal} style={{ color: '#22c55e' }}>{d.covered}</span>
                      <span className={styles.statKey}>Covered</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statItem}>
                      <span className={styles.statVal} style={{ color: '#ef4444' }}>{d.gaps}</span>
                      <span className={styles.statKey}>Gaps</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statItem}>
                      <span className={styles.statVal}>{d.total}</span>
                      <span className={styles.statKey}>Total</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.statsRow}>
                    <span className={styles.noDataNote}>{asset.totalModes} failure modes to check</span>
                  </div>
                )}

                {/* Timestamp */}
                {hasData && d.analyzedAt && (
                  <div className={styles.timestamp}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {formatTime(d.analyzedAt)}
                    {d.filename && <span className={styles.filename}> · {d.filename}</span>}
                  </div>
                )}

                {/* CTA */}
                <button
                  className={`${styles.ctaBtn} ${hasData ? styles.ctaView : styles.ctaAnalyze}`}
                  onClick={() => navigate(`/asset/${asset.id}`)}
                >
                  {hasData ? (
                    <>
                      View Full Report
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  ) : (
                    <>
                      Start Analysis
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {analyzed === 0 && (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            <p>No assets analyzed yet. Select an asset from the sidebar and upload a technical specification to begin.</p>
          </div>
        )}

      </div>
    </Layout>
  );
}
