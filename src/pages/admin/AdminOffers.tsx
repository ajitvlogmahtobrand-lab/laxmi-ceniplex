import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { Coupon } from '../../types';
import { Tag, Plus, Trash2, CheckCircle, AlertCircle, X, Percent, DollarSign } from 'lucide-react';

export const AdminOffers: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(() => storageService.getCoupons());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('FLAT');
  const [discountValue, setDiscountValue] = useState(100);
  const [minBookingAmount, setMinBookingAmount] = useState(500);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(undefined);
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [maxUsage, setMaxUsage] = useState(1000);
  const [description, setDescription] = useState('');

  const refreshCoupons = () => {
    setCoupons(storageService.getCoupons());
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      const newCoupon: Coupon = {
        id: `coup-${Date.now().toString(36)}`,
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minBookingAmount: Number(minBookingAmount),
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        expiryDate,
        usageCount: 0,
        maxUsage: Number(maxUsage),
        isActive: true,
        description: description.trim() || `Save with code ${code.toUpperCase()}`,
      };

      storageService.saveCoupon(newCoupon);
      setFeedback({ message: `Coupon code ${newCoupon.code} created successfully!`, isError: false });
      setIsModalOpen(false);
      refreshCoupons();
    } catch (err: any) {
      setFeedback({ message: err.message || 'Error saving coupon', isError: true });
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    storageService.deleteCoupon(id);
    refreshCoupons();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white font-cinema">Offers & Coupons Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create discount vouchers, configure redemption ceilings, and run seasonal campaigns.
          </p>
        </div>

        <button
          onClick={() => {
            setCode('');
            setDescription('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Promo Code</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            feedback.isError
              ? 'bg-rose-950/80 border-rose-700 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="p-5 rounded-2xl bg-[#0e1422] border border-white/10 shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-lg text-white bg-red-950/80 text-red-400 px-3 py-1 rounded-xl border border-red-700">
                  {coupon.code}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    coupon.isActive
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div>
                <div className="text-base font-bold text-white">
                  {coupon.discountType === 'FLAT'
                    ? `Flat ₹${coupon.discountValue} Off`
                    : `${coupon.discountValue}% Off (Up to ₹${coupon.maxDiscount || 'Unlimited'})`}
                </div>
                <p className="text-xs text-slate-400 mt-1">{coupon.description}</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Min Order:</span>
                  <span className="font-mono">₹{coupon.minBookingAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Redeemed:</span>
                  <span className="font-mono">
                    {coupon.usageCount} / {coupon.maxUsage}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expires:</span>
                  <span className="font-mono">{coupon.expiryDate}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDelete(coupon.id)}
              className="w-full py-1.5 bg-rose-950/40 hover:bg-rose-950 text-rose-300 text-xs font-semibold rounded-lg border border-rose-800/40 flex items-center justify-center space-x-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Coupon</span>
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0e1422] border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-white font-bold text-base font-cinema">Create Promo Coupon</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVAL150"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="FLAT">Flat ₹ Amount</option>
                    <option value="PERCENTAGE">Percentage %</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Value (₹ or %)</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={minBookingAmount}
                    onChange={(e) => setMinBookingAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Short Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Save ₹100 on weekend blockbusters"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
