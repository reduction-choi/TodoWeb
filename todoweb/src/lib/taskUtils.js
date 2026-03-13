import { format, getDay, getDate } from 'date-fns';

/**
 * 주어진 날짜에 해야 할 task인지 판별
 */
export function isTaskDueOnDate(task, date = new Date()) {
  if (!task.is_active) return false;

  const d = typeof date === 'string' ? new Date(date) : date;

  switch (task.frequency) {
    case 'daily':
      return true;

    case 'weekly': {
      const dayOfWeek = getDay(d);
      return (task.frequency_days || []).includes(dayOfWeek);
    }

    case 'monthly': {
      const dayOfMonth = getDate(d);
      return (task.frequency_days || []).includes(dayOfMonth);
    }

    case 'once': {
      if (!task.specific_date) return false;
      return format(d, 'yyyy-MM-dd') === task.specific_date;
    }

    default:
      return false;
  }
}

export function formatDate(date) {
  return format(typeof date === 'string' ? new Date(date) : date, 'yyyy-MM-dd');
}

export function formatDisplayDate(date) {
  return format(typeof date === 'string' ? new Date(date) : date, 'yyyy년 M월 d일');
}

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
export const FREQUENCY_LABELS = {
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
  once: '특정일',
};
