package com.fieldwatch.shared.outbreak

import com.fieldwatch.shared.geo.GeoUtils
import com.fieldwatch.shared.model.DiseaseReport
import com.fieldwatch.shared.model.OutbreakCluster
import com.fieldwatch.shared.model.ReportStatus
import com.fieldwatch.shared.model.SeverityLevel

class OutbreakDetector(
    private val clusterRadiusKm: Double = 25.0,
    private val timeWindowDays: Int = 10,
    private val alertThresholdReports: Int = 3
) {

    /**
     * Scans reports to detect outbreaks based on spatiotemporal clustering.
     */
    fun detectOutbreaks(reports: List<DiseaseReport>): List<OutbreakCluster> {
        val now = System.currentTimeMillis()
        val windowMillis = timeWindowDays.toLong() * 24 * 60 * 60 * 1000

        // Filter active reports within the sliding time window, excluding resolved/rejected
        val recentReports = reports.filter { report ->
            report.status != ReportStatus.REJECTED &&
            report.status != ReportStatus.RESOLVED &&
            (now - report.timestampMillis) <= windowMillis
        }

        // Group by disease
        val byDisease = recentReports.groupBy { it.suspectDiseaseId ?: "UNKNOWN" }
        val clusters = mutableListOf<OutbreakCluster>()

        for ((diseaseId, diseaseReports) in byDisease) {
            if (diseaseReports.size < alertThresholdReports) continue

            // Spatial clustering (DBSCAN-like single linkage)
            val visited = mutableSetOf<String>()

            for (report in diseaseReports) {
                if (report.id in visited) continue

                val clusterMembers = mutableListOf(report)
                visited.add(report.id)

                val queue = mutableListOf(report)
                while (queue.isNotEmpty()) {
                    val current = queue.removeAt(0)
                    for (candidate in diseaseReports) {
                        if (candidate.id !in visited) {
                            val dist = GeoUtils.distanceBetween(current.location, candidate.location)
                            if (dist <= clusterRadiusKm) {
                                visited.add(candidate.id)
                                clusterMembers.add(candidate)
                                queue.add(candidate)
                            }
                        }
                    }
                }

                if (clusterMembers.size >= alertThresholdReports) {
                    val locations = clusterMembers.map { it.location }
                    val centroid = GeoUtils.calculateCentroid(locations)
                    val totalAffected = clusterMembers.sumOf { it.affectedCount }
                    val totalMortality = clusterMembers.sumOf { it.mortalityCount }

                    // Determine max distance from centroid as bounding cluster radius
                    val maxDist = clusterMembers.maxOfOrNull {
                        GeoUtils.distanceBetween(centroid, it.location)
                    } ?: clusterRadiusKm
                    val effectiveRadius = maxOf(maxDist + 5.0, 15.0)

                    val severity = when {
                        totalMortality >= 10 || clusterMembers.size >= 8 -> SeverityLevel.CRITICAL
                        totalMortality >= 3 || clusterMembers.size >= 5 -> SeverityLevel.HIGH
                        clusterMembers.size >= 3 -> SeverityLevel.MODERATE
                        else -> SeverityLevel.LOW
                    }

                    clusters.add(
                        OutbreakCluster(
                            id = "OUTBREAK-${diseaseId.take(4)}-${clusters.size + 1}",
                            diseaseId = diseaseId,
                            diseaseName = diseaseId.replace("_", " ").capitalizeWords(),
                            center = centroid,
                            radiusKm = effectiveRadius,
                            reportIds = clusterMembers.map { it.id },
                            totalAffected = totalAffected,
                            totalMortality = totalMortality,
                            firstReportTime = clusterMembers.minOf { it.timestampMillis },
                            latestReportTime = clusterMembers.maxOf { it.timestampMillis },
                            severity = severity
                        )
                    )
                }
            }
        }

        return clusters
    }

    private fun String.capitalizeWords(): String =
        split(" ").joinToString(" ") { word -> word.lowercase().replaceFirstChar { it.uppercase() } }
}
