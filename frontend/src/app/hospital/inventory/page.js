'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StockGrid from '@/components/StockGrid';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  return (
    <ProtectedRoute roles={['hospital']}>
      <InventoryContent />
    </ProtectedRoute>
  );
}

function InventoryContent() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/banks')
      .then(({ data }) => { if (data.success) setBanks(data.data); })
      .finally(() => setLoading(false));
  }, []);

  async function handleUpdate(bankId, group, value) {
    try {
      await api.patch(`/banks/${bankId}/inventory`, { [group]: value });
      setBanks((prev) => prev.map((b) => b._id === bankId ? { ...b, inventory: { ...b.inventory, [group]: value } } : b));
    } catch {
      toast.error('Failed to update inventory');
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">📦 Inventory Management</h1>
        <p className="text-gray-400 mb-8">Update blood stock levels for each blood group</p>

        <div className="space-y-6">
          {banks.map((bank) => (
            <div key={bank._id} className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{bank.name}</h2>
                  <p className="text-gray-400 text-sm">{bank.address}</p>
                </div>
                <span className="text-xs text-gray-500">Last updated: {new Date(bank.lastUpdated || bank.updatedAt).toLocaleString()}</span>
              </div>
              <StockGrid inventory={bank.inventory} editable onUpdate={(group, value) => handleUpdate(bank._id, group, value)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
