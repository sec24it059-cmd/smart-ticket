import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Ticket,
  Clock,
  Users,
  Download,
  RefreshCw,
  ArrowLeft,
  PieChart,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../api.ts';

interface AnalyticsOverview {
  totalEvents: number;
  publishedEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  totalCapacity: number;
  remainingInventory: number;
  pendingReservationsCount: number;
  confirmedBookingsCount: number;
  totalReservationAttempts: number;
  conversionRate: string;
}

interface TrendPoint {
  date: string;
  revenue: number;
  orders: number;
  tickets: number;
}

interface CategoryBreakdown {
  name: string;
  sold: number;
  reserved: number;
  available: number;
  total: number;
  revenue: number;
  price: number;
}

interface BookingRecord {
  id: string;
  orderNumber: string;
  eventTitle: string;
  attendeeName: string;
  attendeeEmail: string;
  totalAmount: number;
  status: string;
  itemCount: number;
  createdAt: string;
}

export const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Near-real-time polling (every 6 seconds if enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAnalytics(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchAnalytics = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [overRes, trendRes, catRes, bookRes] = await Promise.all([
        api.get('/organizer/analytics/overview'),
        api.get('/organizer/analytics/revenue'),
        api.get('/organizer/analytics/categories'),
        api.get('/organizer/bookings'),
      ]);

      setOverview(overRes.data);
      setTrends(trendRes.data.trend || []);
      setCategories(catRes.data.categories || []);
      setBookings(bookRes.data.bookings || []);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Analytics load failure:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (bookings.length === 0) return;
    const headers = ['Order #', 'Event Title', 'Attendee Name', 'Email', 'Amount (INR)', 'Status', 'Date'];
    const rows = bookings.map((b) => [
      b.orderNumber,
      `"${b.eventTitle.replace(/"/g, '""')}"`,
      `"${b.attendeeName.replace(/"/g, '""')}"`,
      b.attendeeEmail,
      b.totalAmount,
      b.status,
      new Date(b.createdAt).toLocaleString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TicketNest_Bookings_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link to="/organizer" className="text-xs font-bold text-gray-500 hover:text-[#ff5c5c] flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Studio
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1c0f2b] tracking-tight">
              Event Sales & Conversion Analytics
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Authoritative PostgreSQL calculations • Last updated at {lastRefreshed}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? 'Auto-Polling Active (6s)' : 'Polling Paused'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-[#1c0f2b] hover:bg-[#ff5c5c] text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Report</span>
            </button>
          </div>
        </div>

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Gross Sales Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-[#1c0f2b]">
              ₹{overview ? overview.totalRevenue.toLocaleString() : '0'}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">100% verified transactions</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Confirmed Passes</span>
              <Ticket className="w-4 h-4 text-[#ff5c5c]" />
            </div>
            <div className="text-2xl font-black text-[#1c0f2b]">
              {overview ? overview.totalTicketsSold.toLocaleString() : '0'}
            </div>
            <div className="text-[11px] text-gray-500">{overview?.remainingInventory || 0} remaining seats</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Pending Holds</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-[#1c0f2b]">
              {overview ? overview.pendingReservationsCount : '0'}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold">10-minute hold window</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Booking Conversion</span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-[#1c0f2b]">
              {overview ? overview.conversionRate : '0%'}
            </div>
            <div className="text-[11px] text-gray-500">
              {overview?.confirmedBookingsCount} paid / {overview?.totalReservationAttempts} holds
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Sales Trend Area Chart */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1c0f2b]">Sales Velocity & Revenue Trend</h3>
                <p className="text-xs text-gray-400">Daily revenue and ticket transaction volume</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5c5c" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ff5c5c" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c0f2b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue (₹)"
                    stroke="#ff5c5c"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by Ticket Tier Bar Chart */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1c0f2b]">Revenue by Ticket Tier</h3>
                <p className="text-xs text-gray-400">Performance across Platinum, Gold, and Standard passes</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c0f2b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="sold" name="Tickets Sold" fill="#8936ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reserved" name="Held In Cart" fill="#ff8f70" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Attendee Registrations Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-[#1c0f2b]">Attendee Registrations</h3>
            <button
              onClick={handleExportCSV}
              className="text-xs font-bold text-[#ff5c5c] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Export CSV <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-400 font-mono uppercase text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6">Order ID</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Attendee</th>
                    <th className="py-3 px-4 text-center">Passes</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-[#1c0f2b]">{b.orderNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-[#1c0f2b] max-w-xs truncate">
                        {b.eventTitle}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1c0f2b]">{b.attendeeName}</div>
                        <div className="text-[10px] text-gray-400">{b.attendeeEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">{b.itemCount}</td>
                      <td className="py-3.5 px-4 text-right font-black text-[#1c0f2b]">
                        ₹{b.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            b.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {b.status}
                        </span>
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
