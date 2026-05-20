import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { X, Check } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await apiFetch<User[]>('/api/auth/users');
        setUsers(data);
      } catch (err: any) {
        console.error('Failed to load users for project assignment:', err);
      }
    }
    if (isOpen) {
      loadUsers();
      setName('');
      setDescription('');
      setSelectedUserIds([]);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUserToggle = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          memberIds: selectedUserIds
        })
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/50">
          <h3 className="text-lg font-bold">Create New Project</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800/40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Project Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-500/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-[var(--text-main)] placeholder-slate-500 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief summary of the project goals..."
              rows={3}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-500/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-[var(--text-main)] placeholder-slate-500 transition-all resize-none"
            />
          </div>

          {/* Members list checkbox */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Assign Team Members</label>
            <div className="border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-xl max-h-48 overflow-y-auto divide-y divide-[var(--border-color)]">
              {users.length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--text-muted)]">No members found.</div>
              ) : (
                users.map(u => (
                  <label 
                    key={u.id}
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--card-bg)] transition-colors select-none"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{u.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">{u.email} ({u.role})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUserToggle(u.id)}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                        selectedUserIds.includes(u.id)
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-[var(--border-color)] hover:border-slate-500 bg-transparent'
                      }`}
                    >
                      {selectedUserIds.includes(u.id) && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </label>
                ))
              )}
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
            {submitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};
