'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// A pure-CSS/emoji pin avoids Leaflet's classic broken default-marker-image
// problem under bundlers (no external icon asset needed) — same trick the
// dashboard's own branches map uses.
const pinIcon = L.divIcon({
  className: '',
  html: '<div style="font-size:28px;line-height:28px">📍</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -26],
});

interface SingleBranchMapProps {
  readonly shopName: string;
  readonly branchName: string;
  readonly address: string;
  readonly city: string;
  readonly latitude: number;
  readonly longitude: number;
}

export default function SingleBranchMap({ shopName, branchName, address, city, latitude, longitude }: Readonly<SingleBranchMapProps>) {
  const pos: [number, number] = [latitude, longitude];

  return (
    <div className="rounded-2xl overflow-hidden border border-[#EBE6E0]" style={{ height: 360 }}>
      <MapContainer center={pos} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={pos} icon={pinIcon}>
          <Popup>
            <strong>{shopName} — {branchName}</strong>
            <br />
            {address}, {city}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
