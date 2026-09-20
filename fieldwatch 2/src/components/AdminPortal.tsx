import React, { useState } from 'react';
import { ShieldCheck, Activity, LayoutDashboard, ArrowLeft, Users } from 'lucide-react';
import { AdminFarmerApprovals } from './AdminFarmerApprovals';
import { AdminDashboard } from './AdminDashboard';
import { RippleButton } from './RippleButton';
import { OfficerView } from './OfficerView';
import { DiseaseReport, ReportStatus, SupportedLanguage, User } from '../types';

interface AdminPortalProps {
  user: User;
  authToken: string;
  onExit: () => void;
  reports: DiseaseReport[];
  onUpdateReportStatus: (
    reportId: string,
    newStatus: ReportStatus,
    officerNotes?: string
  ) => void;
  currentLang: SupportedLanguage;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  user,
  authToken,
  onExit,
  reports,
  onUpdateReportStatus,
  currentLang,
}) => {
  const [adminTab, setAdminTab] = useState<'dashboard' | 'approvals' | 'surveillance'>('dashboard');
  return (
    <div className="min-h-[85vh] bg-stone-100 pb-16">
      {/* Top Admin Navigation Header */}
      <div className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="p-2 hover:bg-stone-800 rounded-md text-stone-400 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Return to Farmer View"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Farmer View</span>
            </button>

            <div className="h-4 w-px bg-stone-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-white">
                    District Veterinary Officer Portal
                  </span>
                  <span className="px-2 py-0.2 bg-indigo-900 text-indigo-200 border border-indigo-700 rounded-md text-[10px] font-bold">
                    Admin Access
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  {user.name} • {user.district}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Sub-tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-stone-800 p-1 rounded-md text-xs font-semibold">
            {([
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'approvals', label: 'Farmer Approvals', icon: Users },
              { id: 'surveillance', label: 'Epidemiology & Clusters', icon: Activity },
            ] as const).map(({ id, label, icon: Icon }) => (
              <RippleButton
                key={id}
                rounded="rounded-lg"
                onClick={() => setAdminTab(id)}
                className={`px-3 py-1.5 transition flex items-center gap-1.5 ${
                  adminTab === id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </RippleButton>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {adminTab === 'dashboard' && (
          <AdminDashboard
            authToken={authToken}
            reports={reports}
            onOpenApprovals={() => setAdminTab('approvals')}
            onOpenSurveillance={() => setAdminTab('surveillance')}
          />
        )}

        {adminTab === 'approvals' && (
          <AdminFarmerApprovals authToken={authToken} />
        )}

        {adminTab === 'surveillance' && (
          <OfficerView
            reports={reports}
            onUpdateReportStatus={onUpdateReportStatus}
            currentLang={currentLang}
          />
        )}
      </div>
    </div>
  );
};
