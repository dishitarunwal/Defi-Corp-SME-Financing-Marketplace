import React, { useState } from 'react';
import { 
  Building2, 
  Calculator, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { calculateMonthlyPayment, formatCurrency, validateLoanAmount, validateBusinessYear } from '../utils/calculations';
import { loanAPI } from '../services/api';

interface SMEApplicationProps {
  onNavigate: (page: string) => void;
}

interface ApplicationData {
  businessName: string;
  businessType: string;
  establishedYear: number;
  ein: string;
  loanAmount: number;
  loanTerm: number;
  loanPurpose: string;
  monthlyRevenue: number;
  businessDescription: string;
  documents: File[];
  collateralDescription?: string;
  collateralValue?: number;
}

const SMEApplication: React.FC<SMEApplicationProps> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    businessName: '',
    businessType: '',
    establishedYear: 2020,
    ein: '',
    loanAmount: 50000,
    loanTerm: 24,
    loanPurpose: '',
    monthlyRevenue: 0,
    businessDescription: '',
    documents: []
    ,collateralDescription: ''
    ,collateralValue: 1000
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 1, title: 'Business Information', icon: Building2, description: 'Basic details about your business' },
    { id: 2, title: 'Loan Details', icon: Calculator, description: 'Amount, term, and purpose' },
    { id: 3, title: 'Financial Information', icon: CreditCard, description: 'Revenue and business overview' },
    { id: 4, title: 'Review & Submit', icon: FileText, description: 'Review and submit application' }
  ];

  const businessTypes = [
    'Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Services', 
    'Construction', 'Transportation', 'Food & Beverage', 'Real Estate', 'Other'
  ];

  const loanTerms = [
    { value: 6, label: '6 months' },
    { value: 12, label: '12 months' },
    { value: 18, label: '18 months' },
    { value: 24, label: '24 months' },
    { value: 36, label: '36 months' },
    { value: 48, label: '48 months' },
    { value: 60, label: '60 months' }
  ];

  const validateStep = (step: number): string[] => {
    const newErrors: string[] = [];

    switch (step) {
      case 1:
        if (!applicationData.businessName.trim()) newErrors.push('Business name is required');
        if (!applicationData.businessType) newErrors.push('Business type is required');
        if (!applicationData.ein.trim()) newErrors.push('EIN is required');
        
        const yearError = validateBusinessYear(applicationData.establishedYear);
        if (yearError) newErrors.push(yearError);
        break;

      case 2:
        const amountError = validateLoanAmount(applicationData.loanAmount);
        if (amountError) newErrors.push(amountError);
        if (!applicationData.loanPurpose.trim()) newErrors.push('Loan purpose is required');
        if (applicationData.loanPurpose.length < 50) newErrors.push('Loan purpose must be at least 50 characters');
        // Collateral checks (backend requires collateral description + value)
        if (!applicationData.collateralDescription || applicationData.collateralDescription.trim().length < 10) {
          newErrors.push('Collateral description must be at least 10 characters');
        }
        if (!applicationData.collateralValue || applicationData.collateralValue < 1000) {
          newErrors.push('Collateral value must be at least $1,000');
        }
        break;

      case 3:
        if (applicationData.monthlyRevenue <= 0) newErrors.push('Monthly revenue must be greater than 0');
        if (!applicationData.businessDescription.trim()) newErrors.push('Business description is required');
        if (applicationData.businessDescription.length < 100) newErrors.push('Business description must be at least 100 characters');
        break;
    }

    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    setErrors([]);
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setErrors([]);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const allErrors = validateStep(1).concat(validateStep(2), validateStep(3));
    if (allErrors.length > 0) {
      setErrors(allErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);
    try {
      const payload = {
        requested_amount: applicationData.loanAmount,
        loan_purpose: applicationData.loanPurpose,
        loan_term_months: applicationData.loanTerm,
        collateral_description: applicationData.collateralDescription,
        collateral_value: applicationData.collateralValue
      };

      const response = await loanAPI.applyForLoan(payload);

      if (response && response.success) {
        // optionally display application id
        alert('Application submitted successfully! You will receive a response within 24 hours.');
        onNavigate('landing');
      } else {
        // Unexpected non-success response shape
        setErrors([response?.message || 'Unexpected response from server']);
      }
    } catch (err) {
      const eAny = err as any;
      // express-validator returns errors array in eAny.details in our api helper
      if (eAny?.details && Array.isArray(eAny.details)) {
        // details may be array of objects { msg, param, ... }
        const msgs = eAny.details.map((d: any) => d.msg || JSON.stringify(d));
        setErrors(msgs);
      } else if (eAny?.message) {
        setErrors([eAny.message]);
      } else {
        setErrors(['Failed to submit application']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateRate = () => {
    // Simple rate calculation based on amount and term
    let baseRate = 8.5;
    if (applicationData.loanAmount > 200000) baseRate += 1.5;
    if (applicationData.loanTerm > 36) baseRate += 1.0;
    return baseRate;
  };

  const monthlyPayment = calculateMonthlyPayment(applicationData.loanAmount, calculateRate(), applicationData.loanTerm);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Loan Application</h1>
          <p className="text-gray-600">Fast, secure, and transparent funding for your business</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <div className="text-sm font-medium text-gray-900">{steps[currentStep - 1].title}</div>
            <div className="text-sm text-gray-500">{steps[currentStep - 1].description}</div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Steps */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Step 1: Business Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={applicationData.businessName}
                    onChange={(e) => setApplicationData({...applicationData, businessName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <select
                    value={applicationData.businessType}
                    onChange={(e) => setApplicationData({...applicationData, businessType: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select business type</option>
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Established *
                  </label>
                  <input
                    type="number"
                    value={applicationData.establishedYear}
                    onChange={(e) => setApplicationData({...applicationData, establishedYear: parseInt(e.target.value)})}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EIN (Employer Identification Number) *
                  </label>
                  <input
                    type="text"
                    value={applicationData.ein}
                    onChange={(e) => setApplicationData({...applicationData, ein: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Loan Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Loan Details</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Amount *
                  </label>
                  <input
                    type="number"
                    value={applicationData.loanAmount}
                    onChange={(e) => setApplicationData({...applicationData, loanAmount: parseInt(e.target.value)})}
                    min="5000"
                    max="500000"
                    step="1000"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Between $5,000 and $500,000</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Term *
                  </label>
                  <select
                    value={applicationData.loanTerm}
                    onChange={(e) => setApplicationData({...applicationData, loanTerm: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {loanTerms.map((term) => (
                      <option key={term.value} value={term.value}>{term.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collateral Description *
                  </label>
                  <textarea
                    value={applicationData.collateralDescription}
                    onChange={(e) => setApplicationData({...applicationData, collateralDescription: e.target.value})}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe collateral (minimum 10 characters)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collateral Value *
                  </label>
                  <input
                    type="number"
                    value={applicationData.collateralValue}
                    onChange={(e) => setApplicationData({...applicationData, collateralValue: parseInt(e.target.value)})}
                    min="1000"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter collateral value"
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum $1,000</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Purpose * (Minimum 50 characters)
                </label>
                <textarea
                  value={applicationData.loanPurpose}
                  onChange={(e) => setApplicationData({...applicationData, loanPurpose: e.target.value})}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe how you plan to use the loan funds..."
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{applicationData.loanPurpose.length}/50 characters minimum</span>
                  <span>{applicationData.loanPurpose.length > 50 ? '✓' : '✗'} Valid</span>
                </div>
              </div>

              {/* Loan Calculator */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Loan Calculation Preview</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-blue-700">Estimated Rate</div>
                    <div className="font-semibold text-blue-900">{calculateRate().toFixed(1)}% APR</div>
                  </div>
                  <div>
                    <div className="text-blue-700">Monthly Payment</div>
                    <div className="font-semibold text-blue-900">{formatCurrency(monthlyPayment)}</div>
                  </div>
                  <div>
                    <div className="text-blue-700">Total Interest</div>
                    <div className="font-semibold text-blue-900">
                      {formatCurrency((monthlyPayment * applicationData.loanTerm) - applicationData.loanAmount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Financial Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Financial Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Average Monthly Revenue *
                </label>
                <input
                  type="number"
                  value={applicationData.monthlyRevenue}
                  onChange={(e) => setApplicationData({...applicationData, monthlyRevenue: parseInt(e.target.value)})}
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter monthly revenue"
                />
                <p className="text-sm text-gray-500 mt-1">This helps us assess your ability to repay the loan</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description * (Minimum 100 characters)
                </label>
                <textarea
                  value={applicationData.businessDescription}
                  onChange={(e) => setApplicationData({...applicationData, businessDescription: e.target.value})}
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide a detailed description of your business, including services/products, target market, competitive advantages, and growth plans..."
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{applicationData.businessDescription.length}/100 characters minimum</span>
                  <span>{applicationData.businessDescription.length > 100 ? '✓' : '✗'} Valid</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Review Your Application</h2>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Business Name</h4>
                    <p className="text-gray-900">{applicationData.businessName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Business Type</h4>
                    <p className="text-gray-900">{applicationData.businessType}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Established Year</h4>
                    <p className="text-gray-900">{applicationData.establishedYear}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">EIN</h4>
                    <p className="text-gray-900">{applicationData.ein}</p>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Loan Amount</h4>
                    <p className="text-gray-900 font-semibold">{formatCurrency(applicationData.loanAmount)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Term</h4>
                    <p className="text-gray-900">{applicationData.loanTerm} months</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Monthly Payment</h4>
                    <p className="text-gray-900 font-semibold">{formatCurrency(monthlyPayment)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Loan Purpose</h4>
                  <p className="text-gray-900">{applicationData.loanPurpose}</p>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <h4 className="font-medium text-gray-700">Monthly Revenue</h4>
                  <p className="text-gray-900">{formatCurrency(applicationData.monthlyRevenue)}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Business Description</h4>
                  <p className="text-gray-900">{applicationData.businessDescription}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-green-800">Ready to Submit</h4>
                    <p className="text-sm text-green-700">Your application will be reviewed within 24 hours using our AI assessment system.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
              )}
              {currentStep === 1 && (
                <button
                  onClick={() => onNavigate('landing')}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  <span>Exit Application</span>
                </button>
              )}
            </div>

            <div>
              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMEApplication;