import React from 'react';
import { X, Database, Shield, Layers, RefreshCw, Key, CheckCircle2 } from 'lucide-react';

interface ERDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ERDiagramModal: React.FC<ERDiagramModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c0f2b] text-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#241438]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff5c5c] to-[#ff8f70] flex items-center justify-center text-white shadow-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">TicketNest Relational Architecture</h2>
              <p className="text-xs text-white/60">PostgreSQL Schema (12 Tables) • Concurrency Protection • ACID Guarantees</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Key Invariants */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-[#ff5c5c] font-semibold mb-1">
                <Shield className="w-4 h-4" />
                <span>Zero Overselling</span>
              </div>
              <p className="text-xs text-white/70">
                Mutually exclusive transactional locks guarantee <code className="text-[#ff8f70]">reserved + sold ≤ totalQuantity</code> at all times.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-[#ff8f70] font-semibold mb-1">
                <RefreshCw className="w-4 h-4" />
                <span>10-Minute Hold Engine</span>
              </div>
              <p className="text-xs text-white/70">
                Temporary holds are assigned an authoritative UTC timestamp. Expired holds release inventory atomically.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <Key className="w-4 h-4" />
                <span>Idempotent Payments</span>
              </div>
              <p className="text-xs text-white/70">
                Unique idempotency keys and transaction hashes prevent double orders on webhook retries.
              </p>
            </div>
          </div>

          {/* Tables Overview */}
          <div>
            <h3 className="font-semibold text-white/90 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#ff5c5c]" />
              Database Entities & Schema Mapping
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'Users', desc: 'Auth credentials, roles (ADMIN/ORGANIZER/ATTENDEE), status' },
                { name: 'Organizations', desc: 'Multi-tenant event organizer profiles & verifications' },
                { name: 'OrganizationMembers', desc: 'RBAC user memberships (OWNER/ADMIN/MEMBER)' },
                { name: 'Events', desc: 'Schedules, venues, cities, category, status & capacity' },
                { name: 'TicketCategories', desc: 'Tiers (Platinum, Gold, Standard), pricing, total/sold/reserved' },
                { name: 'Reservations', desc: '10-minute inventory holds with expiry timestamps' },
                { name: 'ReservationItems', desc: 'Selected tiers and quantities per reservation' },
                { name: 'Orders', desc: 'Confirmed and paid bookings with order numbers' },
                { name: 'OrderItems', desc: 'Individual digital tickets with cryptographic QR tokens' },
                { name: 'PaymentTransactions', desc: 'Simulated payment state, gateway references & audits' },
                { name: 'Notifications', desc: 'In-app event status updates and booking alerts' },
                { name: 'AuditLogs', desc: 'Administrative action tracking & immutable audit trail' },
              ].map((tbl, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="font-mono text-xs text-[#ff5c5c] font-bold">{tbl.name}</div>
                  <div className="text-[11px] text-white/60 mt-1 leading-snug">{tbl.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ER Code Block */}
          <div className="rounded-xl bg-black/40 border border-white/10 p-4">
            <div className="flex items-center justify-between text-xs text-white/60 mb-2">
              <span className="font-mono font-medium">Prisma Relational Cardinality</span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">ACID Compliant</span>
            </div>
            <pre className="text-xs text-white/80 font-mono overflow-x-auto p-2 bg-[#12081d] rounded-lg leading-relaxed">
{`Organizations 1──* Events 1──* TicketCategories
Users 1──* Reservations 1──1 Orders 1──* OrderItems
Reservations 1──* ReservationItems ──> TicketCategories
Reservations 1──* PaymentTransactions ──> Orders`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#241438] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Prisma schema and migrations synced at /prisma/schema.prisma</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-[#ff5c5c] to-[#ff4545] text-white text-xs font-semibold rounded-lg shadow hover:opacity-90 transition-opacity"
          >
            Close Diagram
          </button>
        </div>
      </div>
    </div>
  );
};
