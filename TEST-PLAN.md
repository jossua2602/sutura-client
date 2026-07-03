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

- [ ] Under **Workroom**, you see **Custom Jobs**, **Customers**, and **Measurements**.
- [ ] There is a **My Storefront** group containing **Storefront** and **Reviews**.
- [ ] Under **Configuration** (bottom) you see **Branches**, **Billing & Plans**, **Account Settings**.
- [ ] There is **no** standalone "Ready-to-Wear" item and **no** standalone "Reviews" in the Showroom group.

## 2. Design Catalog (rent/sale, filters, no Portfolio)

- [ ] Open **Design Catalog**. At the top there's a tab strip: **Design Catalog | Ready-to-Wear Orders**.
- [ ] There's a **Filter** bar: *All Types, All Categories, All Colors, All Sizes*, with an "X of 48" count on the right.
- [ ] Change **All Types → For Rent**. The count drops (e.g. "10 of 48") and a **Clear filters** link appears.
- [ ] Click **Create New Item**. The form has **Sale Price**, **Rental Price**, **Rental Deposit**, **Color**, and **Available Sizes** fields.
- [ ] In the **Listing Type** dropdown there is **no** "Portfolio (Showcase Only)" option.

## 3. Printable receipt

- [ ] Click the **Ready-to-Wear Orders** tab.
- [ ] Each order row has a **Print Receipt** button. Click one.
- [ ] A receipt appears with: shop name + address, **Receipt No.**, date, customer, **RENTAL/OFFICIAL RECEIPT** label, the item + price, and (for rentals) the **rental period** and **refundable deposit**, payment status, and fulfillment.
- [ ] The **Print** button opens the browser print dialog showing only the receipt.

## 4. Appointments (walk-in vs online)

- [ ] Open **Appointments**.
- [ ] Each appointment row shows a **WALK-IN** or **ONLINE** badge next to its type.
  *(All seeded ones are walk-in; a booking made from the public form would show ONLINE.)*

## 5. Customer measurements (source)

- [ ] Open **Measurements** (or a customer's **Measurements** tab).
- [ ] Add a record — the form has a **Record Type** selector: *Shop Owner* vs *Customer-Side*.
- [ ] Saved records display a **Shop Owner** or **Customer-Side** badge.

## 6. Staff work history

- [ ] Open **Team Members**.
- [ ] On a staff row, click the **clock / Work history** icon.
- [ ] A modal opens showing **Assigned**, **Completed**, and **Active** counts plus the job list.
- [ ] **Completion check:** open a **Custom Job** that has a staff member assigned, mark it **Completed**, then reopen that staff's Work History — their **Completed** count should go up by one.

## 7. Shop branches (map + landmark)

- [ ] Open **Branches**. Top-right has a **Cards / Map** toggle.
- [ ] Click **Map**. An interactive map appears with a **pin for each branch** that has coordinates.
- [ ] Open **Add Branch** (or edit one). The form has a **Landmark** field (e.g. "beside Jollibee").

## 8. Dashboard & Insights (branch/date filters)

- [ ] On **Home**, note the numbers (Today's Revenue, Active Orders, etc.).
- [ ] Use the **branch selector** in the top bar (currently "All Branches") to pick a single branch — the numbers should update to that branch only.
- [ ] Open **Insights**, change the date **period**, and the figures/charts should update. The **Print Report** button should open a clean printable report.

---

## Known not-done-yet (don't test these — they aren't built)

- Weekly calendar view for appointments; service-adaptive appointment types.
- Choosing a catalog design when creating a custom job.
- Merged Services + Specializations page; tag autocomplete; service video upload.
- Custom date-range picker on Insights.
- Renaming the demo catalog image files.
- The fabric-image **upload button** on the catalog form (the field exists, the uploader doesn't yet).
