import { useState, useRef, useEffect } from 'react';
import type { PomodoroTask, EisenhowerCategory } from '../../lib/pomodoro-storage';
import { generateId, EISENHOWER_META } from '../../lib/pomodoro-storage';
import DeleteConfirmModal from './DeleteConfirmModal';

function EisenhowerLegend() {
  return (
    <div className="eisenhower-legend">
      {(Object.keys(EISENHOWER_META) as EisenhowerCategory[]).map(key => {
        const m = EISENHOWER_META[key];
        return (
          <div key={key} className="legend-item" title={m.description}>
            <span className="category-dot" style={{ background: m.color }} />
            <span className="legend-label">{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  tasks: PomodoroTask[];
  activeTaskId: string | null;
  onTasksChange: (tasks: PomodoroTask[]) => void;
  onSetActive: (id: string | null) => void;
}

function CategoryBadge({ category, onChange }: { category: EisenhowerCategory; onChange: (c: EisenhowerCategory) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const meta = EISENHOWER_META[category];

  return (
    <div className="category-badge-wrapper" ref={ref}>
      <button
        className="category-badge"
        style={{ background: meta.color }}
        onClick={e => { e.stopPropagation(); setOpen(!open); }}
        title={`${meta.label}: ${meta.description}`}
      />
      {open && (
        <div className="category-dropdown">
          {(Object.keys(EISENHOWER_META) as EisenhowerCategory[]).map(key => {
            const m = EISENHOWER_META[key];
            return (
              <button
                key={key}
                className={`category-dropdown-item${key === category ? ' selected' : ''}`}
                onClick={e => { e.stopPropagation(); onChange(key); setOpen(false); }}
              >
                <span className="category-dot" style={{ background: m.color }} />
                <span>{m.label}</span>
                <span className="category-desc">{m.description}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategorySelector({ value, onChange }: { value: EisenhowerCategory; onChange: (c: EisenhowerCategory) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const meta = EISENHOWER_META[value];

  return (
    <div className="category-selector-wrapper" ref={ref}>
      <button
        className="category-selector-btn"
        onClick={() => setOpen(!open)}
        title="Select priority category"
        type="button"
      >
        <span className="category-dot" style={{ background: meta.color }} />
        <span>{meta.label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <div className="category-dropdown">
          {(Object.keys(EISENHOWER_META) as EisenhowerCategory[]).map(key => {
            const m = EISENHOWER_META[key];
            return (
              <button
                key={key}
                className={`category-dropdown-item${key === value ? ' selected' : ''}`}
                onClick={() => { onChange(key); setOpen(false); }}
              >
                <span className="category-dot" style={{ background: m.color }} />
                <span>{m.label}</span>
                <span className="category-desc">{m.description}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TaskList({ tasks, activeTaskId, onTasksChange, onSetActive }: Props) {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EisenhowerCategory>('do');
  const [taskToDelete, setTaskToDelete] = useState<PomodoroTask | null>(null);

  const addTask = () => {
    const title = newTitle.trim();
    if (!title) return;
    const task: PomodoroTask = {
      id: generateId(),
      title,
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      category: newCategory,
    };
    onTasksChange([...tasks, task]);
    setNewTitle('');
  };

  const toggleComplete = (id: string) => {
    onTasksChange(tasks.map(t =>
      t.id === id ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? new Date().toISOString() : undefined } : t
    ));
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) setTaskToDelete(task);
  };

  const confirmDelete = () => {
    if (!taskToDelete) return;
    if (activeTaskId === taskToDelete.id) onSetActive(null);
    onTasksChange(tasks.filter(t => t.id !== taskToDelete.id));
    setTaskToDelete(null);
  };

  const updateEstimate = (id: string, val: number) => {
    const est = Math.max(1, Math.min(20, val || 1));
    onTasksChange(tasks.map(t => t.id === id ? { ...t, estimatedPomodoros: est } : t));
  };

  const updateCategory = (id: string, category: EisenhowerCategory) => {
    onTasksChange(tasks.map(t => t.id === id ? { ...t, category } : t));
  };

  const activeTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  return (
    <div className="task-section">
      <div className="task-section-header">
        <h3>📋 Tasks</h3>
        <span className="task-count">
          {activeTasks.length} active · {completedTasks.length} done
        </span>
      </div>

      <div className="task-input-row">
        <div className="task-input-group">
          <input
            type="text"
            placeholder="What are you working on?"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
          <CategorySelector value={newCategory} onChange={setNewCategory} />
        </div>
        <button className="btn add-task-btn" onClick={addTask}>+ Add</button>
      </div>

      <div className="task-list">
        {tasks.length === 0 && (
          <div className="task-empty">No tasks yet. Add one above to get started!</div>
        )}
        {activeTasks.map(task => (
          <div
            key={task.id}
            className={`task-item${activeTaskId === task.id ? ' active-task' : ''}`}
            onClick={() => onSetActive(activeTaskId === task.id ? null : task.id)}
          >
            <button
              className={`task-checkbox${task.isCompleted ? ' checked' : ''}`}
              onClick={e => { e.stopPropagation(); toggleComplete(task.id); }}
            >✓</button>
            <span className="task-name">{task.title}</span>
            <CategoryBadge
              category={task.category || 'do'}
              onChange={c => updateCategory(task.id, c)}
            />
            <div className="task-controls">
              <div className="task-pomodoros">
                <span className="task-pomo-icon main-icon">🍅</span>
                <span className="task-pomo-count">
                  {task.completedPomodoros}/{task.estimatedPomodoros}
                </span>
              </div>
              <input
                type="number"
                className="task-est-input"
                value={task.estimatedPomodoros}
                min={1} max={20}
                onClick={e => e.stopPropagation()}
                onChange={e => updateEstimate(task.id, parseInt(e.target.value))}
                title="Estimated pomodoros"
              />
              <div className="task-actions">
                <button className="task-action-btn" onClick={e => { e.stopPropagation(); deleteTask(task.id); }} title="Delete">✕</button>
              </div>
            </div>
          </div>
        ))}
        {completedTasks.length > 0 && (
          <>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5em 0', marginTop: '0.5em' }}>
              Completed ({completedTasks.length})
            </div>
            {completedTasks.map(task => (
              <div key={task.id} className="task-item completed-task">
                <button
                  className="task-checkbox checked"
                  onClick={() => toggleComplete(task.id)}
                >✓</button>
                <span className="task-name">{task.title}</span>
                <CategoryBadge
                  category={task.category || 'do'}
                  onChange={c => updateCategory(task.id, c)}
                />
                <div className="task-controls">
                  <div className="task-pomodoros">
                    <span className="task-pomo-icon main-icon">🍅</span>
                    <span className="task-pomo-count">
                      {task.completedPomodoros}/{task.estimatedPomodoros}
                    </span>
                  </div>
                  <div className="task-actions">
                    <button className="task-action-btn" onClick={() => deleteTask(task.id)} title="Delete">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <EisenhowerLegend />

      <DeleteConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDelete}
        taskTitle={taskToDelete?.title || ''}
      />
    </div>
  );
}
