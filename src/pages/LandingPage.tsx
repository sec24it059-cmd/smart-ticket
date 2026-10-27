import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  Ticket,
  Clock,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Building2,
} from 'lucide-react';
import { api } from '../api.ts';

interface EventSummary {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  category: string;
  venueName: string;
  city: string;
  startDate: string;
  minPrice: number;
  availableTickets: number;
  isSoldOut: boolean;
  organization?: {
    name: string;
    verified: boolean;
  };
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data.events || []);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCity !== 'All') params.set('city', selectedCity);
    navigate(`/events?${params.toString()}`);
  };

  const categories = [
    { name: 'All', icon: '✨' },
    { name: 'Technology', icon: '💻' },
    { name: 'Music', icon: '🎵' },
    { name: 'Design', icon: '🎨' },
    { name: 'Food & Drink', icon: '🍷' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1c0f2b] via-[#241438] to-[#160c26] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#ff5c5c]/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#ff8f70] shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Concurrency-Safe Ticket Engine • 10-Minute Hold Guarantee</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Live Experiences, Reserved{' '}
            <span className="bg-gradient-to-r from-[#ff5c5c] via-[#ff7e6b] to-[#ffaa8a] bg-clip-text text-transparent">
              Without Compromise
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-white/70 leading-relaxed font-light">
            Discover premier music festivals, technology conferences, and culinary expos. Temporarily lock your passes for 10 minutes with zero risk of overselling.
          </p>

          {/* Interactive Search Bar */}
          <div className="max-w-3xl mx-auto mt-8">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-2 rounded-2xl shadow-2xl shadow-black/40 flex flex-col sm:flex-row items-center gap-2 text-gray-800"
            >
              <div className="flex-1 flex items-center gap-2 px-3 py-2 w-full">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by event name, keynote speaker, or venue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm outline-none bg-transparent placeholder-gray-400 font-medium"
                />
              </div>

              <div className="hidden sm:block w-px h-8 bg-gray-200"></div>

              <div className="flex items-center gap-2 px-3 py-2 w-full sm:w-auto shrink-0">
                <MapPin className="w-4 h-4 text-[#ff5c5c]" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="text-sm bg-transparent outline-none font-semibold text-gray-700 cursor-pointer"
                >
                  <option value="All">All Cities</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="New Delhi">New Delhi</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff5c5c] to-[#ff4545] text-white text-sm font-bold shadow-lg shadow-[#ff5c5c]/30 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Find Passes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Metrics */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-xl font-extrabold text-white">100%</div>
              <div className="text-[11px] text-white/60">No Overselling Guarantee</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-xl font-extrabold text-[#ff8f70]">10 Min</div>
              <div className="text-[11px] text-white/60">Strict Reservation Hold</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-xl font-extrabold text-white">Multi-Tenant</div>
              <div className="text-[11px] text-white/60">Organizer Studio Isolation</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-xl font-extrabold text-emerald-400">PostgreSQL</div>
              <div className="text-[11px] text-white/60">Atomic Row Locks & ACID</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="bg-[#f5f2ec] border-b border-gray-200 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:inline mr-2">
              Filter By:
            </span>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => navigate(`/events?category=${cat.name}`)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:border-[#ff5c5c] hover:text-[#ff5c5c] shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          <Link
            to="/events"
            className="text-xs font-bold text-[#ff5c5c] hover:underline flex items-center gap-1 whitespace-nowrap"
          >
            Browse all events <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* Featured Events Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold text-[#ff5c5c] uppercase tracking-wider mb-1">
              Curated Events
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c0f2b] tracking-tight">
              Featured Events on TicketNest
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md">
            Authoritative ticket inventory updated in real-time. Lock passes with 10-minute countdown protection.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((event) => {
              const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={event.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
                >
                  <div className="relative h-44 overflow-hidden bg-gray-100">
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#1c0f2b]/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-wider">
                      {event.category}
                    </div>

                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-[#1c0f2b] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#ff5c5c]" />
                      <span>{event.city}</span>
                    </div>

                    {event.isSoldOut && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-red-500 text-white font-bold text-xs uppercase px-3 py-1 rounded-full tracking-wider shadow">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {event.organization && (
                        <div className="text-[11px] font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span className="truncate">{event.organization.name}</span>
                          {event.organization.verified && (
                            <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                          )}
                        </div>
                      )}

                      <h3 className="font-bold text-base text-[#1c0f2b] group-hover:text-[#ff5c5c] transition-colors line-clamp-2 leading-snug">
                        {event.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{eventDate}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{event.venueName}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mt-4 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-gray-400 font-medium">Starting from</div>
                        <div className="text-base font-extrabold text-[#1c0f2b]">
                          ₹{event.minPrice.toLocaleString()}
                        </div>
                      </div>

                      <Link
                        to={`/events/${event.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-[#1c0f2b] text-white text-xs font-semibold hover:bg-[#ff5c5c] active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Ticket className="w-3 h-3" />
                        <span>Book</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Engineering Architecture */}
      <section className="bg-gradient-to-br from-[#231238] to-[#150a24] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="text-xs font-bold text-[#ff8f70] uppercase tracking-wider">
              Engineering Architecture
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Designed for High-Volume Ticketing & Zero Loss
            </h2>
            <p className="text-sm text-white/60">
              Reliable reservation state machines solve race conditions and lost sales under massive flash-sale load.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ff5c5c]/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#ff5c5c]/20 text-[#ff5c5c] flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">10-Minute Hold Engine</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                When you click reserve, tickets are locked in PostgreSQL for exactly 10 minutes. A background worker automatically restores unpurchased inventory without manual intervention.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ff5c5c]/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Concurrency & Row Locks</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Atomic database transactions guard inventory checks. If 20 people compete for the last 10 tickets, exactly 10 succeed and 10 receive clean conflict notifications.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ff5c5c]/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Organizer Sales Analytics</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Organizers track daily revenue velocity, tier distributions, and booking conversion funnels with interactive Recharts diagrams and CSV export capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Host CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#ff5c5c] via-[#ff6854] to-[#ff8470] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-[#ff5c5c]/20">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Are you an Event Organizer?
            </h3>
            <p className="text-sm text-white/90 leading-relaxed">
              Create an organization, configure customizable ticket tiers (Platinum, Gold, Standard), set inventory quotas, and track real-time bookings from a private tenant dashboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/auth?mode=register&role=ORGANIZER"
              className="px-6 py-3 bg-[#1c0f2b] text-white text-sm font-bold rounded-xl shadow-lg hover:bg-black active:scale-95 transition-all text-center"
            >
              Start Organizing Events
            </Link>
            <Link
              to="/organizer"
              className="px-5 py-3 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl backdrop-blur-sm transition-colors text-center"
            >
              Demo Organizer Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
