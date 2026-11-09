"use client";

import React, { useState, useSyncExternalStore } from "react";
import { BirthFormData } from "./BirthForm";
import { Bookmark, Trash2, Plus, Users, Check } from "lucide-react";
import { useIsMounted } from "@/lib/hooks/useIsMounted";

interface SavedProfile {
  id: string;
  name: string;
  data: BirthFormData;
  savedAt: string;
}

interface ProfilesManagerProps {
  currentData: BirthFormData;
  onSelectProfile: (data: BirthFormData) => void;
}

const STORAGE_KEY = "celestia_saved_profiles";

// Store listeners for reactivity
const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

let cachedRaw: string | null = null;
let cachedProfiles: SavedProfile[] = [];
const emptyProfiles: SavedProfile[] = [];

function isSavedProfile(value: unknown): value is SavedProfile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedProfile>;
  const data = candidate.data as Partial<BirthFormData> | undefined;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.savedAt === "string" &&
    !!data &&
    typeof data.fullName === "string" &&
    typeof data.birthDate === "string" &&
    typeof data.birthTime === "string" &&
    typeof data.isTimeUnknown === "boolean" &&
    typeof data.cityName === "string" &&
    typeof data.country === "string" &&
    typeof data.latitude === "number" &&
    Number.isFinite(data.latitude) &&
    typeof data.longitude === "number" &&
    Number.isFinite(data.longitude) &&
    typeof data.timezoneOffset === "number" &&
    Number.isFinite(data.timezoneOffset) &&
    ["Placidus", "Equal", "WholeSign"].includes(data.houseSystem || "")
  );
}

function getSnapshot(): SavedProfile[] {
  if (typeof window === "undefined") return emptyProfiles;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedProfiles;
  cachedRaw = raw;
  if (!raw) {
    cachedProfiles = emptyProfiles;
    return cachedProfiles;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    cachedProfiles = Array.isArray(parsed) ? parsed.filter(isSavedProfile) : emptyProfiles;
    return cachedProfiles;
  } catch {
    // Keep the original localStorage value untouched; show an empty safe snapshot.
    cachedProfiles = emptyProfiles;
    return cachedProfiles;
  }
}

function getServerSnapshot(): SavedProfile[] {
  return emptyProfiles;
}

function updateStorage(profiles: SavedProfile[]): boolean {
  try {
    const raw = JSON.stringify(profiles);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedProfiles = profiles;
    listeners.forEach((listener) => listener());
    return true;
  } catch (e) {
    console.error("Failed to update stored profiles:", e);
    return false;
  }
}

export function ProfilesManager({ currentData, onSelectProfile }: ProfilesManagerProps) {
  const isMounted = useIsMounted();
  const profiles = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);
  const [profileLabel, setProfileLabel] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const saveCurrentProfile = () => {
    const label = profileLabel.trim() || currentData.fullName || "My Birth Chart";
    const newProfile: SavedProfile = {
      id: Date.now().toString(),
      name: label,
      data: currentData,
      savedAt: new Date().toISOString().split("T")[0],
    };

    const updated = [newProfile, ...profiles.filter((p) => p.name !== label)];
    const saved = updateStorage(updated);
    if (!saved) {
      setFeedback("Could not save profile. Check device storage.");
      return;
    }

    setProfileLabel("");
    setFeedback("Saved " + label + " on this device");
    setTimeout(() => setFeedback(null), 2500);
  };

  const deleteProfile = (id: string) => {
    const updated = profiles.filter((p) => p.id !== id);
    if (!updateStorage(updated)) {
      setFeedback("Could not delete profile. Check device storage.");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
        title="Saved Birth Charts"
      >
        <Users className="w-3.5 h-3.5 text-amber-400" />
        <span suppressHydrationWarning>Profiles ({isMounted ? profiles.length : 0})</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              Saved Natal Charts
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close saved profiles"
              className="text-slate-400 hover:text-slate-200 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded"
            >
              ✕
            </button>
          </div>

          {/* Quick Save Current */}
          <div className="space-y-1.5">
            <label htmlFor="celestia-profile-label" className="text-[11px] text-slate-400 block">Save Current Entry</label>
            <div className="flex items-center gap-1.5">
              <input
                id="celestia-profile-label"
                type="text"
                placeholder={currentData.fullName || "Profile Name"}
                value={profileLabel}
                onChange={(e) => setProfileLabel(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={saveCurrentProfile}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs flex items-center gap-1 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <Plus className="w-3 h-3" />
                Save
              </button>
            </div>
            {feedback && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {feedback}
              </span>
            )}
          </div>

          {/* List of Profiles */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
            <span className="text-[11px] text-slate-400 block">Switch Active Profile</span>
            {profiles.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-2 text-center">No saved profiles yet</p>
            ) : (
              profiles.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-amber-500/30 group transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProfile(p.data);
                      setIsOpen(false);
                    }}
                    aria-label={"Select profile " + p.name}
                    className="min-w-0 flex-1 text-left p-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                  >
                    <span className="text-xs text-slate-200 font-medium block truncate group-hover:text-amber-300">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {p.data.birthDate} · {p.data.cityName}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProfile(p.id)}
                    className="text-slate-400 hover:text-rose-400 p-1 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400 rounded"
                    title="Delete profile"
                    aria-label={"Delete profile " + p.name}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
