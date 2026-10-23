import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Building2, Briefcase, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/auth';
import { Spinner } from './ui';
import type { UserType } from '../types';

interface SignupFormProps {
  onSwitchMode: (mode: 'login' | 'signup') => void;
  onSuccess: (userType: UserType) => void;
  defaultUserType?: UserType | null;
}

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Services',
  'Construction', 'Transportation', 'Food & Beverage', 'Real Estate',
  'Renewable Energy', 'Agriculture & Technology', 'Finance', 'Other'
];

const STEPS = ['Account', 'Personal', 'Company'];
const CURRENT_YEAR = new Date().getFullYear();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}[0-9]$/;

const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchMode, onSuccess, defaultUserType }) => {
  const { signup } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    user_type: (defaultUserType || '') as UserType | '',
    full_name: '',
    phone_number: '',
    company_details: {
      company_name: '',
      registration_number: '',
      industry_sector: '',
      year_established: String(CURRENT_YEAR - 3),
      annual_revenue: '',
      employee_count: '',
      city: '',
      state: '',
      country: 'India',
      website_url: '',
      total_treasury_funds: ''
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCorporate = formData.user_type === 'CORPORATE';
  const details = formData.company_details;

  // Returns the first problem with the given step, or null when it's complete
  const stepError = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!formData.user_type) return 'Please choose an account type';
        if (!EMAIL_PATTERN.test(formData.email)) return 'Please enter a valid email address';
        if (formData.password.length < 6) return 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
        return null;
      case 2:
        if (formData.full_name.trim().length < 2) return 'Please enter your full name';
        if (!PHONE_PATTERN.test(formData.phone_number.trim())) return 'Please enter a valid phone number';
        return null;
      case 3: {
        if (!details.company_name.trim()) return `${isCorporate ? 'Corporation' : 'Company'} name is required`;
        if (!details.registration_number.trim()) return 'Registration number is required';
        if (isCorporate) {
          if (!(Number(details.total_treasury_funds) > 0)) return 'Please enter your treasury funds';
          return null;
        }
        const year = Number(details.year_established);
        if (!details.industry_sector) return 'Please select an industry';
        if (!Number.isInteger(year) || year < 1900 || year > CURRENT_YEAR) return `Year established must be between 1900 and ${CURRENT_YEAR}`;
        if (!(Number(details.annual_revenue) >= 0) || details.annual_revenue === '') return 'Please enter your annual revenue';
        if (!(Number(details.employee_count) >= 1)) return 'Employee count must be at least 1';
        if (!details.city.trim() || !details.state.trim()) return 'City and state are required';
        return null;
      }
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const problem = stepError(currentStep);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setLoading(true);
    try {
      const company_details: Record<string, string | number> = isCorporate
        ? {
          company_name: details.company_name.trim(),
          corporation_name: details.company_name.trim(),
          registration_number: details.registration_number.trim(),
          total_treasury_funds: Number(details.total_treasury_funds)
        }
        : {
          company_name: details.company_name.trim(),
          registration_number: details.registration_number.trim(),
          industry_sector: details.industry_sector,
          year_established: Number(details.year_established),
          annual_revenue: Number(details.annual_revenue),
          employee_count: Number(details.employee_count),
          city: details.city.trim(),
          state: details.state.trim(),
          country: details.country,
          website_url: details.website_url.trim()
        };

      const data = await signup({
        email: formData.email.trim(),
        password: formData.password,
        user_type: formData.user_type as UserType,
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        company_details
      });
      onSuccess(data.user.user_type);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setError('');

    if (name.startsWith('company_details.')) {
      const field = name.replace('company_details.', '');
      setFormData({ ...formData, company_details: { ...formData.company_details, [field]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
        <p className="text-gray-600 mt-2">Join DeFiCorp and start your financial journey</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center">
          {STEPS.map((label, index) => {
            const step = index + 1;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step ? <Check className="h-4 w-4" /> : step}
                  </div>
                  <span className="mt-2 text-xs sm:text-sm text-gray-600">{label}</span>
                </div>
                {step < STEPS.length && (
                  <div className={`flex-1 h-1 mx-2 sm:mx-4 mb-6 rounded ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Step 1: Account Details */}
        {currentStep === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { type: 'SME', icon: Briefcase, title: 'SME Business', subtitle: 'Apply for loans' },
                  { type: 'CORPORATE', icon: Building2, title: 'Corporate Lender', subtitle: 'Provide funding' }
                ] as const).map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => {
                      setError('');
                      setFormData({ ...formData, user_type: option.type });
                    }}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      formData.user_type === option.type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option.icon className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-medium">{option.title}</div>
                    <div className="text-sm text-gray-600">{option.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${inputClass} pl-10`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${inputClass} pl-10 pr-12`}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="signup-confirm" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="signup-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`${inputClass} pl-10 pr-12`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Personal Details */}
        {currentStep === 2 && (
          <>
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="signup-name"
                  type="text"
                  name="full_name"
                  autoComplete="name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`${inputClass} pl-10`}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="signup-phone"
                  type="tel"
                  name="phone_number"
                  autoComplete="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className={`${inputClass} pl-10`}
                  placeholder="+91-9876543210"
                />
              </div>
            </div>
          </>
        )}

        {/* Step 3: Company Details */}
        {currentStep === 3 && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="signup-company" className="block text-sm font-medium text-gray-700 mb-2">
                  {isCorporate ? 'Corporation Name' : 'Company Name'}
                </label>
                <input
                  id="signup-company"
                  type="text"
                  name="company_details.company_name"
                  value={details.company_name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label htmlFor="signup-reg" className="block text-sm font-medium text-gray-700 mb-2">Registration Number (CIN)</label>
                <input
                  id="signup-reg"
                  type="text"
                  name="company_details.registration_number"
                  value={details.registration_number}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. U72200KA2016PTC100001"
                />
              </div>
            </div>

            {isCorporate ? (
              <div>
                <label htmlFor="signup-treasury" className="block text-sm font-medium text-gray-700 mb-2">Treasury Funds to Allocate (₹)</label>
                <input
                  id="signup-treasury"
                  type="number"
                  min="0"
                  name="company_details.total_treasury_funds"
                  value={details.total_treasury_funds}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 10000000"
                />
                <p className="text-xs text-gray-500 mt-1">You can add more funds later from your dashboard.</p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="signup-industry" className="block text-sm font-medium text-gray-700 mb-2">Industry Sector</label>
                    <select
                      id="signup-industry"
                      name="company_details.industry_sector"
                      value={details.industry_sector}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((industry) => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="signup-year" className="block text-sm font-medium text-gray-700 mb-2">Year Established</label>
                    <input
                      id="signup-year"
                      type="number"
                      name="company_details.year_established"
                      value={details.year_established}
                      onChange={handleChange}
                      min="1900"
                      max={CURRENT_YEAR}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="signup-revenue" className="block text-sm font-medium text-gray-700 mb-2">Annual Revenue (₹)</label>
                    <input
                      id="signup-revenue"
                      type="number"
                      min="0"
                      name="company_details.annual_revenue"
                      value={details.annual_revenue}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Annual revenue"
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-employees" className="block text-sm font-medium text-gray-700 mb-2">Employee Count</label>
                    <input
                      id="signup-employees"
                      type="number"
                      min="1"
                      name="company_details.employee_count"
                      value={details.employee_count}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Number of employees"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="signup-city" className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      id="signup-city"
                      type="text"
                      name="company_details.city"
                      value={details.city}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-state" className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      id="signup-state"
                      type="text"
                      name="company_details.state"
                      value={details.state}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="State"
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setCurrentStep(currentStep - 1);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <Spinner className="h-5 w-5 border-white mr-2" />
                Creating Account...
              </div>
            ) : currentStep === 3 ? (
              'Create Account'
            ) : (
              'Next'
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onSwitchMode('login')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
