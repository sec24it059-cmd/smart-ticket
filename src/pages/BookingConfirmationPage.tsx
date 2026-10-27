import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Calendar,
  MapPin,
  QrCode,
  Download,
  Share2,
  Ticket,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { api } from '../api.ts';

interface OrderItem {
  id: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  attendeeName: string;
  attendeeEmail: string;
  qrCode: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  event?: {
    title: string;
    coverImage: string;
    venueName: string;
    venueAddress: string;
    city: string;
    startDate: string;
    category: string;
  };
  payment?: {
    providerReference: string;
    status: string;
  };
}

export const BookingConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fire festive celebration confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff5c5c', '#ff8f70', '#8936ff', '#22c55e'],
    });

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data.order);
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#ff5c5c] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-[#1c0f2b]">Generating digital event passes...</span>
        </div>
      </div>
    );
  }

  const handlePrintTicket = () => {
    window.print();
  };

  const eventDate = order?.event ? new Date(order.event.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }) : '';

  return (
    <div className="min-h-screen bg-[#faf8f5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1c0f2b] tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Your payment was successfully simulated and confirmed. Your official pass and QR token have been minted.
          </p>
        </div>

        {/* Digital Event Pass Card */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden shadow-xl">
          {/* Top Banner */}
          <div className="bg-[#1c0f2b] text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10">
            <div>
              <div className="text-xs uppercase font-mono tracking-widest text-[#ff8f70]">
                Official Digital Admission Pass
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">{order?.event?.title || 'Live Event'}</h2>
              <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#ff5c5c]" />
                <span>{order?.event?.venueName}, {order?.event?.city}</span>
              </div>
            </div>

            <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/15 text-right shrink-0">
              <div className="text-[10px] text-white/50 uppercase font-mono">Order Number</div>
              <div className="text-sm font-mono font-bold text-white tracking-wider">{order?.orderNumber}</div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Event Date</span>
                <span className="font-bold text-[#1c0f2b]">{eventDate}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Payment Status</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  CONFIRMED
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Transaction Ref</span>
                <span className="font-mono font-bold text-[#1c0f2b] truncate block">
                  {order?.payment?.providerReference || 'SIM-AUTH-94812'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Total Paid</span>
                <span className="font-black text-sm text-[#ff5c5c]">
                  ₹{order?.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Passes & QR Code Breakdown */}
            <div className="border-t border-dashed border-gray-200 pt-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Assigned Passes ({order?.items.length})
              </h3>

              <div className="space-y-4">
                {order?.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#1c0f2b]">{item.categoryName}</div>
                        <div className="text-xs text-gray-500">Attendee: {item.attendeeName} ({item.attendeeEmail})</div>
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm shrink-0">
                      {/* Stylized QR Visual */}
                      <div className="w-12 h-12 bg-[#1c0f2b] rounded-lg p-1 flex items-center justify-center text-white">
                        <QrCode className="w-9 h-9 text-[#ff8f70]" />
                      </div>
                      <div className="text-left font-mono text-[10px]">
                        <span className="text-gray-400 block">QR SERIAL</span>
                        <span className="font-bold text-[#1c0f2b]">{item.qrCode}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handlePrintTicket}
              className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download & Print PDF Pass</span>
            </button>

            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#1c0f2b] hover:bg-[#ff5c5c] text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View in My Bookings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
