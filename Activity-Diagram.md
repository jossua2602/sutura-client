**ACTIVITY**

1. Administrative Module

**   **Actor: System Administrator

**   **This diagram describes the full workflow of a System Administrator managing the SUTURA platform.

**   **Flow:

Access SUTURA — Admin opens the platform.

Login — Credentials are entered.

Valid Credentials?

✅ Yes → Successful Login → Proceeds to dashboard.

❌ No → Retry Login — Loops back until valid.

Access Admin Dashboard — Admin lands on the main control panel.

Select Module — Admin chooses which area to manage:

Branch 1: Manage Tailoring Accounts

Views list of accounts.

Toggle Account Status — Activates or deactivates a tailoring account.

Update Account Status in DB — Saves the status change to the database.

Branch 2: Manage Subscription Plans

Views existing plans.

Update Pricing/Features — Modifies plan details.

Save Plan Changes — Persists the updates.

Monitor Subscription Lifecycles — Tracks active/expired subscriptions.

Branch 3: Review Registration

Views incoming shop registration requests.

Info Valid?

✅ Yes → Accept Registration → Send SMS/Email Notification to Shop Owner

❌ No → Decline Registration → Send SMS/Email Notification to Shop Owner

Branch 4: Monitor (System Overview)

Monitor Overall System Performance — Tracks platform health and usage.

View Analytics — Reviews platform-wide data and insights.

Return to Dashboard

Another Task?

✅ Yes → Loops back to Select Module

❌ No → Logout

2. Subscription and Account Management Module

**   **Actors: Shop Owner, System Admin, Tailoring Staff, System

**   **This diagram covers the complete shop registration, subscription selection, and account setup process.

**   **Shop Owner Flow:

Access SUTURA Landing Page — Shop owner visits the platform.

View Platform Features & Plans — Browses available subscription tiers.

Register Shop Account — Initiates the registration process.

Provide Shop Details — Submits business information.

Select Subscription Plan — Chooses from Basic, Pro, or Premium.

Process Subscription Payment — Pays for the selected plan.

Proceed Registration?

✅ Yes → Application is submitted for admin review.

❌ No → Stops the process.

System Admin Flow:

Receive & Review Shop Application — Admin examines submitted details.

Verify Shop Credentials — Validates the legitimacy of the business.

Authorize?

✅ Yes →

Approve Account

Activate Subscription Plan

Send Temporary Credentials (SMS/Email) → Shop Owner receives them.

Based on Subscription Tier:

Basic → Unlock Standard Features, Unlock Automated Notifications, Unlock All Basic Features.

Pro → Unlock Analytics & Support, Unlock All Pro Features, Boosted Search Visibility.

Premium → Top-Tier Visibility, Unlock All Pro Features.

❌ No →

Reject Application

Notify Shop Owner of Rejection

Shop Owner Post-Approval Flow:

Login with Temporary Credentials

Complete Onboarding / Change Password

Create Staff Accounts & Assign Roles

Access Dashboard & View Analytics

Rejection Path:

Receive Rejection Notification

Want to Re-Apply?

✅ Yes → Returns to Register Shop Account

❌ No → Ends

Tailoring Staff Flow:

Receive Credentials — Sent by shop owner.

Login to Staff Portal

Access Assigned Modules

3. Shop Discovery and Search Module

**   **Actors: Customer, System

**   **This diagram outlines how customers discover and explore tailoring shops.

**   **Flow:

Access SUTURA

Login

Valid Credentials?

✅ Yes → Successful Login

❌ No → Retry Login → Loops back.

Search Tailoring Services — Customer enters search query.

System: Display Initial Search Results

Filter Results — Customer refines by location, service type, etc.

System: Show the List of Tailoring Shops Nearby

Select & View Shop Profiles — Browses services, pricing, and location of a specific shop.

Interested?

✅ Yes → Proceed to Appointment/Order

❌ No → Returns to Search Tailoring Services

4. Map-Based Interface Module

**   **Actors: Customer, System

**   **A focused sub-module for geographic navigation to physical tailoring shops.

**   **Flow:

Open Map Interface — Customer launches the map feature.

System: Show Display Pinned Geolocation Coordinates — Map renders shop pins.

View the Tailoring Shop Location — Customer browses pinned shops.

Access Direction to Tailoring Shop — Customer selects a shop for navigation.

System: Provide directions — Navigation route is generated.

Follow the Direction Guide — Customer physically navigates to the shop.

5. Appointment Module

**   **Actors: Customer, System, Shop Owner

**   **This diagram covers the full appointment booking, rescheduling, and cancellation lifecycle.

**   **Flow:

Access SUTURA → Login

Valid Credentials?

✅ Yes → Successfully Login

❌ No → Retry Login

Search & Select Tailoring Shop

Book Appointment — Customer initiates booking.

Select Date, Time & Purpose

Submit Customer Info

System: Check Availability

Timeslot Available?

✅ Yes → Finalize Reservation → Send Confirmation SMS → Customer receives confirmation.

❌ No → Notify Timeslot Full → Customer must select a different slot.

Shop Owner Review:

Review Appointment Request

Approve?

✅ Yes → Proceeds to confirmation.

❌ No → Log Reason / Propose New Schedule

Reschedule Flow:

Accept Reschedule?

✅ Yes → Update New Slot/Date & Time → Send Reschedule SMS

❌ No → Cancel Existing Appointment

Update Appointment Status: Cancelled

Notify Shop Owner

6. Order Tracking and Measurement Module

**   **Actors: Customer, Tailoring Staff, Shop Owner, System

**   **This is the most detailed diagram, covering the entire job order lifecycle from placement to garment pickup.

**   **Customer — Order Placement:

Login → Authentication check (valid/retry).

Order Type?

Appointment — Walk-in or booked session.

Online — Placed through the platform.

Select Garment Specification & Fabric

Input Customer Info & Body Measurement/Size

Submit Order Details

System Validates Inputs:

Input Complete?

✅ Yes → Update Status to Pending Payment → Calculate Estimated Pick-Up → Send Order Confirmation → Notify Shop Owner for Review → Generate Job Order Profile

❌ No → Returns to input step.

Shop Owner — Order Review:

Review Order Feasibility

Order Feasible?

✅ Yes →

Review Tailoring Staff Workload

Tailoring Staff Available?

✅ Yes → Allocate Materials & Tailoring Staff → Distribute Order to Tailoring Staff

❌ No → Manage Queue / Call Off-Duty Tailoring Staff

❌ No →

Reject Order & Log Reason → Process Refund → Notify Customer of Cancellation

Tailoring Staff — Production:

Receive Order Details

Create/Retrieve Customer Profile

Measurement Exist?

✅ Yes → Review & Update Measurement

❌ No → Take Body Measurement → Save to Customer Profile

Submit Final Order Data

System: Update Status to Fabrication → Trigger SMS Notification

Retrieve Allocated Materials

Fabricate Garment

Perform Adjustment → Take Note Alteration → Perform Alteration

Quality Check:

Pass Quality Check?

✅ Pass → System: Update Status to Ready for Fitting → Trigger SMS Notification

❌ Fail → Request Adjustment → Returns to alteration.

Customer — Fitting & Pickup:

Receive & Attend Fitting

Satisfied?

✅ Yes →

Remaining Balance?

✅ Yes → Pay Remaining Balance → Verify Final Payment → Issue Digital Receipt

❌ No → Proceeds to finalization.

System: Update Status to Complete

Receive Finished Garment

Submit Feedback & Rating

❌ No → Returns to Perform Adjustment/Alteration

7. Tailoring Shop Management Module

**   **Actors: Shop Owner, System

**   **This diagram describes how a shop owner manages their storefront configuration on the platform.

**   **Flow:

Login → Authentication check (valid/retry).

Access Tailoring Shop Dashboard

Select Storefront Module — Owner picks which area to configure:

OptionActionConfigure Digital ProfileUpdates shop branding and infoManage Service CatalogsAdds/edits services offeredSet Itemized PricingConfigures price per service/garmentHandle Appointment SchedulesSets available appointment slotsControl Shop VisibilityToggles public/private shop statusManage Apparel SpecializationsDefines garment expertise

System: Save Storefront Configurations → Update Database & UI

Continue Managing Storefront?

✅ Yes → Returns to Select Storefront Module

❌ No → Return to Main Menu / Logout

These seven activity diagrams together map out the complete behavioral flow of the SUTURA tailoring platform — from system administration and account management, to customer-facing discovery, ordering, fitting, and final garment pickup.
