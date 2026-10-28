import React from 'react';
import { ArrowLeft, ShieldCheck, HelpCircle, FileText, RefreshCw } from 'lucide-react';

interface StaticPageProps {
  type: 'CANCELLATION' | 'TERMS' | 'PRIVACY' | 'HELP';
  onNavigate: (route: string) => void;
}

export const StaticPages: React.FC<StaticPageProps> = ({ type, onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8 min-h-screen bg-[#F6F7FB]">
      <button
        onClick={() => onNavigate('/')}
        className="flex items-center space-x-1.5 text-xs font-bold text-[#667085] hover:text-[#171923] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>

      {type === 'CANCELLATION' && (
        <div className="p-8 rounded-3xl bg-white border border-[#E5E7EB] space-y-6 shadow-xs text-[#171923]">
          <div className="flex items-center space-x-3 text-[#E31837]">
            <RefreshCw className="w-6 h-6" />
            <h1 className="text-2xl sm:text-3xl font-black text-[#171923] font-cinema">
              Cancellation & Refund Policy
            </h1>
          </div>
          <p className="text-xs text-[#667085]">
            Last Updated: October 2026 • Laxmi Cineplex Hazaribagh
          </p>

          <div className="space-y-4 text-xs sm:text-sm text-[#667085] leading-relaxed border-t border-gray-150 pt-6">
            <h3 className="text-[#171923] font-bold text-base">1. Ticket Cancellation Window</h3>
            <p>
              Patrons who booked tickets online through the official Laxmi Cineplex portal can cancel their confirmed booking up to <strong className="text-[#171923]">2 hours prior to the scheduled showtime</strong>. Once the 2-hour cutoff is passed, tickets cannot be cancelled or transferred.
            </p>

            <h3 className="text-[#171923] font-bold text-base">2. Refund Computation</h3>
            <p>
              Upon successful cancellation within the permitted window, <strong className="text-[#171923]">100% of the base ticket price</strong> will be refunded. In accordance with Indian cinema booking standards, third-party gateway convenience fees and applicable GST are non-refundable.
            </p>

            <h3 className="text-[#171923] font-bold text-base">3. Refund Processing Timelines</h3>
            <p>
              Refunds are initiated immediately by our automated payment reconciliation engine. The funds reflect back in your original payment source (UPI account, credit/debit card, or bank account) within <strong className="text-[#171923]">3 to 5 business days</strong> depending on your issuing bank.
            </p>

            <h3 className="text-[#171923] font-bold text-base">4. Show Cancellations by Cinema Management</h3>
            <p>
              In the rare event of technical failure, power outage, or government directive resulting in show cancellation, patrons receive an automatic <strong className="text-[#171923]">100% full refund including convenience fees</strong>.
            </p>
          </div>
        </div>
      )}

      {type === 'TERMS' && (
        <div className="p-8 rounded-3xl bg-white border border-[#E5E7EB] space-y-6 shadow-xs text-[#171923]">
          <div className="flex items-center space-x-3 text-[#E31837]">
            <FileText className="w-6 h-6" />
            <h1 className="text-2xl sm:text-3xl font-black text-[#171923] font-cinema">
              Terms & Conditions
            </h1>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-[#667085] leading-relaxed border-t border-gray-150 pt-6">
            <h3 className="text-[#171923] font-bold text-base">1. Admission & Age Ratings</h3>
            <p>
              Entry is strictly subject to the central film certification (CBFC) guidelines. For films rated &lsquo;A&rsquo; (Adults Only), patrons under 18 years of age are not permitted under any circumstances, even if accompanied by a guardian. Valid government photo ID (Aadhaar, Voter ID, Driving License) may be requested at the gate.
            </p>

            <h3 className="text-[#171923] font-bold text-base">2. QR E-Ticket Validation</h3>
            <p>
              Each confirmed booking generates a cryptographically unique QR token. Tickets are single-use. Once scanned and admitted at the turnstile gate, duplicate attempts with the same token will be blocked by the security system.
            </p>

            <h3 className="text-[#171923] font-bold text-base">3. Food & Beverages</h3>
            <p>
              Outside food and beverages are strictly prohibited inside the auditorium premises. Freshly prepared food, popcorn, snacks, and beverages are available at the Laxmi Cineplex food counter.
            </p>
          </div>
        </div>
      )}

      {type === 'PRIVACY' && (
        <div className="p-8 rounded-3xl bg-white border border-[#E5E7EB] space-y-6 shadow-xs text-[#171923]">
          <div className="flex items-center space-x-3 text-[#E31837]">
            <ShieldCheck className="w-6 h-6" />
            <h1 className="text-2xl sm:text-3xl font-black text-[#171923] font-cinema">
              Privacy Policy
            </h1>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-[#667085] leading-relaxed border-t border-gray-150 pt-6">
            <h3 className="text-[#171923] font-bold text-base">1. Customer Information Collected</h3>
            <p>
              We only collect patron name, mobile number, and email address necessary to deliver your e-ticket QR code, show timing alerts, and booking invoices.
            </p>

            <h3 className="text-[#171923] font-bold text-base">2. Payment Security</h3>
            <p>
              Laxmi Cineplex never stores raw credit/debit card numbers or bank credentials on our servers. All transactions are securely processed through RBI-approved, PCI-DSS compliant gateways using 256-bit SSL encryption.
            </p>
          </div>
        </div>
      )}

      {type === 'HELP' && (
        <div className="p-8 rounded-3xl bg-white border border-[#E5E7EB] space-y-6 shadow-xs text-[#171923]">
          <div className="flex items-center space-x-3 text-[#E31837]">
            <HelpCircle className="w-6 h-6" />
            <h1 className="text-2xl sm:text-3xl font-black text-[#171923] font-cinema">
              Frequently Asked Questions & Help
            </h1>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-[#667085] leading-relaxed border-t border-gray-150 pt-6">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
              <h4 className="text-[#171923] font-bold">Do I need to print my ticket?</h4>
              <p className="text-xs text-[#667085]">
                No, a physical printout is not required. You can simply present the dynamic QR code on your smartphone at the cinema turnstile.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
              <h4 className="text-[#171923] font-bold">What is the child ticket policy?</h4>
              <p className="text-xs text-[#667085]">
                Children aged 3 years and above require a separate ticket and designated seat.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
              <h4 className="text-[#171923] font-bold">Where is parking available?</h4>
              <p className="text-xs text-[#667085]">
                Dedicated multiplex parking for 2-wheelers and 4-wheelers is located right behind the main complex on Cinema Road.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
              <h4 className="text-[#171923] font-bold">Need Box Office Assistance?</h4>
              <p className="text-xs text-[#667085]">
                Reach our customer helpline at <strong className="text-[#171923]">+91 6546 223456</strong> or email <strong className="text-[#171923]">support@laxmicineplex.in</strong> between 09:30 AM and 11:30 PM.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
