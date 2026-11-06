"use client";

import React, { useState, useRef } from "react";
import { WesternChartData } from "@/lib/astronomy/ephemeris";
import { VedicChartData } from "@/lib/astronomy/vedic";
import { NumerologyProfile } from "@/lib/astronomy/numerology";
import { BaZiProfile } from "@/lib/astronomy/chinese";
import { PrintDossier } from "@/components/PrintDossier";
import {
  generateAndDownloadPdf,
  downloadStandaloneHtml,
} from "@/lib/pdf/generatePdf";
import {
  Printer,
  X,
  FileText,
  Layers,
  Check,
  Eye,
  Download,
  Sparkles,
  Loader2,
  FileDown,
  AlertCircle,
  Award,
} from "lucide-react";

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  western: WesternChartData;
  vedic: VedicChartData;
  numerology: NumerologyProfile;
  chinese: BaZiProfile;
  formData: {
    fullName: string;
    birthDate: string;
    birthTime: string;
    cityName: string;
    country: string;
    latitude: number;
    longitude: number;
    timezoneOffset: number;
    houseSystem: string;
  };
  activeTab: string;
}

export function PrintModal({
  isOpen,
  onClose,
  western,
  vedic,
  numerology,
  chinese,
  formData,
  activeTab,
}: PrintModalProps) {
  const [printMode, setPrintMode] = useState<"complete" | "active">("complete");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState("");
  const [pdfProgressPercent, setPdfProgressPercent] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dossierContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const safeSubjectName = (formData.fullName || "Cosmic_Soul")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileNamePdf = `Celestia_MultiSystem_Astrology_Report_${safeSubjectName}.pdf`;
  const fileNameHtml = `Celestia_MultiSystem_Astrology_Report_${safeSubjectName}.html`;

  // 1. Dual-Engine PDF Generation (Server-Side Vector PDFKit + Client Fallback)
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setErrorMessage(null);
      setDownloadSuccess(false);
      setPdfProgressText("Preparing chart calculations...");
      setPdfProgressPercent(20);

      // Attempt Server-Side Vector PDF Generation via API
      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userData: formData,
          western,
          vedic,
          numerology,
          chinese,
        }),
      });

      if (response.ok) {
        setPdfProgressText("Compiling Vector PDF Report...");
        setPdfProgressPercent(75);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement("a");
        downloadAnchor.href = url;
        downloadAnchor.download = fileNamePdf;
        downloadAnchor.style.display = "none";
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();

        setTimeout(() => {
          document.body.removeChild(downloadAnchor);
          URL.revokeObjectURL(url);
        }, 3000);

        setPdfProgressText("Download Complete!");
        setPdfProgressPercent(100);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 5000);
        return;
      }

      // If Server Route returned non-200, fallback to Client-side html2canvas-pro + jsPDF
      console.warn("Server generation returned error, falling back to client-side renderer...");
      setPdfProgressText("Rendering High-Resolution Layout...");
      setPdfProgressPercent(45);

      if (dossierContainerRef.current) {
        await generateAndDownloadPdf(dossierContainerRef.current, {
          fileName: fileNamePdf,
          onProgress: (text, pct) => {
            setPdfProgressText(text);
            setPdfProgressPercent(pct);
          },
        });
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 5000);
      }
    } catch (err: unknown) {
      console.error("Server PDF generation failed, attempting client fallback:", err);

      try {
        if (dossierContainerRef.current) {
          setPdfProgressText("Rendering Client Document...");
          await generateAndDownloadPdf(dossierContainerRef.current, {
            fileName: fileNamePdf,
            onProgress: (text, pct) => {
              setPdfProgressText(text);
              setPdfProgressPercent(pct);
            },
          });
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 5000);
        } else {
          setErrorMessage("Could not generate PDF. Please try 'Save HTML' below.");
        }
      } catch (fallbackErr) {
        console.error("All PDF generation paths failed:", fallbackErr);
        setErrorMessage("Direct PDF creation encountered an error. You can click 'Save HTML' for instant export.");
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Direct Standalone HTML Document Download
  const handleDownloadHtml = () => {
    if (!dossierContainerRef.current) return;
    try {
      const htmlContent = dossierContainerRef.current.innerHTML;
      downloadStandaloneHtml(htmlContent, fileNameHtml);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error("HTML Export failed:", err);
      setErrorMessage("Could not export HTML document.");
    }
  };

  // 3. Browser Print Dialog
  const handleBrowserPrint = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md no-print animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif-celestial font-bold text-slate-100 flex items-center gap-2">
                Download Professional Multi-System Astrological Report
              </h2>
              <p className="text-xs text-slate-400">
                10-Section Publication-Grade Dossier (Western, Vedic, Hellenistic, BaZi, Numerology & Predictive Timeline)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Controls & Interactive Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-950/40">
          {/* Main Action Banner */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
            {/* Scope Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Scope:</span>
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPrintMode("complete")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    printMode === "complete"
                      ? "bg-amber-500 text-slate-950 font-semibold shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Complete Multi-System Report (All 10 Sections)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintMode("active")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    printMode === "active"
                      ? "bg-amber-500 text-slate-950 font-semibold shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Active Tab Only ({activeTab.toUpperCase()})</span>
                </button>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* PRIMARY: Direct PDF Download */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                title="Generates and directly downloads a professional multi-page .pdf file"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isGeneratingPdf ? "Generating Report..." : "Download Full PDF Report (.pdf)"}</span>
              </button>

              {/* SECONDARY: Standalone HTML */}
              <button
                type="button"
                onClick={handleDownloadHtml}
                disabled={isGeneratingPdf}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Saves complete standalone HTML document with full styling"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Save HTML</span>
              </button>

              {/* SECONDARY: Browser Print */}
              <button
                type="button"
                onClick={handleBrowserPrint}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open browser print dialog"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Dialog</span>
              </button>
            </div>
          </div>

          {/* Progress or Feedback Notification */}
          {isGeneratingPdf && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-amber-300 font-medium">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {pdfProgressText || "Compiling publication-grade report..."}
                </span>
                <span className="font-mono">{pdfProgressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${pdfProgressPercent}%` }}
                />
              </div>
            </div>
          )}

          {downloadSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <strong>Report Generated & Downloaded!</strong> Please check your browser&apos;s Downloads folder.
              </span>
              <span className="text-[11px] text-emerald-400/80 font-mono">{fileNamePdf}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-200 underline ml-2 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Print Preview Container */}
          <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-900/60 p-2 sm:p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-2 pb-2 border-b border-slate-800 mb-4">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Publication Report Layout Preview (10 Comprehensive Sections)
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline flex items-center gap-1">
                A4 Portrait · Vector chart calculations
              </span>
            </div>

            {/* Document Rendered in White Sheet Container */}
            <div className="bg-white rounded-lg shadow-2xl overflow-x-auto max-h-[56vh] overflow-y-auto border border-slate-300 p-2 sm:p-6 text-slate-900">
              <div ref={dossierContainerRef} className="w-full">
                <PrintDossier
                  western={western}
                  vedic={vedic}
                  numerology={numerology}
                  chinese={chinese}
                  formData={formData}
                  printMode={printMode}
                  activeTab={activeTab}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Harmonized Across Western · Vedic · Hellenistic · Sidereal · BaZi · Universal Numerology</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPdf ? "Building PDF..." : "Download Full PDF Report"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
