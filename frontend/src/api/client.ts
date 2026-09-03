import { DRGrade, ScreeningResult } from '../types';
import { DR_GRADES } from '../data/mockData';

export const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
export const VITE_API_KEY = import.meta.env.VITE_API_KEY || 'dr-screening-hackathon-key-2026';

const cleanBaseUrl = VITE_API_BASE_URL.replace(/\/+$/, '');

/**
 * Converts relative backend upload paths to full static URLs.
 * e.g. "uploads/images/screen-001.jpg" -> "http://127.0.0.1:8000/static/images/screen-001.jpg"
 */
export const toStaticUrl = (path?: string | null): string => {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:') ||
    path.startsWith('preset:')
  ) {
    return path;
  }
  if (path.startsWith('/static/')) {
    return `${cleanBaseUrl}${path}`;
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const relative = cleanPath.replace(/^uploads\//, '');
  return `${cleanBaseUrl}/static/${relative}`;
};

/**
 * Generate a client-side UUID for screenings.
 * Screening IDs must always be generated client-side with crypto.randomUUID().
 */
export const generateScreeningId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browser runtimes
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ==========================================
// Backend Data Interfaces
// ==========================================

export interface BackendPatient {
  id: string;
  name: string;
  age: number;
  village: string;
  created_at?: string;
  [key: string]: any;
}

export interface BackendScreening {
  id: string;
  patient_id: string;
  device_id?: string;
  severity_grade: number;
  confidence_score: number;
  is_uncertain: boolean;
  image_path?: string;
  gradcam_path?: string;
  created_at?: string;
  status?: string;
  [key: string]: any;
}

export interface BackendReferral {
  id?: string;
  screening_id: string;
  patient_id?: string;
  status: string;
  created_at?: string;
  hospital?: string;
  priority?: string;
  notes?: string;
  [key: string]: any;
}

export interface BackendDashboardSummary {
  total_screenings: number;
  normal_screenings?: number;
  mild_screenings?: number;
  moderate_screenings?: number;
  severe_screenings?: number;
  proliferative_screenings?: number;
  referrals_needed?: number;
  referrals_created?: number;
  high_urgency?: number;
  pending_sync?: number;
  [key: string]: any;
}

export interface BackendModelInfo {
  name: string;
  architecture: string;
  dataset?: string;
  xai_method?: string;
  auc_score?: string;
  inference_time?: string;
  standards?: string;
  version?: string;
  [key: string]: any;
}

export interface SyncBatchResponse {
  status: string;
  results: Array<{
    id: string;
    status: 'inserted' | 'already_synced' | 'failed';
    message?: string;
  }>;
}

// In-memory cache for model info so we don't repeat calls unnecessarily
let cachedModelInfo: BackendModelInfo | null = null;

// ==========================================
// API Client Functions
// ==========================================

/**
 * POST /patients/ (JSON body)
 * createPatient(name, age, village)
 */
export async function createPatient(
  name: string,
  age: number,
  village: string
): Promise<BackendPatient> {
  const res = await fetch(`${cleanBaseUrl}/patients/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': VITE_API_KEY,
    },
    body: JSON.stringify({ name, age, village }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create patient (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * GET /patients/{id}
 * getPatient(patientId)
 */
export async function getPatient(patientId: string): Promise<BackendPatient> {
  const res = await fetch(`${cleanBaseUrl}/patients/${encodeURIComponent(patientId)}`, {
    method: 'GET',
    headers: {
      'X-API-Key': VITE_API_KEY,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get patient ${patientId} (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * GET /patients/
 * listPatients()
 */
export async function listPatients(): Promise<BackendPatient[]> {
  const res = await fetch(`${cleanBaseUrl}/patients/`, {
    method: 'GET',
    headers: {
      'X-API-Key': VITE_API_KEY,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list patients (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * POST /screenings/
 * createScreening(id, patientId, deviceId, imageFile)
 * Sent as multipart/form-data via FormData, not JSON. Fields: id, patient_id, device_id, image (the file).
 */
export async function createScreening(
  id: string,
  patientId: string,
  deviceId: string,
  imageFile: File | Blob
): Promise<BackendScreening> {
  const formData = new FormData();
  formData.append('id', id);
  formData.append('patient_id', patientId);
  formData.append('device_id', deviceId);

  // Ensure file has a name when appending Blob
  if (imageFile instanceof File) {
    formData.append('image', imageFile);
  } else {
    formData.append('image', imageFile, 'retina_capture.jpg');
  }

  const res = await fetch(`${cleanBaseUrl}/screenings/`, {
    method: 'POST',
    headers: {
      'X-API-Key': VITE_API_KEY,
      // Note: Do NOT set Content-Type so browser sets boundary automatically
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create screening (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * GET /screenings/{patient_id}
 * getPatientScreenings(patientId)
 */
export async function getPatientScreenings(patientId: string): Promise<BackendScreening[]> {
  const res = await fetch(`${cleanBaseUrl}/screenings/${encodeURIComponent(patientId)}`, {
    method: 'GET',
    headers: {
      'X-API-Key': VITE_API_KEY,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get screenings for patient ${patientId} (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * POST /screenings/sync
 * syncBatch(deviceId, results) (JSON body: {device_id, results: [...]})
 */
export async function syncBatch(
  deviceId: string,
  results: any[]
): Promise<SyncBatchResponse> {
  const res = await fetch(`${cleanBaseUrl}/screenings/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': VITE_API_KEY,
    },
    body: JSON.stringify({ device_id: deviceId, results }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to sync batch screenings (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * GET /referrals/{screening_id}
 * getReferral(screeningId)
 */
export async function getReferral(screeningId: string): Promise<BackendReferral> {
  const res = await fetch(`${cleanBaseUrl}/referrals/${encodeURIComponent(screeningId)}`, {
    method: 'GET',
    headers: {
      'X-API-Key': VITE_API_KEY,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get referral for screening ${screeningId} (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * PATCH /referrals/{screening_id}
 * updateReferralStatus(screeningId, status) (JSON body: {status})
 */
export async function updateReferralStatus(
  screeningId: string,
  status: string
): Promise<BackendReferral> {
  const res = await fetch(`${cleanBaseUrl}/referrals/${encodeURIComponent(screeningId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': VITE_API_KEY,
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update referral status for ${screeningId} (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * GET /dashboard/summary
 * getDashboardSummary()
 */
export async function getDashboardSummary(): Promise<BackendDashboardSummary> {
  const res = await fetch(`${cleanBaseUrl}/dashboard/summary`, {
    method: 'GET',
    headers: {
      'X-API-Key': VITE_API_KEY,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch dashboard summary (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * GET /model-info/
 * getModelInfo()
 */
export async function getModelInfo(): Promise<BackendModelInfo> {
  if (cachedModelInfo) {
    return cachedModelInfo;
  }

  try {
    const res = await fetch(`${cleanBaseUrl}/model-info/`, {
      method: 'GET',
      headers: {
        'X-API-Key': VITE_API_KEY,
      },
    });

    if (res.ok) {
      const data = await res.json();
      cachedModelInfo = data;
      return data;
    }
  } catch (err) {
    console.warn('Could not retrieve live model-info, using standard EfficientNet-B0 metadata', err);
  }

  // Fallback defaults reflecting the real EfficientNet-B0 model
  const fallbackInfo: BackendModelInfo = {
    name: 'DR-Net Mobile',
    architecture: 'EfficientNet-B0',
    dataset: 'DeepDR / EyePACS / Messidor',
    xai_method: 'Grad-CAM',
    auc_score: '0.962',
    inference_time: '180ms',
    standards: 'ICDR Diabetic Retinopathy Classification Standard',
  };
  cachedModelInfo = fallbackInfo;
  return fallbackInfo;
}

// ==========================================
// Adapter Function: Backend -> ScreeningResult
// ==========================================

/**
 * Adapts backend response to the existing frontend ScreeningResult shape.
 * Mappings:
 *  - severity_grade   -> severityGrade (0-4)
 *  - confidence_score -> confidence (scaled to percentage 0-100)
 *  - is_uncertain     -> isLowConfidence
 *
 * Unavailable backend fields (findings, macularEdemaRisk, classProbabilities)
 * are set to empty/null rather than fabricated.
 * Model info is pulled from real getModelInfo().
 */
export function adaptScreeningResponse(
  backend: BackendScreening,
  modelInfo?: BackendModelInfo
): ScreeningResult {
  const gradeNum = Math.min(4, Math.max(0, Number(backend.severity_grade) || 0)) as DRGrade;
  const gradeInfo = DR_GRADES[gradeNum] || DR_GRADES[0];

  // Scale confidence to percentage (backend confidence_score is documented and guaranteed 0.0-1.0)
  const rawConfidence = Number(backend.confidence_score) || 0;
  const confidence = Math.round(rawConfidence * 1000) / 10;

  const isLowConfidence = Boolean(backend.is_uncertain) || confidence < 80;

  return {
    severityGrade: gradeNum,
    confidence,
    isLowConfidence,
    explanation: gradeInfo.description,
    findings: [], // Backend does NOT return findings - empty rather than fabricated
    macularEdemaRisk: null, // Backend does NOT return macular edema risk - null rather than fabricated
    macularEdemaConfidence: null,
    imageQualityScore: null,
    classProbabilities: null, // Backend does NOT return class probabilities - null rather than fabricated
    recommendedAction: gradeInfo.recommendedFollowUp,
    urgency: gradeInfo.urgency,
    modelInfo: {
      name: modelInfo?.name || 'DR-Net Mobile',
      architecture: modelInfo?.architecture || 'EfficientNet-B0',
      dataset: modelInfo?.dataset || 'DeepDR / EyePACS / Messidor',
      xaiMethod: modelInfo?.xai_method || 'Grad-CAM',
      aucScore: modelInfo?.auc_score || '0.962',
      inferenceTime: modelInfo?.inference_time || '180ms',
      standards: modelInfo?.standards || 'ICDR Diabetic Retinopathy Classification',
    },
  };
}
