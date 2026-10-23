import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Copy, Inbox, RefreshCw, X } from 'lucide-react';
import { formatStatus, getRiskColor, getStatusColor } from '../utils/calculations';

export const Spinner: React.FC<{ className?: string }> = ({ className = 'h-5 w-5 border-white' }) => (
  <div className={`animate-spin rounded-full border-b-2 ${className}`} />
);

export const PageLoader: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-24 text-gray-600">
    <Spinner className="h-10 w-10 border-blue-600 mb-4" />
    <p>{label}</p>
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
      <AlertTriangle className="h-6 w-6 text-red-600" />
    </div>
    <p className="text-gray-900 font-medium mb-1">Something went wrong</p>
    <p className="text-gray-600 text-sm mb-4 max-w-md">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ title: string; description?: string; action?: React.ReactNode }> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <Inbox className="h-6 w-6 text-gray-400" />
    </div>
    <p className="text-gray-900 font-medium">{title}</p>
    {description && <p className="text-gray-500 text-sm mt-1 max-w-md">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const RiskBadge: React.FC<{ grade: string; className?: string }> = ({ grade, className = '' }) => (
  <span
    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${className}`}
    style={{ backgroundColor: getRiskColor(grade) }}
  >
    Grade {grade}
  </span>
);

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
    style={{ color: getStatusColor(status), backgroundColor: `${getStatusColor(status)}1A` }}
  >
    {formatStatus(status)}
  </span>
);

export const ProgressBar: React.FC<{ value: number; className?: string; barClassName?: string }> = ({
  value,
  className = 'h-2',
  barClassName = 'bg-blue-600'
}) => (
  <div className={`w-full bg-gray-200 rounded-full ${className}`}>
    <div className={`${barClassName} rounded-full h-full transition-all`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

export const CopyButton: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => {});
      }}
      className={`text-blue-600 hover:text-blue-800 ${className}`}
      title={copied ? 'Copied' : 'Copy'}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`bg-white rounded-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto shadow-xl`}>
        <div className="sticky top-0 bg-white z-10 px-6 pt-5 pb-3 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
};

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  iconClassName: string;
  children?: React.ReactNode;
}> = ({ label, value, icon: Icon, iconClassName, children }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-200">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl xl:text-3xl font-bold text-gray-900 whitespace-nowrap">{value}</p>
      </div>
      <div className={`w-10 h-10 xl:w-12 xl:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClassName}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
    {children && <div className="mt-2">{children}</div>}
  </div>
);

export const FieldError: React.FC<{ message?: string | null }> = ({ message }) =>
  message ? <p className="text-sm text-red-600 mt-1">{message}</p> : null;
