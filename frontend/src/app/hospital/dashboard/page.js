'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { socket } from '@/lib/socket';
import ProtectedRoute from '@/components/ProtectedRoute';
import BloodGroupBadge from '@/components/BloodGroupBadge';
import UrgencyTag from '@/components/UrgencyTag';
import StockGrid from '@/components/StockGrid';
import Link from 'next/link';

export default function HospitalDashboard() {
  return (
    <ProtectedRoute roles={['hospital']}>
      <HospitalDashboardContent />
    </ProtectedRoute>
  );
}

function HospitalDashboardContent() {
  const [emergencies, setEmergencies] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/emergency/active').then(({ data }) => data.success && setEmergencies(data.data)),
      api.get('/banks').then(({ data }) => data.success && setBanks(data.data)),
    ]).finally(() => setLoading(false));

    socket.on('donor_responded', (data) => {
      setEmergencies((prev) => prev.map((e) => e._id === data.requestId ? { ...e, status: data.status } : e));
    });
    socket.on('request_fulfilled', (data) => {
      setEmergencies((prev) => prev.map((e) => e._id === data.requestId ? { ...e, status: 'fulfilled' } : e));
    });
    return () => { socket.off('donor_responded'); socket.off('request_fulfilled'); };
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;

  const activeEmergencies = emergencies.filter((e) => e.status !== 'fulfilled' && e.status !== 'cancelled');
  const donorsEnRoute = emergencies.flatMap((e) => e.matchedDonors?.filter((d) => d.status === 'accepted') || []);

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">🏥 Hospital Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage emergencies and blood inventory</p>
          </div>
          <Link href="/hospital/inventory" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm border border-gray-700">
            📦 Manage Inventory
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-red-400">{activeEmergencies.length}</div>
            <div className="text-sm text-gray-400 mt-1">Active Emergencies</div>
          </div>
          <div className="glass-card rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-green-400">{donorsEnRoute.length}</div>
            <div className="text-sm text-gray-400 mt-1">Donors En Route</div>
          </div>
          <div className="glass-card rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-blue-400">{banks.length}</div>
            <div className="text-sm text-gray-400 mt-1">Blood Banks</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Requests */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Active Requests</h2>
            {activeEmergencies.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center text-gray-400">No active emergencies</div>
            ) : (
              <div className="space-y-3">
                {activeEmergencies.map((e) => (
                  <div key={e._id} className="glass-card rounded-xl p-4 hover:border-red-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BloodGroupBadge bloodGroup={e.bloodGroup} size="sm" />
                        <UrgencyTag urgency={e.urgency} />
                      </div>
                      <span className="text-xs text-gray-400">{new Date(e.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <h3 className="text-white font-medium text-sm">{e.patientName} — {e.hospital}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-400 text-xs">{e.matchedDonors?.filter((d) => d.status === 'accepted').length || 0} / {e.unitsNeeded} accepted</span>
                      <span className={`text-xs font-medium uppercase ${e.status === 'active' ? 'text-yellow-400' : 'text-green-400'}`}>{e.status}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                      <div className="bg-green-500 h-1 rounded-full" style={{ width: `${e.fulfillmentPercentage || 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inventory Overview */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Blood Bank Inventory</h2>
            {banks.map((bank) => (
              <div key={bank._id} className="glass-card rounded-xl p-4 mb-4">
                <h3 className="text-white font-medium text-sm mb-3">{bank.name}</h3>
                <StockGrid inventory={bank.inventory} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
