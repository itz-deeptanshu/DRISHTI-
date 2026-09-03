import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { LanguageSelector } from './LanguageSelector';
import {
  Menu,
  X,
  Eye,
  LayoutDashboard,
  History,
  Send,
  Settings,
  PlusCircle,
  User,
  LogIn,
} from 'lucide-react';

export const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnline, resetSession, t } = useScreening();

  const hideOnRoutes = ['/capture', '/quality-check', '/analyzing', '/login', '/patient-portal'];
  if (hideOnRoutes.includes(location.pathname)) {
    return null;
  }

  const handleStartNew = () => {
    resetSession();
    setIsOpen(false);
    navigate('/patient-details');
  };

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm">DR Screening</span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-slate-500">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector variant="compact" />

          <button
            id="mobile-menu-toggle"
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="border-t border-slate-100 p-4 space-y-3 bg-white animate-in slide-in-from-top-2 duration-150 shadow-xl">
          <button
            type="button"
            onClick={handleStartNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-lg font-semibold text-sm cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('startNewScreening')}</span>
          </button>

          <nav className="space-y-1 pt-1 text-sm font-medium">
            <NavLink
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              <LayoutDashboard className="w-4 h-4 text-teal-600" />
              <span>{t('dashboard')}</span>
            </NavLink>
            <NavLink
              to="/patient-details"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-4 h-4 text-teal-600" />
              <span>{t('screening')}</span>
            </NavLink>
            <NavLink
              to="/history"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              <History className="w-4 h-4 text-teal-600" />
              <span>{t('history')}</span>
            </NavLink>
            <NavLink
              to="/referrals"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              <Send className="w-4 h-4 text-teal-600" />
              <span>{t('referrals')}</span>
            </NavLink>
            <NavLink
              to="/patient-portal"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              <User className="w-4 h-4 text-teal-600" />
              <span>Patient Portal</span>
            </NavLink>
            <NavLink
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              <Settings className="w-4 h-4 text-teal-600" />
              <span>{t('settings')}</span>
            </NavLink>
            <NavLink
              to="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 font-semibold mt-2"
            >
              <LogIn className="w-4 h-4 text-teal-600" />
              <span>Switch Login / Roles</span>
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
};
