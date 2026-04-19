import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import TaskModal from '../components/TaskModal';
import { FREQUENCY_LABELS, WEEKDAY_LABELS } from '../lib/taskUtils';

function FrequencyDetail({ task }) {
  if (task.frequency === 'daily') return <span className="text-muted text-sm">매일</span>;
  if (task.frequency === 'weekly') {
    const days = (task.frequency_days || []).map((d) => WEEKDAY_LABELS[d]).join(', ');
    return <span className="text-muted text-sm">매주 {days || '—'}</span>;
  }
  if (task.frequency === 'monthly') {
    const days = (task.frequency_days || []).join(', ');
    return <span className="text-muted text-sm">매월 {days || '—'}일</span>;
  }
  if (task.frequency === 'once') {
    return <span className="text-muted text-sm">{task.specific_date || '날짜 미설정'}</span>;
  }
  return null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { success, error } = useToast();

  const fetchTasks = async () => {
    try {
      const res = await api.get('/api/todo/tasks');
      setTasks(res.data);
    } catch {
      error('할 일 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleSave = async (form) => {
    try {
      if (editingTask?.id) {
        const res = await api.put(`/api/todo/tasks/${editingTask.id}`, form);
        setTasks((prev) => prev.map((t) => t.id === editingTask.id ? res.data : t));
        success('수정되었습니다.');
      } else {
        const res = await api.post('/api/todo/tasks', form);
        setTasks((prev) => [...prev, res.data]);
        success('할 일이 추가되었습니다.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || '저장에 실패했습니다.';
      error(msg);
      throw err;
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/todo/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      success('삭제되었습니다.');
    } catch {
      error('삭제에 실패했습니다.');
    }
    setConfirmDelete(null);
  };

  const openCreate = () => { setEditingTask(null); setModalOpen(true); };
  const openEdit = (task) => { setEditingTask(task); setModalOpen(true); };

  const activeTasks = tasks.filter((t) => t.is_active);
  const inactiveTasks = tasks.filter((t) => !t.is_active);

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2>할 일 관리</h2>
          <p>할 일 목록을 추가하고 반복 주기를 설정하세요.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>＋ 새 할 일</button>
      </div>

      {loading ? (
        <div className="empty-state"><p>불러오는 중...</p></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <p>아직 등록된 할 일이 없어요.<br />새 할 일을 추가해 보세요.</p>
        </div>
      ) : (
        <>
          {/* 활성 */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              활성 ({activeTasks.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeTasks.map((task) => (
                <TaskRow key={task.id} task={task} onEdit={openEdit} onDelete={() => setConfirmDelete(task)} />
              ))}
            </div>
          </section>

          {/* 비활성 */}
          {inactiveTasks.length > 0 && (
            <section>
              <h3 style={{ fontSize: '0.8rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                비활성 ({inactiveTasks.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {inactiveTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onEdit={openEdit} onDelete={() => setConfirmDelete(task)} dimmed />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '360px' }}>
            <h3 style={{ marginBottom: '12px' }}>할 일 삭제</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
              <strong style={{ color: 'var(--text)' }}>{confirmDelete.title}</strong>을(를) 삭제하면
              관련 기록도 모두 삭제됩니다. 계속하시겠어요?
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>취소</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete.id)}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onEdit, onDelete, dimmed }) {
  return (
    <div className="card" style={{ opacity: dimmed ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{task.title}</span>
            <span className={`badge ${task.metric_type === 'percentage' ? 'badge-purple' : 'badge-gray'}`}>
              {task.metric_type === 'percentage' ? '% 성취도' : '✓/✕'}
            </span>
            <span className="badge badge-gray">{FREQUENCY_LABELS[task.frequency]}</span>
          </div>
          <FrequencyDetail task={task} />
          {task.description && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '2px' }}>{task.description}</p>
          )}
          {task.is_optional && (
            <span className="badge badge-gray">선택사항</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(task)} title="수정">✎</button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete} title="삭제" style={{ color: 'var(--red)' }}>✕</button>
        </div>
      </div>
    </div>
  );
}
