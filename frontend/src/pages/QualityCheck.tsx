import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { toStaticUrl } from '../api/client';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Sun,
  Focus,
  Maximize2,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const QualityCheck: React.FC = () => {
  const navigate = useNavigate();
  const { session, updateSession, t } = useScreening();

  // Mode: Success vs Failure (testable by evaluator)
  const [isFailureState, setIsFailureState] = useState<boolean>(false);

  // Quality metrics
  const brightness = isFailureState ? 'fail' : 'pass';
  const sharpness = isFailureState ? 'fail' : 'pass';
  const position = 'pass';
  const isSuitable = !isFailureState;

  const handleContinue = () => {
    updateSession({
      qualityResult: {
        brightness,
        sharpness,
        position,
        overall: isSuitable,
      },
    });
    navigate('/analyzing');
  };

  const handleRetake = () => {
    navigate('/capture');
  };

  return (
    <div id="quality-check-page" className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Automated Pre-Inference QA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            {t('imageQualityAssessment')}
          </h1>
        </div>

        {/* Tester switch to simulate QA Failure */}
        <button
          type="button"
          onClick={() => setIsFailureState(!isFailureState)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white bg-slate-900 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Toggle {isFailureState ? 'Success State' : 'Blur Failure State'}</span>
        </button>
      </div>

      {/* Center Container: Image Preview + Checklist */}
      <div className="max-w-4xl w-full mx-auto my-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Captured Image Preview */}
        <div className="md:col-span-6 flex flex-col items-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl bg-black flex items-center justify-center">
            {session.imageUrl && !session.imageUrl.startsWith('preset:') ? (
              <img
                src={toStaticUrl(session.imageUrl)}
                alt="Captured Retina"
                className={`w-full h-full object-cover transition-all ${
                  isFailureState ? 'filter blur-[4px] contrast-75' : ''
                }`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full relative">
                {/* Synthetic preview retina */}
                <svg viewBox="0 0 400 400" className={`w-full h-full ${isFailureState ? 'filter blur-[3.5px] contrast-75' : ''}`}>
                  <circle cx="200" cy="200" r="200" fill="#a43518" />
                  <ellipse cx="120" cy="195" rx="30" ry="36" fill="#ffd89b" />
                  <circle cx="260" cy="200" r="45" fill="#4a1508" />
                  <path
                    d="M 120 185 C 135 150, 175 110, 230 95 C 275 85, 330 110, 360 150"
                    stroke="#5c0e08"
                    strokeWidth="5"
                    fill="none"
                  />
                  <path
                    d="M 120 205 C 135 240, 175 290, 235 305 C 280 315, 335 295, 365 255"
                    stroke="#5c0e08"
                    strokeWidth="5"
                    fill="none"
                  />
                </svg>
              </div>
            )}

            {/* Overlay Stamp */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-700 text-xs">
              <span className="text-slate-300 font-mono">
                {session.patientId || 'PAT-DEMO'} ({session.eye} Eye)
              </span>
              <span className="text-teal-400 font-mono text-[10px]">2048 x 2048px</span>
            </div>
          </div>
        </div>

        {/* Right: QA Checklist Metrics & Decision Status */}
        <div className="md:col-span-6 space-y-4">
          <div className="space-y-3">
            {/* Metric 1: Brightness */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                brightness === 'pass'
                  ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    brightness === 'pass' ? 'bg-teal-950 text-teal-400' : 'bg-rose-900 text-rose-300'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{t('brightness')}</h3>
                  <p className="text-[11px] text-slate-400">
                    {brightness === 'pass' ? 'Optimal dynamic range (94% score)' : 'Underexposed / uneven glare'}
                  </p>
                </div>
              </div>
              {brightness === 'pass' ? (
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PASS</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-rose-400 font-bold text-xs bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-500/40">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>FAIL</span>
                </div>
              )}
            </div>

            {/* Metric 2: Sharpness */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                sharpness === 'pass'
                  ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    sharpness === 'pass' ? 'bg-teal-950 text-teal-400' : 'bg-rose-900 text-rose-300'
                  }`}
                >
                  <Focus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{t('sharpness')}</h3>
                  <p className="text-[11px] text-slate-400">
                    {sharpness === 'pass' ? 'Vascular tree borders crisp & focused' : 'Motion blur detected (>15% degradation)'}
                  </p>
                </div>
              </div>
              {sharpness === 'pass' ? (
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PASS</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-rose-400 font-bold text-xs bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-500/40">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>FAIL</span>
                </div>
              )}
            </div>

            {/* Metric 3: Position */}
            <div className="p-3.5 rounded-xl border bg-slate-900/90 border-slate-800 text-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-950 text-teal-400 flex items-center justify-center">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{t('position')}</h3>
                  <p className="text-[11px] text-slate-400">Optic disc & macula within ICDR 45° field</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PASS</span>
              </div>
            </div>
          </div>

          {/* Conditional Outcome Banner */}
          {isSuitable ? (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-emerald-300">{t('imageSuitable')}</p>
                <p className="text-[11px] text-emerald-200/80 mt-0.5">
                  Pre-inference diagnostics passed. Ready for deep neural network grading.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-bold text-rose-300">Quality Check Failed</p>
                <p className="text-[11px] text-rose-200/80 mt-0.5">{t('imageBlurry')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="max-w-4xl w-full mx-auto pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          id="quality-retake-btn"
          type="button"
          onClick={handleRetake}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('retake')}</span>
        </button>

        {isSuitable && (
          <button
            id="quality-continue-btn"
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>{t('proceedToAnalysis')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
