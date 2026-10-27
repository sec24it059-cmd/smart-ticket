import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import { api } from '../api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useReservation } from '../context/ReservationContext.tsx';

interface ReservationItem {
  id: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface ReservationDetails {
  id: string;
  reservationNumber: string;
  eventId: string;
  status: string;
  expiresAt: string;
  totalAmount: number;
  items: ReservationItem[];
  event?: {
    id: string;
    title: string;
    venueName: string;
    city: string;
    startDate: string;
  };
  secondsRemaining: number;
  isExpired: boolean;
}

export const CheckoutPage: React.FC = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearHold } = useReservation();

  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attendee details
  const [attendeeName, setAttendeeName] = useState(user?.name || '');
  const [attendeeEmail, setAttendeeEmail] = useState(user?.email || '');
  const [attendeePhone, setAttendeePhone] = useState('+91 98765 43210');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');

  // Simulator controls
  const [simulatedDelay, setSimulatedDelay] = useState<number>(1200);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReservation();
  }, [reservationId]);

  const fetchReservation = async () => {
    try {
      const res = await api.get(`/reservations/${reservationId}`);
      const data = res.data.reservation;
      setReservation(data);

      const remaining = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (data.status === 'EXPIRED' || remaining <= 0) {
        setError('This reservation has expired. Held tickets have been returned to available inventory.');
      } else if (data.status === 'CONFIRMED') {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Error fetching reservation:', err);
      setError(err.response?.data?.error || 'Failed to fetch reservation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          clearHold();
          setError('10-Minute hold expired! The reserved tickets have been released to other attendees.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSimulatePayment = async (action: 'APPROVE' | 'REJECT') => {
    if (secondsLeft <= 0) {
      setError('Cannot checkout expired reservation');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const initRes = await api.post('/payments/initiate', {
        reservationId,
        paymentMethod: `Simulated ${paymentMethod}`,
        attendeeName,
        attendeeEmail,
        idempotencyKey: `idem_pay_${reservationId}`,
      });

      const { transaction } = initRes.data;

      const resolveRes = await api.post('/payments/simulate-action', {
        transactionId: transaction.id,
        action,
        delayMs: simulatedDelay,
        attendeeName,
        attendeeEmail,
      });

      if (action === 'APPROVE') {
        clearHold();
        const orderId = resolveRes.data.order?.id;
        navigate(`/confirmation/${orderId || reservationId}`);
      } else {
        setError('Simulated payment declined by bank: Insufficient test balance or authorization failure.');
      }
    } catch (err: any) {
      console.error('Payment simulation failed:', err);
      setError(err.response?.data?.error || 'Simulated payment processing error.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#ff5c5c] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-[#1c0f2b]">Securing checkout session...</span>
        </div>
      </div>
    );
  }

  const isExpired = secondsLeft <= 0 || reservation?.status === 'EXPIRED';

  return (
    <div className="min-h-screen bg-[#faf8f5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top 10-Minute Countdown Banner */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isExpired
              ? 'bg-red-50 border-red-200 text-red-900'
              : secondsLeft < 120
              ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
              : 'bg-[#1c0f2b] border-white/10 text-white shadow-xl'
          }`}
        >
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isExpired
                  ? 'bg-red-200 text-red-700'
                  : 'bg-gradient-to-tr from-[#ff5c5c] to-[#ff8f70] text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase font-extrabold tracking-wider opacity-75">
                {isExpired ? 'Reservation Expired' : 'Temporary Ticket Hold Active'}
              </div>
              <div className="text-sm font-bold">
                {isExpired
                  ? 'Held inventory has been returned to the pool.'
                  : `Reservation #${reservation?.reservationNumber} locked for 10 minutes.`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isExpired ? (
              <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/10 text-center">
                <span className="font-mono text-xl sm:text-2xl font-black text-[#ff8f70] tracking-widest">
                  {formatCountdown(secondsLeft)}
                </span>
                <div className="text-[10px] text-white/50 -mt-1 font-mono uppercase">Time Remaining</div>
              </div>
            ) : (
              <Link
                to="/events"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Find New Passes
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold">Transaction Notice:</strong>
              <div>{error}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left 2 Cols: Attendee Details & Simulated Gateway */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-[#1c0f2b]">Attendee Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    disabled={isExpired}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-[#ff5c5c] font-medium"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email for Digital Ticket</label>
                  <input
                    type="email"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    disabled={isExpired}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-[#ff5c5c] font-medium"
                    placeholder="you@domain.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={attendeePhone}
                    onChange={(e) => setAttendeePhone(e.target.value)}
                    disabled={isExpired}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-[#ff5c5c] font-medium"
                    placeholder="+91..."
                  />
                </div>
              </div>
            </div>

            {/* Simulated Payment Gateway Controls */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-[#1c0f2b]">Simulated Payment Gateway</h3>
                  <p className="text-xs text-gray-500">
                    Test the complete checkout pipeline without real credit cards or external credentials.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                  Mock Gateway v2.4
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'UPI', label: 'UPI / QR', desc: 'GooglePay, PhonePe' },
                  { id: 'CARD', label: 'Card', desc: 'Visa, RuPay, MC' },
                  { id: 'NETBANKING', label: 'NetBanking', desc: 'HDFC, ICICI, SBI' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    disabled={isExpired}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? 'border-[#ff5c5c] bg-[#fff8f6] shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-[#1c0f2b]">{m.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* Configurable Latency Delay Slider */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#ff5c5c]" />
                    Simulated Network Latency:
                  </span>
                  <span className="font-mono text-[#ff5c5c] font-bold">{simulatedDelay} ms</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="3500"
                  step="100"
                  value={simulatedDelay}
                  onChange={(e) => setSimulatedDelay(Number(e.target.value))}
                  disabled={isExpired || processing}
                  className="w-full accent-[#ff5c5c] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Fast (200ms)</span>
                  <span>Realistic (1200ms)</span>
                  <span>Slow 3G (3500ms)</span>
                </div>
              </div>

              {/* Action Buttons for Testing Success vs Failure */}
              <div className="pt-2 space-y-3">
                <div className="text-xs font-bold text-gray-700">Choose Simulation Test Scenario:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSimulatePayment('APPROVE')}
                    disabled={isExpired || processing}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-105 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {processing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Simulate Payment Approval</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulatePayment('REJECT')}
                    disabled={isExpired || processing}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:brightness-105 active:scale-95 text-white font-bold text-xs shadow-md shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Simulate Payment Rejection</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Reservation Summary */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-[#1c0f2b] border-b border-gray-100 pb-2">
                Order Summary
              </h3>

              {reservation?.event && (
                <div className="space-y-1">
                  <div className="font-bold text-sm text-[#1c0f2b]">{reservation.event.title}</div>
                  <div className="text-xs text-gray-500">{reservation.event.venueName}, {reservation.event.city}</div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2 divide-y divide-gray-100 pt-1">
                {reservation?.items.map((item) => (
                  <div key={item.id} className="pt-2 flex justify-between text-xs">
                    <div>
                      <div className="font-semibold text-gray-800">{item.categoryName}</div>
                      <div className="text-gray-400">{item.quantity} × ₹{item.unitPrice.toLocaleString()}</div>
                    </div>
                    <div className="font-bold text-[#1c0f2b]">
                      ₹{item.subtotal.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-sm">
                <span className="font-bold text-gray-700">Total Payable:</span>
                <span className="font-black text-xl text-[#ff5c5c]">
                  ₹{reservation?.totalAmount.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-gray-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Row-Level Concurrency Protected</span>
                </div>
                <p>
                  PostgreSQL atomic hold prevents other users from buying these exact seats during your 10-minute session.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
