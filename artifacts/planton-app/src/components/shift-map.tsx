import { useEffect, useMemo, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shift } from '@workspace/api-client-react';
import { Button } from '@workspace/planton-ds/components/ui/button';
import { Badge } from '@workspace/planton-ds/components/ui/badge';
import { formatDate, formatRemuneration } from './shift-card';
import { Calendar, Clock3, Crosshair, Maximize2, MapPin } from 'lucide-react';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createRemunerationIcon(remuneration: number, isSelected = false) {
  const label = formatRemuneration(remuneration);
  return L.divIcon({
    className: '',
    html: `<div style="
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      border: 2px solid hsl(var(--background));
      box-shadow: ${isSelected
        ? '0 0 0 5px hsl(var(--primary) / 0.2), 0 3px 10px hsl(var(--foreground) / 0.28)'
        : '0 2px 8px hsl(var(--foreground) / 0.22)'};
      font-family: Inter, sans-serif;
      transform: translate(-50%, -50%) ${isSelected ? 'scale(1.08)' : ''};
    ">${label}</div>`,
    iconAnchor: [0, 0],
    popupAnchor: [0, -18],
  });
}

function MapViewport({
  center,
  zoom,
  positions,
  selectedPosition,
  userPosition,
}: {
  center?: [number, number];
  zoom: number;
  positions: [number, number][];
  selectedPosition?: [number, number];
  userPosition?: [number, number];
}) {
  const map = useMap();
  const positionsKey = positions.map(([lat, lng]) => `${lat},${lng}`).join('|');
  const centerKey = center?.join(',') ?? '';
  const selectedPositionKey = selectedPosition?.join(',') ?? '';
  const userPositionKey = userPosition?.join(',') ?? '';

  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
      return;
    }

    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), {
        padding: [42, 42],
        maxZoom: 12,
        animate: true,
      });
    } else if (positions.length === 1) {
      map.setView(positions[0], Math.min(zoom, 12), { animate: true });
    } else {
      map.setView(BRAZIL_CENTER, 4);
    }
  }, [centerKey, map, positionsKey, zoom]);

  useEffect(() => {
    if (selectedPosition) {
      map.flyTo(selectedPosition, Math.max(map.getZoom(), 13), {
        animate: true,
        duration: 0.45,
      });
    }
  }, [map, selectedPositionKey]);

  useEffect(() => {
    if (userPosition) {
      map.flyTo(userPosition, 13, {
        animate: true,
        duration: 0.45,
      });
    }
  }, [map, userPositionKey]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => window.cancelAnimationFrame(frame);
  });

  return null;
}

function MapActions({
  positions,
  locating,
  onLocate,
}: {
  positions: [number, number][];
  locating: boolean;
  onLocate: () => void;
}) {
  const map = useMap();

  const fitBounds = () => {
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), {
        padding: [42, 42],
        maxZoom: 12,
        animate: true,
      });
    } else if (positions.length === 1) {
      map.setView(positions[0], 12, { animate: true });
    } else {
      map.setView(BRAZIL_CENTER, 4, { animate: true });
    }
  };

  return (
    <div
      className="absolute right-3 top-3 z-[1000] flex flex-col gap-2"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="gap-1.5 bg-card/95 shadow-md backdrop-blur-sm"
        onClick={fitBounds}
        disabled={positions.length === 0}
        aria-label="Enquadrar todos os plantões"
      >
        <Maximize2 className="h-3.5 w-3.5" />
        Enquadrar
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="gap-1.5 bg-card/95 shadow-md backdrop-blur-sm"
        onClick={onLocate}
        disabled={locating}
        aria-label="Mostrar minha localização"
      >
        <Crosshair className="h-3.5 w-3.5" />
        {locating ? 'Localizando...' : 'Minha localização'}
      </Button>
    </div>
  );
}

interface ShiftMapProps {
  shifts: Shift[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  selectedShiftId?: number;
  onSelectShift?: (shiftId: number) => void;
}

const BRAZIL_CENTER: [number, number] = [-14.235, -51.9253];

export function ShiftMap({
  shifts,
  center,
  zoom = 5,
  className,
  selectedShiftId,
  onSelectShift,
}: ShiftMapProps) {
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>();
  const [locationError, setLocationError] = useState<string>();
  const shiftsWithCoords = shifts.filter(
    (s) => s.latitude != null && s.longitude != null
  );
  const positions = useMemo(
    () =>
      shiftsWithCoords.map(
        (shift) => [shift.latitude!, shift.longitude!] as [number, number]
      ),
    [shiftsWithCoords]
  );
  const selectedShift = shiftsWithCoords.find((shift) => shift.id === selectedShiftId);
  const selectedPosition = selectedShift
    ? ([selectedShift.latitude!, selectedShift.longitude!] as [number, number])
    : undefined;

  const mapCenter: [number, number] =
    center ??
    (positions[0] ?? BRAZIL_CENTER);

  const mapZoom = center ? zoom : positions.length > 0 ? 8 : 4;

  const locateUser = () => {
    if (!navigator.geolocation) {
      setLocationError('Seu navegador não oferece geolocalização.');
      return;
    }

    setLocating(true);
    setLocationError(undefined);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation([coords.latitude, coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocationError('Permita o acesso à localização para usar este recurso.');
        setLocating(false);
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 8_000 }
    );
  };

  return (
    <div
      className={`${className ?? ''} relative overflow-hidden`}
      style={{ height: '100%', minHeight: '400px' }}
    >
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapViewport
          center={center}
          zoom={mapZoom}
          positions={positions}
          selectedPosition={selectedPosition}
          userPosition={userLocation}
        />
        <MapActions positions={positions} locating={locating} onLocate={locateUser} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shiftsWithCoords.map((shift) => (
          <Marker
            key={shift.id}
            position={[shift.latitude!, shift.longitude!]}
            icon={createRemunerationIcon(
              shift.remuneration,
              shift.id === selectedShiftId
            )}
            eventHandlers={{ click: () => onSelectShift?.(shift.id) }}
          >
            <Popup>
              <div className="min-w-[210px] space-y-2 p-0.5">
                <div>
                  <p className="text-sm font-semibold text-foreground">{shift.hospitalName}</p>
                  <p className="text-xs text-muted-foreground">{shift.specialty}</p>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(shift.date)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {shift.startTime} – {shift.endTime}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {shift.city}, {shift.state}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                  <span className="text-base font-bold text-primary">
                    {formatRemuneration(shift.remuneration)}
                  </span>
                  <a
                    href={`/shifts/${shift.id}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Ver detalhes
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {userLocation && (
          <CircleMarker
            center={userLocation}
            radius={8}
            pathOptions={{
              color: 'hsl(var(--primary))',
              fillColor: 'hsl(var(--primary))',
              fillOpacity: 0.85,
              weight: 3,
            }}
          >
            <Popup>Você está aqui</Popup>
          </CircleMarker>
        )}
      </MapContainer>
      <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex flex-wrap gap-2">
        <Badge variant="secondary" className="bg-card/95 shadow-sm backdrop-blur-sm">
          {shiftsWithCoords.length} no mapa
        </Badge>
        {shifts.length !== shiftsWithCoords.length && (
          <Badge variant="outline" className="bg-card/95 shadow-sm backdrop-blur-sm">
            {shifts.length - shiftsWithCoords.length} sem localização
          </Badge>
        )}
      </div>
      {locationError && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] rounded-lg border border-destructive/20 bg-card/95 px-3 py-2 text-xs text-destructive shadow-md backdrop-blur-sm">
          {locationError}
        </div>
      )}
      {shiftsWithCoords.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[900] flex items-center justify-center px-4">
          <div className="rounded-lg border border-border bg-card/95 px-4 py-3 text-center text-sm text-muted-foreground shadow-md backdrop-blur-sm">
            Nenhum plantão com localização disponível
          </div>
        </div>
      )}
    </div>
  );
}
