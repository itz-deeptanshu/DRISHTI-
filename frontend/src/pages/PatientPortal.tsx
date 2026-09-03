import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { SeverityBadge } from '../components/SeverityBadge';
import { RetinaViewer } from '../components/RetinaViewer';
import { ReferralReportModal } from '../components/ReferralReportModal';
import { LanguageSelector } from '../components/LanguageSelector';
import { DR_GRADES, getLocalizedText } from '../data/mockData';
import { generateClinicalPDFReport, generateReferralSlipPDF } from '../utils/pdfGenerator';
import { calculateClassProbabilities, getRecommendedProcedures } from '../utils/confidenceUtils';
import { PatientScreening, ReferralReportData, PatientUser } from '../types';
import { toStaticUrl } from '../api/client';
import {
  User,
  Heart,
  Calendar,
  Hospital,
  AlertTriangle,
  Download,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Eye,
  LogOut,
  Stethoscope,
  PhoneCall,
  Activity,
  Droplets,
  HelpCircle,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const PatientPortal: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    userRole,
    logout,
    switchRole,
    history,
    language,
    t,
  } = useScreening();

  const [selectedScreeningModal, setSelectedScreeningModal] = useState<PatientScreening | null>(null);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isDownloadingReferral, setIsDownloadingReferral] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);

  // If the user is not a patient, or not logged in, provide friendly fallback
  const patientUser: PatientUser =
    currentUser && currentUser.role === 'patient'
      ? currentUser
      : {
          id: 'pat-1',
          role: 'patient',
          name: 'Sunita Devi',
          patientId: 'PAT-2026-8841',
          abhaId: '91-4821-7740-1928',
          age: 58,
          gender: 'Female',
          phone: '+91 98765 43210',
          diabetesDuration: 'Type 2 Diabetes (7 years)',
          lastHbA1c: '8.2% (Moderate Risk)',
          bloodPressure: '138/86 mmHg',
          primaryCenter: 'District Community Health Center, Eye Dept',
        };

  // Find screenings associated with this patient
  const patientScreenings = history.filter(
    (item) =>
      item.patientId === patientUser.patientId ||
      item.patientName?.toLowerCase() === patientUser.name.toLowerCase()
  );

  // Use the most recent screening or fallback to first available
  const latestScreening: PatientScreening = patientScreenings[0] || history[1] || history[0];
  const gradeInfo = DR_GRADES[latestScreening.result.severityGrade] || DR_GRADES[0];
  const isReferred = latestScreening.referralStatus === 'referral_created';

  const handleDownloadClinicalPDF = async () => {
    try {
      setIsDownloadingPdf(true);
      await generateClinicalPDFReport({
        ...latestScreening,
        patientName: latestScreening.patientName || patientUser.name,
        language,
      });
      setPdfSuccess('Clinical report downloaded successfully');
      setTimeout(() => setPdfSuccess(null), 3500);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadReferralSlip = async () => {
    try {
      setIsDownloadingReferral(true);
      const referralData: ReferralReportData = {
        referralId: `REF-${patientUser.patientId.replace(/[^0-9]/g, '') || '8841'}-${latestScreening.eye === 'Left' ? 'OS' : 'OD'}`,
        referralDate: new Date(latestScreening.screenedAt).toLocaleDateString('en-IN'),
        patientId: patientUser.patientId,
        patientName: patientUser.name,
        age: patientUser.age,
        gender: patientUser.gender,
        eye: latestScreening.eye,
        screenedAt: latestScreening.screenedAt,
        severityGrade: latestScreening.result.severityGrade,
        primaryConfidence: latestScreening.result.confidence,
        classProbabilities: latestScreening.result.classProbabilities || calculateClassProbabilities(latestScreening.result.severityGrade, latestScreening.result.confidence),
        macularEdemaRisk: latestScreening.result.macularEdemaRisk,
        macularEdemaConfidence: latestScreening.result.macularEdemaConfidence || 91.8,
        imageQualityScore: latestScreening.result.imageQualityScore || 97.6,
        referralHospital: latestScreening.referralHospital || 'District Community Health Center, Eye Dept',
        referralPriority: latestScreening.referralPriority || 'High',
        targetUrgency: latestScreening.result.urgency,
        clinicianName: 'Dr. Ananya Sharma, MBBS, MS',
        facilityName: 'AIIMS Community Vision Outreach Center',
        clinicalNotes: latestScreening.notes,
        findingsCount: latestScreening.result.findings.length,
        recommendedProcedures: getRecommendedProcedures(latestScreening.result.severityGrade, latestScreening.result.macularEdemaRisk),
      };

      await generateReferralSlipPDF(referralData);
      setPdfSuccess('Referral slip downloaded successfully');
      setTimeout(() => setPdfSuccess(null), 3500);
    } catch (err) {
      console.error('Error generating referral PDF:', err);
    } finally {
      setIsDownloadingReferral(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Patient Portal Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">My Retinal Health Portal</span>
                <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 font-bold px-2 py-0.5 rounded-full">
                  Patient Vault
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Ayushman Bharat Digital Mission (ABDM) • Personal Retinal Records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector variant="compact" />

            {/* Switch to Doctor or Logout */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                id="switch-to-doctor-btn"
                type="button"
                onClick={() => {
                  switchRole('doctor');
                  navigate('/');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                title="Switch to Clinician Dashboard"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor Portal</span>
              </button>

              <button
                id="patient-logout-btn"
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Success Toast */}
        {pdfSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{pdfSuccess}</span>
            </div>
          </div>
        )}

        {/* Patient Identity & Health Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
                {patientUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">{patientUser.name}</h1>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                    {patientUser.gender}, {patientUser.age} years
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  <span>
                    Patient ID: <strong className="font-mono text-slate-700">{patientUser.patientId}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    ABHA ID: <strong className="font-mono text-teal-700">{patientUser.abhaId}</strong>
                  </span>
                  <span>•</span>
                  <span>{patientUser.phone}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Clinical Health Status
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  {patientUser.diabetesDuration || 'Type 2 Diabetes'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Last HbA1c Lab</span>
              <span className="font-bold text-slate-800 text-sm">{patientUser.lastHbA1c || '8.2%'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Blood Pressure</span>
              <span className="font-bold text-slate-800 text-sm">{patientUser.bloodPressure || '138/86 mmHg'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Total Eye Screenings</span>
              <span className="font-bold text-slate-800 text-sm">{patientScreenings.length || 1} Scans</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Registered Outreach Node</span>
              <span className="font-bold text-slate-800 text-sm truncate block">
                {patientUser.primaryCenter?.split(',')[0] || 'AIIMS Outreach Center'}
              </span>
            </div>
          </div>
        </div>

        {/* LATEST RETINAL SCREENING RESULT (HERO CARD) */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 p-5 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-teal-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  Most Recent Retinal Checkup
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold mt-1">
                  Retinal Health Diagnosis & Evaluation
                </h2>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  Screened on: {new Date(latestScreening.screenedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  <span>•</span>
                  <span>{latestScreening.eye} Eye ({latestScreening.eye === 'Left' ? 'OS' : 'OD'})</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="patient-download-summary-pdf-btn"
                  type="button"
                  onClick={handleDownloadClinicalPDF}
                  disabled={isDownloadingPdf}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-teal-300" />
                  <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Clinical Report'}</span>
                </button>

                {isReferred && (
                  <button
                    id="patient-download-referral-slip-btn"
                    type="button"
                    onClick={handleDownloadReferralSlip}
                    disabled={isDownloadingReferral}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-950 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Hospital className="w-3.5 h-3.5" />
                    <span>{isDownloadingReferral ? 'Generating Slip...' : 'Download Referral Slip'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Diagnosis Body */}
          <div className="p-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Severity Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <SeverityBadge grade={latestScreening.result.severityGrade} showTitle={true} size="lg" />
                  <span className="text-xs font-semibold text-slate-500">
                    AI Diagnostic Certainty: <strong>{latestScreening.result.confidence.toFixed(1)}%</strong>
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">What this result means for you:</h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {getLocalizedText(gradeInfo.description, language)}
                  </p>
                </div>

                <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-200 text-xs sm:text-sm text-teal-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-teal-950">
                    <Clock className="w-4 h-4 text-teal-700" />
                    Recommended Follow-up Timeline:
                  </p>
                  <p className="text-teal-800">
                    {getLocalizedText(gradeInfo.recommendedFollowUp, language)}
                  </p>
                </div>
              </div>

              {/* Retinal Fundus Preview with Interactive Modal Option */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-xs bg-black rounded-2xl overflow-hidden shadow-md border border-slate-200 relative group">
                  <img
                    src={
                      latestScreening.imageUrl.startsWith('preset:')
                        ? 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80'
                        : toStaticUrl(latestScreening.imageUrl)
                    }
                    alt="Patient Retinal Fundus Scan"
                    className="w-full h-52 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3.5 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono">
                        {latestScreening.eye} Eye Retinal Field
                      </span>
                      <span className="text-[10px] bg-teal-500/90 text-white font-bold px-2 py-0.5 rounded">
                        Grad-CAM Verified
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  High-resolution fundus scan captured with outreach ophthalmoscope
                </p>
              </div>
            </div>

            {/* ACTIVE REFERRAL ALERT CARD (IF REFERRED) */}
            {isReferred && (
              <div className="p-5 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      <Hospital className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-950">
                        Tertiary Ophthalmology Referral Active
                      </h4>
                      <p className="text-xs text-amber-800">
                        Your doctor has recommended an evaluation at a specialist eye center.
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 font-bold text-xs self-start sm:self-auto">
                    Urgency: {latestScreening.result.urgency}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-amber-950">
                  <div className="p-2.5 bg-white/70 rounded-lg border border-amber-200">
                    <span className="text-amber-700 block text-[11px] font-medium">Referred Hospital</span>
                    <strong className="block text-xs mt-0.5">
                      {latestScreening.referralHospital || 'District Eye Hospital'}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-white/70 rounded-lg border border-amber-200">
                    <span className="text-amber-700 block text-[11px] font-medium">Target Consultation Window</span>
                    <strong className="block text-xs mt-0.5">
                      {latestScreening.result.urgency}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-white/70 rounded-lg border border-amber-200">
                    <span className="text-amber-700 block text-[11px] font-medium">Macular Edema Assessment</span>
                    <strong className="block text-xs mt-0.5">
                      {latestScreening.result.macularEdemaRisk} Risk
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-amber-900">
                    📌 <strong>What to bring:</strong> Government ID, prescription glasses, previous blood sugar lab results, and this Referral Slip.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowReferralModal(true)}
                    className="text-xs font-bold text-amber-900 hover:text-amber-950 underline underline-offset-2 cursor-pointer"
                  >
                    View Complete Referral Details &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DIABETIC EYE CARE GUIDELINES & EDUCATION FOR PATIENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 4 Golden Rules */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              4 Rules to Protect Your Eyesight from Diabetes
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <strong className="block text-slate-900 text-xs sm:text-sm">Keep HbA1c below 7.0%</strong>
                  <p className="text-xs text-slate-500 mt-0.5">
                    High blood sugar weakens tiny blood vessels in the retina, causing leaks and bleeds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <strong className="block text-slate-900 text-xs sm:text-sm">Control Blood Pressure & Lipids</strong>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target blood pressure under 130/80 mmHg to avoid high vascular pressure in delicate retinal capillaries.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <strong className="block text-slate-900 text-xs sm:text-sm">Never Skip Annual Dilated Retinal Scans</strong>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Early diabetic retinopathy has ZERO symptoms. Waiting until vision blurs means irreversible damage may have started.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <strong className="block text-slate-900 text-xs sm:text-sm">Have an Eye Examination Before Planning Pregnancy</strong>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Diabetic eye disease can advance rapidly during pregnancy. Notify your physician early.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Warning Symptoms Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Red-Flag Symptoms: Go to Eye Hospital Immediately
            </h3>
            <p className="text-xs text-slate-600">
              Do not wait for your scheduled appointment if you experience any of these signs:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-950">
                <Droplets className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Sudden shower of black floaters, spots, or cobwebs</strong> in your vision
                </span>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-950">
                <Eye className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>A dark shadow or curtain</strong> falling across your field of vision
                </span>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-950">
                <Activity className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Rapid, painless loss of central vision</strong> in one or both eyes
                </span>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-950">
                <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Sudden flashes of bright light</strong> in the side of your eye
                </span>
              </div>
            </div>

            {/* Helpline Banner */}
            <div className="p-4 bg-teal-900 text-white rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PhoneCall className="w-6 h-6 text-teal-400 shrink-0" />
                <div>
                  <span className="text-[11px] text-teal-300 uppercase tracking-wider block">
                    National Tele-Retina Support
                  </span>
                  <strong className="text-base font-bold font-mono">1800-11-2244</strong>
                </div>
              </div>
              <span className="text-[10px] bg-teal-800 text-teal-200 px-2.5 py-1 rounded-full font-medium">
                24/7 Toll-Free
              </span>
            </div>
          </div>
        </div>

        {/* ALL SCREENING VISITS FOR THIS PATIENT */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Your Retinal Screening History</h3>
              <p className="text-xs text-slate-500">
                Chronological record of all retinal examinations performed at outreach centers
              </p>
            </div>
            <span className="text-xs bg-slate-100 font-semibold text-slate-700 px-2.5 py-1 rounded-full">
              {patientScreenings.length || 1} Records
            </span>
          </div>

          <div className="space-y-3">
            {(patientScreenings.length > 0 ? patientScreenings : [latestScreening]).map((scr) => (
              <div
                key={scr.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 transition-colors bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={
                        scr.imageUrl.startsWith('preset:')
                          ? 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=300&q=80'
                          : toStaticUrl(scr.imageUrl)
                      }
                      alt="Fundus scan thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {scr.eye} Eye ({scr.eye === 'Left' ? 'OS' : 'OD'})
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        {new Date(scr.screenedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <SeverityBadge grade={scr.result.severityGrade} showTitle={true} size="sm" />
                      {scr.referralStatus === 'referral_created' && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                          Referred to Specialist
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={async () => {
                      await generateClinicalPDFReport({
                        ...scr,
                        patientName: scr.patientName || patientUser.name,
                        language,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-600" />
                    <span>Report (PDF)</span>
                  </button>

                  {scr.referralStatus === 'referral_created' && (
                    <button
                      type="button"
                      onClick={() => setShowReferralModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 text-xs font-semibold cursor-pointer"
                    >
                      <Hospital className="w-3.5 h-3.5 text-teal-600" />
                      <span>Referral Slip</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Referral Slip Modal Preview */}
      {showReferralModal && (
        <ReferralReportModal
          screening={latestScreening}
          onClose={() => setShowReferralModal(false)}
        />
      )}
    </div>
  );
};
