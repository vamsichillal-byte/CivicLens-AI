import React, { useState } from 'react';
import { User } from '../types/index.js';
import { signIn, signUp, demoLogin } from '../services/api.js';
import { X, User as UserIcon, Shield, Lock, Mail, UserCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        if (!email.trim() || !password) {
          setError('Please provide both email and password.');
          setLoading(false);
          return;
        }
        const { user } = await signIn(email.trim(), password);
        onAuthSuccess(user);
        onClose();
      } else {
        if (!name.trim()) {
          setError('Full name is required.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        const { user } = await signUp(name.trim(), email.trim(), password, role);
        onAuthSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJudgeDemoLogin = async (demoRole: 'citizen' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      const { user } = await demoLogin(demoRole);
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              CL
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {mode === 'signin' ? 'Sign In to CivicLens' : 'Create CivicLens Account'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Secure citizen & municipal municipal authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs leading-relaxed">
            {error}
          </div>
        )}

        {/* Quick Demo Logins for Hackathon Evaluators */}
        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Judge Demo Accounts (Quick Sign In)
            </span>
            <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium border border-blue-200">
              Pre-Configured
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleJudgeDemoLogin('citizen')}
              className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300 text-left space-y-0.5 transition-all shadow-2xs disabled:opacity-50"
            >
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-blue-600" /> Elena Ramos
              </div>
              <div className="text-[10px] text-slate-500">Citizen Persona</div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleJudgeDemoLogin('admin')}
              className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300 text-left space-y-0.5 transition-all shadow-2xs disabled:opacity-50"
            >
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-900" /> Marcus Vance
              </div>
              <div className="text-[10px] text-slate-500">Admin Persona</div>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
            Or continue with email
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs"
                  required
                />
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">Password</label>
              {mode === 'signup' && (
                <span className="text-[10px] text-slate-400 font-normal">Min 6 characters</span>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signin' ? 'Enter your password' : 'Create a secure password'}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs"
                required
                minLength={6}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Account Type</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'citizen' | 'admin')}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
              >
                <option value="citizen">Citizen (Report & Track Issues)</option>
                <option value="admin">Administrator (City Staff & Dispatch)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : mode === 'signin' ? (
              <span>Sign In with Password</span>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          {mode === 'signin' ? (
            <span>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('signup');
                }}
                className="text-blue-600 font-bold hover:underline ml-1"
              >
                Register here
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('signin');
                }}
                className="text-blue-600 font-bold hover:underline ml-1"
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
