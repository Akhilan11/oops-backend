# Dashboard Service

Admin-only. Five aggregation endpoints that power the admin dashboard charts and stats.

## Architecture

```mermaid
graph TB
    subgraph "Routes (all cached 2 min)"
        R[dashboard.routes.js<br/><small>GET /stats<br/>GET /revenue-by-day<br/>GET /status-breakdown<br/>GET /top-products<br/>GET /recent-orders</small>]
    end

    subgraph "Controllers"
        C[dashboard.controller.js<br/><small>getStats, getRevenueByDay,<br/>getStatusBreakdown,<br/>getTopProducts, getRecentOrders</small>]
    end

    subgraph "Services"
        S[dashboard.service.js<br/><small>5 aggregation pipelines<br/>+ getDateRange() helper</small>]
    end

    R -->|auth + admin| C
    C --> S
    S -->|aggregate| O[(Orders)]
    S -->|countDocuments| P[(Products)]
    S -.->|invalidated by| ORD[order.service<br/>on create / status change]
```

## Folder Structure

```
dashboard/
  index.js                          # Barrel: exports router
  controllers/
    dashboard.controller.js         # 5 request handlers
  services/
    dashboard.service.js            # 5 aggregation pipelines + date range helper
  routes/
    dashboard.routes.js             # Admin-only, each endpoint cached at 2 min
```

No `models/` — reads from Orders and Products collections.

## Pipelines

### `getStats(period)`

Replaces admin frontend's `computeDashboardStats()`.

```js
Orders.aggregate([
  { $match: { createdAt: { $gte: startDate, $lte: now } } },
  { $group: { _id: null, totalRevenue: { $sum: "$total" }, totalOrders: { $sum: 1 }, avgOrderValue: { $avg: "$total" } } }
])
+ Order.distinct("shipping.phone", dateFilter)  → totalCustomers
+ Product.countDocuments({ status: "sold-out" }) → soldOutProducts
```

**Output:** `{ totalRevenue, totalOrders, avgOrderValue, totalCustomers, soldOutProducts }`

### `getRevenueByDay(period)`

Replaces `computeRevenueByDay()`.

```js
Orders.aggregate([
  { $match: { createdAt: dateRange } },
  { $group: { _id: { $dateToString: { format: "%d %b", date: "$createdAt" } }, revenue: { $sum: "$total" } } },
  { $sort: { date: 1 } }
])
```

**Output:** `[{ label: "01 May", revenue: 4500 }, { label: "02 May", revenue: 2300 }]`

### `getStatusBreakdown(period)`

Replaces `computeOrderStatusBreakdown()`.

```js
Orders.aggregate([
  { $match: { createdAt: dateRange } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

**Output:** `[{ status: "placed", count: 3 }, { status: "delivered", count: 5 }]`

### `getTopProducts(period, limit)`

Replaces `computeTopProducts()`.

```js
Orders.aggregate([
  { $match: { createdAt: dateRange } },
  { $unwind: "$items" },
  { $group: { _id: "$items.name", revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }, unitsSold: { $sum: "$items.qty" } } },
  { $sort: { revenue: -1 } },
  { $limit: 5 }
])
```

**Output:** `[{ name: "Classic White Tee", revenue: 7990, unitsSold: 10 }]`

### `getRecentOrders(limit)`

```js
Orders.find().sort({ createdAt: -1 }).limit(5)
  .select("orderId shipping.fullName total status createdAt items")
```

## Period Filter

All endpoints accept `?period=` query param:

| Value | Date Range |
|-------|-----------|
| `week` | Last 7 days |
| `month` (default) | Last 30 days |
| `year` | Last 365 days |
| `all` | Since epoch |

## Endpoints

| Method | Path | Auth | Cache | Description |
|--------|------|------|-------|-------------|
| GET | `/api/admin/dashboard/stats` | Admin | 2 min | Headline stats |
| GET | `/api/admin/dashboard/revenue-by-day` | Admin | 2 min | Revenue chart data |
| GET | `/api/admin/dashboard/status-breakdown` | Admin | 2 min | Status pie chart |
| GET | `/api/admin/dashboard/top-products` | Admin | 2 min | Top sellers. `?limit=5` |
| GET | `/api/admin/dashboard/recent-orders` | Admin | - | Latest orders. `?limit=5` |

Cache is invalidated by `order.service` on order creation or status change (`dashboard:*` pattern).
