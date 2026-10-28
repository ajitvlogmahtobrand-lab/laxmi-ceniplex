import React, { createContext, useContext, useState, useEffect } from 'react';
import { Show, Movie, Screen, BookingSeat, BookingConcession, Coupon } from '../types';
import { storageService } from '../services/storage';

interface BookingContextType {
  selectedShow: Show | null;
  selectedMovie: Movie | null;
  selectedScreen: Screen | null;
  selectedSeats: BookingSeat[];
  selectedConcessions: BookingConcession[];
  appliedCoupon: Coupon | null;
  discountAmount: number;
  holdExpiresAt: number | null;
  holdSecondsLeft: number;
  initiateBooking: (showId: string) => void;
  toggleSeat: (seat: BookingSeat) => boolean;
  clearSeats: () => void;
  updateConcessionQuantity: (item: { id: string; name: string; price: number }, delta: number) => void;
  applyCouponCode: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  calculatePricing: () => {
    ticketSubtotal: number;
    concessionsTotal: number;
    subtotal: number;
    convenienceFee: number;
    gstAmount: number;
    discountAmount: number;
    grandTotal: number;
  };
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<BookingSeat[]>([]);
  const [selectedConcessions, setSelectedConcessions] = useState<BookingConcession[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number>(0);

  // Seat hold timer countdown
  useEffect(() => {
    if (!holdExpiresAt) {
      setHoldSecondsLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((holdExpiresAt - Date.now()) / 1000));
      setHoldSecondsLeft(remaining);

      if (remaining === 0) {
        // Hold expired: clear selected seats
        setSelectedSeats([]);
        setHoldExpiresAt(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  const initiateBooking = (showId: string) => {
    const show = storageService.getShowById(showId);
    if (!show) return;

    const movie = storageService.getMovieById(show.movieId);
    const screen = storageService.getScreenById(show.screenId);

    setSelectedShow(show);
    setSelectedMovie(movie || null);
    setSelectedScreen(screen || null);
    setSelectedSeats([]);
    setSelectedConcessions([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setHoldExpiresAt(null);
  };

  const toggleSeat = (seat: BookingSeat): boolean => {
    if (!selectedShow) return false;
    const settings = storageService.getSettings();
    const isAlreadySelected = selectedSeats.some((s) => s.seatLabel === seat.seatLabel);

    if (isAlreadySelected) {
      const updated = selectedSeats.filter((s) => s.seatLabel !== seat.seatLabel);
      setSelectedSeats(updated);
      if (updated.length === 0) {
        setHoldExpiresAt(null);
      }
      return true;
    } else {
      // Check max tickets limit
      if (selectedSeats.length >= settings.maxTicketsPerBooking) {
        alert(`Maximum ${settings.maxTicketsPerBooking} tickets can be booked at once.`);
        return false;
      }

      const updated = [...selectedSeats, seat];
      setSelectedSeats(updated);

      // Start or refresh seat hold (8 minutes)
      const expires = Date.now() + settings.seatHoldMinutes * 60 * 1000;
      setHoldExpiresAt(expires);

      // Persist temporary hold
      storageService.holdSeats(
        selectedShow.id,
        updated.map((s) => s.seatLabel),
        'guest-session',
        settings.seatHoldMinutes
      );

      return true;
    }
  };

  const clearSeats = () => {
    setSelectedSeats([]);
    setHoldExpiresAt(null);
  };

  const updateConcessionQuantity = (item: { id: string; name: string; price: number }, delta: number) => {
    const existingIndex = selectedConcessions.findIndex((c) => c.itemId === item.id);
    let updated = [...selectedConcessions];

    if (existingIndex >= 0) {
      const newQty = updated[existingIndex].quantity + delta;
      if (newQty <= 0) {
        updated = updated.filter((c) => c.itemId !== item.id);
      } else {
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
      }
    } else if (delta > 0) {
      updated.push({ itemId: item.id, name: item.name, quantity: 1, price: item.price });
    }

    setSelectedConcessions(updated);
  };

  const calculatePricing = () => {
    const settings = storageService.getSettings();
    const ticketSubtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
    const concessionsTotal = selectedConcessions.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const subtotal = ticketSubtotal + concessionsTotal;

    // Convenience fee: flat fee per ticket
    const baseConvenience = selectedSeats.length * settings.convenienceFeePerTicket;
    // GST applied to convenience fee (18%)
    const gstAmount = Math.round((baseConvenience * settings.gstPercentage) / 100);
    const convenienceFee = baseConvenience;

    const discount = Math.min(discountAmount, subtotal);
    const grandTotal = Math.max(0, subtotal + convenienceFee + gstAmount - discount);

    return {
      ticketSubtotal,
      concessionsTotal,
      subtotal,
      convenienceFee,
      gstAmount,
      discountAmount: discount,
      grandTotal,
    };
  };

  const applyCouponCode = (code: string): { success: boolean; message: string } => {
    const { subtotal } = calculatePricing();
    const result = storageService.validateCoupon(code, subtotal);

    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon);
      setDiscountAmount(result.discount);
      return { success: true, message: result.message };
    } else {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return { success: false, message: result.message };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const resetBooking = () => {
    setSelectedShow(null);
    setSelectedMovie(null);
    setSelectedScreen(null);
    setSelectedSeats([]);
    setSelectedConcessions([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setHoldExpiresAt(null);
  };

  return (
    <BookingContext.Provider
      value={{
        selectedShow,
        selectedMovie,
        selectedScreen,
        selectedSeats,
        selectedConcessions,
        appliedCoupon,
        discountAmount,
        holdExpiresAt,
        holdSecondsLeft,
        initiateBooking,
        toggleSeat,
        clearSeats,
        updateConcessionQuantity,
        applyCouponCode,
        removeCoupon,
        calculatePricing,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
