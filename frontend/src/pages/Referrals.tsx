import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { SeverityBadge } from '../components/SeverityBadge';
import { ScreeningModal } from '../components/ScreeningModal';
import { ReferralReportModal } from '../components/ReferralReportModal';
import { PatientScreening, ReferralReportData } from '../types';
import { getConfidenceRating, getRecommendedProcedures, calculateClassProbabilities } from '../utils/confidenceUtils';
import { generateReferralSlipPDF } from '../utils/pdfGenerator';
import {
  Send,
  Hospital,
  AlertTriangle,
  Clock,
  Eye,
  Calendar,
  User,
  PlusCircle,
  Building2,
  CheckCircle2,
  Filter,
  FileText,
  Download,
  Loader2,
  Sparkles,
  Layers,
  CalendarCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { getReferral } from '../api/client';

export const Referrals: React.FC = () => {
  const navigate = useNavigate();
  const {
    history,
    t,
    resetSession,
    clinicianName,
    facilityName,
    isOnline,
    updateReferralWorkflowStatus,
    syncQueueWithBackend,
  } = useScreening();

  const [selectedScreening, setSelectedScreening] = useState<PatientScreening | null>(null);
  const [referralSlipScreening, setReferralSlipScreening] = useState<PatientScreening | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Filter only screenings with referral_created or pending
  const referralsList = useMemo(() => {
    return history.filter((item) => {
      const isReferred = item.referralStatus === 'referral_created';
      const matchesPriority =
        priorityFilter === 'all' || item.referralPriority === priorityFilter;
      return isReferred && matchesPriority;
    });
  }, [history, priorityFilter]);

  const emergencyCount = history.filter(
    (h) => h.referralStatus === 'referral_created' && h.referralPriority === 'Emergency'
  ).length;

  const handleUpdateStatus = async (
    item: PatientScreening,
    newStatus: 'referred' | 'scheduled' | 'completed' | 'cancelled'
  ) => {
    try {
      setUpdatingId(item.id);
      await updateReferralWorkflowStatus(item.id, newStatus);
    } catch (err) {
      console.error('Failed to update referral workflow status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncToast(null);
    try {
      const res = await syncQueueWithBackend();
      setSyncToast(res.message);
      setTimeout(() => setSyncToast(null), 4000);
    } catch (err: any) {
      setSyncToast(err.message || 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuickDownloadPdf = async (item: PatientScreening, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDownloadingId(item.id);
      const referralId = `REF-${item.patientId.replace(/[^0-9]/g, '') || '8841'}-${item.eye === 'Left' ? 'OS' : 'OD'}`;
      const classProbs = item.result.classProbabilities || calculateClassProbabilities(item.result.severityGrade, item.result.confidence);
      const procedures = getRecommendedProcedures(item.result.severityGrade, item.result.macularEdemaRisk);

      const referralData: ReferralReportData = {
        referralId,
        referralDate: new Date(item.screenedAt).toLocaleDateString('en-IN'),
        patientId: item.patientId,
        patientName: item.patientName || 'Patient',
        age: item.age,
        gender: item.gender || 'Not specified',
        eye: item.eye,
        screenedAt: item.screenedAt,
        severityGrade: item.result.severityGrade,
        primaryConfidence: item.result.confidence,
        classProbabilities: classProbs,
        macularEdemaRisk: item.result.macularEdemaRisk,
        macularEdemaConfidence: item.result.macularEdemaConfidence || 92.4,
        imageQualityScore: item.result.imageQualityScore || 97.6,
        referralHospital: item.referralHospital || 'Regional Institute of Ophthalmology, Apex Center',
        referralPriority: item.referralPriority || (item.result.severityGrade >= 4 ? 'Emergency' : 'High'),
        targetUrgency: item.result.urgency,
        clinicianName: clinicianName || 'Dr. Ananya Sharma',
        facilityName: facilityName || 'AIIMS Community Vision Outreach Center',
        clinicalNotes: item.notes,
        findingsCount: item.result.findings.length,
        recommendedProcedures: procedures,
      };

      await generateReferralSlipPDF(referralData);
    } catch (err) {
      console.error('Failed quick PDF export:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div id="referrals-page" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 text-xs font-bold uppercase tracking-wider">
            <Hospital className="w-4 h-4" />
            <span>Tele-Ophthalmology Destination Triage</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            {t('referrals')} Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Active patient referral dispatch list destined for tertiary ophthalmology and laser surgical centers.
          </p>
        </div>

        {emergencyCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{emergencyCount} Emergency PDR Case(s) Queued for 24h Surgery</span>
          </div>
        )}
      </div>

      {/* Filter Bar and Sync Action */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">Filter Priority:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'Emergency', 'High', 'Normal'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  priorityFilter === p
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p === 'all' ? 'All Priorities' : p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-mono font-medium">
            {referralsList.length} referral dispatch records
          </span>
          <button
            id="sync-referrals-queue-btn"
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            title="Trigger POST /screenings/sync batch update to central server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Queue'}</span>
          </button>
        </div>
      </div>

      {syncToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{syncToast}</span>
          <button
            type="button"
            onClick={() => setSyncToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Referrals Cards Grid */}
      {referralsList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Send className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No Referrals in Queue</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All screened patients currently have routine follow-up status, or no patients have been referred yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {referralsList.map((item) => {
            const dateStr = new Date(item.screenedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                id={`referral-card-${item.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Card Header with Priority Tag & Workflow Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md border ${
                          item.referralPriority === 'Emergency'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.referralPriority === 'High'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-teal-50 text-teal-800 border-teal-200'
                        }`}
                      >
                        {item.referralPriority || 'High'} Urgency
                      </span>

                      {/* Backend Referral Lifecycle Badge */}
                      <span
                        className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md border ${
                          item.backendStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.backendStatus === 'scheduled'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : item.backendStatus === 'cancelled'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-teal-50 text-teal-800 border-teal-200'
                        }`}
                      >
                        {item.backendStatus ? item.backendStatus.toUpperCase() : 'REFERRED'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-600 font-mono">{dateStr}</span>
                  </div>

                  {/* Patient Info */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {item.patientName || item.patientId}
                    </h3>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">
                      {item.patientId} • {item.age} yrs • {item.eye} Eye ({item.eye === 'Left' ? 'OS' : 'OD'})
                    </p>
                  </div>

                  {/* Severity Badge & Confidence Score Row */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <SeverityBadge grade={item.result.severityGrade} size="sm" />
                      {(() => {
                        const confRating = getConfidenceRating(item.result.confidence);
                        return (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confRating.badgeClass}`}>
                            {item.result.confidence}% {confRating.tier}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <span>DME Risk: <strong className="text-slate-800">{item.result.macularEdemaRisk || 'None'}</strong></span>
                      <span>Quality: <strong className="text-emerald-700 font-mono">{item.result.imageQualityScore || 97.6}%</strong></span>
                    </div>
                  </div>

                  {/* Destination Hospital */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">{item.referralHospital || 'Regional Institute of Ophthalmology'}</span>
                    </div>
                    {item.notes && (
                      <p className="text-[11px] text-slate-500 italic truncate">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Transition Row */}
                <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between gap-1 text-[11px]">
                  <span className="text-slate-500 font-medium">Update Status:</span>
                  <div className="flex items-center gap-1">
                    {item.backendStatus !== 'scheduled' && (
                      <button
                        id={`status-schedule-${item.id}`}
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() => handleUpdateStatus(item, 'scheduled')}
                        className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Schedule
                      </button>
                    )}
                    {item.backendStatus !== 'completed' && (
                      <button
                        id={`status-complete-${item.id}`}
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() => handleUpdateStatus(item, 'completed')}
                        className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Complete
                      </button>
                    )}
                    {item.backendStatus !== 'cancelled' && (
                      <button
                        id={`status-cancel-${item.id}`}
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() => handleUpdateStatus(item, 'cancelled')}
                        className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 font-medium cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons: Referral Slip & XAI Report */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    id={`referral-slip-btn-${item.id}`}
                    type="button"
                    onClick={() => setReferralSlipScreening(item)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Referral Slip</span>
                  </button>

                  <button
                    id={`download-slip-pdf-btn-${item.id}`}
                    type="button"
                    onClick={(e) => handleQuickDownloadPdf(item, e)}
                    disabled={downloadingId === item.id}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
                    title="Quick Download PDF"
                  >
                    {downloadingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    id={`view-referral-btn-${item.id}`}
                    type="button"
                    onClick={() => setSelectedScreening(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>XAI</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Screening Read-Only Modal */}
      {selectedScreening && (
        <ScreeningModal
          screening={selectedScreening}
          onClose={() => setSelectedScreening(null)}
        />
      )}

      {/* Official Tertiary Referral Report Modal */}
      {referralSlipScreening && (
        <ReferralReportModal
          screening={referralSlipScreening}
          onClose={() => setReferralSlipScreening(null)}
        />
      )}
    </div>
  );
};
