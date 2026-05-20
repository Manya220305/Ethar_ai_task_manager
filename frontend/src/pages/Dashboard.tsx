import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BarChart2, 
  Calendar, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';

interface DashboardStats {
  totalTasks: number;
  toDo: number;
  inProgress: number;
  review: number;
  completed: number;
  overdue: number;
  highPriority: number;
  assignedToMe: number;
  assignedToMeOverdue: number;
}

interface UpcomingTask {
  id: number;
  title: string;
  project_name: string;
  due_date: string;
  priority: 'Low' | 'Medium' | 'High';
  status: string;
  assignee_name: string | null;
}

interface ProjectSummary {
  id: number;
  name: string;
  description: string;
  creator_name: string;
  total_tasks: number;
  completed_tasks: number;
}

interface DashboardData {
  summary: DashboardStats;
  upcomingTasks: UpcomingTask[];
  projects: ProjectSummary[];
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { refreshTrigger } = useOutletContext<{ refreshTrigger: number }>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await apiFetch<DashboardData>('/api/dashboard/summary');
        setData(response);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-center">
        {error || 'No dashboard data available'}
      </div>
    );
  }

  const { summary, upcomingTasks, projects } = data;
  const completionRate = summary.totalTasks > 0 
    ? Math.round((summary.completed / summary.totalTasks) * 100) 
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Hi, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Here's what is happening with your projects and tasks today.
          </p>
        </div>
      </div>

      {/* Overdue Warning Panel */}
      {summary.overdue > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-red-500/5 critical-pulse">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-500 rounded-xl shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Attention: Overdue Tasks</h3>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                There are <span className="text-red-500 font-bold">{summary.overdue}</span> tasks that have passed their due dates. 
                {user?.role === 'Member' && summary.assignedToMeOverdue > 0 && (
                  <span> <span className="text-red-500 font-bold">{summary.assignedToMeOverdue}</span> of these are assigned to you.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid Statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tasks Card */}
        <div className="glass-card rounded-2xl p-6 glow-indigo-hover relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Total Tasks</span>
              <span className="text-3xl font-black block mt-2">{summary.totalTasks}</span>
            </div>
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-550 dark:text-indigo-400 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-[var(--text-muted)] flex gap-2">
            <span className="text-emerald-500 font-semibold">{summary.completed} Completed</span>
            <span>•</span>
            <span>{summary.toDo + summary.inProgress + summary.review} Pending</span>
          </div>
        </div>

        {/* Completion Rate Card */}
        <div className="glass-card rounded-2xl p-6 glow-emerald-hover relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Completion Rate</span>
              <span className="text-3xl font-black block mt-2">{completionRate}%</span>
            </div>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-550 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          {/* Custom SVG/CSS Progress Bar */}
          <div className="mt-5 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>

        {/* Assigned to Me Card */}
        <div className="glass-card rounded-2xl p-6 glow-indigo-hover relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Assigned to Me</span>
              <span className="text-3xl font-black block mt-2">{summary.assignedToMe}</span>
            </div>
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-550 dark:text-sky-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-[var(--text-muted)] flex gap-2">
            {summary.assignedToMeOverdue > 0 ? (
              <span className="text-red-500 font-semibold">{summary.assignedToMeOverdue} Overdue</span>
            ) : (
              <span className="text-emerald-500 font-semibold">0 Overdue tasks</span>
            )}
          </div>
        </div>

        {/* High Priority Tasks Card */}
        <div className="glass-card rounded-2xl p-6 glow-red-hover relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Critical Tasks</span>
              <span className="text-3xl font-black block mt-2">{summary.highPriority}</span>
            </div>
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-550 dark:text-red-400 rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-[var(--text-muted)]">
            <span>High priority state tasks</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Tasks & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects List Summary (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Active Projects</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {projects.length === 0 ? (
              <div className="sm:col-span-2 p-8 text-center glass-panel rounded-2xl text-[var(--text-muted)] text-sm">
                No active projects found.
              </div>
            ) : (
              projects.map(proj => {
                const projRate = proj.total_tasks > 0 
                  ? Math.round((proj.completed_tasks / proj.total_tasks) * 100)
                  : 0;

                return (
                  <Link 
                    key={proj.id}
                    to={`/project/${proj.id}`}
                    className="glass-card rounded-2xl p-6 glow-indigo-hover flex flex-col group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors truncate">{proj.name}</h3>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-all group-hover:translate-x-1 shrink-0" />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-6 flex-grow">{proj.description || 'No description provided.'}</p>
                    
                    {/* Progress tracker */}
                    <div className="space-y-2 mt-auto">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[var(--text-muted)]">Progress</span>
                        <span className="text-indigo-500 dark:text-indigo-400">{proj.completed_tasks}/{proj.total_tasks} Tasks</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div className="bg-indigo-550 dark:bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${projRate}%` }}></div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Deadlines (Span 1) */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold">Upcoming Deadlines</h2>
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--text-muted)] italic">No upcoming tasks due.</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 space-y-4">
                {upcomingTasks.map((t, idx) => (
                  <div key={t.id} className={`flex items-start gap-3 ${idx > 0 ? 'pt-4 border-t border-[var(--border-color)]' : ''}`}>
                    <Calendar className="w-4.5 h-4.5 text-[var(--text-muted)] mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold truncate">{t.title}</h4>
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{t.project_name}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-color)]">
                          Due {t.due_date}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          t.priority === 'High' 
                            ? 'bg-red-505/10 text-red-500 border border-red-500/20' 
                            : t.priority === 'Medium'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-emerald-550/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
