'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ROLES = [
  { value: 'donor', label: '🩸 Donor', desc: 'Donate blood and respond to emergencies' },
  { value: 'requester', label: '🚨 Requester', desc: 'Request blood for patients' },
  { value: 'hospital', label: '🏥 Hospital', desc: 'Manage blood bank inventory' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', bloodGroup: 'O+', role: 'donor' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register({
        ...form,
        location: { type: 'Point', coordinates: [73.8567, 18.5204] }, // Default: Pune
      });
      toast.success(`Welcome, ${user.name}!`);
      const routes = { donor: '/donor/dashboard', hospital: '/hospital/dashboard', requester: '/emergency/new' };
      router.push(routes[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-3xl shadow-lg shadow-red-500/25">🩸</div>
          <h1 className="text-3xl font-bold text-white">Join PulseLink</h1>
          <p className="text-gray-400 mt-2">Create your account and start saving lives</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">I am a</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                  className={`p-3 rounded-xl text-center transition-all text-sm ${form.role === r.value ? 'bg-red-500/20 border-red-500/50 text-red-400 border' : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                  <div className="text-lg mb-1">{r.label.split(' ')[0]}</div>
                  <div className="text-xs">{r.value}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              placeholder="John Doe" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              placeholder="you@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              placeholder="Min 6 characters" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Blood Group</label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((g) => (
                <button key={g} type="button" onClick={() => setForm({ ...form, bloodGroup: g })}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${form.bloodGroup === g ? 'bg-red-500 text-white' : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-gray-400 text-sm">
            Already have an account? <Link href="/login" className="text-red-400 hover:text-red-300">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
