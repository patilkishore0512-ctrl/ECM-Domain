import PropTypes from 'prop-types';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from './Layout.module.css';

export default function Layout({ selectedAsset, chatOpen, children }) {
  return (
    <>
      <Header />
      <Sidebar selectedAsset={selectedAsset} />
      <main className={`${styles.main}${chatOpen ? ' ' + styles.chatOpen : ''}`}>
        {children}
        <footer className={styles.footer}>
          ECM Domain Agent &nbsp;&middot;&nbsp; ABB Accelerator 2026 &nbsp;&middot;&nbsp; Powered by RAG + LLM
        </footer>
      </main>
    </>
  );
}

Layout.propTypes = {
  selectedAsset: PropTypes.string,
  chatOpen: PropTypes.bool,
  children: PropTypes.node.isRequired,
};
