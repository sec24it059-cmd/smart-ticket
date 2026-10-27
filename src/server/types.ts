export type Role = 'ADMIN' | 'ORGANIZER' | 'ATTENDEE';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'SUSPENDED';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED' | 'TIMED_OUT';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  createdAt: string;
}

export interface Event {
  id: string;
  organizationId: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  category: string;
  venueName: string;
  venueAddress: string;
  city: string;
  startDate: string;
  endDate: string;
  bookingOpensAt: string;
  salesClosesAt: string;
  maxCapacity: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TicketCategory {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  totalQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  maxPerUser: number;
  salesClosesAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationItem {
  id: string;
  reservationId: string;
  ticketCategoryId: string;
  categoryName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Reservation {
  id: string;
  eventId: string;
  userId: string;
  reservationNumber: string;
  status: ReservationStatus;
  expiresAt: string;
  totalAmount: number;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  items: ReservationItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  ticketCategoryId: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  attendeeName: string;
  attendeeEmail: string;
  qrCode: string;
}

export interface Order {
  id: string;
  reservationId: string;
  eventId: string;
  userId: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface PaymentTransaction {
  id: string;
  orderId?: string;
  reservationId: string;
  providerReference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  providerResponse?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  organizations: Organization[];
  organizationMembers: OrganizationMember[];
  events: Event[];
  ticketCategories: TicketCategory[];
  reservations: Reservation[];
  orders: Order[];
  paymentTransactions: PaymentTransaction[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}
