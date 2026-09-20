export type HostType =
  | 'CATTLE'
  | 'SHEEP_GOAT'
  | 'SWINE'
  | 'POULTRY'
  | 'MAIZE'
  | 'CASSAVA'
  | 'WHEAT_GRAIN';

export type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type ReportStatus =
  | 'SUSPECT'
  | 'VERIFIED'
  | 'CONTAINMENT_DEPLOYED'
  | 'RESOLVED'
  | 'REJECTED';

export interface GeoLocation {
  latitude: DoubleOrNumber;
  longitude: DoubleOrNumber;
  accuracyMeters?: number;
  district: string;
  village: string;
}

type DoubleOrNumber = number;

export interface Symptom {
  id: string;
  nameKey: string;
  description: string;
  applicableHosts: HostType[];
  defaultWeight: number;
}

export interface DiseaseProfile {
  id: string;
  commonName: string;
  scientificName: string;
  hostType: HostType;
  primarySymptoms: string[]; // Symptom IDs
  secondarySymptoms: string[];
  severity: SeverityLevel;
  infectiousnessScore: number; // 1-10
  quarantineRadiusKm: number;
  recommendedInterventions: string[];
}

export interface DiseaseReport {
  id: string;
  farmerName: string;
  farmContact: string;
  hostType: HostType;
  totalAnimalsOrAcres: number;
  affectedCount: number;
  mortalityCount: number;
  observedSymptomIds: string[];
  suspectDiseaseId?: string;
  location: GeoLocation;
  timestampMillis: number;
  status: ReportStatus;
  notes: string;
  officerNotes?: string;
}

export interface OutbreakCluster {
  id: string;
  diseaseId: string;
  diseaseName: string;
  center: GeoLocation;
  radiusKm: number;
  reportIds: string[];
  totalAffected: number;
  totalMortality: number;
  firstReportTime: number;
  latestReportTime: number;
  severity: SeverityLevel;
  status: 'ACTIVE' | 'CONTAINED' | 'MONITORING';
}

export interface OutboxEntry {
  id: string;
  report: DiseaseReport;
  createdAtMillis: number;
  retryCount: number;
  lastError?: string;
}

export interface DiagnosisMatch {
  disease: DiseaseProfile;
  score: number; // 0-100
  matchedPrimaryCount: number;
  totalPrimaryCount: number;
  matchedSecondaryCount: number;
  recommendation: string;
}

export type SupportedLanguage = 'en' | 'sw' | 'hi' | 'es';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  district: string;
  village: string;
  role: 'farmer' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}
