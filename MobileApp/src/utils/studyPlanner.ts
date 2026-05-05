import { DeadlineCandidate, StudyBlock, TaskItem } from '../types/study';

const DATE_PATTERN = /(\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?)/;
const KEYWORDS = ['due', 'deadline', 'exam', 'quiz', 'submit', 'assignment'];
const POMODORO_MINUTES = 25;

function normalizeDate(rawDate: string): string {
  const cleaned = rawDate.replace(/[.-]/g, '/');
  const parts = cleaned.split('/').map(Number);

  if (parts.length < 2) {
    return new Date().toISOString();
  }

  const day = parts[0];
  const month = parts[1] - 1;
  let year = parts[2];

  if (!year) {
    year = new Date().getFullYear();
  }

  if (year < 100) {
    year += 2000;
  }

  const date = new Date(year, month, day, 12, 0, 0, 0);
  return date.toISOString();
}

function estimatePomodoros(line: string): number {
  const lengthScore = Math.ceil(line.length / 70);
  return Math.max(1, Math.min(6, lengthScore));
}

function getActiveTasks(tasks: TaskItem[]) {
  return tasks
    .filter(task => task.status !== 'done')
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function calculateDailyStreak(tasks: TaskItem[]) {
  const doneDates = tasks
    .filter(task => task.status === 'done' && task.completedAt)
    .map(task => toDateKey(new Date(task.completedAt as string)));

  const uniqueDates = new Set(doneDates);
  if (uniqueDates.size === 0) {
    return 0;
  }

  const todayKey = toDateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  const startKey = uniqueDates.has(todayKey)
    ? todayKey
    : uniqueDates.has(yesterdayKey)
      ? yesterdayKey
      : null;

  if (!startKey) {
    return 0;
  }

  let streak = 0;
  let cursor = parseDateKey(startKey);

  while (uniqueDates.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function extractDeadlineCandidates(scannedText: string): DeadlineCandidate[] {
  return scannedText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => KEYWORDS.some(keyword => line.toLowerCase().includes(keyword)) || DATE_PATTERN.test(line))
    .map(line => {
      const dateMatch = line.match(DATE_PATTERN);
      const dueDate = dateMatch ? normalizeDate(dateMatch[0]) : new Date().toISOString();

      return {
        title: line.slice(0, 72),
        dueDate,
        confidence: dateMatch ? 0.86 : 0.62,
        sourceSnippet: line,
      };
    });
}

export function convertCandidatesToDraftTasks(candidates: DeadlineCandidate[]): TaskItem[] {
  return candidates.map((candidate, index) => ({
    id: `draft-${Date.now()}-${index}`,
    title: candidate.title,
    dueDate: candidate.dueDate,
    status: 'draft',
    source: 'scan',
    estimatedPomodoros: estimatePomodoros(candidate.sourceSnippet),
    priority: 'medium',
  }));
}

export function buildTodayPlan(tasks: TaskItem[]): StudyBlock[] {
  const activeTasks = getActiveTasks(tasks).slice(0, 3);

  return activeTasks.map(task => ({
    title: task.title,
    pomodoros: task.estimatedPomodoros,
    minutes: task.estimatedPomodoros * POMODORO_MINUTES,
  }));
}

export function buildFocusPlan(tasks: TaskItem[], sessionMinutes: number): StudyBlock[] {
  const activeTasks = getActiveTasks(tasks);
  const plan: StudyBlock[] = [];
  let remainingMinutes = sessionMinutes;

  for (const task of activeTasks) {
    if (remainingMinutes <= 0) {
      break;
    }

    const taskMinutes = task.estimatedPomodoros * POMODORO_MINUTES;

    if (taskMinutes > remainingMinutes) {
      continue;
    }

    plan.push({
      title: task.title,
      pomodoros: task.estimatedPomodoros,
      minutes: taskMinutes,
    });
    remainingMinutes -= taskMinutes;
  }

  return plan;
}

export function summarizeStats(tasks: TaskItem[]) {
  const done = tasks.filter(task => task.status === 'done').length;
  const drafts = tasks.filter(task => task.status === 'draft').length;
  const pending = tasks.filter(task => task.status !== 'done').length;
  const totalPomodorosPlanned = tasks.reduce((sum, task) => sum + task.estimatedPomodoros, 0);
  const totalPomodorosDone = tasks
    .filter(task => task.status === 'done')
    .reduce((sum, task) => sum + task.estimatedPomodoros, 0);
  const dailyStreak = calculateDailyStreak(tasks);

  return {
    done,
    drafts,
    pending,
    totalPomodorosPlanned,
    totalPomodorosDone,
    dailyStreak,
  };
}
