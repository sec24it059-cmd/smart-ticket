import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  QrCode,
  AlertCircle,
  CheckCircle,
  X,
  ArrowRight,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { api } from '../api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useReservation } from '../context/ReservationContext.tsx';

interface OrderItem {
  id: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  qrCode: string;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  event?: {
    id: string;
    title: string;
    startDate: string;
    venueName: string;
    coverImage: string;
  };
}

export const AttendeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeHold, secondsRemaining, formatTime, clearHold } = useReservation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<{
    orderNumber: string;
    eventTitle: string;
    item: OrderItem;
  } | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to load attendee orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? Tickets will be returned to the event inventory.')) {
      return;
    }

    setCancellingOrderId(orderId);
    setActionMessage(null);

    try {
      const res = await api.post(`/orders/${orderId}/cancel`);
      setActionMessage(res.data.message || 'Booking successfully cancelled and inventory returned.');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleReleaseHold = async (resId: string) => {
    try {
      await api.post(`/reservations/${resId}/cancel`);
      clearHold();
      setActionMessage('Temporary ticket reservation cancelled and seats returned to inventory.');
    } catch (err) {
      console.error('Error releasing hold:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ff5c5c] to-[#9b4dff] flex items-center justify-center text-white text-xl font-bold shadow-md">
              {user?.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-[#ff5c5c] uppercase tracking-wider">Attendee Dashboard</div>
              <h1 className="text-2xl font-extrabold text-[#1c0f2b]">{user?.name}</h1>
              <div className="text-xs text-gray-400 font-mono">{user?.email}</div>
            </div>
          </div>

          <Link
            to="/events"
            className="px-4 py-2 bg-[#1c0f2b] hover:bg-[#ff5c5c] text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Discover Events</span>
          </Link>
        </div>

        {actionMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Active Reservation Banner */}
        {activeHold && secondsRemaining > 0 && (
          <div className="bg-[#1c0f2b] text-white p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ff5c5c] text-white flex items-center justify-center shrink-0 animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#ff8f70] uppercase">10-Minute Hold In Progress</div>
                <div className="text-sm font-bold">{activeHold.eventTitle}</div>
                <div className="text-xs text-white/60">
                  Total: ₹{activeHold.totalAmount.toLocaleString()} • Held for you
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="font-mono text-xl font-extrabold text-[#ff8f70] bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                {formatTime(secondsRemaining)}
              </div>
              <Link
                to={`/checkout/${activeHold.reservationId}`}
                className="px-4 py-2 bg-[#ff5c5c] hover:brightness-110 text-white text-xs font-bold rounded-xl shadow transition-all"
              >
                Checkout Now
              </Link>
              <button
                onClick={() => handleReleaseHold(activeHold.reservationId)}
                className="p-2 text-white/50 hover:text-white transition-colors"
                title="Release Hold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Confirmed Bookings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#1c0f2b]">My Confirmed Passes</h2>
            <span className="text-xs font-mono text-gray-400">{orders.length} order(s)</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-gray-200 shadow-sm max-w-md mx-auto space-y-3">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="font-bold text-base text-[#1c0f2b]">No Bookings Yet</h3>
              <p className="text-xs text-gray-500">
                Explore upcoming technology summits, music festivals, and culinary expos to book your first pass.
              </p>
              <Link
                to="/events"
                className="inline-block mt-2 px-4 py-2 bg-[#ff5c5c] text-white text-xs font-bold rounded-xl shadow hover:brightness-105"
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((order) => {
                const isRefunded = order.status === 'REFUNDED';
                const eventDate = order.event
                  ? new Date(order.event.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                          Order #{order.orderNumber}
                        </div>
                        <h3 className="font-extrabold text-base text-[#1c0f2b] mt-0.5">
                          {order.event?.title || 'Live Event'}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {eventDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {order.event?.venueName}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                          isRefunded
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Passes List */}
                    <div className="p-5 space-y-3">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Issued Passes
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs border border-gray-100"
                          >
                            <div>
                              <div className="font-bold text-gray-800">{item.categoryName}</div>
                              <div className="text-gray-400 font-mono text-[10px]">{item.qrCode}</div>
                            </div>

                            {!isRefunded && (
                              <button
                                onClick={() =>
                                  setSelectedTicket({
                                    orderNumber: order.orderNumber,
                                    eventTitle: order.event?.title || 'Live Event',
                                    item,
                                  })
                                }
                                className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-[#1c0f2b] font-bold rounded-lg shadow-sm flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <QrCode className="w-3 h-3 text-[#ff5c5c]" />
                                <span>Show Pass</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-gray-400 text-[10px] block">Total Paid</span>
                        <span className="font-black text-sm text-[#1c0f2b]">
                          ₹{order.totalAmount.toLocaleString()}
                        </span>
                      </div>

                      {!isRefunded && (
                        <button
                          onClick={() => handleCancelBooking(order.id)}
                          disabled={cancellingOrderId === order.id}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel & Refund</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Pass Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#1c0f2b] text-white flex items-center justify-center mx-auto shadow-md">
              <Ticket className="w-6 h-6 text-[#ff5c5c]" />
            </div>

            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#ff5c5c]">
                Official Admission QR Pass
              </div>
              <h3 className="font-extrabold text-lg text-[#1c0f2b] mt-0.5">
                {selectedTicket.item.categoryName}
              </h3>
              <div className="text-xs text-gray-500">{selectedTicket.eventTitle}</div>
            </div>

            {/* Stylized QR representation */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 inline-block mx-auto">
              <div className="w-44 h-44 bg-[#1c0f2b] rounded-xl p-3 flex items-center justify-center text-white shadow-inner">
                <QrCode className="w-36 h-36 text-[#ff8f70]" />
              </div>
              <div className="font-mono text-xs font-bold text-gray-700 mt-2">
                {selectedTicket.item.qrCode}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-tight">
              Present this digital token at the admission gate scanner for priority entrance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
