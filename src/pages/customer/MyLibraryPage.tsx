import React, { useState, useEffect } from 'react';
import {
  Film,
  Tv,
  Clock,
  ShoppingBag,
  Play,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { RentalEntitlement, PurchaseEntitlement, VideoOrder, Movie } from '../../types';
import { VideoPlayerModal } from '../../components/video/VideoPlayerModal';
import { VideoCheckoutModal } from '../../components/video/VideoCheckoutModal';

interface MyLibraryPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const MyLibraryPage: React.FC<MyLibraryPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'RENTALS' | 'PURCHASES' | 'PENDING'>('RENTALS');

  const [rentals, setRentals] = useState<RentalEntitlement[]>([]);
  const [purchases, setPurchases] = useState<PurchaseEntitlement[]>([]);
  const [orders, setOrders] = useState<VideoOrder[]>([]);

  // Modals
  const [selectedPlaybackContent, setSelectedPlaybackContent] = useState<Movie | null>(null);
  const [playbackToken, setPlaybackToken] = useState<string | undefined>(undefined);
  const [isRentalPlayback, setIsRentalPlayback] = useState(false);
  const [rentalExpiry, setRentalExpiry] = useState<string | undefined>(undefined);

  // Renew checkout modal
  const [renewContent, setRenewContent] = useState<Movie | null>(null);

  const loadEntitlements = () => {
    const userIdentifier = currentUser?.id || currentUser?.email || 'guest-session';
    const r = storageService.getRentals(userIdentifier);
    const p = storageService.getPurchases(userIdentifier);
    const o = storageService.getVideoOrders(userIdentifier);
    setRentals(r);
    setPurchases(p);
    setOrders(o);
  };

  useEffect(() => {
    loadEntitlements();
    const handleUpdate = () => loadEntitlements();
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, [currentUser]);

  const activeRentals = rentals.filter(
    (r) => r.status === 'ACTIVE' && new Date(r.expiresAt).getTime() > Date.now()
  );
  const expiredRentals = rentals.filter(
    (r) => r.status === 'EXPIRED' || new Date(r.expiresAt).getTime() <= Date.now()
  );
  const pendingOrders = orders.filter((o) => o.paymentStatus === 'PENDING' || o.paymentStatus === 'PENDING_VERIFICATION');

  const handlePlayRental = (rental: RentalEntitlement) => {
    const movie = storageService.getMovieById(rental.contentId);
    if (!movie) return;
    setSelectedPlaybackContent(movie);
    setPlaybackToken(rental.playbackToken);
    setIsRentalPlayback(true);
    setRentalExpiry(rental.expiresAt);
  };

  const handlePlayPurchase = (purchase: PurchaseEntitlement) => {
    const movie = storageService.getMovieById(purchase.contentId);
    if (!movie) return;
    setSelectedPlaybackContent(movie);
    setPlaybackToken(purchase.playbackToken);
    setIsRentalPlayback(false);
    setRentalExpiry(undefined);
  };

  const formatRemainingTime = (expiresAt: string) => {
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] py-8 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#171923] font-cinema tracking-tight">
              My Digital Video Library
            </h1>
            <p className="text-xs text-[#667085]">
              Active rentals, digital purchases, and pending UPI payment requests
            </p>
          </div>

          <button
            onClick={() => onNavigate('/ott')}
            className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2 bg-[#E31837] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
          >
            <Film className="w-4 h-4" />
            <span>Browse OTT Catalog</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('RENTALS')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 cursor-pointer transition-colors ${
              activeTab === 'RENTALS'
                ? 'border-[#E31837] text-[#E31837]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Active & Past Rentals ({rentals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PURCHASES')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 cursor-pointer transition-colors ${
              activeTab === 'PURCHASES'
                ? 'border-[#E31837] text-[#E31837]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Purchased Videos ({purchases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PENDING')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 cursor-pointer transition-colors ${
              activeTab === 'PENDING'
                ? 'border-[#E31837] text-[#E31837]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Hourglass className="w-4 h-4" />
            <span>Pending UPI Requests ({pendingOrders.length})</span>
          </button>
        </div>

        {/* Tab 1: Rentals */}
        {activeTab === 'RENTALS' && (
          <div className="space-y-6">
            {/* Active Rentals Sub-section */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Streaming Rentals</span>
              </h3>

              {activeRentals.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Active Rentals Right Now</p>
                  <p className="text-[11px] text-slate-500">
                    Rent any OTT movie or series to stream for 24h, 48h, or 7 days.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {activeRentals.map((rental) => (
                    <div
                      key={rental.id}
                      className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex space-x-3">
                        <img
                          src={rental.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200'}
                          alt={rental.contentTitle}
                          className="w-16 h-24 object-cover rounded-xl shrink-0"
                        />
                        <div className="space-y-1 overflow-hidden">
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                            {rental.contentTitle}
                          </h4>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Rental
                          </span>
                          <p className="text-[11px] font-medium text-amber-700 flex items-center space-x-1 pt-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatRemainingTime(rental.expiresAt)}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePlayRental(rental)}
                        className="w-full py-2 bg-[#E31837] hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Stream Now</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expired Rentals Sub-section */}
            {expiredRentals.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
                  Expired Rentals
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {expiredRentals.map((rental) => {
                    const movie = storageService.getMovieById(rental.contentId);
                    return (
                      <div
                        key={rental.id}
                        className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-3 opacity-80"
                      >
                        <div className="flex space-x-3">
                          <img
                            src={rental.posterUrl}
                            alt={rental.contentTitle}
                            className="w-14 h-20 object-cover rounded-xl shrink-0 filter grayscale"
                          />
                          <div className="space-y-1">
                            <h4 className="font-bold text-xs text-slate-700 truncate">{rental.contentTitle}</h4>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                              Viewing Window Expired
                            </span>
                            <p className="text-[10px] text-slate-400">
                              Ended on {new Date(rental.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {movie && (
                          <button
                            onClick={() => setRenewContent(movie)}
                            className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Renew Rental (₹{movie.rentPriceINR || 49})</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Purchases */}
        {activeTab === 'PURCHASES' && (
          <div>
            {purchases.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Purchased Videos Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Digital purchases stay forever in your library. Buy once and stream without time limits.
                </p>
                <button
                  onClick={() => onNavigate('/ott')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Explore Buyable Titles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex space-x-3">
                      <img
                        src={purchase.posterUrl}
                        alt={purchase.contentTitle}
                        className="w-16 h-24 object-cover rounded-xl shrink-0"
                      />
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                          {purchase.contentTitle}
                        </h4>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Permanent Ownership
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Purchased on {new Date(purchase.purchasedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePlayPurchase(purchase)}
                      className="w-full py-2 bg-[#E31837] hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Play Video</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Pending UPI Requests */}
        {activeTab === 'PENDING' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start space-x-2">
              <Hourglass className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong>Manual Bank Verification Flow:</strong> When you submit a UPI UTR reference, our Box Office admin confirms the credit in India Post Payment Bank and approves your entitlement. Approval instantly activates your video.
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-2">
                <Hourglass className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Submitted Payment Requests</p>
                <p className="text-[11px] text-slate-500">
                  When you checkout using UPI QR, your submitted requests will show here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900">{order.contentTitle}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {order.orderType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Order ID: <span className="font-mono text-slate-800 font-bold">{order.id}</span> • Submitted on {new Date(order.createdAt).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        UTR / Reference: <span className="font-mono font-bold text-slate-900">{order.upiReference}</span>
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                      <span className="text-sm font-black text-[#E31837]">₹{order.amount}</span>
                      <span
                        className={`mt-1 inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : order.paymentStatus === 'FAILED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {order.paymentStatus === 'PAID' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Hourglass className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{order.paymentStatus === 'PAID' ? 'Approved & Active' : order.paymentStatus === 'FAILED' ? 'Rejected' : 'Pending Verification'}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedPlaybackContent && (
        <VideoPlayerModal
          isOpen={!!selectedPlaybackContent}
          onClose={() => setSelectedPlaybackContent(null)}
          content={selectedPlaybackContent}
          playbackToken={playbackToken}
          isRental={isRentalPlayback}
          expiresAt={rentalExpiry}
        />
      )}

      {/* Renew Checkout Modal */}
      {renewContent && (
        <VideoCheckoutModal
          isOpen={!!renewContent}
          onClose={() => setRenewContent(null)}
          content={renewContent}
          initialMode="RENTAL"
          onOrderSubmitted={() => loadEntitlements()}
        />
      )}
    </div>
  );
};
