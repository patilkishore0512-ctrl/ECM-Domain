import PropTypes from 'prop-types';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from './Layout.module.css';

export default function Layout({ selectedAsset, chatOpen, chatWidth, children }) {
  const mainStyle = chatOpen && chatWidth
    ? { paddingRight: `calc(${chatWidth}px + 32px)` }
    : { paddingRight: '60px' };

  return (
    <>
      <Header />
      <Sidebar selectedAsset={selectedAsset} />
      <main className={styles.main} style={mainStyle}>
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
  chatWidth: PropTypes.number,
  children: PropTypes.node.isRequired,
};
