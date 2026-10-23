import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  Activity,
  Shield,
  Crown,
  Award,
  Star,
  Medal,
  Eye,
  Leaf,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Plus,
  RefreshCw
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { loanAPI } from '../services/api';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import {
  calculateMonthlyPayment,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatPercentage,
  getRiskColor,
  loanProgress,
  timeAgo
} from '../utils/calculations';
import {
  EmptyState, ErrorState, FieldError, Modal, PageLoader, ProgressBar, RiskBadge, Spinner, StatCard, StatusBadge
} from '../components/ui';
import type { LeaderboardEntry, LoanApplication, Portfolio } from '../types';

interface CorporateDashboardProps {
  onNavigate: (page: string, param?: string) => void;
  initialTab?: string;
}

type Tab = 'overview' | 'applications' | 'loans' | 'analytics' | 'leaderboard';
type AppFilter = 'pending' | 'approved' | 'rejected' | 'all';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'applications', label: 'Applications', icon: FileText },
  { id: 'loans', label: 'Loan Portfolio', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'leaderboard', label: 'Leaderboard', icon: Crown }
];

const REJECTION_REASONS = [
  'Insufficient collateral coverage for the requested amount.',
  'Requested amount is too high relative to annual revenue.',
  'Business operating history is too short for this loan size.'
];

const badgeStyles: Record<LeaderboardEntry['badge'], { icon: React.ElementType; className: string }> = {
  Platinum: { icon: Crown, className: 'text-purple-600 bg-purple-100' },
  Gold: { icon: Award, className: 'text-yellow-700 bg-yellow-100' },
  Silver: { icon: Star, className: 'text-gray-600 bg-gray-100' },
  Bronze: { icon: Medal, className: 'text-orange-700 bg-orange-100' }
};

const currencyTick = (value: number) => formatCompactCurrency(value);

const CorporateDashboard: React.FC<CorporateDashboardProps> = ({ onNavigate, initialTab }) => {
  const { refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>(
    TABS.some((t) => t.id === initialTab) ? (initialTab as Tab) : 'overview'
  );

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [appFilter, setAppFilter] = useState<AppFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  const [approving, setApproving] = useState<LoanApplication | null>(null);
  const [approveTerms, setApproveTerms] = useState({ amount: '', rate: '', term: '' });
  const [rejecting, setRejecting] = useState<LoanApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  const loadPortfolio = useCallback(async () => {
    setError(null);
    try {
      const [portfolioRes, leaderboardRes] = await Promise.all([
        loanAPI.getPortfolio(),
        loanAPI.getLeaderboard()
      ]);
      setPortfolio(portfolioRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setAppsLoading(true);
    try {
      const res = await loanAPI.getLoanApplications(appFilter === 'all' ? { limit: '50' } : { status: appFilter, limit: '50' });
      setApplications(res.data.applications);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load applications', 'error');
    } finally {
      setAppsLoading(false);
    }
  }, [appFilter, showToast]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const refreshAll = async () => {
    await Promise.all([loadPortfolio(), loadApplications(), refreshProfile()]);
  };

  const openApprove = (app: LoanApplication) => {
    setActionError(null);
    setApproveTerms({
      amount: String(app.requested_amount),
      rate: String(app.proposed_interest_rate),
      term: String(app.loan_term_months)
    });
    setApproving(app);
  };

  const confirmApprove = async () => {
    if (!approving) return;
    const amount = Number(approveTerms.amount);
    const rate = Number(approveTerms.rate);
    const term = Number(approveTerms.term);

    if (!(amount >= 5000 && amount <= 50000000)) return setActionError('Amount must be between ₹5,000 and ₹5,00,00,000');
    if (!(rate >= 5 && rate <= 25)) return setActionError('Interest rate must be between 5% and 25%');
    if (!(Number.isInteger(term) && term >= 6 && term <= 60)) return setActionError('Term must be between 6 and 60 months');
    if (portfolio && amount > portfolio.stats.available_funds) return setActionError('Not enough available funds - add funds to your pool first');

    setSubmitting(true);
    setActionError(null);
    try {
      const res = await loanAPI.approveLoan(approving.application_id, {
        final_amount: amount,
        final_interest_rate: rate,
        final_term_months: term
      });
      showToast(`Loan approved - ${formatCurrency(amount)} disbursed to ${approving.sme?.company_name || 'the borrower'}`);
      setApproving(null);
      await refreshAll();
      if (res.data.loan_details?.loan_id) {
        setActiveTab('loans');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    if (rejectReason.trim().length < 10) {
      setActionError('Please give a reason of at least 10 characters');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await loanAPI.rejectLoan(rejecting.application_id, { rejection_reason: rejectReason.trim() });
      showToast('Application rejected', 'info');
      setRejecting(null);
      setRejectReason('');
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeposit = async () => {
    const amount = Number(depositAmount);
    if (!(amount >= 1000)) {
      setActionError('Minimum deposit is ₹1,000');
      return;
    }
    setDepositing(true);
    setActionError(null);
    try {
      await loanAPI.depositFunds(amount);
      showToast(`${formatCurrency(amount)} added to your lending pool`);
      setShowDepositModal(false);
      setDepositAmount('');
      await Promise.all([loadPortfolio(), refreshProfile()]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  };

  const approvePreview = useMemo(() => {
    const amount = Number(approveTerms.amount) || 0;
    const rate = Number(approveTerms.rate) || 0;
    const term = Number(approveTerms.term) || 0;
    const monthly = calculateMonthlyPayment(amount, rate, term);
    return { monthly, interest: monthly * term - amount };
  }, [approveTerms]);

  if (loading) return <PageLoader label="Loading your portfolio..." />;
  if (error || !portfolio) return <ErrorState message={error || 'Portfolio unavailable'} onRetry={loadPortfolio} />;

  const { stats, corporate } = portfolio;
  const riskData = portfolio.risk_distribution.filter((r) => r.count > 0);
  const gradeCounts = portfolio.risk_distribution.filter((r) => r.count > 0);
  const utilisation = stats.total_treasury_funds ? (stats.allocated_funds / stats.total_treasury_funds) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Corporate Dashboard</h1>
            <p className="text-gray-600 mt-1">{corporate.corporation_name} · Manage your treasury portfolio and track performance</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshAll}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white border border-transparent hover:border-gray-200"
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                setActionError(null);
                setShowDepositModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Add Funds
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <nav className="-mb-px flex space-x-6 sm:space-x-8 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'applications' && stats.pending_applications > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">{stats.pending_applications}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Available Funds" value={formatCompactCurrency(stats.available_funds)} icon={Wallet} iconClassName="bg-blue-100 text-blue-600">
                <button
                  onClick={() => {
                    setActionError(null);
                    setShowDepositModal(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Add Funds →
                </button>
              </StatCard>

              <StatCard label="Capital Deployed" value={formatCompactCurrency(stats.allocated_funds)} icon={TrendingUp} iconClassName="bg-green-100 text-green-600">
                <div className="flex items-center gap-2">
                  <ProgressBar value={utilisation} barClassName="bg-green-600" className="h-2 max-w-[8rem]" />
                  <span className="text-sm text-green-600">{utilisation.toFixed(0)}% utilised</span>
                </div>
              </StatCard>

              <StatCard label="Active Loans" value={stats.active_loans} icon={Shield} iconClassName="bg-purple-100 text-purple-600">
                <div className="flex items-center gap-3 text-sm">
                  {gradeCounts.length === 0 ? (
                    <span className="text-gray-500">No loans yet</span>
                  ) : gradeCounts.map((g) => (
                    <span key={g.grade} style={{ color: getRiskColor(g.grade) }}>{g.grade}: {g.count}</span>
                  ))}
                </div>
              </StatCard>

              <StatCard label="Portfolio Yield" value={formatPercentage(stats.portfolio_yield)} icon={Activity} iconClassName="bg-orange-100 text-orange-600">
                <div className="flex items-center text-sm text-green-600">
                  <Leaf className="h-4 w-4 mr-1" />
                  ESG Score: {stats.average_esg || '—'}
                </div>
              </StatCard>
            </div>

            {stats.pending_applications > 0 && (
              <button
                onClick={() => setActiveTab('applications')}
                className="w-full flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl p-4 text-left hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-900">
                    {stats.pending_applications} loan application{stats.pending_applications === 1 ? '' : 's'} waiting for review
                  </span>
                </div>
                <span className="text-sm font-medium text-orange-700">Review now →</span>
              </button>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Disbursements &amp; Repayments</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={portfolio.monthly_activity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={currencyTick} width={70} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="disbursed" name="Disbursed" fill="#1E40AF" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="repaid" name="Repaid" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
                {riskData.length === 0 ? (
                  <EmptyState title="No loans yet" description="Approve applications to see how your portfolio is spread across risk grades." />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="grade"
                        label={(entry) => `${entry.value}%`}
                      >
                        {riskData.map((entry) => (
                          <Cell key={entry.grade} fill={getRiskColor(entry.grade)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}%`, `Grade ${name}`]} />
                      <Legend formatter={(value) => `Grade ${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Loan Applications</h3>
                <p className="text-gray-600">Review SME applications and fund the ones that fit your risk appetite</p>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg self-start">
                {(['pending', 'approved', 'rejected', 'all'] as AppFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setAppFilter(filter)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize ${
                      appFilter === filter ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {appsLoading ? (
              <PageLoader label="Loading applications..." />
            ) : applications.length === 0 ? (
              <EmptyState
                title={appFilter === 'pending' ? 'No applications waiting for review' : 'No applications found'}
                description="New SME applications will appear here as soon as they are submitted."
              />
            ) : (
              <div className="divide-y divide-gray-200">
                {applications.map((app) => {
                  const coverage = app.requested_amount ? app.collateral_value / app.requested_amount : 0;
                  const isOpen = app.application_status === 'pending' || app.application_status === 'under_review';
                  const isMine = app.reviewed_by === corporate.corporate_id;
                  const expanded = expandedApp === app.application_id;

                  return (
                    <div key={app.application_id} className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold text-gray-900">{app.sme?.company_name || 'Unknown business'}</h4>
                            <RiskBadge grade={app.risk_grade} />
                            <StatusBadge status={app.application_status} />
                            {app.sme?.documents_verified && (
                              <span className="inline-flex items-center text-xs text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                            <span>{app.sme?.industry_sector}</span>
                            {app.sme?.city && (
                              <span className="inline-flex items-center"><MapPin className="h-3 w-3 mr-1" />{app.sme.city}, {app.sme.state}</span>
                            )}
                            {app.sme?.year_established && <span>Est. {app.sme.year_established}</span>}
                            <span>Submitted {timeAgo(app.submitted_at)}</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                            <div>
                              <div className="text-xs text-gray-500">Requested</div>
                              <div className="font-semibold text-gray-900">{formatCurrency(app.requested_amount)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Term / Rate</div>
                              <div className="font-semibold text-gray-900">{app.loan_term_months} mo · {app.proposed_interest_rate}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Collateral cover</div>
                              <div className={`font-semibold ${coverage >= 1 ? 'text-green-700' : 'text-orange-600'}`}>{(coverage * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Credit · ESG · Trust</div>
                              <div className="font-semibold text-gray-900">
                                {app.sme?.credit_score ?? '—'} · {app.sme?.esg_score ?? '—'} · {app.sme?.trust_score ?? '—'}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setExpandedApp(expanded ? null : app.application_id)}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {expanded ? 'Hide details' : 'View details'}
                          </button>

                          {expanded && (
                            <div className="mt-3 grid md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
                              <div>
                                <div className="font-medium text-gray-700 mb-1">Loan purpose</div>
                                <p className="text-gray-900">{app.loan_purpose}</p>
                              </div>
                              <div>
                                <div className="font-medium text-gray-700 mb-1">Collateral</div>
                                <p className="text-gray-900">{app.collateral_description} ({formatCurrency(app.collateral_value)})</p>
                              </div>
                              {app.sme && (
                                <div>
                                  <div className="font-medium text-gray-700 mb-1">Business size</div>
                                  <p className="text-gray-900">
                                    {formatCompactCurrency(app.sme.annual_revenue)} annual revenue · {app.sme.employee_count} employees
                                  </p>
                                </div>
                              )}
                              {app.business_description && (
                                <div>
                                  <div className="font-medium text-gray-700 mb-1">About the business</div>
                                  <p className="text-gray-900">{app.business_description}</p>
                                </div>
                              )}
                              {app.rejection_reason && (
                                <div className="md:col-span-2">
                                  <div className="font-medium text-gray-700 mb-1">Rejection reason</div>
                                  <p className="text-red-700">{app.rejection_reason}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex lg:flex-col gap-2 lg:w-40 flex-shrink-0">
                          {isOpen ? (
                            <>
                              <button
                                onClick={() => openApprove(app)}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4" /> Approve
                              </button>
                              <button
                                onClick={() => {
                                  setActionError(null);
                                  setRejectReason('');
                                  setRejecting(app);
                                }}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4" /> Reject
                              </button>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500 lg:text-right">
                              {app.application_status === 'approved' ? 'Funded' : 'Declined'} by {isMine ? 'you' : app.reviewer?.corporation_name || 'another lender'}
                              <div className="text-xs">{formatDate(app.reviewed_at)}</div>
                              {isMine && app.loan_id && (
                                <button
                                  onClick={() => onNavigate('loan-management', app.loan_id as string)}
                                  className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  <Eye className="h-4 w-4" /> View loan
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Loan Portfolio Tab */}
        {activeTab === 'loans' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Loan Portfolio</h3>
              <p className="text-gray-600">Monitor repayments across every loan you have funded</p>
            </div>
            {portfolio.loans.length === 0 ? (
              <EmptyState
                title="No loans funded yet"
                description="Approve an application to deploy capital and start earning yield."
                action={(
                  <button onClick={() => setActiveTab('applications')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    Review applications
                  </button>
                )}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Business', 'Principal', 'Risk', 'Status', 'Repayment', 'Next Payment', ''].map((heading) => (
                        <th key={heading} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {portfolio.loans.map((loan) => (
                      <tr key={loan.loan_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{loan.sme?.company_name}</div>
                          <div className="text-sm text-gray-500">{loan.sme?.industry_sector}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(loan.principal_amount)}
                          <div className="text-xs text-gray-500">{loan.interest_rate}% · {loan.loan_term_months} mo</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RiskBadge grade={loan.risk_grade} />
                          <div className="flex items-center mt-1">
                            <Leaf className="h-3 w-3 text-green-600 mr-1" />
                            <span className="text-xs text-green-600">ESG: {loan.sme?.esg_score ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={loan.loan_status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap min-w-[180px]">
                          <ProgressBar value={loanProgress(loan)} />
                          <div className="text-xs text-gray-500 mt-1">
                            {formatCompactCurrency(loan.amount_paid)} / {formatCompactCurrency(loan.total_repayable)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {loan.loan_status === 'completed' ? 'Closed' : formatDate(loan.next_payment_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => onNavigate('loan-management', loan.loan_id)}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Eye className="h-4 w-4" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Interest Earned" value={formatCompactCurrency(stats.interest_earned)} icon={TrendingUp} iconClassName="bg-green-100 text-green-600" />
              <StatCard label="Total Repaid" value={formatCompactCurrency(stats.total_repaid)} icon={CheckCircle2} iconClassName="bg-blue-100 text-blue-600" />
              <StatCard label="Loans Completed" value={stats.completed_loans} icon={Award} iconClassName="bg-purple-100 text-purple-600" />
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Capital by Industry</h3>
              <p className="text-sm text-gray-500 mb-4">Where your treasury is deployed and the average ESG score of each sector</p>
              {portfolio.industry_breakdown.length === 0 ? (
                <EmptyState title="No data yet" description="Industry analytics appear once you fund your first loan." />
              ) : (
                <div className="grid lg:grid-cols-2 gap-8">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={portfolio.industry_breakdown} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={currencyTick} />
                      <YAxis type="category" dataKey="industry" width={130} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="amount" name="Principal" fill="#1E40AF" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={portfolio.industry_breakdown} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="industry" width={130} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="esg" name="ESG score" fill="#059669" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Corporate Lender Leaderboard</h3>
              <p className="text-gray-600">See how you rank among other corporate lenders on the platform</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Rank', 'Company', 'Total Lent', 'Loans', 'Avg. Yield', 'Badge'].map((heading) => (
                      <th key={heading} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry) => {
                    const { icon: BadgeIcon, className } = badgeStyles[entry.badge];
                    return (
                      <tr key={entry.corporate_id} className={entry.is_you ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{entry.rank}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.company}
                          {entry.is_you && (
                            <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">You</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(entry.totalLent)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.loans}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.loans ? formatPercentage(entry.yield) : '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${className}`}>
                            <BadgeIcon className="h-4 w-4 mr-1" />
                            {entry.badge}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Funds Modal */}
      <Modal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} title="Add Funds to Lending Pool">
        <div className="space-y-4">
          <div>
            <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
            <input
              id="deposit-amount"
              type="number"
              min="1000"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="e.g. 5000000"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-2">
              {[1000000, 5000000, 10000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDepositAmount(String(preset))}
                  className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  {formatCompactCurrency(preset)}
                </button>
              ))}
            </div>
            <FieldError message={actionError} />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 space-y-1">
            <div className="flex justify-between"><span>Current available</span><span>{formatCurrency(stats.available_funds)}</span></div>
            <div className="flex justify-between font-semibold">
              <span>After deposit</span>
              <span>{formatCurrency(stats.available_funds + (Number(depositAmount) || 0))}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setShowDepositModal(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={confirmDeposit}
              disabled={depositing}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {depositing && <Spinner className="h-4 w-4 border-white" />} Add Funds
            </button>
          </div>
        </div>
      </Modal>

      {/* Approve Modal */}
      <Modal isOpen={!!approving} onClose={() => setApproving(null)} title="Approve & Fund Loan">
        {approving && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div>
                <div className="font-semibold text-gray-900">{approving.sme?.company_name}</div>
                <div className="text-sm text-gray-500">Requested {formatCurrency(approving.requested_amount)} for {approving.loan_term_months} months</div>
              </div>
              <RiskBadge grade={approving.risk_grade} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="approve-amount" className="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input
                  id="approve-amount"
                  type="number"
                  value={approveTerms.amount}
                  onChange={(e) => setApproveTerms({ ...approveTerms, amount: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="approve-rate" className="block text-xs font-medium text-gray-700 mb-1">Rate (% APR)</label>
                <input
                  id="approve-rate"
                  type="number"
                  step="0.1"
                  value={approveTerms.rate}
                  onChange={(e) => setApproveTerms({ ...approveTerms, rate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="approve-term" className="block text-xs font-medium text-gray-700 mb-1">Term (months)</label>
                <input
                  id="approve-term"
                  type="number"
                  value={approveTerms.term}
                  onChange={(e) => setApproveTerms({ ...approveTerms, term: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 space-y-1">
              <div className="flex justify-between"><span>Monthly repayment</span><span className="font-semibold">{formatCurrency(approvePreview.monthly)}</span></div>
              <div className="flex justify-between"><span>Interest you earn</span><span className="font-semibold">{formatCurrency(approvePreview.interest)}</span></div>
              <div className="flex justify-between"><span>Available after funding</span><span>{formatCurrency(stats.available_funds - (Number(approveTerms.amount) || 0))}</span></div>
            </div>

            <p className="text-xs text-gray-500">
              Approving deploys a loan agreement contract and disburses the funds to the borrower's wallet.
            </p>
            <FieldError message={actionError} />

            <div className="flex gap-4">
              <button onClick={() => setApproving(null)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting && <Spinner className="h-4 w-4 border-white" />} Approve &amp; Disburse
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejecting} onClose={() => setRejecting(null)} title="Reject Application">
        {rejecting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Let <span className="font-medium text-gray-900">{rejecting.sme?.company_name}</span> know why their {formatCurrency(rejecting.requested_amount)} request was declined.
            </p>
            <div className="flex flex-wrap gap-2">
              {REJECTION_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className="px-3 py-1 text-xs bg-gray-100 rounded-full hover:bg-gray-200 text-left"
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Reason for rejection (at least 10 characters)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FieldError message={actionError} />
            <div className="flex gap-4">
              <button onClick={() => setRejecting(null)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting && <Spinner className="h-4 w-4 border-white" />} Reject Application
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CorporateDashboard;
