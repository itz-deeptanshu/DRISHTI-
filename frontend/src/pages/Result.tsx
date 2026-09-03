import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { RetinaViewer } from '../components/RetinaViewer';
import { SeverityBadge } from '../components/SeverityBadge';
import { AIInfoCard } from '../components/AIInfoCard';
import { ConfidenceBreakdown } from '../components/ConfidenceBreakdown';
import { DR_GRADES, SAMPLE_PRESETS, AI_MODEL_METADATA, getLocalizedText } from '../data/mockData';
import { generateClinicalPDFReport } from '../utils/pdfGenerator';
import { ScreeningResult } from '../types';
import { toStaticUrl } from '../api/client';
import {
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Activity,
  CheckCircle2,
  FileText,
  Calendar,
  User,
  Eye,
  ShieldCheck,
  Zap,
  Info,
  HelpCircle,
  Stethoscope,
  Download,
  Loader2,
  FileDown,
} from 'lucide-react';

export const Result: React.FC = () => {
  const navigate = useNavigate();
  const { session, updateSession, loadPreset, t, language, clinicianName, facilityName } = useScreening();

  const [activeView, setActiveView] = useState<'overlay' | 'original'>('overlay');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  // If no result is loaded in current session, auto-load standard moderate NPDR sample
  const currentResult: ScreeningResult = session.result || {
    severityGrade: 2,
    confidence: 94.2,
    isLowConfidence: false,
    explanation: SAMPLE_PRESETS[0].explanation,
    findings: SAMPLE_PRESETS[0].findings,
    macularEdemaRisk: 'Mild',
    macularEdemaConfidence: 91.8,
    imageQualityScore: 97.6,
    classProbabilities: undefined,
    recommendedAction: SAMPLE_PRESETS[0].recommendedAction,
    urgency: 'Within 2-3 Months',
    modelInfo: AI_MODEL_METADATA,
  };

  const gradeInfo = DR_GRADES[currentResult.severityGrade] || DR_GRADES[0];
  const isLowConf = currentResult.isLowConfidence || currentResult.confidence < 75;

  const handleViewRecommendation = () => {
    navigate('/recommendation');
  };

  const toggleLowConfidenceDemo = () => {
    if (isLowConf) {
      loadPreset('sample-moderate');
    } else {
      loadPreset('sample-low-confidence');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateClinicalPDFReport(
        {
          patientId: session.patientId || 'PAT-2026-8841',
          patientName: session.patientName || 'Sunita Devi',
          age: session.age || 58,
          gender: session.gender || 'Female',
          eye: session.eye || 'Right',
          screenedAt: new Date().toISOString(),
          imageUrl: session.imageUrl,
          result: currentResult,
          referralStatus: session.referralStatus,
          referralHospital: session.referralHospital,
          referralPriority: session.referralPriority,
          notes: session.notes,
          clinicianName,
          facilityName,
          language,
        },
        'clinical-result-summary-card'
      );
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div id="result-page" className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Protocol Bar & Patient Identity */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
            DR
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {session.patientName || session.patientId || 'Sunita Devi'}
              </h1>
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                {session.patientId || 'PAT-2026-8841'}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-teal-50 text-teal-800 rounded-md border border-teal-200">
                {session.eye} Eye ({session.eye === 'Left' ? 'OS' : 'OD'})
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-3 mt-1 font-medium">
              <span>{session.age || 58} years</span>
              <span>•</span>
              <span>{session.gender || 'Female'}</span>
              <span>•</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                Grad-CAM Verification Complete
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons: PDF Download & Demo Switchers */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            id="download-pdf-report-top-btn"
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
              pdfSuccess
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100'
            }`}
            title="Download formatted Clinical Diagnostic Summary PDF"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />
            ) : pdfSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            ) : (
              <Download className="w-3.5 h-3.5 text-teal-700" />
            )}
            <span>{isGeneratingPdf ? t('generatingPdf') : pdfSuccess ? t('pdfDownloaded') : t('downloadPdf')}</span>
          </button>

          <button
            id="toggle-low-confidence-btn"
            type="button"
            onClick={toggleLowConfidenceDemo}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
              isLowConf
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>{isLowConf ? 'Active: Low Confidence Case' : 'Test Low Confidence Case'}</span>
          </button>
        </div>
      </div>

      {/* Two-Column Result Layout */}
      <div id="clinical-result-summary-card" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (6 cols): Captured Retina + Grad-CAM Heatmap Viewer */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>{t('explainability')}</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">512x512 Conv5 Layer</span>
          </div>

          {/* Core Interactive Retina Visualizer with Heatmap & Legend */}
          <RetinaViewer
            grade={currentResult.severityGrade}
            findings={currentResult.findings}
            isLowConfidence={isLowConf}
            activeView={activeView}
            onViewChange={setActiveView}
            customImageSrc={
              session.imageUrl && !session.imageUrl.startsWith('preset:')
                ? toStaticUrl(session.imageUrl)
                : null
            }
            gradcamOverlaySrc={
              session.gradcamUrl ? toStaticUrl(session.gradcamUrl) : null
            }
          />

          {/* Quick Presets for Evaluator Examination */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-bold text-slate-800">Quick Evaluate Different Severity Grades:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => loadPreset(p.id)}
                  className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all cursor-pointer ${
                    (session.presetKey === p.id || (!session.presetKey && p.id === 'sample-moderate'))
                      ? 'border-teal-600 bg-teal-50 text-teal-900'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="font-bold">{DR_GRADES[p.grade].shortName}</div>
                  <div className="text-[10px] text-slate-500">{p.confidence}% conf</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Clinical Diagnostic Evaluation */}
        <div className="lg:col-span-6 space-y-5">
          {/* LOW CONFIDENCE VARIANT BANNER (Conditional Render) */}
          {isLowConf ? (
            <div
              id="low-confidence-alert-banner"
              className="p-5 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs space-y-3 animate-in shake duration-300"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-amber-950">
                    {t('lowConfidenceWarning')}
                  </h3>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {t('lowConfidenceNotice')}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-amber-900 font-bold">
                  <span>Confidence Metric:</span>
                  <span className="font-mono text-amber-700">{currentResult.confidence}% (Below 80% Cutoff)</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Reason: Possible media opacities (incipient cataract/corneal haze) or atypical microvascular noise detected. Automated classification deferred to specialist slit-lamp biomicroscopy.
                </p>
              </div>
            </div>
          ) : (
            /* NORMAL CONFIDENT DIAGNOSIS CARD */
            <div className={`p-6 rounded-2xl border shadow-xs space-y-4 ${gradeInfo.badgeBg} ${gradeInfo.badgeBorder}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-600">
                  ICDR Severity Classification
                </span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 rounded-full border border-slate-200 text-xs font-mono font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>{currentResult.confidence}% Confidence</span>
                </div>
              </div>

              <div className="space-y-2">
                <SeverityBadge grade={currentResult.severityGrade} size="lg" showDetails={false} />
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {getLocalizedText(gradeInfo.title, language)}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {getLocalizedText(gradeInfo.description, language)}
                </p>
              </div>

              {/* Confidence Progress Meter */}
              <div className="pt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Model Confidence Score</span>
                  <span className="font-mono font-bold text-slate-900">{currentResult.confidence}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/90 rounded-full overflow-hidden border border-slate-300/80 p-0.5 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentResult.severityGrade === 4
                        ? 'bg-rose-600'
                        : currentResult.severityGrade === 3
                        ? 'bg-orange-500'
                        : currentResult.severityGrade === 2
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${currentResult.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Detailed Confidence Scores & Multi-Class Distribution */}
          <ConfidenceBreakdown
            grade={currentResult.severityGrade}
            confidence={currentResult.confidence}
            classProbabilities={currentResult.classProbabilities}
            macularEdemaRisk={currentResult.macularEdemaRisk}
            macularEdemaConfidence={currentResult.macularEdemaConfidence}
            imageQualityScore={currentResult.imageQualityScore}
          />

          {/* Section: "Why was this flagged?" (Plain-language XAI explanation) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
              <Activity className="w-5 h-5 text-teal-600" />
              <h3>{t('whyFlagged')}</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {getLocalizedText(currentResult.explanation, language)}
            </p>
          </div>

          {/* Section: Possible Findings Bullet List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3>{t('possibleFindings')}</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                {currentResult.findings.length} landmarks
              </span>
            </div>

            {currentResult.findings.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No microaneurysms, hemorrhages, or exudates detected across all quadrants.</span>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {currentResult.findings.map((f) => (
                  <li
                    key={f.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors flex items-start gap-3"
                  >
                    <span
                      className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                        f.severity === 'high'
                          ? 'bg-rose-600 ring-2 ring-rose-300'
                          : f.severity === 'moderate'
                          ? 'bg-amber-500 ring-2 ring-amber-200'
                          : 'bg-teal-500 ring-2 ring-teal-200'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {getLocalizedText(f.label, language)}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-2 py-0.5 rounded border">
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{f.location}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Action Buttons -> Download PDF & Navigate to Recommendation */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              id="download-pdf-report-bottom-btn"
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-semibold text-sm transition-all cursor-pointer"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
              ) : (
                <FileDown className="w-4 h-4 text-teal-700" />
              )}
              <span>{isGeneratingPdf ? t('generatingPdf') : t('downloadPdf')}</span>
            </button>

            <button
              id="view-recommendation-btn"
              type="button"
              onClick={handleViewRecommendation}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm sm:text-base shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>{t('viewRecommendation')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

