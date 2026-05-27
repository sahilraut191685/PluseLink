'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import BloodGroupBadge from '@/components/BloodGroupBadge';
import UrgencyTag from '@/components/UrgencyTag';

export default function LandingPage() {
  const [stats, setStats] = useState({ donorCount: 0, activeEmergencies: 0, bankCount: 0, totalRequests: 0 });
  const [emergencies, setEmergencies] = useState([]);

  useEffect(() => {
    api.get('/stats').then(({ data }) => data.success && setStats(data.data)).catch(() => {});
    api.get('/emergency/active').then(({ data }) => data.success && setEmergencies(data.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-red-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Live indicator */}
            {stats.activeEmergencies > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-8 animate-emergency-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <span className="text-red-400 text-sm font-medium">{stats.activeEmergencies} active emergency{stats.activeEmergencies > 1 ? 'ies' : ''} right now</span>
              </div>
            )}

            <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-red-400 via-pink-400 to-red-600 bg-clip-text text-transparent">
                Every Second
              </span>
              <br />
              <span className="text-white">Counts in an Emergency</span>
            </h1>

            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              PulseLink intelligently connects blood donors with patients in real-time.
              Our AI matching engine finds compatible donors near you within seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/emergency/new"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl text-lg transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105">
                🚨 Request Blood Now
              </Link>
              <Link href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl text-lg border border-gray-700 transition-all hover:scale-105">
                🩸 Become a Donor
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { label: 'Registered Donors', value: stats.donorCount, icon: '👥' },
                { label: 'Active Emergencies', value: stats.activeEmergencies, icon: '🚨' },
                { label: 'Blood Banks', value: stats.bankCount, icon: '🏥' },
                { label: 'Lives Impacted', value: stats.totalRequests, icon: '❤️' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-xl p-4 text-center hover:border-red-500/30 transition-colors">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Active Emergencies Preview */}
      {emergencies.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" /> Active Emergencies
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {emergencies.map((e) => (
              <div key={e._id} className="glass-card rounded-xl p-5 hover:border-red-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <BloodGroupBadge bloodGroup={e.bloodGroup} />
                  <UrgencyTag urgency={e.urgency} />
                </div>
                <h3 className="text-white font-semibold mb-1">{e.hospital}</h3>
                <p className="text-gray-400 text-sm mb-3">{e.unitsNeeded} unit(s) needed • {e.matchedDonors?.length || 0} donors matched</p>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-red-500 to-green-500 h-1.5 rounded-full transition-all" style={{ width: `${e.fulfillmentPercentage || 0}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{e.fulfillmentPercentage || 0}% fulfilled</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-12">How PulseLink Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Request', desc: 'Submit an emergency blood request with patient details and blood type needed.', icon: '📋' },
            { step: '02', title: 'Match', desc: 'Our AI engine finds compatible donors nearby using blood type + geolocation.', icon: '🧠' },
            { step: '03', title: 'Alert', desc: 'Top donors are instantly notified via real-time alerts with distance and urgency.', icon: '📡' },
            { step: '04', title: 'Fulfill', desc: 'Donors accept and arrive at the hospital. Track everything live on the dashboard.', icon: '✅' },
          ].map((item) => (
            <div key={item.step} className="glass-card rounded-xl p-6 text-center hover:border-red-500/30 transition-all group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
              <div className="text-red-400 text-xs font-bold tracking-wider mb-2">STEP {item.step}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 py-8 text-center text-gray-500 text-sm">
        <p>© 2024 PulseLink — Emergency Blood Response Platform for India</p>
        <p className="mt-1 text-xs">⚠️ Always consult medical professionals. Blood availability is based on current data and not guaranteed.</p>
      </footer>
    </div>
  );
}
