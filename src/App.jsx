import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/Login';
import RecordPage from './pages/Record';
import TasksPage from './pages/Tasks';
import StatsPage from './pages/Stats';
import MyPage from './pages/MyPage';
import './index.css';

function PrivateLayout({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Sidebar />
      {children}
    </div>
  );
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/record" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter basename="/task-manager"> {/* ← vite.config.js의 base와 동일하게 */}
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/record" element={<PrivateLayout><RecordPage /></PrivateLayout>} />
            <Route path="/tasks"  element={<PrivateLayout><TasksPage /></PrivateLayout>} />
            <Route path="/stats"  element={<PrivateLayout><StatsPage /></PrivateLayout>} />
            <Route path="/mypage" element={<PrivateLayout><MyPage /></PrivateLayout>} />
            <Route path="*" element={<Navigate to="/record" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
