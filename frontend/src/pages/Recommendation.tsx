import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { SeverityBadge } from '../components/SeverityBadge';
import { ReferralReportModal } from '../components/ReferralReportModal';
import { DR_GRADES, SAMPLE_PRESETS, AI_MODEL_METADATA, getLocalizedText } from '../data/mockData';
import { generateClinicalPDFReport, generateReferralSlipPDF } from '../utils/pdfGenerator';
import { updateReferralStatus } from '../api/client';
import { calculateClassProbabilities, getRecommendedProcedures } from '../utils/confidenceUtils';
import { ReferralReportData, PatientScreening, ScreeningResult } from '../types';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  Hospital,
  AlertOctagon,
  Clock,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  Building2,
  Check,
  Download,
  Loader2,
  FileDown,
} from 'lucide-react';

export const Recommendation: React.FC = () => {
  const navigate = useNavigate();
  const {
    session,
    updateSession,
    saveCurrentScreening,
    t,
    language,
    clinicianName,
    facilityName,
    isOnline,
  } = useScreening();

  const currentResult: ScreeningResult = session.result || {
    severityGrade: 2,
    confidence: 94.2,
    isLowConfidence: false,
    explanation: SAMPLE_PRESETS[0].explanation,
    findings: SAMPLE_PRESETS[0].findings,
    macularEdemaRisk: 'Mild',
    macularEdemaConfidence: 91.8,
    imageQualityScore: 97.6,
    classProbabilities: undefined,
    recommendedAction: SAMPLE_PRESETS[0].recommendedAction,
    urgency: 'Within 2-3 Months',
    modelInfo: AI_MODEL_METADATA,
  };

  const gradeInfo = DR_GRADES[currentResult.severityGrade] || DR_GRADES[0];

  const defaultReferralState = currentResult.severityGrade >= 2 ? 'referral_created' : session.referralStatus || 'not_referred';
  const [referralStatus, setReferralStatus] = useState<'not_referred' | 'referral_created'>(defaultReferralState);
  const [selectedHospital, setSelectedHospital] = useState<string>(
    session.referralHospital || 'Regional Institute of Ophthalmology, Apex Center'
  );
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Emergency'>(
    currentResult.severityGrade === 4
      ? 'Emergency'
      : currentResult.severityGrade >= 2
      ? 'High'
      : 'Normal'
  );
  const [notes, setNotes] = useState<string>(session.notes || '');
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingReferralPdf, setIsGeneratingReferralPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);
  const [showReferralSlipModal, setShowReferralSlipModal] = useState<boolean>(false);

  const hospitalsList = [
    'Regional Institute of Ophthalmology, Apex Center',
    'AIIMS Department of Vitreoretinal Surgery',
    'District Community Eye Care Hospital, Ward 4',
    'Chitrakoot Netra Chikitsalaya, Rural Tele-Hub',
    'Sankara Nethralaya Outreach Node',
  ];

  const getReferralDataPayload = (): ReferralReportData => {
    const patientId = session.patientId || 'PAT-2026-8841';
    const referralId = `REF-${patientId.replace(/[^0-9]/g, '') || '8841'}-${session.eye === 'Left' ? 'OS' : 'OD'}`;
    const classProbs = currentResult.classProbabilities || calculateClassProbabilities(currentResult.severityGrade, currentResult.confidence);
    const procedures = getRecommendedProcedures(currentResult.severityGrade, currentResult.macularEdemaRisk);

    return {
      referralId,
      referralDate: new Date().toLocaleDateString('en-IN'),
      patientId,
      patientName: session.patientName || 'Sunita Devi',
      age: session.age || 58,
      gender: session.gender || 'Female',
      eye: session.eye || 'Right',
      screenedAt: new Date().toISOString(),
      severityGrade: currentResult.severityGrade,
      primaryConfidence: currentResult.confidence,
      classProbabilities: classProbs,
      macularEdemaRisk: currentResult.macularEdemaRisk,
      macularEdemaConfidence: currentResult.macularEdemaConfidence || 92.4,
      imageQualityScore: currentResult.imageQualityScore || 97.6,
      referralHospital: selectedHospital,
      referralPriority: priority,
      targetUrgency: currentResult.urgency,
      clinicianName: clinicianName || 'Dr. Ananya Sharma',
      facilityName: facilityName || 'AIIMS Community Vision Outreach Center',
      clinicalNotes: notes,
      findingsCount: currentResult.findings.length,
      recommendedProcedures: procedures,
    };
  };

  const handleDownloadReferralPDF = async () => {
    try {
      setIsGeneratingReferralPdf(true);
      const referralData = getReferralDataPayload();
      await generateReferralSlipPDF(referralData);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Referral PDF generation error:', err);
    } finally {
      setIsGeneratingReferralPdf(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateClinicalPDFReport(
        {
          patientId: session.patientId || 'PAT-2026-8841',
          patientName: session.patientName || 'Sunita Devi',
          age: session.age || 58,
          gender: session.gender || 'Female',
          eye: session.eye || 'Right',
          screenedAt: new Date().toISOString(),
          imageUrl: session.imageUrl,
          result: currentResult,
          referralStatus,
          referralHospital: selectedHospital,
          referralPriority: priority,
          notes,
          clinicianName,
          facilityName,
          language,
        },
        'recommendation-main-card'
      );
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleFinish = async () => {
    // Update and persist into history
    updateSession({
      referralStatus,
      referralHospital: selectedHospital,
      referralPriority: priority,
      notes,
    });

    saveCurrentScreening();

    // If screeningId exists from backend and referral was created, notify backend
    if (session.screeningId && isOnline) {
      try {
        const backendStatus = referralStatus === 'referral_created' ? 'referred' : 'cancelled';
        await updateReferralStatus(session.screeningId, backendStatus);
      } catch (e) {
        console.warn('Backend referral status update deferred:', e);
      }
    }

    // Trigger subtle success celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {
      // ignore
    }

    setIsSavedToast(true);
    setTimeout(() => {
      navigate('/');
    }, 900);
  };

  const handleAddToQueue = async () => {
    setReferralStatus('referral_created');
    updateSession({
      referralStatus: 'referral_created',
      referralHospital: selectedHospital,
      referralPriority: priority,
    });

    if (session.screeningId && isOnline) {
      try {
        await updateReferralStatus(session.screeningId, 'referred');
      } catch (e) {
        console.warn('Backend referral status update deferred:', e);
      }
    }
  };

  return (
    <div id="recommendation-page" className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          id="back-to-result-btn"
          type="button"
          onClick={() => navigate('/result')}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')} to {t('result')}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            id="download-pdf-recommendation-top-btn"
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
              pdfSuccess
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100'
            }`}
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />
            ) : pdfSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            ) : (
              <Download className="w-3.5 h-3.5 text-teal-700" />
            )}
            <span>{isGeneratingPdf ? t('generatingPdf') : pdfSuccess ? t('pdfDownloaded') : t('downloadPdf')}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-xs">
              5
            </span>
            <span>Step 5 of 5: Clinical Protocol & Referral</span>
          </div>
        </div>
      </div>

      {/* Success Notification Toast */}
      {isSavedToast && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-sm rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>Screening saved to clinical records! Redirecting to Dashboard...</span>
        </div>
      )}

      {/* Main Protocol Card */}
      <div id="recommendation-main-card" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        {/* Risk Badge & Summary Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-slate-500">Graded Risk Classification</span>
            <div className="flex items-center gap-2 mt-1">
              <SeverityBadge grade={currentResult.severityGrade} size="lg" />
              <span className="px-3 py-1 bg-white rounded-lg border border-slate-200 font-mono text-xs font-semibold text-slate-800">
                Urgency: {gradeInfo.urgency}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 block">Patient Identity</span>
            <span className="font-bold text-sm text-slate-900">{session.patientName || session.patientId}</span>
            <span className="font-mono text-xs text-slate-500 block">
              {session.patientId} • {session.eye} Eye
            </span>
          </div>
        </div>

        {/* Plain-Language Risk Summary Paragraph */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span>{t('riskClassification')}</span>
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed bg-teal-50/50 p-4 rounded-xl border border-teal-100">
            {getLocalizedText(gradeInfo.recommendedFollowUp, language)}
          </p>
        </div>

        {/* Referral Status Toggle Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('referralStatus')}
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              id="referral-status-none"
              type="button"
              onClick={() => setReferralStatus('not_referred')}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all text-left cursor-pointer ${
                referralStatus === 'not_referred'
                  ? 'border-slate-800 bg-slate-900 text-white shadow-xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                referralStatus === 'not_referred' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                01
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm">{t('notReferred')}</div>
                <div className={`text-xs ${referralStatus === 'not_referred' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Annual or 6-month primary care check
                </div>
              </div>
              {referralStatus === 'not_referred' && <Check className="w-5 h-5 text-teal-400 shrink-0" />}
            </button>

            <button
              id="referral-status-created"
              type="button"
              onClick={() => setReferralStatus('referral_created')}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all text-left cursor-pointer ${
                referralStatus === 'referral_created'
                  ? 'border-teal-500 bg-teal-50/80 text-teal-950 shadow-xs ring-2 ring-teal-500/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                referralStatus === 'referral_created' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                02
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm">{t('referralCreated')}</div>
                <div className="text-xs text-slate-500">
                  Secondary/tertiary ophthalmology center
                </div>
              </div>
              {referralStatus === 'referral_created' && <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />}
            </button>
          </div>
        </div>

        {/* If Referral is Created: Hospital & Priority Options */}
        {referralStatus === 'referral_created' && (
          <div className="p-5 rounded-xl bg-teal-50/50 border border-teal-200 space-y-4 animate-in fade-in duration-150">
            {/* Hospital Destination */}
            <div className="space-y-1.5">
              <label htmlFor="hospital-select" className="block text-xs font-bold uppercase tracking-wider text-teal-950">
                {t('selectHospital')}
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-700" />
                <select
                  id="hospital-select"
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-teal-200 bg-white font-medium text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {hospitalsList.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-teal-950">
                {t('referralPriority')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Normal', 'High', 'Emergency'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      priority === p
                        ? p === 'Emergency'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : p === 'High'
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white border-teal-200 text-teal-900 hover:bg-teal-100'
                    }`}
                  >
                    {p === 'Emergency' ? '🚨 Emergency (1-2d)' : p === 'High' ? '⚠️ High (2-4w)' : '📅 Normal (2-3m)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Clinical Notes Field */}
            <div className="space-y-1.5">
              <label htmlFor="clinical-notes-input" className="block text-xs font-bold uppercase tracking-wider text-teal-950">
                {t('notesRemarks')}
              </label>
              <textarea
                id="clinical-notes-input"
                rows={2}
                placeholder="Add clinician notes, patient contact info, or local health worker instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-lg border border-teal-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {referralStatus !== 'referral_created' ? (
              <button
                id="add-to-referral-queue-btn"
                type="button"
                onClick={handleAddToQueue}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold text-xs sm:text-sm border border-teal-200 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4 text-teal-700" />
                <span>{t('addToQueue')}</span>
              </button>
            ) : (
              <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Referral configured for {selectedHospital.split(',')[0]}</span>
              </div>
            )}

            <button
              id="download-pdf-recommendation-bottom-btn"
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 transition-colors cursor-pointer"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
              ) : (
                <FileDown className="w-4 h-4 text-teal-600" />
              )}
              <span>{isGeneratingPdf ? t('generatingPdf') : 'Clinical Report (PDF)'}</span>
            </button>

            {referralStatus === 'referral_created' && (
              <button
                id="export-referral-slip-pdf-btn"
                type="button"
                onClick={() => setShowReferralSlipModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold text-xs sm:text-sm border border-teal-300 transition-colors cursor-pointer"
              >
                <Hospital className="w-4 h-4 text-teal-700" />
                <span>Referral Slip (PDF)</span>
              </button>
            )}
          </div>

          <button
            id="finish-screening-btn"
            type="button"
            onClick={handleFinish}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{t('finishScreening')}</span>
          </button>
        </div>
      </div>

      {/* Referral Slip Modal */}
      {showReferralSlipModal && (
        <ReferralReportModal
          screening={{
            id: 'temp-session-id',
            patientId: session.patientId || 'PAT-2026-8841',
            patientName: session.patientName || 'Sunita Devi',
            age: session.age || 58,
            gender: session.gender || 'Female',
            eye: session.eye || 'Right',
            imageUrl: session.imageUrl || '',
            screenedAt: new Date().toISOString(),
            result: currentResult,
            referralStatus,
            referralHospital: selectedHospital,
            referralPriority: priority,
            notes,
          }}
          onClose={() => setShowReferralSlipModal(false)}
        />
      )}
    </div>
  );
};
