import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import styles from './HomePage.module.css';

/* ── Asset Type Data ───────────────────────────────────────────────────── */
const ASSET_TYPES = [
  {
    id: 'transformer',
    name: 'Transformer',
    subtitle: 'Power & Distribution',
    tag: 'High Priority',
    description: 'Monitor thermal overload, insulation degradation, tap changer failures and Buchholz relay coverage across power and distribution transformers.',
    features: [
      'Dissolved Gas Analysis (DGA)',
      'Buchholz & thermal protection',
      'Tap changer position feedback',
      'Moisture-in-oil monitoring',
    ],
    image: '/abb transformer.jpg',
    fallbackGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    coverageNote: '24 failure modes',
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/>
        <path d="M7 8V4M7 20v-4M17 8V4M17 20v-4"/>
      </svg>
    ),
  },
  {
    id: 'switchgear',
    name: 'Switchgear',
    subtitle: 'Medium Voltage',
    tag: 'Critical',
    description: 'Detect arc flash risks, partial discharge events, SF6 gas loss and circuit breaker timing issues in ABB medium voltage switchgear.',
    features: [
      'Arc flash detection sensors',
      'SF6 gas pressure monitoring',
      'CB operating time analysis',
      'UHF partial discharge (PD)',
    ],
    image: '/abb-switchgear.webp',
    fallbackGradient: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #1e3a5f 100%)',
    coverageNote: '18 failure modes',
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <circle cx="8" cy="10" r="1.5" fill="rgba(255,255,255,0.4)" stroke="none"/>
        <circle cx="16" cy="10" r="1.5" fill="rgba(255,255,255,0.4)" stroke="none"/>
      </svg>
    ),
  },
  {
    id: 'ups',
    name: 'UPS',
    subtitle: 'Critical Power',
    tag: 'Active',
    description: 'Ensure uninterrupted power protection by monitoring battery health, IGBT modules, charger status and fan cooling in ABB UPS systems.',
    features: [
      'Battery state-of-health (SOH)',
      'IGBT thermal monitoring',
      'Charger fault detection',
      'Input voltage sag protection',
    ],
    image: '/Abb_ups.jpg',
    fallbackGradient: 'linear-gradient(135deg, #1a0533 0%, #2d0954 50%, #4a1080 100%)',
    coverageNote: '20 failure modes',
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
  },
  {
    id: 'motors',
    name: 'Motors',
    subtitle: 'LV Industrial',
    tag: 'Active',
    description: 'Identify bearing failures, stator winding faults, shaft misalignment and insulation issues in ABB IEC low voltage industrial motors.',
    features: [
      'Bearing vibration analysis',
      'Motor Current Signature (MCSA)',
      'Stator winding protection',
      'Insulation resistance testing',
    ],
    image: 'https://media-d.global.abb/is/image/abbc/SYNRM-IE6-Family-Product-Clean-4K:16x9-M',
    fallbackGradient: 'linear-gradient(135deg, #0a2018 0%, #0d3025 50%, #1a5c3a 100%)',
    coverageNote: '22 failure modes',
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.clear();
  }, []);

  return (
    <div className={styles.page}>
      <Header />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <video
          className={styles.heroBgVideo}
          src="https://media-d.global.abb/is/content/abbc/ABB%20com%20Engineered%20to%20outrun"
          autoPlay
          loop
          muted
          playsInline
          tabIndex={-1}
        />
        <div className={styles.heroOverlay} aria-hidden="true" />

        <div className={styles.heroContent}>
          <div className={styles.heroPill}>
            <span className={styles.heroPillDot} />
            {' '}ABB · AI-Powered
          </div>

          <h1 className={styles.heroTitle}>
            Electrical Condition<br />
            <span className={styles.heroAccent}>Monitoring Hub</span>
          </h1>

          <p className={styles.heroSub}>
            Upload asset technical specifications, detect monitoring gaps and generate
            AI-powered coverage reports &mdash; across every asset, instantly.
          </p>

          <div className={styles.heroStats}>
            {[
              { value: '4',   label: 'Asset Types' },
              { value: '84',  label: 'Failure Modes' },
            ].map(({ value, label }) => (
              <div key={label} className={styles.heroStat}>
                <span className={styles.heroStatValue}>{value}</span>
                <span className={styles.heroStatLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Asset Cards ─────────────────────────────────────────────── */}
      <section className={styles.assetsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Select Your Asset Type</h2>
          <p className={styles.sectionSub}>
            Choose an electrical asset to begin the monitoring gap analysis
          </p>
        </div>

        <div className={styles.assetGrid}>
          {ASSET_TYPES.map((asset) => (
            <div
              key={asset.id}
              className={styles.assetCard}
              onClick={() => navigate(`/asset/${asset.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/asset/${asset.id}`)}
            >
              {/* ── Card Image ── */}
              <div className={styles.cardImage}>
                <img
                  src={asset.image}
                  alt={`ABB ${asset.name}`}
                  className={styles.cardImg}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement.style.background = asset.fallbackGradient;
                    e.currentTarget.parentElement.querySelector('.' + styles.cardImgFallback).style.display = 'flex';
                  }}
                />
                <div className={styles.cardImgFallback} style={{ display: 'none' }}>
                  {asset.icon}
                </div>
                <div className={styles.cardImageOverlay} />
              </div>

              {/* ── Card Body ── */}
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  <h3 className={styles.cardName}>{asset.name}</h3>
                  <span className={styles.cardSubtitle}>{asset.subtitle}</span>
                </div>

                <p className={styles.cardDesc}>{asset.description}</p>

                <ul className={styles.featureList}>
                  {asset.features.map((f) => (
                    <li key={f} className={styles.featureItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--abb-red)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button className={styles.cardCta}>
                  Start Analysis
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        ECM Domain Agent &nbsp;&middot;&nbsp; ABB Accelerator 2026 &nbsp;&middot;&nbsp; Powered by RAG + LLM
      </footer>
    </div>
  );
}
