import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  PatientScreening,
  QualityCheckResult,
  ScreeningResult,
  UserRole,
  DoctorUser,
  PatientUser,
  AuthUser,
} from '../types';
import {
  INITIAL_HISTORY,
  SAMPLE_PRESETS,
  AI_MODEL_METADATA,
  TRANSLATIONS,
} from '../data/mockData';
import { DEMO_DOCTORS, DEMO_PATIENTS } from '../data/authData';
import { syncBatch, updateReferralStatus } from '../api/client';

interface SessionData {
  patientId: string;
  patientName: string;
  age: number | string;
  gender: 'Male' | 'Female' | 'Other';
  village?: string;
  eye: 'Left' | 'Right';
  imageUrl: string;
  imageFile?: File | Blob | null;
  screeningId?: string;
  referralId?: string;
  backendReferralStatus?: string;
  gradcamUrl?: string;
  presetKey: string;
  qualityResult: QualityCheckResult;
  result: ScreeningResult | null;
  referralStatus: 'not_referred' | 'referral_created' | string;
  referralHospital: string;
  referralPriority: 'Normal' | 'High' | 'Emergency';
  notes: string;
}

const DEFAULT_SESSION: SessionData = {
  patientId: '',
  patientName: '',
  age: '',
  gender: 'Female',
  village: '',
  eye: 'Right',
  imageUrl: 'preset:sample-moderate',
  imageFile: null,
  screeningId: undefined,
  gradcamUrl: undefined,
  presetKey: 'sample-moderate',
  qualityResult: {
    brightness: 'pass',
    sharpness: 'pass',
    position: 'pass',
    overall: true,
  },
  result: null,
  referralStatus: 'not_referred',
  referralHospital: 'Regional Institute of Ophthalmology, Apex Center',
  referralPriority: 'High',
  notes: '',
};

interface ScreeningContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS.en) => string;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  toggleOnlineStatus: () => void;
  currentUser: AuthUser | null;
  userRole: UserRole;
  loginDoctor: (doctor: DoctorUser) => void;
  loginPatient: (patient: PatientUser) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  availableDoctors: DoctorUser[];
  availablePatients: PatientUser[];
  clinicianName: string;
  setClinicianName: (name: string) => void;
  facilityName: string;
  setFacilityName: (name: string) => void;
  session: SessionData;
  updateSession: (partial: Partial<SessionData>) => void;
  resetSession: () => void;
  loadPreset: (presetId: string) => void;
  history: PatientScreening[];
  saveCurrentScreening: () => PatientScreening;
  updateHistoryReferral: (
    id: string,
    status: 'not_referred' | 'referral_created',
    hospital?: string,
    notes?: string,
    patchBackend?: boolean,
    backendStatus?: 'referred' | 'scheduled' | 'completed' | 'cancelled'
  ) => Promise<void>;
  updateReferralWorkflowStatus: (
    id: string,
    workflowStatus: 'referred' | 'scheduled' | 'completed' | 'cancelled'
  ) => Promise<void>;
  syncQueueWithBackend: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
  clearAllData: () => void;
  resetToMockDefaults: () => void;
  activeScreeningId: string | null;
  setActiveScreeningId: (id: string | null) => void;
}

const ScreeningContext = createContext<ScreeningContextType | undefined>(undefined);

export const ScreeningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem('dr_current_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error('Failed to parse user from storage', e);
      }
    }
    // Default to first demo doctor
    return DEMO_DOCTORS[0];
  });

  const userRole: UserRole = currentUser?.role || 'doctor';

  const [clinicianName, setClinicianName] = useState<string>(() => {
    if (currentUser?.role === 'doctor') return currentUser.name;
    return DEMO_DOCTORS[0].name;
  });

  const [facilityName, setFacilityName] = useState<string>(() => {
    if (currentUser?.role === 'doctor') return currentUser.facilityName;
    return DEMO_DOCTORS[0].facilityName;
  });

  const [session, setSession] = useState<SessionData>(DEFAULT_SESSION);
  const [history, setHistory] = useState<PatientScreening[]>(() => {
    const saved = localStorage.getItem('dr_screening_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse history from storage', e);
      }
    }
    return INITIAL_HISTORY;
  });
  const [activeScreeningId, setActiveScreeningId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('dr_screening_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dr_current_user', JSON.stringify(currentUser));
      if (currentUser.role === 'doctor') {
        setClinicianName(currentUser.name);
        setFacilityName(currentUser.facilityName);
      }
    } else {
      localStorage.removeItem('dr_current_user');
    }
  }, [currentUser]);

  const loginDoctor = (doctor: DoctorUser) => {
    setCurrentUser(doctor);
    setClinicianName(doctor.name);
    setFacilityName(doctor.facilityName);
  };

  const loginPatient = (patient: PatientUser) => {
    setCurrentUser(patient);
    // Pre-populate session with patient's demographics for convenience
    setSession((prev) => ({
      ...prev,
      patientId: patient.patientId,
      patientName: patient.name,
      age: patient.age,
      gender: patient.gender,
    }));
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (targetRole: UserRole) => {
    if (targetRole === 'doctor') {
      loginDoctor(DEMO_DOCTORS[0]);
    } else {
      loginPatient(DEMO_PATIENTS[0]);
    }
  };

  const toggleOnlineStatus = () => setIsOnline((prev) => !prev);

  const t = (key: keyof typeof TRANSLATIONS.en): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || key;
  };

  const updateSession = (partial: Partial<SessionData>) => {
    setSession((prev) => ({ ...prev, ...partial }));
  };

  const resetSession = () => {
    setSession(DEFAULT_SESSION);
  };

  const loadPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId) || SAMPLE_PRESETS[0];
    const generatedResult: ScreeningResult = {
      severityGrade: preset.grade,
      confidence: preset.confidence,
      isLowConfidence: preset.isLowConfidence,
      explanation: preset.explanation,
      findings: preset.findings,
      macularEdemaRisk: preset.macularEdemaRisk,
      recommendedAction: preset.recommendedAction,
      urgency: preset.urgency,
      modelInfo: AI_MODEL_METADATA,
    };

    setSession((prev) => ({
      ...prev,
      patientId: prev.patientId || '',
      patientName: prev.patientName || preset.patientName,
      age: prev.age || preset.defaultAge,
      eye: prev.eye || preset.defaultEye,
      imageUrl: `preset:${preset.id}`,
      presetKey: preset.id,
      result: generatedResult,
      referralStatus: preset.grade >= 3 ? 'referral_created' : 'not_referred',
      referralPriority: preset.grade === 4 ? 'Emergency' : preset.grade >= 3 ? 'High' : 'Normal',
    }));
  };

  const saveCurrentScreening = (): PatientScreening => {
    const newId = `scr-${Date.now()}`;
    const grade = session.result?.severityGrade ?? 2;
    
    // Ensure we have a valid result
    const resultToSave: ScreeningResult = session.result || {
      severityGrade: 2,
      confidence: 94.2,
      isLowConfidence: false,
      explanation: {
        en: 'Explainability heat map highlights localized gradient activations corresponding to focal microaneurysms and hard exudates.',
        hi: 'एक्सप्लेनेबिलिटी हीट मैप फोकल माइक्रोएन्यूरिज्म और हार्ड एक्सयूडेट्स को रेखांकित करता है।',
      },
      findings: SAMPLE_PRESETS[0].findings,
      macularEdemaRisk: 'Mild',
      recommendedAction: SAMPLE_PRESETS[0].recommendedAction,
      urgency: 'Within 2-3 Months',
      modelInfo: AI_MODEL_METADATA,
    };

    const newRecord: PatientScreening = {
      id: newId,
      patientId: session.patientId || '',
      patientName: session.patientName || 'Anonymous Patient',
      age: typeof session.age === 'number' ? session.age : parseInt(session.age as string, 10) || 55,
      gender: session.gender,
      village: session.village,
      eye: session.eye,
      screenedAt: new Date().toISOString(),
      imageUrl: session.imageUrl || 'preset:sample-moderate',
      presetKey: session.presetKey || 'sample-moderate',
      result: resultToSave,
      referralStatus: session.referralStatus as any,
      referralHospital: session.referralHospital,
      referralPriority: session.referralPriority,
      notes: session.notes,
      screeningId: session.screeningId,
      referralId: session.referralId,
      backendStatus: (session.backendReferralStatus as any) || (session.referralStatus === 'referral_created' ? 'referred' : 'screened'),
      syncStatus: session.screeningId ? 'synced' : 'pending',
    };

    setHistory((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const updateHistoryReferral = async (
    id: string,
    status: 'not_referred' | 'referral_created',
    hospital?: string,
    notes?: string,
    patchBackend: boolean = true,
    backendStatus?: 'referred' | 'scheduled' | 'completed' | 'cancelled'
  ): Promise<void> => {
    // 1. Optimistically update local state & cache
    const targetItem = history.find((h) => h.id === id);
    const resolvedBackendStatus = backendStatus || (status === 'referral_created' ? 'referred' : 'cancelled');

    setHistory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            referralStatus: status,
            referralHospital: hospital || item.referralHospital,
            notes: notes !== undefined ? notes : item.notes,
            backendStatus: resolvedBackendStatus,
          };
        }
        return item;
      })
    );

    // 2. If screening has a backend ID and network is online, invoke PATCH /referrals/{screening_id}
    const targetScreeningId = targetItem?.screeningId || id;
    if (patchBackend && isOnline && targetScreeningId) {
      try {
        await updateReferralStatus(targetScreeningId, resolvedBackendStatus);
      } catch (err) {
        console.warn(`[Offline Mode] Backend referral PATCH deferred for ${targetScreeningId}:`, err);
      }
    }
  };

  const updateReferralWorkflowStatus = async (
    id: string,
    workflowStatus: 'referred' | 'scheduled' | 'completed' | 'cancelled'
  ): Promise<void> => {
    const targetItem = history.find((h) => h.id === id);
    const isCancelled = workflowStatus === 'cancelled';

    setHistory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            referralStatus: isCancelled ? 'not_referred' : 'referral_created',
            backendStatus: workflowStatus,
          };
        }
        return item;
      })
    );

    const targetScreeningId = targetItem?.screeningId || id;
    if (isOnline && targetScreeningId) {
      try {
        await updateReferralStatus(targetScreeningId, workflowStatus);
      } catch (err) {
        console.warn(`[Offline Mode] Backend referral PATCH deferred for ${targetScreeningId}:`, err);
      }
    }
  };

  const syncQueueWithBackend = async (): Promise<{ success: boolean; syncedCount: number; message: string }> => {
    const unsyncedItems = history.filter((h) => h.syncStatus === 'pending' || !h.screeningId);
    
    // Prepare payload formatted for POST /screenings/sync
    const payloadResults = (unsyncedItems.length > 0 ? unsyncedItems : history.slice(0, 5)).map((item) => ({
      patient_id: item.patientId,
      device_id: 'DEV-EDGE-PHC-01',
      severity_grade: item.result.severityGrade,
      confidence_score: item.result.confidence,
      is_uncertain: item.result.isLowConfidence || false,
      timestamp: item.screenedAt,
      metadata: {
        eye: item.eye,
        macular_edema: item.result.macularEdemaRisk,
        image_quality: item.result.imageQualityScore || 95.0,
        village: item.village,
      },
    }));

    if (payloadResults.length === 0) {
      return { success: true, syncedCount: 0, message: 'All screening records are already synchronized.' };
    }

    try {
      const response = await syncBatch('DEV-EDGE-PHC-01', payloadResults);
      
      // Calculate count of successfully synced items
      const insertedCount = response.results?.filter((r) => r.status === 'inserted' || r.status === 'already_synced').length ?? payloadResults.length;

      // Mark local items as synced
      setHistory((prev) =>
        prev.map((item) => ({
          ...item,
          syncStatus: 'synced',
        }))
      );

      return {
        success: true,
        syncedCount: insertedCount,
        message: `Successfully synchronized ${insertedCount} edge screening record(s) to central hospital registry.`,
      };
    } catch (err: any) {
      return {
        success: false,
        syncedCount: 0,
        message: err.message || 'Failed to reach cloud backend. Queued in local edge memory.',
      };
    }
  };

  const clearAllData = () => {
    setHistory([]);
    resetSession();
    localStorage.removeItem('dr_screening_history');
  };

  const resetToMockDefaults = () => {
    setHistory(INITIAL_HISTORY);
    resetSession();
    localStorage.setItem('dr_screening_history', JSON.stringify(INITIAL_HISTORY));
  };

  return (
    <ScreeningContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isOnline,
        setIsOnline,
        toggleOnlineStatus,
        currentUser,
        userRole,
        loginDoctor,
        loginPatient,
        logout,
        switchRole,
        availableDoctors: DEMO_DOCTORS,
        availablePatients: DEMO_PATIENTS,
        clinicianName,
        setClinicianName,
        facilityName,
        setFacilityName,
        session,
        updateSession,
        resetSession,
        loadPreset,
        history,
        saveCurrentScreening,
        updateHistoryReferral,
        updateReferralWorkflowStatus,
        syncQueueWithBackend,
        clearAllData,
        resetToMockDefaults,
        activeScreeningId,
        setActiveScreeningId,
      }}
    >
      {children}
    </ScreeningContext.Provider>
  );
};

export const useScreening = (): ScreeningContextType => {
  const context = useContext(ScreeningContext);
  if (!context) {
    throw new Error('useScreening must be used within a ScreeningProvider');
  }
  return context;
};
