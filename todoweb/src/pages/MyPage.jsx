import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../components/Toast';
import api from '../lib/api';

export default function MyPage() {
  const { user, updateUser, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [usernameForm, setUsernameForm] = useState({ username: user?.username || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deleteForm, setDeleteForm] = useState({ password: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleUsernameChange = async () => {
    if (!usernameForm.username.trim()) return error('사용자명을 입력하세요.');
    if (usernameForm.username === user.username) return error('현재와 동일한 사용자명입니다.');
    setLoadingUsername(true);
    try {
      const res = await api.put('/api/auth/profile', { username: usernameForm.username });
      updateUser({ ...user, username: res.data.username });
      success('사용자명이 변경되었습니다.');
    } catch (err) {
      error(err.response?.data?.error || '변경에 실패했습니다.');
    } finally {
      setLoadingUsername(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return error('비밀번호를 입력하세요.');
    if (pwForm.newPassword !== pwForm.confirmPassword) return error('새 비밀번호가 일치하지 않습니다.');
    if (pwForm.newPassword.length < 6) return error('새 비밀번호는 최소 6자여야 합니다.');
    setLoadingPw(true);
    try {
      await api.put('/api/auth/profile', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      success('비밀번호가 변경되었습니다.');
    } catch (err) {
      error(err.response?.data?.error || '변경에 실패했습니다.');
    } finally {
      setLoadingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteForm.password) return error('비밀번호를 입력하세요.');
    setLoadingDelete(true);
    try {
      await api.delete('/api/auth/profile', { data: { password: deleteForm.password } });
      logout();
      navigate('/login');
      success('회원 탈퇴가 완료되었습니다.');
    } catch (err) {
      error(err.response?.data?.error || '탈퇴에 실패했습니다.');
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h2>마이페이지</h2>
        <p>계정 정보를 관리하세요.</p>
      </div>

      {/* 프로필 카드 */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          width: '56px', height: '56px',
          background: 'var(--accent)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', fontWeight: 700, color: 'white', fontFamily: 'Syne',
        }}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>{user?.username}</p>
          <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>{user?.email}</p>
        </div>
      </div>

      {/* 사용자명 변경 */}
      <Section title="사용자명 변경">
        <div className="form-group">
          <label className="form-label">새 사용자명</label>
          <input
            className="form-input"
            value={usernameForm.username}
            onChange={(e) => setUsernameForm({ username: e.target.value })}
            placeholder="2~20자"
          />
        </div>
        <div style={{ marginTop: '12px' }}>
          <button className="btn btn-primary" onClick={handleUsernameChange} disabled={loadingUsername}>
            {loadingUsername ? '변경 중...' : '사용자명 변경'}
          </button>
        </div>
      </Section>

      {/* 비밀번호 변경 */}
      <Section title="비밀번호 변경">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">현재 비밀번호</label>
            <input
              type="password"
              className="form-input"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">새 비밀번호</label>
            <input
              type="password"
              className="form-input"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
              placeholder="최소 6자"
            />
          </div>
          <div className="form-group">
            <label className="form-label">새 비밀번호 확인</label>
            <input
              type="password"
              className="form-input"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ marginTop: '12px' }}>
          <button className="btn btn-primary" onClick={handlePasswordChange} disabled={loadingPw}>
            {loadingPw ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      </Section>

      {/* 회원 탈퇴 */}
      <Section title="회원 탈퇴" danger>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', marginBottom: '12px' }}>
          탈퇴 시 모든 데이터(할 일, 기록, 통계)가 <strong style={{ color: 'var(--red)' }}>영구 삭제</strong>됩니다.
          복구가 불가능하니 신중하게 결정하세요.
        </p>
        <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
          회원 탈퇴
        </button>
      </Section>

      {/* 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--red)' }}>정말 탈퇴하시겠어요?</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', marginBottom: '16px' }}>
              확인을 위해 현재 비밀번호를 입력해 주세요.
            </p>
            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input
                type="password"
                className="form-input"
                value={deleteForm.password}
                onChange={(e) => setDeleteForm({ password: e.target.value })}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>취소</button>
              <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={loadingDelete}>
                {loadingDelete ? '처리 중...' : '탈퇴 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children, danger }) {
  return (
    <div className="card" style={{ marginBottom: '16px', borderColor: danger ? 'rgba(248,113,113,0.2)' : undefined }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px', color: danger ? 'var(--red)' : 'var(--text)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
