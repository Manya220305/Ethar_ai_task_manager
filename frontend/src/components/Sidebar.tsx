import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  ChevronRight, 
  ChevronLeft,
  Hash,
  Sun,
  Moon
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface SidebarProps {
  onCreateProjectClick?: () => void;
  refreshTrigger?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onCreateProjectClick, 
  refreshTrigger,
  isCollapsed,
  onToggleCollapse,
  theme,
  onToggleTheme
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await apiFetch<Project[]>('/api/projects');
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects for sidebar:', err);
      }
    }
    if (user) {
      fetchProjects();
    }
  }, [user, refreshTrigger]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Brand Header */}
      <div className={`p-5 border-b border-slate-800 flex items-center justify-between`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-500/20">
            E
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-200">
              <h1 className="font-bold text-lg text-white leading-none">Ethar.ai</h1>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Task Manager</span>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <button 
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-7 overflow-y-auto overflow-x-hidden">
        <div>
          {!isCollapsed ? (
            <span className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3 animate-in fade-in duration-200">Core</span>
          ) : (
            <div className="h-px bg-slate-800 my-4"></div>
          )}
          <div className="space-y-1">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-slate-800 text-white border-l-2 border-indigo-500 pl-2.5 shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                } ${isCollapsed ? 'justify-center pl-3' : ''}`
              }
              title={isCollapsed ? "Dashboard" : undefined}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="animate-in fade-in duration-200">Dashboard</span>}
            </NavLink>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-3 mb-3 animate-in fade-in duration-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</span>
              {user?.role === 'Admin' && onCreateProjectClick && (
                <button 
                  onClick={onCreateProjectClick}
                  className="text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                  title="Create Project"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-px bg-slate-800 w-full my-2"></div>
              {user?.role === 'Admin' && onCreateProjectClick && (
                <button 
                  onClick={onCreateProjectClick}
                  className="w-8 h-8 rounded-lg bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-850/30 text-indigo-400 flex items-center justify-center transition-colors cursor-pointer mb-2"
                  title="Create Project"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          
          <div className="space-y-1 pr-1">
            {projects.length === 0 ? (
              !isCollapsed ? (
                <p className="text-xs text-slate-500 px-3 py-2 italic animate-in fade-in duration-200">No projects.</p>
              ) : null
            ) : (
              projects.map(project => (
                <NavLink 
                  key={project.id}
                  to={`/project/${project.id}`}
                  className={({ isActive }) => 
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                      isActive 
                        ? 'bg-indigo-950/40 text-indigo-300 border-l-2 border-indigo-500 pl-2.5' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    } ${isCollapsed ? 'justify-center pl-3' : ''}`
                  }
                  title={project.name}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isCollapsed ? (
                      <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-indigo-400 group-hover:bg-indigo-950/40 group-hover:border-indigo-500/30 transition-all shrink-0">
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <>
                        <Hash className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-indigo-400" />
                        <span className="truncate">{project.name}</span>
                      </>
                    )}
                  </div>
                  {!isCollapsed && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                  )}
                </NavLink>
              ))
            )}
          </div>
        </div>
      </nav>

      {/* Theme Toggle & Collapse Buttons (Collapsed view) */}
      {isCollapsed && (
        <div className="p-3 flex flex-col gap-2 items-center border-t border-slate-800">
          <button 
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button 
            onClick={onToggleCollapse}
            className="w-9 h-9 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* User Footer Section */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          {/* Quick theme toggler row */}
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Appearance</span>
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-2.5 py-1 rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-semibold text-indigo-400 border border-slate-700 shrink-0">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="truncate flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{user?.name}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-400 border border-indigo-500/20">
                {user?.role}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-950/20 hover:text-red-400 border border-transparent hover:border-red-950/50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}
    </aside>
  );
};
