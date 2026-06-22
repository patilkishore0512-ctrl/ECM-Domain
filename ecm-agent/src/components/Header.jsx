import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logoGroup}>
          <img
            src="/abb-logo.png"
            alt="ABB"
            className={styles.abbLogo}
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          />
          <div className={styles.divider} />
          <span className={styles.appTitle}>ECM Domain Agent</span>
        </div>
        <div className={styles.badge}>ABB ACCELERATOR 2026</div>
      </div>
    </header>
  );
}
