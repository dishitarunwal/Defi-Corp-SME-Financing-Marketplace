import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Building2, Briefcase } from 'lucide-react';
import { useAuth } from '../context/auth';
import { Spinner } from './ui';
import type { UserType } from '../types';

interface LoginFormProps {
  onSwitchMode: (mode: 'login' | 'signup') => void;
  onSuccess: (userType: UserType) => void;
}

const DEMO_ACCOUNTS = [
  { label: 'SME Business', icon: Briefcase, email: 'daksh.mishra@techventures.com', password: 'password123' },
  { label: 'Corporate Lender', icon: Building2, email: 'dhiti.wadhwa@financecorp.com', password: 'password123' }
];

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchMode, onSuccess }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      const data = await login(credentials);
      onSuccess(data.user.user_type);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in to your DeFiCorp account</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Spinner className="h-5 w-5 border-white mr-2" />
              Signing In...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => onSwitchMode('signup')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Sign up here
          </button>
        </p>
      </div>

      {/* Demo Credentials */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-1">Try a demo account</h4>
        <p className="text-xs text-gray-500 mb-3">Password for both: password123</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              disabled={loading}
              onClick={() => {
                setFormData({ email: account.email, password: account.password });
                submit({ email: account.email, password: account.password });
              }}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <account.icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">{account.label}</div>
                <div className="text-xs text-gray-500 truncate">{account.email}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
