import React from 'react';
import { DRGrade } from '../types';
import { DR_GRADES } from '../data/mockData';
import { useScreening } from '../context/ScreeningContext';
import { getLocalizedText } from '../data/translations';

interface SeverityBadgeProps {
  grade: DRGrade;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  grade,
  size = 'md',
  showDetails = false,
  className = '',
}) => {
  const { language } = useScreening();
  const info = DR_GRADES[grade] || DR_GRADES[0];

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium border',
    md: 'text-xs px-2.5 py-1 rounded-lg font-semibold border',
    lg: 'text-sm px-3.5 py-1.5 rounded-xl font-bold border-2 shadow-xs',
  };

  const dotClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const title = getLocalizedText(info.title, language);

  return (
    <div className={`inline-flex items-center gap-1.5 whitespace-nowrap ${info.badgeBg} ${sizeClasses[size]} ${className}`}>
      <span className={`rounded-full shrink-0 ${info.badgeColor} ${dotClasses[size]} animate-pulse`} />
      <span>Grade {grade}: {info.shortName}</span>
      {showDetails && (
        <span className="text-slate-500 font-normal ml-1">({title})</span>
      )}
    </div>
  );
};
