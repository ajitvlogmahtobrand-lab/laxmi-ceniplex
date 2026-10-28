import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Movie,
  HeroBanner,
  Show,
  Screen,
  CinemaSettings,
  Announcement,
  Coupon,
  Booking,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_MOVIES,
  INITIAL_SCREENS,
  INITIAL_BANNERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_COUPONS,
  generateInitialShows,
} from '../data/initialData';

// Firestore collection names
export const FIRESTORE_COLLECTIONS = {
  MOVIES: 'movies',
  BANNERS: 'banners',
  SHOWS: 'shows',
  SCREENS: 'screens',
  SETTINGS: 'settings',
  ANNOUNCEMENTS: 'announcements',
  COUPONS: 'coupons',
  BOOKINGS: 'bookings',
} as const;

/**
 * Real-time listener for Movies collection
 */
export function listenToMovies(
  onData: (movies: Movie[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.MOVIES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const movies: Movie[] = [];
      snapshot.forEach((d) => {
        movies.push(d.data() as Movie);
      });
      onData(movies);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, FIRESTORE_COLLECTIONS.MOVIES);
    }
  );
}

/**
 * Real-time listener for Hero Banners
 */
export function listenToBanners(
  onData: (banners: HeroBanner[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.BANNERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const banners: HeroBanner[] = [];
      snapshot.forEach((d) => {
        banners.push(d.data() as HeroBanner);
      });
      banners.sort((a, b) => a.displayOrder - b.displayOrder);
      onData(banners);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, FIRESTORE_COLLECTIONS.BANNERS);
    }
  );
}

/**
 * Real-time listener for Shows
 */
export function listenToShows(
  onData: (shows: Show[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.SHOWS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const shows: Show[] = [];
      snapshot.forEach((d) => {
        shows.push(d.data() as Show);
      });
      onData(shows);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, FIRESTORE_COLLECTIONS.SHOWS);
    }
  );
}

/**
 * Real-time listener for Screens
 */
export function listenToScreens(
  onData: (screens: Screen[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.SCREENS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const screens: Screen[] = [];
      snapshot.forEach((d) => {
        screens.push(d.data() as Screen);
      });
      onData(screens);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, FIRESTORE_COLLECTIONS.SCREENS);
    }
  );
}

/**
 * Real-time listener for Cinema Settings
 */
export function listenToSettings(
  onData: (settings: CinemaSettings) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'global');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as CinemaSettings);
      }
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, `${FIRESTORE_COLLECTIONS.SETTINGS}/global`);
    }
  );
}

/**
 * Real-time listener for Announcements
 */
export function listenToAnnouncements(
  onData: (announcements: Announcement[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.ANNOUNCEMENTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const announcements: Announcement[] = [];
      snapshot.forEach((d) => {
        announcements.push(d.data() as Announcement);
      });
      onData(announcements);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, FIRESTORE_COLLECTIONS.ANNOUNCEMENTS);
    }
  );
}

/**
 * Real-time listener for Coupons
 */
export function listenToCoupons(
  onData: (coupons: Coupon[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.COUPONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const coupons: Coupon[] = [];
      snapshot.forEach((d) => {
        coupons.push(d.data() as Coupon);
      });
      onData(coupons);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, FIRESTORE_COLLECTIONS.COUPONS);
    }
  );
}

/**
 * Real-time listener for Bookings
 * Customers only query their own user bookings to satisfy ABAC firestore security rules
 */
export function listenToBookings(
  userId: string | null,
  isAdmin: boolean,
  onData: (bookings: Booking[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, FIRESTORE_COLLECTIONS.BOOKINGS);
  const q = isAdmin
    ? colRef
    : userId
    ? query(colRef, where('userId', '==', userId))
    : null;

  if (!q) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const bookings: Booking[] = [];
      snapshot.forEach((d) => {
        bookings.push(d.data() as Booking);
      });
      bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(bookings);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, FIRESTORE_COLLECTIONS.BOOKINGS);
    }
  );
}

// --- Direct Mutations with Error Handlers ---

export async function saveMovieToFirestore(movie: Movie): Promise<void> {
  const path = `${FIRESTORE_COLLECTIONS.MOVIES}/${movie.id}`;
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.MOVIES, movie.id);
    await setDoc(docRef, movie, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteMovieFromFirestore(movieId: string): Promise<void> {
  const path = `${FIRESTORE_COLLECTIONS.MOVIES}/${movieId}`;
  try {
    await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.MOVIES, movieId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveBannerToFirestore(banner: HeroBanner): Promise<void> {
  const path = `${FIRESTORE_COLLECTIONS.BANNERS}/${banner.id}`;
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.BANNERS, banner.id);
    await setDoc(docRef, banner, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteBannerFromFirestore(bannerId: string): Promise<void> {
  const path = `${FIRESTORE_COLLECTIONS.BANNERS}/${bannerId}`;
  try {
    await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.BANNERS, bannerId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveShowToFirestore(show: Show): Promise<void> {
  const path = `${FIRESTORE_COLLECTIONS.SHOWS}/${show.id}`;
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.SHOWS, show.id);
    await setDoc(docRef, show, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteShowFromFirestore(showId: string): Promise<void> {
  const path = `${FIRESTORE_COLLECTIONS.SHOWS}/${showId}`;
  try {
    await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.SHOWS, showId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveSettingsToFirestore(settings: CinemaSettings): Promise<void> {
  const path = `${FIRESTORE_COLLECTIONS.SETTINGS}/global`;
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'global');
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAnnouncementToFirestore(announcement: Announcement): Promise<void> {
  const path = `${FIRESTORE_COLLECTIONS.ANNOUNCEMENTS}/${announcement.id}`;
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.ANNOUNCEMENTS, announcement.id);
    await setDoc(docRef, announcement, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteAnnouncementFromFirestore(announcementId: string): Promise<void> {
  const path = `${FIRESTORE_COLLECTIONS.ANNOUNCEMENTS}/${announcementId}`;
  try {
    await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.ANNOUNCEMENTS, announcementId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveCouponToFirestore(coupon: Coupon): Promise<void> {
  const path = `${FIRESTORE_COLLECTIONS.COUPONS}/${coupon.id}`;
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.COUPONS, coupon.id);
    await setDoc(docRef, coupon, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCouponFromFirestore(couponId: string): Promise<void> {
  const path = `${FIRESTORE_COLLECTIONS.COUPONS}/${couponId}`;
  try {
    await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.COUPONS, couponId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Seed initial catalog to Firestore if the collections are empty
 */
export async function seedFirestoreIfEmpty(): Promise<boolean> {
  try {
    const moviesSnapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.MOVIES));
    if (!moviesSnapshot.empty) {
      return false; // Already seeded
    }

    const batch = writeBatch(db);

    // Settings
    const settingsDoc = doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'global');
    batch.set(settingsDoc, INITIAL_SETTINGS);

    // Movies
    for (const m of INITIAL_MOVIES) {
      batch.set(doc(db, FIRESTORE_COLLECTIONS.MOVIES, m.id), m);
    }

    // Screens
    for (const sc of INITIAL_SCREENS) {
      batch.set(doc(db, FIRESTORE_COLLECTIONS.SCREENS, sc.id), sc);
    }

    // Hero Banners
    for (const b of INITIAL_BANNERS) {
      batch.set(doc(db, FIRESTORE_COLLECTIONS.BANNERS, b.id), b);
    }

    // Announcements
    for (const a of INITIAL_ANNOUNCEMENTS) {
      batch.set(doc(db, FIRESTORE_COLLECTIONS.ANNOUNCEMENTS, a.id), a);
    }

    // Coupons
    for (const c of INITIAL_COUPONS) {
      batch.set(doc(db, FIRESTORE_COLLECTIONS.COUPONS, c.id), c);
    }

    // Shows
    const initialShows = generateInitialShows();
    for (const sh of initialShows) {
      batch.set(doc(db, FIRESTORE_COLLECTIONS.SHOWS, sh.id), sh);
    }

    await batch.commit();
    return true;
  } catch (err) {
    console.warn('Firestore initial seeding deferred or restricted by security rules:', err);
    return false;
  }
}
