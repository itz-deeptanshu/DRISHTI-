import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ScreeningProvider } from './context/ScreeningContext';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { OfflineBanner } from './components/OfflineBanner';

// Pages
import { Dashboard } from './pages/Dashboard';
import { PatientDetails } from './pages/PatientDetails';
import { Capture } from './pages/Capture';
import { QualityCheck } from './pages/QualityCheck';
import { Analyzing } from './pages/Analyzing';
import { Result } from './pages/Result';
import { Recommendation } from './pages/Recommendation';
import { History } from './pages/History';
import { Referrals } from './pages/Referrals';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { PatientPortal } from './pages/PatientPortal';

export default function App() {
  return (
    <ScreeningProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
          {/* Top Offline Banner (Conditionally rendered when offline) */}
          <OfflineBanner />

          {/* Main App Layout */}
          <div className="flex flex-1 min-h-0">
            {/* Sidebar (Desktop only, hidden on full-screen flows) */}
            <Sidebar />

            {/* Content Container */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
              {/* Mobile Header (Mobile only, hidden on full-screen flows) */}
              <MobileHeader />

              {/* Page Routes */}
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/patient-portal" element={<PatientPortal />} />
                  <Route path="/patient-details" element={<PatientDetails />} />
                  <Route path="/capture" element={<Capture />} />
                  <Route path="/quality-check" element={<QualityCheck />} />
                  <Route path="/analyzing" element={<Analyzing />} />
                  <Route path="/result" element={<Result />} />
                  <Route path="/recommendation" element={<Recommendation />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/referrals" element={<Referrals />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </div>
      </BrowserRouter>
    </ScreeningProvider>
  );
}
