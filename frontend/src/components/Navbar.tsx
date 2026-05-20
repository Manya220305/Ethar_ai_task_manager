import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck } from 'lucide-react';

interface NavbarProps {
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const { user } = useAuth();
  
  return (
    <header className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-300">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Quick Date Display */}
        <div className="text-sm text-[var(--text-muted)] hidden sm:block">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>

        {/* User Info Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)]">
          {user?.role === 'Admin' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <UserCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          )}
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            {user?.role === 'Admin' ? 'Admin Access' : 'Member Workspace'}
          </span>
        </div>
      </div>
    </header>
  );
};
