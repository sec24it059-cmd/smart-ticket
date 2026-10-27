import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Ticket,
  Plus,
  Trash2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../api.ts';

interface NewTicketTier {
  name: string;
  description: string;
  price: number;
  quantity: number;
  maxPerUser: number;
}

export const EventWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technology');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'
  );

  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesClosesAt, setSalesClosesAt] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(500);

  // Tiers matching prompt requirements
  const [tickets, setTickets] = useState<NewTicketTier[]>([
    {
      name: 'Platinum Pass',
      description: 'VIP Front-Row Seating, Lounge Access & Executive Dinner',
      price: 3000,
      quantity: 50,
      maxPerUser: 4,
    },
    {
      name: 'Gold Pass',
      description: 'General Conference Hall Admission & Catered Lunch',
      price: 1500,
      quantity: 150,
      maxPerUser: 6,
    },
    {
      name: 'Standard Pass',
      description: 'Standard Hall Admission & Digital Recordings',
      price: 600,
      quantity: 500,
      maxPerUser: 10,
    },
  ]);

  const handleAddTier = () => {
    setTickets([
      ...tickets,
      {
        name: 'New Tier Pass',
        description: 'Admission tier details',
        price: 500,
        quantity: 100,
        maxPerUser: 5,
      },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    if (tickets.length <= 1) return;
    setTickets(tickets.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof NewTicketTier, value: any) => {
    const updated = [...tickets];
    (updated[index] as any)[field] = value;
    setTickets(updated);
  };

  const handleSubmitEvent = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        title,
        category,
        description,
        coverImage,
        venueName,
        venueAddress,
        city,
        startDate: startDate ? new Date(startDate).toISOString() : new Date(Date.now() + 86400000 * 14).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 86400000 * 16).toISOString(),
        salesClosesAt: salesClosesAt ? new Date(salesClosesAt).toISOString() : new Date(Date.now() + 86400000 * 13).toISOString(),
        maxCapacity: Number(maxCapacity),
        tickets,
      };

      const res = await api.post('/organizer/events', payload);
      navigate(`/events/${res.data.event.id}`);
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.response?.data?.error || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Wizard Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/organizer" className="text-xs font-bold text-gray-500 hover:text-[#ff5c5c] flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Studio
            </Link>
            <h1 className="text-2xl font-extrabold text-[#1c0f2b]">Create & Publish Event</h1>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === step
                    ? 'bg-[#ff5c5c] text-white shadow-md'
                    : currentStep > step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step ? '✓' : step}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Forms Container */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          {/* STEP 1: EVENT BASICS */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#1c0f2b] border-b border-gray-100 pb-2">
                Step 1: Event Details & Branding
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Global AI & Cloud Innovations 2026"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-semibold text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-medium"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Music">Music</option>
                      <option value="Design">Design</option>
                      <option value="Food & Drink">Food & Drink</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Cover Image URL</label>
                    <input
                      type="url"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Description *</label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the keynote tracks, agenda, and experience..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-normal leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VENUE & DATES */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#1c0f2b] border-b border-gray-100 pb-2">
                Step 2: Schedule & Location
              </h2>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Venue Name *</label>
                    <input
                      type="text"
                      required
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="e.g. Grand Convention Center"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">City</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-medium"
                    >
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="New Delhi">New Delhi</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Goa">Goa</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Venue Full Address</label>
                  <input
                    type="text"
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="Street, area, landmarks"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Max Overall Capacity</label>
                    <input
                      type="number"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TICKET TIERS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h2 className="text-lg font-bold text-[#1c0f2b]">
                  Step 3: Ticket Tiers & Capacity Quotas
                </h2>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="px-3 py-1.5 bg-[#ff5c5c]/10 text-[#ff5c5c] hover:bg-[#ff5c5c] hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Tier
                </button>
              </div>

              <div className="space-y-3">
                {tickets.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#1c0f2b]">Tier #{idx + 1}</span>
                      {tickets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="font-bold text-gray-700 block mb-1">Tier Name</label>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-semibold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Price (₹)</label>
                        <input
                          type="number"
                          value={t.price}
                          onChange={(e) => handleTierChange(idx, 'price', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-semibold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Quantity Quota</label>
                        <input
                          type="number"
                          value={t.quantity}
                          onChange={(e) => handleTierChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c] font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Tier Inclusions & Perks</label>
                      <input
                        type="text"
                        value={t.description}
                        onChange={(e) => handleTierChange(idx, 'description', e.target.value)}
                        placeholder="e.g. VIP Seating, fast-track entry, lunch buffet"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#ff5c5c]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !title) {
                    setError('Please specify an event title to proceed');
                    return;
                  }
                  setError(null);
                  setCurrentStep((prev) => prev + 1);
                }}
                className="px-5 py-2.5 bg-[#1c0f2b] hover:bg-[#ff5c5c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitEvent}
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-[#ff5c5c] to-[#ff4545] hover:brightness-105 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#ff5c5c]/30 transition-all cursor-pointer"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Publish Event & Open Ticket Sales</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
