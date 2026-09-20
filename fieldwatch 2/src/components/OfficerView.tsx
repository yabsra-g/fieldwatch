import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  X,
  Radio,
  CheckCircle,
  Truck,
  FileCheck,
  Search,
  Filter,
  BarChart3,
  MapPin,
  Flame,
  Layers,
  PhoneCall,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  DiseaseReport,
  OutbreakCluster,
  ReportStatus,
  SupportedLanguage,
} from '../types';
import { OutbreakDetector, DEFAULT_DETECTOR_CONFIG } from '../utils/outbreakDetector';
import { SurveillanceMap } from './SurveillanceMap';
import { t } from '../utils/i18n';

interface OfficerViewProps {
  reports: DiseaseReport[];
  onUpdateReportStatus: (
    reportId: string,
    newStatus: ReportStatus,
    officerNotes?: string
  ) => void;
  currentLang: SupportedLanguage;
}

export const OfficerView: React.FC<OfficerViewProps> = ({
  reports,
  onUpdateReportStatus,
  currentLang,
}) => {
  const detectorConfig = DEFAULT_DETECTOR_CONFIG;

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [diseaseFilter, setDiseaseFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [officerNoteInput, setOfficerNoteInput] = useState<string>('');
  const [broadcastModalCluster, setBroadcastModalCluster] = useState<OutbreakCluster | null>(null);
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);

  // Run outbreak detection engine
  const detector = useMemo(() => new OutbreakDetector(detectorConfig), [detectorConfig]);
  const outbreaks = useMemo(() => {
    return detector.detectOutbreaks(reports, detectorConfig);
  }, [detector, reports, detectorConfig]);

  // Filtered reports list
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchDisease = diseaseFilter === 'ALL' || r.suspectDiseaseId === diseaseFilter;
      const matchSearch =
        !searchQuery ||
        r.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchDisease && matchSearch;
    });
  }, [reports, statusFilter, diseaseFilter, searchQuery]);

  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId) || null,
    [reports, selectedReportId]
  );

  // Summary statistics
  const totalReports = reports.length;
  const verifiedCount = reports.filter((r) => r.status === 'VERIFIED').length;
  const quarantinedCount = reports.filter((r) => r.status === 'CONTAINMENT_DEPLOYED').length;
  const totalMortalities = reports.reduce((sum, r) => sum + r.mortalityCount, 0);
  const totalAffected = reports.reduce((sum, r) => sum + r.affectedCount, 0);

  // Chart data: Reports by disease
  const diseaseChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      const key = (r.suspectDiseaseId || 'Other').toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [reports]);

  // Chart data: Reports by status
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const PIE_COLORS = ['#d97706', '#059669', '#dc2626', '#4b5563', '#6366f1'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Surveillance Executive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-md border border-stone-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Total Case Reports
          </p>
          <p className="text-2xl font-black text-stone-900 mt-1">{totalReports}</p>
          <span className="text-[10px] text-stone-400 font-medium">
            Across 4 pastoral districts
          </span>
        </div>

        <div className="bg-white p-4 rounded-md border border-red-200 bg-red-50/20 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>Active Outbreaks</span>
          </p>
          <p className="text-2xl font-black text-red-700 mt-1">{outbreaks.length}</p>
          <span className="text-[10px] text-red-600 font-medium">
            Spatiotemporal clusters
          </span>
        </div>

        <div className="bg-white p-4 rounded-md border border-stone-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Animals / Crops Affected
          </p>
          <p className="text-2xl font-black text-amber-700 mt-1">{totalAffected}</p>
          <span className="text-[10px] text-stone-400 font-medium">Clinical morbidity</span>
        </div>

        <div className="bg-white p-4 rounded-md border border-stone-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Total Mortalities
          </p>
          <p className="text-2xl font-black text-stone-900 mt-1">{totalMortalities}</p>
          <span className="text-[10px] text-stone-400 font-medium">Confirmed fatalities</span>
        </div>

        <div className="bg-white p-4 rounded-md border border-stone-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Quarantine Deployments
          </p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{quarantinedCount}</p>
          <span className="text-[10px] text-stone-400 font-medium">Movement standstills</span>
        </div>
      </div>

      {/* Outbreak Warning Alert Banner */}
      {outbreaks.length > 0 ? (
        <div className="bg-red-950 border-2 border-red-600 rounded-lg p-5 text-red-100 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-md text-white animate-bounce">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>{t('outbreak_alert_banner', currentLang)}</span>
                  <span className="px-2 py-0.5 text-xs bg-red-800 border border-red-500 rounded-md">
                    {outbreaks.length} Cluster Active
                  </span>
                </h3>
                <p className="text-xs text-red-300">
                  Multiple overlapping clinical reports detected within epidemiological threshold
                  parameters.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outbreaks.map((cluster) => (
              <div
                key={cluster.id}
                className="p-4 bg-red-900/60 border border-red-700/80 rounded-md space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-base">
                      {cluster.diseaseName}
                    </h4>
                    <p className="text-xs text-red-300 font-mono mt-0.5">
                      Epizootic Cluster ID: {cluster.id}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-black bg-red-600 text-white shadow-xs">
                    {cluster.severity}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs py-2 bg-red-950/70 p-2.5 rounded-lg border border-red-800">
                  <div>
                    <span className="text-red-400 block text-[10px] uppercase">
                      Radius Buffer
                    </span>
                    <span className="font-bold text-white text-sm">
                      {cluster.radiusKm} km
                    </span>
                  </div>
                  <div>
                    <span className="text-red-400 block text-[10px] uppercase">
                      Reports in Zone
                    </span>
                    <span className="font-bold text-white text-sm">
                      {cluster.reportIds.length} farms
                    </span>
                  </div>
                  <div>
                    <span className="text-red-400 block text-[10px] uppercase">
                      Total At Risk
                    </span>
                    <span className="font-bold text-white text-sm">
                      {cluster.totalAffected} sick ({cluster.totalMortality} dead)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      setBroadcastModalCluster(cluster);
                      setBroadcastSent(false);
                    }}
                    className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>{t('broadcast_alert', currentLang)}</span>
                  </button>

                  <button
                    onClick={() => {
                      // Apply containment to all reports in cluster
                      cluster.reportIds.forEach((rId) => {
                        onUpdateReportStatus(
                          rId,
                          'CONTAINMENT_DEPLOYED',
                          `Rapid response ring enacted by surveillance protocol ${cluster.id}`
                        );
                      });
                      alert(
                        `Emergency ring containment deployed across ${cluster.reportIds.length} cluster farms.`
                      );
                    }}
                    className="py-2 px-3 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Enforce Ring Quarantine</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950 border border-emerald-700 rounded-lg p-4 text-emerald-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="font-bold text-sm text-white">
                Epidemiological Status: Controlled
              </p>
              <p className="text-xs text-emerald-300/80">
                No spatiotemporal report clusters currently exceed the {detectorConfig.clusterRadiusKm}{' '}
                km / {detectorConfig.alertThresholdReports}-incident outbreak threshold.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Geospatial Surveillance Map & Cluster View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Map: same map as the farmer side, with pins that open the report */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-lg shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2.5">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-stone-900">Surveillance Map</h3>
            <span className="text-[11px] text-stone-500">Click a pin to open the report</span>
          </div>
          <SurveillanceMap
            reports={reports}
            outbreaks={outbreaks}
            heightClass="h-[420px]"
            officer
            selectedReportId={selectedReportId}
            onSelectReport={setSelectedReportId}
          />
        </div>

        {/* Report Inspection & Triage Action Card */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-lg shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Report Dossier & Triage</span>
            </h3>
            {selectedReport && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-stone-500">
                  {selectedReport.id}
                </span>
                <button
                  onClick={() => setSelectedReportId(null)}
                  className="p-1 rounded-md text-stone-500 hover:bg-stone-100 cursor-pointer"
                  aria-label="Close report"
                  title="Close report"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {selectedReport ? (
            <div className="space-y-3.5 text-xs">
              <div className="bg-stone-50 p-3 rounded-md border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-sm">
                    {selectedReport.farmerName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedReport.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedReport.status === 'CONTAINMENT_DEPLOYED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedReport.status}
                  </span>
                </div>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  {selectedReport.location.village}, {selectedReport.location.district}
                </p>
                <div className="flex items-center gap-2 mt-2 text-stone-600">
                  <PhoneCall className="w-3 h-3 text-emerald-600" />
                  <span>{selectedReport.farmContact}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <div>
                  <span className="text-stone-400 block text-[10px]">SPECIES</span>
                  <span className="font-bold text-stone-800">
                    {selectedReport.hostType}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">IMPACT</span>
                  <span className="font-bold text-stone-800">
                    {selectedReport.affectedCount} sick / {selectedReport.mortalityCount} dead
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-stone-700 block mb-1">
                  Observed Symptoms ({selectedReport.observedSymptomIds.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedReport.observedSymptomIds.map((sId) => (
                    <span
                      key={sId}
                      className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[10px] border border-stone-200"
                    >
                      {sId.replace('sym_', '').replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-stone-700 block mb-1">
                  Farmer Field Statement:
                </span>
                <p className="p-2 bg-stone-50 rounded border border-stone-200 text-stone-600 italic">
                  "{selectedReport.notes}"
                </p>
              </div>

              {selectedReport.officerNotes && (
                <div>
                  <span className="font-semibold text-emerald-800 block mb-1">
                    Officer Veterinary Log:
                  </span>
                  <p className="p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-900">
                    {selectedReport.officerNotes}
                  </p>
                </div>
              )}

              {/* Triage Actions */}
              <div className="border-t border-stone-200 pt-3 space-y-2">
                <label className="font-semibold text-stone-700 block">
                  Update Case Status:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onUpdateReportStatus(selectedReport.id, 'VERIFIED', 'Clinical symptoms confirmed by district vet');
                      setSelectedReportId(null);
                    }}
                    className="py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition text-[11px] cursor-pointer"
                  >
                    Verify Case
                  </button>

                  <button
                    onClick={() => {
                      onUpdateReportStatus(selectedReport.id, 'CONTAINMENT_DEPLOYED', 'Livestock movement standstill ordered');
                      setSelectedReportId(null);
                    }}
                    className="py-1.5 px-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition text-[11px] cursor-pointer"
                  >
                    Deploy Ring Quarantine
                  </button>

                  <button
                    onClick={() => {
                      onUpdateReportStatus(selectedReport.id, 'RESOLVED', 'Treatment complete and quarantine period elapsed');
                      setSelectedReportId(null);
                    }}
                    className="py-1.5 px-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-lg transition text-[11px] cursor-pointer"
                  >
                    Mark Resolved
                  </button>

                  <button
                    onClick={() => {
                      onUpdateReportStatus(selectedReport.id, 'REJECTED', 'Negative laboratory sample or non-infectious condition');
                      setSelectedReportId(null);
                    }}
                    className="py-1.5 px-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-lg transition text-[11px] cursor-pointer"
                  >
                    Dismiss / Reject
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <MapPin className="w-8 h-8 mx-auto opacity-40 text-stone-500" />
              <p className="text-xs">
                Click on any pin on the map or select from the case
                list below to inspect report details and execute triage actions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Case Surveillance Master Table */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-stone-900">
              District Surveillance Case Registry
            </h3>
            <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-xs font-semibold">
              {filteredReports.length} Cases
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search farmer, village, ID..."
                className="pl-8 pr-3 py-1.5 border border-stone-300 rounded-lg text-xs w-48 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-stone-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUSPECT">Suspect</option>
              <option value="VERIFIED">Verified</option>
              <option value="CONTAINMENT_DEPLOYED">Containment</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            {/* Filter Disease */}
            <select
              value={diseaseFilter}
              onChange={(e) => setDiseaseFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs bg-white text-stone-700"
            >
              <option value="ALL">All Pathogens</option>
              <option value="fmd">FMD (Foot & Mouth)</option>
              <option value="asf">ASF (Swine Fever)</option>
              <option value="newcastle">Newcastle / Avian Flu</option>
              <option value="fall_armyworm">Fall Armyworm</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider bg-stone-50/70">
                <th className="py-2.5 px-3">Report ID</th>
                <th className="py-2.5 px-3">Farmer & Location</th>
                <th className="py-2.5 px-3">Host Species</th>
                <th className="py-2.5 px-3">Suspect Disease</th>
                <th className="py-2.5 px-3">Morbidity / Mortality</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`cursor-pointer transition hover:bg-stone-50 ${
                    selectedReportId === report.id ? 'bg-emerald-50/50 font-semibold' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-mono text-stone-600">{report.id}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-stone-900">{report.farmerName}</div>
                    <div className="text-[11px] text-stone-500">
                      {report.location.village}, {report.location.district}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-stone-700">{report.hostType}</td>
                  <td className="py-3 px-3 font-medium text-stone-800">
                    {report.suspectDiseaseId ? report.suspectDiseaseId.toUpperCase() : 'UNKNOWN'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-amber-700 font-semibold">
                      {report.affectedCount} sick
                    </span>
                    {report.mortalityCount > 0 && (
                      <span className="text-red-700 font-semibold ml-1.5">
                        ({report.mortalityCount} dead)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        report.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : report.status === 'CONTAINMENT_DEPLOYED'
                          ? 'bg-red-100 text-red-800'
                          : report.status === 'RESOLVED'
                          ? 'bg-stone-100 text-stone-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReportId(report.id);
                      }}
                      className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-300 font-medium"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Epidemiological Trend Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Reports by Pathogen</span>
            </h3>
            <span className="text-xs text-stone-400">Total Cases</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diseaseChartData}>
                <XAxis dataKey="name" stroke="#78716c" fontSize={11} />
                <YAxis stroke="#78716c" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>Surveillance Case Resolution Status</span>
            </h3>
            <span className="text-xs text-stone-400">Proportions</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={(entry) => `${entry.name} (${entry.value})`}
                  labelLine={false}
                >
                  {statusChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Regional Advisory Broadcast Modal */}
      {broadcastModalCluster && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-600 animate-pulse" />
                <h3 className="font-bold text-base text-stone-900">
                  Regional Farmer SMS Alert Broadcast
                </h3>
              </div>
              <button
                onClick={() => setBroadcastModalCluster(null)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {broadcastSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900 space-y-2 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">
                  Broadcast Advisory Dispatched Successfully!
                </p>
                <p className="text-xs text-emerald-700">
                  Sent to 142 registered livestock owners within the{' '}
                  {broadcastModalCluster.radiusKm} km containment radius in{' '}
                  {broadcastModalCluster.center.district}.
                </p>
                <button
                  onClick={() => setBroadcastModalCluster(null)}
                  className="mt-2 py-1.5 px-4 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-stone-600">
                  This action will send an emergency early-warning notification to all
                  pastoralists and agricultural co-ops within{' '}
                  <strong className="text-stone-900">
                    {broadcastModalCluster.radiusKm} km
                  </strong>{' '}
                  of cluster center ({broadcastModalCluster.center.district}).
                </p>

                <div className="p-3 bg-stone-100 rounded-md border border-stone-300 font-mono text-[11px] text-stone-800 space-y-1">
                  <p className="font-bold text-red-700">
                    [FIELDWATCH VET ALERT - {broadcastModalCluster.diseaseName.toUpperCase()}]
                  </p>
                  <p>
                    Urgent: Active outbreak detected in {broadcastModalCluster.center.district}.
                    Please isolate cloven-hoofed stock immediately, avoid communal water
                    points, and report blister/salivation signs into FieldWatch.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setBroadcastModalCluster(null)}
                    className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setBroadcastSent(true)}
                    className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Send Emergency SMS Broadcast</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
