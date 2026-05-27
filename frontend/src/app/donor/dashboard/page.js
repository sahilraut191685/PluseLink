'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { socket } from '@/lib/socket';
import { requestNotificationPermission, getNotificationPermission, showEmergencyNotification } from '@/lib/notifications';
import ProtectedRoute from '@/components/ProtectedRoute';
import BloodGroupBadge from '@/components/BloodGroupBadge';
import UrgencyTag from '@/components/UrgencyTag';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DonorDashboard() {
  return (
    <ProtectedRoute roles={['donor']}>
      <DonorDashboardContent />
    </ProtectedRoute>
  );
}

function DonorDashboardContent() {
  const { user, checkAuth } = useAuth();
  const [available, setAvailable] = useState(user?.available ?? true);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifPermission, setNotifPermission] = useState('default');

  // Check notification permission on mount
  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  async function handleEnableNotifications() {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    if (result === 'granted') toast.success('Notifications enabled!');
    else if (result === 'denied') toast.error('Notifications blocked. Enable in browser settings.');
  }

  useEffect(() => {
    fetchAlerts();
    socket.on('new_emergency', (data) => {
      toast('🚨 New emergency alert!', { icon: '🩸' });
      showEmergencyNotification(data);
      setAlerts((prev) => [{ ...data, _id: data.requestId, myStatus: 'pending' }, ...prev]);
    });
    socket.on('request_fulfilled', (data) => {
      setAlerts((prev) => prev.filter((a) => a._id !== data.requestId));
      toast.success('Request fulfilled!');
    });
    return () => { socket.off('new_emergency'); socket.off('request_fulfilled'); };
  }, []);

  async function fetchAlerts() {
    try {
      const { data } = await api.get('/donor/alerts');
      if (data.success) setAlerts(data.data);
    } catch {} finally { setLoading(false); }
  }

  async function toggleAvailability() {
    try {
      const newVal = !available;
      await api.patch('/donor/availability', { available: newVal });
      setAvailable(newVal);
      toast.success(newVal ? 'You are now available' : 'You are now unavailable');
    } catch (err) {
      toast.error('Failed to update availability');
    }
  }

  const pendingAlerts = alerts.filter((a) => a.myStatus === 'pending');
  const pastAlerts = alerts.filter((a) => a.myStatus !== 'pending');

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Donor Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, {user?.name}</p>
          </div>
          <BloodGroupBadge bloodGroup={user?.bloodGroup} size="lg" />
        </div>

        {/* Notification Permission Banner */}
        {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
          <div className="glass-card rounded-2xl p-4 mb-4 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <h3 className="text-white font-semibold text-sm">Enable Push Notifications</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Get alerted instantly when an emergency matches you, even when this tab is in the background.</p>
                </div>
              </div>
              <button onClick={handleEnableNotifications}
                className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm font-medium rounded-lg transition-all border border-yellow-500/30 whitespace-nowrap">
                Enable
              </button>
            </div>
          </div>
        )}

        {/* Availability Toggle */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Availability Status</h2>
              <p className="text-sm text-gray-400 mt-1">
                {available ? '✅ You will receive emergency alerts' : '⏸️ You will not receive alerts'}
              </p>
            </div>
            <button onClick={toggleAvailability}
              className={`relative w-16 h-8 rounded-full transition-all duration-300 ${available ? 'bg-green-500' : 'bg-gray-600'}`}>
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${available ? 'left-9' : 'left-1'}`} />
            </button>
          </div>
          {user?.verifiedDonor && (
            <div className="mt-3 flex items-center gap-1 text-green-400 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Verified Donor
            </div>
          )}
        </div>

        {/* Pending Alerts */}
        {pendingAlerts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" /> Active Alerts ({pendingAlerts.length})
            </h2>
            <div className="space-y-3">
              {pendingAlerts.map((alert) => (
                <Link key={alert._id} href={`/donor/alert/${alert._id}`}
                  className="block glass-card rounded-xl p-5 hover:border-red-500/30 transition-all animate-emergency-pulse">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <BloodGroupBadge bloodGroup={alert.bloodGroup} />
                      <UrgencyTag urgency={alert.urgency} />
                    </div>
                    <span className="text-red-400 text-sm font-medium">Respond →</span>
                  </div>
                  <h3 className="text-white font-semibold">{alert.hospital}</h3>
                  <p className="text-gray-400 text-sm mt-1">{alert.unitsNeeded} unit(s) needed • Patient: {alert.patientName}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Response History */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Response History</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : pastAlerts.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-gray-400">
              <p className="text-4xl mb-3">🩸</p>
              <p>No past responses yet. Stay available to help when needed!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastAlerts.map((alert) => (
                <div key={alert._id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BloodGroupBadge bloodGroup={alert.bloodGroup} size="sm" />
                      <div>
                        <h4 className="text-white text-sm font-medium">{alert.hospital}</h4>
                        <p className="text-gray-400 text-xs">{new Date(alert.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium uppercase px-2 py-1 rounded-full ${alert.myStatus === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {alert.myStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
