import React from 'react';
import { User } from '../types/index.js';
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Sparkles,
  BarChart3,
  Shield,
  Settings,
  Globe,
  Lock,
  LogOut,
  User as UserIcon,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export type NavigationTab =
  | 'landing'
  | 'overview'
  | 'report'
  | 'reports'
  | 'insights'
  | 'analytics'
  | 'admin'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  currentUser: User | null;
  onRoleSwitch: (role: 'citizen' | 'admin') => void;
  onSignOut: () => void;
  onOpenAuthModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onRoleSwitch,
  onSignOut,
  onOpenAuthModal,
  isOpenMobile,
  onCloseMobile,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    {
      id: 'landing' as NavigationTab,
      label: 'Public Portal',
      icon: Globe,
      description: 'Platform Overview & Workflow',
    },
    {
      id: 'overview' as NavigationTab,
      label: 'Overview',
      icon: LayoutDashboard,
      description: isAdmin ? 'Citywide Triage Summary' : 'Activity & Issue Tracking',
    },
    {
      id: 'report' as NavigationTab,
      label: 'Report an Issue',
      icon: PlusCircle,
      description: 'Submit with AI Pre-Check',
      badge: 'New',
    },
    {
      id: 'reports' as NavigationTab,
      label: 'All Reports',
      icon: FolderOpen,
      description: isAdmin ? 'Full City Issue Directory' : 'Municipal Reports Directory',
    },
    {
      id: 'insights' as NavigationTab,
      label: 'AI Insights',
      icon: Sparkles,
      description: 'Hotspots & Duplicate Clusters',
    },
    {
      id: 'analytics' as NavigationTab,
      label: 'Analytics',
      icon: BarChart3,
      description: 'SLA Times & Workload Stats',
    },
    {
      id: 'admin' as NavigationTab,
      label: 'Administration',
      icon: Shield,
      description: 'Department Dispatch & Triage',
      restrictedToAdmin: true,
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Settings',
      icon: Settings,
      description: 'System Health & Secrets',
    },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    if (tab === 'admin' && !isAdmin) {
      if (!currentUser) {
        onOpenAuthModal();
      }
      return;
    }
    if (tab === 'report' && !currentUser) {
      onOpenAuthModal();
      return;
    }
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            CL
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">CivicLens AI</div>
            <div className="text-[10px] text-slate-500">
              {isAdmin
                ? 'Municipal Staff Console'
                : currentUser
                ? 'Citizen Portal'
                : 'Public Municipal Portal'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isLocked = item.restrictedToAdmin && !isAdmin;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 text-left">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-white'
                      : isLocked
                      ? 'text-slate-400'
                      : 'text-slate-500 group-hover:text-blue-900'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[10px] font-normal leading-tight ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </div>

              {isLocked ? (
                <span title="Administrator access only">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                </span>
              ) : (
                <ChevronRight
                  className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isActive ? 'opacity-100 text-blue-200' : 'text-slate-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile card & persona switch */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
        {currentUser ? (
          <>
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  isAdmin ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAdmin ? 'bg-blue-600' : 'bg-emerald-500'
                    }`}
                  ></span>
                  <span className="capitalize">{currentUser.role}</span>
                  {currentUser.department && <span>• {currentUser.department}</span>}
                </div>
              </div>
            </div>

            {/* Quick Demo Switcher & Sign Out */}
            <div className="flex items-center gap-1 pt-1">
              <button
                onClick={() => onRoleSwitch(isAdmin ? 'citizen' : 'admin')}
                className="flex-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 py-1.5 px-2 rounded border border-blue-200 text-center transition-colors"
              >
                {isAdmin ? 'Switch to Citizen' : 'Switch to Admin'}
              </button>
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-left">
              <div className="text-xs font-bold text-slate-800">Public Visitor</div>
              <div className="text-[10px] text-slate-500">Sign in to report civic issues</div>
            </div>
            <button
              onClick={onOpenAuthModal}
              className="w-full py-2 px-3 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs text-center shadow-xs transition-colors"
            >
              Sign In / Register
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-64 h-[calc(100vh-57px)] shrink-0 sticky top-[57px]">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
          onClick={onCloseMobile}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
