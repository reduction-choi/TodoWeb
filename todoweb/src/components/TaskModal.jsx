import { useState, useEffect } from 'react';
import { WEEKDAY_LABELS, FREQUENCY_LABELS } from '../lib/taskUtils';

const DEFAULT_FORM = {
  title: '',
  description: '',
  frequency: 'daily',
  frequency_days: [],
  specific_date: '',
  metric_type: 'boolean',
  is_active: true,
};

export default function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        frequency: task.frequency || 'daily',
        frequency_days: task.frequency_days || [],
        specific_date: task.specific_date || '',
        metric_type: task.metric_type || 'boolean',
        is_active: task.is_active ?? true,
      });
    }
  }, [task]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleDay = (day) => {
    set('frequency_days',
      form.frequency_days.includes(day)
        ? form.frequency_days.filter((d) => d !== day)
        : [...form.frequency_days, day].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{task?.id ? '할 일 수정' : '새 할 일 추가'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 제목 */}
          <div className="form-group">
            <label className="form-label">제목 *</label>
            <input
              className="form-input"
              placeholder="할 일 제목을 입력하세요"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* 설명 */}
          <div className="form-group">
            <label className="form-label">설명 (선택)</label>
            <input
              className="form-input"
              placeholder="간략한 설명"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* 반복 주기 */}
          <div className="form-group">
            <label className="form-label">반복 주기</label>
            <div className="chip-group">
              {Object.entries(FREQUENCY_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  className={`chip${form.frequency === val ? ' selected' : ''}`}
                  onClick={() => { set('frequency', val); set('frequency_days', []); }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 요일 선택 (매주) */}
          {form.frequency === 'weekly' && (
            <div className="form-group">
              <label className="form-label">요일 선택</label>
              <div className="chip-group">
                {WEEKDAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    className={`chip${form.frequency_days.includes(idx) ? ' selected' : ''}`}
                    onClick={() => toggleDay(idx)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 날짜 선택 (매월) */}
          {form.frequency === 'monthly' && (
            <div className="form-group">
              <label className="form-label">날짜 선택 (1~31)</label>
              <div className="chip-group">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <button
                    key={d}
                    className={`chip${form.frequency_days.includes(d) ? ' selected' : ''}`}
                    onClick={() => toggleDay(d)}
                    style={{ minWidth: '36px', justifyContent: 'center' }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 특정일 */}
          {form.frequency === 'once' && (
            <div className="form-group">
              <label className="form-label">날짜 선택</label>
              <input
                type="date"
                className="form-input"
                value={form.specific_date}
                onChange={(e) => set('specific_date', e.target.value)}
              />
            </div>
          )}

          {/* 측정 방식 */}
          <div className="form-group">
            <label className="form-label">측정 방식</label>
            <div className="chip-group">
              <button
                className={`chip${form.metric_type === 'boolean' ? ' selected' : ''}`}
                onClick={() => set('metric_type', 'boolean')}
              >
                ✓ / ✕ (완료 여부)
              </button>
              <button
                className={`chip${form.metric_type === 'percentage' ? ' selected' : ''}`}
                onClick={() => set('metric_type', 'percentage')}
              >
                % (성취도)
              </button>
            </div>
          </div>

          {/* 활성 여부 (수정 시만) */}
          {task?.id && (
            <div className="form-group">
              <label className="form-label">상태</label>
              <div className="chip-group">
                <button className={`chip${form.is_active ? ' selected' : ''}`} onClick={() => set('is_active', true)}>활성</button>
                <button className={`chip${!form.is_active ? ' selected' : ''}`} onClick={() => set('is_active', false)}>비활성</button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !form.title.trim()}>
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
