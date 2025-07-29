import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { VideoProvider } from './contexts/VideoContext';
import Layout from './components/Layout';
import VideoInputPage from './pages/VideoInputPage';
import VideoSummaryPage from './pages/VideoSummaryPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Router>
      <VideoProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<VideoInputPage />} />
            <Route path="/summary/:videoId" element={<VideoSummaryPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </Layout>
      </VideoProvider>
    </Router>
  );
}

export default App;