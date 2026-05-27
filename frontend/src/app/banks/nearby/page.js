'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import StockGrid from '@/components/StockGrid';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

export default function NearbyBanksPage() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState(null);

  useEffect(() => {
    api.get('/banks/nearby?lat=18.5204&lng=73.8567&radius=25')
      .then(({ data }) => { if (data.success) setBanks(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">🏥 Nearby Blood Banks</h1>
        <p className="text-gray-400 mb-6">Blood banks near Pune with real-time inventory</p>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 h-[500px] rounded-2xl overflow-hidden border border-gray-800">
            <LiveMap center={[18.5204, 73.8567]} zoom={13}
              banks={banks.map((b) => ({ ...b, _id: b._id }))}
              radius={25} />
          </div>

          {/* Bank list */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading blood banks...</div>
            ) : banks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No blood banks found nearby</div>
            ) : (
              banks.map((bank) => (
                <div key={bank._id} onClick={() => setSelectedBank(selectedBank === bank._id ? null : bank._id)}
                  className={`glass-card rounded-xl p-4 cursor-pointer transition-all hover:border-red-500/30 ${selectedBank === bank._id ? 'border-red-500/50' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm">{bank.name}</h3>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{bank.distanceKm} km</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-1">{bank.address}</p>
                  <p className="text-gray-500 text-xs mb-3">📞 {bank.contactNumber}</p>

                  {selectedBank === bank._id && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-2 font-medium">Current Inventory</p>
                      <StockGrid inventory={bank.inventory} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
