# OOPS Backend — API Reference

**Base URL:** `http://localhost:5000/api`

**Authentication:** Bearer token in `Authorization` header. Tokens are JWT with 15-minute expiry. Refresh tokens are stored in httpOnly cookies (7-day expiry).

**Response Format:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Description",
  "data": { }
}
```

**Error Format:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errors": [{ "field": "fieldName", "message": "Error for this field" }]
}
```

---

# Health

## Check Health

```
GET /api/health
```

Returns server health status including database connectivity.

**Authorization:** None

### Response `200`

```json
{
  "success": true,
  "status": "ok",
  "uptime": 12345,
  "db": "connected"
}
```

---

# Auth — Consumer

## Send OTP

```
POST /api/auth/send-otp
```

Sends a one-time password to the specified email for signup, login, or password reset.

**Authorization:** None
**Rate Limit:** 3 requests / 10 min per email

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `purpose` | enum | Yes | One of: `signup`, `login`, `reset-password`, `admin-2fa` |

### Response `200`

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresIn": 300
  }
}
```

---

## Verify OTP

```
POST /api/auth/verify-otp
```

Verifies the OTP sent to the user's email. If purpose is `login`, returns tokens directly. If `signup` or `reset-password`, returns a temporary token for the next step.

**Authorization:** None
**Rate Limit:** 5 requests / 5 min per email

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `otp` | string | Yes | 6-character OTP code |
| `purpose` | string | Yes | Must match the purpose used in send-otp |

### Response `200` — Login purpose

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "accessToken": "eyJ..."
  }
}
```

> **Note:** A `refreshToken` httpOnly cookie is also set.

### Response `200` — Signup / Reset purpose

```json
{
  "success": true,
  "message": "OTP verified",
  "data": {
    "verified": true,
    "tempToken": "eyJ..."
  }
}
```

---

## Signup

```
POST /api/auth/signup
```

Creates a new customer account. Requires a valid temp token from OTP verification.

**Authorization:** None
**Rate Limit:** 10 requests / 15 min per IP

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full name |
| `email` | string | Yes | Email address |
| `password` | string | Yes | Minimum 6 characters |
| `phone` | string | No | Phone number |
| `tempToken` | string | Yes | Temporary token from verify-otp |

### Response `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Account created successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "accessToken": "eyJ..."
  }
}
```

---

## Login

```
POST /api/auth/login
```

Authenticates a user with email and password.

**Authorization:** None
**Rate Limit:** 10 requests / 15 min per IP

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address |
| `password` | string | Yes | User's password |

### Response `200`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "accessToken": "eyJ..."
  }
}
```

> **Note:** A `refreshToken` httpOnly cookie is also set.

---

## Refresh Token

```
POST /api/auth/refresh
```

Issues a new access token using the refresh token cookie. The refresh token is rotated on each use.

**Authorization:** None (uses cookie)

### Response `200`

```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJ..."
  }
}
```

---

## Logout

```
POST /api/auth/logout
```

Clears the refresh token cookie for the current session.

**Authorization:** None

### Response `200`

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Logout All Devices

```
POST /api/auth/logout-all
```

Revokes all refresh tokens for the authenticated user across all devices.

**Authorization:** `Bearer <accessToken>`

### Response `200`

```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

---

## Reset Password

```
POST /api/auth/reset-password
```

Resets the user's password. Requires a temp token from OTP verification with `reset-password` purpose.

**Authorization:** None
**Rate Limit:** 10 requests / 15 min per IP

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address |
| `newPassword` | string | Yes | New password, minimum 6 characters |
| `tempToken` | string | Yes | Temporary token from verify-otp |

### Response `200`

```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## Get Current User

```
GET /api/auth/me
```

Returns the authenticated user's profile.

**Authorization:** `Bearer <accessToken>`

### Response `200`

```json
{
  "success": true,
  "message": "User profile",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "customer",
      "dob": null,
      "gender": null
    }
  }
}
```

---

## Update Profile

```
PATCH /api/auth/profile
```

Updates the authenticated user's profile fields.

**Authorization:** `Bearer <accessToken>`

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Full name |
| `phone` | string | No | Phone number |
| `dob` | string | No | Date of birth |
| `gender` | string | No | Gender |

### Response `200`

```json
{
  "success": true,
  "message": "Profile updated",
  "data": {
    "user": { "..." }
  }
}
```

---

## Change Password

```
POST /api/auth/change-password
```

Changes the authenticated user's password. User must re-login after this.

**Authorization:** `Bearer <accessToken>`
**Rate Limit:** 10 requests / 15 min per IP

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currentPassword` | string | Yes | Current password |
| `newPassword` | string | Yes | New password, minimum 6 characters |

### Response `200`

```json
{
  "success": true,
  "message": "Password changed. Please login again."
}
```

> **Note:** Refresh token cookie is cleared. User must login again.

---

# Auth — Admin

## Admin Login

```
POST /api/admin/auth/login
```

Initiates admin login with 2FA. After password verification, an OTP is sent to the admin's email.

**Authorization:** None
**Rate Limit:** 10 requests / 15 min per IP

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Admin email |
| `password` | string | Yes | Admin password |

### Response `200`

```json
{
  "success": true,
  "message": "OTP sent to admin email",
  "data": {
    "otpSent": true,
    "email": "admin@example.com"
  }
}
```

---

## Admin Verify OTP

```
POST /api/admin/auth/verify-otp
```

Completes admin 2FA login by verifying the OTP.

**Authorization:** None
**Rate Limit:** 5 requests / 5 min per email

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Admin email |
| `otp` | string | Yes | 6-character OTP |

### Response `200`

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "Admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "accessToken": "eyJ..."
  }
}
```

---

# Products — Public

## List Products

```
GET /api/products
```

Returns a paginated list of products. Publicly accessible, cached for 5 minutes.

**Authorization:** None
**Cache:** 5 minutes

### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | string | No | Filter by category |
| `status` | string | No | Filter by status |
| `search` | string | No | Search by name |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20) |

### Response `200`

```json
{
  "success": true,
  "message": "Products fetched",
  "data": {
    "products": [
      {
        "_id": "...",
        "name": "Classic T-Shirt",
        "price": 599,
        "status": "active",
        "category": "tshirts",
        "image": "https://res.cloudinary.com/...",
        "sizes": {
          "S": { "stock": 10 },
          "M": { "stock": 5 },
          "L": { "stock": 8 }
        }
      }
    ],
    "total": 50,
    "page": 1,
    "totalPages": 3
  }
}
```

---

## Get Product

```
GET /api/products/:id
```

Returns a single product by ID with related products populated.

**Authorization:** None
**Cache:** 5 minutes

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Product ID |

### Response `200`

```json
{
  "success": true,
  "message": "Product fetched",
  "data": {
    "product": {
      "_id": "...",
      "name": "Classic T-Shirt",
      "price": 599,
      "shortDesc": "Comfortable cotton tee",
      "description": "Full description...",
      "category": "tshirts",
      "fabric": "100% Cotton",
      "image": "https://...",
      "images": ["https://..."],
      "sizes": { "S": { "stock": 10 }, "M": { "stock": 5 } },
      "shipping": { "weight": "200g", "dimensions": "..." },
      "related": [{ "_id": "...", "name": "..." }]
    }
  }
}
```

---

# Products — Admin

> All admin product endpoints require `Bearer <accessToken>` with `role: admin`.
> **Rate Limit:** 50 requests / 1 min per IP

## List Products (Admin)

```
GET /api/admin/products
```

Returns all products (including inactive) with admin-level access.

### Query Parameters

Same as public list products.

### Response `200`

Same structure as public list products.

---

## Create Product

```
POST /api/admin/products
```

Creates a new product.

**Authorization:** `Bearer <accessToken>` (admin)

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Product name |
| `price` | number | Yes | Price (min: 0) |
| `status` | string | No | `active` or `inactive` |
| `shortDesc` | string | No | Short description |
| `description` | string | No | Full description |
| `category` | string | No | Product category |
| `sizes` | object | No | Size-stock mapping, e.g. `{ "S": { "stock": 10 } }` |
| `image` | string | No | Main image URL |
| `images` | array | No | Additional image URLs |
| `fabric` | string | No | Fabric details |
| `shipping` | object | No | Shipping info |
| `related` | array | No | Array of related product IDs |

### Response `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Product created",
  "data": {
    "product": { "..." }
  }
}
```

---

## Update Product

```
PUT /api/admin/products/:id
```

Updates an existing product. All fields are optional.

**Authorization:** `Bearer <accessToken>` (admin)

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Product ID |

### Request Body `application/json`

Same fields as Create Product — all optional.

### Response `200`

```json
{
  "success": true,
  "message": "Product updated",
  "data": {
    "product": { "..." }
  }
}
```

---

## Delete Product

```
DELETE /api/admin/products/:id
```

Deletes a product by ID.

**Authorization:** `Bearer <accessToken>` (admin)

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Product ID |

### Response `200`

```json
{
  "success": true,
  "message": "Product deleted"
}
```

---

## Update Stock

```
PATCH /api/admin/products/:id/stock
```

Updates stock levels for specific sizes of a product.

**Authorization:** `Bearer <accessToken>` (admin)

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Product ID |

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stock` | object | Yes | Size-to-quantity mapping, e.g. `{ "S": 10, "M": 5 }` |

### Response `200`

```json
{
  "success": true,
  "message": "Stock updated",
  "data": {
    "product": { "..." }
  }
}
```

---

# Orders — Consumer

> All consumer order endpoints require `Bearer <accessToken>`.

## Place Order

```
POST /api/orders
```

Places a new order. Stock is atomically deducted. COD adds a fee of 49.

**Authorization:** `Bearer <accessToken>`

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | array | Yes | Order items |
| `items[].productId` | string | Yes | Product ID |
| `items[].size` | string | Yes | Selected size (e.g. `"M"`) |
| `items[].qty` | integer | Yes | Quantity |
| `shipping` | object | Yes | Shipping address |
| `shipping.fullName` | string | Yes | Recipient name |
| `shipping.address1` | string | Yes | Address line 1 |
| `shipping.address2` | string | No | Address line 2 |
| `shipping.city` | string | Yes | City |
| `shipping.pincode` | string | Yes | 6-digit pincode |
| `shipping.phone` | string | No | 10-digit phone |
| `paymentMethod` | enum | Yes | `prepaid` or `cod` |

### Response `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Order placed",
  "data": {
    "order": {
      "_id": "...",
      "orderId": "OOPS-A1B2C3",
      "user": "...",
      "items": [
        {
          "product": "...",
          "name": "Classic T-Shirt",
          "size": "M",
          "qty": 2,
          "price": 599
        }
      ],
      "shipping": { "..." },
      "paymentMethod": "prepaid",
      "subtotal": 1198,
      "codFee": 0,
      "total": 1198,
      "status": "placed",
      "statusHistory": [
        { "status": "placed", "timestamp": "2026-05-01T..." }
      ]
    }
  }
}
```

---

## List My Orders

```
GET /api/orders
```

Returns orders belonging to the authenticated user.

**Authorization:** `Bearer <accessToken>`

### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page |
| `status` | string | No | Filter by status |

### Response `200`

```json
{
  "success": true,
  "message": "Orders fetched",
  "data": {
    "orders": [ "..." ],
    "total": 15,
    "page": 1,
    "totalPages": 2
  }
}
```

---

## Get My Order

```
GET /api/orders/:orderId
```

Returns a single order if owned by the authenticated user.

**Authorization:** `Bearer <accessToken>`

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderId` | string | Yes | Order ID |

### Response `200`

```json
{
  "success": true,
  "message": "Order fetched",
  "data": {
    "order": { "..." }
  }
}
```

---

# Orders — Admin

> All admin order endpoints require `Bearer <accessToken>` with `role: admin`.
> **Rate Limit:** 50 requests / 1 min per IP

## List All Orders

```
GET /api/admin/orders
```

Returns all orders with pagination and filtering.

### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | integer | No | Page number |
| `limit` | integer | No | Items per page |
| `status` | string | No | Filter by status |
| `search` | string | No | Search by order ID or customer |

### Response `200`

```json
{
  "success": true,
  "message": "Orders fetched",
  "data": {
    "orders": [ "..." ],
    "total": 100,
    "page": 1,
    "totalPages": 10
  }
}
```

---

## Get Order (Admin)

```
GET /api/admin/orders/:orderId
```

Returns any order by ID.

**Authorization:** `Bearer <accessToken>` (admin)

### Response `200`

```json
{
  "success": true,
  "message": "Order fetched",
  "data": {
    "order": { "..." }
  }
}
```

---

## Update Order Status

```
PATCH /api/admin/orders/:orderId/status
```

Advances the order status. Status transitions: `placed` -> `processing` -> `shipped` -> `out-for-delivery` -> `delivered`. Sends email notification if trigger is enabled.

**Authorization:** `Bearer <accessToken>` (admin)

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderId` | string | Yes | Order ID |

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum | Yes | One of: `placed`, `processing`, `shipped`, `out-for-delivery`, `delivered` |

### Response `200`

```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "order": { "..." }
  }
}
```

---

# Addresses

> All address endpoints require `Bearer <accessToken>`.

## List Addresses

```
GET /api/addresses
```

Returns all saved addresses for the authenticated user.

**Authorization:** `Bearer <accessToken>`

### Response `200`

```json
{
  "success": true,
  "message": "Addresses fetched",
  "data": {
    "addresses": [
      {
        "_id": "...",
        "fullName": "John Doe",
        "address1": "123 Main St",
        "address2": "Apt 4",
        "city": "Mumbai",
        "pincode": "400001",
        "phone": "9876543210"
      }
    ]
  }
}
```

---

## Create Address

```
POST /api/addresses
```

Saves a new address for the authenticated user.

**Authorization:** `Bearer <accessToken>`

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | Yes | Recipient name |
| `address1` | string | Yes | Address line 1 |
| `address2` | string | No | Address line 2 |
| `city` | string | Yes | City |
| `pincode` | string | Yes | 6-digit pincode |
| `phone` | string | No | 10-digit phone number |

### Response `201`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Address created",
  "data": {
    "address": { "..." }
  }
}
```

---

## Update Address

```
PUT /api/addresses/:id
```

Updates an existing address. All fields are optional.

**Authorization:** `Bearer <accessToken>`

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Address ID |

### Request Body `application/json`

Same fields as Create Address — all optional.

### Response `200`

```json
{
  "success": true,
  "message": "Address updated",
  "data": {
    "address": { "..." }
  }
}
```

---

## Delete Address

```
DELETE /api/addresses/:id
```

Deletes a saved address.

**Authorization:** `Bearer <accessToken>`

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Address ID |

### Response `200`

```json
{
  "success": true,
  "message": "Address deleted"
}
```

---

# Customers — Admin

> All customer endpoints require `Bearer <accessToken>` with `role: admin`.
> **Rate Limit:** 50 requests / 1 min per IP

## List Customers

```
GET /api/admin/customers
```

Returns a paginated list of all customers.

**Authorization:** `Bearer <accessToken>` (admin)
**Cache:** 3 minutes

### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | integer | No | Page number |
| `limit` | integer | No | Items per page |

### Response `200`

```json
{
  "success": true,
  "message": "Customers fetched",
  "data": {
    "customers": [
      {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210"
      }
    ],
    "total": 200,
    "page": 1,
    "totalPages": 20
  }
}
```

---

## Get Customer by Phone

```
GET /api/admin/customers/:phone
```

Returns a customer's profile and order history by phone number.

**Authorization:** `Bearer <accessToken>` (admin)

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | string | Yes | Customer phone number |

### Response `200`

```json
{
  "success": true,
  "message": "Customer fetched",
  "data": {
    "customer": { "..." },
    "orders": [ "..." ]
  }
}
```

---

# Dashboard — Admin

> All dashboard endpoints require `Bearer <accessToken>` with `role: admin`.
> **Rate Limit:** 50 requests / 1 min per IP

## Get Stats

```
GET /api/admin/dashboard/stats
```

Returns overall order statistics.

**Authorization:** `Bearer <accessToken>` (admin)
**Cache:** 2 minutes

### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | string | No | Time period filter |

### Response `200`

```json
{
  "success": true,
  "message": "Dashboard stats",
  "data": {
    "totalOrders": 1500,
    "totalRevenue": 875000,
    "avgOrderValue": 583
  }
}
```

---

## Revenue by Day

```
GET /api/admin/dashboard/revenue-by-day
```

Returns daily revenue breakdown.

**Authorization:** `Bearer <accessToken>` (admin)
**Cache:** 2 minutes

### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | string | No | Time period filter |

### Response `200`

```json
{
  "success": true,
  "message": "Revenue by day",
  "data": {
    "data": [
      { "date": "2026-05-01", "revenue": 25000 },
      { "date": "2026-04-30", "revenue": 31000 }
    ]
  }
}
```

---

## Status Breakdown

```
GET /api/admin/dashboard/status-breakdown
```

Returns order count grouped by status.

**Authorization:** `Bearer <accessToken>` (admin)
**Cache:** 2 minutes

### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | string | No | Time period filter |

### Response `200`

```json
{
  "success": true,
  "message": "Status breakdown",
  "data": {
    "data": {
      "placed": 50,
      "processing": 30,
      "shipped": 20,
      "out-for-delivery": 10,
      "delivered": 500
    }
  }
}
```

---

## Top Products

```
GET /api/admin/dashboard/top-products
```

Returns best-selling products by quantity and revenue.

**Authorization:** `Bearer <accessToken>` (admin)
**Cache:** 2 minutes

### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | string | No | Time period filter |
| `limit` | integer | No | Number of products to return |

### Response `200`

```json
{
  "success": true,
  "message": "Top products",
  "data": {
    "data": [
      { "productId": "...", "name": "Classic T-Shirt", "quantity": 150, "revenue": 89850 }
    ]
  }
}
```

---

## Recent Orders

```
GET /api/admin/dashboard/recent-orders
```

Returns the most recent orders.

**Authorization:** `Bearer <accessToken>` (admin)

### Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `limit` | integer | No | Number of orders (default: 10) |

### Response `200`

```json
{
  "success": true,
  "message": "Recent orders",
  "data": {
    "data": [ "..." ]
  }
}
```

---

# Settings — Admin

> All settings endpoints require `Bearer <accessToken>` with `role: admin`.
> **Rate Limit:** 50 requests / 1 min per IP

## Get Connections

```
GET /api/admin/settings/connections
```

Returns configured service connections (Gmail).

**Authorization:** `Bearer <accessToken>` (admin)
**Cache:** 10 minutes

### Response `200`

```json
{
  "success": true,
  "message": "Connections fetched",
  "data": {
    "connections": {
      "gmail": {
        "email": "shop@example.com",
        "connectedAt": "2026-04-15T...",
        "status": "connected"
      }
    }
  }
}
```

---

## Update Connection

```
PUT /api/admin/settings/connections/:id
```

Updates a service connection (e.g. Gmail OAuth credentials).

**Authorization:** `Bearer <accessToken>` (admin)

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Connection ID (e.g. `gmail`) |

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | No | Gmail address |
| `refreshToken` | string | No | OAuth refresh token |

### Response `200`

```json
{
  "success": true,
  "message": "Connection updated",
  "data": {
    "connection": {
      "email": "shop@example.com",
      "connectedAt": "2026-05-01T..."
    }
  }
}
```

---

## Delete Connection

```
DELETE /api/admin/settings/connections/:id
```

Removes a service connection.

**Authorization:** `Bearer <accessToken>` (admin)

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Connection ID (e.g. `gmail`) |

### Response `200`

```json
{
  "success": true,
  "message": "Connection removed"
}
```

---

## Get Email Triggers

```
GET /api/admin/settings/email-triggers
```

Returns which order status changes trigger email notifications.

**Authorization:** `Bearer <accessToken>` (admin)
**Cache:** 10 minutes

### Response `200`

```json
{
  "success": true,
  "message": "Email triggers fetched",
  "data": {
    "triggers": {
      "placed": true,
      "processing": false,
      "shipped": true,
      "out-for-delivery": false,
      "delivered": true
    }
  }
}
```

---

## Update Email Triggers

```
PUT /api/admin/settings/email-triggers
```

Configures which order status changes send email notifications.

**Authorization:** `Bearer <accessToken>` (admin)

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `placed` | boolean | No | Send email on order placed |
| `processing` | boolean | No | Send email on processing |
| `shipped` | boolean | No | Send email on shipped |
| `out-for-delivery` | boolean | No | Send email on out for delivery |
| `delivered` | boolean | No | Send email on delivered |

### Response `200`

```json
{
  "success": true,
  "message": "Email triggers updated",
  "data": {
    "triggers": { "..." }
  }
}
```

---

# Upload — Admin

> All upload endpoints require `Bearer <accessToken>` with `role: admin`.
> **Rate Limit:** 10 requests / 1 min per IP

## Upload Images

```
POST /api/upload
```

Uploads images to Cloudinary. Accepts up to 5 files.

**Authorization:** `Bearer <accessToken>` (admin)
**Content-Type:** `multipart/form-data`

### Request Body `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | file[] | Yes | Up to 5 image files |

### Response `200`

```json
{
  "success": true,
  "message": "Images uploaded",
  "data": {
    "uploaded": [
      { "publicId": "oops/abc123", "secure_url": "https://res.cloudinary.com/..." }
    ],
    "errors": []
  }
}
```

---

## Delete Image

```
DELETE /api/upload
```

Deletes an image from Cloudinary by public ID.

**Authorization:** `Bearer <accessToken>` (admin)

### Request Body `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `publicId` | string | Yes | Cloudinary public ID |

### Response `200`

```json
{
  "success": true,
  "message": "Image deleted"
}
```

---

# Rate Limits

| Limiter | Window | Max Requests | Scoped By | Applied To |
|---------|--------|-------------|-----------|------------|
| `authLimiter` | 15 min | 10 | IP | Login, signup, password reset |
| `otpLimiter` | 10 min | 3 | Email | Send OTP |
| `otpVerifyLimiter` | 5 min | 5 | Email | Verify OTP |
| `apiLimiter` | 1 min | 100 | IP | General API routes |
| `adminLimiter` | 1 min | 50 | IP | All admin routes |
| `uploadLimiter` | 1 min | 10 | IP | File uploads |

---

# Authentication Flow

```
1. Consumer Login:
   POST /auth/login  -->  { accessToken } + refreshToken cookie

2. Consumer OTP Login:
   POST /auth/send-otp  -->  OTP to email
   POST /auth/verify-otp (purpose: login)  -->  { accessToken } + refreshToken cookie

3. Consumer Signup:
   POST /auth/send-otp (purpose: signup)  -->  OTP to email
   POST /auth/verify-otp  -->  { tempToken }
   POST /auth/signup  -->  { accessToken } + refreshToken cookie

4. Password Reset:
   POST /auth/send-otp (purpose: reset-password)  -->  OTP to email
   POST /auth/verify-otp  -->  { tempToken }
   POST /auth/reset-password  -->  success

5. Admin Login (2FA):
   POST /admin/auth/login  -->  OTP to admin email
   POST /admin/auth/verify-otp  -->  { accessToken } + refreshToken cookie

6. Token Refresh:
   POST /auth/refresh  -->  new { accessToken } + rotated refreshToken cookie
```

---

# Models

## User
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Full name |
| `email` | String | Unique, lowercase |
| `password` | String | Hashed (bcrypt, 12 rounds) |
| `phone` | String | Optional |
| `role` | String | `customer` or `admin` |
| `dob` | Date | Optional |
| `gender` | String | Optional |

## Product
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Required |
| `price` | Number | Required, min 0 |
| `status` | String | `active` or `inactive` |
| `shortDesc` | String | Short description |
| `description` | String | Full description |
| `category` | String | Product category |
| `sizes` | Map | Size -> `{ stock: Number }` |
| `image` | String | Main image URL |
| `images` | [String] | Additional image URLs |
| `fabric` | String | Fabric details |
| `shipping` | Mixed | Shipping info |
| `related` | [ObjectId] | Refs to Product |

## Order
| Field | Type | Description |
|-------|------|-------------|
| `orderId` | String | Sequential ID (OOPS-XXXXXX) |
| `user` | ObjectId | Ref to User |
| `items` | Array | `[{ product, name, size, qty, price }]` |
| `shipping` | Object | `{ fullName, address1, address2, city, pincode, phone }` |
| `paymentMethod` | String | `prepaid` or `cod` |
| `subtotal` | Number | Sum of item prices |
| `codFee` | Number | 49 if COD, else 0 |
| `total` | Number | subtotal + codFee |
| `status` | String | Current status |
| `statusHistory` | Array | `[{ status, timestamp }]` |

## Address
| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId | Ref to User |
| `fullName` | String | Required |
| `address1` | String | Required |
| `address2` | String | Optional |
| `city` | String | Required |
| `pincode` | String | 6 digits, required |
| `phone` | String | 10 digits, optional |
