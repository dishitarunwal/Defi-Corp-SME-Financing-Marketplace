export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  termInMonths: number
): number => {
  const monthlyRate = annualRate / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termInMonths)) / 
    (Math.pow(1 + monthlyRate, termInMonths) - 1);
  return Math.round(payment * 100) / 100;
};

export const calculateTotalInterest = (
  principal: number,
  annualRate: number,
  termInMonths: number
): number => {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termInMonths);
  return (monthlyPayment * termInMonths) - principal;
};

export const getRiskColor = (grade: string): string => {
  switch (grade) {
    case 'A': return '#059669';
    case 'B': return '#1E40AF';
    case 'C': return '#EA580C';
    case 'D': return '#d4183d';
    default: return '#64748B';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return '#059669';
    case 'pending': return '#EA580C';
    case 'completed': return '#1E40AF';
    case 'overdue': return '#d4183d';
    default: return '#64748B';
  }
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const truncateAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const calculateESGScore = (
  environmental: number,
  social: number,
  governance: number
): number => {
  return Math.round((environmental + social + governance) / 3);
};

export const generateContractAddress = (): string => {
  const hex = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 40; i++) {
    result += hex[Math.floor(Math.random() * 16)];
  }
  return result;
};

export const generateTransactionHash = (): string => {
  const hex = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 64; i++) {
    result += hex[Math.floor(Math.random() * 16)];
  }
  return result;
};

export const validateLoanAmount = (amount: number): string | null => {
  if (amount < 5000) return 'Minimum loan amount is $5,000';
  if (amount > 500000) return 'Maximum loan amount is $500,000';
  return null;
};

export const validateBusinessYear = (year: number): string | null => {
  const currentYear = new Date().getFullYear();
  if (year < 1900) return 'Invalid establishment year';
  if (year > currentYear) return 'Establishment year cannot be in the future';
  return null;
};