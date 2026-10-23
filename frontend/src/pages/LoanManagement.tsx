import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  IndianRupee,
  Shield,
  Leaf,
  Star,
  CheckCircle2,
  Clock,
  MessageCircle,
  Send,
  ExternalLink,
  Boxes,
  CreditCard,
  CircleDot
} from 'lucide-react';
import { loanAPI } from '../services/api';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import {
  buildPaymentSchedule,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercentage,
  loanProgress,
  truncateAddress
} from '../utils/calculations';
import {
  CopyButton, EmptyState, ErrorState, FieldError, Modal, PageLoader, ProgressBar, RiskBadge, Spinner, StatusBadge
} from '../components/ui';
import type { ChainTransaction, Loan } from '../types';

interface LoanManagementProps {
  onNavigate: (page: string, param?: string) => void;
  loanId?: string;
}

type Tab = 'overview' | 'schedule' | 'blockchain' | 'communication';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'schedule', label: 'Payment Schedule', icon: Calendar },
  { id: 'blockchain', label: 'Blockchain', icon: Shield },
  { id: 'communication', label: 'Communication', icon: MessageCircle }
];

const TX_LABELS: Record<ChainTransaction['type'], string> = {
  deploy: 'Contract Deployment',
  disbursement: 'Loan Disbursement',
  repayment: 'Repayment',
  completion: 'Loan Closed'
};

const scoreLabel = (score: number) => {
  if (score >= 85) return 'Excellent';
  if (score >= 75) return 'Strong';
  if (score >= 65) return 'Moderate';
  return 'Developing';
};

const LoanManagement: React.FC<LoanManagementProps> = ({ onNavigate, loanId }) => {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const isSME = user?.user_type === 'SME';

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showPayment, setShowPayment] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'installment' | 'full' | 'custom'>('installment');
  const [customAmount, setCustomAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [selectedTx, setSelectedTx] = useState<ChainTransaction | null>(null);

  const selectedId = loanId || loans[0]?.loan_id;

  const loadLoans = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const list = isSME
        ? (await loanAPI.getMyLoans()).data.active_loans
        : (await loanAPI.getPortfolio()).data.loans;
      setLoans(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loans');
    } finally {
      setListLoading(false);
    }
  }, [isSME]);

  const loadDetails = useCallback(async (id: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const res = await loanAPI.getLoanDetails(id);
      setLoan(res.data);
    } catch (err) {
      setLoan(null);
      setError(err instanceof Error ? err.message : 'Failed to load loan');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  useEffect(() => {
    if (selectedId) loadDetails(selectedId);
  }, [selectedId, loadDetails]);

  useEffect(() => {
    if (activeTab === 'communication') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeTab, loan?.messages?.length]);

  const schedule = useMemo(() => (loan ? buildPaymentSchedule(loan) : []), [loan]);

  const sendMessage = async () => {
    if (!loan || !newMessage.trim()) return;
    setSending(true);
    try {
      const res = await loanAPI.sendMessage(loan.loan_id, newMessage.trim());
      setLoan({ ...loan, messages: res.data });
      setNewMessage('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const paymentAmount = () => {
    if (!loan) return 0;
    if (paymentOption === 'full') return loan.amount_remaining;
    if (paymentOption === 'custom') return Number(customAmount) || 0;
    return Math.min(loan.monthly_payment, loan.amount_remaining);
  };

  const confirmPayment = async () => {
    if (!loan) return;
    const amount = paymentAmount();
    if (!(amount > 0)) {
      setPaymentError('Please enter a valid amount');
      return;
    }
    if (amount > loan.amount_remaining + 1) {
      setPaymentError(`Amount cannot exceed the outstanding balance of ${formatCurrency(loan.amount_remaining)}`);
      return;
    }
    setPaying(true);
    setPaymentError(null);
    try {
      const res = await loanAPI.repayLoan(loan.loan_id, Math.round(amount * 100) / 100);
      showToast(
        res.data.loan.loan_status === 'completed'
          ? 'Loan fully repaid - congratulations!'
          : `Payment of ${formatCurrency(amount)} confirmed (tx ${truncateAddress(res.data.transaction.tx_hash, 8, 6)})`
      );
      setShowPayment(false);
      setCustomAmount('');
      await Promise.all([loadDetails(loan.loan_id), loadLoans(), refreshProfile()]);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const backTarget = isSME ? 'sme-status' : 'corporate';

  if (listLoading && !loan) return <PageLoader label="Loading loans..." />;

  if (!selectedId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          title="No loans yet"
          description={isSME
            ? 'Once a lender approves one of your applications, the loan will appear here.'
            : 'Approve an SME application to fund your first loan.'}
          action={(
            <button
              onClick={() => onNavigate(isSME ? 'sme' : 'corporate', isSME ? undefined : 'applications')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              {isSME ? 'Apply for a loan' : 'Review applications'}
            </button>
          )}
        />
      </div>
    );
  }

  if (error && !loan) return <ErrorState message={error} onRetry={() => loadDetails(selectedId)} />;
  if (!loan || detailLoading && loan.loan_id !== selectedId) return <PageLoader label="Loading loan details..." />;

  const counterparty = isSME ? loan.corporate?.corporation_name : loan.sme?.company_name;
  const isActive = loan.loan_status !== 'completed';
  const repayments = loan.transactions.filter((tx) => tx.type === 'repayment');
  const smeScores = loan.sme
    ? [
      { label: 'Credit Score', value: loan.sme.credit_score },
      { label: 'ESG Score', value: loan.sme.esg_score },
      { label: 'Trust Score', value: loan.sme.trust_score }
    ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate(backTarget, isSME ? undefined : 'loans')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to {isSME ? 'My Applications' : 'Dashboard'}</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{loan.sme?.company_name}</h1>
                <StatusBadge status={loan.loan_status} />
              </div>
              <p className="text-gray-600 mt-1">
                {loan.sme?.industry_sector} · {formatCurrency(loan.principal_amount)} loan
                {isSME && loan.corporate ? ` from ${loan.corporate.corporation_name}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {loans.length > 1 && (
                <select
                  value={loan.loan_id}
                  onChange={(e) => onNavigate('loan-management', e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
                  aria-label="Select loan"
                >
                  {loans.map((item) => (
                    <option key={item.loan_id} value={item.loan_id}>
                      {(isSME ? item.corporate?.corporation_name : item.sme?.company_name) || 'Loan'} · {formatCompactCurrency(item.principal_amount)}
                      {item.loan_status === 'completed' ? ' (closed)' : ''}
                    </option>
                  ))}
                </select>
              )}
              {loan.sme && (
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(loan.sme!.trust_score / 20) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">Trust {loan.sme.trust_score}%</span>
                </div>
              )}
              <RiskBadge grade={loan.risk_grade} className="px-3 text-sm" />
              {isSME && isActive && (
                <button
                  onClick={() => {
                    setPaymentError(null);
                    setPaymentOption('installment');
                    setShowPayment(true);
                  }}
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
                >
                  <CreditCard className="h-4 w-4" /> Make Payment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.amount_remaining)}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-blue-600" />
            </div>
            <ProgressBar value={loanProgress(loan)} className="h-2 mt-4" />
            <p className="text-xs text-gray-500 mt-1">{loanProgress(loan).toFixed(0)}% repaid</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Payment</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.monthly_payment)}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {isActive ? `Next: ${formatDate(loan.next_payment_date)}` : `Closed ${formatDate(loan.completed_at)}`}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Interest Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(loan.interest_rate)}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Fixed APR · {loan.loan_term_months} months</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ESG Score</p>
                <p className="text-2xl font-bold text-gray-900">{loan.sme?.esg_score ?? '—'}/100</p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-green-600 mt-2">{scoreLabel(loan.sme?.esg_score || 0)} Impact</p>
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
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Overview</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Industry</h4>
                    <p className="text-gray-900">{loan.sme?.industry_sector || '—'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Established</h4>
                    <p className="text-gray-900">{loan.sme?.year_established || '—'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Annual Revenue</h4>
                    <p className="text-gray-900">{loan.sme ? formatCurrency(loan.sme.annual_revenue) : '—'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Location</h4>
                    <p className="text-gray-900">{[loan.sme?.city, loan.sme?.state].filter(Boolean).join(', ') || '—'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-700 mb-1">Loan Purpose</h4>
                    <p className="text-gray-900">{loan.application?.loan_purpose || '—'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-700 mb-1">Collateral Held</h4>
                    <p className="text-gray-900">
                      {loan.collateral_held || '—'}
                      {loan.application?.collateral_value ? ` (${formatCurrency(loan.application.collateral_value)})` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Terms</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Principal Amount</h4>
                    <p className="text-gray-900 text-2xl font-bold">{formatCurrency(loan.principal_amount)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Total Repayable</h4>
                    <p className="text-gray-900 text-2xl font-bold">{formatCurrency(loan.total_repayable)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Amount Paid</h4>
                    <p className="text-gray-900 text-2xl font-bold">{formatCurrency(loan.amount_paid)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Installments Paid</h4>
                    <p className="text-gray-900 text-2xl font-bold">
                      {loan.loan_status === 'completed' ? loan.loan_term_months : loan.payments_made} / {loan.loan_term_months}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Disbursed On</h4>
                    <p className="text-gray-900">{formatDate(loan.disbursement_date)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">{isSME ? 'Lender' : 'Borrower'}</h4>
                    <p className="text-gray-900">{counterparty || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Borrower Assessment</h3>
                <div className="space-y-4">
                  {smeScores.map((score) => (
                    <div key={score.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{score.label}</span>
                        <span className="text-sm text-gray-900">{score.value}/100</span>
                      </div>
                      <ProgressBar value={score.value} barClassName="bg-green-600" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Credit Grade</span>
                    <RiskBadge grade={loan.risk_grade} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Collateral Cover</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {loan.application?.collateral_value
                        ? `${((loan.application.collateral_value / loan.principal_amount) * 100).toFixed(0)}%`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment History</span>
                    <span className="text-sm text-green-600">
                      {repayments.length === 0 ? 'No payments yet' : `${repayments.length} on-time payment${repayments.length === 1 ? '' : 's'}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment Schedule</h3>
              <p className="text-gray-600">Amortisation schedule for this loan</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['#', 'Due Date', 'Payment', 'Principal', 'Interest', 'Balance', 'Status'].map((heading) => (
                      <th key={heading} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedule.map((row) => (
                    <tr key={row.month} className={row.status === 'due' ? 'bg-orange-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{row.month}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(row.dueDate)}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.payment)}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.principal)}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.interest)}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.balance)}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        {row.status === 'paid' && (
                          <span className="inline-flex items-center gap-1 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" /> Paid</span>
                        )}
                        {row.status === 'due' && (
                          <span className="inline-flex items-center gap-1 text-sm text-orange-600"><Clock className="h-4 w-4" /> Due next</span>
                        )}
                        {row.status === 'upcoming' && (
                          <span className="inline-flex items-center gap-1 text-sm text-gray-500"><CircleDot className="h-4 w-4" /> Upcoming</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Blockchain Tab */}
        {activeTab === 'blockchain' && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Contract Details</h3>
                {loan.blockchain ? (
                  <div className="space-y-4">
                    {[
                      { label: 'Loan Contract Address', value: loan.blockchain.contract_address },
                      { label: 'Deployment Transaction', value: loan.blockchain.deployment_tx },
                      { label: 'Lending Pool Contract', value: loan.blockchain.pool_address },
                      { label: 'Settlement Token (mINR)', value: loan.blockchain.token_address }
                    ].map((item) => (
                      <div key={item.label}>
                        <h4 className="font-medium text-gray-700 mb-2 text-sm">{item.label}</h4>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg gap-3">
                          <span className="font-mono text-sm text-gray-900 truncate">{truncateAddress(item.value, 12, 10)}</span>
                          <CopyButton text={item.value} />
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Contract deployed and verified</span>
                    </div>
                  </div>
                ) : (
                  <EmptyState title="No contract information" description="This loan was created before contract tracking was enabled." />
                )}
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Contract Deployed', done: !!loan.blockchain },
                    { label: 'Funds Escrowed & Disbursed', done: loan.transactions.some((tx) => tx.type === 'disbursement') },
                    { label: `Repayments Recorded (${repayments.length})`, done: repayments.length > 0 },
                    { label: 'Loan Settled & Collateral Released', done: loan.loan_status === 'completed' }
                  ].map((step) => (
                    <div key={step.label} className={`flex items-center justify-between p-4 rounded-lg ${step.done ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center space-x-3">
                        {step.done
                          ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                          : <Clock className="h-5 w-5 text-gray-400" />}
                        <span className={`font-medium ${step.done ? 'text-green-800' : 'text-gray-600'}`}>{step.label}</span>
                      </div>
                      <span className={`text-sm ${step.done ? 'text-green-600' : 'text-gray-400'}`}>{step.done ? '✓ Confirmed' : 'Pending'}</span>
                    </div>
                  ))}
                </div>

                {loan.blockchain && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Network Information</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div className="flex justify-between"><span>Network:</span><span>{loan.blockchain.network}</span></div>
                      <div className="flex justify-between"><span>Chain ID:</span><span>{loan.blockchain.chain_id}</span></div>
                      <div className="flex justify-between"><span>Deployed in Block:</span><span>#{loan.blockchain.block_number.toLocaleString('en-US')}</span></div>
                      <div className="flex justify-between"><span>Deployment Gas:</span><span>{loan.blockchain.gas_used.toLocaleString('en-US')}</span></div>
                      <div className="flex justify-between"><span>Deployed:</span><span>{formatDateTime(loan.blockchain.deployed_at)}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                <Boxes className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Transaction Ledger</h3>
                  <p className="text-sm text-gray-600">Every movement of funds for this loan, recorded on-chain</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Type', 'Tx Hash', 'Block', 'Amount', 'Gas', 'Time', ''].map((heading) => (
                        <th key={heading} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...loan.transactions].reverse().map((tx) => (
                      <tr key={tx.tx_hash} className="hover:bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{TX_LABELS[tx.type]}</td>
                        <td className="px-6 py-3 whitespace-nowrap font-mono text-sm text-blue-700">{truncateAddress(tx.tx_hash, 10, 6)}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">#{tx.block_number?.toLocaleString('en-US')}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{tx.amount ? formatCurrency(tx.amount) : '—'}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{tx.gas_used?.toLocaleString('en-US')}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{formatDateTime(tx.timestamp)}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-right">
                          <button onClick={() => setSelectedTx(tx)} className="text-blue-600 hover:text-blue-800" aria-label="View transaction">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Communication Tab */}
        {activeTab === 'communication' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Communication History</h3>
              <p className="text-gray-600">Messages with {counterparty || 'the other party'}</p>
            </div>

            <div className="p-6 space-y-4 max-h-[28rem] overflow-y-auto">
              {(loan.messages || []).length === 0 && (
                <p className="text-sm text-gray-500 text-center">No messages yet. Start the conversation below.</p>
              )}
              {(loan.messages || []).map((message, index) => {
                if (message.sender_type === 'SYSTEM') {
                  return (
                    <div key={message._id || index} className="flex justify-center">
                      <div className="max-w-lg text-center text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
                        {message.message} · {formatDateTime(message.created_at)}
                      </div>
                    </div>
                  );
                }
                const mine = message.sender_type === user?.user_type;
                return (
                  <div key={message._id || index} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${mine ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                      {!mine && (
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {(message.sender_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
                          </div>
                          <span className="text-xs font-medium text-gray-700">{message.sender_name}</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-line">{message.message}</p>
                      <p className={`text-xs mt-1 ${mine ? 'text-blue-100' : 'text-gray-500'}`}>{formatDateTime(message.created_at)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 border-t border-gray-200">
              <form
                className="flex space-x-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  maxLength={2000}
                  className="flex-1 min-w-0 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
                >
                  {sending ? <Spinner className="h-4 w-4 border-white" /> : <Send className="h-4 w-4" />}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Make a Payment">
        <div className="space-y-4">
          {[
            { id: 'installment' as const, label: 'Next installment', amount: Math.min(loan.monthly_payment, loan.amount_remaining) },
            { id: 'full' as const, label: 'Pay off in full', amount: loan.amount_remaining }
          ].map((option) => (
            <label
              key={option.id}
              className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer ${
                paymentOption === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment-option"
                  checked={paymentOption === option.id}
                  onChange={() => setPaymentOption(option.id)}
                />
                <span className="font-medium text-gray-900">{option.label}</span>
              </div>
              <span className="font-semibold text-gray-900">{formatCurrency(option.amount)}</span>
            </label>
          ))}
          <label
            className={`block p-4 border-2 rounded-lg cursor-pointer ${
              paymentOption === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="payment-option"
                checked={paymentOption === 'custom'}
                onChange={() => setPaymentOption('custom')}
              />
              <span className="font-medium text-gray-900">Custom amount</span>
            </div>
            {paymentOption === 'custom' && (
              <input
                type="number"
                min="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount (₹)"
                className="mt-3 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </label>

          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-1">
            <div className="flex justify-between"><span>Paying to</span><span className="font-medium">{loan.corporate?.corporation_name}</span></div>
            <div className="flex justify-between"><span>Balance after payment</span><span className="font-medium">{formatCurrency(Math.max(0, loan.amount_remaining - paymentAmount()))}</span></div>
          </div>
          <FieldError message={paymentError} />

          <div className="flex gap-4">
            <button onClick={() => setShowPayment(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={confirmPayment}
              disabled={paying}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {paying && <Spinner className="h-4 w-4 border-white" />} Pay {formatCurrency(paymentAmount())}
            </button>
          </div>
        </div>
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Details">
        {selectedTx && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{TX_LABELS[selectedTx.type]} · {selectedTx.status}</span>
            </div>
            {[
              { label: 'Transaction Hash', value: selectedTx.tx_hash, mono: true },
              { label: 'Block', value: `#${selectedTx.block_number?.toLocaleString('en-US')}` },
              { label: 'Timestamp', value: formatDateTime(selectedTx.timestamp) },
              { label: 'From', value: selectedTx.from || '—', mono: true },
              { label: 'To', value: selectedTx.to || 'Contract creation', mono: true },
              { label: 'Value', value: selectedTx.amount ? `${selectedTx.amount.toLocaleString('en-IN')} mINR` : '0 mINR' },
              { label: 'Gas Used', value: selectedTx.gas_used?.toLocaleString('en-US') },
              { label: 'Network', value: `${loan.blockchain?.network || 'DeFiCorp Testnet'} (Chain ${loan.blockchain?.chain_id || 31337})` }
            ].map((row) => (
              <div key={row.label} className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-gray-100 pb-2">
                <span className="text-gray-500">{row.label}</span>
                <span className={`text-gray-900 break-all sm:text-right sm:ml-4 ${row.mono ? 'font-mono text-xs' : ''}`}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LoanManagement;
