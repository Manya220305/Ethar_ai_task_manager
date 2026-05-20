import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Member'>('Member');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await signup(name, email, password, role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try a different email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col justify-center items-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-2xl text-white shadow-lg shadow-indigo-500/20 mb-3">
            E
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Create account</h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">Get started with Team Task Manager</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Full Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-500/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-[var(--text-main)] placeholder-slate-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-500/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-[var(--text-main)] placeholder-slate-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-slate-500/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-[var(--text-main)] placeholder-slate-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Role Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('Member')}
                  className={`py-2.5 px-4 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                    role === 'Member'
                      ? 'bg-indigo-950/40 border-indigo-500 text-indigo-500'
                      : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:border-slate-500/50'
                  }`}
                >
                  Member
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Admin')}
                  className={`py-2.5 px-4 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                    role === 'Admin'
                      ? 'bg-indigo-950/40 border-indigo-500 text-indigo-500'
                      : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:border-slate-500/50'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl py-3 mt-2 cursor-pointer shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all"
            >
              {submitting ? 'Creating account...' : 'Create Account'}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {/* Redirect */}
        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
