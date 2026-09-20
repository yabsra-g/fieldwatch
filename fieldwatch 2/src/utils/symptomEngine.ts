import { DiagnosisMatch, DiseaseProfile, HostType } from '../types';

export class SymptomEngine {
  constructor(private diseases: DiseaseProfile[]) {}

  /**
   * Evaluates observed symptoms against disease profiles for a given host.
   */
  evaluate(hostType: HostType, observedSymptomIds: string[]): DiagnosisMatch[] {
    if (observedSymptomIds.length === 0) return [];

    const candidateDiseases = this.diseases.filter((d) => d.hostType === hostType);
    const observedSet = new Set(observedSymptomIds);

    const matches: DiagnosisMatch[] = [];

    for (const disease of candidateDiseases) {
      const primaryMatches = disease.primarySymptoms.filter((s) => observedSet.has(s)).length;
      const secondaryMatches = disease.secondarySymptoms.filter((s) => observedSet.has(s)).length;

      const primaryRatio =
        disease.primarySymptoms.length > 0
          ? primaryMatches / disease.primarySymptoms.length
          : 0;

      const secondaryRatio =
        disease.secondarySymptoms.length > 0
          ? secondaryMatches / disease.secondarySymptoms.length
          : 0;

      // Primary symptoms carry 75% weight, secondary carry 25%
      let rawScore = primaryRatio * 0.75 + secondaryRatio * 0.25;

      // Penalize if zero primary symptoms matched
      if (primaryMatches === 0) {
        rawScore *= 0.3;
      }

      const scorePercent = Math.min(100, Math.round(rawScore * 100));

      if (scorePercent >= 15) {
        let recommendation = '';
        if (scorePercent >= 70) {
          recommendation = `High clinical suspicion of ${disease.commonName}. Isolate herd immediately, restrict animal movement, and notify district veterinary officer.`;
        } else if (scorePercent >= 40) {
          recommendation = `Moderate symptom alignment with ${disease.commonName}. Monitor closely for secondary lesions and prevent shared watering trough access.`;
        } else {
          recommendation = `Low to moderate indication of ${disease.commonName}. Re-evaluate within 24 hours if fever or lesions persist.`;
        }

        matches.push({
          disease,
          score: scorePercent,
          matchedPrimaryCount: primaryMatches,
          totalPrimaryCount: disease.primarySymptoms.length,
          matchedSecondaryCount: secondaryMatches,
          recommendation,
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }
}
