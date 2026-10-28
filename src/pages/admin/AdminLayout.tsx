import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Film,
  Image,
  Tv,
  Clock,
  Ticket,
  QrCode,
  Users,
  UserCheck,
  Tag,
  Megaphone,
  FileText,
  BarChart3,
  Settings,
  Activity,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  AlertCircle,
} from "lucide-react";
import { storageService } from "../../services/storage";

interface AdminLayoutProps {
  currentAdminTab: string;
  onSelectTab: (tab: string) => void;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentAdminTab,
  onSelectTab,
  onNavigateHome,
  children,
}) => {
  const { adminUser, logoutAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState<number>(0);

  const updateCounts = () => {
    const pendingTickets = storageService.getPendingUpiBookings().length;
    const pendingVideos = storageService.getVideoOrders().filter((o) => o.paymentStatus === 'PENDING' || o.paymentStatus === 'PENDING_VERIFICATION').length;
    setPendingPaymentsCount(pendingTickets + pendingVideos);
  };

  useEffect(() => {
    updateCounts();
    const handleUpdate = () => updateCounts();
    window.addEventListener("lxm_storage_update", handleUpdate);
    return () => window.removeEventListener("lxm_storage_update", handleUpdate);
  }, []);

  const menuItems = [
    { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "content-manager", label: "OTT & Cinema Content", icon: Film },
    { id: "payment-requests", label: "Video Payment Requests", icon: QrCode, badge: storageService.getVideoOrders().filter((o) => o.paymentStatus === 'PENDING' || o.paymentStatus === 'PENDING_VERIFICATION').length || undefined, badgeColor: "bg-[#E31837] text-white font-extrabold" },
    { id: "video-provider", label: "Video Provider & DRM", icon: Tv },
    { id: "movies", label: "Theatrical Movie Catalog", icon: Film },
    { id: "banners", label: "Hero Banners", icon: Image },
    { id: "screens", label: "Screens & Layouts", icon: Tv },
    { id: "shows", label: "Showtimes & Clashes", icon: Clock },
    { id: "bookings", label: "Ticket Bookings", icon: Ticket },
    {
      id: "payments",
      label: "Ticket UPI Queue",
      icon: QrCode,
      badge: storageService.getPendingUpiBookings().length > 0 ? storageService.getPendingUpiBookings().length : undefined,
      badgeColor: "bg-amber-500 text-black font-extrabold",
    },
    { id: "customers", label: "Customer Directory", icon: Users },
    { id: "staff", label: "Staff & Permissions", icon: UserCheck },
    { id: "offers", label: "Offers & Coupons", icon: Tag },
    { id: "content", label: "Announcements Ticker", icon: Megaphone },
    { id: "pages", label: "Website Pages & SEO", icon: FileText },
    { id: "reports", label: "Sales Reports & Analytics", icon: BarChart3 },
    { id: "validator", label: "Turnstile Gate Scanner", icon: ShieldCheck },
    { id: "settings", label: "Cinema & UPI Settings", icon: Settings },
    { id: "health", label: "Database Health & Backup", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-[#171923] flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-[#E5E7EB] p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#E31837] flex items-center justify-center font-bold text-white shadow-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-[#171923] font-cinema">
              LAXMI <span className="text-[#E31837]">CONTROL</span>
            </span>
            <p className="text-[10px] text-[#667085]">Hazaribagh, Jharkhand</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-[#667085] hover:text-[#171923] rounded-lg bg-gray-100 border border-[#E5E7EB]"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-[#E5E7EB] flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Logo brand */}
          <div className="flex items-center space-x-3 pb-3 border-b border-[#E5E7EB]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E31837] to-red-800 flex items-center justify-center shadow-lg shadow-red-600/30 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-base tracking-tight text-[#171923] font-cinema truncate">
                LAXMI <span className="text-[#E31837]">CINEPLEX</span>
              </h2>
              <p className="text-[10px] text-[#667085]">Complete Control Center</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#E31837] text-white shadow-md shadow-red-600/20 font-bold"
                      : "text-[#667085] hover:text-[#171923] hover:bg-gray-100/80"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#667085]"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions Footer */}
        <div className="p-3.5 border-t border-[#E5E7EB] bg-gray-50 space-y-2.5 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-[#E31837] text-xs font-bold shrink-0">
              RB
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#171923] truncate">rajanbhogta</div>
              <div className="text-[10px] text-[#E31837] font-semibold truncate">Rajan Bhogta (Super Admin)</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onNavigateHome}
              className="py-1.5 px-2 bg-white hover:bg-gray-100 text-[#171923] text-[11px] font-semibold rounded-lg flex items-center justify-center space-x-1 border border-[#E5E7EB] shadow-xs"
              title="Return to customer portal"
            >
              <ExternalLink className="w-3 h-3 text-[#667085]" />
              <span>Customer</span>
            </button>
            <button
              onClick={logoutAdmin}
              className="py-1.5 px-2 bg-red-50 hover:bg-red-100 text-[#E31837] text-[11px] font-semibold rounded-lg flex items-center justify-center space-x-1 border border-red-200 shadow-xs"
              title="Sign out administrator"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Desktop Top Sub-header */}
        <div className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] sticky top-0 z-30">
          <div className="flex items-center space-x-2.5 text-xs text-[#667085]">
            <span>Admin Control Center</span>
            <span>/</span>
            <span className="text-[#171923] font-semibold capitalize">
              {currentAdminTab.replace("-", " ")}
            </span>
            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>CENTRAL DB SYNCED</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {pendingPaymentsCount > 0 && (
              <button
                onClick={() => onSelectTab("payments")}
                className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold flex items-center gap-1.5 hover:bg-amber-100 transition shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{pendingPaymentsCount} UPI Payment(s) Awaiting Review</span>
              </button>
            )}
            <button
              onClick={onNavigateHome}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 text-[#171923] text-xs font-semibold rounded-xl border border-[#E5E7EB] shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#E31837]" />
              <span>View Customer Website</span>
            </button>
            <div className="text-xs text-slate-400 font-mono">
              Asia/Kolkata ({new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })})
            </div>
          </div>
        </div>

        {/* Content View */}
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};
