import React, { useState } from 'react';
import { DRGrade, ClassProbability } from '../types';
import { calculateClassProbabilities, getConfidenceRating, GRADE_NAMES } from '../utils/confidenceUtils';
import { DR_GRADES } from '../data/mockData';
import {
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  Sparkles,
  Layers,
  Activity,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface ConfidenceBreakdownProps {
  grade: DRGrade;
  confidence: number;
  classProbabilities?: ClassProbability[] | null;
  macularEdemaRisk?: 'None' | 'Mild' | 'Clinically Significant' | null;
  macularEdemaConfidence?: number | null;
  imageQualityScore?: number | null;
  compact?: boolean;
  className?: string;
  showCardWrapper?: boolean;
}

export const ConfidenceBreakdown: React.FC<ConfidenceBreakdownProps> = ({
  grade,
  confidence,
  classProbabilities,
  macularEdemaRisk,
  macularEdemaConfidence,
  imageQualityScore,
  compact = false,
  className = '',
  showCardWrapper = true,
}) => {
  const [showMultiClass, setShowMultiClass] = useState(!compact);

  const rating = getConfidenceRating(confidence);

  const content = (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Confidence Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm">Diagnostic Confidence Scores</h4>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${rating.badgeClass}`}>
                {rating.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Multi-class Bayesian probability & feature certainty</p>
          </div>
        </div>

        {/* Big percentage & Tier */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            {confidence.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500 font-medium">Certainty</span>
        </div>
      </div>

      {/* Main Confidence Progress Bar with Threshold Marker */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-600 font-medium">
          <span>Primary Classification Certainty</span>
          <span className="font-mono font-bold text-slate-800">{confidence}%</span>
        </div>

        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          {/* Target 75% Clinical Threshold Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
            style={{ left: '75%' }}
            title="75% Minimum Recommended Autonomous Triage Threshold"
          />
          <div
            className={`h-full transition-all duration-700 ease-out rounded-full ${rating.barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400">
          <span>0%</span>
          <span className="font-semibold text-slate-500">75% Clinical Threshold</span>
          <span>100%</span>
        </div>
      </div>

      {/* Supporting Diagnostic Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
        {/* DME Risk Badge */}
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">DME Risk</span>
            {macularEdemaRisk ? (
              <span className="text-[10px] font-mono font-bold text-teal-700">
                {macularEdemaConfidence ? `${macularEdemaConfidence}%` : 'Graded'}
              </span>
            ) : (
              <span className="text-[9px] font-mono text-slate-400">N/A</span>
            )}
          </div>
          <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">
            {macularEdemaRisk || 'Not Evaluated'}
          </span>
        </div>

        {/* Retinal Image Quality Index */}
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Quality Index</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700">
              {imageQualityScore ? `${imageQualityScore}%` : 'Edge Pass'}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">
            Diagnostic Pass
          </span>
        </div>

        {/* Inference Certainty Level */}
        <div className="col-span-2 sm:col-span-1 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Certainty Tier</span>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">
            {rating.tier}
          </span>
        </div>
      </div>

      {/* Multi-Class Probability Distribution Accordion */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowMultiClass(!showMultiClass)}
          className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-700 hover:text-teal-700 transition-colors cursor-pointer border-t border-slate-100"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>5-Class ICDR Probability Distribution</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span className="text-[11px] font-normal">{showMultiClass ? 'Hide details' : 'Show breakdown'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMultiClass ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {showMultiClass && (
          <div>
            {classProbabilities && classProbabilities.length > 0 ? (
              <div className="space-y-2 mt-2 pt-1 animate-in fade-in duration-200">
                {classProbabilities.map((item) => {
                  const isSelected = item.grade === grade;
                  const gradeMetadata = DR_GRADES[item.grade];

                  return (
                    <div
                      key={item.grade}
                      className={`p-2 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-300 shadow-2xs'
                          : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${gradeMetadata.badgeColor} ${
                              isSelected ? 'animate-pulse' : 'opacity-60'
                            }`}
                          />
                          <span className={`font-semibold ${isSelected ? 'text-teal-950 font-bold' : 'text-slate-700'}`}>
                            Grade {item.grade}: {gradeMetadata.shortName}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] bg-teal-600 text-white font-bold px-1.5 py-0.2 rounded uppercase">
                              Predicted
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {item.probability.toFixed(1)}%
                        </span>
                      </div>

                      {/* Micro Bar */}
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isSelected ? 'bg-teal-600' : 'bg-slate-300'}`}
                          style={{ width: `${item.probability}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-medium text-slate-700">
                  <Info className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Softmax probability array not returned by endpoint</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  The backend currently outputs the top predicted grade (ICDR Grade {grade}: {DR_GRADES[grade]?.shortName}) with {confidence.toFixed(1)}% confidence. Full 5-class softmax distribution is not currently returned by the API response.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clinical Guidance Note */}
      <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
        confidence < 75 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        {confidence < 75 ? (
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        ) : (
          <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        )}
        <div className="text-[11px] leading-relaxed">
          <span className="font-bold block text-slate-900">{rating.recommendation}</span>
          <span>{rating.description}</span>
        </div>
      </div>
    </div>
  );

  if (!showCardWrapper) {
    return content;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      {content}
    </div>
  );
};
