package com.fieldwatch.shared.sync

import com.fieldwatch.shared.model.DiseaseReport
import kotlinx.serialization.Serializable

enum class SyncStatus {
    IDLE,
    SYNCING,
    OFFLINE,
    ERROR
}

@Serializable
data class OutboxEntry(
    val id: String,
    val report: DiseaseReport,
    val createdAtMillis: Long,
    val retryCount: Int = 0,
    val lastError: String? = null
)

class OutboxQueue {
    private val pendingQueue = mutableListOf<OutboxEntry>()

    fun enqueue(report: DiseaseReport) {
        val entry = OutboxEntry(
            id = "OUTBOX-${report.id}",
            report = report,
            createdAtMillis = System.currentTimeMillis()
        )
        pendingQueue.add(entry)
    }

    fun getPending(): List<OutboxEntry> = pendingQueue.toList()

    fun countPending(): Int = pendingQueue.size

    fun markSynced(entryId: String) {
        pendingQueue.removeAll { it.id == entryId }
    }

    fun markFailed(entryId: String, error: String) {
        val idx = pendingQueue.indexOfFirst { it.id == entryId }
        if (idx != -1) {
            val cur = pendingQueue[idx]
            pendingQueue[idx] = cur.copy(retryCount = cur.retryCount + 1, lastError = error)
        }
    }

    fun clear() {
        pendingQueue.clear()
    }
}
