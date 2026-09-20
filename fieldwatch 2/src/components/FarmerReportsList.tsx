import React from 'react';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Shield,
  PlusCircle,
} from 'lucide-react';
import { DiseaseReport, OutboxEntry, SupportedLanguage, User } from '../types';

interface FarmerReportsListProps {
  reports: DiseaseReport[];
  outbox: OutboxEntry[];
  user: User | null;
  onBack: () => void;
  onNewReport: () => void;
  currentLang: SupportedLanguage;
}

export const FarmerReportsList: React.FC<FarmerReportsListProps> = ({
  reports,
  outbox,
  user,
  onBack,
  onNewReport,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUSPECT':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-xs font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Vet Review</span>
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-md text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified by Officer</span>
          </span>
        );
      case 'CONTAINMENT_DEPLOYED':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-300 rounded-md text-xs font-bold flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Quarantine Active</span>
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-stone-100 text-stone-800 rounded-md text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-stone-200 rounded-md text-stone-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <button
          onClick={onNewReport}
          className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Report</span>
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-4">
        <div>
          <h1 className="text-xl font-black text-stone-900">My Clinical Submissions</h1>
          <p className="text-xs text-stone-500">
            Reports submitted from your farm and their verification status with district veterinary doctors.
          </p>
        </div>

        {/* Offline Outbox Section */}
        {outbox.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-2">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Pending Offline Upload ({outbox.length})</span>
            </div>
            <p className="text-xs text-amber-800">
              These reports were recorded while offline. They are saved securely on your device and will be submitted automatically when your phone reconnects.
            </p>
          </div>
        )}

        {/* Reports List */}
        <div className="space-y-3 pt-2">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              No disease reports submitted yet.
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-500">
                      #{report.id}
                    </span>
                    <span className="px-2 py-0.5 bg-stone-200 text-stone-800 text-xs font-bold rounded-md">
                      {report.hostType}
                    </span>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-md border border-stone-200">
                    <span className="text-stone-400 block text-[10px]">Sick Count</span>
                    <span className="font-bold text-stone-800 text-sm">
                      {report.affectedCount}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-md border border-stone-200">
                    <span className="text-stone-400 block text-[10px]">Mortalities</span>
                    <span className="font-bold text-red-700 text-sm">
                      {report.mortalityCount}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-md border border-stone-200 col-span-2">
                    <span className="text-stone-400 block text-[10px]">Location</span>
                    <span className="font-medium text-stone-800 truncate block">
                      {report.location.village}, {report.location.district}
                    </span>
                  </div>
                </div>

                {report.notes && (
                  <p className="text-xs text-stone-600 bg-white p-2.5 rounded-md border border-stone-200">
                    "{report.notes}"
                  </p>
                )}

                {report.officerNotes && (
                  <div className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-950 p-2.5 rounded-md">
                    <strong className="block text-[11px] text-indigo-800">Veterinary Officer Response:</strong>
                    {report.officerNotes}
                  </div>
                )}

                <div className="text-[10px] text-stone-400 font-mono">
                  Submitted {new Date(report.timestampMillis).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
