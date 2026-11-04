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

function getSnapshot(): SavedProfile[] {
  if (typeof window === "undefined") return emptyProfiles;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedProfiles;
    cachedRaw = raw;
    cachedProfiles = raw ? JSON.parse(raw) : [];
    return cachedProfiles;
  } catch {
    return emptyProfiles;
  }
}

function getServerSnapshot(): SavedProfile[] {
  return emptyProfiles;
}

function updateStorage(profiles: SavedProfile[]) {
  try {
    const raw = JSON.stringify(profiles);
    cachedRaw = raw;
    cachedProfiles = profiles;
    localStorage.setItem(STORAGE_KEY, raw);
  } catch (e) {
    console.error("Failed to update stored profiles:", e);
  }
  listeners.forEach((listener) => listener());
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
    updateStorage(updated);

    setProfileLabel("");
    setFeedback(`Saved "${label}"`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const deleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = profiles.filter((p) => p.id !== id);
    updateStorage(updated);
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
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </div>

          {/* Quick Save Current */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 block">Save Current Entry</span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder={currentData.fullName || "Profile Name"}
                value={profileLabel}
                onChange={(e) => setProfileLabel(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={saveCurrentProfile}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs flex items-center gap-1 cursor-pointer"
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
                  onClick={() => {
                    onSelectProfile(p.data);
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/30 cursor-pointer group transition-colors"
                >
                  <div className="truncate pr-2">
                    <span className="text-xs text-slate-200 font-medium block truncate group-hover:text-amber-300">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {p.data.birthDate} · {p.data.cityName}
                    </span>
                  </div>
                  <button
                    onClick={(e) => deleteProfile(p.id, e)}
                    className="text-slate-400 hover:text-rose-400 p-1 opacity-60 group-hover:opacity-100 transition-opacity"
                    title="Delete profile"
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
