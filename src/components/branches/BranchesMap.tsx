'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShopBranch } from './branchHelpers';

// A pure-CSS/emoji pin avoids Leaflet's classic broken default-marker-image
// problem under bundlers (no external icon asset needed).
const pinIcon = L.divIcon({
  className: '',
  html: '<div style="font-size:24px;line-height:24px">📍</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -22],
});

function FitBounds({ points }: { readonly points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

export default function BranchesMap({ branches }: { readonly branches: ShopBranch[] }) {
  const pinned = branches
    .filter(b => b.latitude && b.longitude && !Number.isNaN(Number(b.latitude)) && !Number.isNaN(Number(b.longitude)))
    .map(b => ({ branch: b, pos: [Number(b.latitude), Number(b.longitude)] as [number, number] }));

  if (pinned.length === 0) {
    return (
      <div className="bg-white border border-[#EBE6E0] rounded-2xl p-10 text-center text-sm text-[#827A73]">
        No branches have map coordinates yet. Add a Latitude/Longitude to a branch to pin it here.
      </div>
    );
  }

  const points = pinned.map(p => p.pos);

  return (
    <div className="rounded-2xl overflow-hidden border border-[#EBE6E0]" style={{ height: 420 }}>
      <MapContainer center={points[0]} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitBounds points={points} />
        {pinned.map(({ branch, pos }) => (
          <Marker key={branch.id} position={pos} icon={pinIcon}>
            <Popup>
              <strong>{branch.name}</strong>
              <br />
              {branch.address}, {branch.city}
              {branch.landmark ? (
                <>
                  <br />
                  <em>Landmark: {branch.landmark}</em>
                </>
              ) : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
