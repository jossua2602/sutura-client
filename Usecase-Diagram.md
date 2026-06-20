**Use case** ****

1. Tailoring Staff Module

**   **Actor: Tailoring Staff

**   **This module covers the operational tasks performed by tailoring staff during the garment production process.

Login — Staff must authenticate before accessing the system.

Receive Order Details — Staff receives job order information assigned to them.

Create/Retrieve Customer Profile — Fetches or creates the customer's profile associated with the order.

Manage Measurement — Handles body measurement data for the customer.

Take Body Measurement (extend) — An optional extension where actual measurements are recorded.

Check & Allocate Materials — Verifies material availability and assigns them to the order.

Retrieve Allocated Physical Materials — Physically pulls the pre-assigned materials.

Fabricate Garment — The core task of constructing the garment.

Manage Fitting Session — Coordinates fitting appointments with the customer.

Perform Adjustments/Alteration — Makes modifications based on fitting results.

Perform Quality Check — Ensures the garment meets quality standards before delivery.

Process Payment — Handles payment collection from the customer.

2. Shop Owner Module

**   **Actor: Shop Owner

**   **This module covers the management, administrative, and operational oversight functions of the shop owner.

Register Shop Account (extended by Configure Digital Profile & Process Subscription Payment) — Onboards the shop into the system, with extensions for profile setup and subscription.

Approve Orders Feasibility / Reject Orders — Reviews incoming job orders and decides whether to accept or decline.

Distribute Orders to Staff — Assigns approved orders to available tailoring staff.

Check & Allocate Materials — Manages inventory allocation for incoming orders.

Manage Shop Schedule — Controls the scheduling of appointments and shop operations.

Authorize Appointment — Reviews and approves customer-booked appointments.

Manage "OnHold" Queue — Handles orders that are pending or temporarily paused.

Request Adjustment/Alteration — Initiates revision requests on garments.

Manage Service Catalogs — Maintains the list of offered tailoring services.

Manage Apparel Specializations — Defines the specific garment types the shop specializes in.

Set Item Pricing (included in Manage Service Catalogs) — Configures prices for each service/item.

Handle Appointment Schedule — Day-to-day management of appointment slots.

Control Shop Visibility — Toggles the shop's public visibility on the platform.

Individual Shop Activity — Monitors shop-level operational activity.

Monthly Sales Revenue — Tracks and reviews monthly earnings.

Outstanding Customer Balances — Views unpaid or partially paid customer balances.

Create Tailoring Staff Account (includes Assigning Tailoring Staff Roles) — Creates accounts for staff and assigns their roles and permissions.

3. Customer Module

**   **Actor: Customer

**   **This module handles all customer-facing interactions with the platform.

Register/Login — Customers create an account or log in to access services.

Search for Services — Searches available tailoring services on the platform.

View Shop Profiles — Views detailed information about a specific tailoring shop.

View Map Interface / Tailoring Shop Location (includes View Map Interface) — Uses a map to find the physical location of shops.

Book Appointment — Schedules a tailoring appointment.

Reschedule Appointment (extend) — Optionally reschedules an existing booking.

Cancel Appointment (extend) — Optionally cancels a booking.

Place Job Order (includes Select Customer Info, Garment, Fabric & Order Type) — Submits a tailoring job order with item and fabric selections.

Payment Full/Deposit (include) — Payment is required when placing an order.

Apply Promo Code/Discount (extend) — Optional discount application.

Track Order Status — Monitors the progress of an active order.

View Personal Measurements — Reviews saved body measurements.

Submit Feedback & Rating — Provides post-service reviews for the shop.

Receive Notifications — Gets updates on order status, appointments, etc.

4. Administrative Module

**   **Actor: System Administrator

**   **This module governs the overall platform management and system oversight.

Login — Admin authenticates into the system.

Manage Tailoring Accounts — Oversees all registered tailoring shop accounts.

Manage Subscription Plans — Defines and maintains subscription tiers (Basic, Pro, Premium).

Manage Tailoring Owners Account (includes Active/Inactive Account, Manage Account) — Controls shop owner account status.

Manage Tailoring Registration — Oversees the shop registration and verification process.

Accept/Decline Registration — Approves or rejects new shop applications.

Manage Role / Manage Permission (included in Manage Account) — Configures role-based access and permissions.

Payment Monitoring — Monitors all payment transactions on the platform.

Audit Logs (included in System Monitor and Analysis) — Maintains logs of system activity.

Reports (included in System Monitor and Analysis) — Generates analytical and operational reports.

System Monitor and Analysis — Tracks system performance and usage.

Dispatch Notifications — Sends system-wide notifications to users.

5. Subscription and Account Management Module

**   **Actors: Shop Owner, System Admin

**   **This module focuses on the onboarding and subscription lifecycle for tailoring shops.

Register Shop Account — Shop owner begins registration.

Shop Details (include) — Submits business information.

Select Subscription Plan (include) — Chooses from Basic, Pro, or Premium.

Process Subscription Payment (include) — Completes payment for the chosen plan.

Review Shop Application (System Admin) — Admin reviews submitted shop applications.

Verify Business Credentials (include) — Validates the legitimacy of the business.

Reject Application (extend) — Declines invalid or incomplete applications.

Authorize Account Access (extend) — Grants platform access upon approval.

Send Temporary Credentials via SMS/Email (extend) — Delivers login credentials to the shop owner.

Manage Subscription Tiers — Admin manages the available subscription options.

Create Tailoring Staff Accounts (includes Assigning Tailoring Staff Roles) — Shop owner creates and configures staff accounts.

6. Shop Discovery and Search Module

**   **Actor: Customer

**   **This module enables customers to find and explore tailoring shops on the platform.

Search Tailoring Services — Main entry point for service discovery.

Filter Search Results (include) — Narrows results by criteria.

View Shop Profile (include) — Displays full shop information.

Service Catalogs (include) — Lists offered services.

Operational Hours (include) — Shows shop availability.

Item Pricing (include) — Displays pricing per service.

Location (include) — Shows the shop's address/map location.

Customer Reviews (include) — Displays ratings and feedback.

Register/Login — Customers must be authenticated to proceed with orders or bookings.

Map-Based Interface — Visual geographic browsing of nearby shops.

Access Navigation Directions — Get directions to the shop.

Filter Shop by Area — Narrows map view to a specific geographic area.

Navigate to Physical Shop — Initiates turn-by-turn navigation.

View Shop Locations — Displays all shop pins on the map.

7. Order Tracking and Measurement Module

**   **Actors: Customer, Tailoring Staff, Shop Owner

**   **This is the most comprehensive module, covering the full order lifecycle from placement to pickup.

Place Job Order (Customer)

Select Garment, Fabric & Order Type (include)

Manage Measurement (include)

Take Body Measurement (extend) — Optional on-site measurement.

Create/Retrieve Customer Profile (include)

Full/Deposit Payment (extend)

Apply Discount (extend)

Track Order Status (Customer) — Customer monitors real-time order progress.

Process Payment (Customer) — Final payment processing.

Approve Orders Feasibility / Reject Orders (Shop Owner) — Owner evaluates whether the order can be fulfilled.

Distribute Orders to Staff (Shop Owner) — Assigns work to tailoring staff.

Manage Queue (Shop Owner) — Manages the flow and priority of pending orders.

Check & Allocate Materials (Tailoring Staff) — Confirms and assigns materials.

Retrieve Allocated Physical Materials (Tailoring Staff) — Collects materials for production.

Fabricate Garment (Tailoring Staff) — Constructs the garment.

Manage Fitting Session (Tailoring Staff) — Schedules and manages try-on sessions.

Perform Adjustments/Alteration (Tailoring Staff) — Executes revisions post-fitting.

Request Adjustment/Alteration (extend) — Triggered when adjustments are requested.

Perform Quality Check (Tailoring Staff) — Final inspection before pickup.

Finalize Pickup & Feedback (Customer) — Customer collects the order and submits a review.

These seven diagrams together represent a full-stack tailoring management platform covering customer-facing discovery and ordering, staff production workflows, shop owner management, and system-level administration.
