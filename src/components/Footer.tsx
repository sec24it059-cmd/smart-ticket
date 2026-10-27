import React from 'react';
import { Ticket, Shield, Cpu, Database, Zap, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#140a20] text-white/70 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#ff5c5c] to-[#ff8f70] flex items-center justify-center text-white">
                <Ticket className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                Ticket<span className="text-[#ff5c5c]">Nest</span>
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Enterprise event booking and ticketing engine engineered with PostgreSQL concurrency locks, temporary 10-minute hold workers, and multi-tenant organizer isolation.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All systems operational
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/events" className="hover:text-white transition-colors">Upcoming Events</Link>
              </li>
              <li>
                <Link to="/events?category=Technology" className="hover:text-white transition-colors">Tech & AI Summits</Link>
              </li>
              <li>
                <Link to="/events?category=Music" className="hover:text-white transition-colors">Music Festivals</Link>
              </li>
              <li>
                <Link to="/events?category=Design" className="hover:text-white transition-colors">Design Symposiums</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">My Booking History</Link>
              </li>
            </ul>
          </div>

          {/* Organizers & Admins */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Management</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/organizer" className="hover:text-white transition-colors">Organizer Studio</Link>
              </li>
              <li>
                <Link to="/organizer/events/new" className="hover:text-white transition-colors">Publish New Event</Link>
              </li>
              <li>
                <Link to="/organizer/analytics" className="hover:text-white transition-colors">Sales & Conversion Analytics</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">Platform Admin Console</Link>
              </li>
            </ul>
          </div>

          {/* Technical Specs */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Architecture Stack</h4>
            <div className="flex flex-wrap gap-1.5">
              {[
                'PostgreSQL',
                'Prisma ORM',
                'BullMQ',
                'Redis Cache',
                'Express.js',
                'TypeScript',
                'React Router',
                'Recharts',
                'Tailwind CSS',
              ].map((tech, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-white/70"
                >
                  {tech}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-white/50 mt-3 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#ff5c5c]" />
              Zero overselling guarantee with mutex locks
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40">
          <div>© {new Date().getFullYear()} TicketNest Core Platform. All rights reserved.</div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span>Simulated Gateway Active</span>
            <span>•</span>
            <span>10-Min Expiry Worker</span>
            <span>•</span>
            <span>Multi-Tenant RBAC</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
