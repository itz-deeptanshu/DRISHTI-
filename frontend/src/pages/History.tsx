import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { SeverityBadge } from '../components/SeverityBadge';
import { ScreeningModal } from '../components/ScreeningModal';
import { PatientScreening, DRGrade } from '../types';
import { DR_GRADES } from '../data/mockData';
import {
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Send,
  PlusCircle,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
} from 'lucide-react';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { history, t, resetSession, resetToMockDefaults } = useScreening();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [selectedScreening, setSelectedScreening] = useState<PatientScreening | null>(null);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.patientId.toLowerCase().includes(q) ||
        (item.patientName && item.patientName.toLowerCase().includes(q)) ||
        (item.referralHospital && item.referralHospital.toLowerCase().includes(q));

      const matchesGrade =
        gradeFilter === 'all' || item.result.severityGrade === Number(gradeFilter);

      return matchesSearch && matchesGrade;
    });
  }, [history, searchQuery, gradeFilter]);

  const handleStartNew = () => {
    resetSession();
    navigate('/patient-details');
  };

  return (
    <div id="history-page" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('history')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete registry of AI tele-screened retinal exams and referral disposition logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="start-screening-history-btn"
            type="button"
            onClick={handleStartNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('startNewScreening')}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="history-search-input"
            type="text"
            placeholder={t('searchPatient')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>

        {/* Severity Grade Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            id="history-grade-filter"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">{t('allGrades')}</option>
            <option value="0">Grade 0: No DR</option>
            <option value="1">Grade 1: Mild NPDR</option>
            <option value="2">Grade 2: Moderate NPDR</option>
            <option value="3">Grade 3: Severe NPDR</option>
            <option value="4">Grade 4: Proliferative DR</option>
          </select>
        </div>
      </div>

      {/* Table / List Records */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">{t('noHistoryMatch')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or clear the severity filters to view all records.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setGradeFilter('all');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={resetToMockDefaults}
              className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Sample History</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-5">Patient Details</th>
                  <th className="py-3.5 px-4">Eye (Field)</th>
                  <th className="py-3.5 px-4">Exam Date & Time</th>
                  <th className="py-3.5 px-4">Grad-CAM Result</th>
                  <th className="py-3.5 px-4">Referral Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredHistory.map((item) => {
                  const dateFormatted = new Date(item.screenedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={item.id}
                      id={`history-row-${item.id}`}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Patient Details */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900 text-sm">
                          {item.patientName || item.patientId}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span>{item.patientId}</span>
                          <span>•</span>
                          <span>{item.age}y / {item.gender || 'F'}</span>
                        </div>
                      </td>

                      {/* Eye Field */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-mono text-[11px]">
                          {item.eye === 'Left' ? 'OS (Left)' : 'OD (Right)'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateFormatted}</span>
                        </div>
                      </td>

                      {/* Severity Result */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <SeverityBadge grade={item.result.severityGrade} size="sm" />
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {item.result.confidence}% conf
                          </span>
                        </div>
                      </td>

                      {/* Referral Status */}
                      <td className="py-3.5 px-4">
                        {item.referralStatus === 'referral_created' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                            <Send className="w-3 h-3 text-teal-600" />
                            <span>Referral Queued</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            Routine Care
                          </span>
                        )}
                      </td>

                      {/* View Action Link */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          id={`view-history-${item.id}`}
                          type="button"
                          onClick={() => setSelectedScreening(item)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('viewDetails')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Screening Read-Only Modal */}
      {selectedScreening && (
        <ScreeningModal
          screening={selectedScreening}
          onClose={() => setSelectedScreening(null)}
        />
      )}
    </div>
  );
};
