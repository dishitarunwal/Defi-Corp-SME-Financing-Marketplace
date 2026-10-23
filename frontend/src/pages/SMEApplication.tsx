import React, { useEffect, useState } from 'react';
import {
  Building2,
  Calculator,
  CreditCard,
  FileText,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  ShieldCheck,
  PartyPopper
} from 'lucide-react';
import { loanAPI } from '../services/api';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import {
  MAX_LOAN_AMOUNT,
  MIN_LOAN_AMOUNT,
  formatCompactCurrency,
  formatCurrency,
  validateLoanAmount
} from '../utils/calculations';
import { RiskBadge, Spinner } from '../components/ui';
import type { LoanApplication, Quote, SMEProfile } from '../types';

interface SMEApplicationProps {
  onNavigate: (page: string, param?: string) => void;
}

interface ApplicationData {
  loanAmount: string;
  loanTerm: number;
  loanPurpose: string;
  collateralDescription: string;
  collateralValue: string;
  monthlyRevenue: string;
  businessDescription: string;
}

const STEPS = [
  { id: 1, title: 'Business Profile', icon: Building2, description: 'Confirm your business details' },
  { id: 2, title: 'Loan Details', icon: Calculator, description: 'Amount, term, purpose and collateral' },
  { id: 3, title: 'Financial Information', icon: CreditCard, description: 'Revenue and business overview' },
  { id: 4, title: 'Review & Submit', icon: FileText, description: 'Review and submit application' }
];

const LOAN_TERMS = [6, 12, 18, 24, 36, 48, 60];
const inputClass = 'w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';

const SMEApplication: React.FC<SMEApplicationProps> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const sme = profile as SMEProfile | null;

  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    loanAmount: '500000',
    loanTerm: 24,
    loanPurpose: '',
    collateralDescription: '',
    collateralValue: '',
    monthlyRevenue: sme?.annual_revenue ? String(Math.round(sme.annual_revenue / 12)) : '',
    businessDescription: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitted, setSubmitted] = useState<LoanApplication | null>(null);

  const amount = Number(applicationData.loanAmount);
  const collateral = Number(applicationData.collateralValue) || 0;

  // Live quote from the risk engine (debounced)
  useEffect(() => {
    if (validateLoanAmount(amount)) {
      setQuote(null);
      return;
    }
    setQuoteLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await loanAPI.getQuote({
          requested_amount: amount,
          collateral_value: collateral,
          loan_term_months: applicationData.loanTerm
        });
        setQuote(res.data);
      } catch {
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [amount, collateral, applicationData.loanTerm]);

  const update = (field: keyof ApplicationData, value: string | number) => {
    setApplicationData((current) => ({ ...current, [field]: value }));
  };

  const validateStep = (step: number): string[] => {
    const newErrors: string[] = [];

    switch (step) {
      case 1:
        if (!sme) newErrors.push('Your business profile could not be loaded. Please sign in again.');
        break;

      case 2: {
        const amountError = validateLoanAmount(amount);
        if (amountError) newErrors.push(amountError);
        if (applicationData.loanPurpose.trim().length < 50) newErrors.push('Loan purpose must be at least 50 characters');
        if (applicationData.collateralDescription.trim().length < 10) newErrors.push('Collateral description must be at least 10 characters');
        if (!(Number(applicationData.collateralValue) >= 1000)) newErrors.push('Collateral value must be at least ₹1,000');
        break;
      }

      case 3:
        if (!(Number(applicationData.monthlyRevenue) > 0)) newErrors.push('Monthly revenue must be greater than 0');
        if (applicationData.businessDescription.trim().length < 100) newErrors.push('Business description must be at least 100 characters');
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      const res = await loanAPI.applyForLoan({
        requested_amount: amount,
        loan_term_months: applicationData.loanTerm,
        loan_purpose: applicationData.loanPurpose.trim(),
        collateral_description: applicationData.collateralDescription.trim(),
        collateral_value: Number(applicationData.collateralValue),
        monthly_revenue: Number(applicationData.monthlyRevenue),
        business_description: applicationData.businessDescription.trim()
      });
      setSubmitted(res.data);
      showToast('Application submitted successfully');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to submit application']);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-600 mb-8">
            Your request for {formatCurrency(submitted.requested_amount)} is now visible to corporate lenders on DeFiCorp.
            You'll be notified as soon as it is reviewed.
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-left space-y-3 mb-8">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Application ID</span><span className="font-mono text-gray-900 truncate ml-4">{submitted.application_id}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Risk grade</span><RiskBadge grade={submitted.risk_grade} /></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Proposed rate</span><span className="text-gray-900">{submitted.proposed_interest_rate}% APR</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Term</span><span className="text-gray-900">{submitted.loan_term_months} months</span></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onNavigate('sme-status')} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
              Track my applications
            </button>
            <button onClick={() => onNavigate('landing')} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white">
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0 ${
                  currentStep >= step.id
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="h-6 w-6" /> : <step.icon className="h-5 w-5" />}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 sm:mx-4 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-4 text-center">
            <div className="text-sm font-medium text-gray-900">{STEPS[currentStep - 1].title}</div>
            <div className="text-sm text-gray-500">{STEPS[currentStep - 1].description}</div>
          </div>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Please fix the following:</h3>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Step 1: Business Profile */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Business Profile</h2>
                <span className="inline-flex items-center gap-1 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  <ShieldCheck className="h-4 w-4" /> Verified at registration
                </span>
              </div>

              {sme ? (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { label: 'Business Name', value: sme.company_name },
                      { label: 'Registration Number', value: sme.registration_number || '—' },
                      { label: 'Industry', value: sme.industry_sector },
                      { label: 'Year Established', value: sme.year_established },
                      { label: 'Annual Revenue', value: formatCurrency(sme.annual_revenue) },
                      { label: 'Employees', value: sme.employee_count },
                      { label: 'Location', value: [sme.city, sme.state].filter(Boolean).join(', ') || '—' }
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-500">{item.label}</div>
                        <div className="font-medium text-gray-900">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Credit Score', value: sme.credit_score, color: 'bg-blue-600' },
                      { label: 'ESG Score', value: sme.esg_score, color: 'bg-green-600' },
                      { label: 'Trust Score', value: sme.trust_score, color: 'bg-purple-600' }
                    ].map((score) => (
                      <div key={score.label} className="border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500">{score.label}</div>
                        <div className="text-2xl font-bold text-gray-900">{score.value}<span className="text-sm text-gray-400">/100</span></div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div className={`${score.color} h-1.5 rounded-full`} style={{ width: `${score.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">These scores feed into the risk grade and interest rate offered on your application.</p>
                </>
              ) : (
                <p className="text-gray-600">Loading your profile...</p>
              )}
            </div>
          )}

          {/* Step 2: Loan Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Loan Details</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="loan-amount" className="block text-sm font-medium text-gray-700 mb-2">Loan Amount (₹) *</label>
                  <input
                    id="loan-amount"
                    type="number"
                    value={applicationData.loanAmount}
                    onChange={(e) => update('loanAmount', e.target.value)}
                    min={MIN_LOAN_AMOUNT}
                    max={MAX_LOAN_AMOUNT}
                    step="10000"
                    className={inputClass}
                  />
                  <p className="text-sm text-gray-500 mt-1">Between {formatCurrency(MIN_LOAN_AMOUNT)} and {formatCompactCurrency(MAX_LOAN_AMOUNT)}</p>
                </div>

                <div>
                  <label htmlFor="loan-term" className="block text-sm font-medium text-gray-700 mb-2">Loan Term *</label>
                  <select
                    id="loan-term"
                    value={applicationData.loanTerm}
                    onChange={(e) => update('loanTerm', parseInt(e.target.value, 10))}
                    className={inputClass}
                  >
                    {LOAN_TERMS.map((term) => (
                      <option key={term} value={term}>{term} months</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="loan-purpose" className="block text-sm font-medium text-gray-700 mb-2">Loan Purpose * (Minimum 50 characters)</label>
                <textarea
                  id="loan-purpose"
                  value={applicationData.loanPurpose}
                  onChange={(e) => update('loanPurpose', e.target.value)}
                  rows={4}
                  className={inputClass}
                  placeholder="Describe how you plan to use the loan funds..."
                />
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">{applicationData.loanPurpose.trim().length}/50 characters minimum</span>
                  <span className={applicationData.loanPurpose.trim().length >= 50 ? 'text-green-600' : 'text-gray-400'}>
                    {applicationData.loanPurpose.trim().length >= 50 ? '✓ Valid' : 'Keep going'}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="collateral-desc" className="block text-sm font-medium text-gray-700 mb-2">Collateral Offered *</label>
                  <input
                    id="collateral-desc"
                    type="text"
                    value={applicationData.collateralDescription}
                    onChange={(e) => update('collateralDescription', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Machinery, receivables, fixed deposit"
                  />
                </div>
                <div>
                  <label htmlFor="collateral-value" className="block text-sm font-medium text-gray-700 mb-2">Collateral Value (₹) *</label>
                  <input
                    id="collateral-value"
                    type="number"
                    min="0"
                    value={applicationData.collateralValue}
                    onChange={(e) => update('collateralValue', e.target.value)}
                    className={inputClass}
                    placeholder="Estimated market value"
                  />
                </div>
              </div>

              {/* Loan Calculator */}
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-blue-900">Instant Loan Quote</h3>
                  {quoteLoading && <Spinner className="h-4 w-4 border-blue-600" />}
                </div>
                {quote ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-blue-700">Risk Grade</div>
                      <div className="mt-1"><RiskBadge grade={quote.risk_grade} /></div>
                    </div>
                    <div>
                      <div className="text-blue-700">Estimated Rate</div>
                      <div className="font-semibold text-blue-900">{quote.proposed_interest_rate.toFixed(1)}% APR</div>
                    </div>
                    <div>
                      <div className="text-blue-700">Monthly Payment</div>
                      <div className="font-semibold text-blue-900">{formatCurrency(quote.monthly_payment)}</div>
                    </div>
                    <div>
                      <div className="text-blue-700">Total Interest</div>
                      <div className="font-semibold text-blue-900">{formatCurrency(quote.total_interest)}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-blue-700">Enter a valid loan amount to see your quote.</p>
                )}
                <p className="text-xs text-blue-700 mt-4">Tip: offering collateral worth more than the loan amount improves your grade and rate.</p>
              </div>
            </div>
          )}

          {/* Step 3: Financial Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Financial Information</h2>

              <div>
                <label htmlFor="monthly-revenue" className="block text-sm font-medium text-gray-700 mb-2">Average Monthly Revenue (₹) *</label>
                <input
                  id="monthly-revenue"
                  type="number"
                  value={applicationData.monthlyRevenue}
                  onChange={(e) => update('monthlyRevenue', e.target.value)}
                  min="0"
                  className={inputClass}
                  placeholder="Enter monthly revenue"
                />
                <p className="text-sm text-gray-500 mt-1">This helps lenders assess your ability to repay the loan</p>
              </div>

              <div>
                <label htmlFor="business-desc" className="block text-sm font-medium text-gray-700 mb-2">Business Description * (Minimum 100 characters)</label>
                <textarea
                  id="business-desc"
                  value={applicationData.businessDescription}
                  onChange={(e) => update('businessDescription', e.target.value)}
                  rows={6}
                  className={inputClass}
                  placeholder="Provide a detailed description of your business, including services/products, target market, competitive advantages, and growth plans..."
                />
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">{applicationData.businessDescription.trim().length}/100 characters minimum</span>
                  <span className={applicationData.businessDescription.trim().length >= 100 ? 'text-green-600' : 'text-gray-400'}>
                    {applicationData.businessDescription.trim().length >= 100 ? '✓ Valid' : 'Keep going'}
                  </span>
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
                    <h4 className="font-medium text-gray-700">Business</h4>
                    <p className="text-gray-900">{sme?.company_name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Industry</h4>
                    <p className="text-gray-900">{sme?.industry_sector}</p>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Loan Amount</h4>
                    <p className="text-gray-900 font-semibold">{formatCurrency(amount)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Term</h4>
                    <p className="text-gray-900">{applicationData.loanTerm} months</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Estimated Rate</h4>
                    <p className="text-gray-900">{quote ? `${quote.proposed_interest_rate}% APR` : '—'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Monthly Payment</h4>
                    <p className="text-gray-900 font-semibold">{quote ? formatCurrency(quote.monthly_payment) : '—'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Loan Purpose</h4>
                  <p className="text-gray-900">{applicationData.loanPurpose}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Collateral</h4>
                  <p className="text-gray-900">{applicationData.collateralDescription} · {formatCurrency(collateral)}</p>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <h4 className="font-medium text-gray-700">Monthly Revenue</h4>
                  <p className="text-gray-900">{formatCurrency(Number(applicationData.monthlyRevenue))}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Business Description</h4>
                  <p className="text-gray-900 whitespace-pre-line">{applicationData.businessDescription}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-800">Ready to Submit</h4>
                    <p className="text-sm text-green-700">Your application will be shared with corporate lenders for review, usually within 24 hours.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 ? (
                <button
                  onClick={handlePrevious}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('sme-status')}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
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
                      <Spinner className="h-4 w-4 border-white" />
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
