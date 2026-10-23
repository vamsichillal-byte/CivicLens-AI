import React from 'react';
import { User } from '../types/index.js';
import {
  Sparkles,
  Shield,
  User as UserIcon,
  RefreshCw,
  Menu,
  LogIn,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onRoleSwitch: (role: 'citizen' | 'admin') => void;
  onOpenMobileMenu: () => void;
  onOpenAuthModal: () => void;
  geminiConfigured: boolean;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleSwitch,
  onOpenMobileMenu,
  onOpenAuthModal,
  geminiConfigured,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        {/* Left: Mobile hamburger & App Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <span className="tracking-tighter">CL</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  CivicLens
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 tracking-wider uppercase">
                  AI Gov
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Intelligent Municipal Triage & Dispatch Platform
              </p>
            </div>
          </div>
        </div>

        {/* Right: AI Engine Status, Quick Judge Switcher, Reset Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real AI Status indicator */}
          <div
            className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              geminiConfigured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
            title={
              geminiConfigured
                ? 'Gemini 3.8 Flash API is connected on the server'
                : 'Gemini API key is running deterministic civic rules engine demo fallback'
            }
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${
                geminiConfigured ? 'text-emerald-600 animate-pulse' : 'text-amber-600'
              }`}
            />
            <span className="font-medium text-[11px]">
              {geminiConfigured ? 'Gemini 3.8 Flash' : 'Demo Rule Engine'}
            </span>
          </div>

          {/* Quick Demo Reset */}
          <button
            onClick={onResetData}
            title="Reset dataset to pristine hackathon initial demo data"
            className="hidden sm:flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Demo</span>
          </button>

          {/* User Sign In or Judge Persona Switcher */}
          {currentUser ? (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => onRoleSwitch('citizen')}
                title="Switch session to Citizen demo persona"
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  currentUser.role === 'citizen'
                    ? 'bg-white text-blue-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Citizen</span>
              </button>
              <button
                onClick={() => onRoleSwitch('admin')}
                title="Switch session to Administrator demo persona"
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  currentUser.role === 'admin'
                    ? 'bg-blue-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
