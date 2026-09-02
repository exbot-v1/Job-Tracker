import { jsPDF } from 'jspdf';
import { Contract, Video, PaymentRecord } from '../types';
import {
  getCurrentEditingPeriodDetails,
  formatSecondsDigital,
  formatMinutesDisplay,
  calculateContractProgress,
} from './calculations';
import { getYouTubeThumbnailUrl, loadImageAsBase64 } from './youtube';

export interface PDFExportOptions {
  contract: Contract;
  videos: Video[];
  payments?: PaymentRecord[];
  clientOrEmployerName?: string;
  reportTitle?: string;
}

/**
 * Generate and download an official Video Editing Status PDF report.
 * Strictly adheres to rule: Contains ONLY editing time and runtime progression.
 * ABSOLUTELY NO financial or payment information.
 */
export async function generateEditingStatusPDF(options: PDFExportOptions): Promise<void> {
  const {
    contract,
    videos,
    payments = [],
    clientOrEmployerName = 'Client / Employer',
    reportTitle = 'VIDEO EDITING PROGRESS REPORT',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald #10B981
  const darkBg: [number, number, number] = [15, 23, 42]; // Slate-900 #0F172A
  const cardBg: [number, number, number] = [248, 250, 252]; // Slate-50 #F8FAFC
  const borderCol: [number, number, number] = [226, 232, 240]; // Slate-200 #E2E8F0
  const textDark: [number, number, number] = [15, 23, 42]; // Slate-900
  const textMuted: [number, number, number] = [100, 116, 139]; // Slate-500
  const accentSky: [number, number, number] = [14, 165, 233]; // Sky-500

  // Calculate current period & progress
  const period = getCurrentEditingPeriodDetails(videos, contract, payments);
  const overall = calculateContractProgress(videos, contract);

  // Pre-load video thumbnails if any
  const thumbnailMap: Record<string, string | null> = {};
  for (const contrib of period.contributions) {
    if (contrib.youtubeUrl) {
      const thumbUrl = getYouTubeThumbnailUrl(contrib.youtubeUrl, 'mq');
      if (thumbUrl) {
        try {
          const b64 = await loadImageAsBase64(thumbUrl);
          thumbnailMap[contrib.videoId] = b64;
        } catch {
          thumbnailMap[contrib.videoId] = null;
        }
      }
    }
  }

  let y = margin;

  // --- HEADER SECTION ---
  // Top Banner background
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F');

  // Emerald accent strip on left
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, y, 4, 28, 'F');

  // Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(reportTitle, margin + 8, y + 10);

  // Subtitle / Contract
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(`Project / Contract: ${contract.name}`, margin + 8, y + 17);
  doc.text(`Recipient: ${clientOrEmployerName}`, margin + 8, y + 23);

  // Right side of header: Date generated & Cycle #
  const nowStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${nowStr}`, pageWidth - margin - 6, y + 10, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Editing Period Block #${period.cycleNumber}`, pageWidth - margin - 6, y + 17, { align: 'right' });
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period Start: ${period.startDateFormatted}`, pageWidth - margin - 6, y + 23, { align: 'right' });

  y += 33;

  // --- CURRENT 90-MINUTE PERIOD METRICS CARD ---
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'FD');

  // Section Header inside card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('CURRENT 90-MINUTE EDITING PERIOD STATUS', margin + 6, y + 8);

  // Progress percentage badge
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${period.progressPercentage.toFixed(1)}% Completed`, pageWidth - margin - 6, y + 8, { align: 'right' });

  // Progress Bar
  const barY = y + 11;
  const barWidth = contentWidth - 12;
  const barHeight = 4;
  doc.setFillColor(226, 232, 240); // empty bar
  doc.roundedRect(margin + 6, barY, barWidth, barHeight, 2, 2, 'F');

  const filledWidth = Math.max(2, (barWidth * Math.min(100, period.progressPercentage)) / 100);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(margin + 6, barY, filledWidth, barHeight, 2, 2, 'F');

  // 4 Column Metrics
  const colWidth = (contentWidth - 12) / 4;
  const metricsY = y + 22;

  // Metric 1: Elapsed
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('PERIOD RUNTIME', margin + 6, metricsY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(formatSecondsDigital(period.totalOriginalRuntimeSeconds, true), margin + 6, metricsY + 5);
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${formatMinutesDisplay(period.totalOriginalRuntimeSeconds / 60)}`, margin + 6, metricsY + 9);

  // Metric 2: Completed to this 90m block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('CREDITED (90m TARGET)', margin + 6 + colWidth, metricsY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(period.completedFormatted, margin + 6 + colWidth, metricsY + 5);
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${formatMinutesDisplay(period.completedMinutes)} / 90 min`, margin + 6 + colWidth, metricsY + 9);

  // Metric 3: Remaining
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('REMAINING RUNTIME', margin + 6 + colWidth * 2, metricsY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(period.remainingFormatted, margin + 6 + colWidth * 2, metricsY + 5);
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${formatMinutesDisplay(period.remainingMinutes)} remaining`, margin + 6 + colWidth * 2, metricsY + 9);

  // Metric 4: Carryover / Extra
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('EXTRA / CARRYOVER', margin + 6 + colWidth * 3, metricsY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(period.totalExtraCarryoverSeconds > 0 ? accentSky[0] : textDark[0], period.totalExtraCarryoverSeconds > 0 ? accentSky[1] : textDark[1], period.totalExtraCarryoverSeconds > 0 ? accentSky[2] : textDark[2]);
  doc.text(formatSecondsDigital(period.totalExtraCarryoverSeconds, true), margin + 6 + colWidth * 3, metricsY + 5);
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(period.totalExtraCarryoverSeconds > 0 ? 'Pushed to next period' : 'None', margin + 6 + colWidth * 3, metricsY + 9);

  y += 40;

  // --- CONTRIBUTING VIDEOS SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`VIDEOS CONTRIBUTING TO THIS 90-MINUTE PERIOD (${period.contributions.length})`, margin, y);

  y += 4;

  // Table Header
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // Slate-600

  const colThumbX = margin + 2;
  const colTitleX = margin + 18;
  const colRuntimeX = margin + 92;
  const colCreditedX = margin + 120;
  const colExtraX = margin + 148;
  const colDateX = margin + 172;

  doc.text('PREVIEW', colThumbX, y + 4.8);
  doc.text('VIDEO TITLE', colTitleX, y + 4.8);
  doc.text('TOTAL RUNTIME', colRuntimeX, y + 4.8);
  doc.text('CREDITED (THIS BLOCK)', colCreditedX, y + 4.8);
  doc.text('EXTRA (NEXT)', colExtraX, y + 4.8);
  doc.text('DATE', colDateX, y + 4.8);

  y += 7;

  if (period.contributions.length === 0) {
    // Empty row
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, 12, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('No completed videos recorded yet for this editing period.', margin + 6, y + 7.5);
    y += 12;
  } else {
    for (let i = 0; i < period.contributions.length; i++) {
      const contrib = period.contributions[i];
      const rowHeight = 12;

      // Check if page overflow
      if (y + rowHeight > pageHeight - 35) {
        doc.addPage();
        y = margin;
      }

      // Alternate row background
      if (i % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.setLineWidth(0.15);
      doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

      // Thumbnail Image or fallback
      const thumbB64 = thumbnailMap[contrib.videoId];
      if (thumbB64) {
        try {
          doc.addImage(thumbB64, 'JPEG', colThumbX, y + 1.5, 13, 8.5);
        } catch {
          // Draw fallback box
          doc.setFillColor(226, 232, 240);
          doc.rect(colThumbX, y + 1.5, 13, 8.5, 'F');
        }
      } else {
        doc.setFillColor(226, 232, 240);
        doc.rect(colThumbX, y + 1.5, 13, 8.5, 'F');
      }

      // Title (truncate if too long)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      const maxTitleWidth = 70;
      let displayTitle = contrib.videoTitle;
      while (doc.getTextWidth(displayTitle) > maxTitleWidth && displayTitle.length > 5) {
        displayTitle = displayTitle.slice(0, -4) + '...';
      }
      doc.text(displayTitle, colTitleX, y + 5.5);

      // YouTube notice if available
      if (contrib.youtubeUrl) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text('YouTube Verified', colTitleX, y + 9.5);
      }

      // Total Runtime
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(contrib.originalDurationFormatted, colRuntimeX, y + 6);

      // Credited to this period
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(contrib.contributionFormatted, colCreditedX, y + 6);

      // Extra / Carryover
      if (contrib.extraSecondsToNextPeriod > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(accentSky[0], accentSky[1], accentSky[2]);
        doc.text(contrib.extraFormattedToNextPeriod, colExtraX, y + 6);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text('—', colExtraX + 2, y + 6);
      }

      // Date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(contrib.completionDate || '—', colDateX, y + 6);

      y += rowHeight;
    }
  }

  y += 6;

  // --- CONTRACT OVERALL SCOPE SUMMARY (NO PAYMENT DETAILS) ---
  if (y + 36 > pageHeight - 25) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('OVERALL CONTRACT RUNTIME SCOPE', margin + 6, y + 7);

  doc.setFontSize(8);
  doc.setTextColor(accentSky[0], accentSky[1], accentSky[2]);
  doc.text(
    `${overall.contractProgressPercentage.toFixed(1)}% of ${contract.total_required_minutes}m Scope Completed`,
    pageWidth - margin - 6,
    y + 7,
    { align: 'right' }
  );

  // Row of 3 scope stats
  const scopeColWidth = (contentWidth - 12) / 3;
  const scopeY = y + 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('TOTAL CONTRACT SCOPE', margin + 6, scopeY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${contract.total_required_minutes} Minutes (540m)`, margin + 6, scopeY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('TOTAL COMPLETED RUNTIME', margin + 6 + scopeColWidth, scopeY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${formatMinutesDisplay(overall.totalCompletedMinutes)} (${overall.totalCompletedFormatted})`, margin + 6 + scopeColWidth, scopeY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('TOTAL REMAINING RUNTIME', margin + 6 + scopeColWidth * 2, scopeY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${formatMinutesDisplay(overall.minutesRemaining)}`, margin + 6 + scopeColWidth * 2, scopeY + 5);

  y += 32;

  // --- OFFICIAL FOOTER NOTICE ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    'This is an official video editing runtime progress verification report. Minutes carry forward dynamically.',
    margin,
    pageHeight - margin
  );

  doc.text(
    `Page ${doc.getNumberOfPages()} of ${doc.getNumberOfPages()}`,
    pageWidth - margin,
    pageHeight - margin,
    { align: 'right' }
  );

  // Save / Download PDF
  const cleanDate = new Date().toISOString().split('T')[0];
  const sanitizedContractName = contract.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Video_Editing_Status_Report_${sanitizedContractName}_${cleanDate}.pdf`;
  doc.save(filename);
}
