// Pomodoro localStorage helpers & TypeScript types

// ===== TYPES =====
export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  pomosBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

export type SessionType = 'focus' | 'shortBreak' | 'longBreak';

export type EisenhowerCategory = 'do' | 'decide' | 'delegate' | 'delete';

export const EISENHOWER_META: Record<EisenhowerCategory, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  axis: { urgent: boolean; important: boolean };
}> = {
  do:       { label: 'Do',       description: 'Get it done now',          color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)',   icon: '🔴', axis: { urgent: true,  important: true  } },
  decide:   { label: 'Decide',   description: 'Schedule a time to do it', color: '#eab308', bgColor: 'rgba(234,179,8,0.12)',   icon: '🟡', axis: { urgent: false, important: true  } },
  delegate: { label: 'Delegate', description: 'Who can do it for you?',   color: '#f97316', bgColor: 'rgba(249,115,22,0.12)',  icon: '🟠', axis: { urgent: true,  important: false } },
  delete:   { label: 'Delete',   description: 'Eliminate it',             color: '#6b7280', bgColor: 'rgba(107,114,128,0.12)', icon: '⚪', axis: { urgent: false, important: false } },
};

export const EISENHOWER_PRIORITY_ORDER: EisenhowerCategory[] = ['do', 'decide', 'delegate', 'delete'];

export interface PomodoroTask {
  id: string;
  title: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
  category?: EisenhowerCategory;
}

export interface SessionRecord {
  startedAt: string;
  endedAt: string;
  type: SessionType;
  taskId?: string;
  completed: boolean;
}

export interface DailyRecord {
  date: string;
  completedPomodoros: number;
  totalFocusMinutes: number;
  tasksCompleted: number;
  sessions: SessionRecord[];
}

export interface TimerState {
  sessionType: SessionType;
  timeLeft: number;
  isRunning: boolean;
  lastUpdated: string;
  activeTaskId: string | null;
  completedPomos: number;
  sessionStartedAt: string | null;
}

// ===== DEFAULTS =====
export const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomosBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
};

// ===== STORAGE KEYS =====
const KEYS = {
  settings: 'pomodoro_settings',
  tasks: 'pomodoro_tasks',
  history: 'pomodoro_history',
  state: 'pomodoro_state',
} as const;

// ===== HELPERS =====
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded — silently fail */ }
}

// ===== SETTINGS =====
export function loadSettings(): PomodoroSettings {
  return { ...DEFAULT_SETTINGS, ...safeGet(KEYS.settings, {}) };
}

export function saveSettings(s: PomodoroSettings): void {
  safeSet(KEYS.settings, s);
}

// ===== TASKS =====
export function loadTasks(): PomodoroTask[] {
  return safeGet<PomodoroTask[]>(KEYS.tasks, []);
}

export function saveTasks(tasks: PomodoroTask[]): void {
  safeSet(KEYS.tasks, tasks);
}

// ===== HISTORY =====
export function loadHistory(): DailyRecord[] {
  return safeGet<DailyRecord[]>(KEYS.history, []);
}

export function saveHistory(h: DailyRecord[]): void {
  safeSet(KEYS.history, h);
}

// ===== TIMER STATE =====
export function loadTimerState(): TimerState | null {
  return safeGet<TimerState | null>(KEYS.state, null);
}

export function saveTimerState(state: TimerState): void {
  safeSet(KEYS.state, state);
}

export function clearTimerState(): void {
  localStorage.removeItem(KEYS.state);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getTodayRecord(history: DailyRecord[]): DailyRecord {
  const key = todayKey();
  return history.find(r => r.date === key) || {
    date: key,
    completedPomodoros: 0,
    totalFocusMinutes: 0,
    tasksCompleted: 0,
    sessions: [],
  };
}

export function upsertTodayRecord(history: DailyRecord[], record: DailyRecord): DailyRecord[] {
  const key = todayKey();
  const idx = history.findIndex(r => r.date === key);
  if (idx >= 0) {
    const copy = [...history];
    copy[idx] = record;
    return copy;
  }
  return [...history, record];
}

// ===== AUDIO =====
export function playCompletionSound(): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    // Second beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1000;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc2.start(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 0.8);
  } catch { /* no audio support */ }
}

export function sendNotification(title: string, body: string): void {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '🍅' });
    }
  } catch { /* notifications not supported */ }
}

export function requestNotificationPermission(): void {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  } catch { /* not supported */ }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
