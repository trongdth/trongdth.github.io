import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, taskTitle }: Props) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="prioritize-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="prioritize-modal delete-confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '2em' }}>
        <div className="prioritize-header" style={{ marginBottom: '1em' }}>
          <h3 className="prioritize-title" style={{ color: '#ef4444' }}>🗑️ Delete Task?</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 1.5em' }}>
          Are you sure you want to delete "<strong>{taskTitle}</strong>"? This action cannot be undone.
        </p>
        <div className="prioritize-actions" style={{ gap: '0.75em' }}>
          <button className="btn" onClick={onClose} style={{ background: 'var(--bg-tertiary)', flex: 1 }}>
            Cancel
          </button>
          <button 
            className="btn" 
            onClick={() => { onConfirm(); onClose(); }}
            style={{ background: '#ef4444', color: 'white', border: 'none', flex: 1, fontWeight: '600' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
