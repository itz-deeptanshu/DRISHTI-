export type DRGrade = 0 | 1 | 2 | 3 | 4;

export type Language =
  | 'en'
  | 'hi'
  | 'bn'
  | 'te'
  | 'ta'
  | 'mr'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'or'
  | 'pa';

export interface LanguageOption {
  code: Language;
  name: string;
  englishName: string;
  nativeScript: string;
  nativeName?: string;
  region: string;
}

export type LocalizedText = Record<string, string>;

export interface DRGradeInfo {
  grade: DRGrade;
  title: LocalizedText;
  shortName: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  description: LocalizedText;
  recommendedFollowUp: LocalizedText;
  urgency: 'Routine' | 'Within 6 Months' | 'Within 2-3 Months' | 'Within 2-4 Weeks' | 'Urgent (1-2 Days)';
}

export interface ScreeningFinding {
  id: string;
  label: LocalizedText;
  location: string;
  severity: 'mild' | 'moderate' | 'high';
  x: number; // percentage in image
  y: number; // percentage in image
}

export interface ClassProbability {
  grade: DRGrade;
  name: string;
  probability: number;
}

export interface ScreeningResult {
  severityGrade: DRGrade;
  confidence: number;
  isLowConfidence: boolean;
  explanation: LocalizedText;
  findings: ScreeningFinding[];
  macularEdemaRisk?: 'None' | 'Mild' | 'Clinically Significant' | null;
  macularEdemaConfidence?: number | null;
  imageQualityScore?: number | null;
  classProbabilities?: ClassProbability[] | null;
  recommendedAction: LocalizedText;
  urgency: 'Routine' | 'Within 6 Months' | 'Within 2-3 Months' | 'Within 2-4 Weeks' | 'Urgent (1-2 Days)';
  modelInfo: {
    name: string;
    architecture: string;
    dataset: string;
    xaiMethod: string;
    aucScore: string;
    inferenceTime: string;
    standards?: string;
  };
}

export interface ReferralReportData {
  referralId: string;
  referralDate: string;
  patientId: string;
  patientName: string;
  age: number | string;
  gender: string;
  eye: 'Left' | 'Right';
  screenedAt: string;
  severityGrade: DRGrade;
  primaryConfidence: number;
  classProbabilities?: ClassProbability[] | null;
  macularEdemaRisk?: 'None' | 'Mild' | 'Clinically Significant' | null;
  macularEdemaConfidence?: number | null;
  imageQualityScore?: number | null;
  referralHospital: string;
  referralPriority: 'Normal' | 'High' | 'Emergency';
  targetUrgency: string;
  clinicianName: string;
  facilityName: string;
  clinicalNotes?: string;
  findingsCount: number;
  findingsSummary?: string;
  recommendedProcedures: string[];
}

export interface PatientScreening {
  id: string;
  patientId: string;
  patientName?: string;
  age: number;
  gender?: 'Male' | 'Female' | 'Other';
  village?: string;
  eye: 'Left' | 'Right';
  screenedAt: string;
  imageUrl: string;
  presetKey?: string;
  result: ScreeningResult;
  referralStatus: 'not_referred' | 'referral_created';
  referralHospital?: string;
  referralPriority?: 'Normal' | 'High' | 'Emergency';
  notes?: string;
  screeningId?: string;
  referralId?: string;
  syncStatus?: 'synced' | 'pending';
  backendStatus?: 'referred' | 'scheduled' | 'completed' | 'cancelled';
}

export interface QualityCheckResult {
  brightness: 'pass' | 'fail';
  sharpness: 'pass' | 'fail';
  position: 'pass' | 'fail';
  overall: boolean;
  message?: string;
}

export type UserRole = 'doctor' | 'patient';

export interface DoctorUser {
  id: string;
  role: 'doctor';
  name: string;
  email: string;
  registrationNumber: string;
  specialization: string;
  facilityName: string;
  department: string;
  experienceYears?: number;
  phone?: string;
  avatarInitials?: string;
}

export interface PatientUser {
  id: string;
  role: 'patient';
  name: string;
  patientId: string;
  abhaId: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  diabetesDuration?: string;
  lastHbA1c?: string;
  bloodPressure?: string;
  primaryCenter?: string;
}

export type AuthUser = DoctorUser | PatientUser;
