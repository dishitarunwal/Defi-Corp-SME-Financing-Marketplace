import type { Loan } from '../types';

export const MIN_LOAN_AMOUNT = 5000;
export const MAX_LOAN_AMOUNT = 50000000;

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

export const formatCurrency = (amount: number | null | undefined): string => {
  return inrFormatter.format(Number.isFinite(amount) ? (amount as number) : 0);
};

// ₹4.3 Cr, ₹15.2 L, ₹85K - for headline figures and chart axes
export const formatCompactCurrency = (amount: number | null | undefined): string => {
  const value = Number.isFinite(amount) ? (amount as number) : 0;
  const abs = Math.abs(value);
  const trim = (n: number) => n.toFixed(n >= 100 ? 0 : 1).replace(/\.0$/, '');
  if (abs >= 10000000) return `₹${trim(value / 10000000)} Cr`;
  if (abs >= 100000) return `₹${trim(value / 100000)} L`;
  if (abs >= 1000) return `₹${trim(value / 1000)}K`;
  return formatCurrency(value);
};

export const formatPercentage = (value: number): string => {
  return `${(value || 0).toFixed(1)}%`;
};

export const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  termInMonths: number
): number => {
  if (!principal || !termInMonths) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (!monthlyRate) return principal / termInMonths;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termInMonths)) /
    (Math.pow(1 + monthlyRate, termInMonths) - 1);
  return Math.round(payment * 100) / 100;
};

export const getRiskColor = (grade: string): string => {
  switch (grade) {
    case 'A': return '#059669';
    case 'B': return '#1E40AF';
    case 'C': return '#EA580C';
    case 'D': return '#d4183d';
    default: return '#64748B';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
    case 'approved':
      return '#059669';
    case 'pending':
    case 'under_review':
      return '#EA580C';
    case 'completed': return '#1E40AF';
    case 'overdue':
    case 'rejected':
      return '#d4183d';
    default: return '#64748B';
  }
};

export const formatStatus = (status: string): string =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export const timeAgo = (date: string | Date): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
};

export const truncateAddress = (address?: string | null, start = 6, end = 4): string => {
  if (!address) return '—';
  if (address.length <= start + end + 3) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export interface ScheduleRow {
  month: number;
  dueDate: Date;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  status: 'paid' | 'due' | 'upcoming';
}

// Amortisation schedule derived from the loan's terms and repayments so far
export const buildPaymentSchedule = (loan: Loan): ScheduleRow[] => {
  const monthlyRate = loan.interest_rate / 100 / 12;
  const disbursed = new Date(loan.disbursement_date).getTime();
  const paidInstallments = loan.loan_status === 'completed' ? loan.loan_term_months : loan.payments_made;
  let balance = loan.principal_amount;

  return Array.from({ length: loan.loan_term_months }, (_, i) => {
    const interest = balance * monthlyRate;
    const principal = Math.min(balance, loan.monthly_payment - interest);
    balance = Math.max(0, balance - principal);
    const month = i + 1;
    return {
      month,
      dueDate: new Date(disbursed + month * 30 * 24 * 60 * 60 * 1000),
      payment: loan.monthly_payment,
      principal,
      interest,
      balance,
      status: month <= paidInstallments ? 'paid' : month === paidInstallments + 1 ? 'due' : 'upcoming'
    };
  });
};

export const loanProgress = (loan: Pick<Loan, 'amount_paid' | 'total_repayable'>): number => {
  if (!loan.total_repayable) return 0;
  return Math.min(100, (loan.amount_paid / loan.total_repayable) * 100);
};

export const validateLoanAmount = (amount: number): string | null => {
  if (!Number.isFinite(amount) || amount < MIN_LOAN_AMOUNT) return `Minimum loan amount is ${formatCurrency(MIN_LOAN_AMOUNT)}`;
  if (amount > MAX_LOAN_AMOUNT) return `Maximum loan amount is ${formatCurrency(MAX_LOAN_AMOUNT)}`;
  return null;
};
