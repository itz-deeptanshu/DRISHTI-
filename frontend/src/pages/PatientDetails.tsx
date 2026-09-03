import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { SAMPLE_PRESETS } from '../data/mockData';
import {
  createPatient,
  listPatients,
  BackendPatient,
} from '../api/client';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Hash,
  Calendar,
  Eye,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  UserPlus,
  MapPin,
  Search,
  RefreshCw,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';

const SUGGESTED_VILLAGES = [
  'Rampur PHC',
  'Dharwad Rural',
  'Kalyanpur Health Center',
  'Sitapur Vision Center',
  'Sector 4 Community Clinic',
];

export const PatientDetails: React.FC = () => {
  const navigate = useNavigate();
  const { session, updateSession, t, loadPreset, language } = useScreening();

  // Mode: Register New Patient vs Select Registered Patient
  const [mode, setMode] = useState<'new' | 'existing'>('new');

  // New Patient Form State
  const [patientId, setPatientId] = useState<string>(session.patientId || '');
  const [patientName, setPatientName] = useState<string>(session.patientName || '');
  const [age, setAge] = useState<string | number>(session.age || '');
  const [village, setVillage] = useState<string>(session.village || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(session.gender || 'Female');
  const [eye, setEye] = useState<'Left' | 'Right'>(session.eye || 'Right');
  const [errors, setErrors] = useState<{ patientName?: string; age?: string; village?: string; general?: string }>({});

  // Existing Patient Selection State
  const [existingPatients, setExistingPatients] = useState<BackendPatient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<BackendPatient | null>(null);

  // Submission / Loading State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Load existing patients on mount or mode switch
  useEffect(() => {
    if (mode === 'existing' && existingPatients.length === 0) {
      loadPatientsFromBackend();
    }
  }, [mode]);

  const loadPatientsFromBackend = async () => {
    setIsLoadingPatients(true);
    setPatientsError(null);
    try {
      const patients = await listPatients();
      setExistingPatients(Array.isArray(patients) ? patients : []);
    } catch (err: any) {
      setPatientsError(
        err.message || 'Could not connect to clinical backend. Showing offline cached records if available.'
      );
    } finally {
      setIsLoadingPatients(false);
    }
  };

  // Validation logic
  const isNewFormValid = Boolean(
    patientName.trim() &&
    age !== '' &&
    !isNaN(Number(age)) &&
    Number(age) > 0 &&
    Number(age) <= 120 &&
    village.trim()
  );

  const isExistingSelectionValid = Boolean(selectedExistingPatient !== null);

  const isFormValid = mode === 'new' ? isNewFormValid : isExistingSelectionValid;

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setOfflineNotice(null);

    if (mode === 'new') {
      const newErrors: { patientName?: string; age?: string; village?: string } = {};

      if (!patientName.trim()) {
        newErrors.patientName = 'Patient full name is required';
      }
      if (age === '' || isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 120) {
        newErrors.age = 'Please enter a valid age between 1 and 120';
      }
      if (!village.trim()) {
        newErrors.village = 'Village / PHC location is required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      let finalPatientId = '';
      let createdPatient: BackendPatient | null = null;

      try {
        // Check if returning patient already exists with this name and village
        try {
          const existingList = await listPatients();
          const match = existingList.find(
            (p) =>
              p.name &&
              p.name.trim().toLowerCase() === patientName.trim().toLowerCase() &&
              (p.village ? p.village.trim().toLowerCase() === village.trim().toLowerCase() : true)
          );
          if (match && match.id) {
            finalPatientId = String(match.id);
          }
        } catch (listErr) {
          console.warn('Could not query existing patients list:', listErr);
        }

        // If not found in existing patients, register a new patient in the backend
        if (!finalPatientId) {
          createdPatient = await createPatient(
            patientName.trim(),
            Number(age),
            village.trim()
          );

          if (createdPatient && createdPatient.id) {
            finalPatientId = String(createdPatient.id);
          }
        }

        if (!finalPatientId) {
          throw new Error('Backend did not return a valid patient identifier.');
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setErrors({
          general: `Backend patient registration failed: ${err?.message || 'Server error'}. A real registered patient ID is required to execute a screening.`,
        });
        return;
      }

      setIsSubmitting(false);

      // Save real patient ID into session
      updateSession({
        patientId: finalPatientId,
        patientName: patientName.trim(),
        age: Number(age),
        village: village.trim(),
        gender,
        eye,
      });

      navigate('/capture');
    } else {
      // Existing patient selected
      if (!selectedExistingPatient) {
        setErrors({ general: 'Please select a patient from the registered list.' });
        return;
      }

      updateSession({
        patientId: String(selectedExistingPatient.id),
        patientName: selectedExistingPatient.name,
        age: Number(selectedExistingPatient.age),
        village: selectedExistingPatient.village || '',
        gender,
        eye,
      });

      navigate('/capture');
    }
  };

  const handleApplyPreset = (presetId: string) => {
    loadPreset(presetId);
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setMode('new');
      setPatientId('');
      setPatientName(preset.patientName);
      setAge(preset.defaultAge);
      setVillage('Rampur PHC');
      setEye(preset.defaultEye);
      setErrors({});
    }
  };

  const handleSelectExisting = (patient: BackendPatient) => {
    setSelectedExistingPatient(patient);
    setPatientId(String(patient.id));
    setPatientName(patient.name);
    setAge(patient.age);
    setVillage(patient.village || '');
  };

  const filteredPatients = existingPatients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.village && p.village.toLowerCase().includes(q)) ||
      (p.id && String(p.id).toLowerCase().includes(q))
    );
  });

  return (
    <div id="patient-details-page" className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header with Back Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <button
          id="back-to-dashboard-btn"
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')} to {t('dashboard')}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[11px]">
            1
          </span>
          <span>Step 1 of 5: Patient Intake</span>
        </div>
      </div>

      {/* Main Registration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-600 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>SIH Tele-Screening Triage Intake</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {t('patientDetails')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Register a new patient or select an existing record for DR screening.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
            <button
              id="mode-register-new-btn"
              type="button"
              onClick={() => setMode('new')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'new'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-600" />
              <span>Register New</span>
            </button>
            <button
              id="mode-select-existing-btn"
              type="button"
              onClick={() => setMode('existing')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'existing'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>Select Existing</span>
              {existingPatients.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[10px] rounded-full font-mono">
                  {existingPatients.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Demo Pre-fill Bar */}
        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Quick Fill with Demo Clinical Case:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white hover:bg-teal-100/80 border border-teal-200 font-medium text-teal-900 transition-colors shadow-2xs cursor-pointer"
              >
                {p.patientName} ({p.grade === 0 ? 'Normal' : p.grade === 4 ? 'PDR' : `Grade ${p.grade}`})
              </button>
            ))}
          </div>
        </div>

        {/* Offline notice if any */}
        {offlineNotice && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{offlineNotice}</span>
          </div>
        )}

        {/* General Error Banner */}
        {errors.general && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-rose-900 mb-0.5">Registration Issue</span>
              <span>{errors.general}</span>
            </div>
          </div>
        )}

        {/* Mode 1: Register New Patient Form */}
        {mode === 'new' && (
          <form onSubmit={handleContinue} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Field 1: Patient Name */}
              <div className="space-y-1.5">
                <label htmlFor="patient-name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Patient Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="patient-name-input"
                    type="text"
                    required
                    placeholder="e.g. Sunita Devi"
                    value={patientName}
                    onChange={(e) => {
                      setPatientName(e.target.value);
                      if (errors.patientName) setErrors((prev) => ({ ...prev, patientName: undefined }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.patientName
                        ? 'border-rose-300 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-teal-500 focus:border-teal-500'
                    }`}
                  />
                </div>
                {errors.patientName && (
                  <p className="text-xs text-rose-600">{errors.patientName}</p>
                )}
              </div>

              {/* Field 2: Age */}
              <div className="space-y-1.5">
                <label htmlFor="patient-age-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t('age')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="patient-age-input"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 58"
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      if (errors.age) setErrors((prev) => ({ ...prev, age: undefined }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border font-mono text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.age
                        ? 'border-rose-300 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-teal-500 focus:border-teal-500'
                    }`}
                  />
                </div>
                {errors.age && (
                  <p className="text-xs text-rose-600">{errors.age}</p>
                )}
              </div>

              {/* Field 3: Village / Location (Required for backend /patients/) */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="patient-village-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Village / PHC Center <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Rural outreach jurisdiction</span>
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="patient-village-input"
                    type="text"
                    required
                    placeholder="e.g. Rampur Primary Health Center"
                    value={village}
                    onChange={(e) => {
                      setVillage(e.target.value);
                      if (errors.village) setErrors((prev) => ({ ...prev, village: undefined }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.village
                        ? 'border-rose-300 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-teal-500 focus:border-teal-500'
                    }`}
                  />
                </div>
                {/* Quick suggestions chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">Suggestions:</span>
                  {SUGGESTED_VILLAGES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setVillage(v);
                        if (errors.village) setErrors((prev) => ({ ...prev, village: undefined }));
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors cursor-pointer"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {errors.village && (
                  <p className="text-xs text-rose-600">{errors.village}</p>
                )}
              </div>

              {/* Field 4: Biological Gender */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Biological Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Female', 'Male', 'Other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        gender === g
                          ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Screening Eye Toggle (Left / Right) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('screeningEye')} <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  id="eye-toggle-right"
                  type="button"
                  onClick={() => setEye('Right')}
                  className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all text-left cursor-pointer ${
                    eye === 'Right'
                      ? 'border-teal-600 bg-teal-50/80 text-teal-950 shadow-xs ring-1 ring-teal-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      eye === 'Right' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    OD
                  </div>
                  <div>
                    <div className="font-bold text-sm">{t('rightEye')}</div>
                    <div className="text-xs text-slate-500">Oculus Dexter (Right)</div>
                  </div>
                  {eye === 'Right' && (
                    <CheckCircle2 className="w-5 h-5 text-teal-600 ml-auto shrink-0" />
                  )}
                </button>

                <button
                  id="eye-toggle-left"
                  type="button"
                  onClick={() => setEye('Left')}
                  className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all text-left cursor-pointer ${
                    eye === 'Left'
                      ? 'border-teal-600 bg-teal-50/80 text-teal-950 shadow-xs ring-1 ring-teal-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      eye === 'Left' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    OS
                  </div>
                  <div>
                    <div className="font-bold text-sm">{t('leftEye')}</div>
                    <div className="text-xs text-slate-500">Oculus Sinister (Left)</div>
                  </div>
                  {eye === 'Left' && (
                    <CheckCircle2 className="w-5 h-5 text-teal-600 ml-auto shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
              <button
                id="cancel-registration-btn"
                type="button"
                onClick={() => navigate('/')}
                className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>

              <button
                id="patient-details-continue-btn"
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm shadow-xs transition-all ${
                  isFormValid && !isSubmitting
                    ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer active:scale-[0.98]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Patient...</span>
                  </>
                ) : (
                  <>
                    <span>Register & {t('continue')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Mode 2: Select Existing Patient from Backend */}
        {mode === 'existing' && (
          <div className="space-y-5">
            {/* Search and Refresh Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search registered patients by name, village, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-all"
                />
              </div>

              <button
                type="button"
                onClick={loadPatientsFromBackend}
                disabled={isLoadingPatients}
                className="flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPatients ? 'animate-spin text-teal-600' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Error state if backend unreachable */}
            {patientsError && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Notice: Database Connection</span>
                </div>
                <p>{patientsError}</p>
                <p className="text-amber-700 pt-1">
                  You can register a new patient above, or use the demo cases.
                </p>
              </div>
            )}

            {/* Patients List */}
            {isLoadingPatients ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                <span>Loading registered patients from backend...</span>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No registered patients found</p>
                <p className="text-xs text-slate-400">
                  {searchQuery
                    ? `No patients matching "${searchQuery}"`
                    : 'The backend patient registry is empty. Switch to "Register New" to add the first patient.'}
                </p>
                <button
                  type="button"
                  onClick={() => setMode('new')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register New Patient</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {filteredPatients.map((p) => {
                  const isSelected = selectedExistingPatient?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectExisting(p)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/80 shadow-xs ring-1 ring-teal-500/20'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span>{p.name}</span>
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                              {p.age}y
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{p.village || 'Community Jurisdiction'}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-1">
                            ID: {p.id}
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="text-xs text-teal-700 font-semibold hover:underline">
                            Select
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Patient Banner & Eye Selection */}
            {selectedExistingPatient && (
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>
                      Selected: <strong>{selectedExistingPatient.name}</strong> ({selectedExistingPatient.age}y, {selectedExistingPatient.village})
                    </span>
                  </div>
                  <span className="font-mono text-teal-800 font-bold text-[11px]">
                    ID: {selectedExistingPatient.id}
                  </span>
                </div>

                {/* Eye Selection for Existing Patient */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t('screeningEye')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setEye('Right')}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left cursor-pointer ${
                        eye === 'Right'
                          ? 'border-teal-600 bg-teal-50/80 text-teal-950 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${eye === 'Right' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        OD
                      </div>
                      <div>
                        <div className="font-bold text-xs">{t('rightEye')}</div>
                        <div className="text-[11px] text-slate-500">Oculus Dexter</div>
                      </div>
                      {eye === 'Right' && <CheckCircle2 className="w-4 h-4 text-teal-600 ml-auto" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEye('Left')}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left cursor-pointer ${
                        eye === 'Left'
                          ? 'border-teal-600 bg-teal-50/80 text-teal-950 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${eye === 'Left' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        OS
                      </div>
                      <div>
                        <div className="font-bold text-xs">{t('leftEye')}</div>
                        <div className="text-[11px] text-slate-500">Oculus Sinister</div>
                      </div>
                      {eye === 'Left' && <CheckCircle2 className="w-4 h-4 text-teal-600 ml-auto" />}
                    </button>
                  </div>
                </div>

                {/* Continue button for existing patient */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedExistingPatient(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Clear Selection
                  </button>

                  <button
                    type="button"
                    onClick={handleContinue}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer"
                  >
                    <span>Proceed with {selectedExistingPatient.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
