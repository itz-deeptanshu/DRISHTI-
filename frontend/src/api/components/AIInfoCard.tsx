import React, { useEffect, useState } from 'react';
import { AI_MODEL_METADATA } from '../data/mockData';
import { getModelInfo, BackendModelInfo } from '../api/client';
import { Sparkles, Cpu, Database, Award, ShieldCheck, Info } from 'lucide-react';
import { useScreening } from '../context/ScreeningContext';

export const AIInfoCard: React.FC<{ compact?: boolean }> = () => {
  const { t } = useScreening();
  const [model, setModel] = useState<BackendModelInfo | null>(null);

  useEffect(() => {
    getModelInfo()
      .then((info) => setModel(info))
      .catch(() => {
        // Keeps fallback to AI_MODEL_METADATA
      });
  }, []);

  const architecture = model?.architecture || AI_MODEL_METADATA.architecture;
  const xaiMethod = model?.xai_method || AI_MODEL_METADATA.xaiMethod;
  const dataset = model?.dataset || AI_MODEL_METADATA.dataset;
  const aucScore = model?.auc_score || AI_MODEL_METADATA.aucScore;

  return (
    <div id="ai-model-info-card" className="bg-teal-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-5 h-5 text-teal-400" />
        <h4 className="font-bold text-sm text-white">{t('aboutAI')}</h4>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between border-b border-teal-800 pb-2">
          <span className="text-teal-400 font-medium">Architecture</span>
          <span className="font-semibold text-slate-100">{architecture}</span>
        </div>
        <div className="flex justify-between border-b border-teal-800 pb-2">
          <span className="text-teal-400 font-medium">Explainability</span>
          <span className="font-semibold text-slate-100">{xaiMethod}</span>
        </div>
        <div className="flex justify-between border-b border-teal-800 pb-2">
          <span className="text-teal-400 font-medium">Training Set</span>
          <span className="font-semibold text-slate-100">{dataset}</span>
        </div>
        <div className="flex justify-between border-b border-teal-800 pb-2">
          <span className="text-teal-400 font-medium">Validation AUC</span>
          <span className="font-semibold text-teal-200">{aucScore}</span>
        </div>

        <p className="text-[11px] text-teal-300/80 leading-relaxed mt-4 italic">
          This edge tool is designed for clinical triage support and explainable screening, adhering strictly to ICDR scale guidelines.
        </p>
      </div>
    </div>
  );
};

