import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertCircle,
  ShieldCheck,
  Film,
  User,
  ShoppingBag,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { VideoOrder } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminPaymentRequests: React.FC = () => {
  const { adminUser } = useAuth();
  const [orders, setOrders] = useState<VideoOrder[]>(() => storageService.getVideoOrders());
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModalOrder, setConfirmModalOrder] = useState<{
    order: VideoOrder;
    action: 'APPROVE' | 'REJECT';
  } | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshOrders = () => {
    setOrders(storageService.getVideoOrders());
  };

  useEffect(() => {
    refreshOrders();
    const handleUpdate = () => refreshOrders();
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, []);

  const handleProcessOrder = async () => {
    if (!confirmModalOrder) return;
    const { order, action } = confirmModalOrder;

    try {
      const reviewerActor = adminUser?.name || 'Rajan Bhogta (Super Admin)';
      const res = await storageService.verifyVideoOrder(order.id, action, reviewerActor);
      if (res.success) {
        setFeedback({
          type: 'success',
          text:
            action === 'APPROVE'
              ? `Approved order #${order.id} for "${order.contentTitle}". Digital entitlement activated!`
              : `Rejected order #${order.id}.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update order status.' });
    } finally {
      setConfirmModalOrder(null);
      setAdminNote('');
      refreshOrders();
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'PENDING' && o.paymentStatus !== 'PENDING' && o.paymentStatus !== 'PENDING_VERIFICATION') {
      return false;
    }
    if (activeTab === 'APPROVED' && o.paymentStatus !== 'PAID') return false;
    if (activeTab === 'REJECTED' && o.paymentStatus !== 'FAILED') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        o.contentTitle.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.userEmail?.toLowerCase().includes(q) ||
        o.upiReference?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = orders.filter(
    (o) => o.paymentStatus === 'PENDING' || o.paymentStatus === 'PENDING_VERIFICATION'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#171923] font-cinema tracking-tight">
            UPI QR Payment Verification Queue
          </h2>
          <p className="text-xs text-[#667085]">
            Cross-check customer bank UTR submissions against India Post Payment Bank and approve entitlements
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingCount} Pending Verification</span>
          </span>
        </div>
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

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-[#E31837] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'APPROVED'
                ? 'bg-[#E31837] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Approved ({orders.filter((o) => o.paymentStatus === 'PAID').length})
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'REJECTED'
                ? 'bg-[#E31837] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Rejected ({orders.filter((o) => o.paymentStatus === 'FAILED').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by UTR, title, email..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:border-[#E31837]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Request & Customer</th>
                <th className="py-3 px-4">Content Title</th>
                <th className="py-3 px-4">Type & Amount</th>
                <th className="py-3 px-4">12-Digit UTR Reference</th>
                <th className="py-3 px-4">Submission Time</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No requests found under <strong>{activeTab}</strong> tab.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <p className="text-[11px] text-slate-500">{order.userEmail}</p>
                        <p className="text-[10px] font-mono text-slate-400">UID: {order.userId?.slice(0, 16)}...</p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {order.contentTitle}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Order: {order.id}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {order.orderType === 'RENTAL' ? `Rent (${order.rentalDurationHours || 48}h)` : 'Purchase'}
                        </span>
                        <div className="font-black text-sm text-[#E31837]">₹{order.amount}</div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-black text-xs text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg inline-block">
                        {order.upiReference}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {new Date(order.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {order.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Approved & Active</span>
                        </span>
                      ) : order.paymentStatus === 'FAILED' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setConfirmModalOrder({ order, action: 'APPROVE' })}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setConfirmModalOrder({ order, action: 'REJECT' })}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  confirmModalOrder.action === 'APPROVE'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}
              >
                {confirmModalOrder.action === 'APPROVE' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900">
                  {confirmModalOrder.action === 'APPROVE' ? 'Approve Payment Request?' : 'Reject Payment Request?'}
                </h4>
                <p className="text-xs text-slate-500">Order #{confirmModalOrder.order.id}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Patron:</span>
                <span className="font-bold text-slate-900">{confirmModalOrder.order.customerName} ({confirmModalOrder.order.userEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Content:</span>
                <span className="font-bold text-slate-900">{confirmModalOrder.order.contentTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted UTR:</span>
                <span className="font-mono font-bold text-slate-900">{confirmModalOrder.order.upiReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount to Credit:</span>
                <span className="font-bold text-emerald-700">₹{confirmModalOrder.order.amount}</span>
              </div>
            </div>

            {confirmModalOrder.action === 'APPROVE' ? (
              <p className="text-xs text-slate-600">
                Confirming approval will immediately award an active digital entitlement to <strong>{confirmModalOrder.order.userEmail}</strong> and start the rental countdown or unlock permanent streaming.
              </p>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rejection Reason</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. UTR not reflected in IPPB account"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white"
                />
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setConfirmModalOrder(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessOrder}
                className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold cursor-pointer ${
                  confirmModalOrder.action === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {confirmModalOrder.action === 'APPROVE' ? 'Confirm & Activate' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
