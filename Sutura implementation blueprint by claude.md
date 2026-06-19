
# SUTURA: A Web-Based Tailoring Shop Tracker System

## Complete Capstone Implementation Blueprint

> **Stack:** Laravel 11 · MySQL · Next.js 14 · TypeScript · Tailwind CSS · Zustand
> **Version:** 1.0 — Capstone Edition

---

## TABLE OF CONTENTS

* [A. High-Level System Summary](https://claude.ai/chat/278a7eaf-0d3a-4537-9842-07d23059d0c9#a-high-level-system-summary)
* [B. Database Schema](https://claude.ai/chat/278a7eaf-0d3a-4537-9842-07d23059d0c9#b-database-schema)
* [C. API Design](https://claude.ai/chat/278a7eaf-0d3a-4537-9842-07d23059d0c9#c-api-design)
* [D. Laravel Backend Structure](https://claude.ai/chat/278a7eaf-0d3a-4537-9842-07d23059d0c9#d-laravel-backend-structure)
* [E. Frontend Slice Structure](https://claude.ai/chat/278a7eaf-0d3a-4537-9842-07d23059d0c9#e-frontend-slice-structure)
* [F. Permissions Matrix](https://claude.ai/chat/278a7eaf-0d3a-4537-9842-07d23059d0c9#f-permissions-matrix)
* [G. Development Phases](https://claude.ai/chat/278a7eaf-0d3a-4537-9842-07d23059d0c9#g-development-phases)
* [H. Scope Boundaries](https://claude.ai/chat/278a7eaf-0d3a-4537-9842-07d23059d0c9#h-scope-boundaries)
* [I. Capstone Defense Explanation](https://claude.ai/chat/278a7eaf-0d3a-4537-9842-07d23059d0c9#i-capstone-defense-explanation)

---

## A. HIGH-LEVEL SYSTEM SUMMARY

### What SUTURA Does

SUTURA is a **multi-tenant, subscription-gated web platform** that helps tailoring shop owners digitize their day-to-day operations — replacing paper logbooks and verbal agreements with a structured, trackable system. It manages shop registration, staff workflows, service catalogs, appointment scheduling, job/order tracking, customer measurements, and business analytics.

### System Actors

| Actor                     | Description                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| **Admin**           | Platform superuser. Approves shops, manages subscription plans, monitors the system.        |
| **Shop Owner**      | Registers their tailoring shop, manages staff, services, appointments, and views analytics. |
| **Tailoring Staff** | Handles appointments assigned to them, updates job order statuses, records measurements.    |
| **Customer**        | Books appointments, checks their own order status, views their measurements.                |

### Core System Workflows

```
[Registration Flow]
Shop Owner registers → Submits shop for review → Admin approves → Shop selects plan → Operations begin

[Operational Flow]
Customer books appointment → Staff confirms → Job order created → Status tracked (cutting → sewing → finishing → delivered)

[Management Flow]
Owner adds services / pricing / staff → Views analytics → Audit log records all actions
```

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       SUTURA SYSTEM                              │
│                                                                  │
│  ┌────────────┐     HTTP/REST     ┌──────────────────────────┐  │
│  │  Next.js   │ ──────────────► │   Laravel 11 API Server  │  │
│  │  Frontend  │ ◄──────────────  │   (PHP 8.2+)             │  │
│  │ TypeScript │   JSON Response  │                          │  │
│  │  Tailwind  │                  │  ┌────────────────────┐  │  │
│  │  Zustand   │                  │  │  Sanctum Auth      │  │  │
│  └────────────┘                  │  │  Middleware Stack  │  │  │
│                                  │  │  Policy Layer      │  │  │
│                                  │  │  Service Layer     │  │  │
│                                  │  └────────────────────┘  │  │
│                                  │            │              │  │
│                                  └────────────┼─────────────┘  │
│                                               │                 │
│                                  ┌────────────▼─────────────┐  │
│                                  │     MySQL Database        │  │
│                                  │  (14 core tables)         │  │
│                                  └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision                                  | Rationale                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Multi-tenant by shop                      | Each shop's data is scoped and isolated. Staff only access their own shop's records. |
| Subscription feature gates                | Premium features (audit logs, advanced analytics) are locked behind plan tiers.      |
| RESTful API with versioning (`/api/v1`) | Clean separation of backend and frontend; easy to extend in future.                  |
| Laravel Sanctum for auth                  | Lightweight token-based auth, ideal for SPA + API integration.                       |
| Soft deletes on key models                | Data is never truly lost; useful for audits and recovery.                            |
| Auditable trait                           | Every important mutation is logged automatically without repeating code.             |
| Service layer                             | Business logic extracted from controllers keeps code clean and testable.             |

---

## B. DATABASE SCHEMA

### Entity Relationship Overview

```
users ──< role_user >── roles
  │
  ├──< shops (owner_id)
  │     ├──< shop_subscriptions >── subscription_plans
  │     ├──< staff_profiles >── users
  │     ├──< services
  │     │     └──< service_pricing >── apparel_specializations
  │     ├──< apparel_specializations
  │     ├──< appointments >── users(customer) + services + users(staff)
  │     ├──< job_orders >── appointments + users(customer) + users(staff)
  │     │     └──< measurements
  │     └──< audit_logs
  └──< measurements (as customer)
```

---

### Table 1: `users`

```sql
CREATE TABLE users (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(191) NOT NULL,
    email             VARCHAR(191) NOT NULL,
    password          VARCHAR(255) NOT NULL,
    phone             VARCHAR(20) NULL,
    email_verified_at TIMESTAMP NULL,
    remember_token    VARCHAR(100) NULL,
    created_at        TIMESTAMP NULL,
    updated_at        TIMESTAMP NULL,
    deleted_at        TIMESTAMP NULL,
    UNIQUE KEY unique_email (email),
    INDEX idx_users_email (email)
);
```

---

### Table 2: `roles`

```sql
CREATE TABLE roles (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL,
    UNIQUE KEY unique_role_name (name)
);
-- Seeded values: admin | shop_owner | staff | customer
```

---

### Table 3: `role_user` (pivot)

```sql
CREATE TABLE role_user (
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

---

### Table 4: `shops`

```sql
CREATE TABLE shops (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id         BIGINT UNSIGNED NOT NULL,
    name             VARCHAR(191) NOT NULL,
    slug             VARCHAR(191) NOT NULL,
    description      TEXT NULL,
    address          VARCHAR(255) NOT NULL,
    city             VARCHAR(100) NOT NULL,
    province         VARCHAR(100) NOT NULL,
    postal_code      VARCHAR(20) NULL,
    phone            VARCHAR(20) NULL,
    email            VARCHAR(191) NULL,
    logo_path        VARCHAR(255) NULL,
    status           ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
    rejection_reason TEXT NULL,
    approved_at      TIMESTAMP NULL,
    approved_by      BIGINT UNSIGNED NULL,
    created_at       TIMESTAMP NULL,
    updated_at       TIMESTAMP NULL,
    deleted_at       TIMESTAMP NULL,
    UNIQUE KEY unique_shop_slug (slug),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_shops_owner (owner_id),
    INDEX idx_shops_status (status)
);
```

---

### Table 5: `subscription_plans`

```sql
CREATE TABLE subscription_plans (
    id                         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                       VARCHAR(50) NOT NULL,
    slug                       VARCHAR(50) NOT NULL,
    description                TEXT NULL,
    price_monthly              DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_yearly               DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_staff                  INT NOT NULL DEFAULT 3,      -- -1 = unlimited
    max_services               INT NOT NULL DEFAULT 10,     -- -1 = unlimited
    max_appointments_per_month INT NOT NULL DEFAULT 50,     -- -1 = unlimited
    features                   JSON NULL,
    is_active                  TINYINT(1) NOT NULL DEFAULT 1,
    created_at                 TIMESTAMP NULL,
    updated_at                 TIMESTAMP NULL,
    UNIQUE KEY unique_plan_slug (slug)
);
-- Seeded: Basic (₱0) | Pro (₱499/mo) | Premium (₱999/mo)
```

---

### Table 6: `shop_subscriptions`

```sql
CREATE TABLE shop_subscriptions (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id       BIGINT UNSIGNED NOT NULL,
    plan_id       BIGINT UNSIGNED NOT NULL,
    status        ENUM('trial','active','expired','cancelled') NOT NULL DEFAULT 'trial',
    starts_at     TIMESTAMP NOT NULL,
    ends_at       TIMESTAMP NULL,
    trial_ends_at TIMESTAMP NULL,
    cancelled_at  TIMESTAMP NULL,
    created_at    TIMESTAMP NULL,
    updated_at    TIMESTAMP NULL,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    INDEX idx_subscriptions_shop (shop_id),
    INDEX idx_subscriptions_status (status)
);
```

---

### Table 7: `staff_profiles`

```sql
CREATE TABLE staff_profiles (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT UNSIGNED NOT NULL,
    shop_id        BIGINT UNSIGNED NOT NULL,
    role           ENUM('head_tailor','tailor','assistant','receptionist') NOT NULL DEFAULT 'tailor',
    specialization VARCHAR(255) NULL,
    bio            TEXT NULL,
    is_active      TINYINT(1) NOT NULL DEFAULT 1,
    hired_at       DATE NULL,
    created_at     TIMESTAMP NULL,
    updated_at     TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_shop (user_id, shop_id),
    INDEX idx_staff_shop (shop_id),
    INDEX idx_staff_active (is_active)
);
```

---

### Table 8: `services`

```sql
CREATE TABLE services (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id        BIGINT UNSIGNED NOT NULL,
    name           VARCHAR(191) NOT NULL,
    description    TEXT NULL,
    category       VARCHAR(100) NULL,
    base_price     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estimated_days INT NOT NULL DEFAULT 7,
    is_active      TINYINT(1) NOT NULL DEFAULT 1,
    created_at     TIMESTAMP NULL,
    updated_at     TIMESTAMP NULL,
    deleted_at     TIMESTAMP NULL,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    INDEX idx_services_shop (shop_id),
    INDEX idx_services_active (is_active)
);
```

---

### Table 9: `apparel_specializations`

```sql
CREATE TABLE apparel_specializations (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id     BIGINT UNSIGNED NOT NULL,
    name        VARCHAR(191) NOT NULL,
    description TEXT NULL,
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    INDEX idx_specializations_shop (shop_id)
);
-- Examples: Barong Tagalog | Wedding Gown | School Uniform | Suit
```

---

### Table 10: `service_pricing` (Itemized)

```sql
CREATE TABLE service_pricing (
    id                        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_id                BIGINT UNSIGNED NOT NULL,
    apparel_specialization_id BIGINT UNSIGNED NULL,
    label                     VARCHAR(191) NOT NULL,
    amount                    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at                TIMESTAMP NULL,
    updated_at                TIMESTAMP NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (apparel_specialization_id) REFERENCES apparel_specializations(id) ON DELETE SET NULL,
    INDEX idx_pricing_service (service_id)
);
-- Example rows: "Fabric Cost" | "Labor Cost" | "Embroidery Add-on"
```

---

### Table 11: `appointments`

```sql
CREATE TABLE appointments (
    id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id            BIGINT UNSIGNED NOT NULL,
    customer_id        BIGINT UNSIGNED NOT NULL,
    staff_id           BIGINT UNSIGNED NULL,
    service_id         BIGINT UNSIGNED NOT NULL,
    scheduled_at       DATETIME NOT NULL,
    duration_minutes   INT NOT NULL DEFAULT 60,
    status             ENUM('pending','confirmed','in_progress','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
    notes              TEXT NULL,
    cancellation_reason TEXT NULL,
    created_at         TIMESTAMP NULL,
    updated_at         TIMESTAMP NULL,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_appointments_shop (shop_id),
    INDEX idx_appointments_status (status),
    INDEX idx_appointments_scheduled (scheduled_at),
    INDEX idx_appointments_customer (customer_id)
);
```

---

### Table 12: `job_orders`

```sql
CREATE TABLE job_orders (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id           BIGINT UNSIGNED NOT NULL,
    appointment_id    BIGINT UNSIGNED NULL,
    customer_id       BIGINT UNSIGNED NOT NULL,
    assigned_staff_id BIGINT UNSIGNED NULL,
    order_number      VARCHAR(50) NOT NULL,
    description       TEXT NULL,
    status            ENUM('received','cutting','sewing','finishing','ready_for_pickup','delivered','cancelled') NOT NULL DEFAULT 'received',
    priority          ENUM('low','normal','high','rush') NOT NULL DEFAULT 'normal',
    due_date          DATE NULL,
    completed_at      TIMESTAMP NULL,
    total_amount      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    amount_paid       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notes             TEXT NULL,
    created_at        TIMESTAMP NULL,
    updated_at        TIMESTAMP NULL,
    deleted_at        TIMESTAMP NULL,
    UNIQUE KEY unique_order_number (order_number),
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_orders_shop (shop_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_customer (customer_id)
);
-- Note: balance = total_amount - amount_paid, computed in the model
```

---

### Table 13: `measurements`

```sql
CREATE TABLE measurements (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id      BIGINT UNSIGNED NOT NULL,
    shop_id          BIGINT UNSIGNED NOT NULL,
    job_order_id     BIGINT UNSIGNED NULL,
    recorded_by      BIGINT UNSIGNED NOT NULL,
    label            VARCHAR(191) NOT NULL DEFAULT 'General Measurement',
    bust             DECIMAL(5,2) NULL COMMENT 'cm',
    waist            DECIMAL(5,2) NULL COMMENT 'cm',
    hips             DECIMAL(5,2) NULL COMMENT 'cm',
    shoulder_width   DECIMAL(5,2) NULL COMMENT 'cm',
    sleeve_length    DECIMAL(5,2) NULL COMMENT 'cm',
    inseam           DECIMAL(5,2) NULL COMMENT 'cm',
    outseam          DECIMAL(5,2) NULL COMMENT 'cm',
    neck             DECIMAL(5,2) NULL COMMENT 'cm',
    chest            DECIMAL(5,2) NULL COMMENT 'cm',
    back_length      DECIMAL(5,2) NULL COMMENT 'cm',
    additional_notes JSON NULL,
    measured_at      DATE NOT NULL,
    created_at       TIMESTAMP NULL,
    updated_at       TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_measurements_customer_shop (customer_id, shop_id)
);
```

---

### Table 14: `audit_logs`

```sql
CREATE TABLE audit_logs (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT UNSIGNED NULL,
    shop_id        BIGINT UNSIGNED NULL,
    action         VARCHAR(100) NOT NULL,
    auditable_type VARCHAR(100) NULL,
    auditable_id   BIGINT UNSIGNED NULL,
    old_values     JSON NULL,
    new_values     JSON NULL,
    ip_address     VARCHAR(45) NULL,
    user_agent     TEXT NULL,
    created_at     TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_shop (shop_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_type_id (auditable_type, auditable_id)
);
-- Never updated, never deleted. Insert-only table.
```

---

## C. API DESIGN

### Base URL

```
https://api.sutura.app/api/v1
```

### Authentication

All protected routes require:

```
Authorization: Bearer {sanctum_token}
Accept: application/json
Content-Type: application/json
```

---

### Standard Response Envelope

**Success (single resource):**

```json
{
  "success": true,
  "message": "Resource retrieved successfully.",
  "data": { }
}
```

**Success (collection):**

```json
{
  "success": true,
  "data": [ ],
  "meta": { "current_page": 1, "last_page": 3, "per_page": 15, "total": 42 }
}
```

**Error (validation):**

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "email": ["The email field is required."],
    "scheduled_at": ["The scheduled at must be a future date."]
  }
}
```

**Error (authorization):**

```json
{ "success": false, "message": "Unauthorized." }
```

---

### AUTH ENDPOINTS

#### `POST /auth/register`

Register a new user.

**Request:**

```json
{
  "name": "Maria Santos",
  "email": "maria@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "phone": "+63 912 345 6789",
  "role": "shop_owner"
}
```

**Response 201:**

```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "user": {
      "id": 1,
      "name": "Maria Santos",
      "email": "maria@example.com",
      "roles": [{ "name": "shop_owner" }]
    },
    "token": "1|abc123xyz..."
  }
}
```

---

#### `POST /auth/login`

**Request:**

```json
{ "email": "maria@example.com", "password": "password123" }
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Maria Santos",
      "email": "maria@example.com",
      "roles": [{ "name": "shop_owner" }],
      "shop": { "id": 1, "name": "Santos Tailoring Shop", "status": "approved" }
    },
    "token": "2|def456abc..."
  }
}
```

---

#### `POST /auth/logout`

Revokes the current token. Returns `{ "success": true, "message": "Logged out." }`.

#### `GET /auth/me`

Returns the authenticated user with roles and their shop's subscription.

---

### SHOP ENDPOINTS

#### `POST /shops`

Register a new tailoring shop. (Role: shop_owner)

**Request:**

```json
{
  "name": "Santos Tailoring Shop",
  "description": "Premium bespoke tailoring since 2010.",
  "address": "123 Rizal Street, Brgy. Carmen",
  "city": "Cagayan de Oro",
  "province": "Misamis Oriental",
  "postal_code": "9000",
  "phone": "+63 88 123 4567",
  "email": "contact@santostailoring.com"
}
```

**Response 201:**

```json
{
  "success": true,
  "message": "Shop registered. Awaiting admin approval.",
  "data": { "id": 1, "name": "Santos Tailoring Shop", "status": "pending", "slug": "santos-tailoring-shop-abc123" }
}
```

#### `GET /shops/{shop}` — View shop profile.

#### `PUT /shops/{shop}` — Update shop details.

#### `POST /shops/{shop}/logo` — Upload logo (multipart: `logo` file field).

---

### ADMIN ENDPOINTS

#### `GET /admin/shops`

List all shops with optional filter. Query: `?status=pending&per_page=15`

#### `PUT /admin/shops/{shop}/approve`

```json
{ "notes": "Business documents verified." }
```

**Response:** `{ "success": true, "message": "Shop approved successfully." }`

#### `PUT /admin/shops/{shop}/reject`

```json
{ "rejection_reason": "Incomplete DTI registration documents." }
```

#### `GET /admin/subscription-plans` — List all plans.

#### `POST /admin/subscription-plans` — Create a plan.

#### `PUT /admin/subscription-plans/{plan}` — Update a plan.

#### `DELETE /admin/subscription-plans/{plan}` — Deactivate a plan.

---

### SUBSCRIPTION ENDPOINTS

#### `GET /shops/{shop}/subscription`

```json
{
  "data": {
    "id": 1,
    "status": "active",
    "starts_at": "2024-06-01T00:00:00Z",
    "ends_at": "2024-07-01T00:00:00Z",
    "plan": { "name": "Pro", "price_monthly": 499, "max_staff": 10, "max_services": 30 }
  }
}
```

#### `POST /shops/{shop}/subscription`

```json
{ "plan_id": 2, "billing_cycle": "monthly" }
```

#### `PUT /shops/{shop}/subscription/cancel`

---

### STAFF ENDPOINTS

#### `GET /shops/{shop}/staff`

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "role": "head_tailor",
      "specialization": "Men's Formal Wear",
      "is_active": true,
      "hired_at": "2024-01-15",
      "user": { "id": 3, "name": "Juan Dela Cruz", "email": "juan@santos.com" }
    }
  ]
}
```

#### `POST /shops/{shop}/staff`

```json
{
  "name": "Juan Dela Cruz",
  "email": "juan@santos.com",
  "password": "securepass123",
  "phone": "+63 917 111 2222",
  "role": "head_tailor",
  "specialization": "Men's Formal Wear",
  "hired_at": "2024-01-15"
}
```

#### `PUT /shops/{shop}/staff/{staff}` — Update role, specialization, bio.

#### `DELETE /shops/{shop}/staff/{staff}` — Deactivate staff member.

#### `PUT /shops/{shop}/staff/{staff}/toggle` — Toggle is_active status.

---

### SERVICE ENDPOINTS

#### `GET /shops/{shop}/services` — List active services.

#### `POST /shops/{shop}/services`

```json
{
  "name": "Barong Tagalog – Custom Made",
  "description": "Full custom barong with hand embroidery.",
  "category": "Formal Wear",
  "base_price": 1500.00,
  "estimated_days": 14
}
```

#### `PUT /shops/{shop}/services/{service}` — Update service.

#### `DELETE /shops/{shop}/services/{service}` — Soft-delete service.

---

### SPECIALIZATION ENDPOINTS

#### `GET /shops/{shop}/specializations`

#### `POST /shops/{shop}/specializations`

```json
{ "name": "Wedding Gown", "description": "Bridal couture and custom gown tailoring." }
```

---

### SERVICE PRICING ENDPOINTS

#### `GET /shops/{shop}/services/{service}/pricing`

**Response:**

```json
{
  "data": [
    { "id": 1, "label": "Base Labor Cost", "amount": 1200.00, "apparel_specialization": null },
    { "id": 2, "label": "Hand Embroidery Add-on", "amount": 500.00, "apparel_specialization": { "name": "Wedding Gown" } }
  ]
}
```

#### `POST /shops/{shop}/services/{service}/pricing`

```json
{
  "apparel_specialization_id": 2,
  "label": "Hand Embroidery Add-on",
  "amount": 500.00
}
```

#### `PUT /shops/{shop}/services/{service}/pricing/{pricing}` — Update a price item.

#### `DELETE /shops/{shop}/services/{service}/pricing/{pricing}` — Delete a price item.

---

### APPOINTMENT ENDPOINTS

#### `GET /shops/{shop}/appointments`

Query: `?status=pending&date=2024-06-15&per_page=20`

#### `POST /shops/{shop}/appointments`

```json
{
  "customer_id": 10,
  "service_id": 3,
  "staff_id": 4,
  "scheduled_at": "2024-06-20 10:00:00",
  "duration_minutes": 90,
  "notes": "Customer wants to bring own fabric."
}
```

#### `GET /shops/{shop}/appointments/{appointment}` — View single appointment.

#### `PUT /shops/{shop}/appointments/{appointment}/status`

```json
{ "status": "confirmed" }
```

Valid status transitions: `pending → confirmed → in_progress → completed` or `→ cancelled / no_show`

#### `DELETE /shops/{shop}/appointments/{appointment}` — Cancel an appointment.

---

### JOB ORDER ENDPOINTS

#### `GET /shops/{shop}/orders`

Query: `?status=sewing&priority=rush`

#### `POST /shops/{shop}/orders`

```json
{
  "appointment_id": 5,
  "customer_id": 10,
  "assigned_staff_id": 4,
  "description": "Custom barong – Piña fabric, size M",
  "priority": "high",
  "due_date": "2024-07-05",
  "total_amount": 2500.00
}
```

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": 12,
    "order_number": "ORD-A3B7C9D2",
    "status": "received",
    "total_amount": 2500.00,
    "amount_paid": 0.00,
    "balance": 2500.00
  }
}
```

#### `PUT /shops/{shop}/orders/{order}/status`

```json
{ "status": "sewing" }
```

Valid status pipeline: `received → cutting → sewing → finishing → ready_for_pickup → delivered`

#### `PUT /shops/{shop}/orders/{order}/assign`

```json
{ "staff_id": 4 }
```

---

### MEASUREMENT ENDPOINTS

#### `GET /shops/{shop}/customers/{customer}/measurements`

#### `POST /shops/{shop}/customers/{customer}/measurements`

```json
{
  "job_order_id": 12,
  "label": "Upper Body – Formal Barong",
  "chest": 96.5,
  "waist": 80.0,
  "shoulder_width": 42.5,
  "sleeve_length": 63.0,
  "back_length": 71.0,
  "neck": 38.0,
  "measured_at": "2024-06-15"
}
```

#### `GET /shops/{shop}/customers/{customer}/measurements/{measurement}` — View single record.

#### `PUT /shops/{shop}/customers/{customer}/measurements/{measurement}` — Update measurement.

---

### ANALYTICS ENDPOINTS

#### `GET /shops/{shop}/analytics/summary`

**Response:**

```json
{
  "data": {
    "total_revenue": 125000.00,
    "this_month_revenue": 18500.00,
    "outstanding_balance": 5200.00,
    "total_orders": 248,
    "pending_orders": 12,
    "completed_orders": 230,
    "cancelled_orders": 6,
    "total_appointments": 310,
    "pending_appointments": 8,
    "confirmed_appointments": 15,
    "active_staff": 5,
    "total_customers": 87
  }
}
```

#### `GET /shops/{shop}/analytics/revenue`

Query: `?period=monthly&year=2024`

**Response:**

```json
{
  "data": [
    { "month": 1, "year": 2024, "revenue": 9800.00 },
    { "month": 2, "year": 2024, "revenue": 12500.00 },
    { "month": 3, "year": 2024, "revenue": 11200.00 }
  ]
}
```

#### `GET /shops/{shop}/analytics/orders`

Returns order count grouped by status.

---

### AUDIT LOG ENDPOINTS

#### `GET /shops/{shop}/audit-logs`

Query: `?action=updated_service&per_page=20`

**Response:**

```json
{
  "data": [
    {
      "id": 45,
      "action": "updated_service",
      "auditable_type": "Service",
      "auditable_id": 3,
      "old_values": { "base_price": 1200.00 },
      "new_values": { "base_price": 1500.00 },
      "ip_address": "192.168.1.100",
      "created_at": "2024-06-10T14:23:00Z",
      "user": { "id": 1, "name": "Maria Santos" }
    }
  ]
}
```

---

## D. LARAVEL BACKEND STRUCTURE

### Full Directory Tree

```
sutura-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── V1/
│   │   │           ├── Auth/
│   │   │           │   └── AuthController.php
│   │   │           ├── Admin/
│   │   │           │   ├── ShopApprovalController.php
│   │   │           │   └── SubscriptionPlanController.php
│   │   │           ├── Shop/
│   │   │           │   ├── ShopController.php
│   │   │           │   ├── ShopSubscriptionController.php
│   │   │           │   ├── StaffController.php
│   │   │           │   ├── ServiceController.php
│   │   │           │   ├── SpecializationController.php
│   │   │           │   ├── ServicePricingController.php
│   │   │           │   ├── AppointmentController.php
│   │   │           │   ├── JobOrderController.php
│   │   │           │   ├── MeasurementController.php
│   │   │           │   └── AnalyticsController.php
│   │   │           └── AuditLogController.php
│   │   ├── Middleware/
│   │   │   ├── CheckRole.php
│   │   │   ├── CheckShopOwner.php
│   │   │   ├── CheckShopApproved.php
│   │   │   └── CheckSubscriptionActive.php
│   │   ├── Requests/
│   │   │   ├── Auth/
│   │   │   │   ├── RegisterRequest.php
│   │   │   │   └── LoginRequest.php
│   │   │   ├── Shop/
│   │   │   │   ├── StoreShopRequest.php
│   │   │   │   └── UpdateShopRequest.php
│   │   │   ├── Staff/
│   │   │   │   ├── StoreStaffRequest.php
│   │   │   │   └── UpdateStaffRequest.php
│   │   │   ├── Service/
│   │   │   │   ├── StoreServiceRequest.php
│   │   │   │   └── StoreServicePricingRequest.php
│   │   │   ├── Appointment/
│   │   │   │   └── StoreAppointmentRequest.php
│   │   │   └── JobOrder/
│   │   │       └── StoreJobOrderRequest.php
│   │   └── Resources/
│   │       ├── UserResource.php
│   │       ├── ShopResource.php
│   │       ├── StaffResource.php
│   │       ├── ServiceResource.php
│   │       ├── AppointmentResource.php
│   │       └── JobOrderResource.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Role.php
│   │   ├── Shop.php
│   │   ├── SubscriptionPlan.php
│   │   ├── ShopSubscription.php
│   │   ├── StaffProfile.php
│   │   ├── Service.php
│   │   ├── ApparelSpecialization.php
│   │   ├── ServicePricing.php
│   │   ├── Appointment.php
│   │   ├── JobOrder.php
│   │   ├── Measurement.php
│   │   └── AuditLog.php
│   ├── Policies/
│   │   ├── ShopPolicy.php
│   │   ├── StaffPolicy.php
│   │   ├── ServicePolicy.php
│   │   └── AppointmentPolicy.php
│   ├── Services/
│   │   ├── ShopService.php
│   │   ├── StaffService.php
│   │   ├── SubscriptionService.php
│   │   └── AnalyticsService.php
│   └── Traits/
│       └── Auditable.php
├── database/
│   ├── migrations/
│   │   ├── 2024_01_01_000001_create_users_table.php
│   │   ├── 2024_01_01_000002_create_roles_table.php
│   │   ├── 2024_01_01_000003_create_role_user_table.php
│   │   ├── 2024_01_01_000004_create_shops_table.php
│   │   ├── 2024_01_01_000005_create_subscription_plans_table.php
│   │   ├── 2024_01_01_000006_create_shop_subscriptions_table.php
│   │   ├── 2024_01_01_000007_create_staff_profiles_table.php
│   │   ├── 2024_01_01_000008_create_services_table.php
│   │   ├── 2024_01_01_000009_create_apparel_specializations_table.php
│   │   ├── 2024_01_01_000010_create_service_pricing_table.php
│   │   ├── 2024_01_01_000011_create_appointments_table.php
│   │   ├── 2024_01_01_000012_create_job_orders_table.php
│   │   ├── 2024_01_01_000013_create_measurements_table.php
│   │   └── 2024_01_01_000014_create_audit_logs_table.php
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── RoleSeeder.php
│       ├── SubscriptionPlanSeeder.php
│       └── AdminUserSeeder.php
├── routes/
│   └── api.php
└── config/
    └── sutura.php
```

---

### Models

#### `app/Models/User.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes;

    protected $fillable = ['name', 'email', 'password', 'phone'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = ['email_verified_at' => 'datetime'];

    // Relationships
    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function shop()
    {
        return $this->hasOne(Shop::class, 'owner_id');
    }

    public function staffProfiles()
    {
        return $this->hasMany(StaffProfile::class);
    }

    // Helpers
    public function hasRole(string $role): bool
    {
        return $this->roles->contains('name', $role);
    }

    public function isAdmin(): bool     { return $this->hasRole('admin'); }
    public function isShopOwner(): bool { return $this->hasRole('shop_owner'); }
    public function isStaff(): bool     { return $this->hasRole('staff'); }
    public function isCustomer(): bool  { return $this->hasRole('customer'); }
}
```

---

#### `app/Models/Shop.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Shop extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'owner_id', 'name', 'slug', 'description', 'address',
        'city', 'province', 'postal_code', 'phone', 'email',
        'logo_path', 'status', 'rejection_reason', 'approved_at', 'approved_by',
    ];

    protected $casts = ['approved_at' => 'datetime'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($shop) {
            $shop->slug = Str::slug($shop->name) . '-' . Str::lower(Str::random(6));
        });
    }

    public function owner()          { return $this->belongsTo(User::class, 'owner_id'); }
    public function staff()          { return $this->hasMany(StaffProfile::class); }
    public function services()       { return $this->hasMany(Service::class); }
    public function specializations(){ return $this->hasMany(ApparelSpecialization::class); }
    public function appointments()   { return $this->hasMany(Appointment::class); }
    public function jobOrders()      { return $this->hasMany(JobOrder::class); }
    public function subscriptions()  { return $this->hasMany(ShopSubscription::class); }
    public function auditLogs()      { return $this->hasMany(AuditLog::class); }

    public function subscription()
    {
        return $this->hasOne(ShopSubscription::class)->latestOfMany('starts_at');
    }

    public function isApproved(): bool  { return $this->status === 'approved'; }
    public function isPending(): bool   { return $this->status === 'pending'; }
    public function isSuspended(): bool { return $this->status === 'suspended'; }

    public function hasActiveSubscription(): bool
    {
        $sub = $this->subscription;
        return $sub
            && in_array($sub->status, ['active', 'trial'])
            && ($sub->ends_at === null || $sub->ends_at->isFuture());
    }
}
```

---

#### `app/Models/JobOrder.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class JobOrder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'shop_id', 'appointment_id', 'customer_id', 'assigned_staff_id',
        'order_number', 'description', 'status', 'priority',
        'due_date', 'completed_at', 'total_amount', 'amount_paid', 'notes',
    ];

    protected $casts = [
        'due_date'     => 'date',
        'completed_at' => 'datetime',
    ];

    protected $appends = ['balance'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($order) =>
            $order->order_number = 'ORD-' . strtoupper(Str::random(8))
        );
    }

    public function getBalanceAttribute(): float
    {
        return (float) ($this->total_amount - $this->amount_paid);
    }

    public function shop()        { return $this->belongsTo(Shop::class); }
    public function customer()    { return $this->belongsTo(User::class, 'customer_id'); }
    public function staff()       { return $this->belongsTo(User::class, 'assigned_staff_id'); }
    public function appointment() { return $this->belongsTo(Appointment::class); }
    public function measurements(){ return $this->hasMany(Measurement::class); }
}
```

---

### Controllers

#### `app/Http/Controllers/Api/V1/Auth/AuthController.php`

```php
<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'phone'    => $request->phone,
        ]);

        $roleName = in_array($request->role, ['shop_owner', 'customer']) ? $request->role : 'customer';
        $role = Role::where('name', $roleName)->first();
        if ($role) $user->roles()->attach($role);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Account created successfully.',
            'data'    => ['user' => $user->load('roles'), 'token' => $token],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials.'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data'    => ['user' => $user->load('roles', 'shop.subscription.plan'), 'token' => $token],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $request->user()->load('roles', 'shop.subscription.plan'),
        ]);
    }
}
```

---

#### `app/Http/Controllers/Api/V1/Shop/StaffController.php`

```php
<?php

namespace App\Http\Controllers\Api\V1\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\StoreStaffRequest;
use App\Http\Requests\Staff\UpdateStaffRequest;
use App\Models\Shop;
use App\Models\StaffProfile;
use App\Services\StaffService;

class StaffController extends Controller
{
    public function __construct(private StaffService $staffService) {}

    public function index(Shop $shop)
    {
        $this->authorize('viewAny', [StaffProfile::class, $shop]);
        $staff = $shop->staff()->with('user')->paginate(15);
        return response()->json(['success' => true, 'data' => $staff]);
    }

    public function store(StoreStaffRequest $request, Shop $shop)
    {
        $this->authorize('create', [StaffProfile::class, $shop]);
        $staffProfile = $this->staffService->createStaff($shop, $request->validated());
        return response()->json([
            'success' => true, 'message' => 'Staff member added.',
            'data'    => $staffProfile->load('user'),
        ], 201);
    }

    public function update(UpdateStaffRequest $request, Shop $shop, StaffProfile $staff)
    {
        $this->authorize('update', [$staff, $shop]);
        $staff->update($request->validated());
        return response()->json(['success' => true, 'data' => $staff->load('user')]);
    }

    public function destroy(Shop $shop, StaffProfile $staff)
    {
        $this->authorize('delete', [$staff, $shop]);
        $staff->update(['is_active' => false]);
        return response()->json(['success' => true, 'message' => 'Staff member deactivated.']);
    }

    public function toggleStatus(Shop $shop, StaffProfile $staff)
    {
        $this->authorize('update', [$staff, $shop]);
        $staff->update(['is_active' => !$staff->is_active]);
        $status = $staff->is_active ? 'activated' : 'deactivated';
        return response()->json(['success' => true, 'message' => "Staff member {$status}.", 'data' => $staff]);
    }
}
```

---

#### `app/Http/Controllers/Api/V1/Shop/AnalyticsController.php`

```php
<?php

namespace App\Http\Controllers\Api\V1\Shop;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Services\AnalyticsService;

class AnalyticsController extends Controller
{
    public function __construct(private AnalyticsService $analyticsService) {}

    public function summary(Shop $shop)
    {
        $this->authorize('view', $shop);
        return response()->json(['success' => true, 'data' => $this->analyticsService->getSummary($shop)]);
    }

    public function revenue(Shop $shop)
    {
        $this->authorize('view', $shop);
        $data = $this->analyticsService->getRevenueSeries($shop, request('period', 'monthly'), request('year', now()->year));
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function orders(Shop $shop)
    {
        $this->authorize('view', $shop);
        $data = $this->analyticsService->getOrdersByStatus($shop);
        return response()->json(['success' => true, 'data' => $data]);
    }
}
```

---

### Services

#### `app/Services/StaffService.php`

```php
<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Role;
use App\Models\Shop;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Request;

class StaffService
{
    public function createStaff(Shop $shop, array $data): StaffProfile
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'phone'    => $data['phone'] ?? null,
        ]);

        $staffRole = Role::where('name', 'staff')->firstOrFail();
        $user->roles()->attach($staffRole);

        $profile = StaffProfile::create([
            'user_id'        => $user->id,
            'shop_id'        => $shop->id,
            'role'           => $data['role'],
            'specialization' => $data['specialization'] ?? null,
            'bio'            => $data['bio'] ?? null,
            'hired_at'       => $data['hired_at'] ?? now()->toDateString(),
        ]);

        AuditLog::create([
            'user_id'        => auth()->id(),
            'shop_id'        => $shop->id,
            'action'         => 'created_staff',
            'auditable_type' => 'StaffProfile',
            'auditable_id'   => $profile->id,
            'new_values'     => ['name' => $data['name'], 'role' => $data['role']],
            'ip_address'     => Request::ip(),
        ]);

        return $profile;
    }
}
```

---

#### `app/Services/AnalyticsService.php`

```php
<?php

namespace App\Services;

use App\Models\Shop;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getSummary(Shop $shop): array
    {
        $orders = fn() => $shop->jobOrders()->where('deleted_at', null);

        return [
            'total_revenue'           => (float) $orders()->sum('total_amount'),
            'this_month_revenue'      => (float) $orders()->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->sum('total_amount'),
            'outstanding_balance'     => (float) $orders()->where('status', '!=', 'cancelled')->sum(DB::raw('total_amount - amount_paid')),
            'total_orders'            => $orders()->count(),
            'pending_orders'          => $orders()->whereIn('status', ['received', 'cutting', 'sewing', 'finishing'])->count(),
            'completed_orders'        => $orders()->where('status', 'delivered')->count(),
            'cancelled_orders'        => $orders()->where('status', 'cancelled')->count(),
            'total_appointments'      => $shop->appointments()->count(),
            'pending_appointments'    => $shop->appointments()->where('status', 'pending')->count(),
            'confirmed_appointments'  => $shop->appointments()->where('status', 'confirmed')->count(),
            'active_staff'            => $shop->staff()->where('is_active', true)->count(),
            'total_customers'         => $orders()->distinct('customer_id')->count('customer_id'),
        ];
    }

    public function getRevenueSeries(Shop $shop, string $period, int $year): array
    {
        return $shop->jobOrders()
            ->selectRaw('MONTH(created_at) as month, YEAR(created_at) as year, SUM(total_amount) as revenue')
            ->whereYear('created_at', $year)
            ->where('status', '!=', 'cancelled')
            ->groupByRaw('YEAR(created_at), MONTH(created_at)')
            ->orderByRaw('YEAR(created_at), MONTH(created_at)')
            ->get()
            ->toArray();
    }

    public function getOrdersByStatus(Shop $shop): array
    {
        return $shop->jobOrders()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->toArray();
    }
}
```

---

#### `app/Services/SubscriptionService.php`

```php
<?php

namespace App\Services;

use App\Models\Shop;
use App\Models\ShopSubscription;
use App\Models\SubscriptionPlan;
use Carbon\Carbon;

class SubscriptionService
{
    public function subscribe(Shop $shop, SubscriptionPlan $plan, string $billingCycle = 'monthly'): ShopSubscription
    {
        $shop->subscriptions()->where('status', 'active')->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        $endsAt = $billingCycle === 'yearly'
            ? Carbon::now()->addYear()
            : Carbon::now()->addMonth();

        return ShopSubscription::create([
            'shop_id'  => $shop->id,
            'plan_id'  => $plan->id,
            'status'   => 'active',
            'starts_at'=> now(),
            'ends_at'  => $endsAt,
        ]);
    }

    public function cancel(Shop $shop): void
    {
        $shop->subscription?->update(['status' => 'cancelled', 'cancelled_at' => now()]);
    }
}
```

---

### Middleware

#### `app/Http/Middleware/CheckRole.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role): mixed
    {
        if (!$request->user()?->hasRole($role)) {
            return response()->json(['success' => false, 'message' => 'Forbidden. Insufficient role.'], 403);
        }
        return $next($request);
    }
}
```

---

#### `app/Http/Middleware/CheckShopOwner.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckShopOwner
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();
        $shop = $request->route('shop');

        if ($user->isAdmin()) return $next($request);

        if (!$shop || $shop->owner_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. You do not own this shop.'], 403);
        }

        return $next($request);
    }
}
```

---

#### `app/Http/Middleware/CheckShopApproved.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckShopApproved
{
    public function handle(Request $request, Closure $next): mixed
    {
        $shop = $request->route('shop');

        if ($shop && !$shop->isApproved() && !$request->user()?->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => "Shop is not yet approved. Current status: {$shop->status}.",
            ], 403);
        }

        return $next($request);
    }
}
```

---

### Policies

#### `app/Policies/ShopPolicy.php`

```php
<?php

namespace App\Policies;

use App\Models\Shop;
use App\Models\User;

class ShopPolicy
{
    public function view(User $user, Shop $shop): bool
    {
        return $user->isAdmin() || $shop->owner_id === $user->id;
    }

    public function update(User $user, Shop $shop): bool
    {
        return $shop->owner_id === $user->id;
    }

    public function approve(User $user): bool
    {
        return $user->isAdmin();
    }
}
```

---

#### `app/Policies/StaffPolicy.php`

```php
<?php

namespace App\Policies;

use App\Models\Shop;
use App\Models\StaffProfile;
use App\Models\User;

class StaffPolicy
{
    public function viewAny(User $user, Shop $shop): bool
    {
        return $user->isAdmin() || $shop->owner_id === $user->id
            || $shop->staff()->where('user_id', $user->id)->exists();
    }

    public function create(User $user, Shop $shop): bool
    {
        return $shop->owner_id === $user->id;
    }

    public function update(User $user, StaffProfile $staff, Shop $shop): bool
    {
        return $shop->owner_id === $user->id;
    }

    public function delete(User $user, StaffProfile $staff, Shop $shop): bool
    {
        return $shop->owner_id === $user->id;
    }
}
```

---

### Form Requests

#### `app/Http/Requests/Auth/RegisterRequest.php`

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:191'],
            'email'    => ['required', 'email', 'max:191', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone'    => ['nullable', 'string', 'max:20'],
            'role'     => ['nullable', 'string', 'in:shop_owner,customer'],
        ];
    }
}
```

---

#### `app/Http/Requests/Staff/StoreStaffRequest.php`

```php
<?php

namespace App\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:191'],
            'email'          => ['required', 'email', 'unique:users,email'],
            'password'       => ['required', 'string', 'min:8'],
            'phone'          => ['nullable', 'string', 'max:20'],
            'role'           => ['required', 'in:head_tailor,tailor,assistant,receptionist'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'bio'            => ['nullable', 'string'],
            'hired_at'       => ['nullable', 'date'],
        ];
    }
}
```

---

#### `app/Http/Requests/Appointment/StoreAppointmentRequest.php`

```php
<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'customer_id'      => ['required', 'exists:users,id'],
            'service_id'       => ['required', 'exists:services,id'],
            'staff_id'         => ['nullable', 'exists:users,id'],
            'scheduled_at'     => ['required', 'date', 'after:now'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:480'],
            'notes'            => ['nullable', 'string', 'max:1000'],
        ];
    }
}
```

---

### Routes (`routes/api.php`)

```php
<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Admin\ShopApprovalController;
use App\Http\Controllers\Api\V1\Admin\SubscriptionPlanController;
use App\Http\Controllers\Api\V1\Shop\{
    ShopController, ShopSubscriptionController, StaffController,
    ServiceController, SpecializationController, ServicePricingController,
    AppointmentController, JobOrderController, MeasurementController, AnalyticsController
};
use App\Http\Controllers\Api\V1\AuditLogController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ── AUTH (Public) ─────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login',    [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me',      [AuthController::class, 'me']);
        });
    });

    // ── AUTHENTICATED ROUTES ────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // ── ADMIN ONLY ───────────────────────────────────────────
        Route::prefix('admin')->middleware('role:admin')->group(function () {
            Route::get('/shops',                    [ShopApprovalController::class, 'index']);
            Route::put('/shops/{shop}/approve',     [ShopApprovalController::class, 'approve']);
            Route::put('/shops/{shop}/reject',      [ShopApprovalController::class, 'reject']);
            Route::put('/shops/{shop}/suspend',     [ShopApprovalController::class, 'suspend']);
            Route::apiResource('subscription-plans', SubscriptionPlanController::class);
        });

        // ── SHOP REGISTRATION ────────────────────────────────────
        Route::post('/shops', [ShopController::class, 'store'])->middleware('role:shop_owner');

        // ── SHOP-SCOPED ROUTES ───────────────────────────────────
        Route::prefix('shops/{shop}')
            ->middleware(['check.shop.owner', 'check.shop.approved'])
            ->group(function () {

            // Profile
            Route::get('/',      [ShopController::class, 'show']);
            Route::put('/',      [ShopController::class, 'update']);
            Route::post('/logo', [ShopController::class, 'uploadLogo']);

            // Subscription
            Route::get('/subscription',         [ShopSubscriptionController::class, 'show']);
            Route::post('/subscription',        [ShopSubscriptionController::class, 'store']);
            Route::put('/subscription/cancel',  [ShopSubscriptionController::class, 'cancel']);

            // Staff
            Route::get('/staff',                 [StaffController::class, 'index']);
            Route::post('/staff',                [StaffController::class, 'store']);
            Route::put('/staff/{staff}',         [StaffController::class, 'update']);
            Route::delete('/staff/{staff}',      [StaffController::class, 'destroy']);
            Route::put('/staff/{staff}/toggle',  [StaffController::class, 'toggleStatus']);

            // Services
            Route::apiResource('/services', ServiceController::class);

            // Specializations
            Route::apiResource('/specializations', SpecializationController::class);

            // Pricing (nested under services)
            Route::prefix('/services/{service}/pricing')->group(function () {
                Route::get('/',              [ServicePricingController::class, 'index']);
                Route::post('/',             [ServicePricingController::class, 'store']);
                Route::put('/{pricing}',     [ServicePricingController::class, 'update']);
                Route::delete('/{pricing}',  [ServicePricingController::class, 'destroy']);
            });

            // Appointments
            Route::get('/appointments',                      [AppointmentController::class, 'index']);
            Route::post('/appointments',                     [AppointmentController::class, 'store']);
            Route::get('/appointments/{appointment}',        [AppointmentController::class, 'show']);
            Route::put('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);
            Route::delete('/appointments/{appointment}',     [AppointmentController::class, 'destroy']);

            // Job Orders
            Route::get('/orders',                     [JobOrderController::class, 'index']);
            Route::post('/orders',                    [JobOrderController::class, 'store']);
            Route::get('/orders/{order}',             [JobOrderController::class, 'show']);
            Route::put('/orders/{order}/status',      [JobOrderController::class, 'updateStatus']);
            Route::put('/orders/{order}/assign',      [JobOrderController::class, 'assign']);

            // Measurements
            Route::get('/customers/{customer}/measurements',               [MeasurementController::class, 'index']);
            Route::post('/customers/{customer}/measurements',              [MeasurementController::class, 'store']);
            Route::get('/customers/{customer}/measurements/{measurement}', [MeasurementController::class, 'show']);
            Route::put('/customers/{customer}/measurements/{measurement}', [MeasurementController::class, 'update']);

            // Analytics
            Route::get('/analytics/summary', [AnalyticsController::class, 'summary']);
            Route::get('/analytics/revenue', [AnalyticsController::class, 'revenue']);
            Route::get('/analytics/orders',  [AnalyticsController::class, 'orders']);

            // Audit Logs
            Route::get('/audit-logs', [AuditLogController::class, 'index']);
        });
    });
});
```

---

### Seeders

#### `database/seeders/RoleSeeder.php`

```php
<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'admin',      'description' => 'Platform superuser'],
            ['name' => 'shop_owner', 'description' => 'Tailoring shop owner'],
            ['name' => 'staff',      'description' => 'Tailoring shop staff member'],
            ['name' => 'customer',   'description' => 'Customer / client'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}
```

---

#### `database/seeders/SubscriptionPlanSeeder.php`

```php
<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basic', 'slug' => 'basic',
                'description' => 'For solo tailors just getting started.',
                'price_monthly' => 0.00, 'price_yearly' => 0.00,
                'max_staff' => 2, 'max_services' => 5, 'max_appointments_per_month' => 20,
                'features' => json_encode(['shop_profile', 'basic_appointments', 'basic_analytics']),
            ],
            [
                'name' => 'Pro', 'slug' => 'pro',
                'description' => 'For growing shops with full team management.',
                'price_monthly' => 499.00, 'price_yearly' => 4999.00,
                'max_staff' => 10, 'max_services' => 30, 'max_appointments_per_month' => 100,
                'features' => json_encode(['all_basic', 'staff_management', 'full_analytics', 'audit_logs', 'specializations']),
            ],
            [
                'name' => 'Premium', 'slug' => 'premium',
                'description' => 'Unlimited everything for established shops.',
                'price_monthly' => 999.00, 'price_yearly' => 9999.00,
                'max_staff' => -1, 'max_services' => -1, 'max_appointments_per_month' => -1,
                'features' => json_encode(['all_pro', 'unlimited_staff', 'unlimited_services', 'export_reports', 'priority_support']),
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::firstOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
```

---

#### `database/seeders/AdminUserSeeder.php`

```php
<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@sutura.app'],
            ['name' => 'SUTURA Admin', 'password' => Hash::make('admin@sutura123')]
        );

        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole && !$admin->hasRole('admin')) {
            $admin->roles()->attach($adminRole);
        }
    }
}
```

---

### Auditable Trait

#### `app/Traits/Auditable.php`

```php
<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Http\Request;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(fn($model)  => static::audit($model, 'created'));
        static::updated(fn($model)  => static::audit($model, 'updated'));
        static::deleted(fn($model)  => static::audit($model, 'deleted'));
    }

    protected static function audit($model, string $event): void
    {
        AuditLog::create([
            'user_id'        => auth()->id(),
            'shop_id'        => $model->shop_id ?? null,
            'action'         => "{$event}_" . strtolower(class_basename($model)),
            'auditable_type' => class_basename($model),
            'auditable_id'   => $model->id,
            'old_values'     => $event === 'updated' ? $model->getOriginal() : null,
            'new_values'     => $event !== 'deleted' ? $model->getAttributes() : null,
            'ip_address'     => app(Request::class)->ip(),
        ]);
    }
}
```

**Usage** — add to any model that should be audited:

```php
use App\Traits\Auditable;

class Service extends Model
{
    use Auditable;
    // ...
}
```

---

## E. FRONTEND SLICE STRUCTURE

### Directory Tree

```
sutura-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   ← Root layout
│   │   ├── page.tsx                     ← Redirect to /login or /dashboard
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx           ← Login screen
│   │   │   └── register/page.tsx        ← Registration screen
│   │   └── (dashboard)/
│   │       ├── layout.tsx               ← Dashboard shell (sidebar + topbar)
│   │       ├── dashboard/page.tsx       ← Stats overview
│   │       ├── shop/
│   │       │   ├── profile/page.tsx     ← Shop profile form
│   │       │   ├── staff/page.tsx       ← Staff management
│   │       │   ├── services/page.tsx    ← Services + pricing
│   │       │   ├── appointments/page.tsx ← Appointment list + status
│   │       │   └── analytics/page.tsx   ← Revenue charts + stats
│   │       └── admin/
│   │           └── shops/page.tsx       ← Admin shop approval queue
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── DataTable.tsx
│   │   │   └── StatCard.tsx
│   │   ├── shop/
│   │   │   └── ShopProfileForm.tsx
│   │   ├── staff/
│   │   │   ├── StaffTable.tsx
│   │   │   └── StaffFormModal.tsx
│   │   ├── services/
│   │   │   ├── ServiceList.tsx
│   │   │   ├── ServiceFormModal.tsx
│   │   │   └── PricingTable.tsx
│   │   ├── appointments/
│   │   │   ├── AppointmentTable.tsx
│   │   │   └── AppointmentStatusBadge.tsx
│   │   └── analytics/
│   │       ├── StatsSummary.tsx
│   │       └── RevenueChart.tsx
│   ├── lib/
│   │   ├── axios.ts
│   │   └── api/
│   │       ├── auth.ts
│   │       ├── shop.ts
│   │       ├── staff.ts
│   │       ├── services.ts
│   │       ├── appointments.ts
│   │       ├── orders.ts
│   │       └── analytics.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   └── shopStore.ts
│   └── types/
│       ├── auth.ts
│       ├── shop.ts
│       ├── staff.ts
│       ├── service.ts
│       └── appointment.ts
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

### Zustand Stores

#### `src/store/authStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Role { name: string; }
interface User {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  shop?: { id: number; name: string; status: string; };
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token,
      hasRole: (role) => get().user?.roles.some(r => r.name === role) ?? false,
    }),
    { name: 'sutura-auth' }
  )
);
```

---

#### `src/store/shopStore.ts`

```typescript
import { create } from 'zustand';

interface Shop {
  id: number;
  name: string;
  status: string;
  slug: string;
  city: string;
  province: string;
}

interface ShopState {
  shop: Shop | null;
  setShop: (shop: Shop) => void;
  clearShop: () => void;
}

export const useShopStore = create<ShopState>()((set) => ({
  shop: null,
  setShop: (shop) => set({ shop }),
  clearShop: () => set({ shop: null }),
}));
```

---

### API Library

#### `src/lib/axios.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('sutura-auth');
    if (raw) {
      const { state } = JSON.parse(raw);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sutura-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

---

### Sample Screen Components

#### `src/app/(auth)/login/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useShopStore } from '@/store/shopStore';
import api from '@/lib/axios';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { setShop } = useShopStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      const { user, token } = res.data.data;
      setAuth(user, token);
      if (user.shop) setShop(user.shop);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">SUTURA</h1>
          <p className="text-slate-500 mt-1 text-sm">Tailoring Shop Management</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          Don't have an account?{' '}
          <a href="/register" className="text-indigo-600 hover:underline font-medium">Register here</a>
        </p>
      </div>
    </div>
  );
}
```

---

#### `src/app/(dashboard)/dashboard/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useShopStore } from '@/store/shopStore';
import api from '@/lib/axios';

interface Summary {
  total_revenue: number;
  this_month_revenue: number;
  outstanding_balance: number;
  pending_orders: number;
  completed_orders: number;
  total_appointments: number;
  pending_appointments: number;
  active_staff: number;
  total_customers: number;
}

const StatCard = ({
  label, value, sub, color
}: { label: string; value: string | number; sub?: string; color: string }) => (
  <div className={`bg-white rounded-xl shadow-sm border-l-4 p-5 ${color}`}>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

export default function DashboardPage() {
  const { shop } = useShopStore();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop?.id) return;
    api.get(`/shops/${shop.id}/analytics/summary`)
      .then((res) => setSummary(res.data.data))
      .finally(() => setLoading(false));
  }, [shop]);

  if (loading) return <div className="p-6 text-slate-400">Loading dashboard...</div>;
  if (!summary) return <div className="p-6 text-red-500">Failed to load analytics.</div>;

  const php = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Welcome back, {shop?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={php(summary.total_revenue)} sub={`This month: ${php(summary.this_month_revenue)}`} color="border-emerald-500" />
        <StatCard label="Outstanding Balance" value={php(summary.outstanding_balance)} color="border-red-500" />
        <StatCard label="Pending Orders" value={summary.pending_orders} color="border-amber-500" />
        <StatCard label="Completed Orders" value={summary.completed_orders} color="border-blue-500" />
        <StatCard label="Total Appointments" value={summary.total_appointments} sub={`Pending: ${summary.pending_appointments}`} color="border-purple-500" />
        <StatCard label="Active Staff" value={summary.active_staff} color="border-indigo-500" />
        <StatCard label="Total Customers" value={summary.total_customers} color="border-teal-500" />
      </div>
    </div>
  );
}
```

---

#### `src/app/(dashboard)/shop/staff/page.tsx` (abbreviated pattern)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useShopStore } from '@/store/shopStore';
import api from '@/lib/axios';

interface StaffMember {
  id: number;
  role: string;
  specialization: string | null;
  is_active: boolean;
  user: { id: number; name: string; email: string; };
}

export default function StaffPage() {
  const { shop } = useShopStore();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = () => {
    if (!shop?.id) return;
    api.get(`/shops/${shop.id}/staff`)
      .then((res) => setStaff(res.data.data.data || res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStaff(); }, [shop]);

  const toggleStatus = async (staffId: number) => {
    await api.put(`/shops/${shop!.id}/staff/${staffId}/toggle`);
    fetchStaff();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
          + Add Staff
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading staff...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Specialization</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{s.user.name}</p>
                    <p className="text-slate-400 text-xs">{s.user.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">{s.role.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-slate-500">{s.specialization || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(s.id)}
                      className="text-indigo-600 hover:underline text-xs font-medium"
                    >
                      {s.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

### TypeScript Types

#### `src/types/shop.ts`

```typescript
export interface Shop {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  province: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  logo_path: string | null;
  subscription?: ShopSubscription;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  max_staff: number;
  max_services: number;
}

export interface ShopSubscription {
  id: number;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  starts_at: string;
  ends_at: string | null;
  plan: SubscriptionPlan;
}
```

---

## F. PERMISSIONS MATRIX

| Feature                      | Admin | Shop Owner | Tailoring Staff | Customer |
| ---------------------------- | :---: | :--------: | :-------------: | :------: |
| **AUTH**               |      |            |                |          |
| Register / Login             |  ✅  |     ✅     |       ✅       |    ✅    |
| View own profile             |  ✅  |     ✅     |       ✅       |    ✅    |
| **ADMIN ACTIONS**      |      |            |                |          |
| View all shops               |  ✅  |     ❌     |       ❌       |    ❌    |
| Approve / reject shops       |  ✅  |     ❌     |       ❌       |    ❌    |
| Suspend a shop               |  ✅  |     ❌     |       ❌       |    ❌    |
| Manage subscription plans    |  ✅  |     ❌     |       ❌       |    ❌    |
| **SHOP MANAGEMENT**    |      |            |                |          |
| Register a shop              |  ❌  |     ✅     |       ❌       |    ❌    |
| View own shop profile        |  ✅  |     ✅     |    👁️ read    |    ❌    |
| Edit shop profile            |  ✅  |   ✅ own   |       ❌       |    ❌    |
| Upload shop logo             |  ❌  |     ✅     |       ❌       |    ❌    |
| **SUBSCRIPTIONS**      |      |            |                |          |
| View subscription status     |  ✅  |     ✅     |       ❌       |    ❌    |
| Subscribe / change plan      |  ❌  |     ✅     |       ❌       |    ❌    |
| Cancel subscription          |  ❌  |     ✅     |       ❌       |    ❌    |
| **STAFF**              |      |            |                |          |
| Create staff accounts        |  ❌  |     ✅     |       ❌       |    ❌    |
| View staff list              |  ✅  |     ✅     |    👁️ read    |    ❌    |
| Edit staff details / role    |  ❌  |     ✅     |       ❌       |    ❌    |
| Deactivate staff             |  ❌  |     ✅     |       ❌       |    ❌    |
| **SERVICES & PRICING** |      |            |                |          |
| Manage services              |  ❌  |     ✅     |       ❌       |    ❌    |
| View services                |  ❌  |     ✅     |       ✅       |    ✅    |
| Manage specializations       |  ❌  |     ✅     |       ❌       |    ❌    |
| Manage itemized pricing      |  ❌  |     ✅     |       ❌       |    ❌    |
| **APPOINTMENTS**       |      |            |                |          |
| Create appointments          |  ❌  |     ✅     |       ✅       |    ✅    |
| View all shop appointments   |  ❌  |     ✅     |       ✅       |    ❌    |
| View own appointments        |  ❌  |    N/A    |   ✅ assigned   |  ✅ own  |
| Update appointment status    |  ❌  |     ✅     |       ✅       |    ❌    |
| Cancel appointment           |  ❌  |     ✅     |       ✅       |  ✅ own  |
| **JOB ORDERS**         |      |            |                |          |
| Create job orders            |  ❌  |     ✅     |       ✅       |    ❌    |
| View all shop orders         |  ❌  |     ✅     |       ✅       |    ❌    |
| View own orders              |  ❌  |    N/A    |   ✅ assigned   |  ✅ own  |
| Update order status          |  ❌  |     ✅     |       ✅       |    ❌    |
| Assign staff to order        |  ❌  |     ✅     |       ❌       |    ❌    |
| **MEASUREMENTS**       |      |            |                |          |
| Record measurements          |  ❌  |     ✅     |       ✅       |    ❌    |
| View customer measurements   |  ❌  |     ✅     |       ✅       |  ✅ own  |
| Edit measurements            |  ❌  |     ✅     |   ✅ assigned   |    ❌    |
| **ANALYTICS & LOGS**   |      |            |                |          |
| View analytics dashboard     |  ✅  |     ✅     |       ❌       |    ❌    |
| View audit logs              |  ✅  | ✅ (Pro+) |       ❌       |    ❌    |

> **Subscription Gate Notes:**
> Basic plan: max 2 staff, 5 services, 20 appointments/month. No audit logs.
> Pro plan: max 10 staff, 30 services, 100 appointments/month. Includes audit logs.
> Premium: unlimited everything. Includes export and priority support.

---

## G. DEVELOPMENT PHASES

### Phase 1 — Auth + Database Core (Week 1–2)

**Backend Tasks:**

* [ ] `laravel new sutura-backend` — install Sanctum, set up `.env`
* [ ] Write all 14 migrations in dependency order
* [ ] Run `php artisan migrate:fresh`
* [ ] `RoleSeeder`, `SubscriptionPlanSeeder`, `AdminUserSeeder`
* [ ] `AuthController` — register, login, logout, me
* [ ] `RegisterRequest`, `LoginRequest` with validation
* [ ] `CheckRole` middleware, register in `bootstrap/app.php`
* [ ] Sanctum guard configuration
* [ ] Test all auth endpoints with Postman/Insomnia

**Frontend Tasks:**

* [ ] `npx create-next-app sutura-frontend --typescript`
* [ ] Install Tailwind CSS, Zustand, Axios
* [ ] Configure `axios.ts` with base URL and token interceptor
* [ ] `authStore.ts` with persist middleware
* [ ] Login page (connected to `/auth/login`)
* [ ] Register page (connected to `/auth/register`)
* [ ] Auth guard middleware for protected routes

**Deliverable:** Any user can register and log in. Roles are assigned. Tokens work.

---

### Phase 2 — Shop Profile + Subscription (Week 3)

**Backend Tasks:**

* [ ] `ShopController` — store, show, update, uploadLogo
* [ ] `ShopPolicy` — view, update, approve
* [ ] `StoreShopRequest`, `UpdateShopRequest`
* [ ] `CheckShopOwner` middleware
* [ ] `CheckShopApproved` middleware
* [ ] `ShopApprovalController` — index, approve, reject, suspend
* [ ] `SubscriptionPlanController` — full CRUD (admin)
* [ ] `ShopSubscriptionController` — show, store, cancel
* [ ] `SubscriptionService` — subscribe, cancel logic

**Frontend Tasks:**

* [ ] `shopStore.ts` — Zustand store for active shop
* [ ] Shop profile form page (view + edit)
* [ ] Admin shop approval list page
* [ ] Subscription status widget on dashboard

**Deliverable:** A shop owner can register, get approved by admin, and subscribe to a plan.

---

### Phase 3 — Staff + Services + Specializations (Week 4–5)

**Backend Tasks:**

* [ ] `StaffController` — index, store, update, destroy, toggleStatus
* [ ] `StaffService` — createStaff (creates user + profile atomically)
* [ ] `StaffPolicy`
* [ ] `StoreStaffRequest`, `UpdateStaffRequest`
* [ ] `ServiceController` — CRUD with soft delete
* [ ] `SpecializationController` — CRUD
* [ ] `ServicePricingController` — CRUD (itemized pricing)
* [ ] `StoreServiceRequest`, `StoreServicePricingRequest`
* [ ] `ServicePolicy`

**Frontend Tasks:**

* [ ] Staff management page — table view with toggle status button
* [ ] Staff form modal — create new staff account
* [ ] Service management page — list + add/edit modal
* [ ] Specialization management (simple list + add form)
* [ ] Itemized pricing table per service

**Deliverable:** Owner can manage the full team and service catalog.

---

### Phase 4 — Appointments + Job Orders + Measurements (Week 6)

**Backend Tasks:**

* [ ] `AppointmentController` — index, store, show, updateStatus, destroy
* [ ] `StoreAppointmentRequest` — validates future date, existing customer/service
* [ ] `AppointmentPolicy`
* [ ] `JobOrderController` — index, store, show, updateStatus, assign
* [ ] `StoreJobOrderRequest`
* [ ] Auto-generate `order_number` in `JobOrder::boot()`
* [ ] `MeasurementController` — index, store, show, update
* [ ] `StoreJobOrderRequest`

**Frontend Tasks:**

* [ ] Appointment list page — filter by status/date, update status buttons
* [ ] Job order list page — status pipeline display, assign staff
* [ ] Measurement form — record body measurements per customer

**Deliverable:** Full appointment → job order → measurement workflow is functional end-to-end.

---

### Phase 5 — Analytics + Audit Logs (Week 7)

**Backend Tasks:**

* [ ] `AnalyticsService` — getSummary, getRevenueSeries, getOrdersByStatus
* [ ] `AnalyticsController` — summary, revenue, orders
* [ ] `Auditable` trait — auto-logs create/update/delete
* [ ] Apply `Auditable` trait to: Shop, Service, StaffProfile, Appointment, JobOrder
* [ ] `AuditLogController` — index with filters and pagination
* [ ] Subscription gate for audit logs (Pro+ plans only)

**Frontend Tasks:**

* [ ] Dashboard analytics cards (from summary endpoint)
* [ ] Revenue chart (line/bar using a simple chart library)
* [ ] Audit log viewer — sortable/filterable table

**Deliverable:** Analytics dashboard is live. All key actions are logged.

---

### Phase 6 — Polish + Demo Prep (Week 8)

**Tasks:**

* [ ] Standardize all API error responses (validation, 404, 403, 500)
* [ ] Add loading states and error states to all frontend pages
* [ ] Make dashboard responsive (mobile-friendly)
* [ ] Write database factories for realistic demo seed data
* [ ] Create a `DemoSeeder` that populates a sample shop with staff, services, appointments, and orders
* [ ] Write a Postman collection covering all endpoints
* [ ] Write a clear `README.md` for both backend and frontend
* [ ] Rehearse demo walkthrough: register → approve → subscribe → add staff → book appointment → complete order → view analytics

**Deliverable:** System is demo-ready for capstone defense.

---

## H. SCOPE BOUNDARIES

### ✅ IN SCOPE (What This Project Builds)

* User registration and login with Laravel Sanctum
* Role-based access control (admin, shop_owner, staff, customer)
* Shop registration with admin approval/rejection workflow
* Shop profile management (details, logo upload)
* Subscription plan management (Basic / Pro / Premium) with feature gates
* Staff account creation and shop-role assignment
* Service catalog management with categories
* Apparel specialization management
* Itemized pricing per service and specialization
* Appointment scheduling with status management
* Job/order tracking with a 7-stage status pipeline
* Customer measurement storage (body measurements per shop visit)
* Analytics summary dashboard (revenue, orders, appointments, staff)
* Audit logs for all key mutations
* RESTful API with versioning (`/api/v1`)
* 7-screen frontend demo (Login, Dashboard, Shop Profile, Staff, Services, Appointments, Analytics)

---

### ❌ OUT OF SCOPE (What This Project Does NOT Build)

* Real payment gateway integration (payments are manually tracked as `amount_paid`)
* Real-time features (WebSockets, live notifications, live order tracking)
* Email/SMS notifications (noted as future work)
* Customer-facing self-service booking portal
* Multi-branch per shop support
* Fabric/material inventory management
* Mobile app (iOS or Android)
* Advanced PDF report generation/export
* CI/CD pipeline or Docker deployment
* Customer review and rating system
* Google Calendar or iCal integration
* Stripe/PayMongo billing for subscriptions (simulated in system)

---

## I. CAPSTONE DEFENSE EXPLANATION

### Why This Scope Is Practical and Defensible

**Dear Adviser,**

SUTURA is a full-stack web application designed to solve a real operational problem faced by small and medium-sized tailoring shops in the Philippines: the absence of a digital system to manage orders, staff, customer measurements, and business performance. Most local tailoring shops still rely on paper records, verbal job tracking, and manual ledgers. SUTURA replaces that with a structured, trackable, and scalable system.

---

### Three Pillars of Scope Justification

**1. Depth over breadth produces a stronger capstone.**

Rather than building four shallow modules, this project delivers a complete backend covering authentication, role-based access control, shop registration with an admin approval workflow, subscription-gated feature access, staff management, service catalog management, itemized pricing, appointment scheduling, job order tracking, measurement storage, analytics, and an audit trail. That is fourteen database tables, forty-plus API endpoints, four roles, multiple middleware layers, policies, service classes, and seeders. This is already a substantial and academically rigorous system.

**2. The 8-phase development plan is achievable.**

Each phase has a clear, concrete deliverable. Phase 1 produces a working auth system. Phase 2 produces shop registration and approval. Phases 3 and 4 build the operational core. Phase 5 adds analytics and observability. Phase 6 polishes for defense. This is a realistic 8-week plan for a student project.

**3. The tech stack reflects real industry standards.**

Laravel 11 with Sanctum is the dominant backend framework in Philippine software companies. Next.js with TypeScript and Tailwind CSS is the current standard for modern SPA development. Zustand is a lightweight, modern alternative to Redux. Using this stack means the project is not just academically relevant — it is immediately applicable in the job market.

---

### Why the Frontend Is Only 30%

The backend is the architectural heart of this project. The 30% frontend scope — seven screens — is precisely enough to demonstrate every backend module working in a real browser:

| Screen             | What It Demonstrates                       |
| ------------------ | ------------------------------------------ |
| Login              | Authentication, Sanctum tokens             |
| Dashboard          | Analytics API, role-based routing          |
| Shop Profile       | Shop management, form validation           |
| Staff Management   | Staff CRUD, toggle status, role assignment |
| Service Management | Service + pricing + specialization CRUD    |
| Appointments       | Status workflow, date filtering            |
| Analytics          | Revenue series, summary stats              |

A full customer-facing booking portal is explicitly noted as out of scope and is proposed as the natural follow-up system or second thesis phase — which demonstrates forward thinking rather than a gap.

---

### What Makes This Academically Defensible

The system demonstrates knowledge and application of: relational database normalization, foreign key constraints, soft deletes, multi-tenant data isolation, RESTful API design with versioning, form validation and error handling, policy-based authorization, middleware pipeline design, the service-layer pattern for business logic, subscription-based feature gating, computed model attributes, database seeding and factories, and frontend state management with a persisted Zustand store.

Every one of these is a concept taught in software engineering and web development curricula. The project connects classroom concepts to a real business domain, which is the definition of a successful capstone project.

**In summary:** SUTURA is not overbuilt and not underbuilt. It is focused, modular, technically rigorous, built on an industry-standard stack, and directly solves a problem experienced by real businesses in the local economy. It is ready to build, ready to demonstrate, and ready to defend.

---

*End of SUTURA Implementation Blueprint*
*Version 1.0 — Capstone Edition*
*Complete backend + 30% frontend for Shop Owner and Tailoring Shop modules*
