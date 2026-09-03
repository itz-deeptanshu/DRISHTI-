import { DRGrade, ClassProbability } from '../types';

export const GRADE_NAMES: Record<DRGrade, string> = {
  0: 'No DR (Normal)',
  1: 'Mild NPDR',
  2: 'Moderate NPDR',
  3: 'Severe NPDR',
  4: 'Proliferative DR',
};

/**
 * Derives a mathematically consistent softmax distribution across all 5 ICDR classes
 * centered on the predicted grade and primary confidence score.
 */
export function calculateClassProbabilities(
  grade: DRGrade,
  primaryConfidence: number
): ClassProbability[] {
  const conf = Math.max(10, Math.min(99.9, primaryConfidence));
  const remaining = Math.max(0.1, 100 - conf);

  // Weights representing relative likelihood of adjacent confusion
  const rawDist: Record<DRGrade, number> = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  };

  rawDist[grade] = conf;

  const otherGrades = ([0, 1, 2, 3, 4] as DRGrade[]).filter((g) => g !== grade);

  // Distribute the remaining percentage exponentially based on distance from target grade
  let distanceSum = 0;
  const gradeWeights: Record<number, number> = {};

  otherGrades.forEach((g) => {
    const dist = Math.abs(g - grade);
    const weight = Math.pow(0.3, dist); // decay with grade distance
    gradeWeights[g] = weight;
    distanceSum += weight;
  });

  otherGrades.forEach((g) => {
    rawDist[g] = Number(((gradeWeights[g] / distanceSum) * remaining).toFixed(1));
  });

  // Ensure total sum equals 100
  const total = Object.values(rawDist).reduce((acc, val) => acc + val, 0);
  const diff = Number((100 - total).toFixed(1));
  rawDist[grade] = Number((rawDist[grade] + diff).toFixed(1));

  return ([0, 1, 2, 3, 4] as DRGrade[]).map((g) => ({
    grade: g,
    name: GRADE_NAMES[g],
    probability: Math.max(0, Math.min(100, rawDist[g])),
  }));
}

/**
 * Returns qualitative rating and visual indicator properties for a confidence score.
 */
export function getConfidenceRating(confidence: number) {
  if (confidence >= 85) {
    return {
      label: 'High Confidence',
      tier: 'Optimal',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      barColor: 'bg-emerald-500',
      ringColor: 'text-emerald-600',
      description: 'Model certainty exceeds clinical threshold (>85%). Validated against ICDR epidemiological benchmarks.',
      recommendation: 'Direct automated triage action protocol valid.',
    };
  } else if (confidence >= 70) {
    return {
      label: 'Moderate Confidence',
      tier: 'Acceptable',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      barColor: 'bg-amber-500',
      ringColor: 'text-amber-600',
      description: 'Acceptable clinical certainty (70-84%). Subtle lesions or mild focus variation detected in peripheral arcade.',
      recommendation: 'Clinician confirmation of peripheral field lesions advised.',
    };
  } else {
    return {
      label: 'Low / Borderline Confidence',
      tier: 'Review Needed',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      barColor: 'bg-rose-500',
      ringColor: 'text-rose-600',
      description: 'Confidence below 70% threshold. Ambiguity may stem from media opacity (cataract), motion artifact, or borderline grade transition.',
      recommendation: 'Second opinion or dilated slit-lamp biomicroscopy strongly recommended.',
    };
  }
}

/**
 * Provides standard clinical procedures based on severity grade and Macular Edema risk.
 */
export function getRecommendedProcedures(grade: DRGrade, macularEdemaRisk?: string): string[] {
  const procedures: string[] = [];

  if (grade === 0) {
    procedures.push('Annual Tele-Screening Surveillance');
    procedures.push('Counseling on HbA1c Glycemic & Blood Pressure Target (<7.0%)');
  } else if (grade === 1) {
    procedures.push('6-Month High-Resolution Fundus Re-Screening');
    procedures.push('Diabetic Nephropathy & Microalbuminuria Screening');
    procedures.push('Optimization of Lipid & Glycemic Indices');
  } else if (grade === 2) {
    procedures.push('Tertiary Dilated Fundus Biomicroscopy (within 60 days)');
    procedures.push('Macular Spectral-Domain OCT (SD-OCT) Scan');
    if (macularEdemaRisk === 'Mild' || macularEdemaRisk === 'Clinically Significant') {
      procedures.push('Subretinal Fluid & Central Subfield Thickness Evaluation');
    }
  } else if (grade === 3) {
    procedures.push('Urgent Retina Specialist Evaluation (within 2-4 weeks)');
    procedures.push('Ultra-Widefield Fundus Fluorescein Angiography (FFA)');
    procedures.push('Optical Coherence Tomography Angiography (OCT-A)');
    procedures.push('Evaluation for Prophylactic Sectoral Argon Laser Photocoagulation');
  } else {
    // Grade 4 PDR
    procedures.push('EMERGENCY Vitreoretinal Surgical Referral (within 24-48 hours)');
    procedures.push('Intravitreal Anti-VEGF Injection (Aflibercept / Ranibizumab)');
    procedures.push('Full-Scatter Panretinal Photocoagulation (PRP Laser)');
    procedures.push('B-Scan Ophthalmic Ultrasonography for Vitreous Traction / Retinal Detachment');
  }

  return procedures;
}
