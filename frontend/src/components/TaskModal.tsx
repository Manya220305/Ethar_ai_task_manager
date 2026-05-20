import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { X } from 'lucide-react';

interface ProjectMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  due_date: string | null;
  assignee_id: number | null;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  projectMembers: ProjectMember[];
  taskToEdit?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectMembers,
  taskToEdit
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'To Do' | 'In Progress' | 'Review' | 'Completed'>('To Do');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>(''); // empty string means unassigned
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setStatus(taskToEdit.status);
        setPriority(taskToEdit.priority);
        setDueDate(taskToEdit.due_date ? taskToEdit.due_date.split('T')[0] : '');
        setAssigneeId(taskToEdit.assignee_id ? String(taskToEdit.assignee_id) : '');
      } else {
        setTitle('');
        setDescription('');
        setStatus('To Do');
        setPriority('Medium');
        setDueDate('');
        setAssigneeId('');
      }
    }
  }, [isOpen, taskToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_date: dueDate || null,
      assignee_id: assigneeId ? Number(assigneeId) : null
    };

    try {
      if (taskToEdit) {
        await apiFetch(`/api/tasks/${taskToEdit.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch(`/api/tasks/project/${projectId}`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/50">
          <h3 className="text-lg font-bold">
            {taskToEdit ? 'Edit Task' : 'Create Task'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800/40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Task Title</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design homepage Mockup"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-500/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-[var(--text-main)] placeholder-slate-500 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the task details and requirements..."
              rows={3}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-500/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-[var(--text-main)] placeholder-slate-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-500/50 focus:border-indigo-500 outline-none rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] transition-all cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-500/50 focus:border-indigo-500 outline-none rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] transition-all cursor-pointer"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Due Date</label>
              <input 
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-500/50 focus:border-indigo-500 outline-none rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] transition-all cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-500/50 focus:border-indigo-500 outline-none rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] transition-all cursor-pointer"
              >
                <option value="">Unassigned</option>
                {projectMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border-color)] hover:bg-[var(--card-bg)] text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-medium text-white rounded-lg transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Save Task'}
          </button>
        </div>
      </div>
    </div>
  );
};
