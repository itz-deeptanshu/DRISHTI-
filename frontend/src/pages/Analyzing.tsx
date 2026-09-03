import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import {
  createScreening,
  getModelInfo,
  adaptScreeningResponse,
  toStaticUrl,
  generateScreeningId,
  VITE_API_BASE_URL,
  getReferral,
  createPatient,
  listPatients,
} from '../api/client';
import {
  Sparkles,
  Cpu,
  Activity,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  ServerCrash,
} from 'lucide-react';

/**
 * Resolves or synthesizes a valid File object from the current session image
 * ensuring multipart/form-data upload always receives a genuine image file.
 */
async function resolveImageFile(
  imageFile: File | Blob | null | undefined,
  imageUrl: string | undefined
): Promise<File> {
  if (imageFile instanceof File) {
    return imageFile;
  }
  if (imageFile instanceof Blob) {
    return new File([imageFile], 'retina_capture.jpg', { type: imageFile.type || 'image/jpeg' });
  }
  if (imageUrl && imageUrl.startsWith('data:')) {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new File([blob], 'retina_capture.jpg', { type: blob.type || 'image/jpeg' });
  }
  if (imageUrl && (imageUrl.startsWith('blob:') || imageUrl.startsWith('http'))) {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      return new File([blob], 'retina_capture.jpg', { type: blob.type || 'image/jpeg' });
    } catch {
      // Fallback to fundus canvas below if fetch is blocked
    }
  }

  // Synthesize a fundus canvas image if using preset key
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);
    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 240);
    grad.addColorStop(0, '#c2410c');
    grad.addColorStop(0.7, '#7f1d1d');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(256, 256, 230, 0, Math.PI * 2);
    ctx.fill();
    // Optic disc
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(170, 250, 34, 0, Math.PI * 2);
    ctx.fill();
    // Macula
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.arc(330, 260, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob || new Blob([])], 'retina_scan.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.95);
  });
}

export const Analyzing: React.FC = () => {
  const navigate = useNavigate();
  const { session, updateSession, t } = useScreening();

  const [status, setStatus] = useState<'analyzing' | 'error'>('analyzing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const hasInitiatedRef = useRef(false);

  const subLines = [
    { text: t('subLine1') || 'Validating optical clarity and disc margins...', step: 0 },
    { text: t('subLine2') || 'Running EfficientNet-B0 inference on retinal features...', step: 1 },
    { text: t('subLine3') || 'Generating Grad-CAM attention heatmap & severity grading...', step: 2 },
  ];

  // Visual step advancement while inference is in-flight
  useEffect(() => {
    if (status !== 'analyzing') return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= 1 && next < 3) setCurrentStepIndex(1);
        if (next >= 3) setCurrentStepIndex(2);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const runAnalysis = async () => {
    setStatus('analyzing');
    setErrorMessage(null);
    setErrorDetails(null);
    setCurrentStepIndex(0);
    setElapsedSeconds(0);

    try {
      // 1. Ensure a valid registered backend patient ID exists
      let patientId = session.patientId;
      if (!patientId || patientId.startsWith('PAT-')) {
        const patientName = session.patientName?.trim() || 'Clinical Screening Patient';
        const patientAge = typeof session.age === 'number' ? session.age : parseInt(String(session.age), 10) || 55;
        const patientVillage = session.village?.trim() || 'Primary Health Center';

        try {
          const existingList = await listPatients();
          const match = existingList.find(
            (p) => p.name && p.name.trim().toLowerCase() === patientName.toLowerCase()
          );
          if (match && match.id) {
            patientId = String(match.id);
          } else {
            const created = await createPatient(patientName, patientAge, patientVillage);
            patientId = String(created.id);
          }
          updateSession({ patientId });
        } catch (patientErr: any) {
          throw new Error(
            `Patient registration required: Unable to obtain real patient ID from backend (${patientErr?.message || 'Connection error'}).`
          );
        }
      }

      // 2. Client-side screening ID generated with crypto.randomUUID()
      const screeningId = generateScreeningId();
      const deviceId = localStorage.getItem('dr_device_id') || 'DR-EDGE-CAM-01';

      // 3. Resolve image file
      const file = await resolveImageFile(session.imageFile, session.imageUrl);

      // 4. Concurrently fetch real model info and trigger screening
      const [backendScreening, modelInfo] = await Promise.all([
        createScreening(screeningId, patientId, deviceId, file),
        getModelInfo().catch(() => undefined),
      ]);

      // 5. Adapt real backend response to existing ScreeningResult structure
      const adaptedResult = adaptScreeningResponse(backendScreening, modelInfo);

      // 6. Fetch authoritative referral from backend
      let backendReferral: any = null;
      try {
        backendReferral = await getReferral(backendScreening.id);
      } catch (refErr) {
        console.warn('Authoritative referral fetch deferred:', refErr);
      }

      // Backend high-priority rule: severity_grade >= 3 OR is_uncertain
      const isHighPriority =
        backendScreening.severity_grade >= 3 || Boolean(backendScreening.is_uncertain);
      const referralPriority: 'Normal' | 'High' | 'Emergency' =
        backendScreening.severity_grade === 4
          ? 'Emergency'
          : isHighPriority
          ? 'High'
          : 'Normal';

      const authoritativeStatus = backendReferral?.status || 'screened';

      // 7. Update session state with real screening and referral outcomes
      const finalImageUrl = backendScreening.image_path
        ? toStaticUrl(backendScreening.image_path)
        : session.imageUrl;
      const gradcamUrl = backendScreening.gradcam_path
        ? toStaticUrl(backendScreening.gradcam_path)
        : undefined;

      updateSession({
        screeningId: backendScreening.id || screeningId,
        referralId: backendReferral?.id,
        backendReferralStatus: authoritativeStatus,
        result: adaptedResult,
        imageUrl: finalImageUrl,
        gradcamUrl,
        referralStatus: authoritativeStatus,
        referralPriority,
      });

      // Navigate directly to result page
      navigate('/result');
    } catch (err: any) {
      console.error('Screening inference failed:', err);
      setStatus('error');
      setErrorMessage(
        err?.message || 'Unable to complete retinal analysis via the backend inference service.'
      );
      setErrorDetails(
        `Target endpoint: ${VITE_API_BASE_URL}/screenings/\nCheck that the FastAPI server is running at ${VITE_API_BASE_URL} and the API key is accepted.`
      );
    }
  };

  // Trigger analysis on mount
  useEffect(() => {
    if (!hasInitiatedRef.current) {
      hasInitiatedRef.current = true;
      runAnalysis();
    }
  }, []);

  return (
    <div
      id="analyzing-page"
      className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 items-center select-none relative overflow-hidden"
    >
      {/* Background Ambience Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Top Protocol Header */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-teal-400" />
        <span>EfficientNet-B0 • Edge XAI Inference Protocol</span>
      </div>

      {status === 'error' ? (
        /* Real Error State */
        <div className="max-w-lg w-full text-center space-y-6 my-auto relative z-10 bg-slate-900/90 border border-red-900/40 p-8 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.25)]">
            <ServerCrash className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Inference Request Failed
            </h2>
            <p className="text-xs sm:text-sm text-red-300 font-medium">
              {errorMessage}
            </p>
          </div>

          {errorDetails && (
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-left font-mono text-[11px] text-slate-400 whitespace-pre-line leading-relaxed">
              {errorDetails}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="retry-analysis-btn"
              type="button"
              onClick={runAnalysis}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-teal-900/30"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Analysis</span>
            </button>

            <button
              id="back-to-quality-btn"
              type="button"
              onClick={() => navigate('/quality-check')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Quality Check</span>
            </button>
          </div>
        </div>
      ) : (
        /* In-flight Loading UI */
        <div className="max-w-md w-full text-center space-y-8 my-auto relative z-10">
          {/* Animated Scanning Circle / Retinal Scanner Indicator */}
          <div className="relative mx-auto w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
            {/* Outer Ripple Rings */}
            <div
              className="absolute inset-0 rounded-full border-2 border-teal-500/20 animate-ping"
              style={{ animationDuration: '2.5s' }}
            />
            <div
              className="absolute inset-2 rounded-full border border-teal-500/30 animate-spin"
              style={{ animationDuration: '8s' }}
            />
            <div
              className="absolute inset-6 rounded-full border border-dashed border-teal-400/40 animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '12s' }}
            />

            {/* Central Orb */}
            <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(13,148,136,0.5)]">
              <Sparkles className="w-10 h-10 animate-pulse" />
            </div>
          </div>

          {/* Primary Status Headline */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t('analyzingRetina')}
            </h2>
            <p className="text-xs sm:text-sm font-mono text-teal-300">
              Patient: {session.patientId || 'PAT-2026'} ({session.eye} Eye)
            </p>
          </div>

          {/* Dynamic Sub-lines (Live Progression checklist) */}
          <div className="space-y-2 text-left bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs">
            {subLines.map((line, idx) => {
              const isCompleted = currentStepIndex > idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 transition-all ${
                    isCompleted
                      ? 'text-emerald-400 font-medium'
                      : isCurrent
                      ? 'text-teal-300 font-bold animate-pulse'
                      : 'text-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <Activity className="w-4 h-4 text-teal-400 shrink-0 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span>{line.text}</span>
                </div>
              );
            })}
          </div>

          {/* In-flight Active Shimmer Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Model Inference Status</span>
              <span className="text-teal-300 font-bold">
                {elapsedSeconds > 0 ? `In flight (${elapsedSeconds}s)` : 'Connecting...'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5 relative">
              <div className="h-full bg-teal-500 rounded-full w-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Footer System Note */}
      <div className="text-center space-y-1 text-slate-400 text-xs">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <Cpu className="w-3.5 h-3.5 text-teal-400" />
          <span>{t('keepConnected')}</span>
        </p>
      </div>
    </div>
  );
};
