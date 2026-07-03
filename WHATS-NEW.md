# SUTURA Shop Owner Dashboard — What's New

_Last updated: 2026-07-03_

This is a plain-language summary of the recent round of fixes and new features on the
**Shop Owner Dashboard**. It covers both repos — the Next.js client (`sutura-client`) and
the Laravel API (`sutura-server`).

Everything here is **Shop-Owner scope only** — no System Admin, Staff, or Customer portals
were built. The existing public booking form (which feeds the dashboard) was kept.

---

## TL;DR

- 🔴 **Fixed the production build** — it was broken by TypeScript errors and wouldn't compile. It's clean now.
- 🧭 **Rebuilt the sidebar** — the "missing" tabs (Measurements, My Storefront, Billing, Account Settings) now show up, and Ready-to-Wear is folded into the Design Catalog as a tab.
- 🛍️ **Design Catalog upgrades** — separate **rent vs. sale** pricing, a **Color** field, **available sizes**, live **filters** (Color / Size / Category / Type), and the "Portfolio" type was removed.
- 🧾 **Printable receipts** — every Ready-to-Wear **sale or rental** can now generate a clean printable receipt.
- 📅 **Appointments** — walk-in vs. online bookings are now tagged and shown with a badge.
- 📏 **Measurements** — records are now labelled **Shop Owner** vs. **Customer-Side**.
- 👔 **Staff work history** — you can now see each staff member's **jobs assigned vs. completed**.
- 🗺️ **Branches map** — an interactive map showing all your branches with pins, plus a **Landmark** field ("beside Jollibee", etc.).
- 📊 **Dashboard analytics** — the numbers now correctly respect the **branch** and **date** filters.

---

## What changed, module by module

### Sidebar navigation
- Added the previously hidden pages to the sidebar: **Measurements**, **My Storefront**, **Billing & Plans**, **Account Settings**.
- **Ready-to-Wear** is no longer its own item — it now lives as a tab inside **Design Catalog** ("Design Catalog | Ready-to-Wear Orders").
- **Reviews** moved under a new **My Storefront** group.

### Design Catalog (RTW + Sale + Rent)
- Items can now hold **separate rent and sale prices** plus a **rental deposit**.
- Added a **Color** attribute and an **Available Sizes** field.
- Added a **filter bar** on the catalog list (Color, Size, Category, Listing Type) with a live "X of Y" count.
- Removed the **"Portfolio (Showcase Only)"** listing type.
- Backend now also supports a **fabric/material image** field (the upload widget on the form is still to be added).

### Printable receipts
- Any sale or rental order can open a **printable receipt** showing the shop details, receipt number, customer, item, amounts, rental period + refundable deposit (for rentals), payment status, and fulfillment method.

### Appointments
- Every appointment is now tagged as **Walk-in** (owner-created) or **Online** (from the public booking form) and shows a badge in the list.

### Customer measurements
- Measurement records now carry a **source**: **Shop Owner** (the tailor's own format) or **Customer-Side** (encoded from the customer). A badge shows which is which, and there's a selector when adding a record.

### Staff / Team Members
- New **Work History** view per staff member: **Assigned**, **Completed**, and **Active** counts plus the list of jobs they worked on.
- Completion is recorded automatically when **you** mark a job as completed (owner-driven — no staff login needed).

### Shop Branches
- New **Map view** (toggle between Cards and Map) that plots all branches with pins and popups.
- Added a **Landmark** field to the branch form and card.

### Dashboard & Insights
- Fixed a bug where the home/insights numbers (overdue orders, pending deposits, revenue, etc.) ignored the selected **branch** and **date range**. They now filter correctly.

---

## Backend changes (`sutura-server`)

- **Bug fix:** service **tags** were being silently dropped on save — now they persist.
- **Bug fix:** analytics KPIs + revenue chart now honor the **branch** and **date** filters.
- **New columns** on catalog items: `sale_price`, `rental_price`, `rental_deposit`, `color`, `sizes`, `fabric_image_url`; plus `order_mode` on catalog orders.
- **New column** on measurements: `source` (shop_owner / customer).
- **New column** on appointments: `intake_channel` (walkin / online).
- **New endpoint:** `GET /shops/{shop}/staff/{staff}` — a staff member's work-history log.
- Staff **completion** is stamped automatically when a job order is marked completed.

---

## Testing & verification

- **Server:** automated test suite passes — **13/13 tests** (auth, job orders, catalog rentals + fields, service tags, analytics branch-scoping, measurement source, staff completion, online booking intake).
- **Client:** production build + type-check is **clean**.
- **Live check:** the dashboard was run end-to-end in a browser (logged in as the shop owner) and the following were confirmed working: the new sidebar, the Catalog tabs + filters, the printable receipt, the Branches map, the Staff work-history view, and the Appointment badges. No console errors.

---

## Still to do (not done yet)

- Appointments: weekly calendar view + service-adaptive types (e.g. "Mockup Approval" for jerseys).
- Custom Jobs → Design Catalog link (choosing a catalog design when creating a custom job).
- Services & Specializations: merge into one page + tag autocomplete + video upload.
- Insights: in-page custom date-range picker.
- Public/catalog image cleanup (rename the messy demo image files).
- Design Catalog: the fabric-image **upload widget** on the form (the field/back-end is ready).

---

## Running it locally

**Client (Next.js):**
```bash
cd sutura-client
npm install
npm run dev            # http://localhost:3000
```

**Server (Laravel):** needs PHP 8.4. If you have PHP + Composer:
```bash
cd sutura-server
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
php artisan serve       # http://127.0.0.1:8000
```

**Demo login (from the local seeder):** `owner@sutura.com` / `password`
