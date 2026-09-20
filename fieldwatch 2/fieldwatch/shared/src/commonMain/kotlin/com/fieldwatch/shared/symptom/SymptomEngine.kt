package com.fieldwatch.shared.symptom

import com.fieldwatch.shared.model.DiseaseProfile
import com.fieldwatch.shared.model.HostType

data class DiagnosisMatch(
    val disease: DiseaseProfile,
    val score: Double, // 0.0 to 1.0
    val matchedPrimaryCount: Int,
    val totalPrimaryCount: Int,
    val matchedSecondaryCount: Int,
    val recommendation: String
)

class SymptomEngine(private val knownDiseases: List<DiseaseProfile>) {

    /**
     * Computes differential diagnosis probability ranking based on observed symptoms for a host.
     */
    fun evaluate(hostType: HostType, observedSymptomIds: Set<String>): List<DiagnosisMatch> {
        val candidates = knownDiseases.filter { it.hostType == hostType }

        return candidates.mapNotNull { disease ->
            if (observedSymptomIds.isEmpty()) return@mapNotNull null

            val primaryMatches = disease.primarySymptoms.count { it in observedSymptomIds }
            val secondaryMatches = disease.secondarySymptoms.count { it in observedSymptomIds }

            // Weighted scoring: primary symptoms account for 70% weight, secondary for 30%
            val primaryRatio = if (disease.primarySymptoms.isNotEmpty()) {
                primaryMatches.toDouble() / disease.primarySymptoms.size
            } else 0.0

            val secondaryRatio = if (disease.secondarySymptoms.isNotEmpty()) {
                secondaryMatches.toDouble() / disease.secondarySymptoms.size
            } else 0.0

            val compositeScore = (primaryRatio * 0.75) + (secondaryRatio * 0.25)

            // Penalty if no primary symptoms matched at all
            val finalScore = if (primaryMatches == 0) compositeScore * 0.3 else compositeScore

            if (finalScore > 0.15) {
                val actionRec = if (finalScore >= 0.75) {
                    "High probability of ${disease.commonName}. Immediate isolation and veterinary notification required."
                } else if (finalScore >= 0.45) {
                    "Moderate match for ${disease.commonName}. Monitor animals closely and limit livestock movement."
                } else {
                    "Possible early symptoms of ${disease.commonName}. Re-inspect herd within 24 hours."
                }

                DiagnosisMatch(
                    disease = disease,
                    score = (finalScore * 100.0).coerceIn(0.0, 100.0),
                    matchedPrimaryCount = primaryMatches,
                    totalPrimaryCount = disease.primarySymptoms.size,
                    matchedSecondaryCount = secondaryMatches,
                    recommendation = actionRec
                )
            } else null
        }.sortedByDescending { it.score }
    }
}
