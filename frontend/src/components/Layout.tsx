import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Wallet, Menu, X, Building2, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/auth';
import { loanAPI } from '../services/api';
import { formatCompactCurrency, formatCurrency, timeAgo, truncateAddress } from '../utils/calculations';
import { CopyButton, Modal } from './ui';
import type { CorporateProfile, Page, SMEProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: string, param?: string) => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  tone: 'blue' | 'green' | 'red' | 'orange';
  target?: { page: string; param?: string };
}

const SEEN_KEY = 'notifications_seen_at';
const toneClass = { blue: 'bg-blue-500', green: 'bg-green-500', red: 'bg-red-500', orange: 'bg-orange-500' };

const readSeenAt = () => {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
};

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { user, profile, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [seenAt, setSeenAt] = useState(readSeenAt);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const navItems: { id: Page; label: string }[] = [
    { id: 'landing', label: 'Home' },
    ...(isAuthenticated && user?.user_type === 'CORPORATE' ? [
      { id: 'corporate' as Page, label: 'Corporate Dashboard' },
      { id: 'loan-management' as Page, label: 'Loan Management' }
    ] : []),
    ...(isAuthenticated && user?.user_type === 'SME' ? [
      { id: 'sme-status' as Page, label: 'My Applications' },
      { id: 'sme' as Page, label: 'Apply for Loan' },
      { id: 'loan-management' as Page, label: 'My Loans' }
    ] : [])
  ];

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      if (user.user_type === 'CORPORATE') {
        const res = await loanAPI.getLoanApplications({ status: 'pending', limit: '6' });
        setNotifications(res.data.applications.map((app) => ({
          id: app.application_id,
          title: 'New Loan Application',
          message: `${app.sme?.company_name || 'An SME'} requested ${formatCurrency(app.requested_amount)} (Grade ${app.risk_grade})`,
          timestamp: app.submitted_at,
          tone: 'blue' as const,
          target: { page: 'corporate', param: 'applications' }
        })));
      } else {
        const res = await loanAPI.getMyLoans();
        const items: NotificationItem[] = [];
        res.data.applications.forEach((app) => {
          if (app.application_status === 'approved' && app.reviewed_at) {
            items.push({
              id: `${app.application_id}-approved`,
              title: 'Application Approved',
              message: `${formatCurrency(app.requested_amount)} approved by ${app.reviewer?.corporation_name || 'a lender'}`,
              timestamp: app.reviewed_at,
              tone: 'green',
              target: app.loan_id ? { page: 'loan-management', param: app.loan_id } : { page: 'sme-status' }
            });
          } else if (app.application_status === 'rejected' && app.reviewed_at) {
            items.push({
              id: `${app.application_id}-rejected`,
              title: 'Application Declined',
              message: `Your ${formatCurrency(app.requested_amount)} request was declined`,
              timestamp: app.reviewed_at,
              tone: 'red',
              target: { page: 'sme-status' }
            });
          } else if (app.application_status === 'pending') {
            items.push({
              id: `${app.application_id}-pending`,
              title: 'Application Under Review',
              message: `Your ${formatCurrency(app.requested_amount)} request is being reviewed by lenders`,
              timestamp: app.submitted_at,
              tone: 'orange',
              target: { page: 'sme-status' }
            });
          }
        });
        res.data.active_loans
          .filter((loan) => loan.loan_status === 'active' && loan.next_payment_date)
          .forEach((loan) => {
            items.push({
              id: `${loan.loan_id}-due`,
              title: 'Upcoming Payment',
              message: `${formatCurrency(loan.monthly_payment)} due to ${loan.corporate?.corporation_name || 'your lender'}`,
              timestamp: new Date(Math.min(Date.now(), new Date(loan.next_payment_date as string).getTime() - 7 * 86400000)).toISOString(),
              tone: 'blue',
              target: { page: 'loan-management', param: loan.loan_id }
            });
          });
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(items.slice(0, 8));
      }
    } catch {
      // Notifications are non-critical; keep whatever we had
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    loadNotifications();
  }, [isAuthenticated, loadNotifications, currentPage]);

  // Close the notifications dropdown when clicking elsewhere
  useEffect(() => {
    if (!showNotifications) return;
    const onClick = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showNotifications]);

  const unreadCount = notifications.filter((n) => new Date(n.timestamp).getTime() > seenAt).length;

  const toggleNotifications = () => {
    const opening = !showNotifications;
    setShowNotifications(opening);
    if (opening) {
      const now = Date.now();
      setSeenAt(now);
      try {
        localStorage.setItem(SEEN_KEY, String(now));
      } catch {
        // ignore
      }
    }
  };

  const handleLogout = () => {
    onNavigate('landing');
    logout();
  };

  const corporateProfile = user?.user_type === 'CORPORATE' ? (profile as CorporateProfile | null) : null;
  const smeProfile = user?.user_type === 'SME' ? (profile as SMEProfile | null) : null;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-clip">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button onClick={() => onNavigate('landing')} className="flex items-center flex-shrink-0">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">DeFiCorp</span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-1 xl:space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
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
            <div className="flex items-center space-x-2 sm:space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <div className="relative" ref={notificationsRef}>
                    <button
                      onClick={toggleNotifications}
                      className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="p-4 text-sm text-gray-500">You're all caught up.</p>
                          ) : (
                            notifications.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setShowNotifications(false);
                                  if (item.target) onNavigate(item.target.page, item.target.param);
                                }}
                                className="w-full text-left p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${toneClass[item.tone]}`} />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                    <p className="text-sm text-gray-600">{item.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{timeAgo(item.timestamp)}</p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
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
                    <span className="hidden sm:inline text-sm font-medium">{truncateAddress(user?.wallet_address, 6, 4)}</span>
                  </button>

                  {/* User Menu */}
                  <div className="flex items-center space-x-3">
                    <div className="hidden xl:block text-right">
                      <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                      <div className="text-xs text-gray-500">
                        {corporateProfile?.corporation_name || smeProfile?.company_name || user?.user_type}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="hidden lg:block p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Logout"
                      aria-label="Logout"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center space-x-4">
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
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4">
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
      <Modal isOpen={showWalletDialog} onClose={() => setShowWalletDialog(false)} title="Wallet Details" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-green-800">Status</span>
            <span className="flex items-center gap-1 text-sm text-green-700">
              <ShieldCheck className="h-4 w-4" /> Connected
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Address</span>
              {user?.wallet_address && <CopyButton text={user.wallet_address} />}
            </div>
            <p className="text-sm text-gray-600 mt-1 font-mono break-all">{user?.wallet_address}</p>
          </div>
          {corporateProfile && (
            <>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Available in pool</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(corporateProfile.available_funds)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Deployed in loans</span>
                <span className="text-sm font-semibold text-gray-900">{formatCompactCurrency(corporateProfile.allocated_funds)}</span>
              </div>
            </>
          )}
          {smeProfile && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Credit', value: smeProfile.credit_score },
                { label: 'ESG', value: smeProfile.esg_score },
                { label: 'Trust', value: smeProfile.trust_score }
              ].map((score) => (
                <div key={score.label} className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-xs text-gray-500">{score.label} score</div>
                  <div className="text-lg font-bold text-gray-900">{score.value}</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-800">Network</span>
            <span className="text-sm text-blue-700">DeFiCorp Testnet · Chain 31337</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Layout;
