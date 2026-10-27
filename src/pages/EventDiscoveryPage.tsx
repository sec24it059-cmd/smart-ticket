import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  Ticket,
  Filter,
  ArrowUpDown,
  Building2,
  CheckCircle,
  X,
} from 'lucide-react';
import { api } from '../api.ts';

interface EventItem {
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

export const EventDiscoveryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialCity = searchParams.get('city') || 'All';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [sortBy, setSortBy] = useState<'date' | 'priceAsc' | 'priceDesc'>('date');

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, selectedCity]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedCity !== 'All') params.set('city', selectedCity);

      const res = await api.get(`/events?${params.toString()}`);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedCity('All');
    setSortBy('date');
    setSearchParams({});
  };

  // Client sort
  const sortedEvents = [...events].sort((a, b) => {
    if (sortBy === 'priceAsc') return a.minPrice - b.minPrice;
    if (sortBy === 'priceDesc') return b.minPrice - a.minPrice;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const categories = ['All', 'Technology', 'Music', 'Design', 'Food & Drink'];
  const cities = ['All', 'Bengaluru', 'Mumbai', 'New Delhi'];

  return (
    <div className="min-h-screen bg-[#faf8f5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-[#1c0f2b] tracking-tight">
            Discover Live Events
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse upcoming conferences, festivals, and summits with guaranteed real-time ticket availability.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event name, venue, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#ff5c5c] focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:border-[#ff5c5c] cursor-pointer appearance-none"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c === 'All' ? 'All Cities' : c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <ArrowUpDown className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:border-[#ff5c5c] cursor-pointer appearance-none"
                >
                  <option value="date">Date: Soonest</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1c0f2b] hover:bg-[#ff5c5c] text-white text-sm font-bold rounded-xl transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Chips */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#ff5c5c] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {(searchTerm || selectedCategory !== 'All' || selectedCity !== 'All') && (
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 font-medium transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>Showing {sortedEvents.length} events</span>
          <span className="font-mono text-[11px] text-gray-400">Inventory synced from PostgreSQL</span>
        </div>

        {/* Event Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-sm max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#1c0f2b]">No matching events found</h3>
            <p className="text-xs text-gray-500">
              Try adjusting your search criteria, selecting 'All Cities', or exploring other categories.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-[#ff5c5c] text-white text-xs font-bold rounded-xl shadow hover:brightness-105 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEvents.map((event) => {
              const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={event.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#1c0f2b]/85 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-wider">
                      {event.category}
                    </div>

                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-[#1c0f2b] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
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

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
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

                      <h3 className="font-bold text-lg text-[#1c0f2b] group-hover:text-[#ff5c5c] transition-colors line-clamp-2 leading-snug">
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

                    <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-gray-400 font-medium">Starting from</div>
                        <div className="text-lg font-extrabold text-[#1c0f2b]">
                          ₹{event.minPrice.toLocaleString()}
                        </div>
                      </div>

                      <Link
                        to={`/events/${event.id}`}
                        className="px-4 py-2 rounded-xl bg-[#1c0f2b] text-white text-xs font-bold hover:bg-[#ff5c5c] active:scale-95 transition-all flex items-center gap-1.5 shadow"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Select Tickets</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
