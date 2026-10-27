import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle,
  Ticket,
  ShieldCheck,
  AlertCircle,
  Info,
  ChevronRight,
  Share2,
  Lock,
} from 'lucide-react';
import { api } from '../api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useReservation } from '../context/ReservationContext.tsx';

interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: number;
  totalQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  availableQuantity: number;
  maxPerUser: number;
  isAvailableForBooking: boolean;
}

interface EventDetail {
  id: string;
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
  status: string;
  organization?: {
    name: string;
    description?: string;
    verified: boolean;
    logoUrl?: string;
  };
  ticketCategories: TicketTier[];
}

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setActiveHold } = useReservation();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.event);
      // Initialize quantities to 0
      const initial: Record<string, number> = {};
      res.data.event.ticketCategories.forEach((t: TicketTier) => {
        initial[t.id] = 0;
      });
      setSelectedQuantities(initial);
    } catch (err: any) {
      console.error('Failed to load event details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (tierId: string, delta: number, maxAllowed: number, available: number) => {
    const current = selectedQuantities[tierId] || 0;
    const limit = Math.min(maxAllowed, available);
    const updated = Math.max(0, Math.min(limit, current + delta));
    setSelectedQuantities((prev) => ({
      ...prev,
      [tierId]: updated,
    }));
    setReservationError(null);
  };

  const totalTickets = Object.values(selectedQuantities).reduce((sum, q) => sum + q, 0);

  const totalAmount = event?.ticketCategories.reduce((sum, tier) => {
    const qty = selectedQuantities[tier.id] || 0;
    return sum + qty * tier.price;
  }, 0) || 0;

  const handleReserveTickets = async () => {
    if (!user) {
      navigate(`/auth?mode=login&redirect=/events/${id}`);
      return;
    }

    if (totalTickets === 0) {
      setReservationError('Please select at least 1 ticket pass to proceed');
      return;
    }

    setSubmitting(true);
    setReservationError(null);

    const items = Object.entries(selectedQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([tierId, qty]) => ({
        ticketCategoryId: tierId,
        quantity: qty,
      }));

    try {
      const res = await api.post('/reservations', {
        eventId: event?.id,
        items,
        idempotencyKey: `idem_res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      });

      const { reservation } = res.data;

      // Set hold in global context
      setActiveHold({
        reservationId: reservation.id,
        reservationNumber: reservation.reservationNumber,
        eventTitle: event?.title || 'Live Event',
        totalAmount: reservation.totalAmount,
        expiresAt: reservation.expiresAt,
      });

      // Proceed to checkout page
      navigate(`/checkout/${reservation.id}`);
    } catch (err: any) {
      console.error('Reservation failed:', err);
      const msg = err.response?.data?.error || 'Unable to reserve tickets. Please check availability and try again.';
      setReservationError(msg);
      // Refresh event details to update inventory
      fetchEventDetails();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#ff5c5c] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-[#1c0f2b]">Verifying live event inventory...</span>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-8 text-center">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 max-w-md shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#1c0f2b]">Event Not Found</h2>
          <p className="text-xs text-gray-500 mt-2">
            The event you are looking for may have been rescheduled, unlisted, or does not exist.
          </p>
          <Link
            to="/events"
            className="mt-5 inline-block px-4 py-2 bg-[#ff5c5c] text-white text-xs font-bold rounded-xl shadow"
          >
            Explore Other Events
          </Link>
        </div>
      </div>
    );
  }

  const startDateFormatted = new Date(event.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const startTimeFormatted = new Date(event.startDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-16">
      {/* Event Hero Cover Banner */}
      <div className="relative h-72 sm:h-96 w-full bg-[#1c0f2b] overflow-hidden">
        <img
          src={event.coverImage}
          alt={event.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c0f2b] via-[#1c0f2b]/40 to-transparent"></div>

        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#ff5c5c] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {event.category}
            </span>
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#ff8f70]" />
              {event.city}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight max-w-4xl">
            {event.title}
          </h1>

          {event.organization && (
            <div className="flex items-center gap-2 text-xs text-white/80 pt-1">
              <span>Presented by</span>
              <strong className="text-white">{event.organization.name}</strong>
              {event.organization.verified && (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Details & Agenda */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info Strip */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#ff5c5c]/10 text-[#ff5c5c] shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</div>
                  <div className="text-sm font-bold text-[#1c0f2b]">{startDateFormatted}</div>
                  <div className="text-xs text-gray-500">{startTimeFormatted} onwards</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Venue Location</div>
                  <div className="text-sm font-bold text-[#1c0f2b]">{event.venueName}</div>
                  <div className="text-xs text-gray-500">{event.venueAddress}, {event.city}</div>
                </div>
              </div>
            </div>

            {/* About Event Description */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-[#1c0f2b]">About This Event</h2>
              <div className="prose prose-sm text-gray-600 leading-relaxed space-y-3 font-normal">
                <p>{event.description}</p>
                <p>
                  Join hundreds of forward-thinking attendees for an unforgettable experience. With customizable ticket tiers, attendees can choose VIP access, speaker meet-and-greets, or general hall seating.
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-6">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Event Highlights & Policies
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Instant digital ticket delivery with QR code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>10-minute temporary ticket reservation guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Cancellation eligible prior to event opening</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Simulated multi-currency test payment processing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Organizer Profile Card */}
            {event.organization && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#241438] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {event.organization.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-[#1c0f2b]">{event.organization.name}</span>
                      {event.organization.verified && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {event.organization.description || 'Verified Event Producer on TicketNest'}
                    </p>
                  </div>
                </div>
                <div className="text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
                  Verified Host
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Ticket Tier Selection Panel */}
          <div className="lg:col-span-1 sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl border-2 border-gray-200/90 shadow-xl p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-[#1c0f2b]">Select Tickets</h3>
                  <span className="text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Live Inventory
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Choose your preferred pass tier. Passes will be temporarily reserved for 10 minutes.
                </p>
              </div>

              {reservationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{reservationError}</span>
                </div>
              )}

              {/* Ticket Tiers List */}
              <div className="space-y-3">
                {event.ticketCategories.map((tier) => {
                  const qty = selectedQuantities[tier.id] || 0;
                  const available = tier.availableQuantity;
                  const isSoldOut = available <= 0;

                  return (
                    <div
                      key={tier.id}
                      className={`p-4 rounded-xl border transition-all ${
                        qty > 0
                          ? 'border-[#ff5c5c] bg-[#fff8f6]'
                          : isSoldOut
                          ? 'border-gray-200 bg-gray-50 opacity-60'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-[#1c0f2b]">{tier.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {tier.description}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-base text-[#1c0f2b]">
                            ₹{tier.price.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400">per ticket</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                        <div className="text-[11px] font-medium text-gray-500">
                          {isSoldOut ? (
                            <span className="text-red-500 font-bold">Sold Out</span>
                          ) : available < 10 ? (
                            <span className="text-amber-600 font-bold">Only {available} left!</span>
                          ) : (
                            <span>{available} passes available</span>
                          )}
                        </div>

                        {/* Quantity Counter */}
                        {!isSoldOut ? (
                          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(tier.id, -1, tier.maxPerUser, available)}
                              disabled={qty <= 0}
                              className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-xs text-[#1c0f2b]">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(tier.id, 1, tier.maxPerUser, available)}
                              disabled={qty >= Math.min(tier.maxPerUser, available)}
                              className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unavailable</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pricing Breakdown Summary */}
              {totalTickets > 0 && (
                <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-600 border border-gray-200">
                  <div className="flex justify-between">
                    <span>Selected tickets:</span>
                    <span className="font-semibold">{totalTickets} pass(es)</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-sm text-[#1c0f2b]">
                    <span>Total Subtotal:</span>
                    <span className="text-[#ff5c5c]">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Reserve Button */}
              <button
                onClick={handleReserveTickets}
                disabled={totalTickets === 0 || submitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#ff5c5c] to-[#ff4545] hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100 text-white font-bold text-sm rounded-xl shadow-lg shadow-[#ff5c5c]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Acquiring 10-Minute Lock...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Reserve Tickets (10 Min Hold)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero payment charged until simulated checkout step</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
