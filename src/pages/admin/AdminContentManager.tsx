import React, { useState, useEffect } from 'react';
import {
  Film,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Clock,
  ShoppingBag,
  Tv,
  Layers,
  BookOpen,
  Filter,
  ArrowUpDown,
  Lock,
  Globe,
  FileVideo,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { Movie, ContentType, MonetizationType, ContentVisibility, VideoProvider, Certification } from '../../types';
import { VideoPlayerModal } from '../../components/video/VideoPlayerModal';

export const AdminContentManager: React.FC = () => {
  const [contentList, setContentList] = useState<Movie[]>(() => storageService.getMovies());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [monetizationFilter, setMonetizationFilter] = useState<string>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('ALL');

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Movie | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<Movie | null>(null);
  const [previewItem, setPreviewItem] = useState<Movie | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [genreStr, setGenreStr] = useState('Action, Drama');
  const [releaseYear, setReleaseYear] = useState<number>(new Date().getFullYear());
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [certification, setCertification] = useState<Certification>('UA');
  const [director, setDirector] = useState('');
  const [castStr, setCastStr] = useState('');

  // OTT & Monetization fields
  const [contentType, setContentType] = useState<ContentType>('OTT_MOVIE');
  const [visibility, setVisibility] = useState<ContentVisibility>('PUBLISHED');
  const [monetization, setMonetization] = useState<MonetizationType>('RENT_OR_BUY');
  const [rentPriceINR, setRentPriceINR] = useState<number>(79);
  const [rentalDurationHours, setRentalDurationHours] = useState<number>(48);
  const [buyPriceINR, setBuyPriceINR] = useState<number>(199);
  const [videoProvider, setVideoProvider] = useState<VideoProvider>('CLOUDFLARE_STREAM');
  const [playbackId, setPlaybackId] = useState('');

  const refreshList = () => {
    setContentList(storageService.getMovies());
  };

  useEffect(() => {
    const handleUpdate = () => refreshList();
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setSynopsis('');
    setPosterUrl('https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80');
    setBackdropUrl('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80');
    setTrailerUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    setLanguage('Hindi');
    setGenreStr('Action, Drama');
    setReleaseYear(new Date().getFullYear());
    setDurationMinutes(120);
    setCertification('UA');
    setDirector('');
    setCastStr('');
    setContentType('OTT_MOVIE');
    setVisibility('PUBLISHED');
    setMonetization('RENT_OR_BUY');
    setRentPriceINR(79);
    setRentalDurationHours(48);
    setBuyPriceINR(199);
    setVideoProvider('CLOUDFLARE_STREAM');
    setPlaybackId('');
    setIsFormOpen(true);
  };

  const openEditModal = (item: Movie) => {
    setEditingItem(item);
    setTitle(item.title);
    setSynopsis(item.synopsis || '');
    setPosterUrl(item.posterUrl || '');
    setBackdropUrl(item.backdropUrl || '');
    setTrailerUrl(item.trailerUrl || '');
    setLanguage(item.language || 'Hindi');
    setGenreStr(item.genre?.join(', ') || 'Drama');
    setReleaseYear(item.releaseYear || (item.releaseDate ? parseInt(item.releaseDate.split('-')[0]) : new Date().getFullYear()));
    setDurationMinutes(item.durationMinutes || 120);
    setCertification(item.certification || 'UA');
    setDirector(item.director || '');
    setCastStr(item.cast?.join(', ') || '');
    setContentType(item.contentType || 'CINEMA_MOVIE');
    setVisibility(item.visibility || (item.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED'));
    setMonetization(item.monetization || 'FREE');
    setRentPriceINR(item.rentPriceINR || 49);
    setRentalDurationHours(item.rentalDurationHours || 48);
    setBuyPriceINR(item.buyPriceINR || 149);
    setVideoProvider(item.videoProvider || 'CLOUDFLARE_STREAM');
    setPlaybackId(item.playbackId || '');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setFeedback({ type: 'error', text: 'Content title is required.' });
      return;
    }
    if (!posterUrl.trim()) {
      setFeedback({ type: 'error', text: 'Poster image URL is required.' });
      return;
    }

    const genre = genreStr
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
    const cast = castStr
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const commonPayload: Partial<Movie> = {
      title: title.trim(),
      synopsis: synopsis.trim(),
      posterUrl: posterUrl.trim(),
      backdropUrl: backdropUrl.trim() || undefined,
      trailerUrl: trailerUrl.trim() || undefined,
      language: language.trim(),
      genre,
      releaseYear: Number(releaseYear),
      releaseDate: `${releaseYear}-01-01`,
      durationMinutes: Number(durationMinutes),
      certification,
      director: director.trim() || undefined,
      cast,
      contentType,
      visibility,
      status: visibility === 'DRAFT' ? 'DRAFT' : 'NOW_SHOWING',
      monetization,
      rentPriceINR: monetization === 'FREE' ? undefined : Number(rentPriceINR),
      rentalDurationHours: monetization === 'FREE' ? undefined : Number(rentalDurationHours),
      buyPriceINR: (monetization === 'BUY' || monetization === 'RENT_OR_BUY') ? Number(buyPriceINR) : undefined,
      currency: 'INR',
      videoProvider,
      playbackId: playbackId.trim() || undefined,
    };

    if (editingItem) {
      storageService.updateMovie(editingItem.id, commonPayload, 'rajanbhogta (Admin)');
      setFeedback({ type: 'success', text: `Updated "${title}" successfully!` });
    } else {
      const newMovie: Movie = {
        id: `cnt-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(commonPayload as any),
      };
      storageService.saveMovie(newMovie, 'rajanbhogta (Admin)');
      setFeedback({ type: 'success', text: `Created and published "${title}"!` });
    }

    setIsFormOpen(false);
    refreshList();
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDelete = () => {
    if (!deleteModalItem) return;
    const res = storageService.deleteMovie(deleteModalItem.id, 'rajanbhogta (Admin)');
    setDeleteModalItem(null);
    refreshList();
    setFeedback({ type: 'success', text: res.message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleToggleVisibility = (item: Movie) => {
    const nextVis: ContentVisibility = item.visibility === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    storageService.updateMovie(item.id, { visibility: nextVis, status: nextVis === 'PUBLISHED' ? 'NOW_SHOWING' : 'DRAFT' }, 'rajanbhogta');
    refreshList();
    setFeedback({ type: 'success', text: `"${item.title}" visibility changed to ${nextVis}.` });
    setTimeout(() => setFeedback(null), 3000);
  };

  const filteredContent = contentList.filter((m) => {
    if (typeFilter !== 'ALL' && m.contentType !== typeFilter) return false;
    if (monetizationFilter !== 'ALL' && m.monetization !== monetizationFilter) return false;
    if (visibilityFilter !== 'ALL' && m.visibility !== visibilityFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.language.toLowerCase().includes(q) ||
        m.genre?.some((g) => g.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#171923] font-cinema tracking-tight">
            Comprehensive Content Manager
          </h2>
          <p className="text-xs text-[#667085]">
            Manage Cinema Theatrical Releases, OTT Movies, Web Series, Short Films, Rentals & Video Sales
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#E31837] hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Content</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center space-x-2 border ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span className="font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search titles, languages..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:border-[#E31837]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Content Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#E31837]"
          >
            <option value="ALL">All Types</option>
            <option value="CINEMA_MOVIE">Cinema Movie</option>
            <option value="OTT_MOVIE">OTT Movie</option>
            <option value="WEB_SERIES">Web Series</option>
            <option value="SHORT_FILM">Short Film</option>
            <option value="DOCUMENTARY">Documentary</option>
            <option value="VIDEO_RENT">Video for Rent</option>
            <option value="VIDEO_BUY">Video for Purchase</option>
          </select>

          {/* Monetization Filter */}
          <select
            value={monetizationFilter}
            onChange={(e) => setMonetizationFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#E31837]"
          >
            <option value="ALL">All Pricing</option>
            <option value="FREE">Free</option>
            <option value="RENT">Rent Only</option>
            <option value="BUY">Buy Only</option>
            <option value="RENT_OR_BUY">Rent & Buy</option>
          </select>

          {/* Visibility Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#E31837]"
          >
            <option value="ALL">All Visibility</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="UNPUBLISHED">Unpublished</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Content</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Monetization</th>
                <th className="py-3 px-4">Pricing</th>
                <th className="py-3 px-4">Visibility</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {filteredContent.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-10 h-14 object-cover rounded-lg shrink-0 bg-slate-100"
                      />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">{item.title}</h4>
                        <p className="text-[11px] text-slate-500">
                          {item.language} • {item.durationMinutes}m • {item.certification}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {item.contentType || 'CINEMA_MOVIE'}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.monetization === 'FREE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.monetization || 'FREE'}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="space-y-0.5 font-mono">
                      {item.rentPriceINR ? (
                        <div className="text-[11px] text-slate-900">
                          Rent: <strong>₹{item.rentPriceINR}</strong> ({item.rentalDurationHours || 48}h)
                        </div>
                      ) : null}
                      {item.buyPriceINR ? (
                        <div className="text-[11px] text-emerald-700">
                          Buy: <strong>₹{item.buyPriceINR}</strong>
                        </div>
                      ) : null}
                      {!item.rentPriceINR && !item.buyPriceINR && (
                        <span className="text-slate-400">Free Stream</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleVisibility(item)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        item.visibility === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>{item.visibility || 'PUBLISHED'}</span>
                    </button>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                        title="Preview Stream"
                      >
                        <Play className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                        title="Edit Content"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteModalItem(item)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        title="Delete Content"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-[#171923] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-150 pb-4">
              <h3 className="font-extrabold text-base sm:text-lg text-[#171923] font-cinema">
                {editingItem ? 'Edit Media Content' : 'Add New Content'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Type, Visibility, Monetization Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Content Type *</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="CINEMA_MOVIE">Cinema Movie (Theatrical)</option>
                    <option value="OTT_MOVIE">OTT Movie (Digital)</option>
                    <option value="WEB_SERIES">Web Series (Multi-Episode)</option>
                    <option value="SHORT_FILM">Short Film</option>
                    <option value="DOCUMENTARY">Documentary</option>
                    <option value="VIDEO_RENT">Video for Rent</option>
                    <option value="VIDEO_BUY">Video for Purchase</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Visibility *</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as ContentVisibility)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="PUBLISHED">Published (Live)</option>
                    <option value="DRAFT">Draft (Hidden)</option>
                    <option value="UNPUBLISHED">Unpublished</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monetization *</label>
                  <select
                    value={monetization}
                    onChange={(e) => setMonetization(e.target.value as MonetizationType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="FREE">Free to Stream</option>
                    <option value="RENT">Rent Only</option>
                    <option value="BUY">Buy Only</option>
                    <option value="RENT_OR_BUY">Rent & Buy Both</option>
                  </select>
                </div>
              </div>

              {/* Title & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Hazaribagh Chronicles"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Language *</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="Hindi, Nagpuri, etc."
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white"
                  />
                </div>
              </div>

              {/* Synopsis */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Synopsis / Storyline</label>
                <textarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  rows={3}
                  placeholder="Plot summary..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 focus:bg-white"
                />
              </div>

              {/* Pricing Section (if monetized) */}
              {monetization !== 'FREE' && (
                <div className="p-4 bg-red-50/50 border border-red-200 rounded-2xl space-y-3">
                  <h4 className="font-extrabold text-[#E31837] text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Monetization & Pricing Settings (INR)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(monetization === 'RENT' || monetization === 'RENT_OR_BUY') && (
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Rental Price (₹)</label>
                        <input
                          type="number"
                          value={rentPriceINR}
                          onChange={(e) => setRentPriceINR(Number(e.target.value))}
                          min={0}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                        />
                      </div>
                    )}

                    {(monetization === 'RENT' || monetization === 'RENT_OR_BUY') && (
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Rental Duration (Hours)</label>
                        <select
                          value={rentalDurationHours}
                          onChange={(e) => setRentalDurationHours(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                        >
                          <option value={24}>24 Hours (1 Day)</option>
                          <option value={48}>48 Hours (2 Days)</option>
                          <option value={168}>168 Hours (7 Days)</option>
                          <option value={720}>720 Hours (30 Days)</option>
                        </select>
                      </div>
                    )}

                    {(monetization === 'BUY' || monetization === 'RENT_OR_BUY') && (
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Buy Price (₹ Lifetime)</label>
                        <input
                          type="number"
                          value={buyPriceINR}
                          onChange={(e) => setBuyPriceINR(Number(e.target.value))}
                          min={0}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Video Streaming URLs */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <FileVideo className="w-4 h-4 text-[#E31837]" />
                  <span>Authorized Video Stream / Trailer URLs</span>
                </h4>

                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Video Stream URL (MP4, HLS, or YouTube)
                    </label>
                    <input
                      type="url"
                      value={trailerUrl}
                      onChange={(e) => setTrailerUrl(e.target.value)}
                      placeholder="https://commondatastorage.googleapis.com/.../sample.mp4 or YouTube link"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Streaming Provider</label>
                      <select
                        value={videoProvider}
                        onChange={(e) => setVideoProvider(e.target.value as VideoProvider)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                      >
                        <option value="CLOUDFLARE_STREAM">Cloudflare Stream</option>
                        <option value="MUX">Mux Video</option>
                        <option value="BUNNY_STREAM">Bunny Stream</option>
                        <option value="AWS_MEDIACONVERT">AWS MediaConvert HLS</option>
                        <option value="YOUTUBE_UNLISTED">YouTube Unlisted Stream</option>
                        <option value="CUSTOM_HLS">Custom HLS (.m3u8)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Protected Playback ID</label>
                      <input
                        type="text"
                        value={playbackId}
                        onChange={(e) => setPlaybackId(e.target.value)}
                        placeholder="e.g. stream_id_abc123"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Poster, Backdrop, Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Poster Image URL *</label>
                  <input
                    type="url"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Backdrop Image URL</label>
                  <input
                    type="url"
                    value={backdropUrl}
                    onChange={(e) => setBackdropUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Certification</label>
                  <select
                    value={certification}
                    onChange={(e) => setCertification(e.target.value as Certification)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="U">U (Universal)</option>
                    <option value="UA">UA (Parental Guidance)</option>
                    <option value="UA 13+">UA 13+</option>
                    <option value="UA 16+">UA 16+</option>
                    <option value="A">A (Adults Only)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Release Year</label>
                  <input
                    type="number"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Genres (Comma separated)</label>
                <input
                  type="text"
                  value={genreStr}
                  onChange={(e) => setGenreStr(e.target.value)}
                  placeholder="Action, Crime, Thriller"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E31837] hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/20 cursor-pointer"
                >
                  {editingItem ? 'Save Updates' : 'Publish Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-black text-slate-900 text-base">Delete Content?</h4>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <strong>"{deleteModalItem.title}"</strong>?
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setDeleteModalItem(null)}
                className="flex-1 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Preview Modal */}
      {previewItem && (
        <VideoPlayerModal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          content={previewItem}
        />
      )}
    </div>
  );
};
