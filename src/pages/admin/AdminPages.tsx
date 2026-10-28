import React, { useState, useEffect } from "react";
import { FileText, Save, CheckCircle2, Eye, ExternalLink } from "lucide-react";
import { storageService } from "../../services/storage";
import { WebsitePageContent } from "../../types";

export const AdminPages: React.FC = () => {
  const [pages, setPages] = useState<WebsitePageContent[]>(() => storageService.getPages());
  const [selectedPage, setSelectedPage] = useState<WebsitePageContent>(pages[0] || {
    id: "pg-about",
    title: "About Us",
    slug: "about",
    content: "",
    metaTitle: "",
    metaDescription: "",
    updatedAt: new Date().toISOString(),
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      const p = storageService.getPages();
      setPages(p);
      const curr = p.find((item) => item.id === selectedPage.id) || p[0];
      if (curr) setSelectedPage(curr);
    };
    window.addEventListener("lxm_storage_update", handleUpdate);
    return () => window.removeEventListener("lxm_storage_update", handleUpdate);
  }, [selectedPage.id]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.savePage(selectedPage, "rajanbhogta");
    setFeedback(`Saved "${selectedPage.title}" successfully!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white font-cinema tracking-wide flex items-center gap-2">
          <FileText className="w-7 h-7 text-red-500" />
          <span>Website Pages & Policy Content Manager</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Customize website content, Terms of Service, Privacy Policy, and Cancellation rules live on the cinema portal.
        </p>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">Pages & Legal Policies</h2>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-2 space-y-1">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPage(p)}
                className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition ${
                  selectedPage.id === p.id
                    ? "bg-red-600 text-white shadow-md shadow-red-950"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <div className="font-bold">{p.title}</div>
                <div className={`text-[10px] mt-0.5 ${selectedPage.id === p.id ? "text-red-100" : "text-zinc-500"}`}>
                  /{p.slug}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">{selectedPage.title}</h3>
                <p className="text-xs text-zinc-400">URL Route: /{selectedPage.slug}</p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-900/30"
              >
                <Save className="w-4 h-4" />
                <span>Save Live Content</span>
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Page Title</label>
              <input
                type="text"
                value={selectedPage.title}
                onChange={(e) => setSelectedPage({ ...selectedPage, title: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Page Body Content</label>
              <textarea
                rows={9}
                value={selectedPage.content}
                onChange={(e) => setSelectedPage({ ...selectedPage, content: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white font-sans leading-relaxed focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">SEO Meta Title</label>
                <input
                  type="text"
                  value={selectedPage.metaTitle}
                  onChange={(e) => setSelectedPage({ ...selectedPage, metaTitle: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">SEO Meta Description</label>
                <input
                  type="text"
                  value={selectedPage.metaDescription}
                  onChange={(e) => setSelectedPage({ ...selectedPage, metaDescription: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};