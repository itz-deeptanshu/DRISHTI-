import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { DEMO_DOCTORS, DEMO_PATIENTS } from '../data/authData';
import { DoctorUser, PatientUser } from '../types';
import {
  Stethoscope,
  User,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  Hospital,
  Smartphone,
  CreditCard,
  HeartHandshake,
  Sparkles,
  KeyRound,
  FileText,
} from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginDoctor, loginPatient, currentUser, language, t } = useScreening();

  const [activeTab, setActiveTab] = useState<'doctor' | 'patient'>('doctor');

  // Doctor form states
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(DEMO_DOCTORS[0].id);
  const [docEmail, setDocEmail] = useState<string>(DEMO_DOCTORS[0].email);
  const [docRegNo, setDocRegNo] = useState<string>(DEMO_DOCTORS[0].registrationNumber);
  const [docPin, setDocPin] = useState<string>('8421');
  const [docDepartment, setDocDepartment] = useState<string>('Retina & Vitreous Division');
  const [docLoading, setDocLoading] = useState<boolean>(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Patient form states
  const [patientLoginMethod, setPatientLoginMethod] = useState<'patientId' | 'abha' | 'phone'>('patientId');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(DEMO_PATIENTS[0].id);
  const [patientIdentifier, setPatientIdentifier] = useState<string>(DEMO_PATIENTS[0].patientId);
  const [patientOtp, setPatientOtp] = useState<string>('4821');
  const [patientLoading, setPatientLoading] = useState<boolean>(false);
  const [patientError, setPatientError] = useState<string | null>(null);

  // Handle Quick Doctor Selection
  const handleSelectQuickDoctor = (doc: DoctorUser) => {
    setSelectedDoctorId(doc.id);
    setDocEmail(doc.email);
    setDocRegNo(doc.registrationNumber);
    setDocDepartment(doc.department);
    setDocError(null);
  };

  // Handle Quick Patient Selection
  const handleSelectQuickPatient = (pat: PatientUser) => {
    setSelectedPatientId(pat.id);
    if (patientLoginMethod === 'patientId') {
      setPatientIdentifier(pat.patientId);
    } else if (patientLoginMethod === 'abha') {
      setPatientIdentifier(pat.abhaId);
    } else {
      setPatientIdentifier(pat.phone);
    }
    setPatientError(null);
  };

  // Submit Doctor Login
  const handleDoctorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setDocError(null);

    if (!docEmail && !docRegNo) {
      setDocError('Please enter doctor email or medical registration number');
      return;
    }

    setDocLoading(true);
    setTimeout(() => {
      // Find matching doctor or fallback to selected
      const matched = DEMO_DOCTORS.find(
        (d) =>
          d.id === selectedDoctorId ||
          d.email.toLowerCase() === docEmail.toLowerCase() ||
          d.registrationNumber.toLowerCase() === docRegNo.toLowerCase()
      ) || DEMO_DOCTORS[0];

      loginDoctor(matched);
      setDocLoading(false);
      navigate('/');
    }, 450);
  };

  // Submit Patient Login
  const handlePatientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPatientError(null);

    if (!patientIdentifier.trim()) {
      setPatientError('Please provide your Patient ID, ABHA Health ID, or Mobile number');
      return;
    }

    setPatientLoading(true);
    setTimeout(() => {
      const cleanIdent = patientIdentifier.trim().toLowerCase();
      const matched = DEMO_PATIENTS.find(
        (p) =>
          p.id === selectedPatientId ||
          p.patientId.toLowerCase() === cleanIdent ||
          p.abhaId.toLowerCase() === cleanIdent ||
          p.phone.replace(/[^0-9]/g, '') === cleanIdent.replace(/[^0-9]/g, '')
      ) || DEMO_PATIENTS[0];

      loginPatient(matched);
      setPatientLoading(false);
      navigate('/patient-portal');
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Subtle Gradient & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.15),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.12),transparent_50%)] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-teal-900/50">
            DR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">DR Screening Portal</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                ICDR AI v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              National Tele-Ophthalmology & Retinal Triage Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-1">
            <LanguageSelector variant="compact" />
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 my-auto">
        <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden">
          {/* Dual-Role Selector Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-900/90 border-b border-slate-800 gap-1.5">
            <button
              id="tab-doctor-login"
              type="button"
              onClick={() => setActiveTab('doctor')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                activeTab === 'doctor'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Stethoscope className="w-4 h-4 shrink-0" />
              <span>Doctor / Clinician Login</span>
            </button>

            <button
              id="tab-patient-login"
              type="button"
              onClick={() => setActiveTab('patient')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                activeTab === 'patient'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Patient & Caregiver Login</span>
            </button>
          </div>

          {/* DOCTOR LOGIN SECTION */}
          {activeTab === 'doctor' && (
            <div className="p-6 sm:p-8 space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-teal-400" />
                    Clinician Authentication
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Authorized Medical Practitioners, Ophthalmologists & Certified Technicians
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-950/60 border border-teal-800/50 text-[11px] text-teal-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Clinical Auth Gate</span>
                </div>
              </div>

              {/* Quick 1-Click Doctor Profile Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  1-Click Demo Clinicians (Select to Auto-Fill):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {DEMO_DOCTORS.map((doc) => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleSelectQuickDoctor(doc)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-950/70 border-teal-500 text-teal-100 ring-1 ring-teal-500/40'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="w-6 h-6 rounded-full bg-teal-800/80 text-teal-200 text-[10px] font-bold flex items-center justify-center">
                            {doc.avatarInitials}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                        </div>
                        <p className="text-xs font-bold text-white truncate">{doc.name.split(',')[0]}</p>
                        <p className="text-[10px] text-teal-400/90 truncate">{doc.specialization}</p>
                        <p className="text-[9px] text-slate-500 truncate mt-0.5">{doc.facilityName}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Doctor Form */}
              <form onSubmit={handleDoctorLogin} className="space-y-4">
                {docError && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{docError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Medical Reg Number / Email
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        id="doctor-id-input"
                        type="text"
                        value={docRegNo || docEmail}
                        onChange={(e) => {
                          setDocRegNo(e.target.value);
                          setDocEmail(e.target.value);
                        }}
                        placeholder="e.g. MCI-DL-2018-84210"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Department / Clinical Division
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <select
                        id="doctor-dept-select"
                        value={docDepartment}
                        onChange={(e) => setDocDepartment(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-teal-500 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="Retina & Vitreous Division">Retina & Vitreous Division</option>
                        <option value="Comprehensive Ophthalmology">Comprehensive Ophthalmology</option>
                        <option value="Tele-Ophthalmology & Outreach Unit">Tele-Ophthalmology Outreach</option>
                        <option value="Mobile Screening Division">Mobile Screening Division</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Clinical Facility / Outreach Center
                    </label>
                    <div className="relative">
                      <Hospital className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        readOnly
                        value={DEMO_DOCTORS.find((d) => d.id === selectedDoctorId)?.facilityName || 'AIIMS Outreach'}
                        className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-slate-800/80 rounded-lg text-slate-400 text-xs focus:outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Security PIN / Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        id="doctor-pin-input"
                        type="password"
                        value={docPin}
                        onChange={(e) => setDocPin(e.target.value)}
                        placeholder="••••"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <button
                  id="doctor-login-submit-btn"
                  type="submit"
                  disabled={docLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-950 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
                >
                  {docLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter Clinical Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Doctor Footnote */}
              <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>Certified by National Medical Commission (NMC)</span>
                <span className="text-teal-400 font-mono">Edge AI Engine: Enabled</span>
              </div>
            </div>
          )}

          {/* PATIENT LOGIN SECTION */}
          {activeTab === 'patient' && (
            <div className="p-6 sm:p-8 space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-400" />
                    Patient & Family Health Portal
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Check your diabetic retinal screening results, doctor notes, and referral slips
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-950/60 border border-teal-800/50 text-[11px] text-teal-300 font-medium">
                  <HeartHandshake className="w-3.5 h-3.5 text-teal-400" />
                  <span>ABHA Integrated</span>
                </div>
              </div>

              {/* Quick 1-Click Patient Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  1-Click Sample Patients (Select to Test):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {DEMO_PATIENTS.map((pat) => {
                    const isSelected = selectedPatientId === pat.id;
                    return (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => handleSelectQuickPatient(pat)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-950/70 border-teal-500 text-teal-100 ring-1 ring-teal-500/40'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-teal-400 font-mono">
                            {pat.patientId}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-teal-400" />}
                        </div>
                        <p className="text-xs font-bold text-white truncate">{pat.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {pat.age}y • {pat.gender}
                        </p>
                        <p className="text-[9px] text-slate-500 truncate mt-1">
                          {pat.lastHbA1c?.split(' ')[0]} HbA1c
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient Identifier Selection Modes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setPatientLoginMethod('patientId');
                      const cur = DEMO_PATIENTS.find((p) => p.id === selectedPatientId) || DEMO_PATIENTS[0];
                      setPatientIdentifier(cur.patientId);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      patientLoginMethod === 'patientId'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Patient ID
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPatientLoginMethod('abha');
                      const cur = DEMO_PATIENTS.find((p) => p.id === selectedPatientId) || DEMO_PATIENTS[0];
                      setPatientIdentifier(cur.abhaId);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      patientLoginMethod === 'abha'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ABHA Health ID
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPatientLoginMethod('phone');
                      const cur = DEMO_PATIENTS.find((p) => p.id === selectedPatientId) || DEMO_PATIENTS[0];
                      setPatientIdentifier(patToPhone(cur.phone));
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      patientLoginMethod === 'phone'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mobile Phone
                  </button>
                </div>

                <form onSubmit={handlePatientLogin} className="space-y-4">
                  {patientError && (
                    <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{patientError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        {patientLoginMethod === 'patientId' && 'Patient ID Number'}
                        {patientLoginMethod === 'abha' && 'Ayushman Bharat ABHA Number'}
                        {patientLoginMethod === 'phone' && 'Registered Mobile Number'}
                      </label>
                      <div className="relative">
                        {patientLoginMethod === 'phone' ? (
                          <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        ) : (
                          <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        )}
                        <input
                          id="patient-id-input"
                          type="text"
                          value={patientIdentifier}
                          onChange={(e) => setPatientIdentifier(e.target.value)}
                          placeholder={
                            patientLoginMethod === 'patientId'
                              ? 'e.g. PAT-2026-8841'
                              : patientLoginMethod === 'abha'
                              ? 'e.g. 91-4821-7740-1928'
                              : '+91 98765 43210'
                          }
                          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">
                          Security OTP / Birth Year
                        </label>
                        <span className="text-[10px] text-teal-400 font-mono">Demo OTP: 4821</span>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          id="patient-otp-input"
                          type="text"
                          value={patientOtp}
                          onChange={(e) => setPatientOtp(e.target.value)}
                          placeholder="4-digit OTP"
                          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-teal-500 transition-colors tracking-wider"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Patient Info Card Display */}
                  {(() => {
                    const currentPat = DEMO_PATIENTS.find((p) => p.id === selectedPatientId) || DEMO_PATIENTS[0];
                    return (
                      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-900/60 text-teal-300 border border-teal-700/50 flex items-center justify-center font-bold text-xs">
                            {currentPat.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white">{currentPat.name}</p>
                            <p className="text-[11px] text-slate-400">
                              {currentPat.diabetesDuration} • Primary Center: {currentPat.primaryCenter?.split(',')[0]}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                          {currentPat.bloodPressure}
                        </span>
                      </div>
                    );
                  })()}

                  <button
                    id="patient-login-submit-btn"
                    type="submit"
                    disabled={patientLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-950 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
                  >
                    {patientLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>View My Retinal Health Records</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Patient Help / ASHA Worker info */}
              <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>Need assistance? Ask your community ASHA / ANM health worker</span>
                <span className="text-slate-400">Toll-Free Eye Helpline: <strong className="text-teal-400">1800-11-2244</strong></span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/60 py-3 px-4 sm:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-500" />
          <span>Ayushman Bharat Digital Mission (ABDM) Compliant Retinal Health Portal</span>
        </div>
        <p className="text-[11px] text-slate-500">
          AI Retinal Screening Tool for Clinical Decision Support only • Not a standalone diagnosis
        </p>
      </footer>
    </div>
  );
};

function patToPhone(phone: string): string {
  return phone;
}
