import { jsPDF } from 'jspdf';
import { Contract, Video, PaymentRecord } from '../types';
import {
  getCurrentEditingPeriodDetails,
  formatSecondsDigital,
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
 * Render any Unicode text (including Bangla, English, mixed characters, emojis, numbers)
 * into a high-DPI crisp PNG image on an HTML5 canvas, ensuring 100% perfect Bengali ligatures,
 * vowel sign reordering, and font fallback rendering in jsPDF.
 */
function renderUnicodeTextToCanvasImage(
  text: string,
  options: {
    fontSizePt?: number;
    fontWeight?: string;
    color?: string;
    maxWidthMm?: number;
    scale?: number;
  } = {}
): { dataUrl: string; widthMm: number; heightMm: number } {
  const {
    fontSizePt = 9,
    fontWeight = 'bold',
    color = '#0F172A',
    maxWidthMm = 72,
    scale = 4, // 4x supersampling for razor-sharp text
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: '', widthMm: 0, heightMm: 0 };
  }

  // 1 pt = 1.333 px at standard 96 DPI
  const pixelFontSize = fontSizePt * 1.333 * scale;
  const fontFamilies = "'Noto Sans Bengali', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  ctx.font = `${fontWeight} ${pixelFontSize}px ${fontFamilies}`;

  // Truncate if exceeds maxWidth
  const maxWidthPx = (maxWidthMm / 0.264583) * scale;
  let renderText = text || '';
  if (ctx.measureText(renderText).width > maxWidthPx) {
    while (renderText.length > 3 && ctx.measureText(renderText + '...').width > maxWidthPx) {
      renderText = renderText.slice(0, -1);
    }
    renderText += '...';
  }

  const metrics = ctx.measureText(renderText);
  const textWidthPx = Math.max(10, Math.ceil(metrics.width + 12 * scale));
  const textHeightPx = Math.max(10, Math.ceil(pixelFontSize * 1.4 + 4 * scale));

  canvas.width = textWidthPx;
  canvas.height = textHeightPx;

  // Re-apply context font state after dimension change
  ctx.font = `${fontWeight} ${pixelFontSize}px ${fontFamilies}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.fillText(renderText, 2 * scale, canvas.height / 2);

  const mmPerPx = 0.264583 / scale;
  const widthMm = canvas.width * mmPerPx;
  const heightMm = canvas.height * mmPerPx;

  return {
    dataUrl: canvas.toDataURL('image/png'),
    widthMm,
    heightMm,
  };
}

/**
 * Wait for web fonts (especially Noto Sans Bengali) to be loaded before rendering
 */
async function ensureFontsLoaded(): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
      await document.fonts.load("bold 16px 'Noto Sans Bengali'");
    } catch {
      // Font load fallback
    }
  }
}

/**
 * Generate and download an official Video Editing Status PDF report.
 * Strictly adheres to rules:
 * 1. Contains ONLY editing time and runtime progression (MM:SS).
 * 2. ABSOLUTELY ZERO financial, salary, or payment information.
 * 3. NO overall contract progress or 540-minute scope sections.
 * 4. NO current cycle/milestone numbers (only "90-MINUTE EDITING PERIOD STATUS").
 * 5. Flawless Bengali / Unicode font support via canvas text renderer.
 */
export async function generateEditingStatusPDF(options: PDFExportOptions): Promise<void> {
  const {
    contract,
    videos,
    payments = [],
    clientOrEmployerName = 'Client / Employer',
    reportTitle = 'VIDEO EDITING PROGRESS REPORT',
  } = options;

  await ensureFontsLoaded();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Design Colors
  const primaryEmerald: [number, number, number] = [16, 185, 129]; // #10B981
  const darkNavyBg: [number, number, number] = [15, 23, 42]; // #0F172A
  const cardLightBg: [number, number, number] = [248, 250, 252]; // #F8FAFC
  const borderLight: [number, number, number] = [226, 232, 240]; // #E2E8F0
  const textDark: [number, number, number] = [15, 23, 42]; // #0F172A
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748B
  const textSubtle: [number, number, number] = [148, 163, 184]; // #94A3B8

  // Calculate current period & progress
  const period = getCurrentEditingPeriodDetails(videos, contract, payments);

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

  // ==========================================
  // 1. TOP HEADER BANNER
  // ==========================================
  const headerHeight = 28;
  doc.setFillColor(darkNavyBg[0], darkNavyBg[1], darkNavyBg[2]);
  doc.roundedRect(margin, y, contentWidth, headerHeight, 3, 3, 'F');

  // Emerald left accent strip
  doc.setFillColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
  doc.rect(margin, y, 4, headerHeight, 'F');

  // Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(255, 255, 255);
  doc.text(reportTitle, margin + 8, y + 9.5);

  // Contract Name & Recipient
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Project / Contract: ${contract.name}`, margin + 8, y + 16.5);
  doc.text(`Recipient: ${clientOrEmployerName}`, margin + 8, y + 22.5);

  // Right side: Report Generated Date & Time + Period Start (NO cycle/milestone number)
  const now = new Date();
  const generatedDateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const generatedTimeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  doc.setFontSize(8);
  doc.setTextColor(textSubtle[0], textSubtle[1], textSubtle[2]);
  doc.text(`Generated: ${generatedDateStr} — ${generatedTimeStr}`, pageWidth - margin - 6, y + 10, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
  doc.text(`90-MINUTE EDITING PERIOD`, pageWidth - margin - 6, y + 16.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Editing Period Started: ${period.startDateFormatted}`, pageWidth - margin - 6, y + 22.5, { align: 'right' });

  y += headerHeight + 6;

  // ==========================================
  // 2. 90-MINUTE EDITING PERIOD STATUS CARD
  // ==========================================
  const cardHeight = 36;
  doc.setFillColor(cardLightBg[0], cardLightBg[1], cardLightBg[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, 'FD');

  // Title inside card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('90-MINUTE EDITING PERIOD STATUS', margin + 6, y + 7.5);

  // Percentage badge
  doc.setFontSize(9);
  doc.setTextColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
  doc.text(`${period.progressPercentage.toFixed(1)}% Completed`, pageWidth - margin - 6, y + 7.5, { align: 'right' });

  // Progress Bar
  const barY = y + 11;
  const barWidth = contentWidth - 12;
  const barHeight = 3.8;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(margin + 6, barY, barWidth, barHeight, 1.9, 1.9, 'F');

  const filledWidth = Math.max(2, (barWidth * Math.min(100, period.progressPercentage)) / 100);
  doc.setFillColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
  doc.roundedRect(margin + 6, barY, filledWidth, barHeight, 1.9, 1.9, 'F');

  // 3 Key Metrics Columns (All formatted in strict MM:SS)
  const metricColWidth = (contentWidth - 12) / 3;
  const metricY = y + 21;

  // Metric 1: Completed Runtime
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('COMPLETED RUNTIME', margin + 6, metricY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
  doc.text(period.completedFormatted, margin + 6, metricY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`of 90:00 target`, margin + 6, metricY + 11);

  // Metric 2: Remaining Runtime
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('REMAINING RUNTIME', margin + 6 + metricColWidth, metricY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(period.remainingFormatted, margin + 6 + metricColWidth, metricY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`to complete 90:00 block`, margin + 6 + metricColWidth, metricY + 11);

  // Metric 3: Carryover to Next Cycle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('CARRYOVER TO NEXT CYCLE', margin + 6 + metricColWidth * 2, metricY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const extraCarryoverFormatted = formatSecondsDigital(period.totalExtraCarryoverSeconds);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(extraCarryoverFormatted, margin + 6 + metricColWidth * 2, metricY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(period.totalExtraCarryoverSeconds > 0 ? 'Carried to next cycle' : 'None', margin + 6 + metricColWidth * 2, metricY + 11);

  y += cardHeight + 7;

  // ==========================================
  // 3. CONTRIBUTING VIDEOS TABLE
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`VIDEOS CONTRIBUTING TO THIS EDITING PERIOD (${period.contributions.length})`, margin, y);

  y += 4;

  // Column layout coordinates
  // Margin: 14, ContentWidth: 182
  const colX = {
    preview: margin + 2,      // width 16
    title: margin + 20,       // width 72
    total: margin + 94,       // width 22
    added: margin + 118,      // width 22
    extra: margin + 142,      // width 20
    date: margin + 164,       // width 18
  };

  // Table Header row
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  doc.text('PREVIEW', colX.preview, y + 4.8);
  doc.text('VIDEO TITLE', colX.title, y + 4.8);
  doc.text('TOTAL', colX.total, y + 4.8);
  doc.text('COUNTED', colX.added, y + 4.8);
  doc.text('CARRYOVER', colX.extra, y + 4.8);
  doc.text('DATE', colX.date, y + 4.8);

  y += 7;

  if (period.contributions.length === 0) {
    // Empty state row
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
      const rowHeight = 13.5;

      // Page break check (leave room for summary card)
      if (y + rowHeight > pageHeight - 45) {
        doc.addPage();
        y = margin;
      }

      // Zebra striping
      if (i % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.setLineWidth(0.15);
      doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

      // Thumbnail Image or clean placeholder
      const thumbB64 = thumbnailMap[contrib.videoId];
      if (thumbB64) {
        try {
          doc.addImage(thumbB64, 'JPEG', colX.preview, y + 1.8, 14, 9.5);
        } catch {
          doc.setFillColor(226, 232, 240);
          doc.roundedRect(colX.preview, y + 1.8, 14, 9.5, 1, 1, 'F');
        }
      } else {
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(colX.preview, y + 1.8, 14, 9.5, 1, 1, 'F');
      }

      // Render Video Title with complete Bangla / Unicode glyph shaping via Canvas Text Image
      const titleImg = renderUnicodeTextToCanvasImage(contrib.videoTitle, {
        fontSizePt: 8.5,
        fontWeight: 'bold',
        color: '#0F172A',
        maxWidthMm: 70,
        scale: 4,
      });

      if (titleImg.dataUrl) {
        try {
          doc.addImage(titleImg.dataUrl, 'PNG', colX.title, y + 1.5, titleImg.widthMm, titleImg.heightMm);
        } catch {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(textDark[0], textDark[1], textDark[2]);
          doc.text(contrib.videoTitle.slice(0, 32), colX.title, y + 6);
        }
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(contrib.videoTitle.slice(0, 32), colX.title, y + 6);
      }

      // YouTube verified notice
      if (contrib.youtubeUrl) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text('YouTube Verified', colX.title, y + 10.5);
      }

      // Total Runtime (MM:SS)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(contrib.originalDurationFormatted, colX.total, y + 7);

      // Added / Credited Runtime (MM:SS)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
      doc.text(contrib.contributionFormatted, colX.added, y + 7);

      // Extra / Carryover Runtime (MM:SS or "—")
      if (contrib.extraSecondsToNextPeriod > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(14, 165, 233); // Sky-500
        doc.text(contrib.extraFormattedToNextPeriod, colX.extra, y + 7);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text('—', colX.extra + 3, y + 7);
      }

      // Date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(contrib.completionDate || '—', colX.date, y + 7);

      y += rowHeight;
    }
  }

  y += 6;

  // ==========================================
  // 4. SUMMARY CARD (NO FINANCIAL / NO 540M)
  // ==========================================
  const summaryHeight = 22;
  if (y + summaryHeight > pageHeight - 20) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(cardLightBg[0], cardLightBg[1], cardLightBg[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, summaryHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('SUMMARY', margin + 6, y + 6.5);

  const sumColWidth = (contentWidth - 12) / 3;
  const sumMetricY = y + 11.5;

  // Summary Completed Runtime
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('COMPLETED RUNTIME:', margin + 6, sumMetricY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
  doc.text(period.completedFormatted, margin + 6 + 36, sumMetricY);

  // Summary Remaining Runtime
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('REMAINING RUNTIME:', margin + 6 + sumColWidth, sumMetricY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(period.remainingFormatted, margin + 6 + sumColWidth + 36, sumMetricY);

  // Summary Extra / Carryover
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('EXTRA / CARRYOVER:', margin + 6 + sumColWidth * 2, sumMetricY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(formatSecondsDigital(period.totalExtraCarryoverSeconds), margin + 6 + sumColWidth * 2 + 36, sumMetricY);

  // ==========================================
  // 5. OFFICIAL FOOTER NOTE
  // ==========================================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    'This is an official video editing runtime progress verification report. Minutes carry forward dynamically.',
    margin,
    pageHeight - margin + 2
  );

  doc.text(
    `Page ${doc.getNumberOfPages()} of ${doc.getNumberOfPages()}`,
    pageWidth - margin,
    pageHeight - margin + 2,
    { align: 'right' }
  );

  // Save / Download PDF
  const cleanDate = new Date().toISOString().split('T')[0];
  const sanitizedContractName = contract.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Video_Editing_Progress_Report_${sanitizedContractName}_${cleanDate}.pdf`;
  doc.save(filename);
}
