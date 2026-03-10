import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const NAV = [
  { to: '/record',  icon: '✦', label: '오늘의 기록' },
  { to: '/tasks',   icon: '◈', label: '할 일 관리' },
  { to: '/stats',   icon: '◎', label: '통계' },
  { to: '/mypage',  icon: '◉', label: '마이페이지' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>TASKLOG</h1>
        <span>일정 관리</span>
      </div>

      <nav>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-chip">
          <div className="user-avatar">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="user-info">
            <strong>{user?.username}</strong>
            <span>접속 중</span>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm w-full mt-2"
          style={{ justifyContent: 'flex-start' }}
          onClick={handleLogout}
        >
          ↩ 로그아웃
        </button>
      </div>
    </aside>
  );
}
