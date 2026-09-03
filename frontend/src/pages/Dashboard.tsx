import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { SeverityBadge } from '../components/SeverityBadge';
import { AIInfoCard } from '../components/AIInfoCard';
import { ScreeningModal } from '../components/ScreeningModal';
import { SAMPLE_PRESETS, DR_GRADES } from '../data/mockData';
import { PatientScreening } from '../types';
import { getDashboardSummary, BackendDashboardSummary } from '../api/client';
import {
  PlusCircle,
  Users,
  Send,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  User,
  ArrowLeftRight,
  Database,
  Building2,
  BarChart3,
  Globe2,
  Activity,
} from 'lucide-react';

const FALLBACK_CENTRAL_SUMMARY: BackendDashboardSummary = {
  total_screenings: 148,
  normal_screenings: 64,
  mild_screenings: 36,
  moderate_screenings: 24,
  severe_screenings: 16,
  proliferative_screenings: 8,
  referrals_needed: 48,
  referrals_created: 42,
  high_urgency: 24,
  pending_sync: 2,
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    t,
    language,
    clinicianName,
    facilityName,
    history,
    resetSession,
    loadPreset,
    isOnline,
    syncQueueWithBackend,
  } = useScreening();

  const [selectedScreening, setSelectedScreening] = useState<PatientScreening | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Step 6: Tele-Ophthalmology Central Summary state
  const [summaryScope, setSummaryScope] = useState<'local' | 'central'>('local');
  const [centralSummary, setCentralSummary] = useState<BackendDashboardSummary | null>(null);
  const [isLoadingCentral, setIsLoadingCentral] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isCentralLive, setIsCentralLive] = useState<boolean>(false);

  // Fetch Central Summary from backend
  const fetchCentralSummary = async () => {
    setIsLoadingCentral(true);
    try {
      const summary = await getDashboardSummary();
      setCentralSummary(summary);
      setIsCentralLive(true);
      setLastRefreshed(new Date());
    } catch (err) {
      console.warn('Backend /dashboard/summary request deferred or failed, using snapshot baseline:', err);
      // Fallback baseline when cloud server is unavailable or offline
      setCentralSummary((prev) => prev || FALLBACK_CENTRAL_SUMMARY);
      setIsCentralLive(false);
      setLastRefreshed(new Date());
    } finally {
      setIsLoadingCentral(false);
    }
  };

  useEffect(() => {
    fetchCentralSummary();
  }, []);

  // Local calculations
  const localStats = useMemo(() => {
    const total = history.length;
    const normal = history.filter((h) => h.result.severityGrade === 0).length;
    const mild = history.filter((h) => h.result.severityGrade === 1).length;
    const moderate = history.filter((h) => h.result.severityGrade === 2).length;
    const severe = history.filter((h) => h.result.severityGrade === 3).length;
    const proliferative = history.filter((h) => h.result.severityGrade === 4).length;
    const referrals = history.filter((h) => h.referralStatus === 'referral_created').length;
    const urgent = history.filter(
      (h) => h.result.severityGrade >= 3 || h.referralPriority === 'Emergency'
    ).length;
    const pendingReview = history.filter((h) => h.result.isLowConfidence || h.result.severityGrade >= 3).length;
    const unsynced = history.filter((h) => h.syncStatus === 'pending' || !h.screeningId).length;

    return {
      total,
      normal,
      mild,
      moderate,
      severe,
      proliferative,
      referrals,
      urgent,
      pendingReview,
      unsynced,
    };
  }, [history]);

  // Active statistics based on current scope view
  const activeStats = useMemo(() => {
    if (summaryScope === 'central' && centralSummary) {
      const total = centralSummary.total_screenings || 1;
      const normal = centralSummary.normal_screenings ?? 0;
      const mild = centralSummary.mild_screenings ?? 0;
      const moderate = centralSummary.moderate_screenings ?? 0;
      const severe = centralSummary.severe_screenings ?? 0;
      const proliferative = centralSummary.proliferative_screenings ?? 0;
      const referrals = centralSummary.referrals_created ?? centralSummary.referrals_needed ?? 0;
      const urgent =
        centralSummary.high_urgency ??
        (severe + proliferative);
      const pendingReview = centralSummary.pending_sync ?? 0;

      return {
        total: centralSummary.total_screenings || 0,
        normal,
        mild,
        moderate,
        severe,
        proliferative,
        referrals,
        urgent,
        pendingReview,
        isCentral: true,
      };
    }

    return {
      ...localStats,
      isCentral: false,
    };
  }, [summaryScope, centralSummary, localStats]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await syncQueueWithBackend();
      setSyncStatusMsg(res.message);
      // Immediately refresh central summary after syncing
      await fetchCentralSummary();
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (e: any) {
      setSyncStatusMsg(e.message || 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStartNew = () => {
    resetSession();
    navigate('/patient-details');
  };

  const handleQuickDemoLaunch = (presetId: string) => {
    loadPreset(presetId);
    navigate('/result');
  };

  // Safe percentage calculator
  const getPercent = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div id="dashboard-page" className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Professional Header */}
      <div className="bg-white border border-slate-200 px-6 sm:px-8 py-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            {t('greeting')}, {clinicianName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 font-normal">
            {facilityName} • ICDR Fundus Explainability Node
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="dashboard-patient-portal-btn"
            type="button"
            onClick={() => navigate('/patient-portal')}
            className="px-3.5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            title="View Patient & Caregiver Health Portal"
          >
            <User className="w-4 h-4 text-teal-600" />
            <span>Patient Portal</span>
          </button>

          <button
            id="dashboard-switch-login-btn"
            type="button"
            onClick={() => navigate('/login')}
            className="px-3.5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Switch Doctor or Patient Login"
          >
            <ArrowLeftRight className="w-4 h-4 text-slate-500" />
            <span>Switch Login</span>
          </button>

          <button
            id="dashboard-start-btn"
            type="button"
            onClick={handleStartNew}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('startNewScreening')}</span>
          </button>
        </div>
      </div>

      {/* Registry Scope & Tele-Ophthalmology Switcher Toolbar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Scope Selector Segmented Control */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            id="scope-local-btn"
            type="button"
            onClick={() => setSummaryScope('local')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              summaryScope === 'local'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Local Field Camp</span>
            <span className="ml-0.5 px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-full text-[10px]">
              {localStats.total}
            </span>
          </button>

          <button
            id="scope-central-btn"
            type="button"
            onClick={() => setSummaryScope('central')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              summaryScope === 'central'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Central Tele-Ophthalmology Cloud</span>
            {centralSummary && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-[10px]">
                {centralSummary.total_screenings}
              </span>
            )}
          </button>
        </div>

        {/* Live Refresh & Telemetry Status */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span
              className={`w-2 h-2 rounded-full ${
                isCentralLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="font-mono text-[11px]">
              {isCentralLive ? 'Cloud Gateway: Connected' : 'Edge Mode: Local Snapshot'}
            </span>
          </div>

          {lastRefreshed && (
            <span className="text-slate-400 text-[11px] font-mono hidden md:inline">
              Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <button
            id="refresh-dashboard-summary-btn"
            type="button"
            onClick={fetchCentralSummary}
            disabled={isLoadingCentral}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Fetch live summary from GET /dashboard/summary"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoadingCentral ? 'animate-spin' : ''}`} />
            <span>{isLoadingCentral ? 'Querying...' : 'Refresh Registry'}</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Stat Cards with Dynamic Scope */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Screened */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {summaryScope === 'central' ? 'Central Screenings' : t('totalScreened')}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
              {summaryScope}
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{activeStats.total}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <span>
              {summaryScope === 'central' ? 'Aggregated across 12 PHCs' : '+14% from last camp'}
            </span>
          </div>
        </div>

        {/* Card 2: Referrals Created */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('referralsCreated')}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              {getPercent(activeStats.referrals, activeStats.total)}% rate
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{activeStats.referrals}</div>
          <div className="text-xs text-teal-600 font-semibold mt-2 flex items-center gap-1">
            <span>Hospital Tele-Triage Active</span>
          </div>
        </div>

        {/* Card 3: High Urgency Cases */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              High Urgency Triage
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              {getPercent(activeStats.urgent, activeStats.total)}%
            </span>
          </div>
          <div className="text-3xl font-bold text-rose-700 mt-2">{activeStats.urgent}</div>
          <div className="text-xs text-rose-600 font-semibold mt-2 flex items-center gap-1">
            <span>Severe or Proliferative DR</span>
          </div>
        </div>

        {/* Card 4: Normal / Negative Scans */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Normal (Grade 0)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              {getPercent(activeStats.normal, activeStats.total)}%
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{activeStats.normal}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <span>Routine Annual Re-screening</span>
          </div>
        </div>
      </div>

      {/* ICDR Severity Distribution Visualizer */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <span>ICDR Severity Distribution Spectrum</span>
              <span className="text-xs font-medium text-slate-400 font-mono">
                ({summaryScope === 'central' ? 'Central Tele-Ophthalmology Registry' : 'Active Local Field Camp'})
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-class categorization of screened retinas across the international clinical diabetic retinopathy scale.
            </p>
          </div>

          <span className="text-xs font-mono font-semibold text-slate-600">
            Total Analyzed: {activeStats.total} scans
          </span>
        </div>

        {/* Segmented Distribution Bar */}
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200">
          {activeStats.total > 0 ? (
            <>
              <div
                style={{ width: `${getPercent(activeStats.normal, activeStats.total)}%` }}
                className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                title={`Grade 0 (Normal): ${activeStats.normal} (${getPercent(activeStats.normal, activeStats.total)}%)`}
              />
              <div
                style={{ width: `${getPercent(activeStats.mild, activeStats.total)}%` }}
                className="bg-teal-500 h-full transition-all duration-500"
                title={`Grade 1 (Mild): ${activeStats.mild} (${getPercent(activeStats.mild, activeStats.total)}%)`}
              />
              <div
                style={{ width: `${getPercent(activeStats.moderate, activeStats.total)}%` }}
                className="bg-amber-500 h-full transition-all duration-500"
                title={`Grade 2 (Moderate): ${activeStats.moderate} (${getPercent(activeStats.moderate, activeStats.total)}%)`}
              />
              <div
                style={{ width: `${getPercent(activeStats.severe, activeStats.total)}%` }}
                className="bg-orange-500 h-full transition-all duration-500"
                title={`Grade 3 (Severe): ${activeStats.severe} (${getPercent(activeStats.severe, activeStats.total)}%)`}
              />
              <div
                style={{ width: `${getPercent(activeStats.proliferative, activeStats.total)}%` }}
                className="bg-rose-600 h-full rounded-r-full transition-all duration-500"
                title={`Grade 4 (Proliferative): ${activeStats.proliferative} (${getPercent(activeStats.proliferative, activeStats.total)}%)`}
              />
            </>
          ) : (
            <div className="w-full h-full bg-slate-200 rounded-full" />
          )}
        </div>

        {/* Distribution Grade Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {/* Grade 0 */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900">Grade 0: Normal</span>
              <span className="text-xs font-mono font-bold text-emerald-800">
                {getPercent(activeStats.normal, activeStats.total)}%
              </span>
            </div>
            <div className="text-lg font-bold text-emerald-950 font-mono">{activeStats.normal}</div>
            <p className="text-[10px] text-emerald-700">No apparent microaneurysms</p>
          </div>

          {/* Grade 1 */}
          <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-900">Grade 1: Mild NPDR</span>
              <span className="text-xs font-mono font-bold text-teal-800">
                {getPercent(activeStats.mild, activeStats.total)}%
              </span>
            </div>
            <div className="text-lg font-bold text-teal-950 font-mono">{activeStats.mild}</div>
            <p className="text-[10px] text-teal-700">Microaneurysms only</p>
          </div>

          {/* Grade 2 */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900">Grade 2: Mod NPDR</span>
              <span className="text-xs font-mono font-bold text-amber-800">
                {getPercent(activeStats.moderate, activeStats.total)}%
              </span>
            </div>
            <div className="text-lg font-bold text-amber-950 font-mono">{activeStats.moderate}</div>
            <p className="text-[10px] text-amber-700">Hemorrhages / Exudates</p>
          </div>

          {/* Grade 3 */}
          <div className="p-3 bg-orange-50/60 border border-orange-200/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-orange-900">Grade 3: Severe NPDR</span>
              <span className="text-xs font-mono font-bold text-orange-800">
                {getPercent(activeStats.severe, activeStats.total)}%
              </span>
            </div>
            <div className="text-lg font-bold text-orange-950 font-mono">{activeStats.severe}</div>
            <p className="text-[10px] text-orange-700">4-2-1 rule diagnostic signs</p>
          </div>

          {/* Grade 4 */}
          <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-900">Grade 4: Proliferative</span>
              <span className="text-xs font-mono font-bold text-rose-800">
                {getPercent(activeStats.proliferative, activeStats.total)}%
              </span>
            </div>
            <div className="text-lg font-bold text-rose-950 font-mono">{activeStats.proliferative}</div>
            <p className="text-[10px] text-rose-700 font-semibold">Neovascularization / VH</p>
          </div>
        </div>
      </div>

      {/* Quick Demo Cases Section */}
      <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Hackathon Demo Quick Case Evaluator</span>
          </div>
          <span className="text-xs text-slate-500">Select any patient sample to test instant Grad-CAM inference</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              id={`quick-load-${preset.id}`}
              type="button"
              onClick={() => handleQuickDemoLaunch(preset.id)}
              className="flex items-center justify-between p-3 bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-200 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-slate-900 truncate">{preset.patientName}</p>
                <p className="text-[11px] text-slate-500">{DR_GRADES[preset.grade].shortName} • {preset.confidence}% conf</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Recent Screenings + Sidebar Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Screenings Section (Left 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{t('recentScreenings')}</h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                {history.length}
              </span>
            </div>

            <button
              id="view-all-history-btn"
              type="button"
              onClick={() => navigate('/history')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Screening List or Empty State */}
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{t('noScreeningsYet')}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No patient screenings recorded in this session. Start a new screening using fundus capture or demo presets.
              </p>
              <button
                type="button"
                onClick={handleStartNew}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t('startNewScreening')}</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient</th>
                      <th className="py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Eye</th>
                      <th className="py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Diagnosis</th>
                      <th className="py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {history.slice(0, 5).map((item) => {
                      const dateStr = new Date(item.screenedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <tr
                          key={item.id}
                          id={`recent-item-${item.id}`}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm">{item.patientName || item.patientId}</div>
                            <div className="text-xs text-slate-400 font-mono">{item.patientId} • {item.age}y</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                              {item.eye === 'Left' ? 'OS (Left)' : 'OD (Right)'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <SeverityBadge grade={item.result.severityGrade} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {dateStr}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              id={`view-recent-${item.id}`}
                              type="button"
                              onClick={() => setSelectedScreening(item)}
                              className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>{t('viewDetails')}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Info Section (AI Specs & Offline Card) */}
        <div className="lg:col-span-4 space-y-6">
          <AIInfoCard />

          {/* Offline Sync Card from Professional Polish theme */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">Offline Edge Cache</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {isOnline ? 'Online Sync Active' : 'Offline Mode'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700" title="Total Screenings">
                  {history.length}
                </div>
                <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${localStats.unsynced > 0 ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`} title="Pending Queue">
                  {localStats.unsynced > 0 ? `+${localStats.unsynced}` : '✓'}
                </div>
              </div>

              <button
                id="dashboard-sync-btn"
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Edge Batch'}</span>
              </button>
            </div>

            {syncStatusMsg && (
              <p className="text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-100 p-2 rounded-lg">
                {syncStatusMsg}
              </p>
            )}

            <p className="text-xs text-slate-500 leading-relaxed">
              {localStats.unsynced > 0
                ? `${localStats.unsynced} screening(s) queued for edge upload to central hospital registry.`
                : 'All scans, Grad-CAM heat maps, and referral dispatches are synchronized.'}
            </p>
          </div>

          {/* Clinical Triage Protocol Reference Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              ICDR Classification Reference
            </h3>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 text-emerald-900 border border-emerald-100">
                <span className="font-semibold">Grade 0 (No DR)</span>
                <span className="text-[11px] font-medium">Annual Re-screen</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50/70 text-teal-900 border border-teal-100">
                <span className="font-semibold">Grade 1 (Mild NPDR)</span>
                <span className="text-[11px] font-medium">6-12 Mo Follow-up</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 text-amber-900 border border-amber-100">
                <span className="font-semibold">Grade 2 (Mod NPDR)</span>
                <span className="text-[11px] font-medium">2-3 Mo Referral</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-orange-50/70 text-orange-900 border border-orange-100">
                <span className="font-semibold">Grade 3 (Severe NPDR)</span>
                <span className="text-[11px] font-medium">2-4 Wk Specialist</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 text-rose-900 border border-rose-100">
                <span className="font-semibold">Grade 4 (Proliferative)</span>
                <span className="text-[11px] font-bold text-rose-700">Urgent (24-48 hrs)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screening Details Read-Only Modal */}
      {selectedScreening && (
        <ScreeningModal
          screening={selectedScreening}
          onClose={() => setSelectedScreening(null)}
        />
      )}
    </div>
  );
};


