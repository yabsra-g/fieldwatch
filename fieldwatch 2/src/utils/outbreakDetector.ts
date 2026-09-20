import { DiseaseReport, OutbreakCluster, SeverityLevel } from '../types';
import { calculateCentroid, distanceBetween } from './geo';

export interface DetectorConfig {
  clusterRadiusKm: number;
  timeWindowDays: number;
  alertThresholdReports: number;
}

export const DEFAULT_DETECTOR_CONFIG: DetectorConfig = {
  clusterRadiusKm: 25,
  timeWindowDays: 14,
  alertThresholdReports: 3,
};

export class OutbreakDetector {
  constructor(private config: DetectorConfig = DEFAULT_DETECTOR_CONFIG) {}

  /**
   * Spatiotemporal clustering algorithm (DBSCAN single-linkage over geographic distance + time window).
   */
  detectOutbreaks(
    reports: DiseaseReport[],
    customConfig?: Partial<DetectorConfig>
  ): OutbreakCluster[] {
    const cfg = { ...this.config, ...customConfig };
    const now = Date.now();
    const windowMillis = cfg.timeWindowDays * 24 * 3600 * 1000;

    // Filter active reports in the window, ignoring resolved/rejected
    const activeReports = reports.filter(
      (r) =>
        r.status !== 'REJECTED' &&
        r.status !== 'RESOLVED' &&
        now - r.timestampMillis <= windowMillis
    );

    // Group by suspect disease
    const byDisease = new Map<string, DiseaseReport[]>();
    for (const report of activeReports) {
      const dId = report.suspectDiseaseId || 'UNKNOWN';
      const existing = byDisease.get(dId) || [];
      existing.push(report);
      byDisease.set(dId, existing);
    }

    const clusters: OutbreakCluster[] = [];

    for (const [diseaseId, diseaseReports] of byDisease.entries()) {
      if (diseaseReports.length < cfg.alertThresholdReports) continue;

      const visited = new Set<string>();

      for (const report of diseaseReports) {
        if (visited.has(report.id)) continue;

        const clusterMembers: DiseaseReport[] = [report];
        visited.add(report.id);

        const queue: DiseaseReport[] = [report];

        while (queue.length > 0) {
          const current = queue.shift()!;
          for (const candidate of diseaseReports) {
            if (!visited.has(candidate.id)) {
              const dist = distanceBetween(current.location, candidate.location);
              if (dist <= cfg.clusterRadiusKm) {
                visited.add(candidate.id);
                clusterMembers.push(candidate);
                queue.push(candidate);
              }
            }
          }
        }

        if (clusterMembers.length >= cfg.alertThresholdReports) {
          const locations = clusterMembers.map((r) => r.location);
          const centroid = calculateCentroid(locations);
          const totalAffected = clusterMembers.reduce((sum, r) => sum + r.affectedCount, 0);
          const totalMortality = clusterMembers.reduce((sum, r) => sum + r.mortalityCount, 0);

          let maxDist = 0;
          for (const m of clusterMembers) {
            const d = distanceBetween(centroid, m.location);
            if (d > maxDist) maxDist = d;
          }
          const effectiveRadius = Math.max(Math.round(maxDist + 5), 15);

          let severity: SeverityLevel = 'MODERATE';
          if (totalMortality >= 10 || clusterMembers.length >= 6) {
            severity = 'CRITICAL';
          } else if (totalMortality >= 3 || clusterMembers.length >= 4) {
            severity = 'HIGH';
          } else if (clusterMembers.length >= 3) {
            severity = 'MODERATE';
          }

          const diseaseName =
            diseaseId === 'fmd'
              ? 'Foot-and-Mouth Disease (FMD)'
              : diseaseId === 'asf'
              ? 'African Swine Fever (ASF)'
              : diseaseId === 'newcastle'
              ? 'Newcastle Disease / Avian Flu'
              : diseaseId === 'fall_armyworm'
              ? 'Fall Armyworm (FAW)'
              : diseaseId === 'cassava_mosaic'
              ? 'Cassava Mosaic Disease (CMD)'
              : diseaseId.toUpperCase();

          clusters.push({
            id: `OUTBREAK-${diseaseId.toUpperCase()}-${clusters.length + 1}`,
            diseaseId,
            diseaseName,
            center: centroid,
            radiusKm: effectiveRadius,
            reportIds: clusterMembers.map((r) => r.id),
            totalAffected,
            totalMortality,
            firstReportTime: Math.min(...clusterMembers.map((r) => r.timestampMillis)),
            latestReportTime: Math.max(...clusterMembers.map((r) => r.timestampMillis)),
            severity,
            status: 'ACTIVE',
          });
        }
      }
    }

    return clusters;
  }
}
