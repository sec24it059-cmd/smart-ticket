import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Building2,
  Calendar,
  DollarSign,
  Cpu,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Ban,
  Activity,
  Zap,
} from 'lucide-react';
import { api } from '../api.ts';

interface AdminStats {
  totalUsers: number;
  totalOrganizers: number;
  totalEvents: number;
  totalOrders: number;
  totalGrossRevenue: number;
  workerStats: {
    totalCleaned: number;
    lastRunAt: string;
    isRunning: boolean;
  };
  cacheStats: {
    entries: number;
    hitCount: number;
    missCount: number;
    hitRatio: string;
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  memberCount: number;
  eventCount: number;
}

interface AdminEvent {
  id: string;
  title: string;
  category: string;
  city: string;
  status: string;
  maxCapacity: number;
}

interface TransactionLog {
  id: string;
  providerReference: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);

  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'orgs' | 'transactions'>('events');
  const [loading, setLoading] = useState(true);
  const [workerMessage, setWorkerMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, orgsRes, eventsRes, txnRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/organizations'),
        api.get('/admin/events'),
        api.get('/admin/transactions'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setOrgs(orgsRes.data.organizations || []);
      setEvents(eventsRes.data.events || []);
      setTransactions(txnRes.data.transactions || []);
      setAuditLogs(txnRes.data.auditLogs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerateEvent = async (eventId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/events/${eventId}/status`, { status: newStatus });
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to moderate event.');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user.');
    }
  };

  const handleToggleOrgVerification = async (orgId: string, currentVerified: boolean) => {
    try {
      await api.patch(`/admin/organizations/${orgId}/verify`, { verified: !currentVerified });
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update organization verification.');
    }
  };

  const handleTriggerWorker = async () => {
    setWorkerMessage('Running background expiration sweep...');
    try {
      const res = await api.post('/admin/worker/trigger-cleanup');
      setWorkerMessage(res.data.message);
      fetchAdminData();
    } catch (err) {
      setWorkerMessage('Worker trigger failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1c0f2b] text-white p-6 rounded-3xl shadow-xl border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff5c5c] to-[#ff4545] flex items-center justify-center text-white shadow-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase font-mono font-bold tracking-wider text-[#ff8f70]">
                TicketNest Root Administration
              </div>
              <h1 className="text-2xl font-black">Platform Command Console</h1>
            </div>
          </div>

          <button
            onClick={handleTriggerWorker}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Zap className="w-4 h-4 text-[#ff5c5c]" />
            <span>Trigger Expiration Sweep</span>
          </button>
        </div>

        {workerMessage && (
          <div className="p-3 bg-purple-900 text-purple-200 rounded-xl text-xs flex items-center gap-2 border border-purple-800">
            <Cpu className="w-4 h-4 text-[#ff8f70]" />
            <span>{workerMessage}</span>
          </div>
        )}

        {/* Global Platform KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Platform Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-[#1c0f2b]">
              ₹{stats ? stats.totalGrossRevenue.toLocaleString() : '0'}
            </div>
            <div className="text-[11px] text-gray-500">From {stats?.totalOrders || 0} orders</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total Users</span>
              <Users className="w-4 h-4 text-[#ff5c5c]" />
            </div>
            <div className="text-2xl font-black text-[#1c0f2b]">{stats?.totalUsers || 0}</div>
            <div className="text-[11px] text-gray-500">{stats?.totalOrganizers || 0} organizer accounts</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Worker Engine</span>
              <Cpu className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-[#1c0f2b]">
              {stats?.workerStats?.totalCleaned || 0}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">Holds expired & restored</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Cache Hit Ratio</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-[#1c0f2b]">
              {stats?.cacheStats?.hitRatio || '0.00'}
            </div>
            <div className="text-[11px] text-gray-500">{stats?.cacheStats?.entries || 0} cached public keys</div>
          </div>
        </div>

        {/* Tabbed Management View */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden space-y-4">
          <div className="flex border-b border-gray-200 px-6 pt-4 gap-6 text-xs font-bold text-gray-500 overflow-x-auto">
            <button
              onClick={() => setActiveTab('events')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'border-[#ff5c5c] text-[#1c0f2b]'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              Event Moderation ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'border-[#ff5c5c] text-[#1c0f2b]'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              User & Account Access ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('orgs')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'orgs'
                  ? 'border-[#ff5c5c] text-[#1c0f2b]'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              Organizations ({orgs.length})
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'transactions'
                  ? 'border-[#ff5c5c] text-[#1c0f2b]'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              Audit Trail & Logs ({auditLogs.length})
            </button>
          </div>

          <div className="p-6">
            {/* TAB 1: EVENTS */}
            {activeTab === 'events' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-400 font-mono uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Event Name</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">City</th>
                      <th className="py-2.5 px-4">Capacity</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Moderation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {events.map((evt) => (
                      <tr key={evt.id} className="hover:bg-gray-50/70">
                        <td className="py-3 px-4 font-bold text-[#1c0f2b]">{evt.title}</td>
                        <td className="py-3 px-4">{evt.category}</td>
                        <td className="py-3 px-4">{evt.city}</td>
                        <td className="py-3 px-4 font-mono">{evt.maxCapacity}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              evt.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : evt.status === 'SUSPENDED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {evt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {evt.status === 'PUBLISHED' ? (
                            <button
                              onClick={() => handleModerateEvent(evt.id, 'SUSPENDED')}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded font-bold text-[11px] cursor-pointer"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleModerateEvent(evt.id, 'PUBLISHED')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-bold text-[11px] cursor-pointer"
                            >
                              Publish
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: USERS */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-400 font-mono uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">User Name</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Account Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/70">
                        <td className="py-3 px-4 font-bold text-[#1c0f2b]">{u.name}</td>
                        <td className="py-3 px-4 font-mono text-gray-500">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-purple-700">{u.role}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className="px-2.5 py-1 rounded font-bold text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                          >
                            {u.status === 'ACTIVE' ? 'Suspend Access' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: ORGANIZATIONS */}
            {activeTab === 'orgs' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-400 font-mono uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Organization</th>
                      <th className="py-2.5 px-4">Slug</th>
                      <th className="py-2.5 px-4 text-center">Events Published</th>
                      <th className="py-2.5 px-4">Verification</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {orgs.map((org) => (
                      <tr key={org.id} className="hover:bg-gray-50/70">
                        <td className="py-3 px-4 font-bold text-[#1c0f2b] flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span>{org.name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-400">{org.slug}</td>
                        <td className="py-3 px-4 text-center font-bold">{org.eventCount}</td>
                        <td className="py-3 px-4">
                          {org.verified ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium">Standard</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleOrgVerification(org.id, org.verified)}
                            className="px-2.5 py-1 rounded font-bold text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                          >
                            {org.verified ? 'Revoke Badge' : 'Grant Verified Badge'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: AUDIT LOGS */}
            {activeTab === 'transactions' && (
              <div className="space-y-3 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="bg-[#1c0f2b] text-white px-2 py-0.5 rounded text-[10px] mr-2">
                        {log.action}
                      </span>
                      <span className="font-bold text-gray-800">{log.entityType}</span>
                      <span className="text-gray-500 mx-2">•</span>
                      <span className="text-gray-600">{log.details}</span>
                    </div>
                    <span className="text-gray-400 text-[10px] shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
