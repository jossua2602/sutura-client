**BPMN** ****

Detailed Description of BPMN Diagrams

1. Subscription and Account Management

**   **Pools/Lanes: Shop Owner | System | Admin

**   **This BPMN describes the end-to-end process of registering a tailoring shop, selecting a subscription, and getting approved or rejected by the admin.

Shop Owner Lane:

Access Sutura Registration — Shop owner visits the registration page.

View Features & Services — Reviews what the platform offers.

Proceed Registration? (Gateway)

❌ No → Process ends.

✅ Yes →

Submit Shop Info — Fills in business details.

Select Subscription Plan — Chooses Basic, Pro, or Premium.

Process Subscription Payment — Pays for the chosen plan.

After Admin Decision:

✅ Approved Path:

Receive Temporary Credentials — Gets login info via SMS/Email.

Login & Change Temporary Password — Completes onboarding.

❌ Rejected Path:

Receive Rejection Notice — Notified of the declined application.

Want to Re-Apply? (Gateway)

✅ Yes → Returns to Submit Shop Info

❌ No → Process ends.

System Lane:

Update Status: Pending Verification — Flags the application for admin review.

Notify Admin of New Registration — Sends an alert to the admin.

After Admin Approval:

Activate Subscription Plan — Enables the chosen plan features.

Generate Temporary Credentials — Creates initial login credentials.

Send Approval Notification with Temporary Credentials (SMS/Email) — Delivers credentials to the shop owner.

After Admin Rejection:

Automatic Refund Process — Initiates a refund of the subscription payment.

Send Rejection & Refund Notice — Notifies the shop owner of both outcomes.

Admin Lane:

Review Business Info — Examines the submitted shop registration details.

Info Valid? (Gateway)

✅ Yes → Approve Registration

❌ No → Reject Registration → Log Reason for Rejection

2. Administrative Module

**   **Pool/Lane: System Administrator | System

**   **This BPMN covers the full administrative workflow for managing the platform's backend operations.

System Administrator Lane:

Login — Admin enters credentials.

Account Match? (Gateway)

✅ Yes → Authenticate Admin → Successful login.

❌ No → Show Error Login → Loops back.

Select Module (Gateway) — Admin picks from three management areas:

Branch 1: Manage Tailoring Accounts

Toggle Account Status — Activates or deactivates an account.

Update Account Status in DB — Commits the change.

Branch 2: Manage Subscription Plans

Update Pricing/Features — Edits plan details.

Save Plan Changes — Persists updates.

Monitor Subscription Lifecycles — Tracks subscription statuses.

Branch 3: Review Registration

Info Verified? (Gateway)

✅ Yes → Accept Registration → Send SMS/Email Notification

❌ No → Decline Registration → Send SMS/Email Notification

Branch 4: Monitor

Monitor System Overview

Monitor Overall System Performance

View System Analytics — Reviews platform-wide performance data.

Return to Dashboard

Another Task? (Gateway)

✅ Yes → Returns to Select Module

❌ No → Logout

3. Shop Discovery and Search Module

**   **Pools/Lanes: Customer | System

**   **This BPMN describes how a customer searches for and discovers tailoring shops on the platform.

Customer Lane:

Open Sutura Platform — Customer launches the app/website.

Search Tailoring Shop Services — Enters a search query.

Filter Results — Applies filters (location, service type, price range, etc.).

Select & View Shop Profiles — Browses services, pricing, and location of a chosen shop.

Interested? (Gateway)

✅ Yes → Proceed to Appointment/Order

❌ No → Returns to Search Tailoring Shop Services

System Lane:

Display Initial Search Results — Renders the first set of matching shops.

Show the List of Tailoring Shops — Populates the filtered shop list.

4. Map-Based Interface Module

**   **Pools/Lanes: Customer | System

**   **A focused sub-process for locating tailoring shops using a map.

Customer Lane:

Open Map Interface — Customer activates the map view.

View Tailoring Shop Locations — Browses pinned shops on the map.

Follow the Directions — Customer physically navigates to the shop.

System Lane:

Display Pinned Geolocation Coordinates — Renders shop location pins on the map.

Access Directions to Tailoring Shop — Generates navigation route for the selected shop.

5. Order Tracking and Measurement Module

**   **Pools/Lanes: Customer | System | Tailoring Staff | Shop Owner

**   **This is the most comprehensive BPMN, covering the complete order lifecycle from placement to final pickup and feedback.

Customer Lane:

Login

Account Match? (Gateway)

✅ Yes → Authenticated.

❌ No → Retry Login → Loops back.

Order Type? (Gateway)

Online →

Select Garment Specifications & Fabric

Input Customer Info & Body Measurements/Size

Submit Order Details

Process Payment (Full / Deposit)

Appointment →

Book / Attend Appointment

Receive Reject Notification — If order is rejected by shop owner.

Notify Customer for Production — Informed that fabrication has started.

Receive & Attend Fitting — Customer attends the fitting session.

Satisfied? (Gateway)

❌ No → Returns to adjustment/alteration phase.

✅ Yes →

Remaining Balance? (Gateway)

✅ Yes → Pay Remaining Balance

❌ No → Proceeds directly.

Finalized Pick-Up

Receive Finished Garment

Submit Feedback & Rating

System Lane:

Authenticate User (Account Match check)

Validate Customer Inputs

Input Complete? (Gateway)

✅ Yes →

Update Status to Pending Payment

Calculate Estimated Pick-Up

Generate Job Order Profile

Send Order Confirmation

Notify Shop Owner for Review

❌ No → Returns to input validation.

Notify Customer for Cancelled + Process Refund — If order is rejected.

Update Status to Fabrication → Trigger SMS Notification

Update Status: Ready for Fitting — After quality check is passed.

Verify Final Payment → Issue Digital Receipt

Update Status to Completed

Tailoring Staff Lane:

Receive Order Details — Gets assigned job order.

Create/Retrieve Customer Profile

Measurement Exist? (Gateway)

✅ Yes → Review & Update Measurement

❌ No → Take Body Measurements → Save to Customer Profile

Submit Final Order Data

Retrieve Allocated Materials

Fabricate Garment

Perform Adjustment → Take Note Alteration → Perform Alteration

Pass Quality Check? (Gateway)

✅ Pass → Triggers status update to Ready for Fitting.

❌ Fail → Request Adjustment → Returns to adjustment loop.

Shop Owner Lane:

Review Order Feasibility

Order Feasible? (Gateway)

✅ Yes →

Review Tailoring Staff Workload

Tailoring Staff Available? (Gateway)

✅ Yes → Allocate Materials & Tailoring Staff → Distribute Order to Tailoring Staff

❌ No → Manage Queue / Call Off-Duty

❌ No → Reject Order & Log Reason

Appointment Sub-Process (within Order Module):

Customer:

Search Tailoring Shops → Select Shop

Is Available? (Gateway)

✅ Yes → Create Appointment

❌ No → Returns to search.

Fill-in Customer Info, Date & Time, Purpose, Measurement

Submit Appointment Request

Receive Appointment Confirmation

Receive Reschedule (SMS)

Pick New Time? (Gateway)

✅ Yes → Updates to new slot.

❌ No → Receive Cancellation (SMS)

System:

Validate Timeslot

Send Approve Confirmation to Customer (SMS)

Send Reschedule/Rejection (SMS)

Shop Owner:

Receive Appointment Request

Review Appointment Request

Check Available Tailors Staff

Is Available? (Gateway)

✅ Yes → Approves appointment.

❌ No → Log Reason & Suggest New Time

These five BPMN diagrams collectively model the end-to-end business process flows of the SUTURA tailoring platform — from shop registration and admin oversight, to customer discovery, appointment scheduling, order management, and garment production — clearly defining responsibilities across each swimlane participant.
