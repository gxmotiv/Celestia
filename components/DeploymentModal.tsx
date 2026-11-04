"use client";

import React, { useState } from "react";
import { X, Globe, Terminal, Copy, Check, ExternalLink, Cloud } from "lucide-react";

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeploymentModal({ isOpen, onClose }: DeploymentModalProps) {
  const [activeTab, setActiveTab] = useState<"github" | "vercel" | "netlify">("github");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">
                100% Free Hosting & Deployment Guide
              </h2>
              <p className="text-xs text-slate-400">
                Deploy this complete client-side astrology application with zero server cost.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab("github")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "github"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>GitHub Pages (Static)</span>
          </button>

          <button
            onClick={() => setActiveTab("vercel")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "vercel"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Vercel (Free Tier)</span>
          </button>

          <button
            onClick={() => setActiveTab("netlify")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "netlify"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Netlify (Free Tier)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 text-xs text-slate-300 leading-relaxed">
          {activeTab === "github" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100">
                Option 1: Deploying to GitHub Pages (100% Free Forever)
              </h3>
              <p>
                Since all astronomical and astrological calculations (VSOP87 planetary orbits, Lahiri Ayanamsa, BaZi pillars, and Pythagorean ciphers) run 100% client-side in the browser, you can host it as a pure static site on GitHub Pages.
              </p>

              <div className="space-y-2">
                <span className="font-semibold text-slate-200 block">Step 1: Set output to static export in Next.js</span>
                <p className="text-slate-400">
                  In <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded font-mono">next.config.ts</code>, set <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded font-mono">output: &apos;export&apos;</code>.
                </p>
                <div className="relative p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-slate-300">
                  <pre>{`const nextConfig = {
  output: 'export',
  images: { unoptimized: true }
};`}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-200 block">Step 2: Build and deploy using gh-pages</span>
                <div className="relative p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-slate-300 flex items-center justify-between">
                  <code>npm run build && npx gh-pages -d out</code>
                  <button
                    onClick={() => copyToClipboard("npm run build && npx gh-pages -d out", "gh_cmd")}
                    className="p-1 hover:text-amber-400"
                  >
                    {copiedCode === "gh_cmd" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <p className="text-slate-400">
                In your GitHub repository settings, navigate to <strong>Pages</strong>, select the <code className="text-amber-300 font-mono">gh-pages</code> branch, and your site is live!
              </p>
            </div>
          )}

          {activeTab === "vercel" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100">
                Option 2: Deploying to Vercel (Recommended 1-Click Setup)
              </h3>
              <p>
                Vercel is the creator of Next.js and offers a permanent free tier with automatic HTTPS, edge network distribution, and instant GitHub continuous integration.
              </p>

              <ol className="space-y-3 list-decimal list-inside text-slate-300">
                <li>
                  Push your code to a public or private GitHub repository:
                  <div className="my-1.5 p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-slate-300 flex items-center justify-between">
                    <code>git push origin main</code>
                    <button
                      onClick={() => copyToClipboard("git push origin main", "vercel_push")}
                      className="p-1 hover:text-amber-400"
                    >
                      {copiedCode === "vercel_push" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </li>
                <li>
                  Go to <strong className="text-amber-400">vercel.com/new</strong> and import your GitHub repo.
                </li>
                <li>
                  Vercel auto-detects Next.js. Optionally add <code className="text-amber-300 font-mono">GEMINI_API_KEY</code> to the Environment Variables section if you want AI cosmic syntheses enabled.
                </li>
                <li>
                  Click <strong>Deploy</strong>. Your application is live within 60 seconds at a free <code className="text-amber-300 font-mono">.vercel.app</code> domain.
                </li>
              </ol>
            </div>
          )}

          {activeTab === "netlify" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100">
                Option 3: Deploying to Netlify (Free Tier)
              </h3>
              <p>
                Netlify provides generous free bandwidth, custom domain support, and native Next.js build runtime.
              </p>

              <div className="space-y-2">
                <span className="font-semibold text-slate-200 block">Deploy via Netlify CLI:</span>
                <div className="relative p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-slate-300 flex items-center justify-between">
                  <code>npx netlify deploy --prod</code>
                  <button
                    onClick={() => copyToClipboard("npx netlify deploy --prod", "netlify_cli")}
                    className="p-1 hover:text-amber-400"
                  >
                    {copiedCode === "netlify_cli" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <p className="text-slate-400">
                Or drag and drop your exported <code className="text-amber-300 font-mono">out/</code> folder directly onto Netlify&apos;s web dashboard for immediate zero-config deployment.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            No database, subscription, or paid tier required.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
