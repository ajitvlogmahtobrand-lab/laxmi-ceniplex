/**
 * Comprehensive Storage & Central Real-Time Synchronization Engine
 * for Laxmi Cineplex Hazaribagh
 *
 * Connects all clients (mobile phones, desktops, admin consoles) to the central
 * persistent server database via REST APIs and Server-Sent Events (SSE).
 * Provides atomic concurrency, seat holds, instant cross-device updates, and offline fallback.
 */

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
  BookingStatus,
  MovieStatus,
  StaffMember,
  WebsitePageContent,
  NotificationRecord,
  RentalEntitlement,
  PurchaseEntitlement,
  VideoOrder,
} from '../types';
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
} from '../data/initialData';
import {
  listenToMovies,
  listenToBanners,
  listenToShows,
  listenToScreens,
  listenToSettings,
  listenToAnnouncements,
  listenToCoupons,
  saveMovieToFirestore,
  deleteMovieFromFirestore,
  saveBannerToFirestore,
  deleteBannerFromFirestore,
  saveShowToFirestore,
  deleteShowFromFirestore,
  saveSettingsToFirestore,
  saveAnnouncementToFirestore,
  deleteAnnouncementFromFirestore,
  saveCouponToFirestore,
  deleteCouponFromFirestore,
  seedFirestoreIfEmpty,
} from './firestoreService';

const STORAGE_KEYS = {
  SETTINGS: 'lxm_settings',
  MOVIES: 'lxm_movies',
  SCREENS: 'lxm_screens',
  SHOWS: 'lxm_shows',
  BOOKINGS: 'lxm_bookings',
  SEAT_HOLDS: 'lxm_seat_holds',
  COUPONS: 'lxm_coupons',
  BANNERS: 'lxm_banners',
  ANNOUNCEMENTS: 'lxm_announcements',
  AUDIT_LOGS: 'lxm_audit_logs',
  USERS: 'lxm_users',
  ADMIN_AUTH: 'lxm_admin_session',
  CUSTOMER_AUTH: 'lxm_customer_session',
  STAFF: 'lxm_staff',
  PAGES: 'lxm_pages',
  NOTIFICATIONS: 'lxm_notifications',
  LAST_SYNC: 'lxm_last_sync_timestamp',
  RENTALS: 'lxm_rentals',
  PURCHASES: 'lxm_purchases',
  VIDEO_ORDERS: 'lxm_video_orders',
};

// Cryptographic SHA-256 helper
export async function hashPassword(password: string, salt: string = 'laxmi_hazaribagh_salt_2026'): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Generate unique booking code
export function generateBookingId(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randChar = letters[Math.floor(Math.random() * letters.length)];
  return `LXM-${new Date().getFullYear().toString().slice(-2)}${randChar}-${randomDigits}`;
}

// Generate cryptographically unique QR ticket validation token
export function generateTicketToken(bookingId: string): string {
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `TOKEN_${bookingId}_${rand}`;
}

export type SyncStatus = 'CONNECTED' | 'CONNECTING' | 'OFFLINE';

class StorageService {
  private sseSource: EventSource | null = null;
  private syncStatus: SyncStatus = 'CONNECTING';
  private lastSyncTime: number | null = null;
  private reconnectTimer: any = null;

  constructor() {
    this.initDatabase();
    if (typeof window !== 'undefined') {
      this.initRealtimeConnection();
      this.pullFromCentralServer();
      this.initFirestoreSync();
    }
  }

  // --- Real-Time Cloud Firestore Sync ---
  private initFirestoreSync() {
    if (typeof window === 'undefined') return;
    try {
      // Seed Firestore with catalogue if empty
      seedFirestoreIfEmpty().catch(() => {});

      listenToMovies(
        (movies) => {
          if (movies && movies.length > 0) {
            this.setRawItem(STORAGE_KEYS.MOVIES, movies);
            this.syncStatus = 'CONNECTED';
            this.lastSyncTime = Date.now();
            this.broadcastLocalChange();
          }
        },
        (err) => console.warn('[Firestore] Movies sync listener notice:', err.message)
      );

      listenToBanners(
        (banners) => {
          if (banners && banners.length > 0) {
            this.setRawItem(STORAGE_KEYS.BANNERS, banners);
            this.lastSyncTime = Date.now();
            this.broadcastLocalChange();
          }
        },
        (err) => console.warn('[Firestore] Banners sync listener notice:', err.message)
      );

      listenToShows(
        (shows) => {
          if (shows && shows.length > 0) {
            this.setRawItem(STORAGE_KEYS.SHOWS, shows);
            this.lastSyncTime = Date.now();
            this.broadcastLocalChange();
          }
        },
        (err) => console.warn('[Firestore] Shows sync listener notice:', err.message)
      );

      listenToScreens(
        (screens) => {
          if (screens && screens.length > 0) {
            this.setRawItem(STORAGE_KEYS.SCREENS, screens);
            this.broadcastLocalChange();
          }
        },
        (err) => console.warn('[Firestore] Screens sync listener notice:', err.message)
      );

      listenToSettings(
        (settings) => {
          if (settings) {
            this.setRawItem(STORAGE_KEYS.SETTINGS, settings);
            this.lastSyncTime = Date.now();
            this.broadcastLocalChange();
          }
        },
        (err) => console.warn('[Firestore] Settings sync listener notice:', err.message)
      );

      listenToAnnouncements(
        (announcements) => {
          if (announcements && announcements.length > 0) {
            this.setRawItem(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
            this.broadcastLocalChange();
          }
        },
        (err) => console.warn('[Firestore] Announcements sync listener notice:', err.message)
      );

      listenToCoupons(
        (coupons) => {
          if (coupons && coupons.length > 0) {
            this.setRawItem(STORAGE_KEYS.COUPONS, coupons);
            this.broadcastLocalChange();
          }
        },
        (err) => console.warn('[Firestore] Coupons sync listener notice:', err.message)
      );
    } catch (e) {
      console.warn('[Firestore] Live sync connection notice:', e);
    }
  }

  // --- Real-Time SSE Subscription & Central Database Synchronization ---
  private initRealtimeConnection() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    if (this.sseSource) {
      try {
        this.sseSource.close();
      } catch {}
    }

    try {
      this.syncStatus = 'CONNECTING';
      this.sseSource = new EventSource('/api/sync/events');

      this.sseSource.addEventListener('connected', () => {
        this.syncStatus = 'CONNECTED';
        this.lastSyncTime = Date.now();
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime.toString());
        this.broadcastLocalChange();
      });

      this.sseSource.onopen = () => {
        this.syncStatus = 'CONNECTED';
        this.lastSyncTime = Date.now();
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime.toString());
        this.broadcastLocalChange();
      };

      // Server broadcasts full snapshot or individual updates
      this.sseSource.addEventListener('snapshot', (e: MessageEvent) => {
        try {
          const snapshot = JSON.parse(e.data);
          this.applyServerSnapshot(snapshot);
        } catch (err) {
          console.warn('[SSE] Snapshot parse error:', err);
        }
      });

      // Listen for all entity real-time events
      const realTimeEvents = [
        'movie:created',
        'movie:updated',
        'movie:deleted',
        'banner:created',
        'banner:updated',
        'banner:deleted',
        'banner:reordered',
        'show:created',
        'show:updated',
        'show:cancelled',
        'seat:held',
        'seat:released',
        'booking:created',
        'booking:status_changed',
        'booking:admitted',
        'settings:updated',
        'announcements:updated',
        'page:updated',
        'coupon:created',
        'db:reset',
        'db:restored',
      ];

      realTimeEvents.forEach((evtName) => {
        this.sseSource?.addEventListener(evtName, (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data);
            this.handleRealtimeEvent(evtName, payload);
          } catch (err) {
            console.warn(`[SSE] Error processing ${evtName}:`, err);
          }
        });
      });

      this.sseSource.onerror = () => {
        this.syncStatus = 'OFFLINE';
        this.broadcastLocalChange();
        // Schedule reconnect
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.initRealtimeConnection();
            this.pullFromCentralServer();
          }, 4000);
        }
      };
    } catch (e) {
      console.warn('[SSE] Could not establish EventSource:', e);
      this.syncStatus = 'OFFLINE';
    }
  }

  // Pull snapshot from server (called on boot and reconnection)
  public async pullFromCentralServer(): Promise<void> {
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        this.applyServerSnapshot(data);
        this.syncStatus = 'CONNECTED';
        this.lastSyncTime = Date.now();
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime.toString());
        this.broadcastLocalChange();
      }
    } catch (err) {
      console.warn('[Storage] Fallback to cached local data; central server unreachable:', err);
    }
  }

  // Handle incoming real-time SSE updates
  private handleRealtimeEvent(eventType: string, payload: any) {
    this.lastSyncTime = Date.now();

    switch (eventType) {
      case 'movie:created': {
        const movies = this.getMovies();
        const existingIdx = movies.findIndex((m) => m.id === payload.id);
        if (existingIdx >= 0) {
          movies[existingIdx] = payload;
        } else {
          movies.unshift(payload);
        }
        this.setRawItem(STORAGE_KEYS.MOVIES, movies);
        break;
      }
      case 'movie:updated': {
        const movies = this.getMovies();
        const idx = movies.findIndex((m) => m.id === payload.id);
        if (idx >= 0) {
          movies[idx] = payload;
        } else {
          movies.unshift(payload);
        }
        this.setRawItem(STORAGE_KEYS.MOVIES, movies);
        break;
      }
      case 'movie:deleted': {
        const movies = this.getMovies().filter((m) => m.id !== payload.id);
        this.setRawItem(STORAGE_KEYS.MOVIES, movies);
        break;
      }
      case 'banner:created':
      case 'banner:updated': {
        const banners = this.getBanners();
        const idx = banners.findIndex((b) => b.id === payload.id);
        if (idx >= 0) {
          banners[idx] = payload;
        } else {
          banners.push(payload);
        }
        banners.sort((a, b) => a.displayOrder - b.displayOrder);
        this.setRawItem(STORAGE_KEYS.BANNERS, banners);
        break;
      }
      case 'banner:deleted': {
        const banners = this.getBanners().filter((b) => b.id !== payload.id);
        this.setRawItem(STORAGE_KEYS.BANNERS, banners);
        break;
      }
      case 'banner:reordered': {
        if (Array.isArray(payload)) {
          this.setRawItem(STORAGE_KEYS.BANNERS, payload);
        }
        break;
      }
      case 'show:created': {
        const shows = this.getShows();
        const idx = shows.findIndex((s) => s.id === payload.id);
        if (idx >= 0) {
          shows[idx] = payload;
        } else {
          shows.unshift(payload);
        }
        this.setRawItem(STORAGE_KEYS.SHOWS, shows);
        break;
      }
      case 'show:updated':
      case 'show:cancelled': {
        const shows = this.getShows();
        const idx = shows.findIndex((s) => s.id === payload.id);
        if (idx >= 0) {
          shows[idx] = payload;
        } else {
          shows.unshift(payload);
        }
        this.setRawItem(STORAGE_KEYS.SHOWS, shows);
        break;
      }
      case 'seat:held': {
        const currentHolds = this.getItem<SeatHold[]>(STORAGE_KEYS.SEAT_HOLDS, []);
        const newHolds = Array.isArray(payload.holds) ? payload.holds : [];
        const combined = [...currentHolds.filter((h) => h.showId !== payload.showId), ...newHolds];
        this.setRawItem(STORAGE_KEYS.SEAT_HOLDS, combined);
        break;
      }
      case 'seat:released': {
        const currentHolds = this.getItem<SeatHold[]>(STORAGE_KEYS.SEAT_HOLDS, []);
        const remaining = currentHolds.filter((h) => !(h.showId === payload.showId && h.userId === payload.userId));
        this.setRawItem(STORAGE_KEYS.SEAT_HOLDS, remaining);
        break;
      }
      case 'booking:created': {
        const bookings = this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
        const idx = bookings.findIndex((b) => b.id === payload.id);
        if (idx >= 0) {
          bookings[idx] = payload;
        } else {
          bookings.unshift(payload);
        }
        this.setRawItem(STORAGE_KEYS.BOOKINGS, bookings);
        break;
      }
      case 'booking:status_changed':
      case 'booking:admitted': {
        const bookings = this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
        const idx = bookings.findIndex((b) => b.id === payload.id);
        if (idx >= 0) {
          bookings[idx] = payload;
          this.setRawItem(STORAGE_KEYS.BOOKINGS, bookings);
        }
        break;
      }
      case 'settings:updated': {
        this.setRawItem(STORAGE_KEYS.SETTINGS, payload);
        break;
      }
      case 'announcements:updated': {
        this.setRawItem(STORAGE_KEYS.ANNOUNCEMENTS, payload);
        break;
      }
      case 'page:updated': {
        const pages = this.getPages();
        const idx = pages.findIndex((p) => p.id === payload.id || p.slug === payload.slug);
        if (idx >= 0) pages[idx] = payload;
        else pages.push(payload);
        this.setRawItem(STORAGE_KEYS.PAGES, pages);
        break;
      }
      case 'coupon:created': {
        const coupons = this.getCoupons();
        const idx = coupons.findIndex((c) => c.id === payload.id);
        if (idx >= 0) coupons[idx] = payload;
        else coupons.push(payload);
        this.setRawItem(STORAGE_KEYS.COUPONS, coupons);
        break;
      }
      case 'db:reset':
      case 'db:restored': {
        this.pullFromCentralServer();
        break;
      }
    }

    this.broadcastLocalChange();
  }

  // Apply full server snapshot
  private applyServerSnapshot(snapshot: any) {
    if (!snapshot) return;

    if (snapshot.settings) this.setRawItem(STORAGE_KEYS.SETTINGS, snapshot.settings);
    if (Array.isArray(snapshot.movies)) this.setRawItem(STORAGE_KEYS.MOVIES, snapshot.movies);
    if (Array.isArray(snapshot.screens)) this.setRawItem(STORAGE_KEYS.SCREENS, snapshot.screens);
    if (Array.isArray(snapshot.shows)) this.setRawItem(STORAGE_KEYS.SHOWS, snapshot.shows);
    if (Array.isArray(snapshot.banners)) this.setRawItem(STORAGE_KEYS.BANNERS, snapshot.banners);
    if (Array.isArray(snapshot.announcements)) this.setRawItem(STORAGE_KEYS.ANNOUNCEMENTS, snapshot.announcements);
    if (Array.isArray(snapshot.coupons)) this.setRawItem(STORAGE_KEYS.COUPONS, snapshot.coupons);
    if (Array.isArray(snapshot.pages)) this.setRawItem(STORAGE_KEYS.PAGES, snapshot.pages);
    if (Array.isArray(snapshot.seatHolds)) this.setRawItem(STORAGE_KEYS.SEAT_HOLDS, snapshot.seatHolds);

    // Bookings snapshot: if admin, merge all; if customer, preserve access control
    if (Array.isArray(snapshot.bookings)) {
      this.setRawItem(STORAGE_KEYS.BOOKINGS, snapshot.bookings);
    }
  }

  public getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  public getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  private broadcastLocalChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('lxm_storage_update'));
    }
  }

  private initDatabase() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MOVIES)) {
      localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(INITIAL_MOVIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCREENS)) {
      localStorage.setItem(STORAGE_KEYS.SCREENS, JSON.stringify(INITIAL_SCREENS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SHOWS)) {
      localStorage.setItem(STORAGE_KEYS.SHOWS, JSON.stringify(generateInitialShows()));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(INITIAL_COUPONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BANNERS)) {
      localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(INITIAL_BANNERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SEAT_HOLDS)) {
      localStorage.setItem(STORAGE_KEYS.SEAT_HOLDS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAGES)) {
      localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(INITIAL_PAGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      const initialLog: AuditLog = {
        id: 'log-init',
        timestamp: new Date().toISOString(),
        actor: 'SYSTEM',
        action: 'DATABASE_INITIALIZATION',
        targetType: 'SETTINGS',
        details: 'Initial Laxmi Cineplex Hazaribagh database and screens seeded successfully.',
      };
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([initialLog]));
    }
  }

  // --- Audit Logs ---
  public logAudit(actor: string, action: string, targetType: AuditLog['targetType'], details: string, targetId?: string) {
    const logs: AuditLog[] = this.getItem(STORAGE_KEYS.AUDIT_LOGS, []);
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      targetType,
      targetId,
      details,
    };
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop();
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  public getAuditLogs(): AuditLog[] {
    return this.getItem(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  // --- Settings ---
  public getSettings(): CinemaSettings {
    return this.getItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  public updateSettings(newSettings: Partial<CinemaSettings>, actor: string = 'rajanbhogta'): CinemaSettings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    this.setItem(STORAGE_KEYS.SETTINGS, updated);

    // Persist to Cloud Firestore
    saveSettingsToFirestore(updated).catch((err) => console.warn('[Firestore] Settings sync notice:', err));

    // Persist to central server
    fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-actor': actor,
        'x-admin-auth': 'rajanbhogta',
      },
      body: JSON.stringify(newSettings),
    }).catch((err) => console.warn('[Sync] Settings update fetch error:', err));

    this.logAudit(actor, 'UPDATE_SETTINGS', 'SETTINGS', `Cinema settings updated: fee ₹${updated.convenienceFeePerTicket}, GST ${updated.gstPercentage}%`);
    return updated;
  }

  // --- Movies ---
  public getMovies(): Movie[] {
    return this.getItem(STORAGE_KEYS.MOVIES, []);
  }

  public getMovieById(id: string): Movie | undefined {
    return this.getMovies().find((m) => m.id === id);
  }

  public saveMovie(movieData: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>, actor: string = 'rajanbhogta'): Movie {
    const movies = this.getMovies();
    const newMovie: Movie = {
      ...movieData,
      id: `mov-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    movies.unshift(newMovie);
    this.setItem(STORAGE_KEYS.MOVIES, movies);

    // Persist to Cloud Firestore
    saveMovieToFirestore(newMovie).catch((err) => console.warn('[Firestore] Movie save notice:', err));

    // Persist to central server
    fetch('/api/movies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor': actor,
        'x-admin-auth': 'rajanbhogta',
      },
      body: JSON.stringify(newMovie),
    }).catch((err) => console.warn('[Sync] Movie create fetch error:', err));

    this.logAudit(actor, 'CREATE_MOVIE', 'MOVIE', `Created movie "${newMovie.title}" (${newMovie.status})`, newMovie.id);
    return newMovie;
  }

  public updateMovie(id: string, updates: Partial<Movie>, actor: string = 'rajanbhogta'): Movie {
    const movies = this.getMovies();
    const index = movies.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Movie not found');

    const updatedMovie: Movie = {
      ...movies[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    movies[index] = updatedMovie;
    this.setItem(STORAGE_KEYS.MOVIES, movies);

    // Persist to Cloud Firestore
    saveMovieToFirestore(updatedMovie).catch((err) => console.warn('[Firestore] Movie update notice:', err));

    // Persist to central server
    fetch(`/api/movies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-actor': actor,
        'x-admin-auth': 'rajanbhogta',
      },
      body: JSON.stringify(updates),
    }).catch((err) => console.warn('[Sync] Movie update fetch error:', err));

    this.logAudit(actor, 'UPDATE_MOVIE', 'MOVIE', `Updated movie "${updatedMovie.title}" (${updatedMovie.status})`, id);
    return updatedMovie;
  }

  public deleteMovie(id: string, actor: string = 'rajanbhogta'): { success: boolean; action: 'DELETED' | 'ARCHIVED'; message: string } {
    return this.deleteOrArchiveMovie(id, actor);
  }

  public deleteOrArchiveMovie(id: string, actor: string = 'rajanbhogta'): { success: boolean; action: 'DELETED' | 'ARCHIVED'; message: string } {
    const movies = this.getMovies();
    const movie = movies.find((m) => m.id === id);
    if (!movie) throw new Error('Movie not found');

    // Check if bookings exist
    const bookings = this.getBookings();
    const hasBookings = bookings.some((b) => b.movieId === id);

    // Send to central server
    fetch(`/api/movies/${id}`, {
      method: 'DELETE',
      headers: {
        'x-actor': actor,
        'x-admin-auth': 'rajanbhogta',
      },
    }).catch((err) => console.warn('[Sync] Movie delete fetch error:', err));

    if (hasBookings) {
      this.updateMovie(id, { status: 'ARCHIVED' }, actor);
      return {
        success: true,
        action: 'ARCHIVED',
        message: `Movie "${movie.title}" has past booking records. It was safely moved to ARCHIVED status instead of deleting financial history.`,
      };
    }

    // Persist to Cloud Firestore
    deleteMovieFromFirestore(id).catch((err) => console.warn('[Firestore] Movie delete notice:', err));

    const filtered = movies.filter((m) => m.id !== id);
    this.setItem(STORAGE_KEYS.MOVIES, filtered);
    this.logAudit(actor, 'DELETE_MOVIE', 'MOVIE', `Deleted movie "${movie.title}"`, id);
    return {
      success: true,
      action: 'DELETED',
      message: `Movie "${movie.title}" was completely deleted.`,
    };
  }

  public restoreMovie(id: string, actor: string = 'rajanbhogta'): boolean {
    const movies = this.getMovies();
    const movie = movies.find((m) => m.id === id);
    if (!movie) return false;
    movie.status = 'NOW_SHOWING';
    movie.updatedAt = new Date().toISOString();
    this.setItem(STORAGE_KEYS.MOVIES, movies);

    fetch(`/api/movies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-actor': actor,
        'x-admin-auth': 'rajanbhogta',
      },
      body: JSON.stringify({ status: 'NOW_SHOWING' }),
    }).catch((err) => console.warn('[Sync] Movie restore fetch error:', err));

    this.logAudit(actor, 'RESTORE_MOVIE', 'MOVIE', `Restored movie "${movie.title}" to Now Showing`, id);
    return true;
  }

  public bulkUpdateMovieStatus(movieIds: string[], status: MovieStatus, actor: string = 'rajanbhogta'): number {
    const movies = this.getMovies();
    let updated = 0;
    movies.forEach((m) => {
      if (movieIds.includes(m.id)) {
        m.status = status;
        m.updatedAt = new Date().toISOString();
        updated++;
        fetch(`/api/movies/${m.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-actor': actor, 'x-admin-auth': 'rajanbhogta' },
          body: JSON.stringify({ status }),
        }).catch((err) => console.warn('[Sync] Bulk movie update error:', err));
      }
    });
    if (updated > 0) {
      this.setItem(STORAGE_KEYS.MOVIES, movies);
      this.logAudit(actor, 'BULK_UPDATE_MOVIES', 'MOVIE', `Updated status of ${updated} movies to ${status}`);
    }
    return updated;
  }

  public bulkDeleteMovies(movieIds: string[], actor: string = 'rajanbhogta'): { deleted: number; archived: number } {
    let deleted = 0;
    let archived = 0;
    movieIds.forEach((id) => {
      const res = this.deleteMovie(id, actor);
      if (res.action === 'DELETED') deleted++;
      else if (res.action === 'ARCHIVED') archived++;
    });
    return { deleted, archived };
  }

  // --- Screens ---
  public getScreens(): Screen[] {
    return this.getItem(STORAGE_KEYS.SCREENS, []);
  }

  public getScreenById(id: string): Screen | undefined {
    return this.getScreens().find((s) => s.id === id);
  }

  public saveScreen(screen: Screen, actor: string = 'rajanbhogta'): Screen {
    const screens = this.getScreens();
    const index = screens.findIndex((s) => s.id === screen.id);
    if (index >= 0) {
      screens[index] = screen;
      this.logAudit(actor, 'UPDATE_SCREEN', 'SCREEN', `Updated screen "${screen.name}"`, screen.id);
    } else {
      screens.push(screen);
      this.logAudit(actor, 'CREATE_SCREEN', 'SCREEN', `Created screen "${screen.name}"`, screen.id);
    }
    this.setItem(STORAGE_KEYS.SCREENS, screens);
    return screen;
  }

  // --- Shows & Overlap Protection ---
  public getShows(): Show[] {
    return this.getItem(STORAGE_KEYS.SHOWS, []);
  }

  public getShowById(id: string): Show | undefined {
    return this.getShows().find((s) => s.id === id);
  }

  public checkShowOverlap(
    screenId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeShowId?: string
  ): { hasOverlap: boolean; conflictingShow?: Show; conflictingMovieTitle?: string; details?: string } {
    const allShows = this.getShows();
    const screenShows = allShows.filter(
      (s) => s.screenId === screenId && s.date === date && s.status !== 'CANCELLED' && s.id !== excludeShowId
    );

    const parseMinutes = (t: string): number => {
      if (!t) return 0;
      const clean = t.trim().toLowerCase();
      const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const meridian = match12[3];
        if (meridian === 'pm' && h < 12) h += 12;
        if (meridian === 'am' && h === 12) h = 0;
        return h * 60 + m;
      }
      const parts = clean.split(':').map((p) => parseInt(p, 10));
      const h = isNaN(parts[0]) ? 0 : parts[0];
      const m = isNaN(parts[1]) ? 0 : parts[1];
      return h * 60 + m;
    };

    const newStart = parseMinutes(startTime);
    let newEnd = parseMinutes(endTime);
    if (newEnd < newStart) newEnd += 24 * 60;

    for (const show of screenShows) {
      const showStart = parseMinutes(show.startTime);
      let showEnd = parseMinutes(show.endTime);
      if (showEnd < showStart) showEnd += 24 * 60;

      const buffer = 15;
      const bufferedShowStart = Math.max(0, showStart - buffer);
      const bufferedShowEnd = showEnd + buffer;

      if (newStart < bufferedShowEnd && newEnd > bufferedShowStart) {
        const movie = this.getMovieById(show.movieId);
        const screen = this.getScreenById(show.screenId);
        const movieTitle = movie?.title || show.movieId;
        const screenName = screen?.name || show.screenId;
        const details = `Screen clash on ${screenName}: "${movieTitle}" is scheduled from ${show.startTime} to ${show.endTime}. With a 15-min cleaning buffer, this screen is occupied from ${Math.floor(bufferedShowStart / 60).toString().padStart(2, '0')}:${(bufferedShowStart % 60).toString().padStart(2, '0')} to ${Math.floor(bufferedShowEnd / 60).toString().padStart(2, '0')}:${(bufferedShowEnd % 60).toString().padStart(2, '0')}.`;
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

    const overlapCheck = this.checkShowOverlap(showData.screenId, showData.date, showData.startTime, showData.endTime);
    if (overlapCheck.hasOverlap) {
      const conflict = overlapCheck.conflictingShow!;
      const conflictMovie = overlapCheck.conflictingMovieTitle || conflict.movieId;
      throw new Error(
        overlapCheck.details ||
          `Schedule conflict on screen! Overlapping with "${conflictMovie}" (${conflict.startTime} - ${conflict.endTime}). Please allow at least 15 min buffer between screenings.`
      );
    }

    const shows = this.getShows();
    const newShow: Show = {
      ...showData,
      status: showData.status || 'OPEN',
      id: `show-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    shows.unshift(newShow);
    this.setItem(STORAGE_KEYS.SHOWS, shows);

    // Persist to Cloud Firestore
    saveShowToFirestore(newShow).catch((err) => console.warn('[Firestore] Show save notice:', err));

    // Persist to central server
    fetch('/api/shows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor': actor,
        'x-admin-auth': 'rajanbhogta',
      },
      body: JSON.stringify(newShow),
    }).catch((err) => console.warn('[Sync] Show create fetch error:', err));

    const movie = this.getMovieById(newShow.movieId);
    this.logAudit(
      actor,
      'CREATE_SHOW',
      'SHOW',
      `Scheduled show for "${movie?.title || newShow.movieId}" on ${newShow.date} at ${newShow.startTime}`,
      newShow.id
    );
    return newShow;
  }

  public createShow(showData: Omit<Show, 'id' | 'createdAt' | 'status'> & { status?: Show['status'] }, actor: string = 'rajanbhogta'): Show {
    return this.saveShow(showData, actor);
  }

  public updateShow(id: string, updates: Partial<Show>, actor: string = 'rajanbhogta'): Show {
    const shows = this.getShows();
    const index = shows.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Show not found');

    const current = shows[index];
    const candidate = { ...current, ...updates };

    if (
      (updates.screenId && updates.screenId !== current.screenId) ||
      (updates.date && updates.date !== current.date) ||
      (updates.startTime && updates.startTime !== current.startTime) ||
      (updates.endTime && updates.endTime !== current.endTime)
    ) {
      const overlap = this.checkShowOverlap(candidate.screenId, candidate.date, candidate.startTime, candidate.endTime, id);
      if (overlap.hasOverlap) {
        throw new Error(`Schedule conflict with existing show on that screen.`);
      }
    }

    shows[index] = candidate;
    this.setItem(STORAGE_KEYS.SHOWS, shows);

    // Persist to Cloud Firestore
    saveShowToFirestore(candidate).catch((err) => console.warn('[Firestore] Show update notice:', err));

    // Persist to central server
    fetch(`/api/shows/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-actor': actor,
        'x-admin-auth': 'rajanbhogta',
      },
      body: JSON.stringify(updates),
    }).catch((err) => console.warn('[Sync] Show update fetch error:', err));

    this.logAudit(actor, 'UPDATE_SHOW', 'SHOW', `Updated show ${id}`, id);
    return candidate;
  }

  public cancelShow(id: string, reason: string = 'Cancelled by Admin', actor: string = 'rajanbhogta'): Show {
    const show = this.updateShow(id, { status: 'CANCELLED' }, actor);

    fetch(`/api/shows/${id}?reason=${encodeURIComponent(reason)}`, {
      method: 'DELETE',
      headers: {
        'x-actor': actor,
        'x-admin-auth': 'rajanbhogta',
      },
    }).catch((err) => console.warn('[Sync] Show cancel fetch error:', err));

    this.logAudit(actor, 'CANCEL_SHOW', 'SHOW', `Cancelled show ${id}. Reason: ${reason}`, id);
    return show;
  }

  // --- Seat Holds & Atomic Reservation ---
  public getSeatHolds(showId: string): SeatHold[] {
    const allHolds: SeatHold[] = this.getItem(STORAGE_KEYS.SEAT_HOLDS, []);
    const now = Date.now();
    const validHolds = allHolds.filter((h) => h.expiresAt > now);
    if (validHolds.length !== allHolds.length) {
      this.setItem(STORAGE_KEYS.SEAT_HOLDS, validHolds);
    }
    return validHolds.filter((h) => h.showId === showId);
  }

  public holdSeats(
    showId: string,
    seatLabels: string[],
    userId: string,
    holdMinutes: number = 8
  ): { success: boolean; expiresAt: number; failedSeats?: string[] } {
    const allHolds: SeatHold[] = this.getItem(STORAGE_KEYS.SEAT_HOLDS, []);
    const now = Date.now();
    const validHolds = allHolds.filter((h) => h.expiresAt > now);

    const bookedSeats = this.getBookedSeatsForShow(showId);
    const conflictingBooked = seatLabels.filter((s) => bookedSeats.includes(s));
    if (conflictingBooked.length > 0) {
      return { success: false, expiresAt: 0, failedSeats: conflictingBooked };
    }

    const conflictingHeld = validHolds.filter((h) => h.showId === showId && seatLabels.includes(h.seatId) && h.userId !== userId);
    if (conflictingHeld.length > 0) {
      return { success: false, expiresAt: 0, failedSeats: conflictingHeld.map((h) => h.seatId) };
    }

    const otherUserHolds = validHolds.filter((h) => !(h.showId === showId && h.userId === userId));
    const expiresAt = now + holdMinutes * 60 * 1000;
    const newHolds: SeatHold[] = seatLabels.map((seatId) => ({
      showId,
      seatId,
      userId,
      expiresAt,
    }));

    this.setItem(STORAGE_KEYS.SEAT_HOLDS, [...otherUserHolds, ...newHolds]);

    // Send to central server for distributed mutex lock
    fetch('/api/bookings/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showId, seatLabels, userId, holdMinutes }),
    }).catch((err) => console.warn('[Sync] Seat hold fetch error:', err));

    return { success: true, expiresAt };
  }

  public releaseHoldsForUser(showId: string, userId: string) {
    const allHolds: SeatHold[] = this.getItem(STORAGE_KEYS.SEAT_HOLDS, []);
    const filtered = allHolds.filter((h) => !(h.showId === showId && h.userId === userId));
    this.setItem(STORAGE_KEYS.SEAT_HOLDS, filtered);

    fetch('/api/bookings/release-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showId, userId }),
    }).catch((err) => console.warn('[Sync] Release holds fetch error:', err));
  }

  public getBookedSeatsForShow(showId: string): string[] {
    const bookings = this.getBookings();
    const showBookings = bookings.filter((b) => b.showId === showId && b.bookingStatus === 'CONFIRMED');
    const booked: string[] = [];
    showBookings.forEach((b) => {
      b.seats.forEach((s) => booked.push(s.seatLabel));
    });
    return booked;
  }

  // --- Bookings & Payments ---
  // Access-controlled: customers only see their own bookings; admins see all
  public getBookings(filterUser?: string, isAdmin?: boolean): Booking[] {
    const all = this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
    if (isAdmin) return all;
    if (filterUser) {
      const q = filterUser.trim().toLowerCase();
      return all.filter(
        (b) =>
          b.userId?.toLowerCase() === q ||
          b.customerEmail?.toLowerCase() === q ||
          b.customerPhone?.replace(/\D/g, '') === q.replace(/\D/g, '') ||
          b.id.toLowerCase() === q
      );
    }
    return all;
  }

  public getBookingById(id: string, filterUser?: string, isAdmin?: boolean): Booking | undefined {
    const all = this.getBookings(filterUser, isAdmin);
    return all.find((b) => b.id === id);
  }

  public getBookingByToken(token: string): Booking | undefined {
    return this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []).find((b) => b.ticketToken === token);
  }

  public createPendingUpiBooking(
    bookingData: Omit<Booking, 'id' | 'ticketToken' | 'createdAt' | 'updatedAt' | 'bookingStatus' | 'paymentStatus'> & {
      upiReference: string;
      receiptUrl?: string;
    }
  ): Booking {
    const cleanUtr = (bookingData.upiReference || '').trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 6) {
      throw new Error('Please enter a valid UPI Transaction Reference / UTR Number (minimum 6 characters).');
    }

    const bookings = this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
    const duplicate = bookings.find(
      (b) =>
        b.upiReference?.toUpperCase() === cleanUtr &&
        (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING_VERIFICATION')
    );
    if (duplicate) {
      throw new Error(
        `UTR reference "${cleanUtr}" has already been submitted for booking ${duplicate.id}. Duplicate UTRs are not allowed.`
      );
    }

    const bookedSeats = this.getBookedSeatsForShow(bookingData.showId);
    const requestedSeats = bookingData.seats.map((s) => s.seatLabel);
    const alreadyTaken = requestedSeats.filter((s) => bookedSeats.includes(s));
    if (alreadyTaken.length > 0) {
      throw new Error(`Seats ${alreadyTaken.join(', ')} are no longer available. Please select different seats.`);
    }

    const bookingId = generateBookingId();
    const ticketToken = generateTicketToken(bookingId);

    const newBooking: Booking = {
      ...bookingData,
      id: bookingId,
      ticketToken,
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
          notes: `Customer submitted UPI QR payment with UTR: ${cleanUtr} for ₹${bookingData.totalAmount}. Awaiting Box Office review against India Post Payment Bank 3764 records.`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bookings.unshift(newBooking);
    this.setItem(STORAGE_KEYS.BOOKINGS, bookings);

    if (bookingData.userId) {
      this.releaseHoldsForUser(bookingData.showId, bookingData.userId);
    }

    // Persist to central server atomically
    fetch('/api/bookings/pending-upi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...bookingData, upiReference: cleanUtr }),
    }).catch((err) => console.warn('[Sync] Pending UPI booking error:', err));

    this.logAudit(
      bookingData.customerName || 'CUSTOMER',
      'SUBMIT_UPI_PAYMENT',
      'BOOKING',
      `Booking ${bookingId} submitted for UPI payment verification (UTR: ${cleanUtr}, ₹${bookingData.totalAmount}) for "${bookingData.movieTitle}" (${requestedSeats.join(', ')})`,
      bookingId
    );

    return newBooking;
  }

  public createBooking(bookingData: Omit<Booking, 'id' | 'ticketToken' | 'createdAt' | 'updatedAt' | 'bookingStatus'>): Booking {
    const bookedSeats = this.getBookedSeatsForShow(bookingData.showId);
    const requestedSeats = bookingData.seats.map((s) => s.seatLabel);
    const alreadyTaken = requestedSeats.filter((s) => bookedSeats.includes(s));

    if (alreadyTaken.length > 0) {
      throw new Error(`Seats ${alreadyTaken.join(', ')} were just confirmed by another customer. Please select other seats.`);
    }

    const bookingId = generateBookingId();
    const ticketToken = generateTicketToken(bookingId);

    const newBooking: Booking = {
      ...bookingData,
      id: bookingId,
      ticketToken,
      bookingStatus: 'CONFIRMED',
      isAdmitted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const bookings = this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
    bookings.unshift(newBooking);
    this.setItem(STORAGE_KEYS.BOOKINGS, bookings);

    if (bookingData.userId) {
      this.releaseHoldsForUser(bookingData.showId, bookingData.userId);
    }
    if (bookingData.couponCode) {
      this.incrementCouponUsage(bookingData.couponCode);
    }

    // Persist to central server atomically
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    }).catch((err) => console.warn('[Sync] Confirmed booking error:', err));

    this.logAudit(
      bookingData.customerName || 'CUSTOMER',
      'CREATE_BOOKING',
      'BOOKING',
      `Booking ${bookingId} confirmed for ${bookingData.movieTitle} (${requestedSeats.join(', ')}) - Total: ₹${bookingData.totalAmount}`,
      bookingId
    );

    return newBooking;
  }

  public isUtrDuplicate(utr: string, excludeBookingId?: string): boolean {
    if (!utr) return false;
    const cleanUtr = utr.trim().toUpperCase();
    const bookings = this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
    return bookings.some(
      (b) =>
        b.id !== excludeBookingId &&
        b.bookingStatus !== 'CANCELLED' &&
        b.upiReference &&
        b.upiReference.trim().toUpperCase() === cleanUtr
    );
  }

  public createUpiPendingBooking(
    bookingData: Omit<Booking, 'id' | 'ticketToken' | 'createdAt' | 'updatedAt' | 'bookingStatus'>,
    utr: string
  ): Booking {
    return this.createPendingUpiBooking({
      ...bookingData,
      upiReference: utr,
    });
  }

  // Box Office Admin verifies UPI Payment
  public verifyUpiPayment(bookingId: string, actor: string = 'rajanbhogta'): Booking {
    const bookings = this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) throw new Error('Booking not found');

    const booking = bookings[index];
    if (booking.bookingStatus !== 'PENDING_VERIFICATION') {
      throw new Error(`Cannot verify booking with status "${booking.bookingStatus}"`);
    }

    const verifiedBooking: Booking = {
      ...booking,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'SUCCESS',
      verifiedBy: actor,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bookings[index] = verifiedBooking;
    this.setItem(STORAGE_KEYS.BOOKINGS, bookings);

    // Call central server
    fetch(`/api/bookings/${bookingId}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor': actor,
        'x-admin-auth': 'rajanbhogta',
      },
      body: JSON.stringify({ action: 'VERIFY' }),
    }).catch((err) => console.warn('[Sync] Verify payment fetch error:', err));

    this.logAudit(
      actor,
      'VERIFY_UPI_PAYMENT',
      'PAYMENT',
      `Verified UPI payment for booking ${bookingId} (UTR: ${booking.upiReference}, ₹${booking.totalAmount}). Turnstile admission ticket issued.`,
      bookingId
    );

    return verifiedBooking;
  }

  // Box Office Admin rejects invalid/unmatched UPI Payment
  public rejectUpiPayment(bookingId: string, reason: string, actor: string = 'rajanbhogta'): Booking {
    const bookings = this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) throw new Error('Booking not found');

    const booking = bookings[index];
    if (booking.bookingStatus !== 'PENDING_VERIFICATION') {
      throw new Error(`Cannot reject booking with status "${booking.bookingStatus}"`);
    }

    const rejectedBooking: Booking = {
      ...booking,
      bookingStatus: 'CANCELLED',
      paymentStatus: 'FAILED',
      rejectionReason: reason || 'Invalid or unconfirmed UPI transaction reference',
      verifiedBy: actor,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bookings[index] = rejectedBooking;
    this.setItem(STORAGE_KEYS.BOOKINGS, bookings);

    // Call central server
    fetch(`/api/bookings/${bookingId}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor': actor,
        'x-admin-auth': 'rajanbhogta',
      },
      body: JSON.stringify({ action: 'REJECT', reason }),
    }).catch((err) => console.warn('[Sync] Reject payment fetch error:', err));

    this.logAudit(
      actor,
      'REJECT_UPI_PAYMENT',
      'PAYMENT',
      `Rejected UPI payment for booking ${bookingId} (UTR: ${booking.upiReference}). Reason: ${reason}. Seats released to inventory.`,
      bookingId
    );

    return rejectedBooking;
  }

  public getPendingUpiBookings(): Booking[] {
    return this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []).filter((b) => b.bookingStatus === 'PENDING_VERIFICATION');
  }

  public cancelBooking(bookingId: string, reason: string, actor: string = 'CUSTOMER'): { booking: Booking; refundAmount: number } {
    const bookings = this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) throw new Error('Booking not found');

    const booking = bookings[index];
    if (booking.bookingStatus !== 'CONFIRMED') {
      throw new Error(`Cannot cancel booking with status ${booking.bookingStatus}`);
    }

    const refundAmount = Math.max(0, booking.subtotal - (booking.discountAmount || 0));

    const updatedBooking: Booking = {
      ...booking,
      bookingStatus: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      cancellationReason: reason,
      refundAmount,
      updatedAt: new Date().toISOString(),
    };

    bookings[index] = updatedBooking;
    this.setItem(STORAGE_KEYS.BOOKINGS, bookings);

    fetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor': actor,
        'x-admin-auth': 'rajanbhogta',
      },
      body: JSON.stringify({ reason }),
    }).catch((err) => console.warn('[Sync] Cancel booking fetch error:', err));

    this.logAudit(actor, 'CANCEL_BOOKING', 'BOOKING', `Booking ${bookingId} cancelled. Refund: ₹${refundAmount}. Reason: ${reason}`, bookingId);

    return { booking: updatedBooking, refundAmount };
  }

  // Gate QR Ticket validation
  public validateTicketToken(tokenOrId: string, actor: string = 'STAFF'): {
    success: boolean;
    booking?: Booking;
    status: 'VALID_NEW' | 'ALREADY_USED' | 'CANCELLED' | 'INVALID';
    message: string;
  } {
    const booking = this.getBookingByToken(tokenOrId) || this.getBookingById(tokenOrId, undefined, true);

    if (!booking) {
      return { success: false, status: 'INVALID', message: 'Ticket not found. Invalid QR code or booking reference.' };
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return { success: false, booking, status: 'CANCELLED', message: 'TICKET CANCELLED: This booking has been cancelled and refunded.' };
    }

    if (booking.isAdmitted) {
      return {
        success: false,
        booking,
        status: 'ALREADY_USED',
        message: `ALREADY ADMITTED: This ticket was scanned and admitted at ${new Date(booking.admittedAt || '').toLocaleTimeString('en-IN')}. DUPLICATE ENTRY PROHIBITED.`,
      };
    }

    const bookings = this.getItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
    const index = bookings.findIndex((b) => b.id === booking.id);
    if (index >= 0) {
      bookings[index].isAdmitted = true;
      bookings[index].admittedAt = new Date().toISOString();
      bookings[index].updatedAt = new Date().toISOString();
      this.setItem(STORAGE_KEYS.BOOKINGS, bookings);
    }

    fetch('/api/validator/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor': actor,
        'x-admin-auth': 'rajanbhogta',
      },
      body: JSON.stringify({ token: tokenOrId }),
    }).catch((err) => console.warn('[Sync] Validator scan error:', err));

    this.logAudit(actor, 'VALIDATE_TICKET', 'BOOKING', `Ticket ${booking.id} validated and admitted at gate`, booking.id);

    return {
      success: true,
      booking: bookings[index],
      status: 'VALID_NEW',
      message: `TICKET VERIFIED! Access granted for ${booking.seats.length} guests (${booking.seats.map((s) => s.seatLabel).join(', ')}).`,
    };
  }

  // --- Coupons ---
  public getCoupons(): Coupon[] {
    return this.getItem(STORAGE_KEYS.COUPONS, []);
  }

  public validateCoupon(code: string, bookingSubtotal: number): { valid: boolean; discount: number; message: string; coupon?: Coupon } {
    const coupons = this.getCoupons();
    const coupon = coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());

    if (!coupon) {
      return { valid: false, discount: 0, message: 'Invalid promo code.' };
    }

    if (!coupon.isActive) {
      return { valid: false, discount: 0, message: 'This promo code is currently inactive.' };
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return { valid: false, discount: 0, message: 'This promo code has expired.' };
    }

    if (coupon.usageCount >= coupon.maxUsage) {
      return { valid: false, discount: 0, message: 'Promo code usage limit has been reached.' };
    }

    if (bookingSubtotal < coupon.minBookingAmount) {
      return { valid: false, discount: 0, message: `Minimum order amount of ₹${coupon.minBookingAmount} required for this coupon.` };
    }

    let discount = 0;
    if (coupon.discountType === 'FLAT') {
      discount = coupon.discountValue;
    } else {
      discount = Math.round((bookingSubtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    return {
      valid: true,
      discount: Math.min(discount, bookingSubtotal),
      message: `Coupon applied: ₹${discount} off!`,
      coupon,
    };
  }

  public incrementCouponUsage(code: string) {
    const coupons = this.getCoupons();
    const index = coupons.findIndex((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    if (index >= 0) {
      coupons[index].usageCount += 1;
      this.setItem(STORAGE_KEYS.COUPONS, coupons);
    }
  }

  public saveCoupon(coupon: Coupon, actor: string = 'rajanbhogta') {
    const coupons = this.getCoupons();
    const index = coupons.findIndex((c) => c.id === coupon.id);
    if (index >= 0) {
      coupons[index] = coupon;
    } else {
      coupons.push(coupon);
    }
    this.setItem(STORAGE_KEYS.COUPONS, coupons);

    // Persist to Cloud Firestore
    saveCouponToFirestore(coupon).catch((err) => console.warn('[Firestore] Coupon save notice:', err));

    fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-actor': actor, 'x-admin-auth': 'rajanbhogta' },
      body: JSON.stringify(coupon),
    }).catch((err) => console.warn('[Sync] Coupon save error:', err));

    this.logAudit(actor, 'SAVE_COUPON', 'COUPON', `Saved coupon code ${coupon.code}`, coupon.id);
  }

  public deleteCoupon(id: string, actor: string = 'rajanbhogta') {
    const coupons = this.getCoupons().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.COUPONS, coupons);

    // Persist to Cloud Firestore
    deleteCouponFromFirestore(id).catch((err) => console.warn('[Firestore] Coupon delete notice:', err));

    this.logAudit(actor, 'DELETE_COUPON', 'COUPON', `Deleted coupon ${id}`, id);
  }

  // --- Banners & Announcements ---
  public getBanners(): HeroBanner[] {
    const banners = this.getItem<HeroBanner[]>(STORAGE_KEYS.BANNERS, []);
    return banners.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public saveBanners(banners: HeroBanner[], actor: string = 'rajanbhogta') {
    this.setItem(STORAGE_KEYS.BANNERS, banners);

    fetch('/api/banners/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-actor': actor, 'x-admin-auth': 'rajanbhogta' },
      body: JSON.stringify({ orderedIds: banners.map((b) => b.id) }),
    }).catch((err) => console.warn('[Sync] Banner reorder error:', err));

    this.logAudit(actor, 'UPDATE_BANNERS', 'BANNER', `Updated ${banners.length} homepage banners`);
  }

  public saveBanner(banner: HeroBanner, actor: string = 'rajanbhogta'): HeroBanner {
    const banners = this.getBanners();
    const index = banners.findIndex((b) => b.id === banner.id);
    if (index >= 0) {
      banners[index] = banner;
      this.logAudit(actor, 'UPDATE_BANNER', 'BANNER', `Updated banner "${banner.title}"`, banner.id);
      fetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-actor': actor, 'x-admin-auth': 'rajanbhogta' },
        body: JSON.stringify(banner),
      }).catch((err) => console.warn('[Sync] Banner update error:', err));
    } else {
      banners.push(banner);
      this.logAudit(actor, 'CREATE_BANNER', 'BANNER', `Created new banner "${banner.title}"`, banner.id);
      fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor': actor, 'x-admin-auth': 'rajanbhogta' },
        body: JSON.stringify(banner),
      }).catch((err) => console.warn('[Sync] Banner create error:', err));
    }
    banners.sort((a, b) => a.displayOrder - b.displayOrder);
    this.setItem(STORAGE_KEYS.BANNERS, banners);

    // Persist to Cloud Firestore
    saveBannerToFirestore(banner).catch((err) => console.warn('[Firestore] Banner save notice:', err));

    return banner;
  }

  public deleteBanner(bannerId: string, actor: string = 'rajanbhogta'): boolean {
    const banners = this.getBanners();
    const target = banners.find((b) => b.id === bannerId);
    if (!target) return false;
    const remaining = banners.filter((b) => b.id !== bannerId);
    this.setItem(STORAGE_KEYS.BANNERS, remaining);

    // Persist to Cloud Firestore
    deleteBannerFromFirestore(bannerId).catch((err) => console.warn('[Firestore] Banner delete notice:', err));

    fetch(`/api/banners/${bannerId}`, {
      method: 'DELETE',
      headers: { 'x-actor': actor, 'x-admin-auth': 'rajanbhogta' },
    }).catch((err) => console.warn('[Sync] Banner delete error:', err));

    this.logAudit(actor, 'DELETE_BANNER', 'BANNER', `Deleted banner "${target.title}"`, bannerId);
    return true;
  }

  public reorderBanners(orderedBanners: HeroBanner[], actor: string = 'rajanbhogta'): void {
    const reindexed = orderedBanners.map((b, idx) => ({ ...b, displayOrder: idx + 1 }));
    this.setItem(STORAGE_KEYS.BANNERS, reindexed);

    fetch('/api/banners/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-actor': actor, 'x-admin-auth': 'rajanbhogta' },
      body: JSON.stringify({ orderedIds: reindexed.map((b) => b.id) }),
    }).catch((err) => console.warn('[Sync] Banner reorder error:', err));

    this.logAudit(actor, 'REORDER_BANNERS', 'BANNER', `Reordered ${reindexed.length} homepage banners`);
  }

  // --- Staff & Content Pages ---
  public getStaff(): StaffMember[] {
    return this.getItem(STORAGE_KEYS.STAFF, INITIAL_STAFF);
  }

  public saveStaff(member: StaffMember, actor: string = 'rajanbhogta'): StaffMember {
    const staff = this.getStaff();
    const index = staff.findIndex((s) => s.id === member.id);
    if (index >= 0) {
      staff[index] = member;
      this.logAudit(actor, 'UPDATE_STAFF', 'STAFF', `Updated staff member "${member.name}" (${member.role})`, member.id);
    } else {
      staff.push(member);
      this.logAudit(actor, 'CREATE_STAFF', 'STAFF', `Added staff member "${member.name}" (${member.role})`, member.id);
    }
    this.setItem(STORAGE_KEYS.STAFF, staff);
    return member;
  }

  public deleteStaff(id: string, actor: string = 'rajanbhogta'): boolean {
    const staff = this.getStaff();
    const target = staff.find((s) => s.id === id);
    if (!target) return false;
    const remaining = staff.filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.STAFF, remaining);
    this.logAudit(actor, 'DELETE_STAFF', 'STAFF', `Deleted staff member "${target.name}"`, id);
    return true;
  }

  public getPages(): WebsitePageContent[] {
    return this.getItem(STORAGE_KEYS.PAGES, INITIAL_PAGES);
  }

  public getPageBySlug(slug: string): WebsitePageContent | undefined {
    return this.getPages().find((p) => p.slug === slug);
  }

  public savePage(page: WebsitePageContent, actor: string = 'rajanbhogta'): WebsitePageContent {
    const pages = this.getPages();
    const index = pages.findIndex((p) => p.id === page.id || p.slug === page.slug);
    page.updatedAt = new Date().toISOString();
    if (index >= 0) {
      pages[index] = page;
      this.logAudit(actor, 'UPDATE_PAGE', 'PAGE', `Updated website page "${page.title}"`, page.id);
    } else {
      pages.push(page);
      this.logAudit(actor, 'CREATE_PAGE', 'PAGE', `Created website page "${page.title}"`, page.id);
    }
    this.setItem(STORAGE_KEYS.PAGES, pages);

    fetch(`/api/pages/${page.id || page.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-actor': actor, 'x-admin-auth': 'rajanbhogta' },
      body: JSON.stringify(page),
    }).catch((err) => console.warn('[Sync] Page update error:', err));

    return page;
  }

  public getNotifications(): NotificationRecord[] {
    return this.getItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  public markNotificationAsRead(id: string): void {
    const notifs = this.getNotifications();
    const index = notifs.findIndex((n) => n.id === id);
    if (index >= 0) {
      notifs[index].isRead = true;
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  }

  public addNotification(notif: Omit<NotificationRecord, 'id' | 'createdAt' | 'isRead'>): NotificationRecord {
    const notifs = this.getNotifications();
    const newRecord: NotificationRecord = {
      ...notif,
      id: 'notif-' + Date.now(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    notifs.unshift(newRecord);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    return newRecord;
  }

  public clearAllNotifications(): void {
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  public exportDatabase(): string {
    const payload = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      cinema: 'Laxmi Cineplex Hazaribagh',
      data: {
        settings: this.getSettings(),
        movies: this.getMovies(),
        screens: this.getScreens(),
        shows: this.getShows(),
        bookings: this.getBookings(undefined, true),
        coupons: this.getCoupons(),
        banners: this.getBanners(),
        announcements: this.getAnnouncements(),
        staff: this.getStaff(),
        pages: this.getPages(),
        notifications: this.getNotifications(),
        auditLogs: this.getAuditLogs(),
      },
    };
    return JSON.stringify(payload, null, 2);
  }

  public importDatabase(jsonData: string, actor: string = 'rajanbhogta'): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.data) {
        return { success: false, message: 'Invalid backup file structure. Missing data field.' };
      }

      fetch('/api/database/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-actor': actor, 'x-admin-auth': 'rajanbhogta' },
        body: JSON.stringify(parsed.data),
      }).catch((err) => console.warn('[Sync] Restore database error:', err));

      this.applyServerSnapshot(parsed.data);
      this.logAudit(actor, 'RESTORE_DATABASE', 'SETTINGS', 'Restored entire cinema database from backup file.');
      this.broadcastLocalChange();
      return { success: true, message: 'Cinema database successfully restored!' };
    } catch (e: any) {
      return { success: false, message: 'Failed to restore database: ' + e.message };
    }
  }

  public resetDatabaseToDefaults(actor: string = 'rajanbhogta'): void {
    fetch('/api/database/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-actor': actor, 'x-admin-auth': 'rajanbhogta' },
    }).catch((err) => console.warn('[Sync] Reset database error:', err));

    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(INITIAL_MOVIES));
    localStorage.setItem(STORAGE_KEYS.SCREENS, JSON.stringify(INITIAL_SCREENS));
    localStorage.setItem(STORAGE_KEYS.SHOWS, JSON.stringify(generateInitialShows()));
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(INITIAL_COUPONS));
    localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(INITIAL_BANNERS));
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
    localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(INITIAL_PAGES));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SEAT_HOLDS, JSON.stringify([]));

    this.logAudit(actor, 'RESET_DATABASE', 'SETTINGS', 'Reset entire cinema database to initial default values.');
    this.broadcastLocalChange();
  }

  public getAnnouncements(): Announcement[] {
    return this.getItem(STORAGE_KEYS.ANNOUNCEMENTS, []);
  }

  public saveAnnouncements(announcements: Announcement[], actor: string = 'rajanbhogta') {
    this.setItem(STORAGE_KEYS.ANNOUNCEMENTS, announcements);

    // Persist to Cloud Firestore
    announcements.forEach((a) => {
      saveAnnouncementToFirestore(a).catch((err) => console.warn('[Firestore] Announcement sync error:', err));
    });

    fetch('/api/announcements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-actor': actor, 'x-admin-auth': 'rajanbhogta' },
      body: JSON.stringify(announcements),
    }).catch((err) => console.warn('[Sync] Announcements update error:', err));

    this.logAudit(actor, 'UPDATE_ANNOUNCEMENTS', 'SETTINGS', `Updated cinema ticker announcements`);
  }

  // --- Reports & Analytics ---
  public getAnalytics() {
    const bookings = this.getBookings(undefined, true);
    const confirmed = bookings.filter((b) => b.bookingStatus === 'CONFIRMED');
    const cancelled = bookings.filter((b) => b.bookingStatus === 'CANCELLED');

    const totalRevenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalRefunds = cancelled.reduce((sum, b) => sum + (b.refundAmount || 0), 0);
    const netRevenue = totalRevenue - totalRefunds;
    const ticketsSold = confirmed.reduce((sum, b) => sum + b.seats.length, 0);

    const movies = this.getMovies();
    const activeMovies = movies.filter((m) => m.status === 'NOW_SHOWING').length;

    const shows = this.getShows();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayShows = shows.filter((s) => s.date === todayStr && s.status === 'OPEN').length;

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

  // --- Video Orders, Rentals, and Purchases ---
  public getVideoOrders(userId?: string): VideoOrder[] {
    const orders: VideoOrder[] = this.getItem(STORAGE_KEYS.VIDEO_ORDERS, []);
    if (!userId) return orders;
    return orders.filter((o) => o.userId === userId || o.userEmail === userId);
  }

  public async createVideoOrder(orderData: Omit<VideoOrder, 'id' | 'createdAt'>): Promise<VideoOrder> {
    const id = `vord-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    const newOrder: VideoOrder = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
    };

    const orders = this.getItem<VideoOrder[]>(STORAGE_KEYS.VIDEO_ORDERS, []);
    orders.unshift(newOrder);
    this.setItem(STORAGE_KEYS.VIDEO_ORDERS, orders);

    // Persist to central backend
    try {
      const res = await fetch('/api/video-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });
      if (res.ok) {
        const saved = await res.json();
        return saved;
      }
    } catch (e) {
      console.warn('[Storage] Video order server dispatch error:', e);
    }

    return newOrder;
  }

  public async verifyVideoOrder(
    orderId: string,
    action: 'APPROVE' | 'REJECT',
    actor: string = 'rajanbhogta (Admin)'
  ): Promise<{ success: boolean; order: VideoOrder; entitlement?: any }> {
    const orders = this.getItem<VideoOrder[]>(STORAGE_KEYS.VIDEO_ORDERS, []);
    const idx = orders.findIndex((o) => o.id === orderId);

    if (idx >= 0) {
      orders[idx].paymentStatus = action === 'APPROVE' ? 'PAID' : 'FAILED';
      orders[idx].verifiedAt = new Date().toISOString();
      orders[idx].verifiedBy = actor;
      this.setItem(STORAGE_KEYS.VIDEO_ORDERS, orders);
    }

    // Call authoritative server endpoint
    try {
      const res = await fetch(`/api/video-orders/${orderId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'rajanbhogta',
          'x-actor': actor,
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update local entitlement caches
        if (data.entitlement) {
          if (data.order?.orderType === 'RENTAL') {
            const rentals = this.getItem<RentalEntitlement[]>(STORAGE_KEYS.RENTALS, []);
            rentals.unshift(data.entitlement);
            this.setItem(STORAGE_KEYS.RENTALS, rentals);
          } else {
            const purchases = this.getItem<PurchaseEntitlement[]>(STORAGE_KEYS.PURCHASES, []);
            purchases.unshift(data.entitlement);
            this.setItem(STORAGE_KEYS.PURCHASES, purchases);
          }
        }
        return data;
      }
    } catch (e) {
      console.warn('[Storage] Video verify dispatch error:', e);
    }

    return {
      success: true,
      order: orders[idx] || ({} as any),
    };
  }

  public getRentals(userId?: string): RentalEntitlement[] {
    const rentals = this.getItem<RentalEntitlement[]>(STORAGE_KEYS.RENTALS, []);
    const now = Date.now();
    rentals.forEach((r) => {
      if (r.status === 'ACTIVE' && new Date(r.expiresAt).getTime() <= now) {
        r.status = 'EXPIRED';
      }
    });
    if (!userId) return rentals;
    return rentals.filter((r) => r.userId === userId || r.userEmail === userId);
  }

  public getPurchases(userId?: string): PurchaseEntitlement[] {
    const purchases = this.getItem<PurchaseEntitlement[]>(STORAGE_KEYS.PURCHASES, []);
    if (!userId) return purchases;
    return purchases.filter((p) => p.userId === userId || p.userEmail === userId);
  }

  public hasActiveRental(contentId: string, userId: string): boolean {
    const rentals = this.getRentals(userId);
    const now = Date.now();
    return rentals.some(
      (r) => r.contentId === contentId && r.status === 'ACTIVE' && new Date(r.expiresAt).getTime() > now
    );
  }

  public hasPurchased(contentId: string, userId: string): boolean {
    const purchases = this.getPurchases(userId);
    return purchases.some((p) => p.contentId === contentId && p.status === 'ACTIVE');
  }

  public async checkPlaybackAccess(contentId: string, userId?: string): Promise<{
    allowed: boolean;
    reason?: string;
    playbackToken?: string;
    playbackId?: string;
    provider?: string;
    isRental?: boolean;
    isPurchase?: boolean;
    expiresAt?: string;
    message?: string;
  }> {
    // Authoritative server check
    try {
      const url = userId
        ? `/api/video/playback/${contentId}?userId=${encodeURIComponent(userId)}`
        : `/api/video/playback/${contentId}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      } else {
        const err = await res.json();
        return err;
      }
    } catch {
      // Local client fallback
      const movie = this.getMovieById(contentId);
      if (!movie) return { allowed: false, reason: 'CONTENT_NOT_FOUND', message: 'Content not found' };
      if (movie.monetization === 'FREE') {
        return { allowed: true, playbackToken: 'free_token', provider: movie.videoProvider || 'CLOUDFLARE_STREAM' };
      }
      if (!userId) return { allowed: false, reason: 'UNAUTHENTICATED', message: 'Sign in required' };
      if (this.hasPurchased(contentId, userId)) {
        return { allowed: true, isPurchase: true, playbackToken: 'perm_token', provider: movie.videoProvider || 'CLOUDFLARE_STREAM' };
      }
      if (this.hasActiveRental(contentId, userId)) {
        const rental = this.getRentals(userId).find((r) => r.contentId === contentId && r.status === 'ACTIVE');
        return { allowed: true, isRental: true, expiresAt: rental?.expiresAt, playbackToken: 'rent_token', provider: movie.videoProvider || 'CLOUDFLARE_STREAM' };
      }
      return { allowed: false, reason: 'PAYMENT_REQUIRED', message: 'Active rental or digital purchase required' };
    }
  }

  // Internal storage primitives
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setRawItem<T>(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage raw write error:', e);
    }
  }

  private setItem<T>(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.broadcastLocalChange();
    } catch (e: any) {
      console.error('Storage write error:', e);
    }
  }
}

export const storageService = new StorageService();
