import React, { useEffect, useMemo } from 'react';
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DiseaseReport, HostType, OutbreakCluster, ReportStatus } from '../types';

interface SurveillanceMapProps {
  reports: DiseaseReport[];
  outbreaks: OutbreakCluster[];
  heightClass?: string;
  /** Officer mode: pins can be selected, rejected reports stay visible and popups name the farmer. */
  onSelectReport?: (id: string) => void;
  selectedReportId?: string | null;
  officer?: boolean;
}

const HOST_LABELS: Record<HostType, string> = {
  CATTLE: 'Cattle',
  SHEEP_GOAT: 'Sheep & goats',
  SWINE: 'Swine',
  POULTRY: 'Poultry',
  MAIZE: 'Maize',
  CASSAVA: 'Cassava',
  WHEAT_GRAIN: 'Wheat & grain',
};

const STATUS_META: Record<ReportStatus, { label: string; color: string }> = {
  SUSPECT: { label: 'Suspect', color: '#f59e0b' },
  VERIFIED: { label: 'Verified', color: '#0ea5e9' },
  CONTAINMENT_DEPLOYED: { label: 'Containment', color: '#6366f1' },
  RESOLVED: { label: 'Resolved', color: '#10b981' },
  REJECTED: { label: 'Rejected', color: '#a8a29e' },
};

// Default view: Kenya, used when there is nothing to fit
const DEFAULT_CENTER: [number, number] = [-0.5, 36.8];

const FitToData: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 9);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
};

export const SurveillanceMap: React.FC<SurveillanceMapProps> = ({
  reports,
  outbreaks,
  heightClass = 'h-[420px]',
  onSelectReport,
  selectedReportId,
  officer = false,
}) => {
  const visibleReports = useMemo(
    () => (officer ? reports : reports.filter((r) => r.status !== 'REJECTED')),
    [reports, officer]
  );

  const points = useMemo<[number, number][]>(
    () => [
      ...visibleReports.map((r) => [r.location.latitude, r.location.longitude] as [number, number]),
      ...outbreaks.map((o) => [o.center.latitude, o.center.longitude] as [number, number]),
    ],
    [visibleReports, outbreaks]
  );

  return (
    <div className="relative border border-stone-200 rounded-lg overflow-hidden">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={6}
        scrollWheelZoom={false}
        className={`w-full ${heightClass} z-0`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToData points={points} />

        {/* Quarantine buffer zones */}
        {outbreaks.map((o) => (
          <Circle
            key={o.id}
            center={[o.center.latitude, o.center.longitude]}
            radius={o.radiusKm * 1000}
            pathOptions={{ color: '#dc2626', weight: 2, dashArray: '6 4', fillColor: '#dc2626', fillOpacity: 0.1 }}
          >
            <Popup>
              <div className="text-xs space-y-0.5">
                <strong className="block text-sm">{o.diseaseName}</strong>
                <span className="block">{o.center.district} · {o.severity} alert</span>
                <span className="block">{o.radiusKm} km quarantine buffer</span>
                <span className="block">{o.totalAffected} cases, {o.totalMortality} deaths</span>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Individual reports (no farmer names or contacts are shown to the public) */}
        {visibleReports.map((r) => {
          const meta = STATUS_META[r.status];
          const selected = r.id === selectedReportId;
          return (
            <CircleMarker
              key={r.id}
              center={[r.location.latitude, r.location.longitude]}
              radius={selected ? 11 : 8}
              pathOptions={{
                color: selected ? '#0c0a09' : '#ffffff',
                weight: selected ? 3 : 2,
                fillColor: meta.color,
                fillOpacity: 0.95,
              }}
              eventHandlers={onSelectReport ? { click: () => onSelectReport(r.id) } : undefined}
            >
              <Popup>
                <div className="text-xs space-y-0.5">
                  <strong className="block text-sm">{HOST_LABELS[r.hostType]}</strong>
                  {officer && <span className="block text-stone-500">{r.farmerName} · {r.id}</span>}
                  <span className="block">{r.location.village}, {r.location.district}</span>
                  <span className="block">{r.affectedCount} affected of {r.totalAnimalsOrAcres}</span>
                  <span className="block font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[500] bg-white/95 border border-stone-200 rounded-md px-3 py-2 text-[11px] text-stone-700 shadow-xs space-y-1">
        {((officer
          ? ['SUSPECT', 'VERIFIED', 'CONTAINMENT_DEPLOYED', 'RESOLVED', 'REJECTED']
          : ['SUSPECT', 'VERIFIED', 'CONTAINMENT_DEPLOYED', 'RESOLVED']) as ReportStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_META[s].color }} />
            {STATUS_META[s].label}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-red-600" />
          Quarantine zone
        </div>
      </div>
    </div>
  );
};
