import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Activity, 
  Shield, 
  Crown, 
  Award, 
  Star,
  Eye,
  Download,
  MessageCircle,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Copy
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatPercentage, getRiskColor, getStatusColor } from '../utils/calculations';
import { leaderboardData, chartData, mockNotifications } from '../data/mockData';
import { loanAPI } fr/Users/dishita/Downloads/defi corp final /backendom '../services/api';

interface CorporateDashboardProps {
  onNavigate: (page: string) => void;
}

const CorporateDashboard: React.FC<CorporateDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'loans' | 'analytics' | 'leaderboard'>('overview');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [deployAmount, setDeployAmount] = useState('');
  const [selectedRiskGrades, setSelectedRiskGrades] = useState(['A', 'B']);

  // Portfolio metrics
  const totalFunds = 2800000;
  const totalLent = 1850000;
  const availableFunds = totalFunds - totalLent;

  const [loans, setLoans] = useState<any[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loansError, setLoansError] = useState<string | null>(null);

  const activeLoans = loans.filter(l => l.application_status === 'approved').length || 0;
  const portfolioYield = 11.9;

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'Platinum': return Crown;
      case 'Gold': return Award;
      case 'Silver': return Star;
      default: return Activity;
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Platinum': return 'text-purple-600 bg-purple-100';
      case 'Gold': return 'text-yellow-600 bg-yellow-100';
      case 'Silver': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const fetchLoans = useCallback(async (filters = {}) => {
    setLoadingLoans(true);
    setLoansError(null);
    try {
      const res = await loanAPI.getLoanApplications(filters);
      // backend returns { success: true, data: { applications, pagination } }
      const applications = res?.data?.applications || [];
      setLoans(applications);
    } catch (err: any) {
      console.error('Failed to fetch loan applications', err);
      setLoansError(err?.message || 'Failed to load loan applications');
    } finally {
      setLoadingLoans(false);
    }
  }, []);

  const handleApprove = async (application: any) => {
    const confirm = window.confirm(`Approve loan for ${application.sme_id?.company_name || 'this SME'} for ${formatCurrency(application.requested_amount)}?`);
    if (!confirm) return;
    try {
      // Use requested amount as final amount by default
      await loanAPI.approveLoan(application.application_id, { final_amount: application.requested_amount });
      // Update local state
      setLoans((prev) => prev.map(l => l.application_id === application.application_id ? { ...l, application_status: 'approved' } : l));
      alert('Loan approved successfully');
    } catch (err: any) {
      console.error('Approve error', err);
      alert(err?.message || 'Failed to approve loan');
    }
  };

  const handleReject = async (application: any) => {
    const reason = window.prompt('Enter rejection reason (min 10 characters):');
    if (!reason || reason.trim().length < 10) {
      alert('Rejection reason is required and must be at least 10 characters');
      return;
    }
    try {
      await loanAPI.rejectLoan(application.application_id, { rejection_reason: reason });
      setLoans((prev) => prev.map(l => l.application_id === application.application_id ? { ...l, application_status: 'rejected', rejection_reason: reason } : l));
      alert('Loan rejected');
    } catch (err: any) {
      console.error('Reject error', err);
      alert(err?.message || 'Failed to reject loan');
    }
  };

  useEffect(() => {
    // Load applications when dashboard mounts
    fetchLoans();
  }, [fetchLoans]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Corporate Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your treasury portfolio and track performance</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Activity className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </button>
              <button
                onClick={() => setShowWalletInfo(true)}
                className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Wallet className="h-4 w-4" />
                <span className="font-medium">Portfolio Connected</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'loans', label: 'Loan Management', icon: Shield },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'leaderboard', label: 'Leaderboard', icon: Crown }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available Funds</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(availableFunds)}</p>
                    <button 
                      onClick={() => setShowDeployModal(true)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Deploy Funds →
                    </button>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Lent</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalLent)}</p>
                    <div className="mt-2 flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(totalLent / totalFunds) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-green-600">+12%</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Loans</p>
                    <p className="text-3xl font-bold text-gray-900">{activeLoans}</p>
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="text-green-600">A: 2</span>
                      <span className="text-blue-600">B: 1</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Portfolio Yield</p>
                    <p className="text-3xl font-bold text-gray-900">{formatPercentage(portfolioYield)}</p>
                    <div className="mt-2 flex items-center">
                      <Leaf className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">ESG Score: 85</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="yield" stroke="#1E40AF" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.riskDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ grade, value }) => `${grade}: ${value}%`}
                    >
                      {chartData.riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Loan Management Tab */}
        {activeTab === 'loans' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Active Loans</h3>
              <p className="text-gray-600">Monitor and manage your loan portfolio</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingLoans ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">Loading applications...</td>
                    </tr>
                  ) : loansError ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-red-600">{loansError}</td>
                    </tr>
                  ) : loans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No loan applications found</td>
                    </tr>
                  ) : (
                    loans.map((app: any) => {
                      const businessName = app.sme?.company_name || '—';
                      const industry = app.sme?.industry_sector || '—';
                      const trustScore = app.sme?.trust_score ?? '—';
                      const esgScore = app.sme?.esg_score ?? '—';
                      const riskGrade = app.risk_grade || 'C';
                      const status = app.application_status || 'pending';
                      const amount = app.requested_amount || 0;
                      const submittedAt = app.submitted_at ? new Date(app.submitted_at).toLocaleString() : '-';

                      return (
                        <tr key={app.application_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{businessName}</div>
                              <div className="text-sm text-gray-500">{industry}</div>
                              <div className="flex items-center mt-1">
                                <CheckCircle2 className="h-3 w-3 text-green-600 mr-1" />
                                <span className="text-xs text-green-600">Verified</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(amount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white`} style={{ backgroundColor: getRiskColor(riskGrade) }}>Grade {riskGrade}</span>
                            <div className="text-xs text-gray-500 mt-1">Trust: {trustScore}%</div>
                            <div className="flex items-center mt-1"><Leaf className="h-3 w-3 text-green-600 mr-1" /><span className="text-xs text-green-600">ESG: {esgScore}</span></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full`} style={{ color: getStatusColor(status), backgroundColor: `${getStatusColor(status)}15` }}>{status}</span>
                            <div className="text-xs text-gray-400 mt-1">{submittedAt}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-500">Application</div>
                            <div className="text-sm text-gray-900">{app.application_id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button onClick={() => onNavigate('loan-management')} className="text-blue-600 hover:text-blue-800"><Eye className="h-4 w-4" /></button>
                            <button onClick={() => handleApprove(app)} disabled={status !== 'pending'} className={`px-3 py-2 rounded text-white ${status === 'pending' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}>Approve</button>
                            <button onClick={() => handleReject(app)} disabled={status !== 'pending'} className={`px-3 py-2 rounded text-white ${status === 'pending' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'}`}>Reject</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ESG Impact Analysis</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.esgImpact}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="impact" fill="#059669" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Corporate Lender Leaderboard</h3>
              <p className="text-gray-600">See how you rank among other corporate lenders</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Lent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yield</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badge</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboardData.map((company) => {
                    const BadgeIcon = getBadgeIcon(company.badge);
                    const isYourCompany = company.company === 'Your Corporation';
                    return (
                      <tr 
                        key={company.rank} 
                        className={`${isYourCompany ? 'bg-blue-50 border-2 border-blue-200' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{company.rank}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {company.company}
                              {isYourCompany && (
                                <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(company.totalLent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPercentage(company.yield)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(company.badge)}`}>
                            <BadgeIcon className="h-4 w-4 mr-1" />
                            {company.badge}
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

      {/* Deploy Funds Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Deploy Funds</h3>
              <button
                onClick={() => setShowDeployModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Deploy
                </label>
                <input
                  type="number"
                  value={deployAmount}
                  onChange={(e) => setDeployAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Grades (Select multiple)
                </label>
                <div className="flex space-x-2">
                  {['A', 'B', 'C', 'D'].map((grade) => (
                    <button
                      key={grade}
                      onClick={() => {
                        if (selectedRiskGrades.includes(grade)) {
                          setSelectedRiskGrades(selectedRiskGrades.filter(g => g !== grade));
                        } else {
                          setSelectedRiskGrades([...selectedRiskGrades, grade]);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        selectedRiskGrades.includes(grade)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Grade {grade}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Deployment Summary</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>{deployAmount ? formatCurrency(parseInt(deployAmount)) : '$0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Yield:</span>
                    <span>10.5% - 14.2% APY</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Grades:</span>
                    <span>{selectedRiskGrades.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeployModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle deployment logic
                    setShowDeployModal(false);
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                >
                  Deploy Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Info Modal */}
      {showWalletInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Portfolio Wallet</h3>
              <button
                onClick={() => setShowWalletInfo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Connection Status</span>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Address</span>
                  <button
                    onClick={() => copyToClipboard('0x742d35Cc6634C0532925a3b8D84A39D8c848')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 font-mono">0x742d35Cc6634C0532925a3b8D84A39D8c848...</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Portfolio Balance</span>
                  <span className="text-sm text-gray-600 font-semibold">{formatCurrency(totalFunds)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {mockNotifications.map((notification) => (
                <div key={notification.id} className={`p-4 rounded-lg border ${!notification.read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'payment' ? 'bg-green-500' :
                      notification.type === 'opportunity' ? 'bg-blue-500' :
                      notification.type === 'system' ? 'bg-gray-500' : 'bg-red-500'
                    }`}></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{notification.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorporateDashboard;