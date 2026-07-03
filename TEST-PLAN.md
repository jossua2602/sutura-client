# SUTURA Shop Owner Dashboard — Test Plan

A step-by-step checklist to verify the new features. Each item lists **where to go**,
**what to do**, and **what you should see**. Everything below was confirmed working in the
browser during development, so if something doesn't match, it's worth flagging.

---

## 0. Setup

1. **Start the API** (Laravel, needs PHP 8.4):
   ```bash
   cd sutura-server
   composer install
   cp .env.example .env
   php artisan key:generate
   touch database/database.sqlite
   php artisan migrate:fresh --seed
   php artisan serve            # http://127.0.0.1:8000
   ```
2. **Start the client** (Next.js):
   ```bash
   cd sutura-client
   npm install
   npm run dev                  # http://localhost:3000
   ```
3. Open **http://localhost:3000/login** and sign in:
   - Email: `owner@sutura.com`
   - Password: `password`
   - ✅ You should land on the dashboard: *"Welcome Back, Maria!"*

---

## 1. Sidebar navigation

- [X] Under **Workroom**, you see **Custom Jobs**, **Customers**, and **Measurements**.
- [X] There is a **My Storefront** group containing **Storefront** and **Reviews**.
- [X] Under **Configuration** (bottom) you see **Branches**, **Billing & Plans**, **Account Settings**.
- [X] There is **no** standalone "Ready-to-Wear" item and **no** standalone "Reviews" in the Showroom group.

## 2. Design Catalog (rent/sale, filters, no Portfolio)

- [X] Open **Design Catalog**. At the top there's a tab strip: **Design Catalog | Ready-to-Wear Orders**.
- [X] There's a **Filter** bar: *All Types, All Categories, All Colors, All Sizes*, with an "X of 48" count on the right.
- [X] Change **All Types → For Rent**. The count drops (e.g. "10 of 48") and a **Clear filters** link appears.
- [X] Click **Create New Item**. The form has **Sale Price**, **Rental Price**, **Rental Deposit**, **Color**, and **Available Sizes** fields.
- [X] In the **Listing Type** dropdown there is **no** "Portfolio (Showcase Only)" option.

## 3. Printable receipt

- [X] Click the **Ready-to-Wear Orders** tab.
- [X] Each order row has a **Print Receipt** button. Click one.
- [X] A receipt appears with: shop name + address, **Receipt No.**, date, customer, **RENTAL/OFFICIAL RECEIPT** label, the item + price, and (for rentals) the **rental period** and **refundable deposit**, payment status, and fulfillment.
- [X] The **Print** button opens the browser print dialog showing only the receipt.

## 4. Appointments (walk-in vs online)

- [X] Open **Appointments**.
- [X] Each appointment row shows a **WALK-IN** or **ONLINE** badge next to its type.
  *(All seeded ones are walk-in; a booking made from the public form would show ONLINE.)*

## 5. Customer measurements (source)

- [X] Open **Measurements** (or a customer's **Measurements** tab).
- [X] Add a record — the form has a **Record Type** selector: *Shop Owner* vs *Customer-Side*.
- [X] Saved records display a **Shop Owner** or **Customer-Side** badge.

## 6. Staff work history

- [X] Open **Team Members**.
- [X] On a staff row, click the **clock / Work history** icon.
- [X] A modal opens showing **Assigned**, **Completed**, and **Active** counts plus the job list.
- [X] **Completion check:** open a **Custom Job** that has a staff member assigned, mark it **Completed**, then reopen that staff's Work History — their **Completed** count should go up by one.

## 7. Shop branches (map + landmark)

- [X] Open **Branches**. Top-right has a **Cards / Map** toggle.
- [X] Click **Map**. An interactive map appears with a **pin for each branch** that has coordinates.
- [X] Open **Add Branch** (or edit one). The form has a **Landmark** field (e.g. "beside Jollibee").

## 8. Dashboard & Insights (branch/date filters)

- [X] On **Home**, note the numbers (Today's Revenue, Active Orders, etc.).
- [X] Use the **branch selector** in the top bar (currently "All Branches") to pick a single branch — the numbers should update to that branch only.
- [X] Open **Insights**, change the date **period**, and the figures/charts should update. The **Print Report** button should open a clean printable report.

---

## Known not-done-yet (don't test these — they aren't built)

- Weekly calendar view for appointments; service-adaptive appointment types.
- Choosing a catalog design when creating a custom job.
- Merged Services + Specializations page; tag autocomplete; service video upload.
- Custom date-range picker on Insights.
- Renaming the demo catalog image files.
- The fabric-image **upload button** on the catalog form (the field exists, the uploader doesn't yet).
