import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye, Plus, Wallet, Calendar, TrendingUp, ShieldCheck } from 'lucide-react';
import { loanAPI } from '../services/api';
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  loanProgress,
  timeAgo
} from '../utils/calculations';
import { EmptyState, ErrorState, PageLoader, ProgressBar, RiskBadge, StatCard, StatusBadge } from '../components/ui';
import type { Loan, LoanApplication, SMEProfile } from '../types';

interface SMEStatusProps {
  onNavigate: (page: string, param?: string) => void;
}

const statusIcon = (status: LoanApplication['application_status']) => {
  switch (status) {
    case 'approved': return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />;
    default: return <Clock className="h-5 w-5 text-orange-500" />;
  }
};

const SMEStatus: React.FC<SMEStatusProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SMEProfile | null>(null);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  const fetchMyLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loanAPI.getMyLoans();
      setProfile(res.data.profile);
      setApplications(res.data.applications);
      setLoans(res.data.active_loans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyLoans();
  }, [fetchMyLoans]);

  if (loading) return <PageLoader label="Loading your applications..." />;
  if (error) return <ErrorState message={error} onRetry={fetchMyLoans} />;

  const activeLoans = loans.filter((loan) => loan.loan_status !== 'completed');
  const totalBorrowed = loans.reduce((sum, loan) => sum + loan.principal_amount, 0);
  const outstanding = activeLoans.reduce((sum, loan) => sum + loan.amount_remaining, 0);
  const nextDue = activeLoans
    .filter((loan) => loan.next_payment_date)
    .sort((a, b) => new Date(a.next_payment_date as string).getTime() - new Date(b.next_payment_date as string).getTime())[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{profile?.company_name || 'My Business'}</h1>
            <p className="text-gray-600 mt-1">Track your loan applications, repayments and active loans</p>
          </div>
          <button
            onClick={() => onNavigate('sme')}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Apply for a Loan
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Total Borrowed" value={formatCompactCurrency(totalBorrowed)} icon={Wallet} iconClassName="bg-blue-100 text-blue-600">
            <span className="text-sm text-gray-500">{loans.length} loan{loans.length === 1 ? '' : 's'} funded</span>
          </StatCard>
          <StatCard label="Outstanding" value={formatCompactCurrency(outstanding)} icon={TrendingUp} iconClassName="bg-orange-100 text-orange-600">
            <span className="text-sm text-gray-500">{activeLoans.length} active</span>
          </StatCard>
          <StatCard
            label="Next Payment"
            value={nextDue ? formatCompactCurrency(nextDue.monthly_payment) : '—'}
            icon={Calendar}
            iconClassName="bg-green-100 text-green-600"
          >
            <span className="text-sm text-gray-500">{nextDue ? `Due ${formatDate(nextDue.next_payment_date)}` : 'Nothing due'}</span>
          </StatCard>
          <StatCard label="Credit Score" value={profile ? `${profile.credit_score}/100` : '—'} icon={ShieldCheck} iconClassName="bg-purple-100 text-purple-600">
            <span className="text-sm text-gray-500">ESG {profile?.esg_score ?? '—'} · Trust {profile?.trust_score ?? '—'}</span>
          </StatCard>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Applications */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Applications</h2>
            </div>
            {applications.length === 0 ? (
              <EmptyState
                title="No applications yet"
                description="Submit your first loan application to get funded by corporate lenders."
                action={(
                  <button onClick={() => onNavigate('sme')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    Start application
                  </button>
                )}
              />
            ) : (
              <div className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <div key={app.application_id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        {statusIcon(app.application_status)}
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900">{formatCurrency(app.requested_amount)} · {app.loan_term_months} months</div>
                          <div className="text-sm text-gray-500">Submitted {timeAgo(app.submitted_at)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <RiskBadge grade={app.risk_grade} />
                        <StatusBadge status={app.application_status} />
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{app.loan_purpose}</p>

                    {app.application_status === 'approved' && (
                      <div className="mt-3 flex items-center justify-between bg-green-50 rounded-lg px-4 py-2 text-sm">
                        <span className="text-green-800">
                          Funded by <span className="font-medium">{app.reviewer?.corporation_name || 'a lender'}</span> on {formatDate(app.reviewed_at)}
                        </span>
                        {app.loan_id && (
                          <button
                            onClick={() => onNavigate('loan-management', app.loan_id as string)}
                            className="inline-flex items-center gap-1 text-green-700 hover:text-green-900 font-medium"
                          >
                            <Eye className="h-4 w-4" /> View loan
                          </button>
                        )}
                      </div>
                    )}

                    {app.application_status === 'rejected' && (
                      <div className="mt-3 bg-red-50 rounded-lg px-4 py-2 text-sm text-red-800">
                        {app.rejection_reason || 'This application was declined.'}
                      </div>
                    )}

                    {app.application_status === 'pending' && (
                      <div className="mt-3 bg-orange-50 rounded-lg px-4 py-2 text-sm text-orange-800">
                        Under review by lenders · proposed rate {app.proposed_interest_rate}% APR
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Loans */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 self-start">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">My Loans</h2>
            </div>
            {loans.length === 0 ? (
              <EmptyState title="No loans yet" description="Approved applications become loans here." />
            ) : (
              <div className="divide-y divide-gray-200">
                {loans.map((loan) => (
                  <button
                    key={loan.loan_id}
                    onClick={() => onNavigate('loan-management', loan.loan_id)}
                    className="w-full text-left p-6 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900">{formatCurrency(loan.principal_amount)}</div>
                      <StatusBadge status={loan.loan_status} />
                    </div>
                    <div className="text-sm text-gray-500 mb-3">
                      {loan.corporate?.corporation_name} · {loan.interest_rate}% · {loan.loan_term_months} mo
                    </div>
                    <ProgressBar value={loanProgress(loan)} barClassName={loan.loan_status === 'completed' ? 'bg-green-600' : 'bg-blue-600'} />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatCompactCurrency(loan.amount_paid)} repaid</span>
                      <span>
                        {loan.loan_status === 'completed'
                          ? `Closed ${formatDate(loan.completed_at)}`
                          : `Next: ${formatDate(loan.next_payment_date)}`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMEStatus;
