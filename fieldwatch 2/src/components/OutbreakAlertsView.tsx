import React from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  MapPin,
  AlertTriangle,
  Phone,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { DiseaseReport, OutbreakCluster, SupportedLanguage } from '../types';
import { SurveillanceMap } from './SurveillanceMap';

interface OutbreakAlertsViewProps {
  outbreaks: OutbreakCluster[];
  reports: DiseaseReport[];
  onBack: () => void;
  currentLang: SupportedLanguage;
}

export const OutbreakAlertsView: React.FC<OutbreakAlertsViewProps> = ({
  outbreaks,
  reports,
  onBack,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <button
        onClick={onBack}
        className="p-2 hover:bg-stone-200 rounded-md text-stone-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            <h1 className="text-xl font-black text-stone-900">Regional Disease Warnings</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Official alerts issued by the County Veterinary Department. Follow strict biosecurity to protect your animals.
          </p>
        </div>

        <SurveillanceMap reports={reports} outbreaks={outbreaks} />

        {outbreaks.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-sm">No Active Outbreak Clusters Detected</p>
            <p className="text-emerald-700 mt-1">
              Your county surveillance perimeter is currently clear. Maintain regular hygiene and vaccination protocols.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {outbreaks.map((cluster) => (
              <div
                key={cluster.id}
                className="bg-red-50/50 border-2 border-red-300 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                    <h3 className="font-black text-red-950 text-base">
                      {cluster.diseaseName}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-red-600 text-white rounded-md text-xs font-bold uppercase tracking-wider">
                    {cluster.severity} ALERT
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-md border border-red-200">
                    <span className="text-stone-400 block text-[10px]">Epicenter</span>
                    <span className="font-bold text-stone-800 truncate block">
                      {cluster.center.district}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-md border border-red-200">
                    <span className="text-stone-400 block text-[10px]">Quarantine Buffer</span>
                    <span className="font-bold text-red-700">
                      {cluster.radiusKm} km radius
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-md border border-red-200 col-span-2 sm:col-span-1">
                    <span className="text-stone-400 block text-[10px]">Total Animals Sick</span>
                    <span className="font-bold text-stone-900">
                      {cluster.totalAffected} cases ({cluster.totalMortality} deaths)
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-md border border-red-200 text-xs text-stone-700 space-y-1.5">
                  <span className="font-bold text-red-900 block text-xs">
                    Mandatory Farmer Biosecurity Directives:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-stone-600 text-[11px]">
                    <li>Halt all animal movement, market transport, and communal grazing inside the {cluster.radiusKm} km zone.</li>
                    <li>Disinfect boot soles, truck tires, and feed troughs daily with approved disinfectant.</li>
                    <li>Immediately isolate any animal showing high fever, sudden lameness, or blistering.</li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-700" />
            <span>District Veterinary Hotline: <strong>+254 800 720 021</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
