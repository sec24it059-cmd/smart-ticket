import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Ticket,
  ArrowLeft,
  Plus,
  Save,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../api.ts';

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
  isActive: boolean;
}

export const TicketManagementPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [eventTitle, setEventTitle] = useState('Event');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New tier modal / form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTierName, setNewTierName] = useState('');
  const [newTierPrice, setNewTierPrice] = useState(1000);
  const [newTierQuantity, setNewTierQuantity] = useState(100);
  const [newTierDescription, setNewTierDescription] = useState('');

  useEffect(() => {
    fetchEventAndTiers();
  }, [eventId]);

  const fetchEventAndTiers = async () => {
    try {
      const res = await api.get(`/events/${eventId}`);
      setEventTitle(res.data.event.title);
      setTiers(res.data.event.ticketCategories || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTier = async (tier: TicketTier) => {
    setMessage(null);
    setError(null);
    try {
      await api.put(`/organizer/tickets/${tier.id}`, {
        name: tier.name,
        price: tier.price,
        totalQuantity: tier.totalQuantity,
        isActive: tier.isActive,
      });
      setMessage(`Tier "${tier.name}" updated successfully.`);
      fetchEventAndTiers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update ticket tier.');
    }
  };

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await api.post(`/organizer/events/${eventId}/tickets`, {
        name: newTierName,
        price: newTierPrice,
        totalQuantity: newTierQuantity,
        description: newTierDescription,
      });
      setMessage('New ticket tier created.');
      setShowAddForm(false);
      setNewTierName('');
      fetchEventAndTiers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create ticket tier.');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link to="/organizer" className="text-xs font-bold text-gray-500 hover:text-[#ff5c5c] flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Organizer Studio
            </Link>
            <h1 className="text-2xl font-extrabold text-[#1c0f2b]">Manage Ticket Tiers</h1>
            <p className="text-xs text-gray-500">Event: {eventTitle}</p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#ff5c5c] to-[#ff4545] hover:brightness-105 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Ticket Tier
          </button>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Add Tier Form Modal / Card */}
        {showAddForm && (
          <form
            onSubmit={handleCreateTier}
            className="bg-white p-6 rounded-2xl border-2 border-[#ff5c5c] shadow-lg space-y-4 text-xs animate-in fade-in"
          >
            <div className="flex items-center justify-between font-bold text-sm text-[#1c0f2b]">
              <span>Create New Ticket Tier</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tier Name</label>
                <input
                  type="text"
                  required
                  value={newTierName}
                  onChange={(e) => setNewTierName(e.target.value)}
                  placeholder="e.g. VIP Front Deck"
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#ff5c5c]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Price (₹)</label>
                <input
                  type="number"
                  required
                  value={newTierPrice}
                  onChange={(e) => setNewTierPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#ff5c5c]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Total Quantity</label>
                <input
                  type="number"
                  required
                  value={newTierQuantity}
                  onChange={(e) => setNewTierQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#ff5c5c]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Description</label>
              <input
                type="text"
                value={newTierDescription}
                onChange={(e) => setNewTierDescription(e.target.value)}
                placeholder="Perks and access details"
                className="w-full px-3 py-2 border rounded-xl outline-none focus:border-[#ff5c5c]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#ff5c5c] text-white font-bold rounded-xl shadow"
              >
                Create Tier
              </button>
            </div>
          </form>
        )}

        {/* Existing Tiers Grid */}
        <div className="space-y-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#1c0f2b]">{tier.name}</h3>
                    <p className="text-xs text-gray-500">{tier.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const updated = { ...tier, isActive: !tier.isActive };
                      handleUpdateTier(updated);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      tier.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tier.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{tier.isActive ? 'Active for Sales' : 'Deactivated'}</span>
                  </button>
                </div>
              </div>

              {/* Inventory Breakdown Meters */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 text-[10px] uppercase block font-mono">Sold</span>
                  <span className="font-black text-base text-emerald-600">{tier.soldQuantity}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 text-[10px] uppercase block font-mono">Held (10m)</span>
                  <span className="font-black text-base text-amber-600">{tier.reservedQuantity}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 text-[10px] uppercase block font-mono">Available</span>
                  <span className="font-black text-base text-[#ff5c5c]">{tier.availableQuantity}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 text-[10px] uppercase block font-mono">Total Quota</span>
                  <span className="font-black text-base text-gray-800">{tier.totalQuantity}</span>
                </div>
              </div>

              {/* Edit Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-600">Price:</span>
                    <span className="font-mono text-gray-400">₹</span>
                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTiers(tiers.map((t) => (t.id === tier.id ? { ...t, price: val } : t)));
                      }}
                      className="w-24 px-2 py-1 border rounded-lg font-bold text-gray-800 outline-none focus:border-[#ff5c5c]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-600">Total Quota:</span>
                    <input
                      type="number"
                      value={tier.totalQuantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTiers(tiers.map((t) => (t.id === tier.id ? { ...t, totalQuantity: val } : t)));
                      }}
                      className="w-24 px-2 py-1 border rounded-lg font-bold text-gray-800 outline-none focus:border-[#ff5c5c]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateTier(tier)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#1c0f2b] hover:bg-[#ff5c5c] text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
