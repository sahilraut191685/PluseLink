'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, CartesianGrid, Legend,
} from 'recharts';

const BG_COLORS = {
  'A+': '#ef4444', 'A-': '#f87171', 'B+': '#3b82f6', 'B-': '#60a5fa',
  'AB+': '#a855f7', 'AB-': '#c084fc', 'O+': '#22c55e', 'O-': '#4ade80',
};
const URG_COLORS = { critical: '#ef4444', urgent: '#f59e0b', standard: '#3b82f6' };
const TT = { contentStyle: { background: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f9fafb', fontSize: '13px' } };

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get('/analytics').then(({ data: r }) => { if (r.success) setData(r.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Failed to load analytics</div>;

  const { overview: o, bloodGroupDemand, urgencyBreakdown, timeline, avgResponseByUrgency, supplyByGroup, topDonors, statusBreakdown } = data;
  const supplyDemand = bloodGroupDemand.map((d) => ({ bloodGroup: d.bloodGroup, demand: d.units, supply: supplyByGroup.find((s) => s.bloodGroup === d.bloodGroup)?.units || 0 }));

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-lg">📊</span>
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Real-time platform insights and performance metrics</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Donors', value: o.totalDonors, sub: `${o.activeDonors} active`, icon: '👥', color: 'from-blue-500 to-blue-700' },
            { label: 'Total Requests', value: o.totalRequests, sub: `${o.activeRequests} active`, icon: '🚨', color: 'from-red-500 to-red-700' },
            { label: 'Fulfillment Rate', value: `${o.fulfillmentRate}%`, sub: `${o.fulfilledRequests} fulfilled`, icon: '✅', color: 'from-green-500 to-green-700' },
            { label: 'Blood Banks', value: o.bankCount, sub: 'registered', icon: '🏥', color: 'from-purple-500 to-purple-700' },
          ].map((c) => (
            <div key={c.label} className="glass-card rounded-2xl p-5 hover:border-red-500/20 transition-all group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform`}>{c.icon}</div>
              <div className="text-3xl font-bold text-white mb-1">{c.value}</div>
              <div className="text-sm text-gray-400">{c.label}</div>
              <div className="text-xs text-gray-500 mt-1">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[['overview','📊 Overview'],['blood','🩸 Blood Groups'],['performance','⚡ Performance'],['donors','🏆 Top Donors']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === id ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">📈 Requests Over Time (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                  <XAxis dataKey="label" stroke="#6b7280" fontSize={11} tickLine={false}/>
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} allowDecimals={false}/>
                  <Tooltip {...TT}/><Legend wrapperStyle={{color:'#9ca3af',fontSize:'12px'}}/>
                  <Area type="monotone" dataKey="requests" stroke="#ef4444" fill="url(#gR)" strokeWidth={2} name="Requests"/>
                  <Area type="monotone" dataKey="fulfilled" stroke="#22c55e" fill="url(#gF)" strokeWidth={2} name="Fulfilled"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Request Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={statusBreakdown.filter(s=>s.count>0)} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} strokeWidth={0}>
                  {statusBreakdown.filter(s=>s.count>0).map(e=>(<Cell key={e.status} fill={e.color}/>))}
                </Pie><Tooltip {...TT}/><Legend wrapperStyle={{color:'#9ca3af',fontSize:'12px'}}/></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">⚡ Urgency Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={urgencyBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                  <XAxis type="number" stroke="#6b7280" fontSize={11} allowDecimals={false}/>
                  <YAxis dataKey="urgency" type="category" stroke="#6b7280" fontSize={12} width={80} tickFormatter={v=>v.charAt(0).toUpperCase()+v.slice(1)}/>
                  <Tooltip {...TT}/>
                  <Bar dataKey="count" radius={[0,8,8,0]} name="Requests">{urgencyBreakdown.map(e=>(<Cell key={e.urgency} fill={URG_COLORS[e.urgency]}/>))}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'blood' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">🩸 Blood Group Demand</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bloodGroupDemand}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                  <XAxis dataKey="bloodGroup" stroke="#6b7280" fontSize={12}/>
                  <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false}/>
                  <Tooltip {...TT}/>
                  <Bar dataKey="requests" radius={[8,8,0,0]} name="Requests">{bloodGroupDemand.map(e=>(<Cell key={e.bloodGroup} fill={BG_COLORS[e.bloodGroup]}/>))}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">⚖️ Supply vs Demand</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={supplyDemand}>
                  <PolarGrid stroke="#374151"/><PolarAngleAxis dataKey="bloodGroup" stroke="#9ca3af" fontSize={12}/><PolarRadiusAxis stroke="#4b5563" fontSize={10}/>
                  <Radar name="Supply" dataKey="supply" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2}/>
                  <Radar name="Demand" dataKey="demand" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2}/>
                  <Legend wrapperStyle={{color:'#9ca3af',fontSize:'12px'}}/><Tooltip {...TT}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card rounded-2xl p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">🏥 Blood Bank Supply Levels</h3>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {supplyByGroup.map((item) => {
                  const max = Math.max(...supplyByGroup.map(s=>s.units),1);
                  const pct = Math.round((item.units/max)*100);
                  return (
                    <div key={item.bloodGroup} className="text-center">
                      <div className="relative h-32 bg-gray-800 rounded-xl overflow-hidden mb-2">
                        <div className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-1000" style={{height:`${Math.max(pct,5)}%`,background:BG_COLORS[item.bloodGroup],opacity:0.7}}/>
                        <div className="absolute inset-0 flex items-center justify-center"><span className="text-white font-bold text-lg drop-shadow-lg">{item.units}</span></div>
                      </div>
                      <span className="text-sm font-semibold" style={{color:BG_COLORS[item.bloodGroup]}}>{item.bloodGroup}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'performance' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">⏱️ Avg Response Time by Urgency</h3>
              <div className="grid grid-cols-3 gap-4">
                {avgResponseByUrgency.map(item=>(
                  <div key={item.urgency} className="glass-card rounded-xl p-5 text-center">
                    <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold" style={{background:`${URG_COLORS[item.urgency]}20`,color:URG_COLORS[item.urgency],border:`2px solid ${URG_COLORS[item.urgency]}40`}}>{item.avgMinutes||'–'}</div>
                    <div className="text-xs text-gray-400 mb-1">minutes avg</div>
                    <div className="text-sm font-semibold capitalize" style={{color:URG_COLORS[item.urgency]}}>{item.urgency}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.responses} responses</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">✅ Fulfillment</h3>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Rate</span><span className="text-green-400 font-bold">{o.fulfillmentRate}%</span></div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-4"><div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" style={{width:`${o.fulfillmentRate}%`}}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-green-400">{o.fulfilledRequests}</div><div className="text-xs text-gray-400">Fulfilled</div></div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-red-400">{o.cancelledRequests}</div><div className="text-xs text-gray-400">Cancelled</div></div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">👥 Donor Pool</h3>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Active Rate</span><span className="text-blue-400 font-bold">{o.totalDonors>0?Math.round((o.activeDonors/o.totalDonors)*100):0}%</span></div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-4"><div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{width:`${o.totalDonors>0?(o.activeDonors/o.totalDonors)*100:0}%`}}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-blue-400">{o.activeDonors}</div><div className="text-xs text-gray-400">Available</div></div>
                <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-gray-400">{o.totalDonors-o.activeDonors}</div><div className="text-xs text-gray-400">Unavailable</div></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'donors' && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">🏆 Top Donors</h3>
            {topDonors.length===0 ? (
              <div className="text-center py-12 text-gray-400"><p className="text-4xl mb-3">🩸</p><p>No donor data yet</p></div>
            ) : (
              <div className="space-y-3">
                {topDonors.map((d,i)=>(
                  <div key={d._id} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${i===0?'bg-yellow-500/20 text-yellow-400':i===1?'bg-gray-400/20 text-gray-300':i===2?'bg-orange-500/20 text-orange-400':'bg-gray-700 text-gray-400'}`}>{i<3?['🥇','🥈','🥉'][i]:i+1}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><span className="text-white font-semibold">{d.name}</span>{d.verifiedDonor&&<span className="text-green-400 text-xs">✓ Verified</span>}</div>
                      <div className="text-sm text-gray-400">{d.accepted} of {d.total} • <span style={{color:BG_COLORS[d.bloodGroup]}}>{d.bloodGroup}</span></div>
                    </div>
                    <div className="text-right"><div className="text-lg font-bold text-green-400">{d.total>0?Math.round((d.accepted/d.total)*100):0}%</div><div className="text-xs text-gray-500">rate</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
