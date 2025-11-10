import React, { useState } from 'react';
import { 
  Shield, 
  Zap, 
  TrendingUp, 
  Leaf, 
  Award, 
  Users, 
  DollarSign,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Building2,
  Briefcase,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { testimonials } from '../data/mockData';

interface LandingProps {
  onNavigate: (page: string) => void;
}

const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'corporate' | 'sme'>('corporate');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showUserTypeDialog, setShowUserTypeDialog] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const features = [
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'Immutable transaction records with smart contract automation'
    },
    {
      icon: Zap,
      title: 'AI Risk Assessment',
      description: 'Machine learning algorithms for precise creditworthiness analysis'
    },
    {
      icon: TrendingUp,
      title: 'Instant Settlement',
      description: 'Real-time fund deployment and automated payment processing'
    },
    {
      icon: Leaf,
      title: 'ESG Impact Tracking',
      description: 'Environmental and social governance scoring for sustainable lending'
    }
  ];

  const corporateBenefits = [
    { title: 'Higher Yields', description: '8-15% annual returns vs traditional treasury investments' },
    { title: 'Risk Mitigation', description: 'AI-powered diversification across multiple loan grades' },
    { title: 'ESG Impact', description: 'Support sustainable business growth with measurable impact' },
    { title: 'Instant Liquidity', description: 'Deploy and withdraw funds 24/7 with blockchain efficiency' }
  ];

  const smeBenefits = [
    { title: 'Lightning Approval', description: '24-hour application review with AI assessment' },
    { title: 'Competitive Rates', description: '5.9-18% APR based on blockchain-verified credit scoring' },
    { title: 'Transparent Process', description: 'Real-time tracking of application and payment status' },
    { title: 'Flexible Terms', description: '6-60 month terms with no prepayment penalties' }
  ];

  const faqItems = [
    {
      question: 'How does blockchain technology secure my investments?',
      answer: 'Every transaction is recorded on an immutable blockchain ledger, creating a transparent and tamper-proof record. Smart contracts automatically execute loan terms, reducing counterparty risk and ensuring compliance.'
    },
    {
      question: 'What loan amounts are available for SMEs?',
      answer: 'We offer loans ranging from $5,000 to $500,000, designed to meet various business needs from equipment purchases to working capital and expansion funding.'
    },
    {
      question: 'How is creditworthiness assessed?',
      answer: 'Our AI algorithms analyze over 200 data points including financial statements, cash flow patterns, industry trends, and blockchain transaction history to provide accurate risk assessments.'
    },
    {
      question: 'What happens if a borrower defaults?',
      answer: 'Our diversified portfolio approach and comprehensive insurance coverage protect lenders. We maintain a 99.2% recovery rate through our professional collection processes and legal partnerships.'
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center animate-float">
                <span className="text-white font-bold text-2xl">DC</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Revolutionizing Corporate Treasury & SME Finance
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect corporations with excess capital to businesses that need funding through 
              blockchain-secured, AI-powered microfinance solutions
            </p>

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-full px-4 py-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium">Blockchain Secured</span>
              </div>
              <div className="flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-full px-4 py-2">
                <Zap className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium">AI Powered</span>
              </div>
            </div>

            {/* User Selection Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
              <div className="card-hover bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20">
                <Building2 className="h-12 w-12 text-blue-400 mb-4 mx-auto" />
                <h3 className="text-2xl font-bold mb-4">Corporate Treasurers</h3>
                <p className="text-gray-300 mb-6">Deploy excess cash with 8-15% annual returns while supporting small business growth</p>
                <button 
                  onClick={() => onNavigate('corporate')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Start Lending
                </button>
              </div>
              
              <div className="card-hover bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20">
                <Briefcase className="h-12 w-12 text-green-400 mb-4 mx-auto" />
                <h3 className="text-2xl font-bold mb-4">Business Owners</h3>
                <p className="text-gray-300 mb-6">Access fast funding from $5K-$500K with competitive rates and transparent terms</p>
                <button 
                  onClick={() => onNavigate('sme')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Apply Now
                </button>
              </div>
            </div>

            {/* Platform Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">{formatCurrency(2800000000)}</div>
                <div className="text-gray-300">Loans Facilitated</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">15,000+</div>
                <div className="text-gray-300">SMEs Funded</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">99.2%</div>
                <div className="text-gray-300">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Advanced Platform Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cutting-edge technology meets traditional finance to create the future of corporate treasury management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-hover bg-white rounded-xl p-8 text-center border border-gray-200">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Portfolio Diversification</h4>
              </div>
              <p className="text-gray-600 text-sm">Automatically spread investments across risk grades and industries</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Compliance Engine</h4>
              </div>
              <p className="text-gray-600 text-sm">Built-in KYC/AML compliance with automated regulatory reporting</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Real-time Analytics</h4>
              </div>
              <p className="text-gray-600 text-sm">Live performance tracking with predictive market insights</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Tailored Benefits for Every User</h2>
            <p className="text-xl text-gray-600">Different solutions for different needs</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('corporate')}
                className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'corporate'
                    ? 'bg-white text-blue-700 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Corporate Treasurers
              </button>
              <button
                onClick={() => setActiveTab('sme')}
                className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'sme'
                    ? 'bg-white text-green-700 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Business Owners
              </button>
            </div>
          </div>

          {/* Benefits Content */}
          <div className="max-w-4xl mx-auto">
            {activeTab === 'corporate' ? (
              <div className="grid md:grid-cols-2 gap-8">
                {corporateBenefits.map((benefit, index) => (
                  <div key={index} className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="text-xl font-bold text-blue-900 mb-3">{benefit.title}</h4>
                    <p className="text-blue-700">{benefit.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {smeBenefits.map((benefit, index) => (
                  <div key={index} className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <h4 className="text-xl font-bold text-green-900 mb-3">{benefit.title}</h4>
                    <p className="text-green-700">{benefit.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sample Performance Cards */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
              <h4 className="font-bold mb-2">Portfolio Performance</h4>
              <div className="text-3xl font-bold mb-1">12.8% APY</div>
              <p className="text-green-100 text-sm">Average annual yield</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
              <h4 className="font-bold mb-2">Risk Mitigation</h4>
              <div className="text-3xl font-bold mb-1">2.1%</div>
              <p className="text-blue-100 text-sm">Historical default rate</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
              <h4 className="font-bold mb-2">ESG Impact Score</h4>
              <div className="text-3xl font-bold mb-1">87/100</div>
              <p className="text-purple-100 text-sm">Sustainability rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by Industry Leaders</h2>
            <p className="text-xl text-gray-600">Join thousands of satisfied corporate treasurers and business owners</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Award key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-xl text-gray-700 mb-6 italic">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">{testimonials[currentTestimonial].name}</div>
                    <div className="text-gray-600">{testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].company}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center items-center mt-8 space-x-4">
              <button
                onClick={prevTestimonial}
                className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about DeFiCorp</p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none"
                >
                  <div className="flex justify-between items-center">
                    <span>{item.question}</span>
                    <ChevronRight className={`h-5 w-5 transform transition-transform ${
                      expandedFAQ === index ? 'rotate-90' : ''
                    }`} />
                  </div>
                </button>
                {expandedFAQ === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Finance Operations?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the future of corporate treasury and small business lending
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowUserTypeDialog(true)}
              className="bg-white text-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>Get Started Today</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* User Type Selection Dialog */}
      {showUserTypeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Choose Your Path</h3>
              <button
                onClick={() => setShowUserTypeDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-colors">
                <div className="text-center">
                  <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Corporate Lender</h4>
                  <p className="text-gray-600 mb-6">Deploy excess treasury funds and earn 8-15% annual returns while supporting small business growth</p>
                  <button
                    onClick={() => {
                      setShowUserTypeDialog(false);
                      onNavigate('corporate');
                    }}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Start Lending
                  </button>
                </div>
              </div>

              <div className="border-2 border-green-200 rounded-xl p-6 hover:border-green-400 transition-colors">
                <div className="text-center">
                  <Briefcase className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Business Owner</h4>
                  <p className="text-gray-600 mb-6">Access fast, affordable funding from $5K to $500K with transparent terms and rapid approval</p>
                  <button
                    onClick={() => {
                      setShowUserTypeDialog(false);
                      onNavigate('sme');
                    }}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Apply for Loan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;