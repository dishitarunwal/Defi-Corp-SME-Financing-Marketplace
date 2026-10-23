import React, { useCallback, useEffect, useState } from 'react';
import { AuthProvider } from './components/AuthProvider';
import { ToastProvider } from './components/ToastProvider';
import { useAuth } from './context/auth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import CorporateDashboard from './pages/CorporateDashboard';
import SMEApplication from './pages/SMEApplication';
import SMEStatus from './pages/SMEStatus';
import LoanManagement from './pages/LoanManagement';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import { Modal, PageLoader } from './components/ui';
import type { Page, UserType } from './types';

const PAGES: Page[] = ['landing', 'corporate', 'sme', 'sme-status', 'loan-management'];

// Which user type may open each page (null = public)
const PAGE_ROLES: Record<Page, UserType | 'ANY' | null> = {
  landing: null,
  corporate: 'CORPORATE',
  sme: 'SME',
  'sme-status': 'SME',
  'loan-management': 'ANY'
};

const homeFor = (userType: UserType): Page => (userType === 'CORPORATE' ? 'corporate' : 'sme-status');

interface Route {
  page: Page;
  param?: string;
}

const parseHash = (): Route => {
  const [page, param] = window.location.hash.replace(/^#\/?/, '').split('/');
  if (PAGES.includes(page as Page)) {
    return { page: page as Page, param: param ? decodeURIComponent(param) : undefined };
  }
  return { page: 'landing' };
};

const toHash = ({ page, param }: Route) =>
  page === 'landing' ? '#/' : `#/${page}${param ? `/${encodeURIComponent(param)}` : ''}`;

const AppContent: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const [route, setRoute] = useState<Route>(parseHash);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [signupType, setSignupType] = useState<UserType | null>(null);
  const [pendingRoute, setPendingRoute] = useState<Route | null>(null);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const go = useCallback((next: Route) => {
    const hash = toHash(next);
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
    setRoute(next);
    window.scrollTo({ top: 0 });
  }, []);

  const handleNavigate = useCallback((target: string, param?: string) => {
    if (target === 'login' || target === 'signup') {
      setSignupType(null);
      setAuthMode(target);
      return;
    }

    const page = (PAGES.includes(target as Page) ? target : 'landing') as Page;
    const role = PAGE_ROLES[page];

    if (role && !isAuthenticated) {
      // Remember where the user was heading and ask them to sign up / sign in first
      setPendingRoute({ page, param });
      setSignupType(role === 'ANY' ? null : role);
      setAuthMode(role === 'ANY' ? 'login' : 'signup');
      return;
    }

    if (role && role !== 'ANY' && user && user.user_type !== role) {
      go({ page: homeFor(user.user_type) });
      return;
    }

    go({ page, param });
  }, [isAuthenticated, user, go]);

  // Guard direct URL access (refresh, shared links, back button)
  useEffect(() => {
    if (loading) return;
    const role = PAGE_ROLES[route.page];
    if (!role) return;

    if (!isAuthenticated) {
      setPendingRoute(route);
      setAuthMode('login');
      go({ page: 'landing' });
    } else if (role !== 'ANY' && user && user.user_type !== role) {
      go({ page: homeFor(user.user_type) });
    }
  }, [route, loading, isAuthenticated, user, go]);

  const handleAuthSuccess = (userType: UserType) => {
    setAuthMode(null);
    const pendingRole = pendingRoute ? PAGE_ROLES[pendingRoute.page] : null;
    if (pendingRoute && (pendingRole === 'ANY' || pendingRole === userType)) {
      go(pendingRoute);
    } else {
      go({ page: homeFor(userType) });
    }
    setPendingRoute(null);
  };

  const closeAuthModal = () => {
    setAuthMode(null);
    setPendingRoute(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader label="Loading DeFiCorp..." />
      </div>
    );
  }

  const role = PAGE_ROLES[route.page];
  const canView = !role || (isAuthenticated && (role === 'ANY' || user?.user_type === role));

  const renderCurrentPage = () => {
    if (!canView) return <Landing onNavigate={handleNavigate} />;

    switch (route.page) {
      case 'corporate':
        return <CorporateDashboard key={route.param || 'overview'} onNavigate={handleNavigate} initialTab={route.param} />;
      case 'sme':
        return <SMEApplication onNavigate={handleNavigate} />;
      case 'sme-status':
        return <SMEStatus onNavigate={handleNavigate} />;
      case 'loan-management':
        return <LoanManagement onNavigate={handleNavigate} loanId={route.param} />;
      default:
        return <Landing onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      <Layout currentPage={canView ? route.page : 'landing'} onNavigate={handleNavigate}>
        {renderCurrentPage()}
      </Layout>

      <Modal isOpen={authMode !== null} onClose={closeAuthModal} maxWidth="max-w-3xl">
        {authMode === 'login' ? (
          <LoginForm onSwitchMode={setAuthMode} onSuccess={handleAuthSuccess} />
        ) : (
          <SignupForm
            key={signupType || 'any'}
            onSwitchMode={setAuthMode}
            onSuccess={handleAuthSuccess}
            defaultUserType={signupType}
          />
        )}
      </Modal>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
