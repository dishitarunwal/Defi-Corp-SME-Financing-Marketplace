# DeFiCorp - Corporate Treasury & SME Lending Platform

A full-stack MERN platform that connects corporations with excess treasury cash to small and medium businesses (SMEs) that need fast, transparent loans. Loan agreements, disbursements and repayments are tracked on a (simulated) blockchain ledger.

## 🏗️ Architecture

```
📁 project-root/
 ┣ 📁 frontend/    → React 18 + TypeScript + Tailwind CSS + Recharts (Vite)
 ┣ 📁 backend/     → Node.js + Express + MongoDB (Mongoose) + JWT
 ┣ 📁 blockchain/  → Solidity contracts + Hardhat (lending pool, stable token, price feed)
 ┗ 📄 render.yaml  → Render blueprint for the backend
```

## 🚀 Features

### SME (borrower)
- Multi-step loan application pre-filled from the business profile
- **Instant quote** from the risk engine (grade, rate, monthly payment) while you type
- Application tracking with approval / rejection status and reasons
- Loan dashboard: amortisation schedule, repayments ("Make Payment"), on-chain ledger, messaging with the lender

### Corporate (lender)
- Portfolio dashboard: available funds, capital deployed, yield, ESG score, monthly disbursement/repayment chart, risk distribution
- **Application review**: approve with adjustable amount / rate / term, or reject with a reason
- Loan portfolio with repayment progress, industry & ESG analytics, lender leaderboard
- Add funds to the lending pool

### Platform
- JWT authentication with SME / Corporate role-based access
- Rule-based credit scoring (credit, ESG and trust scores; collateral cover and leverage drive the risk grade A–D)
- Notifications, wallet details, deep-linkable pages (hash routing - refresh and back/forward work)
- Demo data seeded automatically so every screen has realistic content

## 🔗 Blockchain integration (simulation mode)

The `blockchain/` folder contains the Solidity design (`DefiCorpLendingPool`, `MockStableToken`, `MockPriceFeed`).
The live app does **not** require a blockchain node: `backend/services/blockchainSimulator.js` produces the same
records a deployment would - a contract address per loan, transaction hashes, block numbers and gas usage for
deployment, disbursement, repayments and closure - and stores them with each loan. These are shown in the
**Blockchain** tab of every loan.

To compile or deploy the real contracts later:

```bash
cd blockchain
npm install
npm run compile                 # works without any .env
cp .env.example .env            # add ALCHEMY_URL + PRIVATE_KEY
npm run deploy:sepolia
```

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- A MongoDB database (MongoDB Atlas or local `mongod`)

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env      # set MONGODB_URI and JWT_SECRET
npm run dev               # http://localhost:5050
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5050/api
npm run dev               # http://localhost:5173
```

### 3. Demo accounts
Created automatically on first start (or run `npm run seed` in `backend/`). Password for all: `password123`

| Role | Email |
|------|-------|
| SME | daksh.mishra@techventures.com |
| Corporate | dhiti.wadhwa@financecorp.com |

The login dialog has one-click buttons for both. Set `SEED_DEMO_DATA=false` to disable seeding.

## 🔧 Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string (**required**) |
| `JWT_SECRET` | Secret used to sign tokens (**required**) |
| `JWT_EXPIRE` | Token lifetime, default `7d` |
| `PORT` | Default `5050` |
| `CORS_ORIGIN` / `FRONTEND_URL` | `*` or a comma-separated list of allowed origins |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` | Rate limiting, default 500 requests / 15 min |
| `SEED_DEMO_DATA` | `true` (default) creates demo accounts if missing |

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL, with or without the trailing `/api` |

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register (SME or Corporate, with company details)
- `POST /api/auth/login` - Log in
- `GET /api/auth/me` - Current user + profile

### SME
- `POST /api/loan/quote` - Risk grade, rate and repayment preview
- `POST /api/loan/apply` - Submit a loan application
- `GET /api/loan/my-loans` - Applications and loans
- `POST /api/loan/details/:id/repay` - Make a repayment

### Corporate
- `GET /api/loan/applications?status=pending` - Applications to review
- `PATCH /api/loan/:id/approve` - Approve (optionally with final amount / rate / term)
- `PATCH /api/loan/:id/reject` - Reject with a reason
- `GET /api/loan/portfolio` - Portfolio, loans and analytics
- `GET /api/loan/leaderboard` - Lender leaderboard
- `POST /api/loan/treasury/deposit` - Add funds to the lending pool

### Shared
- `GET /api/loan/details/:id` - Loan details (borrower or lender only)
- `POST /api/loan/details/:id/messages` - Message the other party
- `GET /api/health` - Health check

## 🔄 Loan Workflow

1. **Apply** - SME submits an application; the risk engine assigns grade A–D and a rate (8.5%–15%)
2. **Review** - Corporate lenders see pending applications with credit, ESG and collateral data
3. **Approve** - A loan contract is deployed and funds are disbursed from the lender's pool
4. **Repay** - The SME pays installments; each payment is recorded on the ledger and returned to the lender's pool
5. **Close** - When fully repaid the loan is marked completed and the contract closed

## 🚀 Deployment

### Backend (Render)
`render.yaml` defines the service (root `backend/`, health check `/api/health`). Set `MONGODB_URI` in the Render dashboard; `JWT_SECRET` is generated automatically.

### Frontend (Vercel / Netlify)
Set `VITE_API_URL` to your backend URL, build with `npm run build`, and publish `frontend/dist`. No rewrite rules are needed (hash routing).

## 🧪 Testing

```bash
cd backend && npm test        # risk engine + blockchain simulator unit tests
cd frontend && npm run lint && npm run typecheck
```

## 📄 License

MIT
