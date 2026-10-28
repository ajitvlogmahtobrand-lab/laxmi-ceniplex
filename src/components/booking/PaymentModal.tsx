import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import {
  QrCode,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  Upload,
  X,
  Sparkles,
  Maximize2,
  Check,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  movieTitle: string;
  onSuccess: (paymentId: string, paymentMethod: string, utr: string, receiptUrl?: string) => void;
  onFailure: (errorMessage: string) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  movieTitle,
  onSuccess,
  onFailure,
  onClose,
}) => {
  const settings = storageService.getSettings();
  const upiConfig = settings.upiConfig || {
    enabled: true,
    payeeName: 'Rajan Bhogta',
    bankName: 'India Post Payment Bank 3764',
    upiId: 'rajanbhogta714@okhdfcbank',
    qrImagePath: '/images/rajan_bhogta_upi_qr.jpeg',
    instructions: 'Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI app.',
    allowManualVerification: true,
  };

  // Ensure default fallback image points to clean cropped QR code
  const effectiveQrImage =
    upiConfig.qrImagePath || '/images/rajan_bhogta_upi_qr.jpeg';

  const [utr, setUtr] = useState('');
  const [copied, setCopied] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isZoomedQr, setIsZoomedQr] = useState(false);

  // 10-minute temporary seat hold countdown
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins in seconds

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(upiConfig.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Receipt image size exceeds 5MB. Please upload a smaller screenshot.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setReceiptImage(uploadEvent.target?.result as string);
      setReceiptFileName(file.name);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptImage(null);
    setReceiptFileName(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate 12-digit UTR if entered
    const cleanUtr = utr.trim().replace(/\s/g, '');
    if (!cleanUtr) {
      setErrorMessage('Please enter the 12-digit UPI Reference No. / UTR from your payment app.');
      return;
    }

    if (!/^\d{12}$/.test(cleanUtr)) {
      setErrorMessage('Invalid UTR format. UPI Reference No. must be exactly 12 digits (e.g. 429812345678).');
      return;
    }

    setIsSubmitting(true);

    // Simulate verification delay
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedPaymentId = `PAY-UPI-${Date.now().toString().slice(-6)}`;
      onSuccess(generatedPaymentId, 'UPI_QR', cleanUtr, receiptImage || undefined);
    }, 1200);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-lg bg-white border border-[#E5E7EB] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 my-8 text-[#171923]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-150 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-[#E31837] flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[#171923] font-cinema">
                  Scan & Pay via UPI
                </h3>
                <p className="text-xs text-[#667085]">
                  Instant verification for {movieTitle}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Seat Hold Timer & Payable Amount Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F6F7FB] border border-[#E5E7EB]">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Total Payable Amount
              </span>
              <span className="text-2xl font-black text-[#E31837] font-mono">
                ₹{amount}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-500 flex items-center justify-end space-x-1">
                <Clock className="w-3 h-3 text-[#E31837]" />
                <span>Seat Hold Expires In</span>
              </span>
              <span className={`text-base font-black font-mono ${timeLeft < 120 ? 'text-red-600 animate-pulse' : 'text-[#171923]'}`}>
                {formattedTime}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* QR Display Card */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center space-y-3">
            {/* Payee Info Banner */}
            <div className="text-center space-y-0.5">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Verified Box Office Account</span>
              </div>
              <h4 className="font-extrabold text-[#171923] text-base">
                {upiConfig.payeeName}
              </h4>
              <p className="text-xs text-[#667085] flex items-center justify-center space-x-1">
                <Building className="w-3.5 h-3.5 text-gray-400" />
                <span>{upiConfig.bankName}</span>
              </p>
            </div>

            {/* Official QR Code Image Container */}
            <div className="relative group p-2 bg-white rounded-2xl border-2 border-gray-200 shadow-sm">
              <img
                src={effectiveQrImage}
                alt="UPI Payment QR Code"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
              />
              <button
                type="button"
                onClick={() => setIsZoomedQr(true)}
                className="absolute inset-0 bg-black/40 text-white font-bold text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-1.5 transition-opacity rounded-xl backdrop-blur-2xs"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Zoom QR</span>
              </button>
            </div>

            <p className="text-[11px] text-[#667085] text-center max-w-xs">
              Scan with Google Pay, PhonePe, Paytm, BHIM, or any banking app.
            </p>

            {/* UPI ID copy pill */}
            <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">UPI ID:</span>
                <span className="text-xs font-mono font-bold text-[#171923] truncate block">
                  {upiConfig.upiId}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyUpiId}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form: UTR & Optional Screenshot */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#171923] font-bold block mb-1">
                Enter 12-Digit UPI Reference No. / UTR *
              </label>
              <input
                type="text"
                maxLength={12}
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 429812345678"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono text-[#171923] placeholder-gray-400 focus:outline-none focus:border-[#E31837] focus:bg-white focus:ring-1 focus:ring-[#E31837]"
                autoFocus
              />
              <span className="text-[10px] text-[#667085] mt-1 block">
                Found in your UPI payment receipt under &ldquo;UPI Ref ID&rdquo; or &ldquo;UTR&rdquo;.
              </span>
            </div>

            {/* Optional Screenshot Upload */}
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">
                Payment Screenshot (Optional, helps faster verification)
              </label>
              {receiptImage ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center space-x-2 truncate">
                    <img
                      src={receiptImage}
                      alt="Receipt Preview"
                      className="w-8 h-8 object-cover rounded-md border border-gray-200"
                    />
                    <span className="text-xs text-[#171923] truncate max-w-[200px]">
                      {receiptFileName || 'payment_receipt.jpg'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center space-x-2 p-3 rounded-xl border border-dashed border-gray-300 hover:border-gray-400 cursor-pointer text-xs text-[#667085] hover:text-[#171923] bg-gray-50/50 transition-colors">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span>Upload payment screenshot</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || timeLeft <= 0}
              className={`w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center space-x-2 transition-all shadow-md ${
                isSubmitting || timeLeft <= 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#E31837] hover:bg-[#c91430] active:scale-[0.99] cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Verifying with Box Office...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Payment & Generate Ticket</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Zoomed QR Modal */}
      {isZoomedQr && (
        <div
          onClick={() => setIsZoomedQr(false)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative p-4 bg-white rounded-3xl max-w-sm w-full text-center space-y-3 shadow-2xl">
            <img
              src={effectiveQrImage}
              alt="Zoomed UPI QR Code"
              className="w-full aspect-square object-contain rounded-2xl"
            />
            <p className="text-xs text-gray-600 font-semibold">
              Scan to Pay ₹{amount} to {upiConfig.payeeName}
            </p>
            <button
              type="button"
              onClick={() => setIsZoomedQr(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
