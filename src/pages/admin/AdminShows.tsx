import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../../services/storage';
import { Show, Movie, Screen } from '../../types';
import {
  Clock,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Film,
  Trash2,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Tv,
  Coins,
  Search,
  Filter,
} from 'lucide-react';

// Get current date in Asia/Kolkata (IST) timezone
const getISTDate = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
};

// Normalize input time into standard 24h "HH:mm"
const normalizeTimeTo24h = (raw: string): string | null => {
  if (!raw) return null;
  const str = raw.trim().toLowerCase();

  // 12-hour format e.g. "2:30 pm", "02:30pm", "10:15 am"
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const meridian = match12[3];
    if (h < 1 || h > 12 || m < 0 || m > 59) return null;
    if (meridian === 'pm' && h < 12) h += 12;
    if (meridian === 'am' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  // 24-hour format e.g. "14:30" or "9:30" or "14:30:00"
  const match24 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  return null;
};

// Calculate end time and buffer end time
const calculateShowTimes = (
  startTimeStr: string,
  durationMinutes: number,
  bufferMinutes: number = 15
): { endTime: string; bufferEndTime: string; isValid: boolean } => {
  const norm = normalizeTimeTo24h(startTimeStr);
  if (!norm) return { endTime: '--:--', bufferEndTime: '--:--', isValid: false };

  const [h, m] = norm.split(':').map(Number);
  const totalStartMinutes = h * 60 + m;
  const totalEndMinutes = (totalStartMinutes + durationMinutes) % (24 * 60);
  const totalBufferEndMinutes = (totalStartMinutes + durationMinutes + bufferMinutes) % (24 * 60);

  const endH = Math.floor(totalEndMinutes / 60);
  const endM = totalEndMinutes % 60;
  const bufH = Math.floor(totalBufferEndMinutes / 60);
  const bufM = totalBufferEndMinutes % 60;

  const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  const bufferEndTime = `${bufH.toString().padStart(2, '0')}:${bufM.toString().padStart(2, '0')}`;

  return { endTime, bufferEndTime, isValid: true };
};

export const AdminShows: React.FC = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getISTDate(0));
  const [selectedScreenId, setSelectedScreenId] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMovieId, setModalMovieId] = useState('');
  const [modalScreenId, setModalScreenId] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [modalStartTime, setModalStartTime] = useState('');
  const [cleaningBuffer] = useState(15);

  // Custom Pricing State for the modal
  const [reclinerPrice, setReclinerPrice] = useState<number>(350);
  const [primePrice, setPrimePrice] = useState<number>(240);
  const [classicPrice, setClassicPrice] = useState<number>(180);

  // Form Validation & Feedback state
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageFeedback, setPageFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Show Deletion / Cancellation Confirmation Modal
  const [showToDelete, setShowToDelete] = useState<Show | null>(null);

  const refreshData = () => {
    setShows(storageService.getShows());
    setMovies(storageService.getMovies());
    setScreens(storageService.getScreens());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filter movies that can be scheduled (Now Showing and Coming Soon)
  const schedulableMovies = useMemo(() => {
    return movies.filter((m) => m.status === 'NOW_SHOWING' || m.status === 'COMING_SOON');
  }, [movies]);

  // Selected movie in modal for duration calculation
  const selectedModalMovie = useMemo(() => {
    return movies.find((m) => m.id === modalMovieId) || null;
  }, [movies, modalMovieId]);

  // Calculate live end time in modal
  const calculatedTimes = useMemo(() => {
    const duration = selectedModalMovie?.durationMinutes || 120;
    return calculateShowTimes(modalStartTime, duration, cleaningBuffer);
  }, [modalStartTime, selectedModalMovie, cleaningBuffer]);

  // Live real-time clash preview
  const clashPreview = useMemo(() => {
    if (!modalScreenId || !modalDate || !calculatedTimes.isValid) return null;
    const normalized = normalizeTimeTo24h(modalStartTime);
    if (!normalized) return null;

    return storageService.checkShowOverlap(
      modalScreenId,
      modalDate,
      normalized,
      calculatedTimes.endTime
    );
  }, [modalScreenId, modalDate, modalStartTime, calculatedTimes]);

  const handleOpenModal = () => {
    setModalError(null);
    setIsSubmitting(false);

    // Default movie selection
    const firstMovie = schedulableMovies[0];
    setModalMovieId(firstMovie?.id || '');

    // Default screen selection
    const firstScreen = screens[0];
    setModalScreenId(firstScreen?.id || '');

    // Default date to currently viewed date
    setModalDate(selectedDate || getISTDate(0));

    // Default start time
    setModalStartTime('14:30');

    // Default pricing
    setReclinerPrice(350);
    setPrimePrice(240);
    setClassicPrice(180);

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setModalError(null);
  };

  // Submit Handler
  const handleValidateAndSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (isSubmitting) return;

    // 1. Validate Movie
    const movie = movies.find((m) => m.id === modalMovieId);
    if (!movie) {
      setModalError('Please select a valid movie from the cinema catalog.');
      return;
    }

    // 2. Validate Screen
    const screen = screens.find((s) => s.id === modalScreenId);
    if (!screen) {
      setModalError('Please select an auditorium/screen.');
      return;
    }

    // 3. Validate Date
    if (!modalDate || !/^\d{4}-\d{2}-\d{2}$/.test(modalDate)) {
      setModalError('Please enter a valid screening date in YYYY-MM-DD format.');
      return;
    }

    // 4. Validate and Normalize Time
    const normalizedStartTime = normalizeTimeTo24h(modalStartTime);
    if (!normalizedStartTime) {
      setModalError('Please enter a valid start time in 24h format (e.g., 14:30 or 09:15).');
      return;
    }

    // 5. Validate Pricing
    const recP = Number(reclinerPrice);
    const prmP = Number(primePrice);
    const clsP = Number(classicPrice);
    if (isNaN(recP) || recP <= 0 || isNaN(prmP) || prmP <= 0 || isNaN(clsP) || clsP <= 0) {
      setModalError('All category ticket prices must be positive numbers greater than ₹0.');
      return;
    }

    // 6. Calculate end time
    const duration = movie.durationMinutes || 120;
    const { endTime, isValid } = calculateShowTimes(normalizedStartTime, duration, cleaningBuffer);
    if (!isValid) {
      setModalError('Failed to compute screening duration. Please check the start time.');
      return;
    }

    // 7. Check screen collision guard
    const overlapCheck = storageService.checkShowOverlap(
      modalScreenId,
      modalDate,
      normalizedStartTime,
      endTime
    );

    if (overlapCheck.hasOverlap) {
      setModalError(
        overlapCheck.details ||
          `Schedule conflict on ${screen.name}: Overlapping with another screening (${overlapCheck.conflictingShow?.startTime} - ${overlapCheck.conflictingShow?.endTime}). Please select a different time or screen.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const newShow = storageService.createShow({
        movieId: modalMovieId,
        screenId: modalScreenId,
        date: modalDate,
        startTime: normalizedStartTime,
        endTime,
        pricing: {
          RECLINER: recP,
          PRIME: prmP,
          CLASSIC: clsP,
        },
      });

      refreshData();
      setSelectedDate(modalDate);
      setIsModalOpen(false);
      setPageFeedback({
        message: `Showtime successfully scheduled for "${movie.title}" on ${screen.name} at ${normalizedStartTime} (IST).`,
        isError: false,
      });
    } catch (err: any) {
      setModalError(err.message || 'Failed to save showtime. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancelShow = () => {
    if (!showToDelete) return;

    try {
      storageService.cancelShow(showToDelete.id, 'Cancelled via Showtime Scheduler Control Panel');
      setPageFeedback({
        message: `Show cancelled successfully. All booking slots have been deactivated.`,
        isError: false,
      });
      refreshData();
    } catch (err: any) {
      setPageFeedback({
        message: err.message || 'Failed to cancel show.',
        isError: true,
      });
    } finally {
      setShowToDelete(null);
    }
  };

  // Filter shows by date and screen
  const filteredShows = shows.filter((s) => {
    if (s.date !== selectedDate) return false;
    if (selectedScreenId !== 'ALL' && s.screenId !== selectedScreenId) return false;
    return true;
  });

  // Calculate statistics for selected date
  const stats = useMemo(() => {
    const dayShows = shows.filter((s) => s.date === selectedDate && s.status !== 'CANCELLED');
    let totalBooked = 0;
    dayShows.forEach((s) => {
      totalBooked += storageService.getBookedSeatsForShow(s.id).length;
    });
    return {
      totalShows: dayShows.length,
      totalBookedSeats: totalBooked,
      screensActive: new Set(dayShows.map((s) => s.screenId)).size,
    };
  }, [shows, selectedDate]);

  return (
    <div className="space-y-6 text-[#171923]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div>
          <h1 className="text-2xl font-black text-[#171923] font-cinema flex items-center space-x-2.5">
            <Clock className="w-6 h-6 text-[#E31837]" />
            <span>Showtime Scheduler & Collision Guard</span>
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Program daily screenings with real-time auditorium clash detection, 15-min cleaning buffer, and tier pricing.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#E31837] hover:bg-[#c91430] text-white shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Cinema Showtime</span>
        </button>
      </div>

      {/* Page Toast / Feedback Message */}
      {pageFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between transition-all ${
            pageFeedback.isError
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {pageFeedback.isError ? (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span>{pageFeedback.message}</span>
          </div>
          <button
            onClick={() => setPageFeedback(null)}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Date & Screen Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Date Selector & Quick Chips */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-[#E31837] flex-shrink-0" />
            <span className="text-[11px] font-bold text-[#667085]">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-xs text-[#171923] font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setSelectedDate(getISTDate(0))}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                selectedDate === getISTDate(0)
                  ? 'bg-[#E31837] text-white shadow-2xs'
                  : 'bg-gray-100 text-[#667085] hover:bg-gray-200 hover:text-[#171923]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(getISTDate(1))}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                selectedDate === getISTDate(1)
                  ? 'bg-[#E31837] text-white shadow-2xs'
                  : 'bg-gray-100 text-[#667085] hover:bg-gray-200 hover:text-[#171923]'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setSelectedDate(getISTDate(2))}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                selectedDate === getISTDate(2)
                  ? 'bg-[#E31837] text-white shadow-2xs'
                  : 'bg-gray-100 text-[#667085] hover:bg-gray-200 hover:text-[#171923]'
              }`}
            >
              +2 Days
            </button>
          </div>
        </div>

        {/* Screen Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#667085] flex-shrink-0" />
          <select
            value={selectedScreenId}
            onChange={(e) => setSelectedScreenId(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-[#171923] focus:outline-none focus:border-[#E31837] cursor-pointer"
          >
            <option value="ALL">All Screens & Auditoriums</option>
            {screens.map((screen) => (
              <option key={screen.id} value={screen.id}>
                {screen.name} ({screen.soundSystem.includes('Atmos') ? 'Atmos 7.1' : '4K Laser'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Daily Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
              Total Screenings
            </span>
            <span className="text-2xl font-black text-[#171923] font-mono mt-0.5 block">
              {stats.totalShows}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E31837] flex items-center justify-center border border-red-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
              Auditoriums In Service
            </span>
            <span className="text-2xl font-black text-[#171923] font-mono mt-0.5 block">
              {stats.screensActive} / {screens.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200">
            <Tv className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
              Booked Seats Today
            </span>
            <span className="text-2xl font-black text-[#171923] font-mono mt-0.5 block">
              {stats.totalBookedSeats}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Shows Data Table */}
      <div className="rounded-3xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-150 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#171923]">Scheduled Screenings for {selectedDate}</h3>
            <p className="text-xs text-[#667085]">Verified against screen clash guards</p>
          </div>
          <span className="text-xs text-[#667085] font-mono">
            {filteredShows.length} show(s) programmed
          </span>
        </div>

        {filteredShows.length === 0 ? (
          <div className="p-12 text-center text-[#667085] space-y-3">
            <Clock className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-sm font-bold text-[#171923]">No showtimes scheduled for this date & screen</p>
            <p className="text-xs text-[#667085]">
              Click &ldquo;Schedule Cinema Showtime&rdquo; above to program the auditorium calendar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-[#667085] uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Time Slot (IST)</th>
                  <th className="py-3 px-4">Movie Title</th>
                  <th className="py-3 px-4">Screen / Audi</th>
                  <th className="py-3 px-4">Ticket Tiers</th>
                  <th className="py-3 px-4">Occupancy</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredShows.map((show) => {
                  const movie = movies.find((m) => m.id === show.movieId);
                  const screen = screens.find((s) => s.id === show.screenId);
                  const bookedSeats = storageService.getBookedSeatsForShow(show.id);
                  const totalSeats = screen?.totalSeats || 180;
                  const occupancy = Math.round((bookedSeats.length / totalSeats) * 100);

                  return (
                    <tr key={show.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <div className="font-extrabold text-[#171923] text-sm">{show.startTime}</div>
                        <div className="text-[10px] text-[#667085]">to {show.endTime}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {movie?.posterUrl && (
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-8 h-12 object-cover rounded shadow-2xs flex-shrink-0"
                            />
                          )}
                          <div>
                            <span className="font-bold text-[#171923] text-xs block">{movie?.title || show.movieId}</span>
                            <span className="text-[10px] text-[#667085]">
                              {movie?.language} • {movie?.durationMinutes} mins • {movie?.certification}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#171923] block">{screen?.name || show.screenId}</span>
                        <span className="text-[10px] text-[#667085]">{screen?.soundSystem || screen?.projection || "Digital"}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700">
                        <span className="text-amber-700 font-bold">R:₹{show.pricing.RECLINER}</span> •{' '}
                        <span className="text-sky-700 font-bold">P:₹{show.pricing.PRIME}</span> •{' '}
                        <span className="text-emerald-700 font-bold">C:₹{show.pricing.CLASSIC}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[#171923] font-bold">{bookedSeats.length} seats</span>
                          <span className="text-[#667085] text-[10px]">({occupancy}% full)</span>
                        </div>
                        <div className="w-20 bg-gray-200 h-1 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full ${
                              occupancy > 75 ? 'bg-red-500' : occupancy > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, occupancy)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            show.status === 'OPEN'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : show.status === 'SCHEDULED'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {show.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {show.status === 'OPEN' && (
                          <button
                            type="button"
                            onClick={() => setShowToDelete(show)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#E31837] transition-colors border border-red-200 cursor-pointer shadow-2xs"
                            title="Cancel / Delete Show"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Show Confirmation Dialog Modal */}
      {showToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 text-[#171923]">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#171923]">Cancel Showtime</h3>
                <p className="text-xs text-[#667085]">Deactivate screening from box office</p>
              </div>
            </div>

            <p className="text-xs text-[#667085] leading-relaxed">
              Are you sure you want to cancel the screening scheduled at{' '}
              <span className="font-bold text-[#171923]">{showToDelete.startTime} IST</span> on{' '}
              <span className="font-bold text-[#171923]">{showToDelete.date}</span>? Customers who booked seats will be eligible for a full refund.
            </p>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowToDelete(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Keep Screening
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelShow}
                className="px-4 py-2 bg-[#E31837] hover:bg-[#c91430] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Show Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 my-8 text-[#171923]">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-[#E31837]" />
                <h3 className="text-[#171923] font-extrabold text-base font-cinema">Schedule Cinema Showtime</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-Modal Error Display Banner */}
            {modalError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-red-800">Validation &amp; Schedule Error</p>
                  <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">{modalError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleValidateAndSchedule} className="space-y-4">
              {/* Select Movie */}
              <div>
                <label className="text-xs text-[#171923] font-bold block mb-1">
                  Select Movie <span className="text-[#E31837]">*</span>
                </label>
                <select
                  value={modalMovieId}
                  onChange={(e) => setModalMovieId(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-[#171923] focus:outline-none focus:border-[#E31837] focus:bg-white cursor-pointer"
                >
                  {schedulableMovies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.language} • {m.durationMinutes}m • {m.certification}) [
                      {m.status === 'NOW_SHOWING' ? 'Now Showing' : 'Coming Soon'}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Screen & Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#171923] font-bold block mb-1">
                    Screen / Audi <span className="text-[#E31837]">*</span>
                  </label>
                  <select
                    value={modalScreenId}
                    onChange={(e) => setModalScreenId(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-[#171923] focus:outline-none focus:border-[#E31837] focus:bg-white cursor-pointer"
                  >
                    {screens.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.totalSeats} seats)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#171923] font-bold block mb-1">
                    Show Date <span className="text-[#E31837]">*</span>
                  </label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-[#171923] focus:outline-none focus:border-[#E31837] focus:bg-white cursor-pointer"
                  />
                  {/* Quick date chips */}
                  <div className="flex items-center space-x-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setModalDate(getISTDate(0))}
                      className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded cursor-pointer font-medium"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalDate(getISTDate(1))}
                      className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded cursor-pointer font-medium"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalDate(getISTDate(2))}
                      className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded cursor-pointer font-medium"
                    >
                      +2 Days
                    </button>
                  </div>
                </div>
              </div>

              {/* Start Time & Estimated End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#171923] font-bold block mb-1">
                    Start Time (24h format e.g. 14:30) <span className="text-[#E31837]">*</span>
                  </label>
                  <input
                    type="time"
                    value={modalStartTime}
                    onChange={(e) => setModalStartTime(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-[#171923] font-mono focus:outline-none focus:border-[#E31837] focus:bg-white cursor-pointer"
                  />
                  {/* Quick slot shortcuts */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['10:30', '14:00', '17:30', '20:45'].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setModalStartTime(slot)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono cursor-pointer font-bold ${
                          modalStartTime === slot
                            ? 'bg-[#E31837] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#171923] font-bold block mb-1">
                    Screening End &amp; Buffer Window
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-700 space-y-1 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[11px]">Movie Runtime:</span>
                      <span className="text-[#171923] font-bold">{selectedModalMovie?.durationMinutes || 120} min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[11px]">Show Ends:</span>
                      <span className="text-emerald-700 font-bold">{calculatedTimes.endTime} IST</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 pt-0.5 border-t border-gray-200">
                      <span>+15m Cleaning buffer:</span>
                      <span className="text-amber-700 font-bold">{calculatedTimes.bufferEndTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Screen Clash Guard Status Preview */}
              {clashPreview && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                    clashPreview.hasOverlap
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {clashPreview.hasOverlap ? (
                    <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="font-bold block">
                      {clashPreview.hasOverlap ? 'Auditorium Clash Detected' : 'Auditorium Slot Is Available'}
                    </span>
                    <span className="text-[11px] block mt-0.5 leading-relaxed">
                      {clashPreview.hasOverlap
                        ? clashPreview.details
                        : `No conflicting screening on this screen. Start: ${modalStartTime} -> End: ${calculatedTimes.endTime} (+15m buffer).`}
                    </span>
                  </div>
                </div>
              )}

              {/* Custom Pricing for this Show */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-[#171923] uppercase tracking-wider block">
                  Custom Ticket Pricing for this Screening (₹)
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-amber-800 font-bold block mb-0.5">Recliner Tier (₹)</label>
                    <input
                      type="number"
                      min="50"
                      max="2000"
                      value={reclinerPrice}
                      onChange={(e) => setReclinerPrice(Number(e.target.value))}
                      required
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-[#171923] font-mono focus:outline-none focus:border-[#E31837] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-sky-800 font-bold block mb-0.5">Prime Tier (₹)</label>
                    <input
                      type="number"
                      min="50"
                      max="2000"
                      value={primePrice}
                      onChange={(e) => setPrimePrice(Number(e.target.value))}
                      required
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-[#171923] font-mono focus:outline-none focus:border-[#E31837] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-emerald-800 font-bold block mb-0.5">Classic Tier (₹)</label>
                    <input
                      type="number"
                      min="50"
                      max="2000"
                      value={classicPrice}
                      onChange={(e) => setClassicPrice(Number(e.target.value))}
                      required
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-[#171923] font-mono focus:outline-none focus:border-[#E31837] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (clashPreview?.hasOverlap ?? false)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#E31837] hover:bg-[#c91430] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Validating &amp; Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Validate &amp; Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShows;
