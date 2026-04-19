import { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { isTaskDueOnDate, formatDisplayDate } from '../lib/taskUtils';

function BooleanInput({ value, onChange }) {
  const done = value === 1;
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button
        className={`btn btn-sm ${done ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onChange(done ? null : 1)}
      >
        ✓ 완료
      </button>
      <button
        className={`btn btn-sm ${value === 0 ? 'btn-danger' : 'btn-secondary'}`}
        onClick={() => onChange(value === 0 ? null : 0)}
      >
        ✕ 미완
      </button>
    </div>
  );
}

function PercentageInput({ value, onChange }) {
  const [draft, setDraft] = useState(value != null ? String(value) : '');

  useEffect(() => {
    setDraft(value != null ? String(value) : '');
  }, [value]);

  const commit = () => {
    const num = parseInt(draft, 10);
    if (isNaN(num)) onChange(null);
    else onChange(Math.min(100, Math.max(0, num)));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, maxWidth: '200px' }}>
        <div className="progress-bar" style={{ height: '8px' }}>
          <div className="progress-fill" style={{ width: `${value || 0}%` }} />
        </div>
      </div>
      <input
        className="form-input"
        style={{ width: '70px', textAlign: 'center' }}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        placeholder="0"
      />
      <span style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>%</span>
    </div>
  );
}

export default function RecordPage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState({}); // { task_id: { value, id } }
  const [saving, setSaving] = useState({});
  const { success, error } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, logsRes] = await Promise.all([
        api.get('/api/todo/tasks'),
        api.get('/api/todo/logs', { params: { date } }),
      ]);

      const allTasks = tasksRes.data;
      const dueTasks = allTasks.filter((t) => isTaskDueOnDate(t, date));
      setTasks(dueTasks);

      const logMap = {};
      logsRes.data.forEach((l) => {
        logMap[l.task_id] = { value: l.value, id: l.id };
      });
      setLogs(logMap);
    } catch {
      error('데이터를 불러오지 못했습니다.');
    }
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = async (taskId, metricType, rawValue) => {
    if (rawValue === null) return; // null은 미입력 상태

    const finalValue = metricType === 'boolean' ? rawValue : rawValue;

    setSaving((s) => ({ ...s, [taskId]: true }));
    try {
      const res = await api.post('/api/todo/logs', {
        task_id: taskId,
        log_date: date,
        value: finalValue,
      });
      setLogs((prev) => ({ ...prev, [taskId]: { value: res.data.value, id: res.data.id } }));
    } catch {
      error('저장에 실패했습니다.');
    } finally {
      setSaving((s) => ({ ...s, [taskId]: false }));
    }
  };
  const requiredTasks = tasks.filter((t) => !t.is_optional);
  const completedCount = requiredTasks.filter((t) => {
    const log = logs[t.id];
    return log && log.value > 0;
  }).length;

  const overallProgress = requiredTasks.length > 0
    ? Math.round((completedCount / requiredTasks.length) * 100)
    : 0;
  return (
    <div className="main-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setDate(format(subDays(new Date(date), 1), 'yyyy-MM-dd'))}
          >←</button>
          <h2>{formatDisplayDate(date)}</h2>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setDate(format(addDays(new Date(date), 1), 'yyyy-MM-dd'))}
            disabled={date >= format(new Date(), 'yyyy-MM-dd')}
          >→</button>
        </div>
        <input
          type="date"
          className="form-input"
          style={{ width: 'auto', fontSize: '0.85rem' }}
          value={date}
          max={format(new Date(), 'yyyy-MM-dd')}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* 오늘의 진행률 */}
      {tasks.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 600 }}>오늘의 달성률</span>
            <span style={{ color: 'var(--accent-2)', fontWeight: 700 }}>{overallProgress}%</span>
          </div>
          <div className="progress-bar" style={{ height: '10px' }}>
            <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '8px' }}>
            {completedCount} / {requiredTasks.length} 완료
            {tasks.length > requiredTasks.length && (
              <span style={{ color: 'var(--text-3)', marginLeft: '8px' }}>
                (선택사항 {tasks.length - requiredTasks.length}개 별도)
              </span>
            )}
          </p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <p>오늘 예정된 할 일이 없어요.<br />할 일 관리에서 새로 추가해 보세요.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map((task) => {
            const log = logs[task.id];
            const isSaving = saving[task.id];
            const isDone = log && log.value > 0;

            return (
              <div
                key={task.id}
                className="card"
                style={{
                  borderColor: isDone ? 'rgba(74,222,128,0.3)' : undefined,
                  background: isDone ? 'rgba(74,222,128,0.04)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{task.title}</div>
                    {task.description && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{task.description}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isSaving && <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>저장 중...</span>}
                    {isDone && !isSaving && <span className="badge badge-green">✓ 완료</span>}
                  </div>
                </div>

                {task.metric_type === 'boolean' ? (
                  <BooleanInput
                    value={log?.value ?? null}
                    onChange={(v) => handleChange(task.id, task.metric_type, v)}
                  />
                ) : (
                  <PercentageInput
                    value={log?.value ?? null}
                    onChange={(v) => handleChange(task.id, task.metric_type, v)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
