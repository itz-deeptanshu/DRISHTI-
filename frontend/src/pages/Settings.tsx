import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { AIInfoCard } from '../components/AIInfoCard';
import { LanguageSelector } from '../components/LanguageSelector';
import { AI_MODEL_METADATA } from '../data/mockData';
import {
  Settings as SettingsIcon,
  Globe,
  User,
  Building2,
  Trash2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Palette,
  Stethoscope,
  ArrowLeftRight,
  Eye,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const {
    language,
    setLanguage,
    currentUser,
    userRole,
    clinicianName,
    setClinicianName,
    facilityName,
    setFacilityName,
    clearAllData,
    resetToMockDefaults,
    isOnline,
    t,
  } = useScreening();

  const [cName, setCName] = useState(clinicianName);
  const [fName, setFName] = useState(facilityName);
  const [isSavedToast, setIsSavedToast] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setClinicianName(cName);
    setFacilityName(fName);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  return (
    <div id="settings-page" className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {t('settings')} & Clinical Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure screening node identity, local AI preferences, language, and clinical datasets.
        </p>
      </div>

      {isSavedToast && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Clinician & Facility profile updated successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column (7 cols): Clinician Profile & Language */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Account & Role Management */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Active Account & Login Session</h3>
                  <p className="text-xs text-slate-500">Role-based access control for clinicians and patients</p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider">
                {userRole === 'doctor' ? 'Doctor Workspace' : 'Patient Vault'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <strong className="block text-slate-900 font-bold text-sm">
                  {currentUser?.name || clinicianName}
                </strong>
                <p className="text-slate-500 mt-0.5">
                  {currentUser?.role === 'doctor'
                    ? `${currentUser.specialization} • ${currentUser.registrationNumber}`
                    : `Patient ID: ${currentUser?.patientId} • ABHA: ${currentUser?.abhaId}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Switch Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/patient-portal')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-teal-600" />
                  <span>Patient Portal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Clinician & Facility Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Clinician & Facility Setup</h3>
                <p className="text-xs text-slate-500">Printed on tele-ophthalmology referral summaries</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="clinician-name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Lead Clinician / Ophthalmologist Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="clinician-name-input"
                    type="text"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="facility-name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Screening Facility / Vision Center
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="facility-name-input"
                    type="text"
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="save-profile-btn"
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Save Profile Settings
                </button>
              </div>
            </form>
          </div>

          {/* Localization & Regional Languages */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{t('regionalLanguages')}</h3>
                <p className="text-xs text-slate-500">
                  Select preferred regional language for rural outreach clinics and tele-consultation
                </p>
              </div>
            </div>

            <LanguageSelector variant="cards" />
          </div>

          {/* Local Session & Demo Data Reset */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Session & Storage Controls</h3>
            <p className="text-xs text-slate-500">
              Manage client-side browser session cache and demo patient records.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                id="reset-demo-data-btn"
                type="button"
                onClick={resetToMockDefaults}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                <span>{t('resetDemoData')}</span>
              </button>

              <button
                id="clear-local-data-btn"
                type="button"
                onClick={clearAllData}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{t('clearData')}</span>
              </button>
            </div>
          </div>

          {/* Cloud & Tele-Ophthalmology Edge Gateway Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Central Tele-Ophthalmology Gateway</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${isOnline ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                {isOnline ? 'Endpoint Reachable' : 'Offline Edge Isolated'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Synchronizes screening records via <code className="text-teal-700 font-mono">POST /screenings/sync</code> and updates hospital triage dispatches via <code className="text-teal-700 font-mono">PATCH /referrals/{'{screening_id}'}</code>.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
              <div>Gateway URI: <span className="text-slate-800 font-bold">https://retinax-edge.telemed.internal/api/v1</span></div>
              <div>Auth Token Header: <span className="text-slate-800 font-bold">X-API-Key: ••••••••••••••••</span></div>
              <div>Encryption: <span className="text-emerald-700 font-semibold">TLS 1.3 / AES-256 GCM</span></div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): AI Model Metadata Card */}
        <div className="lg:col-span-5 space-y-6">
          <AIInfoCard compact={false} />

          {/* Model Architecture Technical Specs Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Smart India Hackathon XAI Pipeline</span>
            </h3>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              VisionNet-RetinaX leverages deep feature activation extraction in the final convolutional layers. By computing the backpropagated gradients of target severity classes with respect to feature maps, Grad-CAM localizes microaneurysms and neovascular fronds without requiring bounding-box pixel level annotations during training.
            </p>
            <div className="pt-2 border-t border-slate-100 space-y-1 font-mono text-[10px] text-slate-500">
              <div>Backbone: EfficientNet-B3 (NoisyStudent)</div>
              <div>Explainability: Grad-CAM ++ / Guided CAM</div>
              <div>Loss: Focal Loss (gamma=2.0) + Ordinal Quadratic Kappa</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
