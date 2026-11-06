"use client";

import React from "react";
import { BaZiProfile, PillarData } from "@/lib/astronomy/chinese";
import { Sparkles, HeartHandshake, ShieldAlert, Award, Compass, Flame } from "lucide-react";

interface ChineseViewProps {
  baziData: BaZiProfile;
}

export function ChineseView({ baziData }: ChineseViewProps) {
  const elementColors: Record<string, { bg: string; text: string; bar: string; border: string }> = {
    Wood: { bg: "bg-emerald-500/10", text: "text-emerald-400", bar: "bg-emerald-500", border: "border-emerald-500/30" },
    Fire: { bg: "bg-red-500/10", text: "text-red-400", bar: "bg-red-500", border: "border-red-500/30" },
    Earth: { bg: "bg-amber-500/10", text: "text-amber-400", bar: "bg-amber-500", border: "border-amber-500/30" },
    Metal: { bg: "bg-slate-200/10", text: "text-slate-200", bar: "bg-slate-300", border: "border-slate-300/30" },
    Water: { bg: "bg-blue-500/10", text: "text-blue-400", bar: "bg-blue-500", border: "border-blue-500/30" },
  };

  const renderPillarCard = (pillar: PillarData, isDayMaster = false) => {
    const stemColor = elementColors[pillar.stem.element];
    const branchColor = elementColors[pillar.branch.element];

    return (
      <div
        className={`p-4 rounded-xl border flex flex-col items-center justify-between text-center relative ${
          isDayMaster
            ? "bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30"
            : "bg-slate-950/80 border-slate-800"
        }`}
      >
        {isDayMaster && (
          <span className="absolute -top-2.5 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Day Master (Self)
          </span>
        )}

        <span className="text-xs font-semibold text-slate-400 block mb-2">
          {pillar.pillarName} Pillar
        </span>

        {/* Heavenly Stem */}
        <div className="my-2 space-y-1">
          <div
            className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl font-serif font-bold mx-auto border ${stemColor.bg} ${stemColor.border} ${stemColor.text}`}
          >
            {pillar.stem.chinese}
          </div>
          <span className="text-xs font-semibold text-slate-200 block">
            {pillar.stem.pinyin} ({pillar.stem.name})
          </span>
          <span className={`text-[10px] font-medium block ${stemColor.text}`}>
            {pillar.stem.polarity} {pillar.stem.element}
          </span>
        </div>

        {/* Earthly Branch */}
        <div className="my-2 space-y-1">
          <div
            className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl font-serif font-bold mx-auto border ${branchColor.bg} ${branchColor.border} ${branchColor.text}`}
          >
            {pillar.branch.chinese}
          </div>
          <span className="text-xs font-semibold text-slate-200 block">
            {pillar.branch.pinyin} ({pillar.branch.animal})
          </span>
          <span className={`text-[10px] font-medium block ${branchColor.text}`}>
            {pillar.branch.polarity} {pillar.branch.element}
          </span>
        </div>

        {/* Hidden Stems */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 w-full text-[10px] text-slate-400">
          <span className="text-slate-400 block">Hidden Stems:</span>
          <span className="font-mono text-slate-300">
            {pillar.branch.hiddenStems.join(" · ")}
          </span>
        </div>

        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
          {pillar.significance}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Zodiac Animal</span>
          <span className="text-sm font-semibold text-amber-400 block">{baziData.zodiacAnimal}</span>
          <span className="text-[11px] text-slate-400">{baziData.yearPillar.combinedName}</span>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Day Master (Core Self)</span>
          <span className="text-sm font-semibold text-slate-100 block">
            {baziData.dayMaster.stem.name} ({baziData.dayMaster.stem.chinese})
          </span>
          <span className="text-[11px] text-emerald-400">{baziData.dayMaster.symbol}</span>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Day Master Strength</span>
          <span className="text-sm font-semibold text-slate-100 block">{baziData.dayMaster.strength}</span>
          <span className="text-[11px] text-amber-400/90">Balanced by Wu Xing</span>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Yin / Yang Polarity</span>
          <span className="text-sm font-semibold text-slate-100 block">
            {baziData.yinYangRatio.yang}% Yang / {baziData.yinYangRatio.yin}% Yin
          </span>
          <span className="text-[11px] text-slate-400">Dynamic Universal Flow</span>
        </div>
      </div>

      {/* Four Pillars of Destiny (BaZi Grid) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-400" />
            Four Pillars of Destiny (八字 BaZi Matrix)
          </h3>
          <span className="text-xs text-slate-400">Hour · Day · Month · Year</span>
        </div>

        {baziData.calculationContext && (
          <p className="text-[11px] text-slate-400">
            Clock: <span className="text-amber-300">{baziData.calculationContext.timeBasis}</span>
            {" · "}Zi rollover: <span className="text-amber-300">{baziData.calculationContext.dayBoundaryPolicy}</span>
            {" · "}Solar clock: <span className="font-mono">{baziData.calculationContext.solarClockIso}</span>
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderPillarCard(baziData.hourPillar)}
          {renderPillarCard(baziData.dayPillar, true)}
          {renderPillarCard(baziData.monthPillar)}
          {renderPillarCard(baziData.yearPillar)}
        </div>
      </div>

      {/* Day Master Analysis & Five Elements Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Day Master Profile (7 cols) */}
        <div className="lg:col-span-7 p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-400 font-semibold block mb-0.5">Core Identity</span>
              <h3 className="text-base font-bold text-slate-100">
                {baziData.dayMaster.symbol}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded">
              {baziData.dayMaster.strength} Day Master
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {baziData.dayMaster.nature}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
              <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                Favorable Elements (Yong Shen)
              </span>
              <ul className="text-xs text-slate-300 space-y-1">
                {baziData.dayMaster.favorableElements.map((el, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-emerald-500">·</span> {el}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
              <span className="text-[11px] font-semibold text-rose-400 block mb-1">
                Cautionary Excess
              </span>
              <ul className="text-xs text-slate-300 space-y-1">
                {baziData.dayMaster.unfavorableElements.map((el, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-rose-500">·</span> {el}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Five Elements (Wu Xing) Distribution (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Five Elements (Wu Xing 五行) Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Harmonic balance weighted across Stems and Earthly Branches
            </p>
          </div>

          <div className="space-y-3">
            {(["Wood", "Fire", "Earth", "Metal", "Water"] as const).map((elem) => {
              const pct = baziData.elementsBalance[elem] || 0;
              const col = elementColors[elem];
              return (
                <div key={elem} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${col.text}`}>{elem}</span>
                    <span className="text-slate-400 tabular-nums">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${col.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Animal Profile & Compatibility */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Chinese Zodiac Affinity & Compatibility ({baziData.zodiacAnimal})
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {baziData.animalCharacteristics}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* San He Trines */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
            <span className="text-[11px] font-semibold text-amber-400 block">
              San He (Three Harmonies Trine)
            </span>
            <p className="text-xs font-semibold text-slate-200">
              {baziData.compatibilities.sanHeTrine.join(" & ")}
            </p>
            <p className="text-[11px] text-slate-400">
              Natural soul allies and supreme collaborative partners.
            </p>
          </div>

          {/* Liu He Secret Friend */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 block">
              Liu He (Secret Friend)
            </span>
            <p className="text-xs font-semibold text-slate-200">
              {baziData.compatibilities.liuHeFriend}
            </p>
            <p className="text-[11px] text-slate-400">
              Deep, unspoken affinity offering protection in challenging years.
            </p>
          </div>

          {/* Clash Sign */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
            <span className="text-[11px] font-semibold text-rose-400 block">
              Chong (Dynamic Clash Sign)
            </span>
            <p className="text-xs font-semibold text-slate-200">
              {baziData.compatibilities.clashSign}
            </p>
            <p className="text-[11px] text-slate-400">
              Forces evolutionary breakthrough through dynamic tension.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
