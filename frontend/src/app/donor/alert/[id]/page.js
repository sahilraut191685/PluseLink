'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import BloodGroupBadge from '@/components/BloodGroupBadge';
import UrgencyTag from '@/components/UrgencyTag';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

export default function DonorAlertPage() {
  return (
    <ProtectedRoute roles={['donor']}>
      <DonorAlertContent />
    </ProtectedRoute>
  );
}

function DonorAlertContent() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min

  useEffect(() => {
    api.get(`/emergency/${id}`)
      .then(({ data }) => { if (data.success) setRequest(data.data); })
      .catch(() => toast.error('Failed to load alert'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  async function handleRespond(accepted) {
    setResponding(true);
    try {
      const { data } = await api.post('/donor/respond', { requestId: id, accepted });
      toast.success(accepted ? 'Thank you! Head to the hospital now.' : 'Response recorded.');
      router.push('/donor/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to respond');
    } finally {
      setResponding(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!request) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Alert not found</div>;

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="glass-card rounded-2xl p-6 mb-6 animate-emergency-pulse">
          <div className="flex items-center justify-between mb-4">
            <UrgencyTag urgency={request.urgency} />
            <div className="text-right">
              <span className="text-2xl font-bold text-red-400">{mins}:{secs.toString().padStart(2, '0')}</span>
              <p className="text-xs text-gray-500">to respond</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">🚨 Emergency Blood Request</h1>

          <div className="space-y-3 my-6">
            <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
              <span className="text-gray-400 text-sm">Patient</span>
              <span className="text-white font-medium">{request.patientName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
              <span className="text-gray-400 text-sm">Blood Group</span>
              <BloodGroupBadge bloodGroup={request.bloodGroup} size="md" />
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
              <span className="text-gray-400 text-sm">Units Needed</span>
              <span className="text-white font-bold text-lg">{request.unitsNeeded}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
              <span className="text-gray-400 text-sm">Hospital</span>
              <span className="text-white">{request.hospital}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400 text-sm">Status</span>
              <span className="text-green-400 uppercase text-xs font-bold">{request.status}</span>
            </div>
          </div>

          {/* Hospital location map */}
          <div className="h-48 rounded-xl overflow-hidden mb-6">
            <LiveMap center={[request.location.coordinates[1], request.location.coordinates[0]]} zoom={15}
              hospitals={[{ name: request.hospital, lat: request.location.coordinates[1], lng: request.location.coordinates[0] }]} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={() => handleRespond(false)} disabled={responding}
              className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl transition-all disabled:opacity-50 border border-gray-700">
              ✕ Decline
            </button>
            <button onClick={() => handleRespond(true)} disabled={responding || countdown <= 0}
              className="flex-1 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-green-500/25">
              ✓ Accept & Go
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            ⚠️ By accepting, you commit to donating blood at the hospital. Always consult a doctor.
          </p>
        </div>
      </div>
    </div>
  );
}
