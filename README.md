# DeFiCorp - Complete Full-Stack Platform

A comprehensive blockchain-enabled corporate treasury microfinance platform that connects corporations with excess cash to small businesses needing quick loans.

## 🏗️ Architecture

```
📁 project-root/
 ┣ 📁 frontend/  → React + TypeScript + Tailwind CSS
 ┗ 📁 backend/   → Node.js + Express + MongoDB
```

## 🚀 Features

### Frontend (React + TypeScript)
- **Landing Page**: Marketing site with testimonials, features, and user onboarding
- **Corporate Dashboard**: Portfolio analytics, loan management, and leaderboard
- **SME Application**: Multi-step loan application with real-time validation
- **Loan Management**: Detailed loan oversight and communication system
- **Authentication**: JWT-based auth with role-based access control

### Backend (Node.js + Express)
- **RESTful API**: Complete CRUD operations for all entities
- **MongoDB Integration**: Mongoose ODM with proper schemas and relationships
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: SME and Corporate user types with different permissions
- **Loan Processing**: Complete loan application and approval workflow

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **Vite** for build tooling

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **helmet** for security headers
- **cors** for cross-origin requests

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd deficorp-platform
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your MongoDB connection string and JWT secret

# Start backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API URL

# Start frontend development server
npm run dev
```

### 4. MongoDB Setup
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in backend/.env

## 🔧 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/deficorp
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=DeFiCorp
VITE_APP_VERSION=1.0.0
```

## 📊 Database Schema

### Collections
- **users**: User authentication and basic info
- **smes**: SME business profiles
- **corporates**: Corporate lender profiles
- **loanapplications**: Loan application submissions
- **loandetails**: Active loan information

### Key Relationships
- User → SME/Corporate (1:1)
- SME → LoanApplication (1:many)
- Corporate → LoanDetails (1:many)
- LoanApplication → LoanDetails (1:1 when approved)

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Loan Management
- `POST /api/loan/apply` - Submit loan application (SME)
- `GET /api/loan/applications` - Get all applications (Corporate)
- `PATCH /api/loan/:id/approve` - Approve loan (Corporate)
- `PATCH /api/loan/:id/reject` - Reject loan (Corporate)
- `GET /api/loan/details/:id` - Get loan details
- `GET /api/loan/my-loans` - Get SME's loans

## 👥 User Roles & Permissions

### SME Users
- Submit loan applications
- View application status
- Manage active loans
- Communicate with lenders

### Corporate Users
- View all loan applications
- Approve/reject applications
- Manage loan portfolio
- Track performance metrics

## 🔄 Loan Workflow

1. **SME Application**: SME submits loan application with business details
2. **Risk Assessment**: System calculates risk grade based on business metrics
3. **Corporate Review**: Corporate users review applications
4. **Approval/Rejection**: Corporate decides on loan terms
5. **Loan Creation**: Approved applications become active loans
6. **Monitoring**: Both parties track loan progress and payments

## 🎨 Design System

### Colors
- **Primary**: #1E40AF (Deep Blue)
- **Secondary**: #059669 (Emerald Green)
- **Accent**: #EA580C (Orange)
- **Muted**: #F8FAFC (Light Gray)
- **Destructive**: #d4183d (Red)

### Components
- Professional fintech aesthetic
- Responsive design for all devices
- Advanced data visualizations
- Interactive forms with validation
- Real-time notifications

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas production cluster
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Update API URL in environment variables
2. Build the application: `npm run build`
3. Deploy to static hosting (Netlify, Vercel, etc.)

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📈 Performance Features

- **Pagination**: Efficient data loading for large datasets
- **Caching**: Strategic caching for improved performance
- **Validation**: Real-time form validation
- **Error Handling**: Comprehensive error management
- **Security**: JWT tokens, input sanitization, rate limiting

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **Rate Limiting**: Protection against abuse
- **Helmet**: Security headers for Express

## 📱 Mobile Responsiveness

- Fully responsive design
- Touch-friendly interfaces
- Mobile-optimized navigation
- Adaptive layouts for all screen sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**DeFiCorp** - Revolutionizing Corporate Treasury & SME Finance through blockchain technology.