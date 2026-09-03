import React, { useState } from 'react';
import { PatientScreening, ReferralReportData } from '../types';
import { useScreening } from '../context/ScreeningContext';
import { DR_GRADES } from '../data/mockData';
import { getRecommendedProcedures, calculateClassProbabilities, getConfidenceRating } from '../utils/confidenceUtils';
import { generateReferralSlipPDF } from '../utils/pdfGenerator';
import { SeverityBadge } from './SeverityBadge';
import {
  X,
  Hospital,
  Calendar,
  User,
  Eye,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  Loader2,
  Share2,
  Check,
  Activity,
  Layers,
} from 'lucide-react';

interface ReferralReportModalProps {
  screening: PatientScreening;
  onClose: () => void;
}

export const ReferralReportModal: React.FC<ReferralReportModalProps> = ({ screening, onClose }) => {
  const { clinicianName, facilityName } = useScreening();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  const gradeInfo = DR_GRADES[screening.result.severityGrade] || DR_GRADES[0];
  const dateFormatted = new Date(screening.screenedAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const referralId = `REF-${screening.patientId.replace(/[^0-9]/g, '') || '8841'}-${screening.eye === 'Left' ? 'OS' : 'OD'}`;
  const procedures = getRecommendedProcedures(screening.result.severityGrade, screening.result.macularEdemaRisk);
  const classProbs = screening.result.classProbabilities || calculateClassProbabilities(screening.result.severityGrade, screening.result.confidence);
  const confRating = getConfidenceRating(screening.result.confidence);

  const referralData: ReferralReportData = {
    referralId,
    referralDate: dateFormatted,
    patientId: screening.patientId,
    patientName: screening.patientName || 'Patient',
    age: screening.age,
    gender: screening.gender || 'Not specified',
    eye: screening.eye,
    screenedAt: screening.screenedAt,
    severityGrade: screening.result.severityGrade,
    primaryConfidence: screening.result.confidence,
    classProbabilities: classProbs,
    macularEdemaRisk: screening.result.macularEdemaRisk,
    macularEdemaConfidence: screening.result.macularEdemaConfidence || 92.4,
    imageQualityScore: screening.result.imageQualityScore || 97.6,
    referralHospital: screening.referralHospital || 'Regional Institute of Ophthalmology, Apex Center',
    referralPriority: screening.referralPriority || (screening.result.severityGrade >= 4 ? 'Emergency' : 'High'),
    targetUrgency: screening.result.urgency,
    clinicianName: clinicianName || 'Dr. Ananya Sharma',
    facilityName: facilityName || 'AIIMS Community Vision Outreach Center',
    clinicalNotes: screening.notes,
    findingsCount: screening.result.findings.length,
    recommendedProcedures: procedures,
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateReferralSlipPDF(referralData, 'referral-slip-printable-area');
    } catch (err) {
      console.error('Failed to export referral slip PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summaryText = `TERTIARY EYE REFERRAL SLIP\nRef ID: ${referralId}\nPatient: ${screening.patientName} (${screening.patientId}), ${screening.age}y, ${screening.gender}\nEye: ${screening.eye} (${screening.eye === 'Left' ? 'OS' : 'OD'})\nDiagnosis: ICDR Grade ${screening.result.severityGrade} (${gradeInfo.shortName})\nConfidence: ${screening.result.confidence}% (${confRating.label})\nDME Risk: ${screening.result.macularEdemaRisk}\nDestination: ${screening.referralHospital}\nUrgency: ${screening.referralPriority} (${screening.result.urgency})\nProcedures: ${procedures.join('; ')}\nReferring Clinician: ${clinicianName}, ${facilityName}`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isEmergency = screening.referralPriority === 'Emergency' || screening.result.severityGrade === 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div
        id="referral-report-modal"
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none"
      >
        {/* Modal Top Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <Hospital className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-bold text-base leading-tight">Official Tertiary Referral Report</h3>
              <p className="text-[11px] text-slate-300 font-mono">ID: {referralId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="print-referral-btn"
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              id="copy-referral-text-btn"
              type="button"
              onClick={handleCopySummary}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy Summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              id="download-referral-pdf-btn"
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Slip'}</span>
            </button>

            <button
              id="close-referral-modal-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / Viewable Clinical Referral Slip Body */}
        <div id="referral-slip-printable-area" className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Header Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-teal-700 tracking-wider uppercase block">
                National Tele-Ophthalmology Network
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                TERTIARY EYE CARE CLINICAL REFERRAL SLIP
              </h1>
              <p className="text-xs text-slate-500">
                Department of Health & Family Welfare • Diabetic Eye Care Outreach Node
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="font-mono text-xs font-bold text-slate-900 block">
                {referralId}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Date: {dateFormatted}
              </span>
              <span
                className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  isEmergency
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {screening.referralPriority || 'High'} Urgency
              </span>
            </div>
          </div>

          {/* Referral Route (Origin & Destination) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Referring Center (Origin)
              </span>
              <div className="font-bold text-slate-900 text-sm">{facilityName || 'AIIMS Outreach Center'}</div>
              <div className="text-slate-600">
                Referring Clinician: <span className="font-semibold text-slate-800">{clinicianName || 'Dr. Ananya Sharma'}</span>
              </div>
              <div className="text-slate-500 text-[11px]">Primary Tele-Screening Unit</div>
            </div>

            <div className="space-y-1 border-t sm:border-t-0 sm:border-l sm:pl-4 border-slate-200 pt-2 sm:pt-0">
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                Destination Tertiary Center
              </span>
              <div className="font-bold text-teal-950 text-sm flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{screening.referralHospital || 'Regional Institute of Ophthalmology, Apex Center'}</span>
              </div>
              <div className="text-slate-600">Department: <span className="font-semibold text-slate-800">Vitreoretinal Specialty OPD</span></div>
              <div className="text-teal-700 text-[11px] font-medium">Target Review Timeline: {screening.result.urgency}</div>
            </div>
          </div>

          {/* Patient Profile */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Patient Identification & Exam Details
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm">{screening.patientName || 'Patient'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Patient ID</span>
                <span className="font-mono font-bold text-slate-800">{screening.patientId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Age / Gender</span>
                <span className="font-semibold text-slate-800">{screening.age} Yrs • {screening.gender || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Referred Eye</span>
                <span className="font-semibold text-slate-800">
                  {screening.eye} Eye ({screening.eye === 'Left' ? 'OS' : 'OD'})
                </span>
              </div>
            </div>
          </div>

          {/* AI Clinical Diagnosis & Classification Banner */}
          <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">
                Confirmed ICDR Classification
              </span>
              <span className="font-mono text-xs font-bold text-teal-900 bg-white px-2 py-0.5 rounded border border-teal-200">
                ICD-10: E11.3{screening.result.severityGrade === 4 ? '59 (PDR)' : '19 (NPDR)'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div>
                <SeverityBadge grade={screening.result.severityGrade} size="lg" />
                <p className="text-xs text-slate-700 mt-2 font-medium">
                  {gradeInfo.shortName} with {screening.result.macularEdemaRisk.toLowerCase()} Macular Edema risk.
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-500 block">Triage Recommendation</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                  {screening.result.urgency}
                </span>
              </div>
            </div>
          </div>

          {/* Confidence Scores & Multi-Class Distribution */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  AI Confidence Scores & Multi-Class Probabilities
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confRating.badgeClass}`}>
                {confRating.label} ({screening.result.confidence}%)
              </span>
            </div>

            {/* 5-class boxes */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {classProbs.map((cp) => {
                const isTarget = cp.grade === screening.result.severityGrade;
                return (
                  <div
                    key={cp.grade}
                    className={`p-2 rounded-lg text-center border transition-all ${
                      isTarget
                        ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className={`text-[10px] block font-medium ${isTarget ? 'text-teal-100' : 'text-slate-400'}`}>
                      Gr {cp.grade}
                    </span>
                    <span className="font-bold text-xs block font-mono mt-0.5">
                      {cp.probability.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              <span>Macular Edema Certainty: <strong className="text-slate-700 font-mono">{referralData.macularEdemaConfidence}%</strong></span>
              <span>Retinal Image Quality Index: <strong className="text-slate-700 font-mono">{referralData.imageQualityScore}%</strong></span>
              <span>Inference: <strong className="text-slate-700">Edge Device</strong></span>
            </div>
          </div>

          {/* Recommended Tertiary Procedures */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Recommended Tertiary Procedures & Workup</span>
            </h4>
            <ul className="space-y-1.5 pt-1">
              {procedures.map((proc, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-teal-50 text-teal-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-medium">{proc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Clinician Notes */}
          {screening.notes && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <span className="font-bold text-[11px] block text-amber-950">Referring Clinician Clinical Remarks:</span>
              <p className="italic">"{screening.notes}"</p>
            </div>
          )}

          {/* Signatures and Stamp Box */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-1">
              <div className="h-10 border-b border-dashed border-slate-300" />
              <p className="font-bold text-slate-900 pt-1">
                {clinicianName || 'Dr. Ananya Sharma'}
              </p>
              <p className="text-[11px] text-slate-500">
                Referring Medical Officer (Reg. No: DMC-84210)
              </p>
              <p className="text-[10px] text-slate-400">{facilityName || 'AIIMS Outreach Node'}</p>
            </div>

            <div className="space-y-1 text-right">
              <div className="h-10 border-b border-dashed border-slate-300" />
              <p className="font-bold text-slate-900 pt-1">
                Receiving Ophthalmic Center
              </p>
              <p className="text-[11px] text-slate-500">
                Official OPD Registration & Triage Stamp
              </p>
              <p className="text-[10px] text-slate-400">Vitreoretinal Specialty Unit</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Close */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center print:hidden">
          <span className="text-xs text-slate-500">
            Official tele-ophthalmology referral document generated under national screening protocols.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
