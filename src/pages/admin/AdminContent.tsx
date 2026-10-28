import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { HeroBanner, Announcement } from '../../types';
import { Megaphone, Image as ImageIcon, Plus, Trash2, CheckCircle, AlertCircle, X, Edit2 } from 'lucide-react';

export const AdminContent: React.FC = () => {
  const [banners, setBanners] = useState<HeroBanner[]>(() => storageService.getBanners());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => storageService.getAnnouncements());

  const [newNotice, setNewNotice] = useState('');
  const [newBadge, setNewBadge] = useState('OFFER');
  const [newLinkText, setNewLinkText] = useState('Book Now');
  const [newLinkUrl, setNewLinkUrl] = useState('/movies');

  const refreshContent = () => {
    setBanners(storageService.getBanners());
    setAnnouncements(storageService.getAnnouncements());
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.trim()) return;

    const ann: Announcement = {
      id: `ann-${Date.now().toString(36)}`,
      message: newNotice.trim(),
      badge: newBadge,
      linkText: newLinkText.trim() || undefined,
      linkUrl: newLinkUrl.trim() || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [ann, ...announcements];
    storageService.saveAnnouncements(updated);
    setNewNotice('');
    refreshContent();
  };

  const handleDeleteAnnouncement = (id: string) => {
    const updated = announcements.filter((a) => a.id !== id);
    storageService.saveAnnouncements(updated);
    refreshContent();
  };

  const handleToggleBanner = (id: string) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b));
    storageService.saveBanners(updated);
    refreshContent();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-black text-white font-cinema">Website Content Manager</h1>
        <p className="text-xs text-slate-400 mt-1">
          Update announcements ticker, homepage hero slides, and cinema notices.
        </p>
      </div>

      {/* Announcements Ticker Section */}
      <div className="p-6 rounded-3xl bg-[#0e1422] border border-white/10 shadow-xl space-y-6">
        <div className="flex items-center space-x-2 text-red-500">
          <Megaphone className="w-5 h-5" />
          <h2 className="text-lg font-bold text-white">Live Announcements & Notices Ticker</h2>
        </div>

        {/* Add Announcement Form */}
        <form onSubmit={handleAddAnnouncement} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Notice Text *</label>
              <input
                type="text"
                value={newNotice}
                onChange={(e) => setNewNotice(e.target.value)}
                placeholder="e.g. Free caramel popcorn on Screen 1 recliner bookings!"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Badge Tag</label>
              <select
                value={newBadge}
                onChange={(e) => setNewBadge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="OFFER">OFFER</option>
                <option value="NEW">NEW</option>
                <option value="NOTICE">NOTICE</option>
                <option value="ALERT">ALERT</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow"
              >
                Publish Notice
              </button>
            </div>
          </div>
        </form>

        {/* List */}
        <div className="space-y-2">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-3.5 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center space-x-2 overflow-hidden">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-950 text-red-400 border border-red-800">
                  {ann.badge || 'NOTICE'}
                </span>
                <span className="text-slate-200 truncate font-medium">{ann.message}</span>
              </div>
              <button
                onClick={() => handleDeleteAnnouncement(ann.id)}
                className="text-slate-500 hover:text-rose-400 p-1 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Banners Section */}
      <div className="p-6 rounded-3xl bg-[#0e1422] border border-white/10 shadow-xl space-y-6">
        <div className="flex items-center space-x-2 text-red-500">
          <ImageIcon className="w-5 h-5" />
          <h2 className="text-lg font-bold text-white">Homepage Hero Feature Banners</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="rounded-2xl overflow-hidden bg-slate-900/60 border border-white/10 shadow flex flex-col justify-between"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black">
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      banner.isActive
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {banner.isActive ? 'ACTIVE' : 'HIDDEN'}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="text-sm font-bold text-white">{banner.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{banner.subtitle}</p>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => handleToggleBanner(banner.id)}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  {banner.isActive ? 'Hide from Slider' : 'Activate in Slider'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
