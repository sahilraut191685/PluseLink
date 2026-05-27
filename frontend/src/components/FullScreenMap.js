'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import L from 'leaflet';

// Pulsing emergency icon
function createEmergencyIcon(urgency) {
  const color = urgency === 'critical' ? '#ef4444' : urgency === 'urgent' ? '#f59e0b' : '#3b82f6';
  return new L.DivIcon({
    html: `<div style="position:relative">
      <div style="position:absolute;top:-12px;left:-12px;width:24px;height:24px;background:${color};border-radius:50%;opacity:0.3;animation:map-ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
      <div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;border:3px solid white;box-shadow:0 2px 12px ${color}80;position:relative;z-index:2">🚨</div>
    </div>`,
    className: '', iconSize: [28, 28], iconAnchor: [14, 14],
  });
}

const donorIcon = new L.DivIcon({
  html: '<div style="background:linear-gradient(135deg,#22c55e,#16a34a);width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;border:2px solid white;box-shadow:0 2px 8px rgba(34,197,94,0.4)">🩸</div>',
  className: '', iconSize: [26, 26], iconAnchor: [13, 13],
});

const bankIcon = new L.DivIcon({
  html: '<div style="background:linear-gradient(135deg,#3b82f6,#2563eb);width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:15px;border:2px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.4)">🏥</div>',
  className: '', iconSize: [30, 30], iconAnchor: [15, 15],
});

// Component to fly to location
function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, map.getZoom()); }, [center, map]);
  return null;
}

export default function FullScreenMap({ center = [18.5204, 73.8567], emergencies = [], donors = [], banks = [], onSelect }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <div className="h-full w-full bg-gray-800 animate-pulse" />;

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo center={center} />

      {/* Emergency markers */}
      {emergencies.map((e) => {
        const pos = [e.location?.coordinates?.[1], e.location?.coordinates?.[0]];
        if (!pos[0] || !pos[1]) return null;
        return (
          <Marker key={`e-${e._id}`} position={pos} icon={createEmergencyIcon(e.urgency)}
            eventHandlers={{ click: () => onSelect?.({ type: 'emergency', data: e }) }}>
            <Popup>
              <div style={{ color: '#111', minWidth: '180px' }}>
                <strong>🚨 {e.hospital}</strong><br />
                <span style={{ color: '#666' }}>{e.bloodGroup} • {e.unitsNeeded} unit(s)</span><br />
                <span style={{ color: e.urgency === 'critical' ? '#dc2626' : '#d97706', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{e.urgency}</span>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Donor markers */}
      {donors.map((d) => {
        const pos = [d.location?.coordinates?.[1], d.location?.coordinates?.[0]];
        if (!pos[0] || !pos[1]) return null;
        return (
          <Marker key={`d-${d._id}`} position={pos} icon={donorIcon}
            eventHandlers={{ click: () => onSelect?.({ type: 'donor', data: d }) }}>
            <Popup>
              <div style={{ color: '#111' }}>
                <strong>🩸 {d.name}</strong><br />
                <span style={{ color: '#666' }}>{d.bloodGroup} • {d.distanceKm}km away</span>
                {d.verifiedDonor && <><br /><span style={{ color: '#16a34a', fontSize: '11px' }}>✓ Verified</span></>}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Blood bank markers */}
      {banks.map((b) => {
        const pos = [b.location?.coordinates?.[1], b.location?.coordinates?.[0]];
        if (!pos[0] || !pos[1]) return null;
        return (
          <Marker key={`b-${b._id}`} position={pos} icon={bankIcon}
            eventHandlers={{ click: () => onSelect?.({ type: 'bank', data: b }) }}>
            <Popup>
              <div style={{ color: '#111' }}>
                <strong>🏥 {b.name}</strong><br />
                <span style={{ color: '#666' }}>{b.totalUnits} units • {b.distanceKm}km</span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
