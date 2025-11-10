import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthWrapper';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import CorporateDashboard from './pages/CorporateDashboard';
import SMEApplication from './pages/SMEApplication';
import LoanManagement from './pages/LoanManagement';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';

// Modal Component
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ 
  isOpen, 
  onClose, 
  children 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {/* Title will be handled by the form components */}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Main App Content Component
const AppContent: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Handle navigation
  const handleNavigate = (page: string) => {
    if (page === 'login') {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    
    if (page === 'signup') {
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }

    setCurrentPage(page);
    setShowAuthModal(false);
  };

  // Handle auth modal navigation
  const handleAuthNavigate = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
  };

  // Close auth modal
  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DeFiCorp...</p>
        </div>
      </div>
    );
  }

  // Determine which page to show
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing onNavigate={handleNavigate} />;
      case 'corporate':
        return <CorporateDashboard onNavigate={handleNavigate} />;
      case 'sme':
        return <SMEApplication onNavigate={handleNavigate} />;
      case 'loan-management':
        return <LoanManagement onNavigate={handleNavigate} />;
      default:
        return <Landing onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      <Layout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        showHeader={true}
        isAuthenticated={isAuthenticated}
        user={user}
      >
        {renderCurrentPage()}
      </Layout>

      {/* Authentication Modal */}
      <Modal isOpen={showAuthModal} onClose={closeAuthModal}>
        {authMode === 'login' ? (
          <LoginForm 
            onNavigate={handleAuthNavigate}
            onClose={closeAuthModal}
          />
        ) : (
          <SignupForm 
            onNavigate={handleAuthNavigate}
            onClose={closeAuthModal}
          />
        )}
      </Modal>
    </>
  );
};

// Main App Component with Auth Provider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
};

export default App;