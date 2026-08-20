import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shift } from '@workspace/api-client-react';
import { formatRemuneration } from './shift-card';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createRemunerationIcon(remuneration: number) {
  const label = formatRemuneration(remuneration);
  return L.divIcon({
    className: '',
    html: `<div style="
      background: hsl(220, 87.2%, 51%);
      color: white;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      font-family: Inter, sans-serif;
    ">${label}</div>`,
    iconAnchor: [30, 14],
    popupAnchor: [0, -18],
  });
}

function SetViewOnCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface ShiftMapProps {
  shifts: Shift[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

const BRAZIL_CENTER: [number, number] = [-14.235, -51.9253];

export function ShiftMap({ shifts, center, zoom = 5, className }: ShiftMapProps) {
  const shiftsWithCoords = shifts.filter(
    (s) => s.latitude != null && s.longitude != null
  );

  const mapCenter: [number, number] =
    center ??
    (shiftsWithCoords.length > 0
      ? [shiftsWithCoords[0].latitude!, shiftsWithCoords[0].longitude!]
      : BRAZIL_CENTER);

  const mapZoom = center ? zoom : shiftsWithCoords.length > 0 ? 8 : 4;

  return (
    <div className={className} style={{ height: '100%', minHeight: '400px' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        scrollWheelZoom={true}
      >
        <SetViewOnCenter center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shiftsWithCoords.map((shift) => (
          <Marker
            key={shift.id}
            position={[shift.latitude!, shift.longitude!]}
            icon={createRemunerationIcon(shift.remuneration)}
          >
            <Popup>
              <div className="min-w-40">
                <p className="font-semibold text-sm">{shift.hospitalName}</p>
                <p className="text-xs text-gray-500">{shift.specialty}</p>
                <p className="text-sm font-bold text-blue-600 mt-1">
                  {formatRemuneration(shift.remuneration)}
                </p>
                <p className="text-xs text-gray-500">
                  {shift.city}, {shift.state}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        {shiftsWithCoords.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              background: 'rgba(255,255,255,0.9)',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#666',
            }}
          >
            Nenhum plantão com localização disponível
          </div>
        )}
      </MapContainer>
    </div>
  );
}
