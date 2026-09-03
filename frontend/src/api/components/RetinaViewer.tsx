import React, { useState } from 'react';
import { DRGrade, ScreeningFinding } from '../types';
import { Layers, Eye, Info, Sparkles, Sliders } from 'lucide-react';

interface RetinaViewerProps {
  grade?: DRGrade;
  findings?: ScreeningFinding[];
  isLowConfidence?: boolean;
  activeView?: 'overlay' | 'original';
  onViewChange?: (view: 'overlay' | 'original') => void;
  showControls?: boolean;
  className?: string;
  customImageSrc?: string | null;
  gradcamOverlaySrc?: string | null;
}

export const RetinaViewer: React.FC<RetinaViewerProps> = ({
  grade = 2,
  findings = [],
  isLowConfidence = false,
  activeView = 'overlay',
  onViewChange,
  showControls = true,
  className = '',
  customImageSrc = null,
  gradcamOverlaySrc = null,
}) => {
  const [internalView, setInternalView] = useState<'overlay' | 'original'>(activeView);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.75);
  const [selectedFinding, setSelectedFinding] = useState<ScreeningFinding | null>(null);
  const [showFindingsPins, setShowFindingsPins] = useState<boolean>(true);

  const currentView = onViewChange ? activeView : internalView;
  const setView = (v: 'overlay' | 'original') => {
    if (onViewChange) {
      onViewChange(v);
    } else {
      setInternalView(v);
    }
  };

  // Color theme based on grade for pathology rendering
  const isPDR = grade === 4;
  const isSevere = grade === 3;
  const isModerate = grade === 2;
  const isMild = grade === 1;
  const isNormal = grade === 0;

  return (
    <div id="retina-viewer-container" className={`flex flex-col rounded-2xl bg-slate-900 text-white overflow-hidden shadow-xl border border-slate-800 ${className}`}>
      {/* Header controls bar */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              id="view-toggle-overlay"
              type="button"
              onClick={() => setView('overlay')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                currentView === 'overlay'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Grad-CAM XAI</span>
            </button>
            <button
              id="view-toggle-original"
              type="button"
              onClick={() => setView('original')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                currentView === 'original'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Original Fundus</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            {currentView === 'overlay' && (
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">Opacity:</span>
                <input
                  id="heatmap-opacity-slider"
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={heatmapOpacity}
                  onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                  className="w-20 sm:w-24 accent-teal-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <span className="text-xs font-mono text-teal-300 w-8">{Math.round(heatmapOpacity * 100)}%</span>
              </div>
            )}

            <button
              id="toggle-markers-btn"
              type="button"
              onClick={() => setShowFindingsPins(!showFindingsPins)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                showFindingsPins
                  ? 'border-teal-500/50 text-teal-300 bg-teal-950/30'
                  : 'border-slate-700 text-slate-400'
              }`}
            >
              {showFindingsPins ? 'Hide Pins' : 'Show Pins'}
            </button>
          </div>
        </div>
      )}

      {/* Main Retinal Graphic Canvas View */}
      <div className="relative aspect-square w-full max-w-full bg-black flex items-center justify-center overflow-hidden select-none">
        {customImageSrc ? (
          <div className="relative w-full h-full">
            <img
              src={customImageSrc}
              alt="Patient Retina"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {currentView === 'overlay' && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{ opacity: heatmapOpacity }}
              >
                {gradcamOverlaySrc ? (
                  <img
                    src={gradcamOverlaySrc}
                    alt="Grad-CAM Heatmap"
                    className="w-full h-full object-cover mix-blend-screen"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full mix-blend-screen bg-radial from-red-500/80 via-yellow-500/40 to-transparent" />
                )}
              </div>
            )}
          </div>
        ) : (
          /* High-Fidelity Synthesized Clinical Fundus SVG */
          <svg
            viewBox="0 0 500 500"
            className="w-full h-full max-w-[480px] max-h-[480px] drop-shadow-2xl"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Fundus Background Sphere Gradient */}
              <radialGradient id="fundusBg" cx="48%" cy="50%" r="52%">
                <stop offset="0%" stopColor="#c84d28" />
                <stop offset="45%" stopColor="#a43518" />
                <stop offset="80%" stopColor="#75220d" />
                <stop offset="100%" stopColor="#3d1006" />
              </radialGradient>

              {/* Optic Disc Gradient */}
              <radialGradient id="opticDisc" cx="45%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#fff8e7" />
                <stop offset="35%" stopColor="#ffd89b" />
                <stop offset="70%" stopColor="#f5a34e" />
                <stop offset="100%" stopColor="#d96a24" />
              </radialGradient>

              {/* Physiological Cup Gradient */}
              <radialGradient id="opticCup" cx="48%" cy="48%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#ffebb3" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f5a34e" stopOpacity="0.1" />
              </radialGradient>

              {/* Macula Gradient */}
              <radialGradient id="maculaGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#4a1508" />
                <stop offset="30%" stopColor="#661c0c" />
                <stop offset="70%" stopColor="#8d2a13" />
                <stop offset="100%" stopColor="#a43518" stopOpacity="0" />
              </radialGradient>

              {/* Foveal Reflex Dot */}
              <radialGradient id="foveaDot" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffdd99" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#661c0c" stopOpacity="0" />
              </radialGradient>

              {/* XAI Grad-CAM Heatmap Radial Gradients */}
              <radialGradient id="hotspotPDR" cx="30%" cy="48%" r="40%">
                <stop offset="0%" stopColor="#ff0000" stopOpacity="0.95" />
                <stop offset="25%" stopColor="#ff4500" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#ffd700" stopOpacity="0.6" />
                <stop offset="75%" stopColor="#00ffff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0000ff" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="hotspotExudates" cx="62%" cy="56%" r="35%">
                <stop offset="0%" stopColor="#ff1a1a" stopOpacity="0.9" />
                <stop offset="30%" stopColor="#ff8c00" stopOpacity="0.7" />
                <stop offset="60%" stopColor="#ffff00" stopOpacity="0.45" />
                <stop offset="85%" stopColor="#00e5ff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0022ff" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="hotspotSuperior" cx="40%" cy="38%" r="30%">
                <stop offset="0%" stopColor="#ff2200" stopOpacity="0.85" />
                <stop offset="35%" stopColor="#ffa500" stopOpacity="0.65" />
                <stop offset="70%" stopColor="#3cd070" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0044ff" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="diffuseGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#0066ff" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* Vignette filter */}
              <filter id="vignette">
                <feGaussianBlur stdDeviation="3" result="blur" />
              </filter>
            </defs>

            {/* Circular Fundus Aperture Mask */}
            <clipPath id="fundusMask">
              <circle cx="250" cy="250" r="236" />
            </clipPath>

            <g clipPath="url(#fundusMask)">
              {/* Outer boundary shadow */}
              <circle cx="250" cy="250" r="236" fill="#150502" />

              {/* Base Retinal Stroma */}
              <circle cx="250" cy="250" r="236" fill="url(#fundusBg)" />

              {/* Fine Choroidal Pattern Overlay */}
              <circle cx="250" cy="250" r="236" fill="#882810" opacity="0.15" />

              {/* Macula Lutea Zone (Temporal Side) */}
              <circle cx="310" cy="252" r="62" fill="url(#maculaGrad)" />
              {/* Fovea Centralis */}
              <circle cx="310" cy="252" r="14" fill="#300d05" />
              <circle cx="310" cy="252" r="3" fill="url(#foveaDot)" />

              {/* Optic Nerve Head (Nasal Side) */}
              <g transform="translate(145, 245)">
                {/* Scleral Ring & Optic Disc */}
                <ellipse cx="0" cy="0" rx="36" ry="42" fill="url(#opticDisc)" />
                {/* Physiological Cup */}
                <ellipse cx="-2" cy="-2" rx="17" ry="20" fill="url(#opticCup)" />
                {/* Lamina Cribrosa subtle dots */}
                <circle cx="-4" cy="-2" r="1.2" fill="#d97706" opacity="0.4" />
                <circle cx="-1" cy="4" r="1.2" fill="#d97706" opacity="0.4" />
                <circle cx="2" cy="-5" r="1.2" fill="#d97706" opacity="0.4" />
              </g>

              {/* Major Retinal Blood Vessels Architecture (Arcades) */}
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                {/* Superior Temporal Vein (Darker Red, Thicker) */}
                <path
                  d="M 148 238 C 158 200, 190 145, 245 130 C 290 120, 340 140, 375 180"
                  stroke="#5c0e08"
                  strokeWidth="6"
                  opacity="0.9"
                />
                {/* Superior Temporal Artery (Brighter Red, Thinner, Central Reflex) */}
                <path
                  d="M 145 235 C 160 195, 195 152, 252 138 C 295 128, 345 148, 385 190"
                  stroke="#a81c10"
                  strokeWidth="3.8"
                />
                <path
                  d="M 145 235 C 160 195, 195 152, 252 138 C 295 128, 345 148, 385 190"
                  stroke="#ff9999"
                  strokeWidth="0.8"
                  opacity="0.6"
                />

                {/* Inferior Temporal Vein */}
                <path
                  d="M 148 252 C 160 290, 195 345, 250 365 C 295 380, 345 365, 380 325"
                  stroke="#5c0e08"
                  strokeWidth="6"
                  opacity="0.9"
                />
                {/* Inferior Temporal Artery */}
                <path
                  d="M 145 255 C 162 295, 202 338, 258 355 C 302 368, 350 352, 390 310"
                  stroke="#a81c10"
                  strokeWidth="3.8"
                />

                {/* Superior Nasal Vessels */}
                <path
                  d="M 138 235 C 115 190, 85 150, 45 125"
                  stroke="#5c0e08"
                  strokeWidth="4.5"
                />
                <path
                  d="M 136 232 C 112 188, 80 145, 40 120"
                  stroke="#b32415"
                  strokeWidth="2.8"
                />

                {/* Inferior Nasal Vessels */}
                <path
                  d="M 138 255 C 110 300, 80 345, 40 375"
                  stroke="#5c0e08"
                  strokeWidth="4.5"
                />
                <path
                  d="M 135 258 C 108 305, 75 350, 35 380"
                  stroke="#b32415"
                  strokeWidth="2.8"
                />

                {/* Secondary & Macular Arterioles */}
                <path
                  d="M 230 140 C 255 170, 280 200, 290 220"
                  stroke="#991b1b"
                  strokeWidth="1.8"
                  opacity="0.75"
                />
                <path
                  d="M 240 355 C 265 330, 285 295, 295 275"
                  stroke="#991b1b"
                  strokeWidth="1.8"
                  opacity="0.75"
                />
                <path
                  d="M 152 245 C 190 248, 240 250, 270 252"
                  stroke="#991b1b"
                  strokeWidth="1.5"
                  opacity="0.65"
                />
              </g>

              {/* Dynamic Pathological Signs based on Grade */}
              {/* 1. Microaneurysms (Red tiny dots) */}
              {(isMild || isModerate || isSevere || isPDR) && (
                <g fill="#700606">
                  <circle cx="190" cy="210" r="2.8" />
                  <circle cx="196" cy="205" r="2.2" />
                  <circle cx="215" cy="180" r="3" />
                  <circle cx="310" cy="190" r="2.5" />
                  <circle cx="330" cy="210" r="3.2" />
                  <circle cx="280" cy="330" r="2.6" />
                  <circle cx="220" cy="310" r="3.1" />
                </g>
              )}

              {/* 2. Hard Exudates (Waxy yellow lipid deposits) */}
              {(isModerate || isSevere || isPDR) && (
                <g fill="#fff6b3" stroke="#facc15" strokeWidth="0.5" opacity="0.95">
                  <path d="M 305 280 L 308 284 L 304 286 Z" />
                  <path d="M 312 288 L 316 286 L 315 292 Z" />
                  <path d="M 320 282 L 324 285 L 321 289 Z" />
                  <circle cx="326" cy="295" r="2" />
                  <circle cx="330" cy="288" r="2.5" />
                  <circle cx="335" cy="294" r="1.8" />
                  <circle cx="318" cy="300" r="2.2" />
                  {/* Circinate ring pattern */}
                  <circle cx="300" cy="290" r="1.8" />
                  <circle cx="295" cy="296" r="2.2" />
                </g>
              )}

              {/* 3. Dot & Blot Hemorrhages */}
              {(isModerate || isSevere || isPDR) && (
                <g fill="#450a0a" opacity="0.88">
                  <ellipse cx="205" cy="165" rx="5" ry="4" />
                  <ellipse cx="270" cy="160" rx="6" ry="4.5" />
                  <ellipse cx="360" cy="215" rx="7" ry="5" />
                  <ellipse cx="260" cy="335" rx="6.5" ry="5.5" />
                  <ellipse cx="340" cy="340" rx="8" ry="6" />
                </g>
              )}

              {/* 4. Cotton Wool Spots (Ischemic white-gray patches) */}
              {(isModerate || isSevere || isPDR) && (
                <g fill="#ffffff" opacity="0.5" filter="url(#vignette)">
                  <ellipse cx="260" cy="180" rx="9" ry="6" />
                  <ellipse cx="345" cy="235" rx="8" ry="7" />
                </g>
              )}

              {/* 5. Severe & PDR: Venous Beading & IRMA */}
              {(isSevere || isPDR) && (
                <g>
                  {/* Venous Beading (irregular vein pinching) */}
                  <circle cx="225" cy="138" r="5" fill="#450a0a" />
                  <circle cx="237" cy="133" r="5.5" fill="#450a0a" />
                  <circle cx="249" cy="130" r="5" fill="#450a0a" />
                  {/* IRMA (Intraretinal Microvascular Abnormalities) */}
                  <path
                    d="M 270 145 Q 278 152 284 146 T 292 154"
                    stroke="#b91c1c"
                    strokeWidth="1.8"
                    fill="none"
                  />
                  <path
                    d="M 230 360 Q 238 350 246 358 T 256 348"
                    stroke="#b91c1c"
                    strokeWidth="1.8"
                    fill="none"
                  />
                </g>
              )}

              {/* 6. Proliferative DR (PDR): Neovascularization & Vitreous Bleed */}
              {isPDR && (
                <g>
                  {/* Neovascularization at Disc (NVD) - Delicate network */}
                  <path
                    d="M 145 240 Q 155 220 162 230 T 170 215 T 160 205"
                    stroke="#e11d48"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.9"
                  />
                  <path
                    d="M 148 245 Q 165 255 158 265 T 172 268"
                    stroke="#e11d48"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.9"
                  />
                  {/* Preretinal Boat-shaped Sub-hyaloid Hemorrhage */}
                  <path
                    d="M 320 330 Q 355 330 380 350 Q 350 375 315 355 Z"
                    fill="#3b0707"
                    opacity="0.92"
                  />
                  {/* Vitreous Haze Blood Staining */}
                  <circle cx="345" cy="345" r="32" fill="#580808" opacity="0.45" />
                </g>
              )}

              {/* GRAD-CAM XAI EXPLAINABILITY OVERLAY LAYER */}
              {currentView === 'overlay' && (
                <g
                  className="transition-opacity duration-300 pointer-events-none"
                  style={{ opacity: heatmapOpacity, mixBlendMode: 'screen' }}
                >
                  {/* Low Confidence or Media opacity diffuse glow */}
                  {isLowConfidence && (
                    <circle cx="250" cy="250" r="236" fill="url(#diffuseGlow)" />
                  )}

                  {/* PDR Peak Hotspot (Over Disc Neovascularization and Vitreous Hemorrhage) */}
                  {isPDR && (
                    <>
                      <circle cx="150" cy="235" r="95" fill="url(#hotspotPDR)" />
                      <circle cx="340" cy="340" r="110" fill="url(#hotspotExudates)" />
                    </>
                  )}

                  {/* Severe & Moderate NPDR Hotspots */}
                  {(isModerate || isSevere) && (
                    <>
                      <circle cx="320" cy="285" r="95" fill="url(#hotspotExudates)" />
                      <circle cx="205" cy="180" r="75" fill="url(#hotspotSuperior)" />
                      {isSevere && (
                        <circle cx="240" cy="135" r="70" fill="url(#hotspotSuperior)" />
                      )}
                    </>
                  )}

                  {/* Mild NPDR Hotspot */}
                  {isMild && (
                    <circle cx="290" cy="310" r="65" fill="url(#hotspotSuperior)" />
                  )}

                  {/* Normal - Very mild diffuse background activation without focal peaks */}
                  {isNormal && (
                    <circle cx="250" cy="250" r="180" fill="url(#diffuseGlow)" opacity="0.5" />
                  )}
                </g>
              )}

              {/* Outer Circular Vignette Edge */}
              <circle
                cx="250"
                cy="250"
                r="236"
                fill="none"
                stroke="#000000"
                strokeWidth="12"
                opacity="0.8"
              />
            </g>
          </svg>
        )}

        {/* Interactive Lesion Pin Markers */}
        {showFindingsPins && findings && findings.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {findings.map((f) => {
              const isSelected = selectedFinding?.id === f.id;
              return (
                <div
                  key={f.id}
                  style={{ left: `${f.x}%`, top: `${f.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group z-20"
                >
                  <button
                    id={`finding-pin-${f.id}`}
                    type="button"
                    onClick={() => setSelectedFinding(isSelected ? null : f)}
                    className={`relative flex items-center justify-center w-6 h-6 rounded-full transition-transform transform hover:scale-125 focus:outline-none ${
                      f.severity === 'high'
                        ? 'bg-rose-600 text-white ring-4 ring-rose-500/30'
                        : f.severity === 'moderate'
                        ? 'bg-amber-500 text-slate-900 ring-4 ring-amber-400/30'
                        : 'bg-teal-500 text-white ring-4 ring-teal-400/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold">!</span>
                    <span className="absolute -inset-1 rounded-full animate-ping opacity-30 bg-current" />
                  </button>

                  {/* Finding Tooltip on Hover/Active */}
                  <div
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-slate-900/95 backdrop-blur text-white text-xs rounded-xl shadow-2xl border border-slate-700 transition-all pointer-events-none z-30 ${
                      isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                    }`}
                  >
                    <div className="font-semibold text-cyan-300">{f.label.en}</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">{f.location}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          f.severity === 'high'
                            ? 'bg-rose-500'
                            : f.severity === 'moderate'
                            ? 'bg-amber-400'
                            : 'bg-teal-400'
                        }`}
                      />
                      <span className="capitalize">{f.severity} severity lesion</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Low Confidence Overlay Banner on Canvas */}
        {isLowConfidence && (
          <div className="absolute top-4 inset-x-4 p-3 bg-amber-950/90 border border-amber-500/50 rounded-xl backdrop-blur text-amber-200 text-xs flex items-center gap-2.5 z-10 shadow-lg">
            <Info className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-amber-300">Caution: Sub-optimal Optical Clarity</p>
              <p className="text-[11px] text-amber-200/80">Grad-CAM map indicates high noise dispersion. Specialist slit-lamp check advised.</p>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Spectrum Legend Footer */}
      {currentView === 'overlay' && (
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1 text-cyan-300 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Grad-CAM Activation Density
            </span>
            <span className="font-mono text-slate-400">Layer: Conv5_Block3</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-mono">0.0 (Low)</span>
            <div className="h-2.5 flex-1 rounded-full bg-gradient-to-r from-blue-700 via-teal-400 via-yellow-400 to-red-600 shadow-inner" />
            <span className="text-[10px] text-rose-400 font-mono font-bold">1.0 (Peak Attention)</span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>• Normal Background Stroma</span>
            <span>• Moderate Vascular Variance</span>
            <span className="text-rose-300 font-medium">• Microaneurysms / Exudates / NVD</span>
          </div>
        </div>
      )}
    </div>
  );
};
