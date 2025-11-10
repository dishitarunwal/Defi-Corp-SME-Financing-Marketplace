export interface Loan {
  id: string;
  businessName: string;
  amount: number;
  term: number;
  interestRate: number;
  riskGrade: 'A' | 'B' | 'C' | 'D';
  trustScore: number;
  esgScore: number;
  status: 'pending' | 'active' | 'completed' | 'overdue';
  industry: string;
  purpose: string;
  monthlyPayment: number;
  remainingBalance: number;
  nextPaymentDate: string;
  contractAddress: string;
  transactionHash: string;
  establishedYear: number;
  revenue: number;
}

export interface PaymentSchedule {
  month: number;
  principal: number;
  interest: number;
  balance: number;
  status: 'paid' | 'pending' | 'overdue';
}

export interface Message {
  id: string;
  sender: 'system' | 'business' | 'lender';
  message: string;
  timestamp: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  type: 'payment' | 'opportunity' | 'system' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const mockLoans: Loan[] = [
  {
    id: '1',
    businessName: 'TechFlow Solutions',
    amount: 150000,
    term: 24,
    interestRate: 8.5,
    riskGrade: 'A',
    trustScore: 95,
    esgScore: 88,
    status: 'active',
    industry: 'Technology',
    purpose: 'Equipment purchase and team expansion',
    monthlyPayment: 7125,
    remainingBalance: 95000,
    nextPaymentDate: '2024-02-15',
    contractAddress: '0x742d35Cc6634C0532925a3b8D84A39D8c848...',
    transactionHash: '0x9f2e8b1a5c7d4f6e3a8b9c2d5e7f8a1b4c6d9e...',
    establishedYear: 2018,
    revenue: 2800000
  },
  {
    id: '2',
    businessName: 'GreenLeaf Manufacturing',
    amount: 75000,
    term: 18,
    interestRate: 12.2,
    riskGrade: 'B',
    trustScore: 82,
    esgScore: 94,
    status: 'active',
    industry: 'Manufacturing',
    purpose: 'Sustainable equipment upgrade',
    monthlyPayment: 4850,
    remainingBalance: 45000,
    nextPaymentDate: '2024-02-20',
    contractAddress: '0x8a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a...',
    transactionHash: '0x7d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d...',
    establishedYear: 2015,
    revenue: 1250000
  },
  {
    id: '3',
    businessName: 'Innovate Corp',
    amount: 200000,
    term: 36,
    interestRate: 9.8,
    riskGrade: 'A',
    trustScore: 91,
    esgScore: 76,
    status: 'active',
    industry: 'Healthcare',
    purpose: 'Research and development expansion',
    monthlyPayment: 6420,
    remainingBalance: 180000,
    nextPaymentDate: '2024-02-10',
    contractAddress: '0xf1e2d3c4b5a69788c9d0e1f2a3b4c5d6e7f8a9...',
    transactionHash: '0x3c4b5a6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a...',
    establishedYear: 2012,
    revenue: 3500000
  }
];

export const mockPaymentSchedule: PaymentSchedule[] = Array.from({ length: 24 }, (_, i) => ({
  month: i + 1,
  principal: 5500 + Math.random() * 1000,
  interest: 1625 - (i * 50),
  balance: 150000 - ((i + 1) * 6250),
  status: i < 8 ? 'paid' : 'pending'
}));

export const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'business',
    message: 'Thank you for approving our loan application. We are excited to work with DeFiCorp.',
    timestamp: '2024-01-15 10:30 AM',
    avatar: 'TF'
  },
  {
    id: '2',
    sender: 'system',
    message: 'Payment of $7,125 has been successfully processed and recorded on the blockchain.',
    timestamp: '2024-01-15 09:15 AM'
  },
  {
    id: '3',
    sender: 'business',
    message: 'Our Q4 revenue exceeded projections by 15%. We are on track for early repayment.',
    timestamp: '2024-01-10 2:45 PM',
    avatar: 'TF'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'payment',
    title: 'Payment Received',
    message: 'TechFlow Solutions made a payment of $7,125',
    timestamp: '2024-01-15 09:15 AM',
    read: false
  },
  {
    id: '2',
    type: 'opportunity',
    title: 'New Loan Application',
    message: 'Digital Marketing Pro applied for $50,000',
    timestamp: '2024-01-14 3:20 PM',
    read: false
  },
  {
    id: '3',
    type: 'system',
    title: 'Smart Contract Updated',
    message: 'Portfolio rebalancing completed successfully',
    timestamp: '2024-01-14 1:10 PM',
    read: true
  }
];

export const leaderboardData = [
  { rank: 1, company: 'MetaCorp Financial', totalLent: 5800000, yield: 14.2, badge: 'Platinum' },
  { rank: 2, company: 'BlockChain Ventures', totalLent: 4200000, yield: 12.8, badge: 'Gold' },
  { rank: 3, company: 'CryptoTech Holdings', totalLent: 3900000, yield: 13.1, badge: 'Gold' },
  { rank: 4, company: 'Your Corporation', totalLent: 2800000, yield: 11.9, badge: 'Silver' },
  { rank: 5, company: 'Digital Assets Inc', totalLent: 2100000, yield: 10.5, badge: 'Silver' }
];

export const testimonials = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    role: 'CFO',
    company: 'TechFlow Solutions',
    content: 'DeFiCorp transformed our funding process. We received approval in 24 hours and funds within 48 hours. The transparent blockchain tracking gives us complete confidence in every transaction.',
    rating: 5,
    avatar: 'SM'
  },
  {
    id: 2,
    name: 'James Rodriguez',
    role: 'Treasury Director',
    company: 'GlobalTech Corp',
    content: 'The returns on our corporate treasury through DeFiCorp have exceeded our expectations. 12.8% yield with full ESG tracking has made this our primary investment vehicle.',
    rating: 5,
    avatar: 'JR'
  },
  {
    id: 3,
    name: 'Emily Chen',
    role: 'CEO',
    company: 'GreenLeaf Manufacturing',
    content: 'As a sustainable manufacturer, DeFiCorps ESG scoring system connected us with like-minded lenders. The competitive rates and quick approval helped us scale our green initiatives.',
    rating: 5,
    avatar: 'EC'
  }
];

export const chartData = {
  performance: [
    { month: 'Aug', yield: 8.2, volume: 1200 },
    { month: 'Sep', yield: 9.1, volume: 1800 },
    { month: 'Oct', yield: 10.5, volume: 2400 },
    { month: 'Nov', yield: 11.8, volume: 2900 },
    { month: 'Dec', yield: 12.3, volume: 3200 },
    { month: 'Jan', yield: 11.9, volume: 2800 }
  ],
  riskDistribution: [
    { grade: 'A', value: 45, color: '#059669' },
    { grade: 'B', value: 30, color: '#1E40AF' },
    { grade: 'C', value: 20, color: '#EA580C' },
    { grade: 'D', value: 5, color: '#d4183d' }
  ],
  esgImpact: [
    { category: 'Green Tech', impact: 85, loans: 12 },
    { category: 'Healthcare', impact: 78, loans: 8 },
    { category: 'Education', impact: 92, loans: 6 },
    { category: 'Manufacturing', impact: 65, loans: 15 }
  ]
};