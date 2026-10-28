import React, { useState, useEffect } from "react";
import {
  Film,
  Plus,
  Search,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Eye,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { storageService } from "../../services/storage";
import { Movie, MovieStatus, Certification } from "../../types";

export const AdminMovies: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>(() => storageService.getMovies());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [languageFilter, setLanguageFilter] = useState<string>("ALL");
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([]);
  
  // Sort
  const [sortField, setSortField] = useState<"title" | "releaseDate" | "durationMinutes" | "status">("releaseDate");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [previewMovie, setPreviewMovie] = useState<Movie | null>(null);
  const [deleteModalMovie, setDeleteModalMovie] = useState<Movie | null>(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form inputs
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [language, setLanguage] = useState("Hindi");
  const [genres, setGenres] = useState<string[]>(["Action"]);
  const [durationMinutes, setDurationMinutes] = useState(150);
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [certification, setCertification] = useState<Certification>("UA");
  const [posterUrl, setPosterUrl] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [status, setStatus] = useState<MovieStatus>("NOW_SHOWING");
  const [director, setDirector] = useState("");
  const [castStr, setCastStr] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isRegional, setIsRegional] = useState(false);

  const refreshMovies = () => {
    setMovies(storageService.getMovies());
  };

  useEffect(() => {
    const handleUpdate = () => refreshMovies();
    window.addEventListener("lxm_storage_update", handleUpdate);
    return () => window.removeEventListener("lxm_storage_update", handleUpdate);
  }, []);

  const openAddModal = () => {
    setEditingMovie(null);
    setTitle("");
    setSynopsis("");
    setLanguage("Hindi");
    setGenres(["Action"]);
    setDurationMinutes(145);
    setReleaseDate(new Date().toISOString().split("T")[0]);
    setCertification("UA");
    setPosterUrl("");
    setBackdropUrl("");
    setTrailerUrl("");
    setStatus("NOW_SHOWING");
    setDirector("");
    setCastStr("");
    setIsFeatured(false);
    setIsTrending(false);
    setIsRegional(false);
    setIsFormOpen(true);
  };

  const openEditModal = (m: Movie) => {
    setEditingMovie(m);
    setTitle(m.title);
    setSynopsis(m.synopsis || "");
    setLanguage(m.language || "Hindi");
    setGenres(m.genre || ["Action"]);
    setDurationMinutes(m.durationMinutes || 120);
    setReleaseDate(m.releaseDate || "");
    setCertification(m.certification || "UA");
    setPosterUrl(m.posterUrl || "");
    setBackdropUrl(m.backdropUrl || "");
    setTrailerUrl(m.trailerUrl || "");
    setStatus(m.status || "NOW_SHOWING");
    setDirector(m.director || "");
    setCastStr(m.cast ? m.cast.join(", ") : "");
    setIsFeatured(!!m.isFeatured);
    setIsTrending(!!m.isTrending);
    setIsRegional(!!m.isRegional);
    setIsFormOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isBackdrop: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (isBackdrop) {
        setBackdropUrl(dataUrl);
      } else {
        setPosterUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !posterUrl.trim()) {
      alert("Please provide both Movie Title and Poster Image.");
      return;
    }

    const cast = castStr
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (editingMovie) {
      storageService.updateMovie(
        editingMovie.id,
        {
          title: title.trim(),
          synopsis: synopsis.trim(),
          language: language.trim(),
          genre: genres,
          durationMinutes: Number(durationMinutes),
          releaseDate,
          certification,
          posterUrl: posterUrl.trim(),
          backdropUrl: backdropUrl.trim() || undefined,
          trailerUrl: trailerUrl.trim() || undefined,
          status,
          director: director.trim() || undefined,
          cast,
          isFeatured,
          isTrending,
          isRegional,
        },
        "rajanbhogta"
      );
      setFeedback({ type: "success", text: `Movie "${title}" updated successfully!` });
    } else {
      const newMovie: Movie = {
        id: "mov-" + Date.now().toString(36),
        title: title.trim(),
        synopsis: synopsis.trim(),
        language: language.trim(),
        genre: genres,
        durationMinutes: Number(durationMinutes),
        releaseDate,
        certification,
        posterUrl: posterUrl.trim(),
        backdropUrl: backdropUrl.trim() || undefined,
        trailerUrl: trailerUrl.trim() || undefined,
        status,
        director: director.trim() || undefined,
        cast,
        isFeatured,
        isTrending,
        isRegional,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storageService.saveMovie(newMovie, "rajanbhogta");
      setFeedback({ type: "success", text: `Movie "${title}" created and saved!` });
    }

    setIsFormOpen(false);
    refreshMovies();
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteMovie = () => {
    if (!deleteModalMovie) return;
    const res = storageService.deleteMovie(deleteModalMovie.id, "rajanbhogta");
    setDeleteModalMovie(null);
    setForceDelete(false);
    refreshMovies();
    setFeedback({ type: "success", text: res.message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRestoreMovie = (movie: Movie) => {
    storageService.restoreMovie(movie.id, "rajanbhogta");
    refreshMovies();
    setFeedback({ type: "success", text: `Restored "${movie.title}" to Now Showing status.` });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleTogglePublish = (movie: Movie) => {
    const newStatus: MovieStatus = movie.status === "NOW_SHOWING" ? "DRAFT" : "NOW_SHOWING";
    storageService.updateMovie(movie.id, { status: newStatus }, "rajanbhogta");
    refreshMovies();
    setFeedback({ type: "success", text: `Movie "${movie.title}" status changed to ${newStatus}.` });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Bulk actions
  const handleBulkStatusChange = (newStatus: MovieStatus) => {
    if (selectedMovieIds.length === 0) return;
    const count = storageService.bulkUpdateMovieStatus(selectedMovieIds, newStatus, "rajanbhogta");
    setSelectedMovieIds([]);
    refreshMovies();
    setFeedback({ type: "success", text: `Updated ${count} movie(s) to ${newStatus}.` });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleBulkDelete = () => {
    if (selectedMovieIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete or archive the ${selectedMovieIds.length} selected movie(s)?`)) return;
    const { deleted, archived } = storageService.bulkDeleteMovies(selectedMovieIds, "rajanbhogta");
    setSelectedMovieIds([]);
    refreshMovies();
    setFeedback({ type: "success", text: `Bulk action complete: ${deleted} deleted, ${archived} archived due to past bookings.` });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filter & Search
  const filtered = movies.filter((m) => {
    const matchesStatus = statusFilter === "ALL" ? true : m.status === statusFilter;
    const matchesLang = languageFilter === "ALL" ? true : m.language.toLowerCase() === languageFilter.toLowerCase();
    const matchesSearch =
      searchTerm.trim() === "" ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.genre.some((g) => g.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.language.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesLang && matchesSearch;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let comp = 0;
    if (sortField === "title") comp = a.title.localeCompare(b.title);
    else if (sortField === "releaseDate") comp = (a.releaseDate || "").localeCompare(b.releaseDate || "");
    else if (sortField === "durationMinutes") comp = a.durationMinutes - b.durationMinutes;
    else if (sortField === "status") comp = a.status.localeCompare(b.status);
    return sortAsc ? comp : -comp;
  });

  // Paginate
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginatedMovies = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedMovieIds.length === paginatedMovies.length) {
      setSelectedMovieIds([]);
    } else {
      setSelectedMovieIds(paginatedMovies.map((m) => m.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedMovieIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-cinema tracking-wide flex items-center gap-2">
            <Film className="w-7 h-7 text-red-500" />
            <span>Movie Catalog & Box Office Management</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage titles, posters, certifications, regional releases, and schedule availability.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="self-start sm:self-auto px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-900/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Movie</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "NOW_SHOWING", "COMING_SOON", "DRAFT", "ARCHIVED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? "bg-red-600 text-white"
                  : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {st === "ALL" ? "All Movies" : st.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search title, genre, language..."
              className="w-full bg-white border border-gray-300 focus:border-[#E31837] rounded-xl pl-9 pr-3 py-2 text-xs text-[#171923] placeholder:text-gray-400 focus:outline-none shadow-2xs"
            />
          </div>

          <select
            value={languageFilter}
            onChange={(e) => {
              setLanguageFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white border border-gray-300 text-xs text-[#171923] rounded-xl px-3 py-2 focus:outline-none focus:border-[#E31837] shadow-2xs cursor-pointer"
          >
            <option value="ALL">All Languages</option>
            <option value="Hindi">Hindi</option>
            <option value="Bhojpuri">Bhojpuri</option>
            <option value="Nagpuri">Nagpuri</option>
            <option value="English">English</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Strip */}
      {selectedMovieIds.length > 0 && (
        <div className="bg-red-950/30 border border-red-500/40 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-red-200">
          <span className="font-semibold">{selectedMovieIds.length} movie(s) selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange("NOW_SHOWING")}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium"
            >
              Set Now Showing
            </button>
            <button
              onClick={() => handleBulkStatusChange("COMING_SOON")}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium"
            >
              Set Coming Soon
            </button>
            <button
              onClick={() => handleBulkStatusChange("ARCHIVED")}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium"
            >
              Archive
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
            >
              Delete / Clean
            </button>
          </div>
        </div>
      )}

      {/* Movies Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[#667085] uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedMovieIds.length > 0 && selectedMovieIds.length === paginatedMovies.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-[#E31837] rounded"
                  />
                </th>
                <th className="py-3 px-4">Movie</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => { setSortField("releaseDate"); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center gap-1">
                    <span>Release</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedMovies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-500">
                    <Film className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold text-zinc-400">No movies match your criteria</p>
                  </td>
                </tr>
              ) : (
                paginatedMovies.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedMovieIds.includes(m.id)}
                        onChange={() => toggleSelectOne(m.id)}
                        className="w-4 h-4 accent-[#E31837] rounded"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.posterUrl}
                          alt={m.title}
                          className="w-10 h-14 object-cover rounded-md border border-gray-200 bg-gray-100 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#171923] text-sm">{m.title}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 font-bold border border-gray-200">
                              {m.certification}
                            </span>
                            {m.isRegional && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 font-bold border border-amber-300">
                                Regional
                              </span>
                            )}
                          </div>
                          <p className="text-[#667085] text-[11px] mt-0.5">
                            {m.language} &bull; {m.genre.join(", ")}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#667085] font-mono text-[11px]">
                      {m.releaseDate || "TBA"}
                    </td>

                    <td className="py-3 px-4 text-[#667085] font-mono text-[11px]">
                      {m.durationMinutes} min
                    </td>

                    <td className="py-3 px-4">
                      {m.status === "NOW_SHOWING" && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                          Now Showing
                        </span>
                      )}
                      {m.status === "COMING_SOON" && (
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full font-bold text-[10px]">
                          Coming Soon
                        </span>
                      )}
                      {m.status === "DRAFT" && (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full font-bold text-[10px]">
                          Draft
                        </span>
                      )}
                      {m.status === "ARCHIVED" && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold text-[10px]">
                          Archived
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewMovie(m)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition"
                          title="Preview Movie Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(m)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition"
                          title="Edit Movie"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {m.status === "ARCHIVED" ? (
                          <button
                            type="button"
                            onClick={() => handleRestoreMovie(m)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition border border-emerald-200"
                            title="Restore Movie to Now Showing"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(m)}
                            className="text-[11px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
                          >
                            {m.status === "NOW_SHOWING" ? "Unpublish" : "Publish"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteModalMovie(m);
                            setForceDelete(false);
                          }}
                          className="p-1.5 hover:bg-red-50 text-[#E31837] rounded-lg transition border border-red-200 shadow-2xs cursor-pointer"
                          title="Delete Movie"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sorted.length)} of {sorted.length} movies
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-white">{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteModalMovie && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Delete Movie</h3>
                <p className="text-xs text-zinc-400">{deleteModalMovie.title}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              If this title has existing customer ticket bookings, our system will automatically safeguard financial history by moving it to <strong className="text-amber-400">ARCHIVED</strong> status rather than deleting bookings.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteModalMovie(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMovie}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-900/30"
              >
                Confirm Delete / Safe Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movie Preview Modal */}
      {previewMovie && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl text-white shadow-2xl overflow-hidden my-8">
            <div className="relative aspect-video bg-zinc-900">
              <img
                src={previewMovie.backdropUrl || previewMovie.posterUrl}
                alt={previewMovie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              <button
                onClick={() => setPreviewMovie(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 -mt-12 relative z-10">
              <div className="flex items-start gap-4">
                <img
                  src={previewMovie.posterUrl}
                  alt={previewMovie.title}
                  className="w-20 h-28 object-cover rounded-xl border-2 border-zinc-700 shadow-xl shrink-0"
                />
                <div>
                  <h2 className="text-xl font-black text-white">{previewMovie.title}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold text-[10px]">
                      {previewMovie.certification}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                      {previewMovie.language}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                      {previewMovie.durationMinutes} min
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-300 leading-relaxed">
                <p className="font-semibold text-white mb-1">Synopsis:</p>
                <p className="text-zinc-400">{previewMovie.synopsis || "No synopsis available."}</p>
              </div>

              {previewMovie.cast && previewMovie.cast.length > 0 && (
                <div className="text-xs text-zinc-300">
                  <span className="font-semibold text-white">Cast: </span>
                  <span className="text-zinc-400">{previewMovie.cast.join(", ")}</span>
                </div>
              )}

              {previewMovie.trailerUrl && (
                <div className="pt-2">
                  <a
                    href={previewMovie.trailerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-900/30"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Watch Official Trailer</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Movie Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl text-white shadow-2xl overflow-hidden my-8 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingMovie ? "Edit Movie Title" : "Add New Movie to Laxmi Cineplex"}
                </h2>
                <p className="text-xs text-zinc-400">Save film metadata, poster artwork, and status</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-zinc-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleSaveMovie} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Movie Title <span className="text-red-400">*</span>
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
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Hindi">Hindi</option>
                    <option value="Bhojpuri">Bhojpuri</option>
                    <option value="Nagpuri">Nagpuri</option>
                    <option value="English">English</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Synopsis</label>
                <textarea
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Plot summary, storyline..."
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Poster Upload & URL */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Poster Image <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://... or upload from computer"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                  <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium cursor-pointer shrink-0 flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Poster</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, false)} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Backdrop URL & Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">Backdrop Banner Artwork (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={backdropUrl}
                    onChange={(e) => setBackdropUrl(e.target.value)}
                    placeholder="https://... or upload from computer"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                  <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium cursor-pointer shrink-0 flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Banner</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, true)} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Certification, Duration, Release Date */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Certification</label>
                  <select
                    value={certification}
                    onChange={(e) => setCertification(e.target.value as Certification)}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="U">U (Universal)</option>
                    <option value="UA">UA (Parental Guidance)</option>
                    <option value="UA 13+">UA 13+</option>
                    <option value="UA 16+">UA 16+</option>
                    <option value="A">A (Adults Only)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Release Date</label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Status and Trailer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MovieStatus)}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="NOW_SHOWING">Now Showing</option>
                    <option value="COMING_SOON">Coming Soon</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Trailer YouTube Link</label>
                  <input
                    type="url"
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Cast and Director */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Director</label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    placeholder="e.g. Sukumar"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Cast (Comma separated)</label>
                  <input
                    type="text"
                    value={castStr}
                    onChange={(e) => setCastStr(e.target.value)}
                    placeholder="Allu Arjun, Rashmika Mandanna..."
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  <span>Feature on Homepage Carousel</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isTrending}
                    onChange={(e) => setIsTrending(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  <span>Mark as Trending Blockbuster</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isRegional}
                    onChange={(e) => setIsRegional(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  <span>Jharkhand / Regional Cinema Special</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-900/30 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingMovie ? "Update Movie" : "Save Movie"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
