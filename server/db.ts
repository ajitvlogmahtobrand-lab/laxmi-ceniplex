import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import {
  Movie,
  Screen,
  Show,
  Booking,
  SeatHold,
  Coupon,
  HeroBanner,
  Announcement,
  CinemaSettings,
  AuditLog,
  StaffMember,
  WebsitePageContent,
  NotificationRecord,
  RentalEntitlement,
  PurchaseEntitlement,
  VideoOrder,
} from '../src/types';
import {
  INITIAL_SETTINGS,
  INITIAL_MOVIES,
  INITIAL_SCREENS,
  INITIAL_COUPONS,
  INITIAL_BANNERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_STAFF,
  INITIAL_PAGES,
  INITIAL_NOTIFICATIONS,
  generateInitialShows,
} from '../src/data/initialData';

export interface DatabaseSchema {
  settings: CinemaSettings;
  movies: Movie[];
  screens: Screen[];
  shows: Show[];
  bookings: Booking[];
  seatHolds: SeatHold[];
  coupons: Coupon[];
  banners: HeroBanner[];
  announcements: Announcement[];
  staff: StaffMember[];
  pages: WebsitePageContent[];
  notifications: NotificationRecord[];
  auditLogs: AuditLog[];
  rentals: RentalEntitlement[];
  purchases: PurchaseEntitlement[];
  videoOrders: VideoOrder[];
  version: number;
  lastUpdated: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cinema_db.json');

// Concurrency lock helper
class AsyncLock {
  private queue: Promise<void> = Promise.resolve();

  async acquire<T>(fn: () => Promise<T> | T): Promise<T> {
    let release: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previous = this.queue;
    this.queue = next;

    await previous;
    try {
      return await fn();
    } finally {
      release!();
    }
  }
}

export class CentralDatabase {
  private data: DatabaseSchema;
  private sseClients: Set<Response> = new Set();
  private lock = new AsyncLock();
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.movies && parsed.settings) {
          console.log(`[Database] Loaded persistent data from ${DB_FILE}`);
          parsed.rentals = parsed.rentals || [];
          parsed.purchases = parsed.purchases || [];
          parsed.videoOrders = parsed.videoOrders || [];

          // Merge any newly introduced OTT items from INITIAL_MOVIES if not present
          INITIAL_MOVIES.forEach((initM) => {
            if (!parsed.movies.some((m: Movie) => m.id === initM.id)) {
              parsed.movies.push(initM);
            }
          });

          return parsed;
        }
      }
    } catch (err) {
      console.error('[Database] Failed to read database file, seeding defaults:', err);
    }

    // Default initial seed
    const initialShows = generateInitialShows();
    const defaultData: DatabaseSchema = {
      settings: INITIAL_SETTINGS,
      movies: INITIAL_MOVIES,
      screens: INITIAL_SCREENS,
      shows: initialShows,
      bookings: [],
      seatHolds: [],
      coupons: INITIAL_COUPONS,
      banners: INITIAL_BANNERS,
      announcements: INITIAL_ANNOUNCEMENTS,
      staff: INITIAL_STAFF,
      pages: INITIAL_PAGES,
      notifications: INITIAL_NOTIFICATIONS,
      rentals: [],
      purchases: [],
      videoOrders: [],
      auditLogs: [
        {
          id: 'log-init',
          timestamp: new Date().toISOString(),
          actor: 'SYSTEM',
          action: 'CENTRAL_DATABASE_INITIALIZATION',
          targetType: 'SETTINGS',
          details: 'Central authoritative database seeded and active for all devices.',
        },
      ],
      version: 1,
      lastUpdated: new Date().toISOString(),
    };

    this.persistToDiskSync(defaultData);
    return defaultData;
  }

  private persistToDiskSync(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[Database] Failed to write to disk:', err);
    }
  }

  private triggerSave() {
    this.data.lastUpdated = new Date().toISOString();
    this.data.version += 1;

    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = setTimeout(() => {
      this.persistToDiskSync(this.data);
    }, 200);
  }

  // --- Real-time SSE Subscriptions ---
  public registerClient(res: Response) {
    this.sseClients.add(res);
    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  public getConnectedClientsCount(): number {
    return this.sseClients.size;
  }

  public broadcast(eventType: string, payload?: any) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify({
      type: eventType,
      data: payload,
      timestamp: Date.now(),
      version: this.data.version,
    })}\n\n`;

    for (const client of this.sseClients) {
      try {
        client.write(message);
      } catch (e) {
        this.sseClients.delete(client);
      }
    }
  }

  // --- Audit Logging ---
  public logAudit(actor: string, action: string, targetType: AuditLog['targetType'], details: string, targetId?: string) {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      targetType,
      targetId,
      details,
    };
    this.data.auditLogs.unshift(newLog);
    if (this.data.auditLogs.length > 500) this.data.auditLogs.pop();
    this.triggerSave();
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- Public Sync Snapshot ---
  public getPublicSnapshot() {
    // Purge expired seat holds
    const now = Date.now();
    this.data.seatHolds = this.data.seatHolds.filter((h) => h.expiresAt > now);

    // Build public occupied seats map (shows -> occupied seat labels)
    // Never expose customer names or amounts to unauthenticated clients
    const occupiedSeatsByShow: Record<string, string[]> = {};
    for (const show of this.data.shows) {
      const showBookings = this.data.bookings.filter(
        (b) => b.showId === show.id && (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING_VERIFICATION')
      );
      const booked = showBookings.flatMap((b) => b.seats.map((s) => s.seatLabel));
      const held = this.data.seatHolds.filter((h) => h.showId === show.id).map((h) => h.seatId);
      occupiedSeatsByShow[show.id] = Array.from(new Set([...booked, ...held]));
    }

    return {
      settings: this.data.settings,
      movies: this.data.movies,
      screens: this.data.screens,
      shows: this.data.shows,
      banners: this.data.banners.filter((b) => b.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
      allBanners: this.data.banners,
      announcements: this.data.announcements,
      coupons: this.data.coupons.filter((c) => c.isActive),
      pages: this.data.pages,
      notifications: this.data.notifications,
      occupiedSeatsByShow,
      version: this.data.version,
      lastUpdated: this.data.lastUpdated,
    };
  }

  // --- Movies Management ---
  public getMovies(): Movie[] {
    return this.data.movies;
  }

  public getMovieById(id: string): Movie | undefined {
    return this.data.movies.find((m) => m.id === id);
  }

  public saveMovie(movieData: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>, actor: string = 'rajanbhogta'): Movie {
    const newMovie: Movie = {
      ...movieData,
      id: `mov-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.movies.unshift(newMovie);
    this.triggerSave();
    this.logAudit(actor, 'CREATE_MOVIE', 'MOVIE', `Created movie "${newMovie.title}" (${newMovie.status})`, newMovie.id);
    this.broadcast('MOVIES_UPDATED', { movie: newMovie, action: 'CREATE' });
    return newMovie;
  }

  public updateMovie(id: string, updates: Partial<Movie>, actor: string = 'rajanbhogta'): Movie {
    const index = this.data.movies.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Movie not found');

    const updated: Movie = {
      ...this.data.movies[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.movies[index] = updated;
    this.triggerSave();
    this.logAudit(actor, 'UPDATE_MOVIE', 'MOVIE', `Updated movie "${updated.title}" (${updated.status})`, id);
    this.broadcast('MOVIES_UPDATED', { movie: updated, action: 'UPDATE' });
    return updated;
  }

  public deleteOrArchiveMovie(id: string, actor: string = 'rajanbhogta'): { success: boolean; action: 'DELETED' | 'ARCHIVED'; message: string } {
    const movie = this.data.movies.find((m) => m.id === id);
    if (!movie) throw new Error('Movie not found');

    const hasBookings = this.data.bookings.some((b) => b.movieId === id);
    if (hasBookings) {
      this.updateMovie(id, { status: 'ARCHIVED' }, actor);
      return {
        success: true,
        action: 'ARCHIVED',
        message: `Movie "${movie.title}" has past financial bookings. It was moved to ARCHIVED to preserve records.`,
      };
    }

    this.data.movies = this.data.movies.filter((m) => m.id !== id);
    this.triggerSave();
    this.logAudit(actor, 'DELETE_MOVIE', 'MOVIE', `Deleted movie "${movie.title}"`, id);
    this.broadcast('MOVIES_UPDATED', { id, action: 'DELETE' });
    return {
      success: true,
      action: 'DELETED',
      message: `Movie "${movie.title}" was completely deleted.`,
    };
  }

  // --- Banners Management ---
  public getBanners(): HeroBanner[] {
    return this.data.banners;
  }

  public saveBanner(bannerData: Omit<HeroBanner, 'id'>, actor: string = 'rajanbhogta'): HeroBanner {
    const newBanner: HeroBanner = {
      ...bannerData,
      id: `bnr-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
    };
    this.data.banners.push(newBanner);
    this.triggerSave();
    this.logAudit(actor, 'CREATE_BANNER', 'BANNER', `Created hero banner "${newBanner.title}"`, newBanner.id);
    this.broadcast('BANNERS_UPDATED', { banner: newBanner, action: 'CREATE' });
    return newBanner;
  }

  public updateBanner(id: string, updates: Partial<HeroBanner>, actor: string = 'rajanbhogta'): HeroBanner {
    const index = this.data.banners.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('Banner not found');

    const updated: HeroBanner = {
      ...this.data.banners[index],
      ...updates,
    };
    this.data.banners[index] = updated;
    this.triggerSave();
    this.logAudit(actor, 'UPDATE_BANNER', 'BANNER', `Updated hero banner "${updated.title}"`, id);
    this.broadcast('BANNERS_UPDATED', { banner: updated, action: 'UPDATE' });
    return updated;
  }

  public deleteBanner(id: string, actor: string = 'rajanbhogta'): boolean {
    const banner = this.data.banners.find((b) => b.id === id);
    if (!banner) return false;
    this.data.banners = this.data.banners.filter((b) => b.id !== id);
    this.triggerSave();
    this.logAudit(actor, 'DELETE_BANNER', 'BANNER', `Deleted hero banner "${banner.title}"`, id);
    this.broadcast('BANNERS_UPDATED', { id, action: 'DELETE' });
    return true;
  }

  public reorderBanners(orderedIds: string[], actor: string = 'rajanbhogta') {
    orderedIds.forEach((id, index) => {
      const b = this.data.banners.find((item) => item.id === id);
      if (b) b.displayOrder = index + 1;
    });
    this.data.banners.sort((a, b) => a.displayOrder - b.displayOrder);
    this.triggerSave();
    this.logAudit(actor, 'REORDER_BANNERS', 'BANNER', `Reordered homepage hero banners`);
    this.broadcast('BANNERS_UPDATED', { banners: this.data.banners, action: 'REORDER' });
  }

  // --- Screens Management ---
  public getScreens(): Screen[] {
    return this.data.screens;
  }

  public getScreenById(id: string): Screen | undefined {
    return this.data.screens.find((s) => s.id === id);
  }

  // --- Shows Management & Overlap Collision Detection ---
  public getShows(): Show[] {
    return this.data.shows;
  }

  public getShowById(id: string): Show | undefined {
    return this.data.shows.find((s) => s.id === id);
  }

  public checkShowOverlap(
    screenId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeShowId?: string
  ): { hasOverlap: boolean; conflictingShow?: Show; conflictingMovieTitle?: string; details?: string } {
    const screenShows = this.data.shows.filter(
      (s) => s.screenId === screenId && s.date === date && s.status !== 'CANCELLED' && s.id !== excludeShowId
    );

    const toMinutes = (timeStr: string): number => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);
    const buffer = 15; // 15 mins cleaning buffer

    for (const show of screenShows) {
      const showStart = toMinutes(show.startTime);
      const showEnd = toMinutes(show.endTime);
      const bufferedStart = Math.max(0, showStart - buffer);
      const bufferedEnd = showEnd + buffer;

      if (newStart < bufferedEnd && newEnd > bufferedStart) {
        const movie = this.getMovieById(show.movieId);
        const screen = this.getScreenById(screenId);
        const movieTitle = movie?.title || show.movieId;
        const details = `Schedule clash on ${screen?.name || 'Screen'}: "${movieTitle}" is scheduled ${show.startTime}–${show.endTime} (+15m cleaning buffer).`;
        return { hasOverlap: true, conflictingShow: show, conflictingMovieTitle: movieTitle, details };
      }
    }
    return { hasOverlap: false };
  }

  public saveShow(showData: Omit<Show, 'id' | 'createdAt' | 'status'> & { status?: Show['status'] }, actor: string = 'rajanbhogta'): Show {
    if (!showData.movieId) throw new Error('Movie selection is required.');
    if (!showData.screenId) throw new Error('Screen selection is required.');
    if (!showData.date) throw new Error('Show date is required.');
    if (!showData.startTime) throw new Error('Show start time is required.');
    if (!showData.endTime) throw new Error('Show end time is required.');

    const overlap = this.checkShowOverlap(showData.screenId, showData.date, showData.startTime, showData.endTime);
    if (overlap.hasOverlap) {
      throw new Error(overlap.details || 'Schedule clash with another show on this screen.');
    }

    const newShow: Show = {
      ...showData,
      status: showData.status || 'OPEN',
      id: `show-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.shows.unshift(newShow);
    this.triggerSave();

    const movie = this.getMovieById(newShow.movieId);
    this.logAudit(actor, 'CREATE_SHOW', 'SHOW', `Scheduled show for "${movie?.title || newShow.movieId}" on ${newShow.date} at ${newShow.startTime}`, newShow.id);
    this.broadcast('SHOWS_UPDATED', { show: newShow, action: 'CREATE' });
    return newShow;
  }

  public updateShow(id: string, updates: Partial<Show>, actor: string = 'rajanbhogta'): Show {
    const index = this.data.shows.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Show not found');

    const candidate: Show = { ...this.data.shows[index], ...updates };
    if (updates.screenId || updates.date || updates.startTime || updates.endTime) {
      const overlap = this.checkShowOverlap(candidate.screenId, candidate.date, candidate.startTime, candidate.endTime, id);
      if (overlap.hasOverlap) {
        throw new Error(overlap.details || 'Update creates a clash with another scheduled show.');
      }
    }

    this.data.shows[index] = candidate;
    this.triggerSave();
    this.logAudit(actor, 'UPDATE_SHOW', 'SHOW', `Updated show ${id}`, id);
    this.broadcast('SHOWS_UPDATED', { show: candidate, action: 'UPDATE' });
    return candidate;
  }

  public cancelShow(id: string, reason: string = 'Cancelled by Admin', actor: string = 'rajanbhogta'): Show {
    return this.updateShow(id, { status: 'CANCELLED' }, actor);
  }

  // --- Seat Holds & Atomic Concurrency ---
  public async holdSeats(
    showId: string,
    seatLabels: string[],
    userId: string,
    holdMinutes: number = 8
  ): Promise<{ success: boolean; expiresAt: number; failedSeats?: string[] }> {
    return this.lock.acquire(async () => {
      const now = Date.now();
      // Remove expired holds
      this.data.seatHolds = this.data.seatHolds.filter((h) => h.expiresAt > now);

      // Check confirmed/pending bookings
      const booked = this.getBookedSeatsForShow(showId);
      const conflictingBooked = seatLabels.filter((s) => booked.includes(s));
      if (conflictingBooked.length > 0) {
        return { success: false, expiresAt: 0, failedSeats: conflictingBooked };
      }

      // Check held by someone else
      const conflictingHeld = this.data.seatHolds.filter(
        (h) => h.showId === showId && seatLabels.includes(h.seatId) && h.userId !== userId
      );
      if (conflictingHeld.length > 0) {
        return { success: false, expiresAt: 0, failedSeats: conflictingHeld.map((h) => h.seatId) };
      }

      // Refresh this user's holds
      this.data.seatHolds = this.data.seatHolds.filter((h) => !(h.showId === showId && h.userId === userId));

      const expiresAt = now + holdMinutes * 60 * 1000;
      const newHolds: SeatHold[] = seatLabels.map((seatId) => ({
        showId,
        seatId,
        userId,
        expiresAt,
      }));

      this.data.seatHolds.push(...newHolds);
      this.triggerSave();
      this.broadcast('SEATS_UPDATED', { showId, occupiedSeats: this.getOccupiedSeatsForShow(showId) });
      return { success: true, expiresAt };
    });
  }

  public async releaseHoldsForUser(showId: string, userId: string) {
    return this.lock.acquire(async () => {
      this.data.seatHolds = this.data.seatHolds.filter((h) => !(h.showId === showId && h.userId === userId));
      this.triggerSave();
      this.broadcast('SEATS_UPDATED', { showId, occupiedSeats: this.getOccupiedSeatsForShow(showId) });
    });
  }

  public getBookedSeatsForShow(showId: string): string[] {
    const showBookings = this.data.bookings.filter(
      (b) => b.showId === showId && (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING_VERIFICATION')
    );
    return Array.from(new Set(showBookings.flatMap((b) => b.seats.map((s) => s.seatLabel))));
  }

  public getOccupiedSeatsForShow(showId: string): string[] {
    const now = Date.now();
    const booked = this.getBookedSeatsForShow(showId);
    const validHolds = this.data.seatHolds.filter((h) => h.showId === showId && h.expiresAt > now).map((h) => h.seatId);
    return Array.from(new Set([...booked, ...validHolds]));
  }

  // --- Bookings & Transaction Validation ---
  public async createPendingUpiBooking(
    bookingData: Omit<Booking, 'id' | 'ticketToken' | 'createdAt' | 'updatedAt' | 'bookingStatus' | 'paymentStatus'> & {
      upiReference: string;
      receiptUrl?: string;
    }
  ): Promise<Booking> {
    return this.lock.acquire(async () => {
      const cleanUtr = (bookingData.upiReference || '').trim().toUpperCase();
      if (!cleanUtr || cleanUtr.length < 6) {
        throw new Error('Please enter a valid UPI Transaction Reference / UTR Number (minimum 6 characters).');
      }

      // 1. Prevent duplicate UTR
      const duplicateUtr = this.data.bookings.find(
        (b) =>
          b.upiReference?.toUpperCase() === cleanUtr &&
          (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING_VERIFICATION')
      );
      if (duplicateUtr) {
        throw new Error(`UTR reference "${cleanUtr}" has already been submitted for booking #${duplicateUtr.id}.`);
      }

      // 2. Atomic seat collision check
      const bookedSeats = this.getBookedSeatsForShow(bookingData.showId);
      const requestedLabels = bookingData.seats.map((s) => s.seatLabel);
      const alreadyTaken = requestedLabels.filter((s) => bookedSeats.includes(s));
      if (alreadyTaken.length > 0) {
        throw new Error(`Seats ${alreadyTaken.join(', ')} were just reserved by another customer. Please choose other seats.`);
      }

      // 3. Server-side authoritative price recalculation
      const show = this.getShowById(bookingData.showId);
      const screen = show ? this.getScreenById(show.screenId) : undefined;
      let ticketSubtotal = 0;
      for (const seat of bookingData.seats) {
        const cat = seat.category;
        const price = (show && show.pricing && show.pricing[cat]) || seat.price;
        seat.price = price;
        ticketSubtotal += price;
      }

      const settings = this.data.settings;
      const convenienceFee = settings.convenienceFeePerTicket * bookingData.seats.length;
      const gstAmount = Math.round((convenienceFee * settings.gstPercentage) / 100);
      const concessionsTotal = (bookingData.concessions || []).reduce((sum, c) => sum + c.price * c.quantity, 0);

      let discountAmount = 0;
      if (bookingData.couponCode) {
        const coupon = this.data.coupons.find((c) => c.code.toUpperCase() === bookingData.couponCode?.toUpperCase() && c.isActive);
        if (coupon) {
          if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = Math.round((ticketSubtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
          } else {
            discountAmount = coupon.discountValue;
          }
          coupon.usageCount = (coupon.usageCount || 0) + 1;
        }
      }

      const calculatedTotal = Math.max(0, ticketSubtotal + concessionsTotal + convenienceFee + gstAmount - discountAmount);

      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const randChar = letters[Math.floor(Math.random() * letters.length)];
      const bookingId = `LXM-${new Date().getFullYear().toString().slice(-2)}${randChar}-${randomDigits}`;
      const ticketToken = `TOKEN_${bookingId}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const newBooking: Booking = {
        ...bookingData,
        id: bookingId,
        ticketToken,
        subtotal: ticketSubtotal + concessionsTotal,
        convenienceFee,
        gstAmount,
        discountAmount,
        totalAmount: calculatedTotal,
        bookingStatus: 'PENDING_VERIFICATION',
        paymentStatus: 'PENDING_VERIFICATION',
        paymentMethod: 'UPI_QR',
        upiReference: cleanUtr,
        receiptUrl: bookingData.receiptUrl,
        upiSubmittedAt: new Date().toISOString(),
        isAdmitted: false,
        statusHistory: [
          {
            status: 'PENDING_VERIFICATION',
            changedAt: new Date().toISOString(),
            changedBy: bookingData.customerName || 'CUSTOMER',
            notes: `Submitted UPI payment with UTR: ${cleanUtr} for ₹${calculatedTotal}. Awaiting Box Office verification.`,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.data.bookings.unshift(newBooking);

      // Release hold for this user
      if (bookingData.userId) {
        this.data.seatHolds = this.data.seatHolds.filter((h) => !(h.showId === bookingData.showId && h.userId === bookingData.userId));
      }

      this.triggerSave();
      this.logAudit(
        bookingData.customerName || 'CUSTOMER',
        'SUBMIT_UPI_PAYMENT',
        'BOOKING',
        `Booking ${bookingId} submitted for UPI payment verification (UTR: ${cleanUtr}, ₹${calculatedTotal}) for "${bookingData.movieTitle}"`,
        bookingId
      );

      this.broadcast('SEATS_UPDATED', { showId: bookingData.showId, occupiedSeats: this.getOccupiedSeatsForShow(bookingData.showId) });
      this.broadcast('BOOKINGS_UPDATED', { bookingId: newBooking.id, action: 'CREATE' });
      return newBooking;
    });
  }

  public async createConfirmedBooking(
    bookingData: Omit<Booking, 'id' | 'ticketToken' | 'createdAt' | 'updatedAt' | 'bookingStatus'>
  ): Promise<Booking> {
    return this.lock.acquire(async () => {
      const bookedSeats = this.getBookedSeatsForShow(bookingData.showId);
      const requestedLabels = bookingData.seats.map((s) => s.seatLabel);
      const alreadyTaken = requestedLabels.filter((s) => bookedSeats.includes(s));
      if (alreadyTaken.length > 0) {
        throw new Error(`Seats ${alreadyTaken.join(', ')} were just confirmed by another customer. Please select different seats.`);
      }

      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const randChar = letters[Math.floor(Math.random() * letters.length)];
      const bookingId = `LXM-${new Date().getFullYear().toString().slice(-2)}${randChar}-${randomDigits}`;
      const ticketToken = `TOKEN_${bookingId}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const newBooking: Booking = {
        ...bookingData,
        id: bookingId,
        ticketToken,
        bookingStatus: 'CONFIRMED',
        paymentStatus: 'SUCCESS',
        isAdmitted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.data.bookings.unshift(newBooking);

      if (bookingData.userId) {
        this.data.seatHolds = this.data.seatHolds.filter((h) => !(h.showId === bookingData.showId && h.userId === bookingData.userId));
      }

      this.triggerSave();
      this.broadcast('SEATS_UPDATED', { showId: bookingData.showId, occupiedSeats: this.getOccupiedSeatsForShow(bookingData.showId) });
      this.broadcast('BOOKINGS_UPDATED', { bookingId: newBooking.id, action: 'CONFIRM' });
      return newBooking;
    });
  }

  public getBookings(filterUserId?: string, isAdmin: boolean = false): Booking[] {
    if (isAdmin) {
      return this.data.bookings;
    }
    if (!filterUserId) {
      return [];
    }
    const q = filterUserId.trim().toLowerCase();
    return this.data.bookings.filter(
      (b) =>
        (b.userId && b.userId.toLowerCase() === q) ||
        (b.customerEmail && b.customerEmail.toLowerCase() === q) ||
        (b.customerPhone && b.customerPhone === q) ||
        b.id.toLowerCase() === q
    );
  }

  public getBookingById(id: string, filterUserId?: string, isAdmin: boolean = false): Booking | undefined {
    const booking = this.data.bookings.find((b) => b.id === id || b.ticketToken === id);
    if (!booking) return undefined;
    if (isAdmin) return booking;

    if (filterUserId) {
      const q = filterUserId.trim().toLowerCase();
      const matches =
        (booking.userId && booking.userId.toLowerCase() === q) ||
        (booking.customerEmail && booking.customerEmail.toLowerCase() === q) ||
        (booking.customerPhone && booking.customerPhone === q) ||
        booking.id.toLowerCase() === q;
      if (matches) return booking;
    }
    return undefined;
  }

  public async verifyPayment(
    bookingId: string,
    action: 'ACCEPT' | 'REJECT',
    reason?: string,
    actor: string = 'rajanbhogta (Admin)'
  ): Promise<Booking> {
    return this.lock.acquire(async () => {
      const booking = this.data.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      const now = new Date().toISOString();
      if (action === 'ACCEPT') {
        booking.bookingStatus = 'CONFIRMED';
        booking.paymentStatus = 'VERIFIED';
        booking.verifiedBy = actor;
        booking.verifiedAt = now;
        booking.statusHistory = booking.statusHistory || [];
        booking.statusHistory.push({
          status: 'CONFIRMED',
          changedAt: now,
          changedBy: actor,
          notes: 'Box Office verified UPI payment with India Post Payment Bank records. Ticket QR active.',
        });
        this.logAudit(actor, 'VERIFY_PAYMENT_SUCCESS', 'PAYMENT', `Verified UPI payment for booking ${bookingId}`, bookingId);
      } else {
        booking.bookingStatus = 'REJECTED';
        booking.paymentStatus = 'FAILED';
        booking.rejectionReason = reason || 'Payment could not be verified against bank statements.';
        booking.statusHistory = booking.statusHistory || [];
        booking.statusHistory.push({
          status: 'REJECTED',
          changedAt: now,
          changedBy: actor,
          notes: `Payment rejected: ${booking.rejectionReason}. Seats released.`,
        });
        this.logAudit(actor, 'VERIFY_PAYMENT_REJECTED', 'PAYMENT', `Rejected UPI payment for booking ${bookingId}: ${booking.rejectionReason}`, bookingId);
      }

      booking.updatedAt = now;
      this.triggerSave();
      this.broadcast('SEATS_UPDATED', { showId: booking.showId, occupiedSeats: this.getOccupiedSeatsForShow(booking.showId) });
      this.broadcast('BOOKINGS_UPDATED', { bookingId, action });
      return booking;
    });
  }

  public async cancelBooking(bookingId: string, reason: string = 'Customer cancellation', actor: string = 'rajanbhogta'): Promise<{ success: boolean; refundAmount: number }> {
    return this.lock.acquire(async () => {
      const booking = this.data.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');
      if (booking.bookingStatus === 'CANCELLED') throw new Error('Booking is already cancelled.');

      // Check cancellation policy
      const show = this.getShowById(booking.showId);
      let refundAmount = 0;
      if (show) {
        const showTime = new Date(`${show.date}T${show.startTime}:00`).getTime();
        const hoursUntilShow = (showTime - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilShow >= this.data.settings.cancellationCutoffHours) {
          // 75% ticket subtotal refund
          refundAmount = Math.round(booking.subtotal * 0.75);
        }
      }

      booking.bookingStatus = 'CANCELLED';
      booking.paymentStatus = 'REFUNDED';
      booking.cancellationReason = reason;
      booking.refundAmount = refundAmount;
      booking.updatedAt = new Date().toISOString();

      this.triggerSave();
      this.logAudit(actor, 'CANCEL_BOOKING', 'BOOKING', `Cancelled booking ${bookingId}. Refund: ₹${refundAmount}`, bookingId);
      this.broadcast('SEATS_UPDATED', { showId: booking.showId, occupiedSeats: this.getOccupiedSeatsForShow(booking.showId) });
      this.broadcast('BOOKINGS_UPDATED', { bookingId, action: 'CANCEL' });
      return { success: true, refundAmount };
    });
  }

  public validateTicketToken(tokenOrId: string, actor: string = 'Gate Staff'): {
    success: boolean;
    booking?: Booking;
    status: 'VALID_NEW' | 'ALREADY_USED' | 'CANCELLED' | 'INVALID';
    message: string;
  } {
    const clean = tokenOrId.trim();
    const booking = this.data.bookings.find((b) => b.ticketToken === clean || b.id.toUpperCase() === clean.toUpperCase());
    if (!booking) {
      return { success: false, status: 'INVALID', message: 'No matching ticket found for this token or booking ID.' };
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return { success: false, booking, status: 'CANCELLED', message: 'This ticket has been cancelled and cannot be admitted.' };
    }

    if (booking.bookingStatus === 'PENDING_VERIFICATION') {
      return { success: false, booking, status: 'INVALID', message: 'Ticket payment is pending Box Office verification.' };
    }

    if (booking.isAdmitted) {
      return {
        success: false,
        booking,
        status: 'ALREADY_USED',
        message: `Ticket already used for entry at ${booking.admittedAt ? new Date(booking.admittedAt).toLocaleTimeString('en-IN') : 'earlier'}. Duplicate entry rejected!`,
      };
    }

    // Mark as admitted
    booking.isAdmitted = true;
    booking.admittedAt = new Date().toISOString();
    this.triggerSave();
    this.logAudit(actor, 'ADMIT_TICKET', 'BOOKING', `Admitted ticket for booking #${booking.id} (${booking.customerName})`, booking.id);
    this.broadcast('BOOKINGS_UPDATED', { bookingId: booking.id, action: 'ADMIT' });
    return { success: true, booking, status: 'VALID_NEW', message: 'Valid ticket! Entry approved for turnstile admission.' };
  }

  // --- Settings ---
  public getSettings(): CinemaSettings {
    return this.data.settings;
  }

  public updateSettings(newSettings: Partial<CinemaSettings>, actor: string = 'rajanbhogta'): CinemaSettings {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.triggerSave();
    this.logAudit(actor, 'UPDATE_SETTINGS', 'SETTINGS', `Updated cinema operational settings and fees`);
    this.broadcast('SETTINGS_UPDATED', { settings: this.data.settings });
    return this.data.settings;
  }

  // --- Announcements ---
  public getAnnouncements(): Announcement[] {
    return this.data.announcements;
  }

  public saveAnnouncements(announcements: Announcement[], actor: string = 'rajanbhogta') {
    this.data.announcements = announcements;
    this.triggerSave();
    this.logAudit(actor, 'UPDATE_ANNOUNCEMENTS', 'SETTINGS', `Updated announcement ticker`);
    this.broadcast('ANNOUNCEMENTS_UPDATED', { announcements: this.data.announcements });
  }

  // --- Pages ---
  public getPages(): WebsitePageContent[] {
    return this.data.pages;
  }

  public updatePage(id: string, updates: Partial<WebsitePageContent>, actor: string = 'rajanbhogta'): WebsitePageContent {
    const idx = this.data.pages.findIndex((p) => p.id === id || p.slug === id);
    if (idx === -1) throw new Error('Page not found');
    this.data.pages[idx] = { ...this.data.pages[idx], ...updates, updatedAt: new Date().toISOString() };
    this.triggerSave();
    this.logAudit(actor, 'UPDATE_PAGE', 'PAGE', `Updated page content: ${this.data.pages[idx].title}`);
    this.broadcast('PAGES_UPDATED', { page: this.data.pages[idx] });
    return this.data.pages[idx];
  }

  // --- Coupons ---
  public getCoupons(): Coupon[] {
    return this.data.coupons;
  }

  public saveCoupon(couponData: Omit<Coupon, 'id' | 'usageCount'>, actor: string = 'rajanbhogta'): Coupon {
    const newCoupon: Coupon = {
      ...couponData,
      id: `cpn-${Date.now().toString(36)}`,
      usageCount: 0,
    };
    this.data.coupons.push(newCoupon);
    this.triggerSave();
    this.broadcast('COUPONS_UPDATED', { coupon: newCoupon });
    return newCoupon;
  }

  // --- Analytics ---
  public getAnalytics() {
    const bookings = this.data.bookings;
    const confirmed = bookings.filter((b) => b.bookingStatus === 'CONFIRMED');
    const cancelled = bookings.filter((b) => b.bookingStatus === 'CANCELLED');

    const totalRevenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalRefunds = cancelled.reduce((sum, b) => sum + (b.refundAmount || 0), 0);
    const netRevenue = totalRevenue - totalRefunds;
    const ticketsSold = confirmed.reduce((sum, b) => sum + b.seats.length, 0);

    const activeMovies = this.data.movies.filter((m) => m.status === 'NOW_SHOWING').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayShows = this.data.shows.filter((s) => s.date === todayStr && s.status === 'OPEN').length;

    const movieStats: Record<string, { title: string; revenue: number; tickets: number }> = {};
    confirmed.forEach((b) => {
      if (!movieStats[b.movieId]) {
        movieStats[b.movieId] = { title: b.movieTitle, revenue: 0, tickets: 0 };
      }
      movieStats[b.movieId].revenue += b.totalAmount;
      movieStats[b.movieId].tickets += b.seats.length;
    });

    return {
      totalBookings: confirmed.length,
      cancelledBookings: cancelled.length,
      ticketsSold,
      grossRevenue: totalRevenue,
      totalRefunds,
      netRevenue,
      activeMovies,
      todayShows,
      movieStats: Object.values(movieStats),
    };
  }

  // --- Restore & Reset ---
  public restoreDatabase(backupData: any, actor: string = 'rajanbhogta'): { success: boolean; message: string } {
    try {
      if (!backupData || typeof backupData !== 'object') {
        return { success: false, message: 'Invalid backup payload.' };
      }
      if (backupData.settings) this.data.settings = backupData.settings;
      if (backupData.movies) this.data.movies = backupData.movies;
      if (backupData.screens) this.data.screens = backupData.screens;
      if (backupData.shows) this.data.shows = backupData.shows;
      if (backupData.banners) this.data.banners = backupData.banners;
      if (backupData.bookings) this.data.bookings = backupData.bookings;
      if (backupData.announcements) this.data.announcements = backupData.announcements;
      if (backupData.pages) this.data.pages = backupData.pages;
      if (backupData.coupons) this.data.coupons = backupData.coupons;

      this.triggerSave();
      this.logAudit(actor, 'RESTORE_DATABASE', 'SETTINGS', 'Restored central database from backup file');
      this.broadcast('FULL_SYNC', this.getPublicSnapshot());
      return { success: true, message: 'Database restored successfully!' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  public resetDatabase(actor: string = 'rajanbhogta') {
    this.data.settings = INITIAL_SETTINGS;
    this.data.movies = INITIAL_MOVIES;
    this.data.screens = INITIAL_SCREENS;
    this.data.shows = generateInitialShows();
    this.data.banners = INITIAL_BANNERS;
    this.data.announcements = INITIAL_ANNOUNCEMENTS;
    this.data.bookings = [];
    this.data.seatHolds = [];
    this.data.coupons = INITIAL_COUPONS;
    this.data.pages = INITIAL_PAGES;

    this.triggerSave();
    this.logAudit(actor, 'RESET_DATABASE', 'SETTINGS', 'Reset central cinema database to defaults');
    this.broadcast('FULL_SYNC', this.getPublicSnapshot());
  }

  // --- Digital Rentals, Video Purchases & Entitlements ---
  public getRentals(userId?: string, isAdmin: boolean = false): RentalEntitlement[] {
    const rentals = this.data.rentals || [];
    const now = Date.now();
    let updatedAny = false;

    // Server-side expiry audit
    rentals.forEach((r) => {
      if (r.status === 'ACTIVE' && new Date(r.expiresAt).getTime() <= now) {
        r.status = 'EXPIRED';
        updatedAny = true;
      }
    });

    if (updatedAny) {
      this.triggerSave();
    }

    if (isAdmin) return rentals;
    if (!userId) return [];
    return rentals.filter((r) => r.userId === userId);
  }

  public getPurchases(userId?: string, isAdmin: boolean = false): PurchaseEntitlement[] {
    const purchases = this.data.purchases || [];
    if (isAdmin) return purchases;
    if (!userId) return [];
    return purchases.filter((p) => p.userId === userId);
  }

  public getVideoOrders(userId?: string, isAdmin: boolean = false): VideoOrder[] {
    const orders = this.data.videoOrders || [];
    if (isAdmin) return orders;
    if (!userId) return [];
    return orders.filter((o) => o.userId === userId);
  }

  public createVideoOrder(orderData: Omit<VideoOrder, 'id' | 'createdAt'>): VideoOrder {
    const id = `vord-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    const newOrder: VideoOrder = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
    };

    if (!this.data.videoOrders) this.data.videoOrders = [];
    this.data.videoOrders.unshift(newOrder);
    this.triggerSave();

    this.logAudit(
      orderData.customerName || orderData.userId,
      'CREATE_VIDEO_ORDER',
      'PAYMENT',
      `Placed ${orderData.orderType} order for "${orderData.contentTitle}" (₹${orderData.amount})`,
      id
    );

    this.broadcast('VIDEO_ORDER_CREATED', newOrder);
    return newOrder;
  }

  public verifyVideoOrder(
    orderId: string,
    action: 'APPROVE' | 'REJECT',
    actor: string = 'rajanbhogta (Admin)'
  ): { success: boolean; order: VideoOrder; entitlement?: RentalEntitlement | PurchaseEntitlement } {
    const orders = this.data.videoOrders || [];
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Video order not found');

    const content = this.data.movies.find((m) => m.id === order.contentId);

    if (action === 'APPROVE') {
      order.paymentStatus = 'PAID';
      order.verifiedAt = new Date().toISOString();
      order.verifiedBy = actor;

      let entitlement: RentalEntitlement | PurchaseEntitlement | undefined;

      if (order.orderType === 'RENTAL') {
        const durationHours = order.rentalDurationHours || content?.rentalDurationHours || 48;
        const now = Date.now();
        const expiresAt = new Date(now + durationHours * 3600 * 1000).toISOString();
        const rentalId = `rent-${now.toString(36)}-${Math.random().toString(36).substr(2, 4)}`;

        const rental: RentalEntitlement = {
          id: rentalId,
          userId: order.userId,
          userEmail: order.userEmail,
          userPhone: order.customerPhone,
          contentId: order.contentId,
          contentTitle: order.contentTitle,
          posterUrl: content?.posterUrl || '',
          contentType: content?.contentType || 'VIDEO_RENT',
          orderId: order.id,
          amountPaidINR: order.amount,
          durationHours,
          purchasedAt: new Date(now).toISOString(),
          expiresAt,
          status: 'ACTIVE',
          playbackToken: `tok_rent_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        };

        if (!this.data.rentals) this.data.rentals = [];
        this.data.rentals.unshift(rental);
        entitlement = rental;

        this.logAudit(actor, 'VERIFY_RENTAL_ORDER', 'PAYMENT', `Verified rental payment for "${order.contentTitle}" by ${order.userEmail}`, rentalId);
        this.broadcast('RENTAL_ACTIVATED', rental);
      } else {
        // PURCHASE
        const purchaseId = `buy-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
        const purchase: PurchaseEntitlement = {
          id: purchaseId,
          userId: order.userId,
          userEmail: order.userEmail,
          userPhone: order.customerPhone,
          contentId: order.contentId,
          contentTitle: order.contentTitle,
          posterUrl: content?.posterUrl || '',
          contentType: content?.contentType || 'VIDEO_BUY',
          orderId: order.id,
          amountPaidINR: order.amount,
          purchasedAt: new Date().toISOString(),
          status: 'ACTIVE',
          playbackToken: `tok_perm_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        };

        if (!this.data.purchases) this.data.purchases = [];
        this.data.purchases.unshift(purchase);
        entitlement = purchase;

        this.logAudit(actor, 'VERIFY_PURCHASE_ORDER', 'PAYMENT', `Verified permanent purchase for "${order.contentTitle}" by ${order.userEmail}`, purchaseId);
        this.broadcast('PURCHASE_ACTIVATED', purchase);
      }

      this.triggerSave();
      return { success: true, order, entitlement };
    } else {
      order.paymentStatus = 'FAILED';
      this.triggerSave();
      this.logAudit(actor, 'REJECT_VIDEO_ORDER', 'PAYMENT', `Rejected video order ${orderId}`, orderId);
      return { success: true, order };
    }
  }

  public checkPlaybackAccess(contentId: string, userId?: string): {
    allowed: boolean;
    reason?: 'FREE_CONTENT' | 'PURCHASE_ENTITLED' | 'RENTAL_ACTIVE' | 'RENTAL_EXPIRED' | 'PAYMENT_REQUIRED' | 'CONTENT_NOT_FOUND' | 'UNAUTHENTICATED';
    message?: string;
    playbackToken?: string;
    playbackId?: string;
    provider?: string;
    isRental?: boolean;
    isPurchase?: boolean;
    expiresAt?: string;
  } {
    const content = this.data.movies.find((m) => m.id === contentId);
    if (!content) {
      return { allowed: false, reason: 'CONTENT_NOT_FOUND', message: 'Video content not found in database.' };
    }

    // 1. Free content check
    if (content.monetization === 'FREE' || (!content.rentPriceINR && !content.buyPriceINR && content.monetization !== 'RENT' && content.monetization !== 'BUY')) {
      return {
        allowed: true,
        reason: 'FREE_CONTENT',
        playbackToken: `free_token_${content.id}`,
        playbackId: content.playbackId || 'demo_stream_preview_720p',
        provider: content.videoProvider || 'CLOUDFLARE_STREAM',
      };
    }

    if (!userId) {
      return {
        allowed: false,
        reason: 'UNAUTHENTICATED',
        message: 'Please sign in to access this premium digital content.',
      };
    }

    // 2. Permanent Purchase check
    const purchases = this.data.purchases || [];
    const activePurchase = purchases.find((p) => p.contentId === contentId && p.userId === userId && p.status === 'ACTIVE');
    if (activePurchase) {
      return {
        allowed: true,
        isPurchase: true,
        reason: 'PURCHASE_ENTITLED',
        playbackToken: activePurchase.playbackToken,
        playbackId: content.playbackId || 'demo_stream_purchased_1080p',
        provider: content.videoProvider || 'CLOUDFLARE_STREAM',
      };
    }

    // 3. Rental check with strict server-side expiry enforcement
    const rentals = this.data.rentals || [];
    const userRentals = rentals.filter((r) => r.contentId === contentId && r.userId === userId);
    const now = Date.now();

    for (const rental of userRentals) {
      const expiryTimestamp = new Date(rental.expiresAt).getTime();
      if (expiryTimestamp > now && rental.status === 'ACTIVE') {
        return {
          allowed: true,
          isRental: true,
          reason: 'RENTAL_ACTIVE',
          expiresAt: rental.expiresAt,
          playbackToken: rental.playbackToken,
          playbackId: content.playbackId || 'demo_stream_rented_1080p',
          provider: content.videoProvider || 'CLOUDFLARE_STREAM',
        };
      } else if (rental.status === 'ACTIVE') {
        // Enforce expiration immediately on the server
        rental.status = 'EXPIRED';
        this.triggerSave();
      }
    }

    // Check if any expired rental exists
    const hasExpiredRental = userRentals.some((r) => r.status === 'EXPIRED');
    if (hasExpiredRental) {
      return {
        allowed: false,
        reason: 'RENTAL_EXPIRED',
        message: 'Your rental viewing window has expired. Please renew your rental to resume streaming.',
      };
    }

    return {
      allowed: false,
      reason: 'PAYMENT_REQUIRED',
      message: 'Active rental or digital purchase entitlement required to stream this video.',
    };
  }
}

export const centralDb = new CentralDatabase();
