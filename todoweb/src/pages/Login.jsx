import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../components/Toast';
import api from '../lib/api';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.email || !form.password) return error('이메일과 비밀번호를 입력하세요.');
    if (mode === 'register') {
      if (!form.username) return error('사용자명을 입력하세요.');
      if (form.password !== form.confirmPassword) return error('비밀번호가 일치하지 않습니다.');
      if (form.password.length < 6) return error('비밀번호는 최소 6자여야 합니다.');
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/todo/auth/login' : '/api/todo/auth/register';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password };

      const res = await api.post(endpoint, payload);
      login(res.data.token, res.data.user);
      success(mode === 'login' ? '로그인되었습니다.' : '회원가입이 완료되었습니다.');
      navigate('/record');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || '오류가 발생했습니다.';
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">TASKLOG</h2>
        <p className="auth-subtitle">
          {mode === 'login' ? '다시 만나서 반가워요.' : '새 계정을 만들어요.'}
        </p>

        <div className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">사용자명</label>
              <input
                className="form-input"
                placeholder="2~20자"
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">이메일</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              className="form-input"
              placeholder="최소 6자"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">비밀번호 확인</label>
              <input
                type="password"
                className="form-input"
                placeholder="비밀번호를 다시 입력하세요"
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

          <button
            className="btn btn-primary w-full"
            style={{ marginTop: '8px', padding: '12px', fontSize: '0.95rem', justifyContent: 'center' }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </div>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>아직 계정이 없으신가요? <button onClick={() => setMode('register')}>회원가입</button></>
          ) : (
            <>이미 계정이 있으신가요? <button onClick={() => setMode('login')}>로그인</button></>
          )}
        </div>
      </div>
    </div>
  );
}
