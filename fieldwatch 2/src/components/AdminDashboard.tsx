import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ClipboardList,
  Hourglass,
  Siren,
  UserCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { DiseaseReport, HostType, OutbreakCluster, ReportStatus, User } from '../types';
import { OutbreakDetector } from '../utils/outbreakDetector';
import { RippleButton } from './RippleButton';

interface AdminDashboardProps {
  authToken: string;
  reports: DiseaseReport[];
  onOpenApprovals: () => void;
  onOpenSurveillance: () => void;
}

const DAY_MS = 24 * 3600 * 1000;

const HOST_LABELS: Record<HostType, string> = {
  CATTLE: 'Cattle',
  SHEEP_GOAT: 'Sheep & goats',
  SWINE: 'Swine',
  POULTRY: 'Poultry',
  MAIZE: 'Maize',
  CASSAVA: 'Cassava',
  WHEAT_GRAIN: 'Wheat & grain',
};

const STATUS_STYLES: Record<ReportStatus, { label: string; badge: string; bar: string }> = {
  SUSPECT: { label: 'Suspect', badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500' },
  VERIFIED: { label: 'Verified', badge: 'bg-sky-100 text-sky-800', bar: 'bg-sky-500' },
  CONTAINMENT_DEPLOYED: {
    label: 'Containment',
    badge: 'bg-indigo-100 text-indigo-800',
    bar: 'bg-indigo-500',
  },
  RESOLVED: { label: 'Resolved', badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', badge: 'bg-stone-200 text-stone-700', bar: 'bg-stone-400' },
};

const SEVERITY_BADGE: Record<string, string> = {
  LOW: 'bg-emerald-100 text-emerald-800',
  MODERATE: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

const timeAgo = (millis: number): string => {
  const hours = Math.round((Date.now() - millis) / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const Card: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  action,
  children,
}) => (
  <div className="bg-white border border-stone-200 rounded-lg shadow-xs overflow-hidden">
    <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold text-stone-900">{title}</h3>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  authToken,
  reports,
  onOpenApprovals,
  onOpenSurveillance,
}) => {
  const [farmers, setFarmers] = useState<User[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState<boolean>(true);

  const loadFarmers = () => {
    setLoadingFarmers(true);
    fetch('/api/admin/farmers', { headers: { Authorization: `Bearer ${authToken}` } })
      .then((res) => (res.ok ? res.json() : { farmers: [] }))
      .then((data) => setFarmers(data.farmers || []))
      .catch(() => setFarmers([]))
      .finally(() => setLoadingFarmers(false));
  };

  useEffect(loadFarmers, [authToken]);

  const detector = useMemo(() => new OutbreakDetector(), []);
  const outbreaks: OutbreakCluster[] = useMemo(
    () => detector.detectOutbreaks(reports),
    [detector, reports]
  );

  const pendingFarmers = farmers.filter((f) => f.status === 'pending').length;
  const awaiting = reports.filter((r) => r.status === 'SUSPECT').length;

  const dailyData = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const dayStart = start.getTime() - (13 - i) * DAY_MS;
      return {
        day: new Date(dayStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        reports: reports.filter(
          (r) => r.timestampMillis >= dayStart && r.timestampMillis < dayStart + DAY_MS
        ).length,
      };
    });
  }, [reports]);

  const hostData = useMemo(() => {
    const counts = new Map<HostType, number>();
    reports.forEach((r) => counts.set(r.hostType, (counts.get(r.hostType) || 0) + 1));
    return Array.from(counts, ([host, count]) => ({ name: HOST_LABELS[host], count })).sort(
      (a, b) => b.count - a.count
    );
  }, [reports]);

  const statusData = (Object.keys(STATUS_STYLES) as ReportStatus[]).map((status) => ({
    status,
    count: reports.filter((r) => r.status === status).length,
  }));

  const recent = [...reports].sort((a, b) => b.timestampMillis - a.timestampMillis).slice(0, 6);

  const kpis = [
    {
      label: 'Total reports',
      value: reports.length,
      icon: ClipboardList,
      tint: 'bg-indigo-50 text-indigo-700',
    },
    {
      label: 'Awaiting verification',
      value: awaiting,
      icon: Hourglass,
      tint: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Active outbreaks',
      value: outbreaks.length,
      icon: Siren,
      tint: 'bg-red-50 text-red-700',
    },
    {
      label: 'Farmers pending approval',
      value: loadingFarmers ? '…' : pendingFarmers,
      icon: UserCheck,
      tint: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <div className="space-y-6 fw-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900">Dashboard</h2>
          <p className="text-xs text-stone-500">Overview of surveillance activity in your district.</p>
        </div>
        <RippleButton
          rippleColor="dark"
          onClick={loadFarmers}
          className="bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-semibold px-3.5 py-2 inline-flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingFarmers ? 'animate-spin' : ''}`} />
          Refresh
        </RippleButton>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, tint }) => (
          <div
            key={label}
            className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs flex items-center gap-3 transition hover:shadow-md hover:-translate-y-0.5"
          >
            <span className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${tint}`}>
              <Icon className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="text-2xl font-extrabold text-stone-900 leading-none">{value}</div>
              <div className="text-[11px] font-medium text-stone-500 mt-1 truncate">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card title="Reports in the last 14 days">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fwReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#78716c' }} interval={1} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#78716c' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="url(#fwReports)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card title="Reports by status">
          <ul className="space-y-3">
            {statusData.map(({ status, count }) => {
              const pct = reports.length ? Math.round((count / reports.length) * 100) : 0;
              return (
                <li key={status}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-700">{STATUS_STYLES[status].label}</span>
                    <span className="text-stone-500">{count}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${STATUS_STYLES[status].bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Reports by species / crop">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hostData} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#78716c' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 10, fill: '#57534e' }}
                />
                <Tooltip cursor={{ fill: '#f5f5f4' }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={14} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <Card
            title="Active outbreaks"
            action={
              <RippleButton
                rippleColor="dark"
                onClick={onOpenSurveillance}
                className="text-xs font-semibold text-indigo-700 hover:bg-indigo-50 px-2.5 py-1 inline-flex items-center gap-1"
              >
                View map <ChevronRight className="w-3 h-3" />
              </RippleButton>
            }
          >
            {outbreaks.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">No active outbreaks detected.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {outbreaks.slice(0, 4).map((o) => (
                  <li key={o.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-stone-900 truncate">{o.diseaseName}</div>
                      <div className="text-[11px] text-stone-500 truncate">
                        {o.center.district} · {o.reportIds.length} reports · {o.totalAffected} affected
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                        SEVERITY_BADGE[o.severity] || SEVERITY_BADGE.LOW
                      }`}
                    >
                      {o.severity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Recent reports + farmer approvals shortcut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card title="Recent reports">
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-stone-400">
                    <th className="px-5 pb-2 font-semibold">Farmer</th>
                    <th className="pb-2 font-semibold">Species</th>
                    <th className="pb-2 font-semibold">District</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="px-5 pb-2 font-semibold text-right">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recent.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50 transition">
                      <td className="px-5 py-2.5 font-semibold text-stone-800">{r.farmerName}</td>
                      <td className="py-2.5 text-stone-600">{HOST_LABELS[r.hostType]}</td>
                      <td className="py-2.5 text-stone-600">{r.location.district}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_STYLES[r.status].badge}`}
                        >
                          {STATUS_STYLES[r.status].label}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-stone-500">{timeAgo(r.timestampMillis)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card title="Farmer approvals">
          <div className="text-center space-y-3 py-2">
            <div className="text-4xl font-extrabold text-stone-900">
              {loadingFarmers ? '…' : pendingFarmers}
            </div>
            <p className="text-xs text-stone-500">
              {pendingFarmers === 1 ? 'registration is' : 'registrations are'} waiting for your review.
            </p>
            <RippleButton
              onClick={onOpenApprovals}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 inline-flex items-center gap-1.5"
            >
              Review farmers <ChevronRight className="w-3.5 h-3.5" />
            </RippleButton>
          </div>
        </Card>
      </div>
    </div>
  );
};
