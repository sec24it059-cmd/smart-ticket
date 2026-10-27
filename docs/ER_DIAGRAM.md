# TicketNest Entity-Relationship (ER) Architecture

The following Mermaid diagram models the complete normalized PostgreSQL relational database schema for TicketNest:

```mermaid
erDiagram
    User ||--o{ OrganizationMember : "member of"
    User ||--o{ Reservation : "places"
    User ||--o{ Orders : "owns"
    User ||--o{ Notification : "receives"
    User ||--o{ AuditLog : "triggers"

    Organization ||--o{ OrganizationMember : "has"
    Organization ||--o{ Event : "publishes"

    Event ||--o{ TicketCategory : "offers"
    Event ||--o{ Reservation : "has"
    Event ||--o{ Orders : "receives"

    TicketCategory ||--o{ ReservationItem : "reserved in"
    TicketCategory ||--o{ OrderItem : "sold in"

    Reservation ||--o{ ReservationItem : "contains"
    Reservation ||--o| Orders : "converts to"
    Reservation ||--o{ PaymentTransaction : "initiates"

    Orders ||--o{ OrderItem : "contains"
    Orders ||--o{ PaymentTransaction : "settled by"

    User {
        string id PK
        string email UK
        string passwordHash
        string name
        enum role "ADMIN | ORGANIZER | ATTENDEE"
        enum status "ACTIVE | SUSPENDED | INACTIVE"
        datetime createdAt
        datetime updatedAt
    }

    Organization {
        string id PK
        string name
        string slug UK
        string description
        string logoUrl
        boolean verified
        datetime createdAt
        datetime updatedAt
    }

    OrganizationMember {
        string id PK
        string organizationId FK
        string userId FK
        enum role "OWNER | ADMIN | MEMBER"
        datetime createdAt
    }

    Event {
        string id PK
        string organizationId FK
        string title
        string slug UK
        string description
        string coverImage
        string category
        string venueName
        string venueAddress
        string city
        datetime startDate
        datetime endDate
        datetime bookingOpensAt
        datetime salesClosesAt
        int maxCapacity
        enum status "DRAFT | PUBLISHED | CANCELLED | SUSPENDED"
        datetime createdAt
        datetime updatedAt
    }

    TicketCategory {
        string id PK
        string eventId FK
        string name
        string description
        float price
        int totalQuantity
        int reservedQuantity
        int soldQuantity
        int maxPerUser
        datetime salesClosesAt
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Reservation {
        string id PK
        string eventId FK
        string userId FK
        string reservationNumber UK
        enum status "PENDING | CONFIRMED | EXPIRED | CANCELLED"
        datetime expiresAt
        float totalAmount
        string idempotencyKey UK
        datetime createdAt
        datetime updatedAt
    }

    ReservationItem {
        string id PK
        string reservationId FK
        string ticketCategoryId FK
        int quantity
        float unitPrice
        float subtotal
    }

    Orders {
        string id PK
        string reservationId FK, UK
        string eventId FK
        string userId FK
        string orderNumber UK
        float totalAmount
        string currency
        enum status "PENDING | PAID | FAILED | REFUNDED"
        datetime createdAt
        datetime updatedAt
    }

    OrderItem {
        string id PK
        string orderId FK
        string ticketCategoryId FK
        int quantity
        float unitPrice
        float subtotal
        string attendeeName
        string attendeeEmail
        string qrCode
    }

    PaymentTransaction {
        string id PK
        string orderId FK
        string reservationId FK
        string providerReference UK
        float amount
        string currency
        enum status "INITIATED | SUCCESS | FAILED | TIMED_OUT"
        string providerResponse
        string idempotencyKey UK
        datetime createdAt
        datetime updatedAt
    }

    Notification {
        string id PK
        string userId FK
        string title
        string message
        boolean read
        datetime createdAt
    }

    AuditLog {
        string id PK
        string userId FK
        string action
        string entityType
        string entityId
        string details
        string ipAddress
        datetime createdAt
    }
```

## Concurrency and Inventory Invariants
1. **Capacity Guarantee**:
   For any ticket category $C$:
   $$\text{reservedQuantity} + \text{soldQuantity} \le \text{totalQuantity}$$
2. **Deterministic Hold**:
   During reservation creation, $\text{reservedQuantity} \leftarrow \text{reservedQuantity} + Q$ inside an isolated transaction.
3. **10-Minute Expiration**:
   If $\text{now} > \text{expiresAt}$ and $\text{status} = \text{PENDING}$, the expiration worker updates $\text{status} \leftarrow \text{EXPIRED}$ and releases $\text{reservedQuantity} \leftarrow \max(0, \text{reservedQuantity} - Q)$.
4. **Idempotent Settlement**:
   Payment callbacks verify whether the reservation is in terminal state; repeat callbacks return `IDEMPOTENT_IGNORED` without creating duplicate orders.
