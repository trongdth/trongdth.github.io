import { useState } from 'react';
import type { PomodoroTask } from '../../lib/pomodoro-storage';
import { generateId } from '../../lib/pomodoro-storage';

interface Props {
  tasks: PomodoroTask[];
  activeTaskId: string | null;
  onTasksChange: (tasks: PomodoroTask[]) => void;
  onSetActive: (id: string | null) => void;
}

export default function TaskList({ tasks, activeTaskId, onTasksChange, onSetActive }: Props) {
  const [newTitle, setNewTitle] = useState('');

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
    if (activeTaskId === id) onSetActive(null);
    onTasksChange(tasks.filter(t => t.id !== id));
  };

  const updateEstimate = (id: string, val: number) => {
    const est = Math.max(1, Math.min(20, val || 1));
    onTasksChange(tasks.map(t => t.id === id ? { ...t, estimatedPomodoros: est } : t));
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
        <input
          type="text"
          placeholder="What are you working on?"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <button className="btn" onClick={addTask} style={{ whiteSpace: 'nowrap' }}>+ Add</button>
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
            <div className="task-pomodoros">
              {Array.from({ length: task.estimatedPomodoros }, (_, i) => (
                <span key={i} className={`task-pomo-icon${i < task.completedPomodoros ? ' filled' : ''}`}>🍅</span>
              ))}
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
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {task.completedPomodoros}/{task.estimatedPomodoros}
                </span>
                <div className="task-actions">
                  <button className="task-action-btn" onClick={() => deleteTask(task.id)} title="Delete">✕</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
