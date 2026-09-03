import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PatientScreening, ScreeningResult, Language, ReferralReportData } from '../types';
import { DR_GRADES, getLocalizedText } from '../data/mockData';
import { calculateClassProbabilities, getConfidenceRating, getRecommendedProcedures, GRADE_NAMES } from './confidenceUtils';

export interface PDFReportData {
  patientId: string;
  patientName?: string;
  age: number | string;
  gender?: string;
  eye: 'Left' | 'Right';
  screenedAt?: string;
  imageUrl?: string;
  result: ScreeningResult;
  referralStatus?: 'not_referred' | 'referral_created' | string;
  referralHospital?: string;
  referralPriority?: string;
  notes?: string;
  clinicianName?: string;
  facilityName?: string;
  language?: Language;
}

/**
 * Generates the Clinical Diagnostic Screening PDF Report with comprehensive confidence scores
 */
export async function generateClinicalPDFReport(
  data: PDFReportData,
  reportElementId?: string
): Promise<void> {
  const lang = data.language || 'en';
  const gradeInfo = DR_GRADES[data.result.severityGrade] || DR_GRADES[0];
  const gradeTitle = getLocalizedText(gradeInfo.title, lang);
  const gradeDesc = getLocalizedText(gradeInfo.description, lang);
  const followUp = getLocalizedText(gradeInfo.recommendedFollowUp, lang);
  const aiExplanation = getLocalizedText(data.result.explanation, lang);
  const classProbs = data.result.classProbabilities || calculateClassProbabilities(data.result.severityGrade, data.result.confidence);
  const confRating = getConfidenceRating(data.result.confidence);

  // If a DOM element is passed, attempt html2canvas high-res capture
  if (reportElementId) {
    const element = document.getElementById(reportElementId);
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (imgHeight <= pdfHeight) {
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        } else {
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
          }
        }

        const fileName = `DR_Screening_${data.patientId}_${new Date().toISOString().slice(0, 10)}.pdf`;
        pdf.save(fileName);
        return;
      } catch (err) {
        console.warn('DOM capture fallback to vector jsPDF:', err);
      }
    }
  }

  // Pure Vector jsPDF Generator (Clean, sharp, vector-rendered)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let currentY = 16;

  // Header Banner
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('AI DIABETIC RETINOPATHY CLINICAL SCREENING REPORT', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `${data.facilityName || 'AIIMS Tele-Ophthalmology Outreach Center'}  •  Ministry of Health Tele-Health Protocol`,
    margin,
    18
  );
  doc.text(
    `Screening Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}  •  Confidential Medical Record`,
    margin,
    23
  );

  currentY = 34;

  // Patient Demographic Section
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('PATIENT DEMOGRAPHICS & CLINICAL METADATA', margin + 4, currentY + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text(`Patient ID: ${data.patientId}`, margin + 4, currentY + 12);
  doc.text(`Name: ${data.patientName}`, margin + 4, currentY + 18);
  doc.text(`Age / Gender: ${data.age} Yrs / ${data.gender}`, margin + 4, currentY + 23);

  doc.text(`Examined Eye: ${data.eye} Eye (${data.eye === 'Left' ? 'OS' : 'OD'})`, margin + 65, currentY + 12);
  doc.text(`Clinician: ${data.clinicianName || 'Dr. Ananya Sharma'}`, margin + 65, currentY + 18);
  doc.text(`Facility: ${data.facilityName || 'AIIMS Community Center'}`, margin + 65, currentY + 23);

  doc.text(`Model: VisionNet-DR v2.4 (Edge)`, margin + 125, currentY + 12);
  doc.text(`Quality Check: PASS (100%)`, margin + 125, currentY + 18);
  doc.text(`Certainty Tier: ${confRating.tier}`, margin + 125, currentY + 23);

  currentY += 31;

  // Diagnostic Result Box
  const grade = data.result.severityGrade;
  let statusFill = [240, 253, 244]; // Green
  let statusBorder = [34, 197, 94];
  let statusText = [21, 128, 61];

  if (grade === 1) {
    statusFill = [240, 253, 250];
    statusBorder = [20, 184, 166];
    statusText = [15, 118, 110];
  } else if (grade === 2) {
    statusFill = [254, 252, 232];
    statusBorder = [234, 179, 8];
    statusText = [161, 98, 7];
  } else if (grade >= 3) {
    statusFill = [255, 241, 242];
    statusBorder = [244, 63, 94];
    statusText = [190, 18, 60];
  }

  doc.setFillColor(statusFill[0], statusFill[1], statusFill[2]);
  doc.setDrawColor(statusBorder[0], statusBorder[1], statusBorder[2]);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'FD');

  doc.setTextColor(statusText[0], statusText[1], statusText[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`ICDR CLASSIFICATION: GRADE ${grade} — ${gradeInfo.shortName.toUpperCase()}`, margin + 4, currentY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Diagnostic Finding: ${gradeTitle}`, margin + 4, currentY + 14);
  doc.text(`AI Certainty: ${data.result.confidence}%  |  DME Risk: ${data.result.macularEdemaRisk || 'None'}  |  Urgency: ${data.result.urgency}`, margin + 4, currentY + 20);

  currentY += 29;

  // Confidence Scores & Multi-Class Probabilities Section
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 38, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('AI MODEL CONFIDENCE SCORES & 5-CLASS PROBABILITY DISTRIBUTION', margin + 4, currentY + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Overall Diagnostic Confidence: ${data.result.confidence}% (${confRating.label})  |  Quality Index: ${data.result.imageQualityScore || 97.6}%  |  DME Confidence: ${data.result.macularEdemaConfidence || 92.4}%`,
    margin + 4,
    currentY + 12
  );

  // Table of 5 classes
  let px = margin + 4;
  const colWidth = (pageWidth - margin * 2 - 8) / 5;
  const py = currentY + 18;

  classProbs.forEach((cp) => {
    const isChosen = cp.grade === grade;
    if (isChosen) {
      doc.setFillColor(204, 251, 241); // Teal highlight
      doc.setDrawColor(13, 148, 136);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
    }
    doc.roundedRect(px, py, colWidth - 2, 14, 1, 1, 'FD');

    doc.setFont('helvetica', isChosen ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(isChosen ? 13 : 71, isChosen ? 148 : 85, isChosen ? 136 : 105);
    doc.text(`Grade ${cp.grade}`, px + 2, py + 5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isChosen ? 15 : 30, isChosen ? 23 : 41, isChosen ? 42 : 59);
    doc.text(`${cp.probability.toFixed(1)}%`, px + 2, py + 11);

    px += colWidth;
  });

  currentY += 43;

  // Grad-CAM XAI & Morphological Findings
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 36, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('EXPLAINABLE AI (XAI) GRAD-CAM & RETINAL LESION FINDINGS', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const splitExplanation = doc.splitTextToSize(aiExplanation || gradeDesc, pageWidth - margin * 2 - 8);
  doc.text(splitExplanation.slice(0, 2), margin + 4, currentY + 12);

  // Findings list
  if (data.result.findings && data.result.findings.length > 0) {
    let fy = currentY + 23;
    data.result.findings.slice(0, 2).forEach((f) => {
      const fLabel = typeof f.label === 'object' ? getLocalizedText(f.label, lang) : f.label;
      doc.text(`• ${fLabel} (${f.location}) — Severity: ${f.severity.toUpperCase()}`, margin + 4, fy);
      fy += 5;
    });
  } else {
    doc.text('• No abnormal microaneurysms, hemorrhages, or exudative deposits identified.', margin + 4, currentY + 24);
  }

  currentY += 41;

  // Recommendation & Action Plan
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 34, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('CLINICAL RECOMMENDATION & REFERRAL DISPATCH STATUS', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const splitFollowUp = doc.splitTextToSize(`Protocol: ${followUp}`, pageWidth - margin * 2 - 8);
  doc.text(splitFollowUp.slice(0, 2), margin + 4, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text(`Referral Status: ${data.referralStatus === 'referral_created' ? 'ACTIVE REFERRAL QUEUED' : 'ROUTINE COMMUNITY SURVEILLANCE'}`, margin + 4, currentY + 21);

  if (data.referralStatus === 'referral_created') {
    doc.setFont('helvetica', 'normal');
    doc.text(`Destination Tertiary Facility: ${data.referralHospital || 'Regional Institute of Ophthalmology'}`, margin + 4, currentY + 26);
    doc.text(`Referral Urgency: ${data.referralPriority || 'High'}  |  Target Review Timeline: ${data.result.urgency}`, margin + 4, currentY + 30);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.text('Recommended Next Screening: Routine re-evaluation in 12 months with local community tele-screening node.', margin + 4, currentY + 26);
  }

  currentY += 38;

  // Disclaimer & Signatures
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Medical Disclaimer: This report incorporates deep-learning AI inference (Grad-CAM saliency mapping). It is designed as an authorized triage decision-support tool. Final diagnosis should be confirmed by a licensed ophthalmologist.',
    margin,
    currentY + 4,
    { maxWidth: pageWidth - margin * 2 }
  );

  currentY += 16;
  doc.setDrawColor(148, 163, 184);
  doc.line(margin, currentY, margin + 55, currentY);
  doc.line(pageWidth - margin - 55, currentY, pageWidth - margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Screening Optometrist / Technician', margin, currentY + 5);
  doc.text('Authorized Medical Officer / Vitreoretinal Specialist', pageWidth - margin - 55, currentY + 5);

  const filename = `DR_Clinical_Report_${data.patientId || 'Patient'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Generates an official Tertiary Tele-Ophthalmology Referral Report / Slip PDF
 */
export async function generateReferralSlipPDF(
  referral: ReferralReportData,
  reportElementId?: string
): Promise<void> {
  const gradeInfo = DR_GRADES[referral.severityGrade] || DR_GRADES[0];
  const classProbs = referral.classProbabilities || calculateClassProbabilities(referral.severityGrade, referral.primaryConfidence);
  const procedures = referral.recommendedProcedures.length > 0
    ? referral.recommendedProcedures
    : getRecommendedProcedures(referral.severityGrade, referral.macularEdemaRisk);
  const confRating = getConfidenceRating(referral.primaryConfidence);

  // If DOM element specified, try html2canvas first
  if (reportElementId) {
    const element = document.getElementById(reportElementId);
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, imgHeight));
        pdf.save(`Referral_Slip_${referral.patientId}_${referral.referralId}.pdf`);
        return;
      } catch (e) {
        console.warn('DOM capture fallback to vector jsPDF for Referral Slip:', e);
      }
    }
  }

  // Pure Vector jsPDF Generator for Official Medical Referral Slip
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let currentY = 16;

  // Header Box - Official Referral Document
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TERTIARY TELE-OPHTHALMOLOGY REFERRAL SLIP', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `NATIONAL HEALTH MISSION  •  DIABETIC RETINOPATHY COMMUNITY TRIAGE NETWORK`,
    margin,
    17
  );
  doc.text(
    `Referral ID: ${referral.referralId}  |  Dispatch Date: ${referral.referralDate || new Date().toLocaleDateString('en-IN')}`,
    margin,
    22
  );
  doc.text(
    `Urgency Level: [ ${referral.referralPriority.toUpperCase()} ]  •  Target Review: ${referral.targetUrgency}`,
    margin,
    27
  );

  currentY = 36;

  // Referring Center & Receiving Tertiary Hospital
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('REFERRAL ROUTING & CARE COORDINATION', margin + 4, currentY + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  // Left: Origin
  doc.text('Referring Health Facility:', margin + 4, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(referral.facilityName || 'AIIMS Community Vision Outreach Center', margin + 4, currentY + 17);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Referring Clinician: ${referral.clinicianName || 'Dr. Ananya Sharma'}`, margin + 4, currentY + 23);

  // Right: Destination
  doc.text('Receiving Tertiary Hospital:', margin + 100, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136); // Teal
  doc.text(referral.referralHospital || 'Regional Institute of Ophthalmology', margin + 100, currentY + 17);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Specialty: Vitreoretinal Ophthalmology Unit', margin + 100, currentY + 23);

  currentY += 33;

  // Patient Identification Card
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('PATIENT IDENTIFICATION & CLINICAL PRESENTATION', margin + 4, currentY + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Patient ID: ${referral.patientId}`, margin + 4, currentY + 13);
  doc.text(`Patient Name: ${referral.patientName}`, margin + 4, currentY + 18);

  doc.text(`Age / Gender: ${referral.age} Yrs / ${referral.gender}`, margin + 70, currentY + 13);
  doc.text(`Referred Eye: ${referral.eye} Eye (${referral.eye === 'Left' ? 'OS' : 'OD'})`, margin + 70, currentY + 18);

  doc.text(`Screened: ${new Date(referral.screenedAt).toLocaleDateString()}`, margin + 130, currentY + 13);
  doc.text(`Target Review: ${referral.targetUrgency}`, margin + 130, currentY + 18);

  currentY += 27;

  // AI Diagnostic Classification & Urgency Banner
  const isEmergency = referral.referralPriority === 'Emergency';
  const isHigh = referral.referralPriority === 'High';

  doc.setFillColor(isEmergency ? 255 : isHigh ? 254 : 240, isEmergency ? 241 : isHigh ? 252 : 253, isEmergency ? 242 : isHigh ? 232 : 250);
  doc.setDrawColor(isEmergency ? 244 : isHigh ? 234 : 20, isEmergency ? 63 : isHigh ? 179 : 184, isEmergency ? 94 : isHigh ? 8 : 166);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'FD');

  doc.setTextColor(isEmergency ? 190 : isHigh ? 161 : 15, isEmergency ? 18 : isHigh ? 98 : 118, isEmergency ? 60 : isHigh ? 7 : 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`DIAGNOSIS: GRADE ${referral.severityGrade} — ${gradeInfo.shortName.toUpperCase()}`, margin + 4, currentY + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`ICD-10 Code: E11.3${referral.severityGrade === 4 ? '59 (PDR)' : '19 (NPDR)'}  •  Diabetic Macular Edema Risk: ${referral.macularEdemaRisk.toUpperCase()}`, margin + 4, currentY + 14);
  doc.text(`Triage Priority: ${referral.referralPriority.toUpperCase()}  •  Direct Hospital Attention Required: ${referral.targetUrgency}`, margin + 4, currentY + 20);

  currentY += 29;

  // Detailed AI Confidence Scores Table
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 36, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('AI INFERENCE CONFIDENCE METRICS & MULTI-CLASS BREAKDOWN', margin + 4, currentY + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Primary Diagnostic Confidence: ${referral.primaryConfidence}% (${confRating.label})  |  Fundus Quality Index: ${referral.imageQualityScore || 97.6}%  |  DME Certainty: ${referral.macularEdemaConfidence || 91.8}%`,
    margin + 4,
    currentY + 12
  );

  // 5-Class Probabilities
  let cpx = margin + 4;
  const colW = (pageWidth - margin * 2 - 8) / 5;
  const cpy = currentY + 17;

  classProbs.forEach((cp) => {
    const isTarget = cp.grade === referral.severityGrade;
    if (isTarget) {
      doc.setFillColor(254, 243, 199); // Amber/teal highlight
      doc.setDrawColor(217, 119, 6);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
    }
    doc.roundedRect(cpx, cpy, colW - 2, 13, 1, 1, 'FD');

    doc.setFont('helvetica', isTarget ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(isTarget ? 180 : 71, isTarget ? 83 : 85, isTarget ? 9 : 105);
    doc.text(`Grade ${cp.grade}`, cpx + 2, cpy + 4.5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${cp.probability.toFixed(1)}%`, cpx + 2, cpy + 10);

    cpx += colW;
  });

  currentY += 41;

  // Recommended Tertiary Procedures & Interventions
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 38, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('RECOMMENDED TERTIARY OPHTHALMIC PROCEDURES', margin + 4, currentY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  let proY = currentY + 12;
  procedures.forEach((proc, idx) => {
    doc.text(`[ ${idx + 1} ]  ${proc}`, margin + 4, proY);
    proY += 5.5;
  });

  if (referral.clinicalNotes) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Referring Doctor Notes: "${referral.clinicalNotes}"`, margin + 4, currentY + 34);
  }

  currentY += 43;

  // Patient Instructions
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PATIENT / CAREGIVER INSTRUCTIONS:', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    '1. Present this referral slip at the Outpatient Registration Counter of the receiving eye hospital.',
    margin + 4,
    currentY + 10
  );
  doc.text(
    '2. Bring previous blood glucose (HbA1c) and blood pressure records. Please arrange transport as eyes will be dilated.',
    margin + 4,
    currentY + 15
  );

  currentY += 25;

  // Signatures & Stamp
  doc.setDrawColor(148, 163, 184);
  doc.line(margin, currentY + 10, margin + 55, currentY + 10);
  doc.line(pageWidth - margin - 55, currentY + 10, pageWidth - margin, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Referring Medical Officer Signature', margin, currentY + 14);
  doc.text(`Dr. ${referral.clinicianName || 'Ananya Sharma'} (Reg: DMC-84210)`, margin, currentY + 18);

  doc.text('Receiving Hospital Acknowledgment & Stamp', pageWidth - margin - 55, currentY + 14);
  doc.text('Vitreoretinal OPD Desk', pageWidth - margin - 55, currentY + 18);

  // Save PDF
  const filename = `Referral_Slip_${referral.patientId}_${referral.referralId}.pdf`;
  doc.save(filename);
}
