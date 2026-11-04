"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export interface GeneratePdfOptions {
  fileName?: string;
  onProgress?: (progressText: string, percent: number) => void;
}

/**
 * High-Fidelity Multi-Page PDF Generator
 * Powered by html2canvas-pro with full modern CSS color support (oklch, lab, color, rgb)
 * and jsPDF for compiling clean, printable A4 pages.
 */
export async function generateAndDownloadPdf(
  containerElement: HTMLElement,
  options: GeneratePdfOptions = {}
): Promise<boolean> {
  const { fileName = "Celestia_Astrological_Dossier.pdf", onProgress } = options;

  try {
    onProgress?.("Initializing PDF Engine...", 10);

    // Initialize A4 PDF: 210mm x 297mm (portrait)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const printableWidth = pageWidth - margin * 2; // 190mm
    const printableHeight = pageHeight - margin * 2; // 277mm

    onProgress?.("Capturing document layout...", 25);

    // Ensure container is unconstrained for capture
    const originalOverflow = containerElement.style.overflow;
    containerElement.style.overflow = "visible";

    // html2canvas-pro natively supports oklch() colors used by Tailwind CSS v4
    const canvas = await html2canvas(containerElement, {
      scale: 1.5, // 1.5x resolution delivers crisp text and charts
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1024,
      scrollY: 0,
      scrollX: 0,
    });

    containerElement.style.overflow = originalOverflow;

    onProgress?.("Formatting multi-page layout...", 50);

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const imgWidth = printableWidth;
    const imgHeight = (canvas.height * printableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= printableHeight;

    let pageNum = 1;
    // Subsequent pages
    while (heightLeft > 0) {
      position -= printableHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= printableHeight;
      pageNum++;
      onProgress?.(`Composing page ${pageNum}...`, Math.min(50 + pageNum * 8, 90));
    }

    onProgress?.("Packaging & downloading PDF...", 95);

    // Generate binary Blob and trigger direct browser download
    const blob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = fileName;
    downloadAnchor.style.display = "none";
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();

    setTimeout(() => {
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(blobUrl);
    }, 3000);

    onProgress?.("PDF Download Complete!", 100);
    return true;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
}

/**
 * Standalone Offline HTML Document Exporter
 * Generates an all-in-one HTML file with styles and content that can be opened anywhere
 * and saved/printed as PDF natively with 100% vector fidelity.
 */
export function downloadStandaloneHtml(
  contentHtml: string,
  fileName: string = "Celestia_Astrological_Dossier.html"
): void {
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Celestia Multi-System Astrological Dossier</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 24px; line-height: 1.5; font-size: 11pt; }
    .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
    .print-page-break { break-before: page; page-break-before: always; }
    .print-card { border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; padding: 12px; margin-bottom: 12px; }
    .print-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 8px; }
    .print-table th, .print-table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    .print-table th { background: #f1f5f9; font-weight: 600; color: #1e293b; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .gap-4 { gap: 16px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .font-mono { font-family: monospace; }
    .font-serif { font-family: Georgia, Cambria, "Times New Roman", Times, serif; }
    .text-amber-800 { color: #92400e; }
    .text-slate-500 { color: #64748b; }
    .text-slate-600 { color: #475569; }
    .text-slate-700 { color: #334155; }
    .text-slate-900 { color: #0f172a; }
    .text-slate-950 { color: #020617; }
    .border-b-2 { border-bottom: 2px solid #0f172a; }
    .bg-slate-900 { background-color: #0f172a; color: #fff; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 2000);
}
