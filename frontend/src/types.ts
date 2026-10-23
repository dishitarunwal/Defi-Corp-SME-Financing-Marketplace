export type UserType = 'SME' | 'CORPORATE';
export type RiskGrade = 'A' | 'B' | 'C' | 'D';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type LoanStatus = 'active' | 'completed' | 'overdue' | 'defaulted';

export interface User {
  user_id: string;
  email: string;
  user_type: UserType;
  full_name: string;
  phone_number?: string;
  is_verified?: boolean;
  wallet_address?: string;
}

export interface SMEProfile {
  sme_id: string;
  user_id: string;
  company_name: string;
  registration_number?: string;
  industry_sector: string;
  year_established: number;
  annual_revenue: number;
  employee_count: number;
  credit_score: number;
  esg_score: number;
  trust_score: number;
  city?: string;
  state?: string;
  country?: string;
  documents_verified?: boolean;
}

export interface CorporateProfile {
  corporate_id: string;
  user_id: string;
  corporation_name: string;
  registration_number: string;
  total_treasury_funds: number;
  allocated_funds: number;
  available_funds: number;
  active_loans_count: number;
  total_disbursed: number;
  total_repaid: number;
}

export type Profile = SMEProfile | CorporateProfile;

export interface LoanApplication {
  application_id: string;
  sme_id: string;
  requested_amount: number;
  loan_purpose: string;
  loan_term_months: number;
  proposed_interest_rate: number;
  collateral_description: string;
  collateral_value: number;
  monthly_revenue?: number | null;
  business_description?: string | null;
  risk_grade: RiskGrade;
  application_status: ApplicationStatus;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  loan_id?: string | null;
  submitted_at: string;
  sme?: SMEProfile | null;
  reviewer?: Pick<CorporateProfile, 'corporate_id' | 'corporation_name'> | null;
}

export interface ChainTransaction {
  type: 'deploy' | 'disbursement' | 'repayment' | 'completion';
  tx_hash: string;
  block_number: number;
  gas_used: number;
  amount: number;
  from?: string | null;
  to?: string | null;
  status: string;
  timestamp: string;
}

export interface LoanMessage {
  _id?: string;
  sender_type: 'SME' | 'CORPORATE' | 'SYSTEM';
  sender_name?: string;
  message: string;
  created_at: string;
}

export interface BlockchainInfo {
  network: string;
  chain_id: number;
  mode: string;
  contract_address: string;
  pool_address: string;
  token_address: string;
  deployment_tx: string;
  block_number: number;
  gas_used: number;
  deployed_at: string;
  status: string;
}

export interface Loan {
  loan_id: string;
  application_id: string;
  sme_id: string;
  corporate_id: string;
  principal_amount: number;
  interest_rate: number;
  loan_term_months: number;
  total_repayable: number;
  amount_paid: number;
  amount_remaining: number;
  payments_made: number;
  loan_status: LoanStatus;
  risk_grade: RiskGrade;
  collateral_held?: string;
  monthly_payment: number;
  next_payment_date?: string | null;
  disbursement_date: string;
  completed_at?: string | null;
  blockchain?: BlockchainInfo;
  transactions: ChainTransaction[];
  messages?: LoanMessage[];
  sme?: SMEProfile | null;
  corporate?: Pick<CorporateProfile, 'corporate_id' | 'corporation_name'> | null;
  application?: Pick<LoanApplication, 'loan_purpose' | 'collateral_description' | 'collateral_value' | 'monthly_revenue' | 'business_description' | 'submitted_at'> | null;
}

export interface PortfolioStats {
  total_treasury_funds: number;
  available_funds: number;
  allocated_funds: number;
  total_disbursed: number;
  total_repaid: number;
  interest_earned: number;
  active_loans: number;
  completed_loans: number;
  portfolio_yield: number;
  average_esg: number;
  pending_applications: number;
}

export interface Portfolio {
  corporate: CorporateProfile;
  wallet_address: string;
  network: { name: string; chain_id: number; mode: string; currency: string };
  loans: Loan[];
  stats: PortfolioStats;
  risk_distribution: { grade: RiskGrade; count: number; amount: number; value: number }[];
  monthly_activity: { month: string; disbursed: number; repaid: number }[];
  industry_breakdown: { industry: string; amount: number; loans: number; esg: number }[];
}

export interface LeaderboardEntry {
  rank: number;
  corporate_id: string;
  company: string;
  totalLent: number;
  loans: number;
  yield: number;
  badge: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  is_you: boolean;
}

export interface Quote {
  risk_grade: RiskGrade;
  proposed_interest_rate: number;
  risk_points: number;
  collateral_coverage: number;
  loan_term_months: number;
  monthly_payment: number;
  total_repayable: number;
  total_interest: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthPayload {
  user: User;
  profile: Profile | null;
  token: string;
  redirect_to?: string;
}

export interface SignupData {
  email: string;
  password: string;
  user_type: UserType;
  full_name: string;
  phone_number: string;
  company_details: Record<string, string | number>;
}

export type Page = 'landing' | 'corporate' | 'sme' | 'sme-status' | 'loan-management';
