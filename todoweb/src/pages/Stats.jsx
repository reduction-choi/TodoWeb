import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';
import api from '../lib/api';
import { useToast } from '../components/Toast';

const PRESETS = [
  { label: '최근 7일',  value: '7d' },
  { label: '최근 30일', value: '30d' },
  { label: '최근 3개월', value: '3m' },
  { label: '전체',      value: 'all' },
  { label: '기간 지정', value: 'custom' },
];

function getDateRange(preset) {
  const today = new Date();
  if (preset === '7d')  return { from: format(subDays(today, 6), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') };
  if (preset === '30d') return { from: format(subDays(today, 29), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') };
  if (preset === '3m')  return { from: format(subMonths(today, 3), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') };
  return { from: null, to: null }; // 'all' or 'custom'
}

const COLORS = ['#7c6af7', '#4ade80', '#fbbf24', '#f87171', '#60a5fa', '#e879f9'];

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [preset, setPreset] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const fetchTasks = async () => {
    try {
      const res = await api.get('/api/tasks');
      setTasks(res.data.filter((t) => t.is_active));
    } catch {}
  };

  const fetchStats = useCallback(async () => {
    // 커스텀 기간인데 날짜가 없으면 요청 안함
    if (preset === 'custom' && !customFrom) return;

    setLoading(true);
    try {
      let from, to;
      if (preset === 'custom') {
        from = customFrom;
        to = customTo;
      } else {
        ({ from, to } = getDateRange(preset));
      }

      const params = {};
      if (from) params.from = from;
      if (to)   params.to = to;
      if (selectedTaskIds.size > 0) params.task_id = [...selectedTaskIds][0];

      const res = await api.get('/api/stats', { params });
      setStats(res.data);
    } catch {
      error('통계를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [preset, customFrom, customTo, selectedTaskIds]);

  useEffect(() => { fetchTasks(); }, []);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const toggleTask = (id) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const trendData = (() => {
  if (!stats?.trend?.length) return [];
  const dateMap = {};
  stats.trend.forEach(({ date, title, avg_value }) => {
    if (!dateMap[date]) dateMap[date] = { date };
    dateMap[date][title] = avg_value;
  });

  // 빈 날짜를 0으로 채움
  const allDates = Object.keys(dateMap).sort();
  const firstDate = new Date(allDates[0]);
  const lastDate = new Date(allDates[allDates.length - 1]);
  const taskTitleList = [...new Set(stats.trend.map((t) => t.title))];

  for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
    const key = format(d, 'yyyy-MM-dd');
    if (!dateMap[key]) dateMap[key] = { date: key };
    taskTitleList.forEach((title) => {
      if (dateMap[key][title] === undefined) dateMap[key][title] = 0;
    });
  }

  return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
})();

  const taskTitles = [...new Set(stats?.trend?.map((t) => t.title) || [])];

  return (
    <div className="main-content">
      <div className="page-header">
        <h2>통계</h2>
        <p>기간별 성취도 변화를 확인하세요.</p>
      </div>

      {/* 필터 */}
      <div className="card" style={{ marginBottom: '24px' }}>
        {/* 기간 프리셋 */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>기간</p>
          <div className="chip-group">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                className={`chip${preset === p.value ? ' selected' : ''}`}
                onClick={() => setPreset(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 커스텀 날짜 선택 */}
        {preset === 'custom' && (
          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">시작일</label>
              <input
                type="date"
                className="form-input"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">종료일</label>
              <input
                type="date"
                className="form-input"
                value={customTo}
                min={customFrom}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* 할 일 필터 */}
        {tasks.length > 0 && (
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              할 일 필터 (미선택 시 전체)
            </p>
            <div className="chip-group">
              {tasks.map((t) => (
                <button
                  key={t.id}
                  className={`chip${selectedTaskIds.has(t.id) ? ' selected' : ''}`}
                  onClick={() => toggleTask(t.id)}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 커스텀인데 시작일 미설정 */}
      {preset === 'custom' && !customFrom ? (
        <div className="empty-state">
          <div className="empty-icon">◎</div>
          <p>시작일을 선택하면 통계를 볼 수 있어요.</p>
        </div>
      ) : loading ? (
        <div className="empty-state"><p>불러오는 중...</p></div>
      ) : !stats || stats.summary?.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◎</div>
          <p>선택한 기간에 기록된 데이터가 없어요.</p>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
            <SummaryCard
              label="전체 평균 성취도"
              value={`${stats.overall?.overall_avg ?? 0}%`}
              sub={`총 ${stats.overall?.total ?? 0}건 기록`}
            />
            <SummaryCard
              label="완료 횟수"
              value={stats.overall?.success ?? 0}
              sub="value > 0 기준"
            />
            <SummaryCard
              label="완료율"
              value={stats.overall?.total > 0
                ? `${Math.round((stats.overall.success / stats.overall.total) * 100)}%`
                : '—'}
              sub="전체 기록 대비"
            />
          </div>

          {/* 트렌드 차트 */}
          {trendData.length > 1 && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '20px' }}>성취도 변화</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--text-2)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  {taskTitles.map((title, i) => (
                    <Line
                      key={title}
                      type="monotone"
                      dataKey={title}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 태스크별 요약 */}
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '20px' }}>항목별 요약</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.summary}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="title" tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
                <Bar dataKey="avg_value" name="평균 성취도" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.summary.map((s, i) => (
                <div key={s.task_id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.875rem' }}>{s.title}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
                    평균 {s.avg_value}% · {s.total_logs}건
                  </span>
                  <span className={`badge ${s.avg_value >= 70 ? 'badge-green' : s.avg_value >= 40 ? 'badge-purple' : 'badge-red'}`}>
                    {s.avg_value >= 70 ? '우수' : s.avg_value >= 40 ? '보통' : '미흡'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '1.8rem', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--accent-2)' }}>{value}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '4px' }}>{sub}</p>
    </div>
  );
}
