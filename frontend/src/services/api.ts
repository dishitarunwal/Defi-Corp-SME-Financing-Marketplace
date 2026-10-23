import type {
  ApiResponse,
  AuthPayload,
  LeaderboardEntry,
  Loan,
  LoanApplication,
  LoanMessage,
  Portfolio,
  Profile,
  Quote,
  SignupData,
  SMEProfile,
  User,
  CorporateProfile,
  ChainTransaction
} from '../types';

// Accept VITE_API_URL with or without a trailing "/api"
const resolveBaseUrl = () => {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:5050';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = resolveBaseUrl();

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getUser = (): User | null => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? (JSON.parse(userData) as User) : null;
  } catch {
    return null;
  }
};

export const setAuthData = (token: string, user: User) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Storage unavailable (private mode) - session will last until reload
  }
};

export const clearAuthData = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
  } catch {
    throw new ApiError('Unable to reach the server. Please check your connection and try again.', 0);
  }

  let data: ApiResponse<T> | null = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response (e.g. proxy error page)
  }

  if (!response.ok || !data) {
    throw new ApiError(data?.message || `Request failed (${response.status})`, response.status);
  }

  return data;
};

const post = <T>(endpoint: string, body: unknown = {}) =>
  apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });

const patch = <T>(endpoint: string, body: unknown = {}) =>
  apiRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) });

export const authAPI = {
  signup: async (userData: SignupData) => {
    const response = await post<AuthPayload>('/auth/signup', userData);
    setAuthData(response.data.token, response.data.user);
    return response;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await post<AuthPayload>('/auth/login', credentials);
    setAuthData(response.data.token, response.data.user);
    return response;
  },

  logout: () => {
    clearAuthData();
  },

  getMe: () => apiRequest<{ user: User; profile: Profile | null }>('/auth/me'),

  isAuthenticated: () => !!getToken()
};

export const loanAPI = {
  // SME endpoints
  getQuote: (data: { requested_amount: number; collateral_value: number; loan_term_months: number }) =>
    post<Quote>('/loan/quote', data),

  applyForLoan: (applicationData: Record<string, unknown>) =>
    post<LoanApplication>('/loan/apply', applicationData),

  getMyLoans: () =>
    apiRequest<{ profile: SMEProfile; applications: LoanApplication[]; active_loans: Loan[] }>('/loan/my-loans'),

  repayLoan: (loanId: string, amount?: number) =>
    post<{ loan: Loan; transaction: ChainTransaction }>(`/loan/details/${loanId}/repay`, amount ? { amount } : {}),

  // Corporate endpoints
  getLoanApplications: (filters: Record<string, string> = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest<{
      applications: LoanApplication[];
      pagination: { current_page: number; total_pages: number; total_applications: number };
    }>(`/loan/applications${queryParams ? `?${queryParams}` : ''}`);
  },

  approveLoan: (applicationId: string, approvalData: Record<string, number> = {}) =>
    patch<{ application: LoanApplication; loan_details: Loan }>(`/loan/${applicationId}/approve`, approvalData),

  rejectLoan: (applicationId: string, rejectionData: { rejection_reason: string }) =>
    patch<LoanApplication>(`/loan/${applicationId}/reject`, rejectionData),

  getPortfolio: () => apiRequest<Portfolio>('/loan/portfolio'),

  getLeaderboard: () => apiRequest<LeaderboardEntry[]>('/loan/leaderboard'),

  depositFunds: (amount: number) =>
    post<{ corporate: CorporateProfile; transaction: ChainTransaction }>('/loan/treasury/deposit', { amount }),

  // Common endpoints
  getLoanDetails: (loanId: string) => apiRequest<Loan>(`/loan/details/${loanId}`),

  sendMessage: (loanId: string, message: string) =>
    post<LoanMessage[]>(`/loan/details/${loanId}/messages`, { message })
};

export const healthCheck = () => apiRequest<{ status: string }>('/health');
