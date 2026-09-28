import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import HomePage from './components/HomePage';
import AssetPage from './components/AssetPage';
import DashboardPage from './components/DashboardPage';

function AssetPageWrapper() {
  const { assetId } = useParams();
  return <AssetPage key={assetId} assetId={assetId} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/asset/:assetId" element={<AssetPageWrapper />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
