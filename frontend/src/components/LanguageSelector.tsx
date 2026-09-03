import React, { useState, useRef, useEffect } from 'react';
import { useScreening } from '../context/ScreeningContext';
import { SUPPORTED_LANGUAGES } from '../data/translations';
import { Language } from '../types';
import { Globe, Check, ChevronDown, Sparkles } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'dropdown' | 'cards';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const { language, setLanguage, t } = useScreening();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${className}`}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              id={`lang-card-${lang.code}`}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-base text-slate-900">{lang.nativeScript || lang.name}</span>
                {isSelected && <Check className="w-4 h-4 text-teal-600" />}
              </div>
              <span className="text-xs text-slate-500 font-medium">{lang.name}</span>
              <span className="text-[10px] text-slate-400 mt-1 truncate w-full">{lang.region}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          id="compact-language-selector-btn"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          title="Select Regional Language"
        >
          <Globe className="w-3.5 h-3.5 text-teal-600" />
          <span>{currentLangObj.nativeScript || currentLangObj.name}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1.5 w-64 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t('selectLanguage')} / Regional Languages
              </p>
            </div>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm block text-slate-900">{lang.nativeScript || lang.name}</span>
                    <span className="text-[11px] text-slate-500">{lang.name} • {lang.region}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        id="regional-language-dropdown-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-2 truncate">
          <Globe className="w-4 h-4 text-teal-600 shrink-0" />
          <div className="text-left truncate">
            <span className="font-bold text-slate-900 text-xs block">{currentLangObj.nativeScript || currentLangObj.name}</span>
            <span className="text-[10px] text-slate-500 block truncate">{currentLangObj.name} ({currentLangObj.region})</span>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 max-h-96 overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 divide-y divide-slate-100">
          <div className="px-3.5 py-1.5">
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
              {t('selectLanguage')} (11 Regional Languages)
            </span>
            <p className="text-[10px] text-slate-400">Rural India Outreach Localization</p>
          </div>
          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`lang-select-option-${lang.code}`}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 text-teal-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900">{lang.nativeScript || lang.name}</span>
                      <span className="text-[11px] text-slate-500 font-medium">({lang.name})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">{lang.region}</span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
