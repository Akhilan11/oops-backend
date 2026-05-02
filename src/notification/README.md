# Notification Service

Gmail OAuth2 email sending with two channels. Never blocks the calling operation.

## Architecture

```mermaid
graph TB
    subgraph "Callers (fire & forget)"
        OTP[otp.service<br/><small>sendOtp()</small>]
        ORD[order.service<br/><small>placeOrder()<br/>advanceStatus()</small>]
    end

    subgraph "notification.service.js"
        SYS[System Transporter<br/><small>Credentials from .env<br/>For: OTP, password reset</small>]
        TXN[Transactional Transporter<br/><small>Credentials from admin settings<br/>For: order status emails</small>]
    end

    subgraph "Templates"
        T1[otp.template.js]
        T2[order-placed.template.js]
        T3[order-shipped.template.js]
        T4[order-delivered.template.js]
    end

    OTP -->|.catch() logged| SYS
    ORD -->|.catch() logged| TXN
    SYS --> T1
    TXN --> T2
    TXN --> T3
    TXN --> T4
    SYS -->|OAuth2| GMAIL[Gmail API]
    TXN -->|OAuth2| GMAIL

    style SYS fill:#e74,color:#fff
    style TXN fill:#48f,color:#fff
```

## Folder Structure

```
notification/
  services/
    notification.service.js         # sendOtpEmail(), sendOrderEmail()
  templates/
    otp.template.js                 # OTP code with purpose label
    order-placed.template.js        # Order confirmation with item table
    order-shipped.template.js       # Shipping notification with address
    order-delivered.template.js     # Delivery confirmation
```

No routes, controllers, or models — this is an internal service called by auth and order.

## Two Email Channels

| Channel | Purpose | Credentials Source | When |
|---------|---------|-------------------|------|
| **System** | OTP, password reset | `.env` (GMAIL_CLIENT_ID, etc.) | Signup, login, forgot password, admin 2FA |
| **Transactional** | Order status updates | Admin settings (`gmail-connection` Config doc) | Order placed, shipped, delivered |

### System Transporter

```
  .env
    GMAIL_CLIENT_ID=...
    GMAIL_CLIENT_SECRET=...
    GMAIL_REFRESH_TOKEN=...
    GMAIL_FROM=noreply@oopsfashion.com
         │
         ▼
  Google OAuth2 → accessToken
         │
         ▼
  nodemailer.createTransport({ service: 'gmail', auth: { type: 'OAuth2', ... } })
```

If `.env` creds are missing, OTP emails are logged to console instead (dev mode).

### Transactional Transporter

```
  Config.findOne({ key: "gmail-connection" })
    → { email: "store@oops.com", refreshToken: "1//0..." }
         │
         ▼
  Google OAuth2 → accessToken
         │
         ▼
  nodemailer.createTransport({ ... })
```

If gmail is not connected or trigger is disabled, email is silently skipped.

## Fault Isolation

```
  order.service.placeOrder()
    │
    ├── Order.create()              ← always succeeds or throws
    │
    └── sendOrderEmail().catch()    ← failure is LOGGED, never thrown
                                       order placement still succeeds
```

Email sending NEVER blocks or fails the parent operation. Errors are caught and logged.

## Email Trigger Logic

```
  order.service calls:
    │
    ├── Config.findOne({ key: "email-triggers" })  → { placed: true, shipped: true, ... }
    ├── Config.findOne({ key: "gmail-connection" }) → { email, refreshToken } or null
    │
    └── if triggers[status] === true AND gmailConnection !== null:
          sendOrderEmail(order, status, gmailConnection)
        else:
          skip silently
```

## Templates

All templates return HTML strings. Inline CSS for email client compatibility.

| Template | Used For | Key Content |
|----------|----------|-------------|
| `otp.template.js` | OTP emails | Large 6-digit code, purpose label, 5-min expiry note |
| `order-placed.template.js` | Order confirmation | Item table, subtotal, COD fee, total, payment method |
| `order-shipped.template.js` | Shipping update | Order ID, delivery address |
| `order-delivered.template.js` | Delivery confirmation | Order ID, thank-you message |
