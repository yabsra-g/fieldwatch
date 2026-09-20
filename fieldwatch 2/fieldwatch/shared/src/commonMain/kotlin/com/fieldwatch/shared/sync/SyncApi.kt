package com.fieldwatch.shared.sync

import com.fieldwatch.shared.model.DiseaseReport
import com.fieldwatch.shared.model.OutbreakCluster
import kotlinx.serialization.Serializable

@Serializable
data class SyncPushRequest(
    val reports: List<DiseaseReport>
)

@Serializable
data class SyncPushResponse(
    val acceptedReportIds: List<String>,
    val rejectedReportIds: List<String>,
    val serverTimestamp: Long
)

@Serializable
data class SyncPullResponse(
    val activeOutbreaks: List<OutbreakCluster>,
    val updatedReports: List<DiseaseReport>,
    val serverTimestamp: Long
)

interface SyncClient {
    suspend fun pushReports(reports: List<DiseaseReport>): SyncPushResponse
    suspend fun pullSurveillanceData(sinceTimestamp: Long): SyncPullResponse
}
