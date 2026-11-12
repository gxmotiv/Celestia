import {
  calculateOfflineAstrology,
  type OfflineBirthInput,
} from "../../lib/android/offlineCalculation";

declare global {
  interface Window {
    CelestiaOffline?: {
      calculate(input: OfflineBirthInput): ReturnType<typeof calculateOfflineAstrology>;
      version: string;
    };
  }
}

window.CelestiaOffline = {
  calculate: calculateOfflineAstrology,
  version: "0.1.0-offline",
};
