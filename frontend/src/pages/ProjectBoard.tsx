import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { TaskModal } from '../components/TaskModal';
import { 
  Plus, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Calendar, 
  AlertCircle, 
  User, 
  X,
  Users
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description: string;
  creator_id: number;
}

interface ProjectMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  due_date: string | null;
  assignee_id: number | null;
  assignee_name: string | null;
  assignee_email: string | null;
  creator_name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const ProjectBoard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerRefresh } = useOutletContext<{ triggerRefresh: () => void }>();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  
  // Members editing state
  const [selectedAddUserId, setSelectedAddUserId] = useState('');
  const [memberError, setMemberError] = useState('');
  const [memberSubmitting, setMemberSubmitting] = useState(false);

  // Drag and drop states
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    async function loadBoardData() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        // Fetch project metadata (filter from all projects list)
        const projectsList = await apiFetch<Project[]>('/api/projects');
        const currentProject = projectsList.find(p => p.id === Number(id));
        if (!currentProject) {
          setError('Project not found or you do not have permission to view it.');
          setLoading(false);
          return;
        }
        setProject(currentProject);

        // Fetch project members
        const membersList = await apiFetch<ProjectMember[]>(`/api/projects/${id}/members`);
        setMembers(membersList);

        // Fetch tasks
        const tasksList = await apiFetch<Task[]>(`/api/tasks/project/${id}`);
        setTasks(tasksList);

        // Fetch all users (for adding members dropdown, if Admin)
        if (user?.role === 'Admin') {
          const usersList = await apiFetch<User[]>('/api/auth/users');
          setAllUsers(usersList);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load project board data');
      } finally {
        setLoading(false);
      }
    }
    loadBoardData();
  }, [id, user]);

  const refreshTasksAndMembers = async () => {
    if (!id) return;
    try {
      const membersList = await apiFetch<ProjectMember[]>(`/api/projects/${id}/members`);
      setMembers(membersList);
      const tasksList = await apiFetch<Task[]>(`/api/tasks/project/${id}`);
      setTasks(tasksList);
      triggerRefresh(); // Refresh sidebar project task counts
    } catch (err) {
      console.error('Failed to refresh project data:', err);
    }
  };

  // Add Member to Project (Admin only)
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddUserId || !id) return;

    setMemberSubmitting(true);
    setMemberError('');

    try {
      await apiFetch(`/api/projects/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: Number(selectedAddUserId) })
      });
      setSelectedAddUserId('');
      await refreshTasksAndMembers();
    } catch (err: any) {
      setMemberError(err.message || 'Failed to add member');
    } finally {
      setMemberSubmitting(false);
    }
  };

  // Remove Member from Project (Admin only)
  const handleRemoveMember = async (userId: number) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to remove this member from the project? They will be unassigned from all tasks.')) return;

    try {
      await apiFetch(`/api/projects/${id}/members/${userId}`, {
        method: 'DELETE'
      });
      await refreshTasksAndMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  // Update Task Status
  const handleStatusChange = async (taskId: number, newStatus: Task['status']) => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      await refreshTasksAndMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  // Delete Task (Admin only)
  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      await refreshTasksAndMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleEditTaskClick = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleCreateTaskClick = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleProjectDelete = async () => {
    if (!project || !id) return;
    if (!window.confirm(`WARNING: Are you sure you want to delete project "${project.name}"? This will delete all its tasks permanently.`)) return;

    try {
      await apiFetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });
      triggerRefresh();
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnTitle: Task['status']) => {
    e.preventDefault();
    if (dragOverColumn !== columnTitle) {
      setDragOverColumn(columnTitle);
    }
  };

  const handleDragLeave = () => {
    // We can clear but check if we're leaving the container
  };

  const handleDrop = async (e: React.DragEvent, columnTitle: Task['status']) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = Number(taskIdStr);
    
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (isNaN(taskId)) return;

    // Check if task is already in that column
    const taskObj = tasks.find(t => t.id === taskId);
    if (taskObj && taskObj.status !== columnTitle) {
      // Optimistically update frontend UI state for instant response
      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, status: columnTitle } : t)
      );
      
      // Update in backend
      try {
        await apiFetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          body: JSON.stringify({ status: columnTitle })
        });
        await refreshTasksAndMembers();
      } catch (err: any) {
        alert(err.message || 'Failed to save task status drop');
        await refreshTasksAndMembers(); // Revert back on error
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-center">
        {error || 'Project not found.'}
      </div>
    );
  }

  // Filter users not currently in the project
  const nonMembers = allUsers.filter(
    u => !members.some(m => m.id === u.id)
  );

  // Kanban Columns configuration with themes
  const columns: { title: Task['status']; bg: string; hoverGlow: string; text: string; border: string; glowClass: string }[] = [
    { 
      title: 'To Do', 
      bg: 'bg-slate-900/10 dark:bg-slate-900/30', 
      hoverGlow: 'glow-indigo-hover', 
      text: 'text-slate-500 dark:text-slate-400', 
      border: 'border-slate-350 dark:border-slate-800/80',
      glowClass: 'glow-indigo-hover'
    },
    { 
      title: 'In Progress', 
      bg: 'bg-indigo-950/5 dark:bg-indigo-950/10', 
      hoverGlow: 'glow-indigo-hover', 
      text: 'text-indigo-650 dark:text-indigo-400', 
      border: 'border-indigo-500/20 dark:border-indigo-500/10',
      glowClass: 'glow-indigo-hover'
    },
    { 
      title: 'Review', 
      bg: 'bg-amber-950/5 dark:bg-amber-950/10', 
      hoverGlow: 'glow-amber-hover', 
      text: 'text-amber-650 dark:text-amber-400', 
      border: 'border-amber-500/20 dark:border-amber-500/10',
      glowClass: 'glow-amber-hover'
    },
    { 
      title: 'Completed', 
      bg: 'bg-emerald-950/5 dark:bg-emerald-950/10', 
      hoverGlow: 'glow-emerald-hover', 
      text: 'text-emerald-650 dark:text-emerald-400', 
      border: 'border-emerald-500/20 dark:border-emerald-500/10',
      glowClass: 'glow-emerald-hover'
    },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Details - Glassmorphism */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-lg shadow-slate-950/5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{project.name}</h1>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">{project.description || 'No description provided.'}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Team Members Avatar Row Toggle */}
            <button 
              onClick={() => setShowMembersPanel(prev => !prev)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--card-bg)] text-[var(--text-main)] hover:text-white transition-all text-sm font-semibold cursor-pointer shadow-sm"
            >
              <Users className="w-4 h-4 text-indigo-500" />
              Team Members ({members.length})
            </button>

            {user?.role === 'Admin' && (
              <>
                <button 
                  onClick={handleCreateTaskClick}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-sm font-semibold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
                <button 
                  onClick={handleProjectDelete}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-600 transition-all text-sm font-semibold cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dynamic team members slide-down edit drawer */}
        {showMembersPanel && (
          <div className="mt-8 pt-6 border-t border-[var(--border-color)] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">Project Team Members</h3>
              <button 
                onClick={() => setShowMembersPanel(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Members List */}
              <div className="md:col-span-2 space-y-2 max-h-60 overflow-y-auto pr-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--card-bg)] flex items-center justify-center font-bold text-xs text-indigo-500 border border-[var(--border-color)]">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-semibold block">{m.name}</span>
                        <span className="text-[10px] text-[var(--text-muted)] block leading-tight">{m.email} ({m.role})</span>
                      </div>
                    </div>
                    {user?.role === 'Admin' && m.id !== project.creator_id && (
                      <button 
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-slate-500 hover:text-red-500 p-1 rounded hover:bg-red-500/10 cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Member Form */}
              {user?.role === 'Admin' && (
                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Invite New Member</h4>
                  {memberError && (
                    <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-2 rounded">{memberError}</p>
                  )}
                  <form onSubmit={handleAddMember} className="space-y-3">
                    <select
                      value={selectedAddUserId}
                      onChange={(e) => setSelectedAddUserId(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] focus:border-indigo-500 outline-none"
                      required
                    >
                      <option value="">Select a user...</option>
                      {nonMembers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={memberSubmitting || !selectedAddUserId}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add to Project
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.title);
          const isOver = dragOverColumn === col.title;

          return (
            <div 
              key={col.title} 
              onDragOver={(e) => handleDragOver(e, col.title)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.title)}
              className={`${col.bg} border ${col.border} rounded-2xl flex flex-col max-h-[75vh] transition-all duration-200 ${
                isOver ? 'drag-over-column' : ''
              }`}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
                <span className={`text-sm font-bold tracking-wide uppercase ${col.text}`}>{col.title}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--border-color)]">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Column Body */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar min-h-[250px]">
                {colTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[var(--text-muted)] italic">No tasks here. Drag tasks here to move them.</div>
                ) : (
                  colTasks.map(t => {
                    const isOverdue = t.due_date && t.status !== 'Completed' && t.due_date.split('T')[0] < todayStr;
                    const isDragged = draggedTaskId === t.id;

                    return (
                      <div 
                        key={t.id} 
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        onDragEnd={handleDragEnd}
                        className={`glass-card rounded-xl p-4.5 transition-all duration-300 relative group flex flex-col gap-3 cursor-grab active:cursor-grabbing ${
                          col.glowClass
                        } ${isDragged ? 'dragging' : ''} ${
                          isOverdue ? 'critical-pulse' : 'hover:border-slate-500/40'
                        }`}
                      >
                        {/* Task Priority & Admin Controls Header */}
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                            t.priority === 'High' 
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                              : t.priority === 'Medium'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {t.priority}
                          </span>

                          {user?.role === 'Admin' && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button 
                                onClick={() => handleEditTaskClick(t)}
                                className="text-[var(--text-muted)] hover:text-indigo-500 p-0.5 rounded transition-colors cursor-pointer"
                                title="Edit Task"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTask(t.id)}
                                className="text-[var(--text-muted)] hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Title & Desc */}
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold leading-snug break-words">{t.title}</h4>
                          {t.description && (
                            <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{t.description}</p>
                          )}
                        </div>

                        {/* Due Date Display */}
                        {t.due_date && (
                          <div className={`flex items-center gap-1.5 text-[10px] font-medium leading-none ${
                            isOverdue ? 'text-red-500 font-semibold' : 'text-[var(--text-muted)]'
                          }`}>
                            {isOverdue ? <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> : <Calendar className="w-3 h-3 text-[var(--text-muted)] shrink-0" />}
                            <span>Due {t.due_date} {isOverdue && '(Overdue)'}</span>
                          </div>
                        )}

                        {/* Status Select & Assignee Footer */}
                        <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-3 mt-auto">
                          {/* Assignee Badge */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            {t.assignee_name ? (
                              <>
                                <div className="w-6 h-6 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center font-bold text-[9px] text-indigo-500 shrink-0" title={t.assignee_name}>
                                  {t.assignee_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[70px]">{t.assignee_name.split(' ')[0]}</span>
                              </>
                            ) : (
                              <>
                                <div className="w-6 h-6 rounded-full bg-[var(--bg-primary)] border border-dashed border-[var(--border-color)] flex items-center justify-center text-slate-500 shrink-0">
                                  <User className="w-3 h-3" />
                                </div>
                                <span className="text-[10px] text-[var(--text-muted)] italic">Unassigned</span>
                              </>
                            )}
                          </div>

                          {/* Quick Status Select Dropdown (fallback option if drag & drop is not preferred) */}
                          <select
                            value={t.status}
                            onChange={(e) => handleStatusChange(t.id, e.target.value as any)}
                            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-1.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] focus:text-[var(--text-main)] outline-none transition-colors cursor-pointer max-w-[95px]"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Review">Review</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal for Create/Edit */}
      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={refreshTasksAndMembers}
        projectId={id || ''}
        projectMembers={members}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};
