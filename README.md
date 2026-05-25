# OOPS Backend

REST API for OOPS Fashion — Node.js + Express + MongoDB Atlas.

**Live:** https://oops-backend-4ztj.onrender.com

## Tech Stack

- Node.js + Express
- MongoDB Atlas (Mongoose ODM)
- JWT auth (access + refresh tokens)
- Nodemailer + Gmail OAuth2 (transactional emails)
- Cloudinary (image uploads)
- Render (hosting)

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/send-otp` | - | Send OTP for signup/reset |
| POST | `/api/auth/verify-otp` | - | Verify OTP, get temp token |
| POST | `/api/auth/signup` | - | Create account |
| POST | `/api/auth/login` | - | Login with email/password |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| GET | `/api/auth/me` | JWT | Get current user |
| POST | `/api/auth/change-password` | JWT | Change password |
| POST | `/api/auth/reset-password` | - | Reset with temp token |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | - | List products (pagination, search, filter) |
| GET | `/api/products/:id` | - | Get product detail |
| POST | `/api/admin/products` | Admin | Create product |
| PUT | `/api/admin/products/:id` | Admin | Update product |
| DELETE | `/api/admin/products/:id` | Admin | Delete product |

### Reviews
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products/:id/reviews` | - | List reviews (pagination, rating filter) |
| GET | `/api/products/:id/reviews/summary` | - | Rating breakdown |
| POST | `/api/products/:id/reviews` | JWT | Create/update review |
| PATCH | `/api/reviews/:id` | JWT (owner) | Edit own review |
| POST | `/api/reviews/:id/helpful` | JWT | Toggle helpful |
| DELETE | `/api/admin/reviews/:id` | Admin | Delete review |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | JWT | Place order |
| GET | `/api/orders` | JWT | List user orders |
| GET | `/api/orders/:orderId` | JWT | Get order detail |
| PATCH | `/api/admin/orders/:orderId/status` | Admin | Advance order status |

### Addresses
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/addresses` | JWT | List saved addresses |
| POST | `/api/addresses` | JWT | Add address |
| PUT | `/api/addresses/:id` | JWT | Update address |
| DELETE | `/api/addresses/:id` | JWT | Delete address |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/auth/login` | - | Admin login (sends 2FA OTP) |
| POST | `/api/admin/auth/verify-otp` | - | Verify admin OTP |
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |
| GET | `/api/admin/customers` | Admin | Customer list |

## Module Structure

```
src/
├── auth/            # Auth module (signup, login, OTP, tokens)
├── product/         # Product CRUD + stock management
├── review/          # Product reviews (CRUD, helpful, summary)
├── order/           # Order placement, tracking, status
├── address/         # User saved addresses
├── customer/        # Admin customer aggregation
├── dashboard/       # Admin dashboard stats
├── notification/    # Email service (OTP, order updates)
├── settings/        # App settings (email config)
├── upload/          # Cloudinary image uploads
├── middleware/      # Auth, validation, rate limiting
└── utils/           # ApiError, ApiResponse, logger, asyncHandler
```

Each module follows: `model → service → controller → routes → index.js`

## Setup

```bash
npm install
cp .env.example .env  # Fill in your credentials
npm run dev           # Starts with nodemon on port 5001
```

## Security

- JWT with 15min access + 7d refresh (httpOnly cookie)
- Rate limiting (per-IP and per-email for OTP)
- Input validation on all routes
- Regex escaping to prevent ReDoS
- Pagination capped at 100
- CORS restricted to specific origins
- Helmet security headers
- MongoDB sanitization

## Deployment

Hosted on Render (free tier). Auto-deploys from `main` branch.
