'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { socket } from '@/lib/socket';
import BloodGroupBadge from '@/components/BloodGroupBadge';
import UrgencyTag from '@/components/UrgencyTag';
import DonorCard from '@/components/DonorCard';
import EtaTimer from '@/components/EtaTimer';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

const STATUS_STEPS = ['active', 'partially_fulfilled', 'fulfilled'];

export default function TrackRequestPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [etas, setEtas] = useState({});

  useEffect(() => {
    api.get(`/emergency/${id}`)
      .then(({ data }) => { if (data.success) setRequest(data.data); })
      .catch(() => toast.error('Failed to load request'))
      .finally(() => setLoading(false));

    socket.on('donor_responded', (data) => {
      if (data.requestId === id) {
        setRequest((prev) => prev ? { ...prev, status: data.status } : prev);
        toast(data.accepted ? `✅ ${data.donorName} accepted!` : `${data.donorName} declined`, { icon: data.accepted ? '🎉' : '😔' });
        // Refresh full data
        api.get(`/emergency/${id}`).then(({ data: d }) => { if (d.success) setRequest(d.data); });
      }
    });
    socket.on('eta_update', (data) => {
      if (data.requestId === id) {
        setEtas((prev) => ({ ...prev, [data.donorId]: data }));
      }
    });
    socket.on('request_fulfilled', (data) => {
      if (data.requestId === id) {
        toast.success('🎉 Request fully fulfilled!');
        api.get(`/emergency/${id}`).then(({ data: d }) => { if (d.success) setRequest(d.data); });
      }
    });

    return () => { socket.off('donor_responded'); socket.off('eta_update'); socket.off('request_fulfilled'); };
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!request) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Request not found</div>;

  const acceptedDonors = request.matchedDonors?.filter((d) => d.status === 'accepted' || d.status === 'donated') || [];
  const pendingDonors = request.matchedDonors?.filter((d) => d.status === 'pending') || [];
  const currentStep = STATUS_STEPS.indexOf(request.status);

  // Prepare donor markers for map
  const donorMarkers = request.matchedDonors?.filter((d) => d.donorId?.location).map((d) => ({
    _id: d.donorId._id,
    name: d.donorId.name,
    bloodGroup: d.donorId.bloodGroup,
    location: d.donorId.location,
    distance: 0,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BloodGroupBadge bloodGroup={request.bloodGroup} size="lg" />
              <UrgencyTag urgency={request.urgency} />
            </div>
            <span className={`text-sm font-bold uppercase px-3 py-1 rounded-full ${request.status === 'fulfilled' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {request.status?.replace('_', ' ')}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">{request.patientName}</h1>
          <p className="text-gray-400">{request.hospital} • {request.unitsNeeded} unit(s) needed</p>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= i ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-500'}`}>
                    {currentStep > i ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs capitalize ${currentStep >= i ? 'text-green-400' : 'text-gray-500'}`}>{step.replace('_', ' ')}</span>
                  {i < STATUS_STEPS.length - 1 && <div className={`w-16 h-0.5 ${currentStep > i ? 'bg-green-500' : 'bg-gray-700'}`} />}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${request.fulfillmentPercentage || 0}%` }} />
            </div>
            <p className="text-sm text-gray-400 mt-1">{request.fulfillmentPercentage || 0}% fulfilled ({acceptedDonors.length}/{request.unitsNeeded})</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Live Map */}
          <div className="h-80 lg:h-full rounded-2xl overflow-hidden border border-gray-800">
            <LiveMap
              center={[request.location.coordinates[1], request.location.coordinates[0]]}
              zoom={13}
              hospitals={[{ name: request.hospital, lat: request.location.coordinates[1], lng: request.location.coordinates[0] }]}
              donors={donorMarkers}
              radius={request.broadcastRadius}
            />
          </div>

          {/* Donors & ETAs */}
          <div className="space-y-4">
            {/* ETA Timers */}
            {Object.values(etas).length > 0 && (
              <div className="glass-card rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">🕐 ETAs</h3>
                <div className="flex flex-wrap gap-4 justify-center">
                  {Object.values(etas).map((eta) => (
                    <EtaTimer key={eta.donorId} etaMinutes={eta.etaMinutes} donorName={eta.donorName} />
                  ))}
                </div>
              </div>
            )}

            {/* Accepted Donors */}
            {acceptedDonors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-400 mb-2">✅ Accepted ({acceptedDonors.length})</h3>
                {acceptedDonors.map((d) => (
                  <DonorCard key={d.donorId?._id || d.donorId} donor={{ name: d.donorId?.name, bloodGroup: d.donorId?.bloodGroup, verifiedDonor: d.donorId?.verifiedDonor, status: d.status }} />
                ))}
              </div>
            )}

            {/* Pending Donors */}
            {pendingDonors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-yellow-400 mb-2">⏳ Pending ({pendingDonors.length})</h3>
                {pendingDonors.map((d) => (
                  <DonorCard key={d.donorId?._id || d.donorId} donor={{ name: d.donorId?.name || 'Awaiting response', bloodGroup: d.donorId?.bloodGroup, status: d.status }} />
                ))}
              </div>
            )}

            {/* Blood Bank Options */}
            {request.bloodBankOptions?.length > 0 && (
              <div className="glass-card rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">🏥 Nearby Blood Banks</h3>
                {request.bloodBankOptions.map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                    <span className="text-gray-300 text-sm">{b.bankId?.name || 'Blood Bank'}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{b.distance} km</span>
                      <span className={`text-xs font-bold ${b.unitsAvailable > 0 ? 'text-green-400' : 'text-red-400'}`}>{b.unitsAvailable} units</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
