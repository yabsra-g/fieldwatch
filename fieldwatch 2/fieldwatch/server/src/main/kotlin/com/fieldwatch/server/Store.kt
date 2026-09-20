package com.fieldwatch.server

import com.fieldwatch.shared.data.SeedData
import com.fieldwatch.shared.model.DiseaseReport
import com.fieldwatch.shared.model.OutbreakCluster
import com.fieldwatch.shared.model.ReportStatus
import com.fieldwatch.shared.outbreak.OutbreakDetector
import java.util.concurrent.ConcurrentHashMap

class SurveillanceStore {
    private val reports = ConcurrentHashMap<String, DiseaseReport>()
    private val detector = OutbreakDetector(clusterRadiusKm = 25.0, timeWindowDays = 14, alertThresholdReports = 3)

    init {
        // Seed initial surveillance reports
        SeedData.sampleReports.forEach { report ->
            reports[report.id] = report
        }
    }

    fun getAllReports(): List<DiseaseReport> = reports.values.sortedByDescending { it.timestampMillis }

    fun addReport(report: DiseaseReport): DiseaseReport {
        reports[report.id] = report
        return report
    }

    fun updateReportStatus(reportId: String, newStatus: ReportStatus, officerNotes: String = ""): DiseaseReport? {
        val current = reports[reportId] ?: return null
        val updated = current.copy(
            status = newStatus,
            officerNotes = if (officerNotes.isNotBlank()) officerNotes else current.officerNotes
        )
        reports[reportId] = updated
        return updated
    }

    fun getActiveOutbreaks(): List<OutbreakCluster> {
        return detector.detectOutbreaks(reports.values.toList())
    }
}
