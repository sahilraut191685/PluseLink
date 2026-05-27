'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function NewEmergencyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patientName: '', bloodGroup: 'O-', unitsNeeded: 2, hospital: '',
    urgency: 'critical', broadcastRadius: 10, contactNumber: '',
    location: { type: 'Point', coordinates: [73.8567, 18.5204] },
  });

  async function handleSubmit() {
    setLoading(true);
    try {
      const { data } = await api.post('/emergency', form);
      if (data.success) {
        toast.success(`Emergency created! ${data.data.matchedDonors.length} donors matched.`);
        router.push(`/request/track/${data.data.request._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create emergency');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🚨 Emergency Blood Request</h1>
          <p className="text-gray-400">Fill in the details to find compatible donors near you</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-500'}`}>{s}</div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-red-500' : 'bg-gray-800'}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-8">
          {/* Step 1: Patient Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white mb-4">Patient Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Patient Name</label>
                <input type="text" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Blood Group Needed</label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((g) => (
                    <button key={g} type="button" onClick={() => setForm({ ...form, bloodGroup: g })}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${form.bloodGroup === g ? 'bg-red-500 text-white scale-105' : 'bg-gray-800/50 text-gray-400 border border-gray-700'}`}>
                      🩸 {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Units Needed</label>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setForm({ ...form, unitsNeeded: Math.max(1, form.unitsNeeded - 1) })}
                    className="w-12 h-12 bg-gray-800 rounded-xl text-white text-xl hover:bg-gray-700">−</button>
                  <span className="text-3xl font-bold text-white w-12 text-center">{form.unitsNeeded}</span>
                  <button type="button" onClick={() => setForm({ ...form, unitsNeeded: Math.min(20, form.unitsNeeded + 1) })}
                    className="w-12 h-12 bg-gray-800 rounded-xl text-white text-xl hover:bg-gray-700">+</button>
                </div>
              </div>
              <button onClick={() => step < 3 && setStep(2)} disabled={!form.patientName}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-xl disabled:opacity-50">
                Next →
              </button>
            </div>
          )}

          {/* Step 2: Hospital & Location */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white mb-4">Hospital & Location</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hospital Name</label>
                <input type="text" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="e.g. Sahyadri Hospital, Pune" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Number (optional)</label>
                <input type="tel" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location (click to select)</label>
                <div className="h-64 rounded-xl overflow-hidden">
                  <LiveMap center={[form.location.coordinates[1], form.location.coordinates[0]]} zoom={14}
                    hospitals={[{ name: form.hospital || 'Hospital', lat: form.location.coordinates[1], lng: form.location.coordinates[0] }]} />
                </div>
                <p className="text-xs text-gray-500 mt-1">📍 Default: Pune center. Location is used for donor matching.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl">← Back</button>
                <button onClick={() => setStep(3)} disabled={!form.hospital}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-xl disabled:opacity-50">Next →</button>
              </div>
            </div>
          )}

          {/* Step 3: Urgency & Submit */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white mb-4">Urgency Level</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'critical', label: '🔴 Critical', desc: 'Life-threatening, < 1 hour' },
                  { value: 'urgent', label: '🟡 Urgent', desc: 'Needed within hours' },
                  { value: 'standard', label: '🟢 Standard', desc: 'Scheduled transfusion' },
                ].map((u) => (
                  <button key={u.value} type="button" onClick={() => setForm({ ...form, urgency: u.value })}
                    className={`p-4 rounded-xl text-center transition-all ${form.urgency === u.value
                      ? 'bg-red-500/20 border-red-500/50 text-white border-2'
                      : 'bg-gray-800/50 border border-gray-700 text-gray-400'}`}>
                    <div className="text-lg mb-1">{u.label}</div>
                    <div className="text-xs">{u.desc}</div>
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">📋 Request Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Patient</span><span className="text-white">{form.patientName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Blood Group</span><span className="text-white font-bold">🩸 {form.bloodGroup}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Units</span><span className="text-white">{form.unitsNeeded}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Hospital</span><span className="text-white">{form.hospital}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Urgency</span><span className="text-white uppercase">{form.urgency}</span></div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl">← Back</button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-xl disabled:opacity-50 animate-emergency-pulse">
                  {loading ? 'Creating...' : '🚨 Submit Emergency'}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">⚠️ Based on current data. Professional medical consultation is always recommended.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
