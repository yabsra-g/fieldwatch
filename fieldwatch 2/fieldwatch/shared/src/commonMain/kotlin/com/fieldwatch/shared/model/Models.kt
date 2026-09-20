package com.fieldwatch.shared.model

import kotlinx.serialization.Serializable

enum class HostType {
    CATTLE,
    SHEEP_GOAT,
    SWINE,
    POULTRY,
    MAIZE,
    CASSAVA,
    WHEAT_GRAIN
}

enum class SeverityLevel {
    LOW,
    MODERATE,
    HIGH,
    CRITICAL
}

enum class ReportStatus {
    SUSPECT,
    VERIFIED,
    CONTAINMENT_DEPLOYED,
    RESOLVED,
    REJECTED
}

@Serializable
data class GeoLocation(
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Double = 5.0,
    val district: String = "",
    val village: String = ""
)

@Serializable
data class Symptom(
    val id: String,
    val nameKey: String,
    val description: String,
    val applicableHosts: List<HostType>,
    val defaultWeight: Double = 1.0
)

@Serializable
data class DiseaseProfile(
    val id: String,
    val commonName: String,
    val scientificName: String,
    val hostType: HostType,
    val primarySymptoms: List<String>, // Symptom IDs
    val secondarySymptoms: List<String>,
    val severity: SeverityLevel,
    val infectiousnessScore: Double, // 1.0 to 10.0
    val quarantineRadiusKm: Double,
    val recommendedInterventions: List<String>
)

@Serializable
data class DiseaseReport(
    val id: String,
    val farmerName: String,
    val farmContact: String,
    val hostType: HostType,
    val totalAnimalsOrAcres: Int,
    val affectedCount: Int,
    val mortalityCount: Int,
    val observedSymptomIds: List<String>,
    val suspectDiseaseId: String?,
    val location: GeoLocation,
    val timestampMillis: Long,
    val status: ReportStatus = ReportStatus.SUSPECT,
    val notes: String = "",
    val officerNotes: String = ""
)

@Serializable
data class OutbreakCluster(
    val id: String,
    val diseaseId: String,
    val diseaseName: String,
    val center: GeoLocation,
    val radiusKm: Double,
    val reportIds: List<String>,
    val totalAffected: Int,
    val totalMortality: Int,
    val firstReportTime: Long,
    val latestReportTime: Long,
    val severity: SeverityLevel,
    val status: String = "ACTIVE"
)
