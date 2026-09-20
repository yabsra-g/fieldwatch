import React, { useState, useMemo, useRef } from 'react';
import {
  TEModal,
  TEModalDialog,
  TEModalContent,
  TEModalHeader,
  TEModalBody,
  TEModalFooter,
} from 'tw-elements-react';
import {
  Stethoscope,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Send,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  Camera,
  PenLine,
  Loader2,
  X,
} from 'lucide-react';
import {
  DiseaseProfile,
  DiseaseReport,
  HostType,
  OutboxEntry,
  SupportedLanguage,
  Symptom,
  User,
} from '../types';
import { RippleButton } from './RippleButton';
import { SymptomEngine } from '../utils/symptomEngine';
import { t } from '../utils/i18n';

interface FarmerViewProps {
  symptoms: Symptom[];
  diseases: DiseaseProfile[];
  onSubmitReport: (
    report: Omit<DiseaseReport, 'id' | 'timestampMillis' | 'status'>
  ) => void;
  outbox: OutboxEntry[];
  onSyncOutbox: () => void;
  isOnline: boolean;
  submittedReports: DiseaseReport[];
  currentLang: SupportedLanguage;
  onBack?: () => void;
  user?: User | null;
  authToken?: string | null;
}

const HOST_OPTIONS: { type: HostType; label: string; icon: string; category: 'Livestock' | 'Crop' }[] = [
  { type: 'CATTLE', label: 'Cattle / Dairy', icon: '🐄', category: 'Livestock' },
  { type: 'SHEEP_GOAT', label: 'Sheep & Goats', icon: '🐐', category: 'Livestock' },
  { type: 'SWINE', label: 'Pigs / Swine', icon: '🐖', category: 'Livestock' },
  { type: 'POULTRY', label: 'Poultry / Birds', icon: '🐔', category: 'Livestock' },
  { type: 'MAIZE', label: 'Maize / Corn', icon: '🌽', category: 'Crop' },
  { type: 'CASSAVA', label: 'Cassava Root', icon: '🌿', category: 'Crop' },
  { type: 'WHEAT_GRAIN', label: 'Wheat / Cereal', icon: '🌾', category: 'Crop' },
];

export const FarmerView: React.FC<FarmerViewProps> = ({
  symptoms,
  diseases,
  onSubmitReport,
  outbox,
  onSyncOutbox,
  isOnline,
  submittedReports,
  currentLang,
  onBack,
  user,
  authToken,
}) => {
  const [selectedHost, setSelectedHost] = useState<HostType>('CATTLE');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [totalAnimalsOrAcres, setTotalAnimalsOrAcres] = useState<number>(35);
  const [affectedCount, setAffectedCount] = useState<number>(8);
  const [mortalityCount, setMortalityCount] = useState<number>(1);
  const [farmerName, setFarmerName] = useState<string>(user?.name || '');
  const [farmContact, setFarmContact] = useState<string>(user?.phone || '');
  const [district, setDistrict] = useState<string>(user?.district || '');
  const [village, setVillage] = useState<string>(user?.village || '');
  const [latitude, setLatitude] = useState<number>(-1.286389);
  const [longitude, setLongitude] = useState<number>(36.817223);
  const [notes, setNotes] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Symptom engine computation
  const symptomEngine = useMemo(() => new SymptomEngine(diseases), [diseases]);
  const diagnosisMatches = useMemo(
    () => symptomEngine.evaluate(selectedHost, selectedSymptoms),
    [symptomEngine, selectedHost, selectedSymptoms]
  );

  // Filter symptoms applicable to selected host
  const applicableSymptoms = useMemo(() => {
    return symptoms.filter((s) => s.applicableHosts.includes(selectedHost));
  }, [symptoms, selectedHost]);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSimulateGPS = () => {
    // Generate slight jitter around current region for realistic testing
    const jitterLat = -1.28 + (Math.random() - 0.5) * 0.08;
    const jitterLon = 36.82 + (Math.random() - 0.5) * 0.08;
    setLatitude(parseFloat(jitterLat.toFixed(6)));
    setLongitude(parseFloat(jitterLon.toFixed(6)));
  };

  // --- Start-of-report choice: photo (AI fills the form) or manual ---
  const [showChoice, setShowChoice] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [aiFilled, setAiFilled] = useState<boolean>(false);
  const [aiConfidence, setAiConfidence] = useState<string>('');
  const [showApprove, setShowApprove] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shrink the photo before upload: keeps it fast on rural connections and well under server limits
  const shrinkImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('That file could not be read as an image.'));
      };
      img.src = url;
    });

  const handlePhotoChosen = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    setAnalyzing(true);
    try {
      const image = await shrinkImage(file);
      setPhoto(image);
      const res = await fetch('/api/report/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          image,
          symptoms: symptoms.map((s) => ({ id: s.id, name: s.nameKey, hosts: s.applicableHosts })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhotoError(
          data.code === 'ai_not_configured'
            ? 'AI photo analysis is not set up yet (the AI key has not been added). You can still fill in the form yourself.'
            : data.error || 'The photo could not be analyzed.'
        );
        return;
      }
      if (!data.hostType) {
        setPhotoError('No animal or crop could be recognised in that photo. Try a clearer, closer photo, or fill in the form yourself.');
        return;
      }

      // Fill the form with the AI's suggestions; the farmer still reviews and approves
      setSelectedHost(data.hostType);
      setSelectedSymptoms(data.symptomIds || []);
      const affected = data.affectedCount && data.affectedCount > 0 ? data.affectedCount : null;
      if (affected) setAffectedCount(affected);
      if (data.mortalityCount !== null) setMortalityCount(data.mortalityCount);
      if (data.totalAnimalsOrAcres) setTotalAnimalsOrAcres(Math.max(data.totalAnimalsOrAcres, affected || 1));
      else if (affected) setTotalAnimalsOrAcres((prev) => Math.max(prev, affected));
      if (data.notes) setNotes(data.notes);
      setAiConfidence(data.confidence || 'low');
      setAiFilled(true);
      setShowChoice(false);
    } catch (err: any) {
      setPhotoError(err.message || 'Could not reach the server. Please try again or fill in the form yourself.');
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const submitReport = () => {
    const topMatch = diagnosisMatches[0]?.disease;

    onSubmitReport({
      farmerName: farmerName.trim() || 'Community Smallholder',
      farmContact: farmContact.trim() || '+254 700 000 000',
      hostType: selectedHost,
      totalAnimalsOrAcres: Number(totalAnimalsOrAcres) || 1,
      affectedCount: Number(affectedCount) || 1,
      mortalityCount: Number(mortalityCount) || 0,
      observedSymptomIds: selectedSymptoms,
      suspectDiseaseId: topMatch?.id,
      location: {
        latitude,
        longitude,
        accuracyMeters: 4.5,
        district,
        village,
      },
      notes: notes.trim() || 'Reported via FieldWatch mobile client',
    });

    // Reset some fields and show feedback
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
    setSelectedSymptoms([]);
    setNotes('');
    setAiFilled(false);
    setPhoto(null);
    setShowApprove(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      alert('Please check at least one observed symptom before submitting.');
      return;
    }
    // Anything filled in by AI must be approved by the farmer first
    if (aiFilled) setShowApprove(true);
    else submitReport();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back to Home Navigation */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer shadow-xs"
        >
          <span>← Back to Farmer Dashboard</span>
        </button>
      )}

      {/* Offline Alert Banner if applicable */}
      {!isOnline && (
        <div className="bg-amber-950/80 border border-amber-600/80 text-amber-200 px-4 py-3 rounded-md flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Inbox className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">
                {t('offline_status', currentLang)}
              </p>
              <p className="text-xs text-amber-300/80">
                Reports will be stored safely in your local device Outbox and
                synced automatically once an Internet signal is detected.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-amber-900 rounded-lg border border-amber-700">
            {outbox.length} in Outbox
          </span>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="bg-emerald-900 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-md flex items-center gap-3 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-sm">
              {isOnline
                ? 'Clinical report uploaded directly to Central Surveillance!'
                : 'Report safely recorded into local device Outbox!'}
            </p>
            <p className="text-xs text-emerald-200">
              District veterinary officers have been flagged for epidemiological
              cluster analysis.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Clinical Form */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 space-y-6"
          >
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                <span>{t('new_report_title', currentLang)}</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Record observed health anomalies in your livestock or fields for
                rapid veterinary intervention.
              </p>
            </div>

            {aiFilled && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-md flex items-start gap-3 text-xs text-sky-900">
                {photo && <img src={photo} alt="Your photo" className="w-14 h-14 rounded-md object-cover shrink-0 border border-sky-200" />}
                <div>
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Filled in from your photo
                    {aiConfidence && <span className="font-normal text-sky-700">({aiConfidence} confidence)</span>}
                  </p>
                  <p className="mt-0.5 text-sky-800">
                    AI can make mistakes. Check every field and change anything that is wrong. You will be asked to approve before it is sent.
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Species / Host Selector */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                {t('host_label', currentLang)}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {HOST_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setSelectedHost(opt.type);
                      setSelectedSymptoms([]);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-md border text-left text-xs font-semibold transition ${
                      selectedHost === opt.type
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50/50'
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <div>
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-[10px] text-stone-400 font-normal">
                        {opt.category}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Clinical Symptoms Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  {t('symptoms_label', currentLang)}
                </label>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {selectedSymptoms.length} Selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {applicableSymptoms.map((sym) => {
                  const isChecked = selectedSymptoms.includes(sym.id);
                  return (
                    <div
                      key={sym.id}
                      onClick={() => toggleSymptom(sym.id)}
                      className={`p-3 rounded-md border cursor-pointer select-none transition ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/30 text-stone-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container
                          className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-stone-900 leading-snug">
                            {sym.nameKey}
                          </p>
                          <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                            {sym.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Herd & Impact Counts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Total Herd / Acreage
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalAnimalsOrAcres}
                  onChange={(e) => setTotalAnimalsOrAcres(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  {t('affected_count', currentLang)}
                </label>
                <input
                  type="number"
                  min="1"
                  value={affectedCount}
                  onChange={(e) => setAffectedCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-amber-300 bg-amber-50/30 rounded-lg text-sm font-semibold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  {t('mortality_count', currentLang)}
                </label>
                <input
                  type="number"
                  min="0"
                  value={mortalityCount}
                  onChange={(e) => setMortalityCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-red-300 bg-red-50/30 rounded-lg text-sm font-semibold text-red-950 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
            </div>

            {/* Step 4: Geographic Location & Farm Contact */}
            <div className="p-4 bg-stone-50 rounded-md border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Geotag & Farm Metadata</span>
                </span>
                <button
                  type="button"
                  onClick={handleSimulateGPS}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Update GPS Fix</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-stone-600 font-medium block mb-1">
                    Farmer Name
                  </label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-md bg-white text-stone-800"
                    placeholder="e.g. Ezekiel Kiprono"
                  />
                </div>
                <div>
                  <label className="text-stone-600 font-medium block mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={farmContact}
                    onChange={(e) => setFarmContact(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-md bg-white text-stone-800"
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="text-stone-600 font-medium block mb-1">
                    District / County
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-md bg-white text-stone-800"
                  />
                </div>
                <div>
                  <label className="text-stone-600 font-medium block mb-1">
                    Village / Locality
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-md bg-white text-stone-800"
                  />
                </div>
              </div>

              <div className="text-[11px] font-mono text-stone-500 flex items-center justify-between border-t border-stone-200 pt-2">
                <span>
                  GPS: {latitude.toFixed(5)}°, {longitude.toFixed(5)}°
                </span>
                <span className="text-emerald-700">Accuracy: ±4.5m</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Clinical Field Notes & Observations
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe onset, communal grazing details, recent livestock trade, or behavior..."
                rows={2}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <button
              id="farmer-submit-case-btn"
              type="submit"
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-md shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{t('submit_btn', currentLang)}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Real-time Symptom Diagnostic Output & Outbox */}
        <div className="lg:col-span-5 space-y-6">
          {/* Differential Diagnosis Engine Card */}
          <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-stone-900">
                  {t('diff_diagnosis', currentLang)}
                </h3>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                SymptomEngine v2.1
              </span>
            </div>

            {diagnosisMatches.length === 0 ? (
              <div className="py-8 text-center text-stone-400 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs font-medium">
                  Select observed symptoms on the left to compute differential
                  disease likelihoods in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {diagnosisMatches.map((match, idx) => {
                  const isTop = idx === 0;
                  const barColor =
                    match.score >= 70
                      ? 'bg-red-600'
                      : match.score >= 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-600';

                  return (
                    <div
                      key={match.disease.id}
                      className={`p-3.5 rounded-md border transition ${
                        isTop
                          ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-stone-900">
                              {match.disease.commonName}
                            </span>
                            {isTop && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded">
                                Highest Match
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-500 italic mt-0.5">
                            {match.disease.scientificName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-stone-900">
                            {match.score}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-stone-100 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full ${barColor} transition-all duration-300`}
                          style={{ width: `${match.score}%` }}
                        />
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500">
                        <span>
                          Primary Symptoms: {match.matchedPrimaryCount} /{' '}
                          {match.totalPrimaryCount}
                        </span>
                        <span className="font-medium text-stone-700">
                          Severity: {match.disease.severity}
                        </span>
                      </div>

                      <div className="mt-2.5 p-2 bg-stone-100/70 rounded-lg text-[11px] text-stone-700 border border-stone-200/60 leading-relaxed">
                        <div className="font-semibold text-stone-900 mb-0.5 flex items-center gap-1">
                          <Info className="w-3 h-3 text-emerald-600" />
                          <span>Advisory:</span>
                        </div>
                        {match.recommendation}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Local Outbox Component */}
          <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-stone-700" />
                <h3 className="font-bold text-sm text-stone-900">
                  Local Device Outbox Queue
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                {outbox.length} Pending
              </span>
            </div>

            {outbox.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 text-center">
                Outbox is clean. All clinical submissions are currently
                synchronized with the central server.
              </p>
            ) : (
              <div className="space-y-2.5">
                {outbox.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-md flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-stone-800">
                        {entry.report.hostType} Case — {entry.report.location.village}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {entry.report.affectedCount} affected | Queued{' '}
                        {new Date(entry.createdAtMillis).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-semibold rounded text-[10px]">
                      Pending Sync
                    </span>
                  </div>
                ))}

                <button
                  onClick={onSyncOutbox}
                  disabled={!isOnline}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isOnline
                      ? 'bg-stone-900 hover:bg-stone-800 text-white cursor-pointer'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3 h-3" />
                  <span>
                    {isOnline
                      ? `Sync ${outbox.length} Queued Reports to Server`
                      : 'Switch to Online Mode to Sync Outbox'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Community Recent Reports Card */}
          <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Recent Community Reports</span>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {submittedReports.slice(0, 4).map((rep) => (
                <div
                  key={rep.id}
                  className="p-2.5 border border-stone-200 rounded-lg text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-stone-800">
                        {rep.farmerName}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        • {rep.location.district}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-600">
                      {rep.hostType} | {rep.affectedCount} sick, {rep.mortalityCount} dead
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rep.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rep.status === 'CONTAINMENT_DEPLOYED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Choice: upload a photo or fill in manually */}
      <TEModal show={showChoice} setShow={setShowChoice}>
        <TEModalDialog centered>
          <TEModalContent className="rounded-lg">
            <TEModalHeader className="!border-stone-200">
              <h5 className="text-lg font-extrabold text-stone-950">How do you want to report?</h5>
              <button
                type="button"
                onClick={() => setShowChoice(false)}
                className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </TEModalHeader>
            <TEModalBody>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoChosen(e.target.files?.[0])}
              />

              {analyzing ? (
                <div className="py-6 text-center space-y-3">
                  {photo && <img src={photo} alt="Your photo" className="w-40 h-40 object-cover rounded-md mx-auto border border-stone-200" />}
                  <p className="flex items-center justify-center gap-2 text-sm font-semibold text-stone-800">
                    <Loader2 className="w-4 h-4 animate-spin" /> Looking at your photo…
                  </p>
                  <p className="text-xs text-stone-500">This takes a few seconds.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {photoError && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
                      {photoError}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <RippleButton
                      rippleColor="dark"
                      rounded="rounded-md"
                      wrapperClassName="!block"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full text-left p-4 border border-stone-300 hover:border-stone-900 bg-white space-y-2"
                    >
                      <Camera className="w-6 h-6 text-stone-900" />
                      <span className="block text-sm font-bold text-stone-950">Upload a photo</span>
                      <span className="block text-xs text-stone-500 font-normal">
                        We fill in the form from your photo. You check it before sending.
                      </span>
                    </RippleButton>
                    <RippleButton
                      rippleColor="dark"
                      rounded="rounded-md"
                      wrapperClassName="!block"
                      onClick={() => setShowChoice(false)}
                      className="w-full text-left p-4 border border-stone-300 hover:border-stone-900 bg-white space-y-2"
                    >
                      <PenLine className="w-6 h-6 text-stone-900" />
                      <span className="block text-sm font-bold text-stone-950">Fill in manually</span>
                      <span className="block text-xs text-stone-500 font-normal">
                        Choose the species, symptoms and numbers yourself.
                      </span>
                    </RippleButton>
                  </div>
                </div>
              )}
            </TEModalBody>
          </TEModalContent>
        </TEModalDialog>
      </TEModal>

      {/* Approval before an AI-filled report is sent */}
      <TEModal show={showApprove} setShow={setShowApprove} scrollable>
        <TEModalDialog centered size="lg">
          <TEModalContent className="rounded-lg">
            <TEModalHeader className="!border-stone-200">
              <h5 className="text-lg font-extrabold text-stone-950">Approve your report</h5>
              <button
                type="button"
                onClick={() => setShowApprove(false)}
                className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </TEModalHeader>
            <TEModalBody>
              <p className="text-xs text-stone-600 mb-4">
                Parts of this report were filled in by AI from your photo. Please check that everything is correct before it is sent to the district officers.
              </p>
              <div className="flex gap-4">
                {photo && <img src={photo} alt="Your photo" className="w-28 h-28 object-cover rounded-md border border-stone-200 shrink-0" />}
                <dl className="text-xs grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 min-w-0">
                  <dt className="text-stone-500">Species / crop</dt>
                  <dd className="font-semibold text-stone-900">
                    {HOST_OPTIONS.find((o) => o.type === selectedHost)?.label}
                  </dd>
                  <dt className="text-stone-500">Symptoms</dt>
                  <dd className="font-semibold text-stone-900">
                    {selectedSymptoms
                      .map((id) => symptoms.find((s) => s.id === id)?.nameKey)
                      .filter(Boolean)
                      .join(', ')}
                  </dd>
                  <dt className="text-stone-500">Total / affected / dead</dt>
                  <dd className="font-semibold text-stone-900">
                    {totalAnimalsOrAcres} / {affectedCount} / {mortalityCount}
                  </dd>
                  <dt className="text-stone-500">Location</dt>
                  <dd className="font-semibold text-stone-900">
                    {[village, district].filter(Boolean).join(', ') || 'Not set'}
                  </dd>
                  <dt className="text-stone-500">Notes</dt>
                  <dd className="text-stone-800">{notes || 'None'}</dd>
                </dl>
              </div>
            </TEModalBody>
            <TEModalFooter className="!border-stone-200">
              <RippleButton
                rippleColor="dark"
                onClick={() => setShowApprove(false)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-5 py-2.5"
              >
                Go back and edit
              </RippleButton>
              <RippleButton
                onClick={submitReport}
                className="bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold px-5 py-2.5"
              >
                Approve &amp; submit
              </RippleButton>
            </TEModalFooter>
          </TEModalContent>
        </TEModalDialog>
      </TEModal>
    </div>
  );
};
