'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import L from 'leaflet';

// Custom marker icons
const donorIcon = new L.DivIcon({
  html: '<div style="background:linear-gradient(135deg,#22c55e,#16a34a);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🩸</div>',
  className: '', iconSize: [32, 32], iconAnchor: [16, 16],
});
const hospitalIcon = new L.DivIcon({
  html: '<div style="background:linear-gradient(135deg,#3b82f6,#2563eb);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏥</div>',
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
});
const bankIcon = new L.DivIcon({
  html: '<div style="background:linear-gradient(135deg,#ef4444,#dc2626);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏦</div>',
  className: '', iconSize: [32, 32], iconAnchor: [16, 16],
});

export default function LiveMap({ center = [18.5204, 73.8567], zoom = 13, donors = [], hospitals = [], banks = [], radius = null, className = '' }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return <div className={`bg-gray-800 rounded-xl animate-pulse ${className}`} />;

  return (
    <MapContainer center={center} zoom={zoom} className={`rounded-xl ${className}`} style={{ height: '100%', width: '100%', minHeight: '400px' }}>
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {radius && <Circle center={center} radius={radius * 1000} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 1 }} />}
      {donors.map((d, i) => (
        <Marker key={`d-${d._id || i}`} position={[d.location?.coordinates?.[1] || d.lat, d.location?.coordinates?.[0] || d.lng]} icon={donorIcon}>
          <Popup><strong>{d.name}</strong><br />{d.bloodGroup} • {d.distance ? `${d.distance}km` : ''}</Popup>
        </Marker>
      ))}
      {hospitals.map((h, i) => (
        <Marker key={`h-${i}`} position={[h.lat || h.coordinates?.[1], h.lng || h.coordinates?.[0]]} icon={hospitalIcon}>
          <Popup><strong>{h.name}</strong></Popup>
        </Marker>
      ))}
      {banks.map((b, i) => (
        <Marker key={`b-${b._id || i}`} position={[b.location?.coordinates?.[1] || b.lat, b.location?.coordinates?.[0] || b.lng]} icon={bankIcon}>
          <Popup><strong>{b.name}</strong><br />{b.address}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
