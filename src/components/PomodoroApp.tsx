import { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/pomodoro.css';
import {
  loadSettings, saveSettings, loadTasks, saveTasks, loadHistory, saveHistory,
  loadTimerState, saveTimerState, clearTimerState,
  getTodayRecord, upsertTodayRecord, playCompletionSound, sendNotification,
  requestNotificationPermission, DEFAULT_SETTINGS,
  type PomodoroSettings, type SessionType, type PomodoroTask, type DailyRecord,
} from '../lib/pomodoro-storage';
import TaskList from './pomodoro/TaskList';
import Analytics from './pomodoro/Analytics';
import PrioritizeModal from './pomodoro/PrioritizeModal';

type Tab = 'timer' | 'tasks' | 'analytics';

export default function PomodoroApp() {
  // ----- State -----
  const [tab, setTab] = useState<Tab>('timer');
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomos, setCompletedPomos] = useState(0);
  const [tasks, setTasks] = useState<PomodoroTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [pulse, setPulse] = useState(false);
  const [showPrioritizeModal, setShowPrioritizeModal] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const sessionStartRef = useRef<string | null>(null);

  // ----- Load from localStorage on mount -----
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    
    // Restore timer state
    const saved = loadTimerState();
    if (saved) {
      setSessionType(saved.sessionType);
      setActiveTaskId(saved.activeTaskId);
      setCompletedPomos(saved.completedPomos);
      sessionStartRef.current = saved.sessionStartedAt;

      if (saved.isRunning && saved.sessionStartedAt) {
        const now = new Date().getTime();
        const lastUpdated = new Date(saved.lastUpdated).getTime();
        const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);
        const newTimeLeft = Math.max(0, saved.timeLeft - elapsedSeconds);
        
        setTimeLeft(newTimeLeft);
        setIsRunning(true);
      } else {
        setTimeLeft(saved.timeLeft);
        setIsRunning(false);
      }
    } else {
      setTimeLeft(s.focusDuration * 60);
    }
    
    setTasks(loadTasks());
    setHistory(loadHistory());
    requestNotificationPermission();
  }, []);

  // ----- Persist timer state to localStorage -----
  useEffect(() => {
    saveTimerState({
      sessionType,
      timeLeft,
      isRunning,
      lastUpdated: new Date().toISOString(),
      activeTaskId,
      completedPomos,
      sessionStartedAt: sessionStartRef.current,
    });
  }, [sessionType, timeLeft, isRunning, activeTaskId, completedPomos]);

  // ----- Derived values -----
  const totalSeconds = sessionType === 'focus'
    ? settings.focusDuration * 60
    : sessionType === 'shortBreak'
      ? settings.shortBreakDuration * 60
      : settings.longBreakDuration * 60;

  const progress = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - progress);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // ----- Timer tick -----
  useEffect(() => {
    if (!isRunning) return;
    if (!sessionStartRef.current) sessionStartRef.current = new Date().toISOString();

    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  // ----- Handle timer reaching zero -----
  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    playCompletionSound();
    setPulse(true);
    setTimeout(() => setPulse(false), 2000);

    const now = new Date().toISOString();
    const session = {
      startedAt: sessionStartRef.current || now,
      endedAt: now,
      type: sessionType,
      taskId: activeTaskId || undefined,
      completed: true,
    };
    sessionStartRef.current = null;

    if (sessionType === 'focus') {
      const newCompleted = completedPomos + 1;
      setCompletedPomos(newCompleted);

      // Update active task
      if (activeTaskId) {
        const updatedTasks = tasks.map(t =>
          t.id === activeTaskId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
        );
        setTasks(updatedTasks);
        saveTasks(updatedTasks);
      }

      // Update history
      const h = loadHistory();
      const todayRec = getTodayRecord(h);
      todayRec.completedPomodoros += 1;
      todayRec.totalFocusMinutes += settings.focusDuration;
      todayRec.sessions.push(session);
      const newHistory = upsertTodayRecord(h, todayRec);
      setHistory(newHistory);
      saveHistory(newHistory);

      sendNotification('🍅 Pomodoro Complete!', 'Great work! Time for a break.');

      // Auto-transition to break
      const isLongBreak = newCompleted % settings.pomosBeforeLongBreak === 0;
      const nextType: SessionType = isLongBreak ? 'longBreak' : 'shortBreak';
      setSessionType(nextType);
      setTimeLeft(isLongBreak ? settings.longBreakDuration * 60 : settings.shortBreakDuration * 60);
      if (settings.autoStartBreaks) {
        setTimeout(() => setIsRunning(true), 500);
      }
    } else {
      // Break completed
      sendNotification('☕ Break Over!', 'Ready to focus again?');

      // Record break session
      const h = loadHistory();
      const todayRec = getTodayRecord(h);
      todayRec.sessions.push(session);
      const newHistory = upsertTodayRecord(h, todayRec);
      setHistory(newHistory);
      saveHistory(newHistory);

      setSessionType('focus');
      setTimeLeft(settings.focusDuration * 60);
      if (settings.autoStartFocus) {
        setTimeout(() => setIsRunning(true), 500);
      }
    }
  }, [sessionType, completedPomos, activeTaskId, tasks, settings]);

  useEffect(() => {
    if (timeLeft === 0 && !isRunning) return;
    if (timeLeft === 0) handleSessionComplete();
  }, [timeLeft, isRunning, handleSessionComplete]);

  // ----- Controls -----
  const toggleTimer = () => {
    if (!isRunning && !sessionStartRef.current) sessionStartRef.current = new Date().toISOString();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    sessionStartRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(totalSeconds);
  };

  const switchSession = (type: SessionType) => {
    setIsRunning(false);
    sessionStartRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSessionType(type);
    const dur = type === 'focus' ? settings.focusDuration
      : type === 'shortBreak' ? settings.shortBreakDuration
      : settings.longBreakDuration;
    setTimeLeft(dur * 60);
  };

  // ----- Settings handlers -----
  const updateSetting = <K extends keyof PomodoroSettings>(key: K, value: PomodoroSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
    // If changing the duration of current session and timer hasn't started
    if (!isRunning && !sessionStartRef.current) {
      if (key === 'focusDuration' && sessionType === 'focus') setTimeLeft((value as number) * 60);
      if (key === 'shortBreakDuration' && sessionType === 'shortBreak') setTimeLeft((value as number) * 60);
      if (key === 'longBreakDuration' && sessionType === 'longBreak') setTimeLeft((value as number) * 60);
    }
  };

  // ----- Task handlers -----
  const handleTasksChange = (t: PomodoroTask[]) => { setTasks(t); saveTasks(t); };

  // ----- Analytics handlers -----
  const handleExport = () => {
    const data = { settings, tasks, history, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pomodoro-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (!confirm('Clear all Pomodoro data? This cannot be undone.')) return;
    setHistory([]); saveHistory([]);
    setCompletedPomos(0);
    clearTimerState();
    resetTimer();
  };

  // ----- Update page title -----
  useEffect(() => {
    if (isRunning) {
      document.title = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} — ${sessionType === 'focus' ? 'Focus' : 'Break'}`;
    } else {
      document.title = 'Pomodoro Timer — Trong Dinh';
    }
    return () => { document.title = 'Pomodoro Timer — Trong Dinh'; };
  }, [isRunning, minutes, seconds, sessionType]);

  const isBreak = sessionType !== 'focus';

  return (
    <div className="pomodoro-container">
      {/* Tab navigation */}
      <div className="pomo-tab-nav">
        <button className={`pomo-tab-btn${tab === 'timer' ? ' active' : ''}`} onClick={() => setTab('timer')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L2 6"/><path d="M22 6l-3-3"/></svg>
          Timer
        </button>
        <button className={`pomo-tab-btn${tab === 'tasks' ? ' active' : ''}`} onClick={() => setTab('tasks')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          Tasks
        </button>
        <button className={`pomo-tab-btn${tab === 'analytics' ? ' active' : ''}`} onClick={() => setTab('analytics')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          Analytics
        </button>
      </div>

      {/* Timer Tab */}
      {tab === 'timer' && (
        <div className="timer-section">
          {/* Session type tabs */}
          <div className="session-tabs">
            <button className={`session-tab${sessionType === 'focus' ? ' active' : ''}`} onClick={() => switchSession('focus')}>Focus</button>
            <button className={`session-tab${sessionType === 'shortBreak' ? ' active break-tab' : ''}`} onClick={() => switchSession('shortBreak')}>Short Break</button>
            <button className={`session-tab${sessionType === 'longBreak' ? ' active break-tab' : ''}`} onClick={() => switchSession('longBreak')}>Long Break</button>
          </div>

          {/* Timer ring */}
          <div className={`timer-ring-container${pulse ? ' pulse' : ''}`}>
            <svg className="timer-ring-svg" viewBox="0 0 260 260">
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <circle className="timer-ring-bg" cx="130" cy="130" r="120" />
              <circle
                className={`timer-ring-progress${isBreak ? ' break-ring' : ''}`}
                cx="130" cy="130" r="120"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="timer-display">
              <div className="timer-digits">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
              <div className="timer-label">{sessionType === 'focus' ? 'Focus' : sessionType === 'shortBreak' ? 'Short Break' : 'Long Break'}</div>
            </div>
          </div>

          {/* Pomodoro count dots */}
          <div className="pomodoro-count">
            {Array.from({ length: settings.pomosBeforeLongBreak }, (_, i) => (
              <div key={i} className={`pomo-dot${i < (completedPomos % settings.pomosBeforeLongBreak) ? ' filled' : ''}`} />
            ))}
          </div>

          {/* Controls */}
          <div className="timer-controls">
            <button className="btn-icon" onClick={resetTimer} title="Reset">↺</button>
            <button className="btn" onClick={toggleTimer}>{isRunning ? '⏸ Pause' : '▶ Start'}</button>
            <button className="btn-icon" onClick={() => setShowSettings(!showSettings)} title="Settings">⚙</button>
          </div>

          {/* Active task indicator (fixed height to prevent layout shift) */}
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', minHeight: '1.5em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {activeTaskId ? (
              <span>Working on: <strong style={{ color: 'var(--accent-cyan)' }}>{tasks.find(t => t.id === activeTaskId)?.title}</strong></span>
            ) : null}
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="settings-panel">
              <div className="settings-grid">
                <div className="setting-item">
                  <label className="setting-label">Focus (min)</label>
                  <input className="setting-input" type="number" min={1} max={120} value={settings.focusDuration}
                    onChange={e => updateSetting('focusDuration', Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))} />
                </div>
                <div className="setting-item">
                  <label className="setting-label">Short Break (min)</label>
                  <input className="setting-input" type="number" min={1} max={30} value={settings.shortBreakDuration}
                    onChange={e => updateSetting('shortBreakDuration', Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))} />
                </div>
                <div className="setting-item">
                  <label className="setting-label">Long Break (min)</label>
                  <input className="setting-input" type="number" min={1} max={60} value={settings.longBreakDuration}
                    onChange={e => updateSetting('longBreakDuration', Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))} />
                </div>
                <div className="setting-item">
                  <label className="setting-label">Pomos before long break</label>
                  <input className="setting-input" type="number" min={1} max={10} value={settings.pomosBeforeLongBreak}
                    onChange={e => updateSetting('pomosBeforeLongBreak', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))} />
                </div>
                <div className="setting-item full-width">
                  <div className="toggle-row">
                    <span className="setting-label">Auto-start breaks</span>
                    <button className={`toggle-switch${settings.autoStartBreaks ? ' on' : ''}`}
                      onClick={() => updateSetting('autoStartBreaks', !settings.autoStartBreaks)} />
                  </div>
                </div>
                <div className="setting-item full-width">
                  <div className="toggle-row">
                    <span className="setting-label">Auto-start focus</span>
                    <button className={`toggle-switch${settings.autoStartFocus ? ' on' : ''}`}
                      onClick={() => updateSetting('autoStartFocus', !settings.autoStartFocus)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prioritize button + Quick task list on timer tab */}
          <div className="timer-task-header">
            <button className="prioritize-btn" onClick={() => setShowPrioritizeModal(true)} title="Prioritize tasks using Eisenhower Matrix">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Prioritize
            </button>
          </div>
          <TaskList tasks={tasks} activeTaskId={activeTaskId} onTasksChange={handleTasksChange} onSetActive={setActiveTaskId} />

          {/* Prioritize Modal */}
          {showPrioritizeModal && (
            <PrioritizeModal
              tasks={tasks}
              activeTaskId={activeTaskId}
              onTasksChange={handleTasksChange}
              onSetActive={setActiveTaskId}
              onClose={() => setShowPrioritizeModal(false)}
            />
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <TaskList tasks={tasks} activeTaskId={activeTaskId} onTasksChange={handleTasksChange} onSetActive={setActiveTaskId} />
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <Analytics history={history} tasks={tasks} onExport={handleExport} onClear={handleClear} />
      )}
    </div>
  );
}
