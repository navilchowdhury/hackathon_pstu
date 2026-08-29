# SecurePay

Digital wallet and money-movement platform built for a MERN hackathon. Users hold a funded wallet, send BDT to other registered accounts, and inspect a full ledger. Admins monitor volume, risk, and can reverse settled transfers.

This is not a CRUD demo. Transfers run through validation, fraud scoring, a daily cap, and an atomic debit/credit so balances cannot drift if a write fails.

## Features

- Registration with bcrypt password hashing, unique wallet ID, and **100,000 BDT** opening balance for **users** (admins have no wallet funds)
- Send money requires the sender’s password on every transfer
- JWT authentication and role-based access (`user` / `admin`)
- Send money by email or wallet ID, with notes and idempotency keys
- Atomic settlement (MongoDB transactions, with a standalone fallback)
- Transaction statuses: `PENDING`, `SUCCESS`, `FAILED`, `REVERSED`
- Risk scoring (amount, new recipient, velocity, personal average)
- Daily outbound limit of **50,000 BDT**
- Searchable history, status/direction/date filters, and a detail view with security checks
- In-app notifications for send, receive, failure, reversal, and high-risk warnings
- Group expense splitting with equal shares and wallet settlement
- User analytics (Recharts) and an admin control room with reversal
- Profile name and password updates

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Recharts |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Security | JWT, bcryptjs, Helmet, rate limiting, express-validator |

## Architecture

```
frontend (React)
    │  JWT Bearer token
    ▼
Express routers → controllers (HTTP only)
                    │
                    ▼
                 services (wallet, fraud, transfer, admin)
                    │
                    ▼
                 Mongoose models  (User, Transaction, Notification, TransactionLog)
```

Business rules live in `backend/src/services`. Controllers never touch balances directly. That keeps transfer logic testable and prevents “update two documents in a route handler” mistakes.

**Transfer pipeline**

1. Resolve recipient (email or wallet ID)
2. Reject self-transfer, invalid amount, missing recipient
3. Score risk
4. Enforce daily limit and current balance
5. Debit sender only if `walletBalance >= amount`
6. Credit receiver
7. Write transaction, log, and notifications in the same unit of work
8. If any step fails after debit, credit is reversed / session is aborted

Standalone MongoDB does not support multi-document transactions. `runInTransaction` tries a session first, then falls back to the same atomic `findOneAndUpdate` operations so local development still works.

## Project structure

```
securepay/
├── backend/src/
│   ├── config/          env, database, domain constants
│   ├── models/
│   ├── middleware/      auth, admin, validation, errors
│   ├── validators/
│   ├── services/        transfer, fraud, wallet, notifications, admin
│   ├── controllers/
│   ├── routes/
│   ├── utils/
│   └── scripts/seed.js
├── frontend/src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── pages/
│   └── utils/
├── .env.example
└── README.md
```

## Installation

### Prerequisites

- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas URI

### 1. Backend

```bash
cd backend
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux
# edit JWT_SECRET and MONGODB_URI
npm install
npm run seed
npm run dev
```

API: `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

The Vite dev server proxies `/api` to port 5000. You can also set `VITE_API_URL=http://localhost:5000/api`.

### Demo accounts (after seed)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@securepay.com` | `Admin@12345` |
| User | `rahim@securepay.com` | `User@12345` |
| User | `karim@securepay.com` | `User@12345` |
| User | `sadia@securepay.com` | `User@12345` |

New self-registered users also receive 100,000 BDT.

## API documentation

All protected routes require `Authorization: Bearer <token>`.

### Authentication

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Create user + wallet |
| POST | `/api/auth/login` | Public | Issue JWT |
| GET | `/api/auth/me` | User | Current profile |
| PUT | `/api/auth/profile` | User | Update name |
| PUT | `/api/auth/password` | User | Change password |

**Register body:** `{ name, email, password }`  
**Login body:** `{ email, password }`

### Wallet

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/wallet` | Balance, totals, daily limit remaining |
| GET | `/api/wallet/history` | Recent transactions |
| GET | `/api/wallet/analytics` | Monthly sent/received |

### Transactions

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/transactions/send` | Send money |
| GET | `/api/transactions` | History (`status`, `direction`, `search`, `from`, `to`, `page`) |
| GET | `/api/transactions/:id` | Detail + logs (`:id` is Mongo id or `TXN-…`) |
| PUT | `/api/transactions/reverse/:id` | Admin reversal |

**Send body:** `{ recipient, amount, password, description?, idempotencyKey? }`  
`password` is the sender’s account password and is required on every transfer.  
`recipient` is an email or wallet ID such as `SP-A1B2C3D4E5`.

### Groups

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/groups` | Create a group (`name`, `members[]`) |
| GET | `/api/groups` | Groups you belong to |
| GET | `/api/groups/:id` | Expenses, balances, and settlement requests |
| POST | `/api/groups/:id/members` | Add a member by email or wallet ID |
| POST | `/api/groups/:id/expenses` | Log an equal-split expense |
| POST | `/api/groups/:id/settlements/:settlementId/pay` | Pay a request from your wallet (`password`) |

### Notifications

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/notifications` | Latest 50 + unread count |
| PUT | `/api/notifications/read/:id` | Mark one read |
| PUT | `/api/notifications/read/all` | Mark all read |

### Admin

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/admin/users` | Paginated users |
| GET | `/api/admin/statistics` | Volume, risk, monthly flow |
| GET | `/api/admin/transactions` | Platform ledger |

Health check: `GET /api/health`

## Security

- Passwords hashed with bcrypt (cost 12); never returned from the API
- JWT in the `Authorization` header; routes gated by `protect` / `requireAdmin`
- Helmet headers, CORS locked to the client origin, JSON body limit 10kb
- Rate limits on auth and send-money
- Input validation via express-validator
- Debit uses a conditional update (`walletBalance >= amount`) so two parallel sends cannot overdraw
- Idempotency keys stop double-submit duplicates
- Failed attempts are stored as `FAILED` so the ledger stays complete

## Engineering decisions

- **Layered backend:** HTTP stays in controllers; money movement stays in services.
- **Wallet on the user document:** Matches the required model and keeps balance reads cheap. High-volume production systems often extract a `Wallet` collection; that is a documented future step, not required here.
- **Risk as a score + level:** The UI can show `LOW/MEDIUM/HIGH` while the score explains *why*.
- **Logs are append-only:** Reversal never deletes history; status becomes `REVERSED` and a log row is added.

## Future improvements

- Refresh tokens in httpOnly cookies
- 2FA / device notifications
- Separate `Wallet` collection and double-entry ledger lines
- WebSockets for live notification badges
- CSV export and scheduled statements
- Stronger device fingerprinting in the fraud model

## License

MIT — built as a hackathon project.
