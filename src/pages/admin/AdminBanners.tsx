import React, { useState, useEffect } from "react";
import {
  Image,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Film,
  Upload,
  Calendar,
  Sparkles,
} from "lucide-react";
import { storageService } from "../../services/storage";
import { HeroBanner, Movie } from "../../types";

export const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<HeroBanner[]>(() => storageService.getBanners());
  const [movies, setMovies] = useState<Movie[]>(() => storageService.getMovies());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<HeroBanner | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("Book Tickets Now");
  const [ctaLink, setCtaLink] = useState("/movies");
  const [targetMovieId, setTargetMovieId] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const refreshData = () => {
    setBanners(storageService.getBanners());
    setMovies(storageService.getMovies());
  };

  useEffect(() => {
    const handleUpdate = () => refreshData();
    window.addEventListener("lxm_storage_update", handleUpdate);
    return () => window.removeEventListener("lxm_storage_update", handleUpdate);
  }, []);

  const openAddModal = () => {
    setEditingBanner(null);
    setTitle("");
    setSubtitle("");
    setDescription("");
    setImageUrl("");
    setMobileImageUrl("");
    setCtaText("Book Tickets Now");
    setCtaLink("/movies");
    setTargetMovieId("");
    setDisplayOrder(banners.length + 1);
    setIsActive(true);
    setStartDate("");
    setEndDate("");
    setIsModalOpen(true);
  };

  const openEditModal = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || "");
    setDescription(banner.description || "");
    setImageUrl(banner.imageUrl || banner.desktopImage || "");
    setMobileImageUrl(banner.mobileImage || "");
    setCtaText(banner.ctaText || "Book Tickets Now");
    setCtaLink(banner.ctaLink || "/movies");
    setTargetMovieId(banner.movieId || banner.targetMovieId || "");
    setDisplayOrder(banner.displayOrder);
    setIsActive(banner.isActive);
    setStartDate(banner.startDate || "");
    setEndDate(banner.endDate || "");
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isMobile: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPEG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isMobile) {
        setMobileImageUrl(dataUrl);
      } else {
        setImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMovieSelect = (movieId: string) => {
    setTargetMovieId(movieId);
    if (movieId) {
      const movie = movies.find((m) => m.id === movieId);
      if (movie) {
        setTitle(movie.title);
        setSubtitle(`Now Showing at Laxmi Cineplex ${movie.certification} • ${movie.durationMinutes}m`);
        setCtaLink(`/movies/${movie.id}`);
        if (!imageUrl && movie.backdropUrl) {
          setImageUrl(movie.backdropUrl);
        }
      }
    }
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      alert("Please provide both a banner title and an image URL/file.");
      return;
    }

    const bannerData: HeroBanner = {
      id: editingBanner ? editingBanner.id : `ban-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      desktopImage: imageUrl.trim(),
      mobileImage: mobileImageUrl.trim() || imageUrl.trim(),
      ctaText: ctaText.trim() || "Book Tickets Now",
      ctaLink: ctaLink.trim() || "/movies",
      movieId: targetMovieId || undefined,
      targetMovieId: targetMovieId || undefined,
      displayOrder: Number(displayOrder) || 1,
      isActive,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    storageService.saveBanner(bannerData, "rajanbhogta");
    setIsModalOpen(false);
    refreshData();
    setFeedback({
      type: "success",
      text: editingBanner ? `Banner "${bannerData.title}" updated successfully!` : `New banner created successfully!`,
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteBanner = (id: string) => {
    storageService.deleteBanner(id, "rajanbhogta");
    setDeleteConfirmId(null);
    refreshData();
    setFeedback({ type: "success", text: "Banner removed successfully." });
    setTimeout(() => setFeedback(null), 3500);
  };

  const moveOrder = (index: number, direction: "UP" | "DOWN") => {
    const newBanners = [...banners];
    const targetIdx = direction === "UP" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newBanners.length) return;

    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIdx];
    newBanners[targetIdx] = temp;

    storageService.reorderBanners(newBanners, "rajanbhogta");
    refreshData();
  };

  const toggleBannerStatus = (banner: HeroBanner) => {
    storageService.saveBanner({ ...banner, isActive: !banner.isActive }, "rajanbhogta");
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-cinema tracking-wide flex items-center gap-2">
            <Image className="w-7 h-7 text-red-500" />
            <span>Homepage Hero Banner Manager</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Create, replace, reorder, and schedule high-definition cinematic promotional banners on the Laxmi Cineplex homepage.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="self-start sm:self-auto px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-900/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
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

      {/* Banner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`bg-zinc-900/80 border rounded-2xl overflow-hidden transition flex flex-col justify-between ${
              banner.isActive ? "border-zinc-800 hover:border-zinc-700" : "border-zinc-800/40 opacity-70"
            }`}
          >
            <div>
              {/* Image Container with Badges */}
              <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                    #{banner.displayOrder}
                  </span>
                  {banner.isActive ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold backdrop-blur-md">
                      Published
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 border border-zinc-700 text-[10px] font-bold backdrop-blur-md">
                      Draft / Inactive
                    </span>
                  )}
                </div>

                <div className="absolute bottom-2 left-3 right-3">
                  <p className="text-white font-bold text-sm leading-tight drop-shadow-md">{banner.title}</p>
                  <p className="text-zinc-300 text-xs line-clamp-1 mt-0.5">{banner.subtitle}</p>
                </div>
              </div>

              {/* Banner Details */}
              <div className="p-4 space-y-2 text-xs">
                {banner.movieId && (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Film className="w-3.5 h-3.5 text-red-400" />
                    <span>Linked to: {movies.find((m) => m.id === banner.movieId)?.title || banner.movieId}</span>
                  </div>
                )}
                <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Button: <strong className="text-zinc-200">"{banner.ctaText}"</strong></span>
                  <span className="text-zinc-500 truncate max-w-[140px]">{banner.ctaLink}</span>
                </div>
              </div>
            </div>

            {/* Bottom Action Controls */}
            <div className="px-4 py-3 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between">
              {/* Reordering arrows */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveOrder(index, "UP")}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={index === banners.length - 1}
                  onClick={() => moveOrder(index, "DOWN")}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleBannerStatus(banner)}
                  className={`text-[11px] px-2 py-1 rounded-lg font-semibold transition ${
                    banner.isActive ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                  }`}
                >
                  {banner.isActive ? "Unpublish" : "Publish"}
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(banner)}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition"
                  title="Edit Banner"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(banner.id)}
                  className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg transition border border-red-800/40"
                  title="Delete Banner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Delete Banner</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300">
              Are you sure you want to permanently remove this homepage hero banner from Laxmi Cineplex?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBanner(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-900/30"
              >
                Delete Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl text-white shadow-2xl overflow-hidden my-8 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingBanner ? "Edit Hero Banner" : "Add New Hero Banner"}
                </h2>
                <p className="text-xs text-zinc-400">Configure banner graphics, linked film, and CTA parameters</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              {/* Linked Movie Selector */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Optional: Link to Existing Movie
                </label>
                <select
                  value={targetMovieId}
                  onChange={(e) => handleMovieSelect(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">-- No Specific Movie Link (Custom Promotional Banner) --</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.language}) - {m.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Banner Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Banner Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Pushpa 2: The Rule"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Subtitle / Tagline</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Now Playing in Dolby Atmos 7.1 & 4K Laser"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Image Input & Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Desktop Hero Banner Image (16:9 Recommended) <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or upload from computer"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                  <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium cursor-pointer shrink-0 flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, false)} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Live Preview Card */}
              {imageUrl && (
                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900">
                  <div className="text-[11px] text-zinc-400 font-semibold px-3 py-1.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                    <span>Live Desktop Banner Preview</span>
                    <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div className="relative aspect-video max-h-48 w-full overflow-hidden">
                    <img src={imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-lg font-bold text-white drop-shadow-lg leading-tight">{title || "Banner Title"}</p>
                      <p className="text-xs text-zinc-300 drop-shadow line-clamp-1">{subtitle || "Banner subtitle tagline preview"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Button and Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Book Tickets Now"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Destination URL / Route</label>
                  <input
                    type="text"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    placeholder="/movies or /movies/mov-1"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Display Priority Order</label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className="text-xs font-semibold text-zinc-200">Publish Immediately on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-900/30 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingBanner ? "Save Changes" : "Create Banner"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
