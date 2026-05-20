import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { CreateProjectModal } from './CreateProjectModal';

export const Layout: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Collapse sidebar state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  // Light/Dark Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('app_theme') as 'light' | 'dark') || 'dark';
  });

  const location = useLocation();

  useEffect(() => {
    const rootEl = document.documentElement;
    if (theme === 'light') {
      rootEl.classList.add('light');
    } else {
      rootEl.classList.remove('light');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleProjectCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Determine the navbar title based on path
  const getNavbarTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/project/')) return 'Project Board';
    return 'Task Manager';
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar 
        onCreateProjectClick={() => setIsModalOpen(true)} 
        refreshTrigger={refreshTrigger}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={getNavbarTitle()} />
        <main className="flex-1 p-8 overflow-y-auto">
          {/* We pass down the refreshTrigger and a refresh helper via context so children pages can trigger a reload or listen for project creations */}
          <Outlet context={{ refreshTrigger, triggerRefresh: handleProjectCreated }} />
        </main>
      </div>

      {/* Project Creation Modal (Admin only, triggered from sidebar) */}
      <CreateProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
};
