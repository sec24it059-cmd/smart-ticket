import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  DollarSign,
  Ticket,
  Users,
  Plus,
  TrendingUp,
  Clock,
  Layers,
  Edit3,
  Trash2,
  ExternalLink,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { api } from '../api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface OverviewStats {
  totalEvents: number;
  publishedEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  totalCapacity: number;
  remainingInventory: number;
  pendingReservationsCount: number;
  confirmedBookingsCount: number;
  conversionRate: string;
}

interface OrganizerEvent {
  id: string;
  title: string;
  category: string;
  city: string;
  startDate: string;
  maxCapacity: number;
  status: string;
  minPrice: number;
  availableTickets: number;
}

export const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        api.get('/organizer/analytics/overview'),
        api.get('/events'), // We will filter by organizer
      ]);
      setStats(statsRes.data);
      setEvents(eventsRes.data.events || []);
    } catch (err) {
      console.error('Failed to load organizer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel this event? Existing ticket holders will need to be notified.')) {
      return;
    }
    try {
      await api.delete(`/organizer/events/${eventId}`);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel event.');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1c0f2b] to-[#2e1850] flex items-center justify-center text-white text-xl font-bold shadow-md">
              <Building2 className="w-7 h-7 text-[#ff8f70]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#ff5c5c] uppercase tracking-wider">
                Organizer Studio • Tenant Isolation
              </div>
              <h1 className="text-2xl font-extrabold text-[#1c0f2b]">
                {user?.organization?.name || 'PulseLive Entertainment'}
              </h1>
              <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <span>Organizer ID: {user?.organization?.id || 'org_pulse_1'}</span>
                <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified Tenant
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/organizer/analytics"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#1c0f2b] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#ff5c5c]" />
              <span>Full Analytics</span>
            </Link>

            <Link
              to="/organizer/events/new"
              className="px-4 py-2 bg-gradient-to-r from-[#ff5c5c] to-[#ff4545] hover:brightness-105 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-[#ff5c5c]/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </Link>
          </div>
        </div>

        {/* Real-time KPI Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-[#1c0f2b]">
              ₹{stats ? stats.totalRevenue.toLocaleString() : '...'}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">From confirmed bookings</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tickets Sold</span>
              <Ticket className="w-4 h-4 text-[#ff5c5c]" />
            </div>
            <div className="text-2xl font-black text-[#1c0f2b]">
              {stats ? stats.totalTicketsSold.toLocaleString() : '...'}
            </div>
            <div className="text-[11px] text-gray-500">
              of {stats?.totalCapacity || 0} total capacity
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Active Holds</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-[#1c0f2b]">
              {stats ? stats.pendingReservationsCount : '...'}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold">10-minute hold window</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Conversion Rate</span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-[#1c0f2b]">
              {stats ? stats.conversionRate : '...'}
            </div>
            <div className="text-[11px] text-gray-500">Confirmed / Holds</div>
          </div>
        </div>

        {/* Managed Events Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#1c0f2b]">Published Organization Events</h2>
            <Link to="/organizer/events/new" className="text-xs font-bold text-[#ff5c5c] hover:underline flex items-center gap-1">
              Add Event <Plus className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-400 font-mono uppercase text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6">Event Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Event Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Remaining Capacity</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-6 font-bold text-[#1c0f2b] max-w-xs truncate">
                        <Link to={`/events/${evt.id}`} className="hover:text-[#ff5c5c] flex items-center gap-1.5">
                          <span>{evt.title}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </Link>
                        <span className="text-[10px] text-gray-400 block font-normal">{evt.city}</span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-600">{evt.category}</td>
                      <td className="py-4 px-4 font-medium text-gray-600">
                        {new Date(evt.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            evt.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-gray-800">
                        {evt.availableTickets} / {evt.maxCapacity}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Link
                          to={`/organizer/events/${evt.id}/tickets`}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1"
                        >
                          <Ticket className="w-3 h-3 text-[#ff5c5c]" />
                          <span>Tiers</span>
                        </Link>

                        <button
                          onClick={() => handleCancelEvent(evt.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors inline-block align-middle cursor-pointer"
                          title="Cancel Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
