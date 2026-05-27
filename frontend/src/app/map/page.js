'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { socket } from '@/lib/socket';
import BloodGroupBadge from '@/components/BloodGroupBadge';
import UrgencyTag from '@/components/UrgencyTag';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/FullScreenMap'), { ssr: false });

export default function LiveMapPage() {
  const [mapData, setMapData] = useState({ emergencies: [], donors: [], banks: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // { type, data }
  const [filters, setFilters] = useState({ emergencies: true, donors: true, banks: true });
  const [center] = useState([18.5204, 73.8567]); // Pune

  const fetchData = useCallback(() => {
    api.get(`/map/data?lat=${center[0]}&lng=${center[1]}&radius=25`)
      .then(({ data: r }) => { if (r.success) setMapData(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [center]);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    // Real-time updates
    socket.on('new_emergency', () => fetchData());
    socket.on('request_fulfilled', () => fetchData());
    socket.on('request_cancelled', () => fetchData());

    return () => {
      clearInterval(interval);
      socket.off('new_emergency');
      socket.off('request_fulfilled');
      socket.off('request_cancelled');
    };
  }, [fetchData]);

  const counts = {
    emergencies: mapData.emergencies.length,
    donors: mapData.donors.length,
    banks: mapData.banks.length,
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 border-b border-gray-800/50 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Map
          </h1>
          <span className="text-xs text-gray-500">Auto-refreshes every 30s</span>
        </div>
        <div className="flex items-center gap-2">
          {[
            { key: 'emergencies', label: '🚨 Emergencies', count: counts.emergencies, color: 'red' },
            { key: 'donors', label: '🩸 Donors', count: counts.donors, color: 'green' },
            { key: 'banks', label: '🏥 Banks', count: counts.banks, color: 'blue' },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilters((p) => ({ ...p, [f.key]: !p[f.key] }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                filters[f.key]
                  ? `bg-${f.color}-500/20 border-${f.color}-500/30 text-${f.color}-400`
                  : 'bg-gray-800 border-gray-700 text-gray-500'
              }`}
              style={filters[f.key] ? { background: `var(--${f.color}-bg, rgba(${f.color === 'red' ? '239,68,68' : f.color === 'green' ? '34,197,94' : '59,130,246'},0.15))`, borderColor: `rgba(${f.color === 'red' ? '239,68,68' : f.color === 'green' ? '34,197,94' : '59,130,246'},0.3)`, color: f.color === 'red' ? '#f87171' : f.color === 'green' ? '#4ade80' : '#60a5fa' } : {}}>
              {f.label} <span className="font-bold">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex relative">
        {/* Map */}
        <div className="flex-1">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <MapView
              center={center}
              emergencies={filters.emergencies ? mapData.emergencies : []}
              donors={filters.donors ? mapData.donors : []}
              banks={filters.banks ? mapData.banks : []}
              onSelect={setSelected}
            />
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="absolute right-4 top-4 w-80 glass-card rounded-2xl p-5 z-20 max-h-[80vh] overflow-y-auto animate-slide-in">
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {selected.type === 'emergency' && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🚨</span>
                  <UrgencyTag urgency={selected.data.urgency} />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">{selected.data.hospital}</h3>
                <p className="text-gray-400 text-sm mb-3">Patient: {selected.data.patientName}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Blood Group</span><BloodGroupBadge bloodGroup={selected.data.bloodGroup} size="sm" /></div>
                  <div className="flex justify-between"><span className="text-gray-400">Units Needed</span><span className="text-white font-bold">{selected.data.unitsNeeded}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Donors Matched</span><span className="text-white">{selected.data.matchedDonorCount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="text-yellow-400 capitalize text-xs font-bold">{selected.data.status}</span></div>
                </div>
              </>
            )}

            {selected.type === 'donor' && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🩸</span>
                  <span className="text-white font-bold text-lg">{selected.data.name}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Blood Group</span><BloodGroupBadge bloodGroup={selected.data.bloodGroup} size="sm" /></div>
                  <div className="flex justify-between"><span className="text-gray-400">Distance</span><span className="text-white">{selected.data.distanceKm} km</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Verified</span><span className={selected.data.verifiedDonor ? 'text-green-400' : 'text-gray-500'}>{selected.data.verifiedDonor ? '✓ Yes' : 'No'}</span></div>
                </div>
              </>
            )}

            {selected.type === 'bank' && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🏥</span>
                  <span className="text-white font-bold text-lg">{selected.data.name}</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{selected.data.address}</p>
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between"><span className="text-gray-400">Distance</span><span className="text-white">{selected.data.distanceKm} km</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Total Units</span><span className="text-white font-bold">{selected.data.totalUnits}</span></div>
                  {selected.data.contactNumber && (
                    <a href={`tel:${selected.data.contactNumber}`} className="block mt-2 text-center py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors text-sm">
                      📞 Call {selected.data.contactNumber}
                    </a>
                  )}
                </div>
                {selected.data.inventory && (
                  <div className="grid grid-cols-4 gap-1.5 mt-3">
                    {Object.entries(selected.data.inventory).map(([bg, units]) => (
                      <div key={bg} className="text-center bg-gray-800 rounded-lg p-1.5">
                        <div className="text-xs font-bold text-gray-300">{bg}</div>
                        <div className={`text-sm font-bold ${units > 0 ? 'text-green-400' : 'text-red-400'}`}>{units}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
