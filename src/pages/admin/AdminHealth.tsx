import React, { useState, useEffect } from "react";
import { Activity, Download, Upload, RotateCcw, Database, HardDrive, ShieldCheck, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { storageService } from "../../services/storage";

export const AdminHealth: React.FC = () => {
  const [stats, setStats] = useState({
    movies: 0,
    shows: 0,
    bookings: 0,
    screens: 0,
    banners: 0,
    auditLogs: 0,
    storageUsedBytes: 0,
  });
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const calculateStats = () => {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("lxm_")) {
        totalBytes += (localStorage.getItem(key) || "").length * 2; // utf-16
      }
    }

    setStats({
      movies: storageService.getMovies().length,
      shows: storageService.getShows().length,
      bookings: storageService.getBookings().length,
      screens: storageService.getScreens().length,
      banners: storageService.getBanners().length,
      auditLogs: storageService.getAuditLogs().length,
      storageUsedBytes: totalBytes,
    });
  };

  useEffect(() => {
    calculateStats();
  }, []);

  const handleExportBackup = () => {
    const jsonStr = storageService.exportDatabase();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LaxmiCineplex_Backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback({ type: "success", text: "Database backup successfully exported to your computer!" });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = storageService.importDatabase(content, "rajanbhogta");
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        calculateStats();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
      setTimeout(() => setFeedback(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (confirm("WARNING: Are you sure you want to reset the cinema database back to factory initial values? (This will clear bookings)")) {
      storageService.resetDatabaseToDefaults("rajanbhogta");
      calculateStats();
      setFeedback({ type: "success", text: "Cinema database reset to initial defaults." });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white font-cinema tracking-wide flex items-center gap-2">
          <Activity className="w-7 h-7 text-red-500" />
          <span>Database & System Health</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Monitor browser persistence integrity, database backup/restore operations, and table record counts.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/40 border-red-500/40 text-red-300"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)}>&times;</button>
        </div>
      )}

      {/* Storage and System Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">Movies</span>
          <p className="text-2xl font-black text-white mt-1">{stats.movies}</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">Shows</span>
          <p className="text-2xl font-black text-white mt-1">{stats.shows}</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">Bookings</span>
          <p className="text-2xl font-black text-white mt-1">{stats.bookings}</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">Screens</span>
          <p className="text-2xl font-black text-white mt-1">{stats.screens}</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">Banners</span>
          <p className="text-2xl font-black text-white mt-1">{stats.banners}</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">Audit Logs</span>
          <p className="text-2xl font-black text-white mt-1">{stats.auditLogs}</p>
        </div>
      </div>

      {/* Database Backup & Maintenance Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Export Full Backup</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Generate a standalone, encrypted JSON database export containing all movies, shows, customers, bookings, and configuration.
            </p>
          </div>
          <button
            onClick={handleExportBackup}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON Backup</span>
          </button>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Restore from Backup</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Upload a previously exported Laxmi Cineplex JSON backup file to restore full system records.
            </p>
          </div>
          <label className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-950">
            <Upload className="w-4 h-4" />
            <span>Select Backup File</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Reset to Initial Defaults</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Re-initializes initial sample movies, screens (Screen 1 & 2), coupons, and settings while clearing test bookings.
            </p>
          </div>
          <button
            onClick={handleResetDefaults}
            className="w-full py-2.5 bg-zinc-800 hover:bg-red-950/60 hover:text-red-300 text-zinc-300 rounded-xl text-xs font-semibold transition border border-zinc-700 hover:border-red-500/40"
          >
            Reset Database
          </button>
        </div>
      </div>

      {/* System Integrity Info */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3 text-xs">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Storage Engine Details</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-400">
          <div>Storage Engine: <strong className="text-zinc-200">Local Reactive Persistence (HTML5 Web Storage)</strong></div>
          <div>Storage Quota Usage: <strong className="text-zinc-200">{(stats.storageUsedBytes / 1024).toFixed(2)} KB</strong></div>
          <div>Location: <strong className="text-zinc-200">Hazaribagh, Jharkhand, India</strong></div>
          <div>Timezone: <strong className="text-zinc-200">Asia/Kolkata (IST)</strong></div>
        </div>
      </div>
    </div>
  );
};