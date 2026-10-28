/**
 * Core TypeScript definitions for Laxmi Cineplex Hazaribagh
 */

export type MovieStatus = 'NOW_SHOWING' | 'COMING_SOON' | 'DRAFT' | 'ARCHIVED';
export type Certification = 'U' | 'UA' | 'UA 13+' | 'UA 16+' | 'A';
export type SeatCategory = 'RECLINER' | 'PRIME' | 'CLASSIC';
export type SeatStatus = 'AVAILABLE' | 'SELECTED' | 'HELD' | 'BOOKED' | 'MAINTENANCE';
export type BookingStatus =
  | 'AWAITING_PAYMENT'
  | 'PENDING_VERIFICATION'
  | 'PAYMENT_VERIFIED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLATION_REQUESTED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';
export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'SUBMITTED';
export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER';

export interface UpiPaymentConfig {
  enabled: boolean;
  payeeName: string;
  bankName: string;
  upiId: string;
  qrImagePath: string;
  instructions: string;
  allowManualVerification: boolean;
}

export type ContentType =
  | 'CINEMA_MOVIE'
  | 'OTT_MOVIE'
  | 'WEB_SERIES'
  | 'SHORT_FILM'
  | 'DOCUMENTARY'
  | 'VIDEO_RENT'
  | 'VIDEO_BUY';

export type MonetizationType =
  | 'FREE'
  | 'RENT'
  | 'BUY'
  | 'RENT_OR_BUY'
  | 'SUBSCRIPTION_READY';

export type ContentVisibility = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';

export type VideoProvider =
  | 'CLOUDFLARE_STREAM'
  | 'AWS_MEDIACONVERT'
  | 'BUNNY_STREAM'
  | 'MUX'
  | 'YOUTUBE_UNLISTED'
  | 'CUSTOM_HLS';

export interface Episode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  synopsis?: string;
  durationMinutes: number;
  videoId?: string;
  thumbnail?: string;
  freePreview?: boolean;
}

export interface Movie {
  id: string;
  title: string;
  synopsis: string;
  language: string; // Hindi, Bhojpuri, Nagpuri, English, etc.
  genre: string[];
  durationMinutes: number;
  releaseDate: string; // YYYY-MM-DD
  certification: Certification;
  posterUrl: string;
  backdropUrl?: string;
  trailerUrl?: string; // YouTube or direct video embed
  status: MovieStatus;
  director?: string;
  cast?: string[];
  isFeatured?: boolean;
  isTrending?: boolean;
  isRegional?: boolean;
  createdAt: string;
  updatedAt: string;

  // Unified OTT & Digital monetization extensions
  contentType?: ContentType;
  monetization?: MonetizationType;
  visibility?: ContentVisibility;
  releaseYear?: number;
  rentPriceINR?: number;
  rentalDurationHours?: number; // 24, 48, 168 (7 days), or custom
  buyPriceINR?: number;
  currency?: string;
  videoProvider?: VideoProvider;
  playbackId?: string;
  seasonsCount?: number;
  episodes?: Episode[];
  viewsCount?: number;
}

export type MediaContent = Movie;

export interface RentalEntitlement {
  id: string;
  userId: string;
  userEmail: string;
  userPhone?: string;
  contentId: string;
  contentTitle: string;
  posterUrl: string;
  contentType: ContentType;
  orderId: string;
  amountPaidINR: number;
  durationHours: number;
  purchasedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  playbackToken?: string;
}

export interface PurchaseEntitlement {
  id: string;
  userId: string;
  userEmail: string;
  userPhone?: string;
  contentId: string;
  contentTitle: string;
  posterUrl: string;
  contentType: ContentType;
  orderId: string;
  amountPaidINR: number;
  purchasedAt: string;
  status: 'ACTIVE' | 'REVOKED';
  playbackToken?: string;
}

export interface VideoOrder {
  id: string;
  userId: string;
  userEmail: string;
  customerName: string;
  customerPhone: string;
  contentId: string;
  contentTitle: string;
  orderType: 'RENTAL' | 'PURCHASE';
  amount: number;
  currency: string;
  rentalDurationHours?: number;
  paymentMethod: 'UPI' | 'GATEWAY_RAZORPAY' | 'GATEWAY_STRIPE';
  paymentStatus: 'PENDING' | 'PENDING_VERIFICATION' | 'PAID' | 'FAILED' | 'REFUNDED';
  upiReference?: string;
  gatewayPaymentId?: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface VideoProviderStatus {
  provider: VideoProvider;
  name: string;
  isReady: boolean;
  description: string;
  requiredEnvVars: string[];
  playbackType: string;
}


export interface Screen {
  id: string;
  name: string; // e.g. "Screen 1 - Dolby Atmos 7.1"
  soundSystem: string; // "Dolby Atmos 7.1 Immersive"
  projection: string; // "Barco 4K Laser RGB"
  totalSeats: number;
  isActive: boolean;
  rows: ScreenRow[];
}

export interface ScreenRow {
  rowLabel: string; // A, B, C...
  category: SeatCategory;
  price: number;
  seats: {
    seatNumber: number;
    label: string; // e.g. A1, A2
    isAisle?: boolean;
    isAccessible?: boolean;
  }[];
}

export interface Show {
  id: string;
  movieId: string;
  screenId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. "14:30")
  endTime: string; // calculated from duration + buffer
  pricing: Record<SeatCategory, number>;
  status: 'SCHEDULED' | 'OPEN' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
}

export interface SeatHold {
  showId: string;
  seatId: string; // e.g. "A-1"
  userId: string;
  expiresAt: number; // timestamp ms
}

export interface ConcessionItem {
  id: string;
  name: string;
  category: 'POPCORN' | 'BEVERAGE' | 'SNACK' | 'COMBO';
  price: number;
  description: string;
  imageUrl?: string;
}

export interface BookingSeat {
  seatLabel: string; // e.g. "G-12"
  rowLabel: string;
  seatNumber: number;
  category: SeatCategory;
  price: number;
}

export interface BookingConcession {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Booking {
  id: string; // Unique reference e.g. "LXM-2026-8942"
  ticketToken: string; // Cryptographic validation token for QR
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  showId: string;
  movieId: string;
  screenId: string;
  showDate: string;
  showTime: string;
  movieTitle: string;
  screenName: string;
  seats: BookingSeat[];
  concessions: BookingConcession[];
  subtotal: number;
  convenienceFee: number;
  gstAmount: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  paymentMethod?: string;
  isAdmitted?: boolean;
  admittedAt?: string;
  cancellationReason?: string;
  refundAmount?: number;
  // UPI verification fields
  upiReference?: string; // 12-digit UTR
  upiSubmittedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  receiptUrl?: string;
  statusHistory?: Array<{ status: string; changedAt: string; changedBy: string; notes?: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  passwordHash?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minBookingAmount: number;
  maxDiscount?: number;
  expiryDate: string;
  usageCount: number;
  maxUsage: number;
  isActive: boolean;
  description: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  movieId?: string;
  targetMovieId?: string;
  imageUrl: string;
  desktopImage?: string;
  mobileImage?: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
}

export interface Announcement {
  id: string;
  message: string;
  badge?: string;
  linkText?: string;
  linkUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CinemaSettings {
  cinemaName: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  convenienceFeePerTicket: number;
  gstPercentage: number;
  cancellationCutoffHours: number;
  maxTicketsPerBooking: number;
  seatHoldMinutes: number;
  isMaintenanceMode: boolean;
  announcementTickerActive: boolean;
  upiConfig: UpiPaymentConfig;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'BOX_OFFICE' | 'USHER';
  department: string;
  permissions: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  lastLogin?: string;
}

export interface WebsitePageContent {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  target: 'ALL' | 'CUSTOMERS' | 'ADMINS';
  createdAt: string;
  isRead: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetType: 'MOVIE' | 'SHOW' | 'SCREEN' | 'BOOKING' | 'SETTINGS' | 'AUTH' | 'COUPON' | 'BANNER' | 'PAYMENT' | 'STAFF' | 'PAGE';
  targetId?: string;
  details: string;
  ipAddress?: string;
}
