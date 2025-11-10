import React from 'react';
import { Bell, Wallet, Menu, X, Building2, LogOut } from 'lucide-react';
import { useAuth } from './AuthWrapper';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  showHeader?: boolean;
  isAuthenticated?: boolean;
  user?: any;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentPage, 
  onNavigate, 
  showHeader = true,
  isAuthenticated = false,
  user = null
}) => {
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showWalletDialog, setShowWalletDialog] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const navItems = [
    { id: 'landing', label: 'Home' },
    ...(isAuthenticated && user?.user_type === 'CORPORATE' ? [
      { id: 'corporate', label: 'Corporate Dashboard' },
      { id: 'loan-management', label: 'Loan Management' }
    ] : []),
    ...(isAuthenticated && user?.user_type === 'SME' ? [
      { id: 'sme', label: 'My Applications' },
      { id: 'loan-management', label: 'My Loans' }
    ] : []),
  ];

  const handleLogout = () => {
    logout();
    onNavigate('landing');
  };

  if (!showHeader) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">DeFiCorp</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === item.id
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        2
                      </span>
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          <div className="p-3 border-b border-gray-100 hover:bg-gray-50">
                            <div className="flex items-start space-x-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {user?.user_type === 'CORPORATE' ? 'Payment Received' : 'Application Update'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {user?.user_type === 'CORPORATE' ? 'TechFlow Solutions - ₹7,125' : 'Your loan application is under review'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 hover:bg-gray-50">
                            <div className="flex items-start space-x-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {user?.user_type === 'CORPORATE' ? 'New Application' : 'Welcome to DeFiCorp'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {user?.user_type === 'CORPORATE' ? 'Digital Marketing Pro - ₹50,000' : 'Your account has been verified'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Wallet */}
                  <button
                    onClick={() => setShowWalletDialog(true)}
                    className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm font-medium">Connected</span>
                  </button>

                  {/* User Menu */}
                  <div className="flex items-center space-x-3">
                    <div className="hidden sm:block text-right">
                      <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                      <div className="text-xs text-gray-500">{user?.user_type}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => onNavigate('login')}
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => onNavigate('signup')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                      currentPage === item.id
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                {!isAuthenticated && (
                  <>
                    <button
                      onClick={() => {
                        onNavigate('login');
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('signup');
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Sign Up
                    </button>
                  </>
                )}
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Wallet Dialog */}
      {showWalletDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Wallet Details</h3>
              <button
                onClick={() => setShowWalletDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Balance</span>
                <span className="text-sm text-gray-600">₹2,80,00,000</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Address</span>
                <p className="text-sm text-gray-600 mt-1 font-mono">
                  {user?.user_id || '0x742d35Cc6634C0532925a3b8D84...'}
                </p>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Send
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Receive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;