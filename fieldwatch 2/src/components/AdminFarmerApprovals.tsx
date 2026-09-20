import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MapPin,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { User } from '../types';
import { RippleButton } from './RippleButton';

interface AdminFarmerApprovalsProps {
  authToken: string;
}

export const AdminFarmerApprovals: React.FC<AdminFarmerApprovalsProps> = ({ authToken }) => {
  const [farmers, setFarmers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchFarmers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/farmers', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setFarmers(data.farmers || []);
      }
    } catch (e) {
      console.error('Failed to fetch farmers', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, [authToken]);

  const handleApprove = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/farmers/${id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        setActionFeedback(`Farmer "${name}" approved. They can now log in and access FieldWatch.`);
        fetchFarmers();
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } catch (e) {
      console.error('Error approving farmer', e);
    }
  };

  const handleReject = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/farmers/${id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        setActionFeedback(`Farmer registration for "${name}" was rejected.`);
        fetchFarmers();
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } catch (e) {
      console.error('Error rejecting farmer', e);
    }
  };

  const filteredFarmers = farmers.filter((f) => {
    const matchesFilter = filterStatus === 'all' || f.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.phone.includes(q) ||
      f.district.toLowerCase().includes(q) ||
      f.village.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = farmers.filter((f) => f.status === 'pending').length;
  const approvedCount = farmers.filter((f) => f.status === 'approved').length;

  return (
    <div className="space-y-4">
      {/* Top Banner & Stats */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">
            Farmer Registration & Verification Hub
          </h2>
          <p className="text-xs text-stone-500">
            Enforce verified reporter identities before granting access to outbreak surveillance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved ({approvedCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-stone-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700'
            }`}
          >
            All ({farmers.length})
          </button>

          <button
            onClick={fetchFarmers}
            className="p-2 bg-stone-100 hover:bg-stone-200 rounded-md text-stone-600 transition cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md text-xs font-semibold text-emerald-900 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter farmers by name, phone, district, or village..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-md text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-indigo-600"
        />
      </div>

      {/* Farmers List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="p-8 text-center bg-white rounded-lg border border-stone-200 text-stone-400 text-xs">
            Loading farmer directory...
          </div>
        )}

        {!isLoading && filteredFarmers.length === 0 && (
          <div className="p-8 text-center bg-white rounded-lg border border-stone-200 text-stone-500 text-xs">
            No farmer registrations found matching this filter.
          </div>
        )}

        {filteredFarmers.map((farmer) => (
          <div
            key={farmer.id}
            className={`bg-white border rounded-lg p-4 shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              farmer.status === 'pending'
                ? 'border-amber-300 bg-amber-50/20'
                : farmer.status === 'approved'
                ? 'border-stone-200'
                : 'border-red-200 bg-red-50/20'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-stone-900 text-sm">{farmer.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    farmer.status === 'pending'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : farmer.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {farmer.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span className="font-mono">{farmer.phone}</span>
                </span>

                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>
                    {farmer.village}, {farmer.district}
                  </span>
                </span>

                <span className="flex items-center gap-1 text-stone-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(farmer.createdAt || Date.now()).toLocaleDateString()}</span>
                </span>
              </div>

              {farmer.status === 'approved' && farmer.approvedBy && (
                <div className="text-[11px] text-emerald-700 font-medium">
                  ✓ Verified by {farmer.approvedBy}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {farmer.status === 'pending' && (
                <>
                  <RippleButton rounded="rounded-md"
                    onClick={() => handleApprove(farmer.id, farmer.name)}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-md text-xs shadow-xs transition flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Approve Farmer</span>
                  </RippleButton>

                  <RippleButton rounded="rounded-md" rippleColor="dark"
                    onClick={() => handleReject(farmer.id, farmer.name)}
                    className="px-3 py-2 bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 border border-stone-200 rounded-md text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </RippleButton>
                </>
              )}

              {farmer.status === 'approved' && (
                <RippleButton rounded="rounded-md"
                  onClick={() => handleReject(farmer.id, farmer.name)}
                  rippleColor="dark" className="px-3 py-1.5 text-stone-400 hover:text-red-600 hover:bg-stone-50 rounded-md text-xs transition"
                >
                  Suspend Access
                </RippleButton>
              )}

              {farmer.status === 'rejected' && (
                <RippleButton rounded="rounded-md"
                  onClick={() => handleApprove(farmer.id, farmer.name)}
                  rippleColor="dark" className="px-3 py-1.5 bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 rounded-md text-xs font-semibold transition"
                >
                  Re-Approve
                </RippleButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
