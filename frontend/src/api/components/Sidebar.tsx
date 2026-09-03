import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { LanguageSelector } from './LanguageSelector';
import {
  LayoutDashboard,
  Eye,
  History,
  Send,
  Settings,
  PlusCircle,
  Stethoscope,
  User,
  LogOut,
  ArrowLeftRight,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    language,
    setLanguage,
    t,
    isOnline,
    toggleOnlineStatus,
    clinicianName,
    facilityName,
    currentUser,
    userRole,
    resetSession,
  } = useScreening();

  // Full-screen focused flows where sidebar must be hidden
  const hideSidebarRoutes = ['/capture', '/quality-check', '/analyzing', '/login', '/patient-portal'];
  const shouldHide = hideSidebarRoutes.includes(location.pathname);

  if (shouldHide) {
    return null;
  }

  const navItems = [
    {
      to: '/',
      label: t('dashboard'),
      icon: LayoutDashboard,
      id: 'nav-dashboard',
    },
    {
      to: '/patient-details',
      label: t('screening'),
      icon: Eye,
      id: 'nav-screening',
    },
    {
      to: '/history',
      label: t('history'),
      icon: History,
      id: 'nav-history',
    },
    {
      to: '/referrals',
      label: t('referrals'),
      icon: Send,
      id: 'nav-referrals',
    },
    {
      to: '/patient-portal',
      label: 'Patient Portal',
      icon: User,
      id: 'nav-patient-portal',
    },
    {
      to: '/settings',
      label: t('settings'),
      icon: Settings,
      id: 'nav-settings',
    },
  ];

  const handleStartNew = () => {
    resetSession();
    navigate('/patient-details');
  };

  return (
    <aside
      id="app-sidebar"
      className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 z-30 select-none"
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-xs">
              DR
            </div>
            <div>
              <span className="font-bold text-teal-900 tracking-tight text-base block">DR Screening</span>
              <p className="text-[10px] text-slate-400 font-medium">Clinical AI Assistant</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100">
            v2.4
          </span>
        </div>
      </div>

      {/* Prominent Quick Action Button */}
      <div className="p-4 pb-2">
        <button
          id="sidebar-new-screening-btn"
          type="button"
          onClick={handleStartNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('startNewScreening')}</span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              id={item.id}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status & Toggles Section */}
      <div className="p-4 border-t border-slate-100 bg-white space-y-3">
        {/* Clinician Profile Footer */}
        <div className="pb-2 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-slate-600 min-w-0">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-xs truncate">{clinicianName}</p>
                <p className="text-[10px] text-slate-400 truncate">{facilityName}</p>
              </div>
            </div>
            <button
              id="sidebar-change-account-btn"
              type="button"
              onClick={() => navigate('/login')}
              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors cursor-pointer"
              title="Switch Doctor / Patient Login"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
              Doctor Account
            </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-slate-500 hover:text-teal-700 font-medium cursor-pointer"
            >
              Switch Login &rarr;
            </button>
          </div>
        </div>

        {/* Online Status & Regional Language Selector */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <button
              id="network-status-toggle-btn"
              type="button"
              onClick={toggleOnlineStatus}
              className="flex items-center gap-2 group cursor-pointer"
              title="Click to toggle network status"
            >
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider group-hover:text-slate-800">
                {isOnline ? 'Online Sync' : 'Local AI Mode'}
              </span>
            </button>
          </div>

          {/* Regional Language Selector */}
          <LanguageSelector variant="dropdown" />
        </div>
      </div>
    </aside>
  );
};

