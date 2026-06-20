**Sequence diagram** ****

Figure 1 — Administrative Dashboard Sequence Diagram

sequenceDiagram

**    **autonumber

**    **actor Admin as System Administrator

**    **participant UI as Admin Dashboard UI

**    **participant System as SUTURA System

**    **participant DB as Database

**    **Admin->>UI: Open admin dashboard

**    **UI->>System: Request pending shop registrations

**    **System->>DB: Fetch registration records

**    **DB-->>System: Return shop applications

**    **System-->>UI: Display pending applications

**    **Admin->>UI: Review apparel categories and branch location

**    **Admin->>UI: Approve or reject registration

**    **UI->>System: Submit admin decision

**    **System->>DB: Update shop account status

**    **DB-->>System: Status saved

**    **System-->>UI: Show confirmation

Figure 2 — Subscription and Account Management Sequence Diagram

sequenceDiagram

**    **autonumber

**    **actor Owner as Shop Owner

**    **participant UI as Registration UI

**    **participant System as SUTURA System

**    **participant DB as Database

**    **Owner->>UI: Register shop account

**    **Owner->>UI: Enter shop details

**    **Owner->>UI: Select subscription plan

**    **UI->>System: Submit registration and plan

**    **System->>DB: Save shop record as inactive

**    **DB-->>System: Shop saved

**    **Owner->>UI: Complete subscription payment

**    **UI->>System: Confirm payment

**    **System->>DB: Activate subscription

**    **DB-->>System: Subscription updated

**    **System-->>UI: Show active plan confirmation

**    **Owner->>UI: Create staff accounts and roles

**    **UI->>System: Save staff access data

**    **System->>DB: Store staff profiles

**    **DB-->>System: Staff accounts saved

Figure 3 — Shop Discovery and Search Sequence Diagram

sequenceDiagram

**    **autonumber

**    **actor Customer as Customer

**    **participant UI as Marketplace UI

**    **participant System as SUTURA System

**    **participant DB as Database

**    **Customer->>UI: Search tailoring services

**    **Customer->>UI: Apply filters by garment, location, and specialization

**    **UI->>System: Send search request

**    **System->>DB: Query matching tailoring shops

**    **DB-->>System: Return shop list

**    **System-->>UI: Display filtered results

**    **Customer->>UI: Open shop profile

**    **UI->>System: Request shop details

**    **System->>DB: Fetch services, pricing, and reviews

**    **DB-->>System: Return shop profile data

**    **System-->>UI: Show full shop information

Figure 4 — Map-Based Interface Sequence Diagram

sequenceDiagram

**    **autonumber

**    **actor Customer as Customer

**    **participant UI as Map Interface UI

**    **participant System as SUTURA System

**    **participant DB as Database

**    **Customer->>UI: Open map-based interface

**    **UI->>System: Request verified shop locations

**    **System->>DB: Fetch branch coordinates

**    **DB-->>System: Return map location data

**    **System-->>UI: Display shop pins in Davao City

**    **Customer->>UI: Filter shops by area

**    **UI->>System: Apply area filter

**    **System->>DB: Query matching branches

**    **DB-->>System: Return filtered branches

**    **System-->>UI: Update visible map pins

**    **Customer->>UI: Select a shop pin

**    **UI->>System: Request directions

**    **System-->>UI: Show navigation details to physical shop

Figure 5 — Tailoring Shop Dashboard Sequence Diagram

sequenceDiagram

**    **autonumber

**    **actor Owner as Shop Owner

**    **participant UI as Shop Dashboard UI

**    **participant System as SUTURA System

**    **participant DB as Database

**    **Owner->>UI: Open shop dashboard

**    **Owner->>UI: Update digital profile

**    **Owner->>UI: Manage service catalog and specializations

**    **Owner->>UI: Set item pricing

**    **UI->>System: Submit shop configuration

**    **System->>DB: Save profile, services, and pricing

**    **DB-->>System: Data saved

**    **System-->>UI: Show updated storefront

**    **Owner->>UI: Manage appointment schedule

**    **Owner->>UI: Toggle public visibility

**    **UI->>System: Save schedule and visibility changes

**    **System->>DB: Update shop settings

**    **DB-->>System: Settings updated

**    **System-->>UI: Show success confirmation

Figure 6 — Order Tracking and Measurement Sequence Diagram

sequenceDiagram

**    **autonumber

**    **actor Customer as Customer

**    **actor Staff as Tailoring Staff

**    **actor Owner as Shop Owner

**    **participant UI as Order Tracking UI

**    **participant System as SUTURA System

**    **participant DB as Database

**    **Customer->>UI: Place job order

**    **Customer->>UI: Select garment, fabric, and order type

**    **Customer->>UI: Schedule fitting appointment

**    **UI->>System: Submit order request

**    **System->>DB: Create pending order

**    **DB-->>System: Order saved

**    **System-->>UI: Show order confirmation

**    **Owner->>UI: Review and approve job order

**    **UI->>System: Send approval decision

**    **System->>DB: Update order status

**    **DB-->>System: Status updated

**    **Customer->>Staff: Attend fitting session

**    **Staff->>UI: Record or retrieve measurements

**    **UI->>System: Save measurement data

**    **System->>DB: Store customer measurements

**    **DB-->>System: Measurements saved

**    **Staff->>UI: Update production stage

**    **UI->>System: Log progress status

**    **System->>DB: Update order progress

**    **DB-->>System: Progress saved

**    **System-->>UI: Notify customer of progress

**    **Staff->>UI: Mark order ready for pickup

**    **UI->>System: Update final status

**    **System->>DB: Save completion status

**    **DB-->>System: Order completed

**    **System-->>UI: Notify customer for pickup

Figure 7 — Interactive Analytics Dashboard Sequence Diagram

sequenceDiagram

**    **autonumber

**    **actor User as Admin or Shop Owner

**    **participant UI as Analytics Dashboard UI

**    **participant System as SUTURA System

**    **participant DB as Database

**    **User->>UI: Open analytics dashboard

**    **User->>UI: Select report type

**    **UI->>System: Request analytics data

**    **System->>DB: Aggregate records

**    **DB-->>System: Return raw data

**    **System->>System: Compute charts and metrics

**    **System-->>UI: Display visual reports

**    **User->>UI: Review subscription activity

**    **User->>UI: Review monthly sales revenue

**    **User->>UI: Review outstanding balances and productivity

**    **UI->>System: Request updated report view

**    **System->>DB: Fetch latest records

**    **DB-->>System: Return updated analytics

**    **System-->>UI: Refresh dashboard

Final check against your brief

This version now matches the source structure:

admin monitoring and verification

subscription and account management

discovery, search, and map interface

order tracking and measurement lifecycle
