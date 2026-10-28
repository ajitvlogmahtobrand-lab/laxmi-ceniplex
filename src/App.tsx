import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AuthModal } from './components/common/AuthModal';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { MoviesPage } from './pages/customer/MoviesPage';
import { MovieDetailPage } from './pages/customer/MovieDetailPage';
import { SeatSelectionPage } from './pages/customer/SeatSelectionPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { BookingConfirmationPage } from './pages/customer/BookingConfirmationPage';
import { MyBookingsPage } from './pages/customer/MyBookingsPage';
import { CinemaInfoPage } from './pages/customer/CinemaInfoPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { StaticPages } from './pages/customer/StaticPages';
import { OttPage } from './pages/customer/OttPage';
import { MyLibraryPage } from './pages/customer/MyLibraryPage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminForgotPassword } from './pages/admin/AdminForgotPassword';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminMovies } from './pages/admin/AdminMovies';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminStaff } from './pages/admin/AdminStaff';
import { AdminPages } from './pages/admin/AdminPages';
import { AdminHealth } from './pages/admin/AdminHealth';
import { AdminScreens } from './pages/admin/AdminScreens';
import { AdminShows } from './pages/admin/AdminShows';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminValidator } from './pages/admin/AdminValidator';
import { AdminOffers } from './pages/admin/AdminOffers';
import { AdminContent } from './pages/admin/AdminContent';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminContentManager } from './pages/admin/AdminContentManager';
import { AdminPaymentRequests } from './pages/admin/AdminPaymentRequests';
import { AdminVideoProvider } from './pages/admin/AdminVideoProvider';

function AppContent() {
  const { adminUser } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [routeParam, setRouteParam] = useState<string | undefined>(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<string>(() => {
    const p = typeof window !== 'undefined' ? window.location.pathname : '';
    if (p.startsWith('/admin/') && p !== '/admin/login' && p !== '/admin/forgot-password') {
      return p.replace('/admin/', '');
    }
    return 'dashboard';
  });

  // Sync route on popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      handleNavigate(path, undefined, false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string, param?: string, pushState = true) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (path === '/login') {
      setIsAuthModalOpen(true);
      return;
    }

    if (path.startsWith('/movies/') && path !== '/movies') {
      const id = path.replace('/movies/', '');
      setCurrentRoute('/movies/:id');
      setRouteParam(id);
      if (pushState) window.history.pushState({}, '', path);
      return;
    }

    if (path.startsWith('/shows/') && path.endsWith('/seats')) {
      const id = path.replace('/shows/', '').replace('/seats', '');
      setCurrentRoute('/shows/:id/seats');
      setRouteParam(id);
      if (pushState) window.history.pushState({}, '', path);
      return;
    }

    if (path.startsWith('/booking/') && path !== '/booking') {
      const id = path.replace('/booking/confirmation/', '').replace('/booking/', '');
      setCurrentRoute('/booking/:id');
      setRouteParam(id);
      if (pushState) window.history.pushState({}, '', path);
      return;
    }

    if (path === '/admin/forgot-password') {
      setCurrentRoute('/admin/forgot-password');
      if (pushState) window.history.pushState({}, '', path);
      return;
    }

    if (path.startsWith('/admin')) {
      if (path === '/admin' || path === '/admin/dashboard') {
        setCurrentRoute('/admin/dashboard');
        setAdminTab('dashboard');
      } else if (path === '/admin/login') {
        setCurrentRoute('/admin/login');
      } else {
        const sub = path.replace('/admin/', '');
        setCurrentRoute('/admin/dashboard');
        setAdminTab(sub);
      }
      if (pushState) window.history.pushState({}, '', path);
      return;
    }

    setCurrentRoute(path);
    setRouteParam(param);
    if (pushState) window.history.pushState({}, '', path);
  };

  // Render Forgot Password Flow
  if (currentRoute === '/admin/forgot-password') {
    return (
      <AdminForgotPassword
        onNavigateLogin={() => handleNavigate('/admin/login')}
      />
    );
  }

  // Render Admin Flow
  if (currentRoute === '/admin/login') {
    return (
      <AdminLogin
        onSuccess={() => {
          handleNavigate('/admin/dashboard');
        }}
        onNavigateHome={() => handleNavigate('/')}
        onNavigateForgotPassword={() => handleNavigate('/admin/forgot-password')}
      />
    );
  }

  if (currentRoute.startsWith('/admin')) {
    if (!adminUser) {
      return (
        <AdminLogin
          onSuccess={() => {
            handleNavigate('/admin/dashboard');
          }}
          onNavigateHome={() => handleNavigate('/')}
          onNavigateForgotPassword={() => handleNavigate('/admin/forgot-password')}
        />
      );
    }

    return (
      <AdminLayout
        currentAdminTab={adminTab}
        onSelectTab={(tab) => {
          setAdminTab(tab);
          window.history.pushState({}, '', `/admin/${tab}`);
        }}
        onNavigateHome={() => handleNavigate('/')}
      >
        {adminTab === 'dashboard' && (
          <AdminDashboard
            onSelectTab={(tab) => {
              setAdminTab(tab);
              window.history.pushState({}, '', `/admin/${tab}`);
            }}
          />
        )}
        {adminTab === 'content-manager' && <AdminContentManager />}
        {adminTab === 'payment-requests' && <AdminPaymentRequests />}
        {adminTab === 'video-provider' && <AdminVideoProvider />}
        {adminTab === 'movies' && <AdminMovies />}
        {adminTab === 'banners' && <AdminBanners />}
        {adminTab === 'screens' && <AdminScreens />}
        {adminTab === 'shows' && <AdminShows />}
        {adminTab === 'bookings' && <AdminBookings />}
        {adminTab === 'payments' && <AdminPayments />}
        {adminTab === 'customers' && <AdminCustomers />}
        {adminTab === 'staff' && <AdminStaff />}
        {adminTab === 'validator' && <AdminValidator />}
        {adminTab === 'offers' && <AdminOffers />}
        {adminTab === 'content' && <AdminContent />}
        {adminTab === 'pages' && <AdminPages />}
        {adminTab === 'reports' && <AdminReports />}
        {adminTab === 'settings' && <AdminSettings />}
        {adminTab === 'health' && <AdminHealth />}
      </AdminLayout>
    );
  }

  // Render Customer Flow
  return (
    <div className="flex flex-col min-h-screen bg-[#F6F7FB] text-[#171923] selection:bg-[#E31837] selection:text-white">
      <Navbar onNavigate={handleNavigate} currentRoute={currentRoute} />

      <main className="flex-1">
        {currentRoute === '/' && <HomePage onNavigate={handleNavigate} />}

        {currentRoute === '/ott' && <OttPage onNavigate={handleNavigate} />}

        {currentRoute === '/my-library' && <MyLibraryPage onNavigate={handleNavigate} />}

        {currentRoute === '/movies' && (
          <MoviesPage onNavigate={handleNavigate} defaultStatus="NOW_SHOWING" />
        )}

        {currentRoute === '/coming-soon' && (
          <MoviesPage onNavigate={handleNavigate} defaultStatus="COMING_SOON" />
        )}

        {currentRoute === '/movies/:id' && (
          <MovieDetailPage movieId={routeParam || ''} onNavigate={handleNavigate} />
        )}

        {currentRoute === '/shows/:id/seats' && (
          <SeatSelectionPage showId={routeParam || ''} onNavigate={handleNavigate} />
        )}

        {currentRoute === '/checkout' && <CheckoutPage onNavigate={handleNavigate} />}

        {currentRoute === '/booking/:id' && (
          <BookingConfirmationPage
            bookingId={routeParam || ''}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === '/my-bookings' && <MyBookingsPage onNavigate={handleNavigate} />}

        {currentRoute === '/cinema' && <CinemaInfoPage onNavigate={handleNavigate} />}

        {currentRoute === '/profile' && <ProfilePage onNavigate={handleNavigate} />}

        {currentRoute === '/cancellation-policy' && (
          <StaticPages type="CANCELLATION" onNavigate={handleNavigate} />
        )}

        {currentRoute === '/terms' && <StaticPages type="TERMS" onNavigate={handleNavigate} />}

        {currentRoute === '/privacy' && <StaticPages type="PRIVACY" onNavigate={handleNavigate} />}

        {currentRoute === '/help' && <StaticPages type="HELP" onNavigate={handleNavigate} />}
      </main>

      <Footer onNavigate={handleNavigate} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => handleNavigate('/profile')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <AppContent />
      </BookingProvider>
    </AuthProvider>
  );
}
