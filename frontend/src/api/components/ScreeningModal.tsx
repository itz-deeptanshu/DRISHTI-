import React, { useState } from 'react';
import { PatientScreening } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { RetinaViewer } from './RetinaViewer';
import { ConfidenceBreakdown } from './ConfidenceBreakdown';
import { ReferralReportModal } from './ReferralReportModal';
import { DR_GRADES } from '../data/mockData';
import { generateClinicalPDFReport } from '../utils/pdfGenerator';
import { toStaticUrl } from '../api/client';
import {
  X,
  Calendar,
  User,
  Eye,
  Activity,
  Hospital,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Download,
  FileDown,
  Loader2,
  FileText,
} from 'lucide-react';
import { useScreening } from '../context/ScreeningContext';

interface ScreeningModalProps {
  screening: PatientScreening | null;
  onClose: () => void;
}

export const ScreeningModal: React.FC<ScreeningModalProps> = ({ screening, onClose }) => {
  const { language, clinicianName, facilityName } = useScreening();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showReferralSlipModal, setShowReferralSlipModal] = useState(false);

  if (!screening) return null;

  const gradeInfo = DR_GRADES[screening.result.severityGrade] || DR_GRADES[0];
  const dateFormatted = new Date(screening.screenedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownloadDiagnosticPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateClinicalPDFReport({
        patientId: screening.patientId,
        patientName: screening.patientName || 'Patient',
        age: screening.age,
        gender: screening.gender || 'Female',
        eye: screening.eye,
        screenedAt: screening.screenedAt,
        imageUrl: screening.imageUrl,
        result: screening.result,
        referralStatus: screening.referralStatus,
        referralHospital: screening.referralHospital,
        referralPriority: screening.referralPriority,
        notes: screening.notes,
        clinicianName,
        facilityName,
        language,
      });
    } catch (err) {
      console.error('Diagnostic PDF export error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="screening-summary-modal"
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
              DR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{screening.patientName || screening.patientId}</h2>
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                  {screening.patientId}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {dateFormatted}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {screening.eye} Eye ({screening.eye === 'Left' ? 'OS' : 'OD'})
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {screening.age} yrs • {screening.gender || 'Patient'}
                </span>
              </p>
            </div>
          </div>

          <button
            id="close-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Retina & Heatmap Viewer */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <RetinaViewer
              grade={screening.result.severityGrade}
              findings={screening.result.findings}
              isLowConfidence={screening.result.isLowConfidence}
              customImageSrc={
                screening.imageUrl && !screening.imageUrl.startsWith('preset:')
                  ? toStaticUrl(screening.imageUrl)
                  : null
              }
            />
          </div>

          {/* Right Clinical Details & Recommendation */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Severity Status Card */}
            <div className={`p-4 rounded-xl border ${gradeInfo.badgeBg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-slate-500">Grad-CAM Classification</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                  Confidence: {screening.result.confidence}%
                </span>
              </div>
              <SeverityBadge grade={screening.result.severityGrade} size="lg" />
              <p className="text-xs text-slate-700 mt-2.5 leading-relaxed">
                {language === 'hi' ? gradeInfo.description.hi : gradeInfo.description.en}
              </p>
            </div>

            {/* Comprehensive Confidence Scores & Multi-Class Distribution */}
            <ConfidenceBreakdown
              grade={screening.result.severityGrade}
              confidence={screening.result.confidence}
              classProbabilities={screening.result.classProbabilities}
              macularEdemaRisk={screening.result.macularEdemaRisk}
              macularEdemaConfidence={screening.result.macularEdemaConfidence}
              imageQualityScore={screening.result.imageQualityScore}
              compact={false}
            />

            {/* Plain language XAI explanation */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-1.5 text-sm">
                <Activity className="w-4 h-4 text-teal-600" />
                Explainable AI (XAI) Finding Rationale
              </h4>
              <p className="text-slate-600 leading-relaxed">
                {language === 'hi' ? screening.result.explanation.hi : screening.result.explanation.en}
              </p>
            </div>

            {/* Findings List */}
            {screening.result.findings.length > 0 && (
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs">
                <h4 className="font-bold text-slate-900 mb-2">Detected Pathology Features</h4>
                <ul className="space-y-1.5">
                  {screening.result.findings.map((f) => (
                    <li key={f.id} className="flex items-start gap-2 text-slate-700">
                      <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${f.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      <div>
                        <span className="font-semibold text-slate-800">
                          {language === 'hi' ? f.label.hi : f.label.en}
                        </span>
                        <span className="text-slate-500 block text-[11px]">{f.location}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Referral / Action Status */}
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-bold text-teal-950 flex items-center gap-1.5">
                  <Hospital className="w-4 h-4 text-teal-700" />
                  Referral Protocol & Urgency
                </h4>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  screening.referralStatus === 'referral_created'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {screening.referralStatus === 'referral_created' ? 'Referral Queued' : 'Routine Follow-up'}
                </span>
              </div>
              <p className="text-teal-900 font-medium mb-2">
                {language === 'hi' ? screening.result.recommendedAction.hi : screening.result.recommendedAction.en}
              </p>
              {screening.referralHospital && (
                <div className="text-[11px] text-teal-800 bg-white/80 p-2 rounded-lg border border-teal-200">
                  <span className="font-semibold">Destination Center: </span>
                  {screening.referralHospital}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="modal-download-pdf-btn"
              type="button"
              onClick={handleDownloadDiagnosticPDF}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
              ) : (
                <FileDown className="w-4 h-4 text-teal-700" />
              )}
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Clinical PDF'}</span>
            </button>

            {screening.referralStatus === 'referral_created' && (
              <button
                id="modal-view-referral-slip-btn"
                type="button"
                onClick={() => setShowReferralSlipModal(true)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Hospital className="w-4 h-4 text-teal-600" />
                <span>View Referral Slip / PDF</span>
              </button>
            )}
          </div>

          <button
            id="close-modal-footer-btn"
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>

      {showReferralSlipModal && (
        <ReferralReportModal
          screening={screening}
          onClose={() => setShowReferralSlipModal(false)}
        />
      )}
    </div>
  );
};
