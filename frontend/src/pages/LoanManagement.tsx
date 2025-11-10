import React, { useState } from 'react';
import { 
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Shield,
  Leaf,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Download,
  MessageCircle,
  Send,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatPercentage, formatDate, truncateAddress } from '../utils/calculations';
import { mockLoans, mockPaymentSchedule, mockMessages } from '../data/mockData';

interface LoanManagementProps {
  onNavigate: (page: string) => void;
}

const LoanManagement: React.FC<LoanManagementProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'blockchain' | 'communication'>('overview');
  const [newMessage, setNewMessage] = useState('');
  
  // Using first loan as example
  const loan = mockLoans[0];

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle2;
      case 'overdue': return AlertTriangle;
      default: return Clock;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'overdue': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      // Add message logic here
      setNewMessage('');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'schedule', label: 'Payment Schedule', icon: Calendar },
    { id: 'blockchain', label: 'Blockchain', icon: Shield },
    { id: 'communication', label: 'Communication', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate('corporate')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{loan.businessName}</h1>
              <p className="text-gray-600 mt-1">{loan.industry} • {formatCurrency(loan.amount)} Loan</p>
            </div>
            
            <div className="mt-4 lg:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${
                        i < Math.floor(loan.trustScore / 20) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">Trust Score: {loan.trustScore}%</span>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium text-white`} 
                   style={{ backgroundColor: loan.riskGrade === 'A' ? '#059669' : '#1E40AF' }}>
                Grade {loan.riskGrade}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.remainingBalance)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${((loan.amount - loan.remainingBalance) / loan.amount) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Payment</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.monthlyPayment)}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Next: {formatDate(loan.nextPaymentDate)}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Interest Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(loan.interestRate)}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Fixed APR</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ESG Score</p>
                <p className="text-2xl font-bold text-gray-900">{loan.esgScore}/100</p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-green-600 mt-2">Excellent Impact</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
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

        {/* Tab Content */}
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Overview</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Industry</h4>
                    <p className="text-gray-900">{loan.industry}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Established</h4>
                    <p className="text-gray-900">{loan.establishedYear}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Annual Revenue</h4>
                    <p className="text-gray-900">{formatCurrency(loan.revenue)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Loan Purpose</h4>
                    <p className="text-gray-900">{loan.purpose}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Terms</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Principal Amount</h4>
                    <p className="text-gray-900 text-2xl font-bold">{formatCurrency(loan.amount)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Term Length</h4>
                    <p className="text-gray-900 text-2xl font-bold">{loan.term} months</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Interest Rate</h4>
                    <p className="text-gray-900 text-2xl font-bold">{formatPercentage(loan.interestRate)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Monthly Payment</h4>
                    <p className="text-gray-900 text-2xl font-bold">{formatCurrency(loan.monthlyPayment)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ESG Impact Assessment</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Environmental</span>
                      <span className="text-sm text-gray-900">85/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Social</span>
                      <span className="text-sm text-gray-900">92/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Governance</span>
                      <span className="text-sm text-gray-900">88/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Overall ESG Score</span>
                    <div className="flex items-center space-x-2">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <span className="text-lg font-bold text-green-600">{loan.esgScore}/100</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Credit Grade</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold text-white`}
                          style={{ backgroundColor: loan.riskGrade === 'A' ? '#059669' : '#1E40AF' }}>
                      Grade {loan.riskGrade}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Trust Score</span>
                    <span className="text-sm font-semibold text-gray-900">{loan.trustScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment History</span>
                    <span className="text-sm text-green-600">Excellent</span>
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
              <p className="text-gray-600">Detailed amortization schedule for this loan</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockPaymentSchedule.map((payment) => {
                    const StatusIcon = getPaymentStatusIcon(payment.status);
                    return (
                      <tr key={payment.month} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payment.principal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payment.interest)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payment.balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <StatusIcon className={`h-4 w-4 ${getPaymentStatusColor(payment.status)}`} />
                            <span className={`text-sm capitalize ${getPaymentStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
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

        {/* Blockchain Tab */}
        {activeTab === 'blockchain' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Contract Details</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Contract Address</h4>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="font-mono text-sm text-gray-900">{truncateAddress(loan.contractAddress)}</span>
                      <button
                        onClick={() => copyToClipboard(loan.contractAddress)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Transaction Hash</h4>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="font-mono text-sm text-gray-900">{truncateAddress(loan.transactionHash)}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(loan.transactionHash)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-800">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Verified on Blockchain</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Features</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-900">Multi-signature validation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-900">Automated payment processing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-900">Immutable transaction records</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-900">Real-time settlement</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Contract Deployed</span>
                  </div>
                  <span className="text-sm text-green-600">✓ Verified</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Funds Escrowed</span>
                  </div>
                  <span className="text-sm text-green-600">✓ Verified</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Payment Schedule Active</span>
                  </div>
                  <span className="text-sm text-green-600">✓ Verified</span>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Network Information</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Network:</span>
                      <span>Ethereum Mainnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Block Number:</span>
                      <span>18,542,891</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas Used:</span>
                      <span>245,891</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Communication Tab */}
        {activeTab === 'communication' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Communication History</h3>
              <p className="text-gray-600">Messages with {loan.businessName}</p>
            </div>
            
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {mockMessages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'business' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'business' ? 'bg-gray-100' : 'bg-blue-600 text-white'
                  }`}>
                    {message.sender === 'business' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {message.avatar}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{loan.businessName}</span>
                      </div>
                    )}
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${message.sender === 'business' ? 'text-gray-500' : 'text-blue-100'}`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanManagement;