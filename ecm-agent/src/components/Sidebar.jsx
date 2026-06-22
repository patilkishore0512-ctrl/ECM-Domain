import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from './Sidebar.module.css';

const IconTransformer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="12" r="4"/>
    <circle cx="17" cy="12" r="4"/>
    <path d="M7 8V4M7 20v-4M17 8V4M17 20v-4"/>
  </svg>
);

const IconSwitchgear = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
    <circle cx="8" cy="10" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="16" cy="10" r="1.5" fill="currentColor" stroke="none"/>
    <path d="M8 10h8" strokeDasharray="2 2"/>
  </svg>
);

const IconUPS = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/>
    <line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);

const IconMotors = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>
);

const ASSET_TYPES = [
  { id: 'transformer', label: 'Transformer', Icon: IconTransformer },
  { id: 'switchgear',  label: 'Switchgear',  Icon: IconSwitchgear  },
  { id: 'ups',         label: 'UPS',          Icon: IconUPS         },
  { id: 'motors',      label: 'Motors',       Icon: IconMotors      },
];

export default function Sidebar({ selectedAsset }) {
  const navigate = useNavigate();
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sectionLabel}>Assets</div>
      {ASSET_TYPES.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`${styles.navItem} ${selectedAsset === id ? styles.active : ''}`}
          onClick={() => navigate(`/asset/${id}`)}
          title={label}
        >
          <Icon />
          <span className={styles.tooltip}>{label}</span>
        </button>
      ))}
    </aside>
  );
}

Sidebar.propTypes = {
  selectedAsset: PropTypes.string,
};
