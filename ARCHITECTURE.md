# La Cielo Management System — Architecture Documentation

> **Last Updated:** March 2026  
> **Stack:** Node.js + Express (Backend) · React (Frontend) · MySQL on Aiven Cloud

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Project Structure](#2-project-structure)
3. [Database Schema](#3-database-schema)
4. [Authentication & RBAC](#4-authentication--rbac)
5. [API Reference](#5-api-reference)
   - [Auth](#auth---apiauthpath)
   - [Bar](#bar---apibar)
   - [Kitchen](#kitchen---apikitchen)
   - [Billiard](#billiard---apibilliard)
   - [Gym](#gym---apigym)
   - [Guest House](#guest-house---apiguesthouse)
   - [Expenses](#expenses---apiexpenses)
   - [Staff (Credits)](#staff--credits---apicredits)
   - [Edit Requests](#edit-requests---apirequests)
   - [Totals / Dashboard](#totals--dashboard---api)
   - [Reports](#reports---apireports)
6. [Frontend Architecture](#6-frontend-architecture)

---

## 1. System Overview

La Cielo is a multi-branch business management system that tracks daily operational data across **Bar**, **Kitchen**, **Billiard**, **Gym**, **Guest House**, and **Expenses** departments. It supports multiple branches, an approval workflow for stock edits, staff salary and penalty management, and a business performance reporting dashboard.

---

## 2. Project Structure

```
lacielo_001/
├── backend/
│   ├── server.js               # Express app + route mounting
│   ├── db.js                   # MySQL pool connection
│   ├── migrate.js              # Applies SQL migration files
│   ├── seed.js                 # Seeds the database with demo data
│   ├── middleware/
│   │   └── auth.js             # JWT cookie verification
│   ├── migrations/             # Versioned SQL migration files
│   └── routes/
│       ├── auth.js             # Login, Logout, Session Verify
│       ├── bar.js              # Bar products and stock
│       ├── kitchen.js          # Kitchen products and stock
│       ├── billiard.js         # Billiard daily records
│       ├── gym.js              # Gym daily records
│       ├── guesthouse.js       # Guest house room records
│       ├── expenses.js         # Business expenses
│       ├── credit.js           # Staff management + loans + deductions
│       ├── requests.js         # Stock edit request workflow
│       ├── totals.js           # Dashboard summary totals
│       └── reports.js          # Business performance reports
└── frontend/
    └── src/
        ├── App.js              # Routes + ProtectedRoute setup
        ├── context/
        │   └── AuthContext.js  # Global auth state + login/logout
        └── component/
            └── pages/
                ├── Home.js
                ├── Bar.js
                ├── Kitchen.js
                ├── Billiard.js
                ├── Gym.js
                ├── GuestHouse.js
                ├── Expenses.js
                ├── Credits.js       # Staff Management
                ├── EmployeeLoans.js # Employee Loan History
                ├── AdminRequests.js # Edit Request Approvals
                └── Reports.js       # Performance Dashboard
```

---

## 3. Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| `userId` | INT AUTO_INCREMENT PK | |
| `username` | VARCHAR(100) UNIQUE | Login handle |
| `password` | VARCHAR(255) | Plaintext in dev; bcrypt in prod |
| `role` | ENUM | See RBAC section below |
| `status` | ENUM(active, inactive) | |
| `branch_id` | VARCHAR(50) FK→`branch.id` | |
| `payment` | DECIMAL(10,2) | Base monthly salary |
| `created_at` | TIMESTAMP | |

### `branch`
| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(50) PK | |
| `branchName` | VARCHAR(100) | |
| `region` | VARCHAR(100) | |

### `bar_products` (and `kitchen_products` — identical schema)
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `name` | VARCHAR(100) | Product name |
| `initial_price` | DECIMAL | Cost price |
| `price` | DECIMAL | Selling price |
| `opening_stock` | INT | Carried from previous day |
| `entree` | INT | New stock received |
| `sold` | INT | Units sold |
| `date` | DATE | |
| `branch_id` | VARCHAR(50) FK | |

### `billiard`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `date` | DATE |
| `token` | DECIMAL |
| `cash` | DECIMAL |
| `cash_momo` | DECIMAL |
| `branch_id` | VARCHAR(50) FK |

### `gym`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `date` | DATE |
| `daily_people` | INT |
| `monthly_people` | INT |
| `total_people` | INT |
| `cash` | DECIMAL |
| `cash_momo` | DECIMAL |
| `branch_id` | VARCHAR(50) FK |

### `guesthouse`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `date` | DATE |
| `vip` | INT |
| `normal` | INT |
| `vip_price` | DECIMAL |
| `normal_price` | DECIMAL |
| `branch_id` | VARCHAR(50) FK |

### `expenses`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `expense_name` | VARCHAR(255) |
| `amount` | DECIMAL |
| `cost` | DECIMAL |
| `date` | DATE |
| `category` | VARCHAR(100) |
| `is_profit` | TINYINT(1) |
| `branch_id` | VARCHAR(50) FK |

### `edit_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `requester_user_id` | INT FK→`users.userId` | |
| `branch_id` | VARCHAR(50) FK | |
| `module` | VARCHAR(50) | e.g. `bar_products`, `kitchen_products` |
| `record_id` | INT | ID of the original record |
| `record_date` | DATE | Date of the original record |
| `product_name` | VARCHAR(100) | |
| `old_sold` | DECIMAL | Value before the edit |
| `new_sold` | DECIMAL | Proposed new value |
| `price` | DECIMAL | Price at time of event |
| `reason` | TEXT | Reason given by requester |
| `status` | ENUM(PENDING, APPROVED, REJECTED) | |
| `created_at` | TIMESTAMP | |

### `credits` (Deductions Ledger)
| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `user_id` | INT FK→`users.userId` | Staff member penalized |
| `amount` | DECIMAL(12,2) | Amount deducted |
| `reason` | TEXT | Auto-filled on request rejection |
| `date` | TIMESTAMP | When the deduction was applied |
| `branch_id` | VARCHAR(50) FK | |

### `employee_loans`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `employee_id` | INT FK→`users.userId` |
| `amount` | DECIMAL(12,2) |
| `reason` | TEXT |
| `loan_date` | DATE |
| `total_paid` | DECIMAL(12,2) |
| `remaining` | DECIMAL(12,2) |
| `branch_id` | VARCHAR(50) FK |
| `created_at` | TIMESTAMP |

---

## 4. Authentication & RBAC

### How It Works
1. User submits credentials to `POST /api/auth/login`.
2. Backend verifies them against the `users` table (status = `active`).
3. A **JWT** is generated and set as an **HttpOnly cookie** (`token`) valid for 24 hours.
4. The `authenticateUser` middleware verifies the cookie on every protected route and attaches `req.user = { userId, username, role, branchId }`.

### Roles & Permissions Matrix
| Role | Can SEE all branches? | Can EDIT records? | Can APPROVE requests? |
|---|---|---|---|
| `SUPER_ADMIN` | ✅ All branches | ✅ Yes | ✅ Yes |
| `ADMIN` | ✅ Own branch | ✅ Own branch | ❌ No |
| `MANAGER` | ✅ Own branch | ❌ Request only | ❌ No |
| `BAR_MAN` | ✅ Bar department | ❌ Request only | ❌ No |
| `CHIEF_KITCHEN` | ✅ Kitchen dept | ❌ Request only | ❌ No |
| `TOKEN_MAN` | ✅ Billiard dept | ✅ Own entries | ❌ No |
| `LAND_LORD` | ✅ Guesthouse dept | ✅ Own entries | ❌ No |
| `GYM` | ✅ Gym dept | ✅ Own entries | ❌ No |
| `EMPLOYEE` | 🚫 Cannot log in | — | — |

> **Branch Filtering:** All endpoints automatically restrict data to the requesting user's `branch_id` unless the user is `SUPER_ADMIN`.

---

## 5. API Reference

### Base URL: `http://localhost:5000/api`
> All requests require a valid `token` cookie (HttpOnly, set by login) unless noted as public.

---

### Auth — `/api/auth/{path}`

#### `POST /api/auth/login` *(Public)*
**Request Body:**
```json
{ "username": "superadmin1", "password": "password123" }
```
**Success `200`:**
```json
{
  "message": "Login successful",
  "user": { "userId": 1, "username": "superadmin1", "role": "SUPER_ADMIN", "branchId": "branch-001" }
}
```
Sets HttpOnly cookie `token` (24h TTL).

**Errors:**
- `400` – `{ "error": "Username and password are required" }`
- `401` – `{ "error": "Invalid username or password" }`
- `403` – `{ "error": "Access Denied. Employee accounts cannot log in." }`

---

#### `GET /api/auth/verify`
> Verifies the active session. Called on every app load.

**`200`:** `{ "user": { "userId", "username", "role", "branchId", "iat", "exp" } }`  
**`401`:** `{ "error": "Invalid or expired token" }`

---

#### `POST /api/auth/logout`
> Clears the `token` cookie.

**`200`:** `{ "message": "Logout successful" }`

---

### Bar — `/api/bar`

#### `GET /api/bar?date=YYYY-MM-DD`
> If no records exist for the date, **auto-creates** them by copying the previous day's closing stock as today's opening stock.

**`200`:**
```json
{
  "products": [
    {
      "id": 1, "name": "Primus", "initial_price": 700, "price": 1000,
      "opening_stock": 50, "entree": 10, "sold": 20, "date": "2026-03-07",
      "branch_id": "branch-001",
      "total_stock": 60, "closing_stock": 40, "total_sold": 20000, "profit": 6000
    }
  ],
  "totalEarned": 20000
}
```

> **Computed fields (server-side):**
> - `total_stock = opening_stock + entree`
> - `closing_stock = total_stock - sold`
> - `total_sold = sold * price`
> - `profit = sold * (price - initial_price)`

---

#### `POST /api/bar`
**Request Body:** `{ "name", "initial_price", "price", "opening_stock", "date" }`  
**`200`:** `{ "message": "Product added successfully", "id": 42 }`

---

#### `PUT /api/bar/stock/:id` *(SUPER_ADMIN only)*
**Request Body:** `{ "entree": 20, "sold": 15, "date": "2026-03-07" }`  
**`200`:** `{ "message": "Stock updated successfully" }`

---

#### `PUT /api/bar/price/:id` *(SUPER_ADMIN only)*
**Request Body:** `{ "initial_price": 750, "price": 1100, "date": "2026-03-07" }`  
**`200`:** `{ "message": "Price updated successfully" }`

---

#### `PUT /api/bar/edit/:id` *(SUPER_ADMIN only)*
**Request Body:** `{ "name", "initial_price", "price", "opening_stock", "date" }`  
**`200`:** `{ "message": "Product updated successfully" }`

---

### Kitchen — `/api/kitchen`

> Identical pattern to Bar. Products stored in `kitchen_products`.

#### `GET /api/kitchen?date=YYYY-MM-DD`
**`200`:**
```json
{
  "foods": [ { "id", "name", "initial_price", "price", "opening_stock", "entree", "sold", "date", "branch_id", "total_stock", "closing_stock", "total_sold", "profit" } ],
  "totalEarned": 15000,
  "totalProfit": 10000,
  "totalStockValue": 5000,
  "lowStockCount": 0
}
```

#### `POST /api/kitchen`
**Request Body:** `{ "name", "initial_price", "price", "opening_stock", "date" }`  
**`200`:** `{ "message": "Food added successfully", "id": 5 }`

#### `PUT /api/kitchen/entree/:id` *(SUPER_ADMIN only)*
**Request Body:** `{ "entree": 15, "date": "2026-03-07" }`  
**`200`:** `{ "message": "Entree updated successfully" }`

#### `PUT /api/kitchen/sold/:id` *(SUPER_ADMIN only)*
**Request Body:** `{ "sold": 8, "date": "2026-03-07" }`  
**`200`:** `{ "message": "Sold updated successfully" }`

---

### Billiard — `/api/billiard`

#### `GET /api/billiard?date=YYYY-MM-DD`
> `date` is optional.

**`200`:** Array:
```json
[{ "id": 1, "date": "2026-03-07", "token": 5000, "cash": 3000, "cash_momo": 2000, "branch_id": "branch-001", "total": 10000 }]
```
> `total = token + cash + cash_momo` (computed server-side)

#### `POST /api/billiard`
**Request Body:** `{ "date", "token", "cash", "cash_momo" }`  
**`200`:** Full inserted record with computed `total`.

#### `PUT /api/billiard/:id` *(SUPER_ADMIN only)*
**Request Body:** `{ "token", "cash", "cash_momo" }`  
**`200`:** Full updated record with computed `total`.

#### `DELETE /api/billiard/:id`
> Non-admins can only delete records from their own branch.  
**`200`:** `{ "message": "Billiard record deleted successfully" }`

---

### Gym — `/api/gym`

#### `GET /api/gym?date=YYYY-MM-DD`
**`200`:**
```json
{
  "records": [
    { "id", "date", "daily_people", "monthly_people", "total_people", "cash", "cash_momo", "branch_id" }
  ]
}
```

#### `POST /api/gym`
**Request Body:** `{ "date", "daily_people", "monthly_people", "cash", "cash_momo" }`  
> `total_people = daily_people + monthly_people` computed server-side.  
**`200`:** `{ "message": "Gym record added", "id": 3 }`

#### `PUT /api/gym/:id` *(SUPER_ADMIN only)*
**Request Body:** `{ "daily_people", "monthly_people", "cash", "cash_momo" }`  
**`200`:** `{ "message": "Gym record updated successfully" }`

#### `DELETE /api/gym/:id`
**`200`:** `{ "message": "Gym record deleted successfully" }`

---

### Guest House — `/api/guesthouse`

#### `GET /api/guesthouse?date=YYYY-MM-DD`
> `date` is **required**.

**`200`:**
```json
{
  "rooms": [
    { "id", "date", "vip": 2, "normal": 5, "vip_price": 30000, "normal_price": 15000, "branch_id" }
  ]
}
```

#### `POST /api/guesthouse`
**Request Body:** `{ "date", "vip", "normal", "vip_price", "normal_price" }`  
**`200`:** `{ "message": "Guesthouse record added", "id": 7 }`

#### `PUT /api/guesthouse/:id` *(SUPER_ADMIN only)*
**Request Body:** Any subset of `{ vip, normal, vip_price, normal_price }`.  
**`200`:** `{ "message": "Updated successfully" }`

#### `DELETE /api/guesthouse/:id`
**`200`:** `{ "message": "Deleted successfully" }`

---

### Expenses — `/api/expenses`

#### `GET /api/expenses`
**`200`:**
```json
{
  "records": [ { "id", "expense_name", "amount", "cost", "date", "category", "is_profit", "branch_id" } ],
  "totalAmount": 50000,
  "totalCost": 50000,
  "totalProfit": 0,
  "totalProfitable": 0,
  "totalUnprofitable": 1
}
```

#### `POST /api/expenses`
**Request Body:** `{ "expense_name", "amount", "cost", "date", "category", "is_profit" }`  
**`200`:** Full inserted expense record.

#### `PUT /api/expenses/:id`
**Request Body:** Same fields as POST.  
**`200`:** `{ "message": "Expense updated successfully" }`

#### `DELETE /api/expenses/:id`
**`200`:** `{ "message": "Expense deleted successfully" }`

---

### Staff & Credits — `/api/credits`

#### `GET /api/credits`
> Returns all users (staff + system users). SUPER_ADMIN sees all branches; others see their own branch only.

**`200`:**
```json
{
  "employees": [
    { "id": 1, "name": "superadmin1", "role": "SUPER_ADMIN", "payment": 200000, "branch_id": "branch-001" }
  ]
}
```

---

#### `POST /api/credits`
> Creates a new `EMPLOYEE` user (no login). Not available to `MANAGER`.

**Request Body:** `{ "name": "worker1", "payment": 80000 }`
**`200`:** `{ "id": 12, "name": "worker1", "payment": 80000, "branch_id": "branch-001" }`

**Errors:**
- `400` – `{ "error": "An employee or user with this name already exists." }`
- `403` – `{ "error": "Managers cannot add staff." }`

---

#### `GET /api/credits/:id/loans`
> Returns all cash loans for a staff member.

**`200`:** Array:
```json
[{ "id", "employee_id", "amount", "reason", "loan_date", "total_paid", "remaining", "branch_id" }]
```

---

#### `POST /api/credits/:id/loans`
> Records a new loan for a staff member.

**Request Body:** `{ "amount": 30000, "reason": "Medical", "loan_date": "2026-03-07" }`  
**`200`:** Full inserted loan record. `remaining` is set equal to `amount` on creation.

---

#### `GET /api/credits/:id/deductions`
> Returns all salary deductions logged in the `credits` ledger for a specific user.

**`200`:** Array:
```json
[{ "id", "user_id", "amount", "reason": "Deduction for rejected edit request on bar_products (ID: 7)", "date", "branch_id" }]
```

---

### Edit Requests — `/api/requests`

The change request workflow lets non-admin staff request data corrections. Super Admin approves (corrects data) or rejects (applies a salary deduction).

#### `POST /api/requests`
**Request Body:**
```json
{
  "module": "bar_products",
  "record_id": 7,
  "record_date": "2026-03-06",
  "product_name": "Primus",
  "old_sold": 20,
  "new_sold": 15,
  "price": 1000,
  "reason": "Counted again, we sold 15 not 20"
}
```
**`200`:** `{ "message": "Change Request Submitted to Super Admin" }`

---

#### `GET /api/requests` *(SUPER_ADMIN only)*
> Returns all `PENDING` edit requests with requester info.

**`200`:**
```json
{
  "requests": [
    {
      "id": 3, "requester_user_id": 4, "requester_username": "barman1", "requester_role": "BAR_MAN",
      "branch_id": "branch-001", "module": "bar_products", "record_id": 7, "record_date": "2026-03-06",
      "product_name": "Primus", "old_sold": 20, "new_sold": 15, "price": 1000,
      "reason": "Recounted", "status": "PENDING", "created_at": "2026-03-07T08:00:00Z"
    }
  ]
}
```

---

#### `GET /api/requests/count` *(SUPER_ADMIN only)*
**`200`:** `{ "count": 3 }`

---

#### `PUT /api/requests/:id/approve` *(SUPER_ADMIN only)*
> Updates `sold` in the original module table to `new_sold`. Sets status to `APPROVED`.

**`200`:** `{ "message": "Request Approved and Stock Updated!" }`

---

#### `PUT /api/requests/:id/reject` *(SUPER_ADMIN only)*
> Sets status to `REJECTED`. If `old_sold > new_sold`:
> 1. Deducts `(old_sold - new_sold) * price` from `users.payment`.
> 2. Inserts deduction log into `credits` table.

**Request Body:** `{ "rejection_reason": "Evidence does not support the claim." }` *(optional)*

**`200` (with financial loss):**
```json
{ "message": "Rejected. Deducted 5000 RWF from user's salary.", "rows_affected": 1 }
```
**`200` (no loss):**
```json
{ "message": "Rejected. No financial loss detected to deduct." }
```

---

### Totals / Dashboard — `/api`

#### `GET /api/total-money`
> All-time totals per department. Used on the Home Dashboard.

**`200`:**
```json
{
  "drinks": 1500000,
  "kitchen": 850000,
  "billiard": 250000,
  "gym": 120000,
  "guesthouse": 450000,
  "expenses": 300000
}
```
> SUPER_ADMIN sees global totals; all other roles see their own branch only.

---

### Reports — `/api/reports`

#### `GET /api/reports/branches` *(SUPER_ADMIN / ADMIN)*
**`200`:**
```json
{
  "branches": [
    { "branch_id": "branch-001", "name": "Kigali Branch" },
    { "branch_id": "branch-002", "name": "Musanze Branch" }
  ]
}
```

---

#### `GET /api/reports/performance?branch_id=ALL` *(SUPER_ADMIN / ADMIN)*

**Query Params:** `branch_id` — `ALL` (default) or a specific branch ID. ADMIN users are always locked to their own branch regardless of this param.

**Metrics Calculated:**

| Metric | Source | Formula |
|---|---|---|
| **Total Income** | Sales tables | `SUM(sold * price)` per dept |
| **Business Loss** | `edit_requests` WHERE `status='APPROVED'` AND `old_sold > new_sold` | `SUM((old_sold - new_sold) * price)` grouped by module |
| **Recovered Loss** | `credits` ledger | `SUM(amount)` grouped by staff role → mapped to dept |

**Role → Dept Mapping for Recovered Loss:**

| Role | Maps to Department |
|---|---|
| BAR_MAN, TOKEN_MAN | bar_products |
| CHIEF_KITCHEN | kitchen_products |
| GYM | gym |
| LAND_LORD | guesthouse |
| MANAGER | management |

**`200`:**
```json
{
  "summary": {
    "total_income": 3170000,
    "business_loss": 25000,
    "recovered_loss": 15000
  },
  "departments": [
    { "department": "bar_products", "income": 1500000, "business_loss": 15000, "recovered_loss": 10000 },
    { "department": "kitchen_products", "income": 850000, "business_loss": 10000, "recovered_loss": 5000 },
    { "department": "billiard", "income": 250000, "business_loss": 0, "recovered_loss": 0 },
    { "department": "gym", "income": 120000, "business_loss": 0, "recovered_loss": 0 },
    { "department": "guesthouse", "income": 450000, "business_loss": 0, "recovered_loss": 0 }
  ]
}
```

---

## 6. Frontend Architecture

### Route Map
| Path | Component | Allowed Roles |
|---|---|---|
| `/` | `Home.js` | All authenticated |
| `/bar` | `Bar.js` | SUPER_ADMIN, ADMIN, MANAGER, BAR_MAN |
| `/kitchen` | `Kitchen.js` | SUPER_ADMIN, ADMIN, MANAGER, CHIEF_KITCHEN |
| `/guesthouse` | `GuestHouse.js` | SUPER_ADMIN, ADMIN, MANAGER, LAND_LORD |
| `/gym` | `Gym.js` | SUPER_ADMIN, ADMIN, MANAGER, GYM |
| `/billiard` | `Billiard.js` | SUPER_ADMIN, ADMIN, MANAGER, TOKEN_MAN |
| `/Expenses` | `Expenses.js` | SUPER_ADMIN, ADMIN, MANAGER |
| `/credits` | `Credits.js` (Staff) | SUPER_ADMIN, ADMIN, MANAGER |
| `/employees/:id/loans` | `EmployeeLoans.js` | SUPER_ADMIN, ADMIN, MANAGER |
| `/reports` | `Reports.js` | SUPER_ADMIN, ADMIN |
| `/requests` | `AdminRequests.js` | SUPER_ADMIN |
| `/login` | `Login.js` | Public |

### Auth Flow
1. On app load, `AuthContext` calls `GET /api/auth/verify`.
2. If valid, user state is set globally via `React.createContext`.
3. `ProtectedRoute` checks `user.role` against each route's `allowedRoles`.
4. If cookie expires, user is redirected to `/login`.

### Key Design Patterns
- **Branch-Aware API Calls**: The backend automatically applies `branch_id` filtering based on the JWT; the frontend doesn't need to pass it.
- **Optimistic UI**: POST responses return the newly created record so the frontend can append to state without refetching the whole list.
- **Change Request Pattern**: Non-admin users see a "Request Change" button instead of a direct edit form. Submits to `POST /api/requests`.
- **Auto Day Carry-over**: The Bar endpoint auto-generates today's records from yesterday's closing stock if none exist for the current date.
