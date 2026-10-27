import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  DatabaseSchema,
  User,
  Organization,
  OrganizationMember,
  Event,
  TicketCategory,
  Reservation,
  Order,
  PaymentTransaction,
  Notification,
  AuditLog,
} from './types.ts';

// Simple in-process Mutex to guarantee serial execution of transactional inventory mutations
class SimpleMutex {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const execute = () => {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          const next = this.queue.shift();
          if (next) {
            next();
          }
        });
      };

      if (!this.locked) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
}

const dbMutex = new SimpleMutex();

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'ticketnest_db.json');

// Default initial database state with seed data
function getInitialData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const organizerHash = bcrypt.hashSync('organizer123', salt);
  const attendeeHash = bcrypt.hashSync('attendee123', salt);

  const now = new Date();
  const pastDate = new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString();
  const futureDate1 = new Date(now.getTime() + 15 * 24 * 3600 * 1000).toISOString();
  const futureDate2 = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();
  const futureDate3 = new Date(now.getTime() + 45 * 24 * 3600 * 1000).toISOString();

  const users: User[] = [
    {
      id: 'usr_admin_1',
      email: 'admin@ticketnest.io',
      passwordHash: adminHash,
      name: 'Elena Rostova',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: pastDate,
      updatedAt: pastDate,
    },
    {
      id: 'usr_org_1',
      email: 'organizer@pulsefest.io',
      passwordHash: organizerHash,
      name: 'Vikram Seth',
      role: 'ORGANIZER',
      status: 'ACTIVE',
      createdAt: pastDate,
      updatedAt: pastDate,
    },
    {
      id: 'usr_org_2',
      email: 'organizer@summit.org',
      passwordHash: organizerHash,
      name: 'Maya Lin',
      role: 'ORGANIZER',
      status: 'ACTIVE',
      createdAt: pastDate,
      updatedAt: pastDate,
    },
    {
      id: 'usr_att_1',
      email: 'attendee@example.com',
      passwordHash: attendeeHash,
      name: 'Aarav Patel',
      role: 'ATTENDEE',
      status: 'ACTIVE',
      createdAt: pastDate,
      updatedAt: pastDate,
    },
  ];

  const organizations: Organization[] = [
    {
      id: 'org_pulse_1',
      name: 'PulseLive Entertainment & Media',
      slug: 'pulselive',
      description: 'Premier curator of music festivals, tech symposiums, and cultural gatherings across Asia.',
      logoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
      verified: true,
      createdAt: pastDate,
      updatedAt: pastDate,
    },
    {
      id: 'org_summit_2',
      name: 'Apex Horizon Global Summits',
      slug: 'apex-horizon',
      description: 'Leading global conference organizers focusing on Cloud Architecture, AI Innovation, and Founder ecosystems.',
      logoUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80',
      verified: true,
      createdAt: pastDate,
      updatedAt: pastDate,
    },
  ];

  const organizationMembers: OrganizationMember[] = [
    {
      id: 'mem_1',
      organizationId: 'org_pulse_1',
      userId: 'usr_org_1',
      role: 'OWNER',
      createdAt: pastDate,
    },
    {
      id: 'mem_2',
      organizationId: 'org_summit_2',
      userId: 'usr_org_2',
      role: 'OWNER',
      createdAt: pastDate,
    },
  ];

  const events: Event[] = [
    {
      id: 'evt_tech_conf_1',
      organizationId: 'org_pulse_1',
      title: 'DevPulse India Tech & Cloud Summit 2026',
      slug: 'devpulse-india-2026',
      description: 'The premier multi-track engineering conference bringing together 2,500+ software architects, devops leaders, and AI practitioners. Featuring 40 keynote sessions, deep-dive workshops, and executive networking sessions.',
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      category: 'Technology',
      venueName: 'Bengaluru International Exhibition Centre (BIEC)',
      venueAddress: '10th Mile, Tumkur Main Road, Madavara',
      city: 'Bengaluru',
      startDate: futureDate1,
      endDate: new Date(new Date(futureDate1).getTime() + 2 * 24 * 3600 * 1000).toISOString(),
      bookingOpensAt: pastDate,
      salesClosesAt: new Date(new Date(futureDate1).getTime() - 24 * 3600 * 1000).toISOString(),
      maxCapacity: 700,
      status: 'PUBLISHED',
      createdAt: pastDate,
      updatedAt: pastDate,
    },
    {
      id: 'evt_neon_music_2',
      organizationId: 'org_pulse_1',
      title: 'Neon Oasis Electric Music Festival',
      slug: 'neon-oasis-festival',
      description: 'Two nights of hypnotic visual soundscapes, world-class EDM producers, ambient synth waves, and immersive LED art installations under open skies.',
      coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
      category: 'Music',
      venueName: 'Mahalaxmi Racecourse Open Grounds',
      venueAddress: 'Dr E Moses Marg, Royal Western India Turf Club',
      city: 'Mumbai',
      startDate: futureDate2,
      endDate: new Date(new Date(futureDate2).getTime() + 1 * 24 * 3600 * 1000).toISOString(),
      bookingOpensAt: pastDate,
      salesClosesAt: new Date(new Date(futureDate2).getTime() - 12 * 3600 * 1000).toISOString(),
      maxCapacity: 1200,
      status: 'PUBLISHED',
      createdAt: pastDate,
      updatedAt: pastDate,
    },
    {
      id: 'evt_design_expo_3',
      organizationId: 'org_summit_2',
      title: 'Design Masters: Global Product & Spatial Design Forum',
      slug: 'design-masters-forum',
      description: 'An interactive gathering of product designers, UX researchers, and creative technologists exploring AI-assisted design systems, physical computing, and sustainable ergonomics.',
      coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
      category: 'Design',
      venueName: 'India Habitat Centre, Lodhi Road',
      venueAddress: 'Lodhi Rd, Near Airforce Bal Bharati School',
      city: 'New Delhi',
      startDate: futureDate3,
      endDate: new Date(new Date(futureDate3).getTime() + 1 * 24 * 3600 * 1000).toISOString(),
      bookingOpensAt: pastDate,
      salesClosesAt: new Date(new Date(futureDate3).getTime() - 6 * 3600 * 1000).toISOString(),
      maxCapacity: 500,
      status: 'PUBLISHED',
      createdAt: pastDate,
      updatedAt: pastDate,
    },
    {
      id: 'evt_culinary_gourmet_4',
      organizationId: 'org_pulse_1',
      title: 'Artisanal Flavors & Gastronomy Expo 2026',
      slug: 'artisanal-flavors-expo',
      description: 'A sensory celebration showcasing Michelin-starred masterclasses, specialty coffee roasters, craft bakeries, and organic wineries.',
      coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
      category: 'Food & Drink',
      venueName: 'Jayamahal Palace Convention Grounds',
      venueAddress: '1, Jayamahal Main Rd, Near Cantonment Railway Station',
      city: 'Bengaluru',
      startDate: new Date(now.getTime() + 20 * 24 * 3600 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 22 * 24 * 3600 * 1000).toISOString(),
      bookingOpensAt: pastDate,
      salesClosesAt: new Date(now.getTime() + 19 * 24 * 3600 * 1000).toISOString(),
      maxCapacity: 600,
      status: 'PUBLISHED',
      createdAt: pastDate,
      updatedAt: pastDate,
    },
  ];

  // Ticket Tiers matching prompt requirements: Platinum Pass ₹3,000, Gold Pass ₹1,500, Standard Pass ₹600
  const ticketCategories: TicketCategory[] = [
    // For Event 1: DevPulse Tech Summit
    {
      id: 'tkt_dev_plat',
      eventId: 'evt_tech_conf_1',
      name: 'Platinum Pass',
      description: 'VIP Front-Row Keynote Seating, Speaker Lounge Access, Private Networking Dinner & Swag Bag',
      price: 3000,
      totalQuantity: 50,
      reservedQuantity: 0,
      soldQuantity: 18,
      maxPerUser: 4,
      isActive: true,
      createdAt: pastDate,
      updatedAt: pastDate,
    },
    {
      id: 'tkt_dev_gold',
      eventId: 'evt_tech_conf_1',
      name: 'Gold Pass',
      description: 'Access to All Track Sessions, Catered Buffet Lunch, Workshop Access & Certificate',
      price: 1500,
      totalQuantity: 150,
      reservedQuantity: 0,
      soldQuantity: 64,
      maxPerUser: 6,
      isActive: true,
      createdAt: pastDate,
      updatedAt: pastDate,
    },
    {
      id: 'tkt_dev_std',
      eventId: 'evt_tech_conf_1',
      name: 'Standard Pass',
      description: 'General Conference Hall Admission, Exhibition Booth Access & Digital Session Recordings',
      price: 600,
      totalQuantity: 500,
      reservedQuantity: 0,
      soldQuantity: 210,
      maxPerUser: 10,
      isActive: true,
      createdAt: pastDate,
      updatedAt: pastDate,
    },

    // For Event 2: Neon Oasis Music Festival
    {
      id: 'tkt_neon_vip',
      eventId: 'evt_neon_music_2',
      name: 'VIP Deck & Backstage Pass',
      description: 'Elevated Viewing Platform, Express Fast-Track Entry, Complimentary Bar & Artist Meet',
      price: 4500,
      totalQuantity: 100,
      reservedQuantity: 0,
      soldQuantity: 32,
      maxPerUser: 4,
      isActive: true,
      createdAt: pastDate,
      updatedAt: pastDate,
    },
    {
      id: 'tkt_neon_ga',
      eventId: 'evt_neon_music_2',
      name: 'General Admission Weekend Pass',
      description: 'Full 2-Day Festival Grounds Access, Food Village & Glow Zone Entry',
      price: 1800,
      totalQuantity: 800,
      reservedQuantity: 0,
      soldQuantity: 340,
      maxPerUser: 8,
      isActive: true,
      createdAt: pastDate,
      updatedAt: pastDate,
    },

    // For Event 3: Design Masters Forum
    {
      id: 'tkt_dsn_plat',
      eventId: 'evt_design_expo_3',
      name: 'Executive Masterclass Pass',
      description: 'All 3 Hands-on Design Workshops, Portfolio Review by Design Directors, Cocktail Reception',
      price: 3200,
      totalQuantity: 60,
      reservedQuantity: 0,
      soldQuantity: 24,
      maxPerUser: 2,
      isActive: true,
      createdAt: pastDate,
      updatedAt: pastDate,
    },
    {
      id: 'tkt_dsn_std',
      eventId: 'evt_design_expo_3',
      name: 'Standard Design Delegate',
      description: 'Keynotes, Panel Discussions, Expo Showcase & Networking App Access',
      price: 1200,
      totalQuantity: 300,
      reservedQuantity: 0,
      soldQuantity: 110,
      maxPerUser: 5,
      isActive: true,
      createdAt: pastDate,
      updatedAt: pastDate,
    },

    // For Event 4: Culinary Expo
    {
      id: 'tkt_cul_chef',
      eventId: 'evt_culinary_gourmet_4',
      name: 'Chef Table Tasting Experience',
      description: '7-Course Curated Tasting Menu with Master Sommelier Wine Pairings',
      price: 3500,
      totalQuantity: 40,
      reservedQuantity: 0,
      soldQuantity: 15,
      maxPerUser: 2,
      isActive: true,
      createdAt: pastDate,
      updatedAt: pastDate,
    },
    {
      id: 'tkt_cul_gen',
      eventId: 'evt_culinary_gourmet_4',
      name: 'Gourmet Explorer Day Pass',
      description: 'Access to 60+ Artisan Food Stalls, Live Cooking Stages & Tasting Tokens',
      price: 750,
      totalQuantity: 500,
      reservedQuantity: 0,
      soldQuantity: 180,
      maxPerUser: 6,
      isActive: true,
      createdAt: pastDate,
      updatedAt: pastDate,
    },
  ];

  // Seed sample initial confirmed order for attendee
  const initialOrder: Order = {
    id: 'ord_sample_101',
    reservationId: 'res_sample_101',
    eventId: 'evt_tech_conf_1',
    userId: 'usr_att_1',
    orderNumber: 'TN-2026-94812',
    totalAmount: 3000,
    currency: 'INR',
    status: 'PAID',
    createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'ord_item_1',
        orderId: 'ord_sample_101',
        ticketCategoryId: 'tkt_dev_plat',
        categoryName: 'Platinum Pass',
        quantity: 1,
        unitPrice: 3000,
        subtotal: 3000,
        attendeeName: 'Aarav Patel',
        attendeeEmail: 'attendee@example.com',
        qrCode: 'TN-PASS-94812-PLT-1',
      },
    ],
  };

  const initialPayment: PaymentTransaction = {
    id: 'pay_sample_101',
    orderId: 'ord_sample_101',
    reservationId: 'res_sample_101',
    providerReference: 'SIM-PAY-94812-TXN',
    amount: 3000,
    currency: 'INR',
    status: 'SUCCESS',
    providerResponse: JSON.stringify({ message: 'Simulated payment authorized', cardType: 'VISA' }),
    createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
  };

  const initialReservation: Reservation = {
    id: 'res_sample_101',
    eventId: 'evt_tech_conf_1',
    userId: 'usr_att_1',
    reservationNumber: 'RES-94812',
    status: 'CONFIRMED',
    expiresAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
    totalAmount: 3000,
    createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'res_item_1',
        reservationId: 'res_sample_101',
        ticketCategoryId: 'tkt_dev_plat',
        categoryName: 'Platinum Pass',
        quantity: 1,
        unitPrice: 3000,
        subtotal: 3000,
      },
    ],
  };

  return {
    users,
    organizations,
    organizationMembers,
    events,
    ticketCategories,
    reservations: [initialReservation],
    orders: [initialOrder],
    paymentTransactions: [initialPayment],
    notifications: [
      {
        id: 'notif_1',
        userId: 'usr_att_1',
        title: 'Booking Confirmed!',
        message: 'Your Platinum Pass for DevPulse India Tech Summit 2026 has been successfully confirmed. QR Pass is ready in your dashboard.',
        read: false,
        createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
      },
    ],
    auditLogs: [
      {
        id: 'audit_1',
        userId: 'usr_admin_1',
        userEmail: 'admin@ticketnest.io',
        action: 'PLATFORM_INITIALIZED',
        entityType: 'PLATFORM',
        entityId: 'ticketnest_core',
        details: 'Initial system seed bootstrap with default multi-tenant organizations and seed events.',
        createdAt: pastDate,
      },
    ],
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read existing database file, initializing with fresh seed data.', e);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  public saveData(data?: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file to disk:', err);
    }
  }

  // Execute an atomic transaction wrapped with mutex lock
  public async transaction<T>(callback: (state: DatabaseSchema) => Promise<T> | T): Promise<T> {
    const release = await dbMutex.acquire();
    try {
      const result = await callback(this.data);
      this.saveData();
      return result;
    } finally {
      release();
    }
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }
}

export const dbManager = new DatabaseManager();

// Helper to log audit entries directly inside an open transaction
export function logAuditInternal(
  data: DatabaseSchema,
  userId: string | undefined,
  userEmail: string | undefined,
  action: string,
  entityType: string,
  entityId: string,
  details?: string,
  ipAddress?: string
): AuditLog {
  const log: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    userEmail,
    action,
    entityType,
    entityId,
    details,
    ipAddress,
    createdAt: new Date().toISOString(),
  };
  data.auditLogs.unshift(log);
  if (data.auditLogs.length > 500) {
    data.auditLogs = data.auditLogs.slice(0, 500);
  }
  return log;
}

// Standalone helper for logging audit outside of an active transaction
export async function logAudit(
  userId: string | undefined,
  userEmail: string | undefined,
  action: string,
  entityType: string,
  entityId: string,
  details?: string,
  ipAddress?: string
) {
  return dbManager.transaction((data) => {
    return logAuditInternal(data, userId, userEmail, action, entityType, entityId, details, ipAddress);
  });
}

