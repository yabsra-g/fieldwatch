package com.fieldwatch.app

import com.fieldwatch.shared.data.SeedData
import com.fieldwatch.shared.i18n.SupportedLanguage
import com.fieldwatch.shared.model.*
import com.fieldwatch.shared.outbreak.OutbreakDetector
import com.fieldwatch.shared.symptom.DiagnosisMatch
import com.fieldwatch.shared.symptom.SymptomEngine
import com.fieldwatch.shared.sync.OutboxQueue
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class ActiveScreen {
    FARMER,
    OFFICER,
    CODE_INSPECTOR
}

class AppState {
    private val symptomEngine = SymptomEngine(SeedData.diseases)
    private val outbreakDetector = OutbreakDetector(clusterRadiusKm = 25.0, timeWindowDays = 14, alertThresholdReports = 3)
    val outbox = OutboxQueue()

    private val _currentScreen = MutableStateFlow(ActiveScreen.FARMER)
    val currentScreen: StateFlow<ActiveScreen> = _currentScreen.asStateFlow()

    private val _currentLanguage = MutableStateFlow(SupportedLanguage.ENGLISH)
    val currentLanguage: StateFlow<SupportedLanguage> = _currentLanguage.asStateFlow()

    private val _isOnline = MutableStateFlow(true)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    private val _reports = MutableStateFlow<List<DiseaseReport>>(SeedData.sampleReports)
    val reports: StateFlow<List<DiseaseReport>> = _reports.asStateFlow()

    private val _outbreaks = MutableStateFlow<List<OutbreakCluster>>(emptyList())
    val outbreaks: StateFlow<List<OutbreakCluster>> = _outbreaks.asStateFlow()

    init {
        recomputeOutbreaks()
    }

    fun setScreen(screen: ActiveScreen) {
        _currentScreen.value = screen
    }

    fun setLanguage(language: SupportedLanguage) {
        _currentLanguage.value = language
    }

    fun toggleConnectivity() {
        _isOnline.value = !_isOnline.value
        if (_isOnline.value && outbox.countPending() > 0) {
            syncOutbox()
        }
    }

    fun submitReport(report: DiseaseReport): Boolean {
        if (_isOnline.value) {
            _reports.value = listOf(report) + _reports.value
            recomputeOutbreaks()
            return true
        } else {
            outbox.enqueue(report)
            return false
        }
    }

    fun syncOutbox() {
        val pending = outbox.getPending()
        val syncedReports = pending.map { it.report }
        _reports.value = syncedReports + _reports.value
        outbox.clear()
        recomputeOutbreaks()
    }

    fun updateReportStatus(reportId: String, newStatus: ReportStatus, notes: String = "") {
        _reports.value = _reports.value.map {
            if (it.id == reportId) {
                it.copy(
                    status = newStatus,
                    officerNotes = if (notes.isNotBlank()) notes else it.officerNotes
                )
            } else it
        }
        recomputeOutbreaks()
    }

    fun diagnose(hostType: HostType, observedSymptoms: Set<String>): List<DiagnosisMatch> {
        return symptomEngine.evaluate(hostType, observedSymptoms)
    }

    private fun recomputeOutbreaks() {
        _outbreaks.value = outbreakDetector.detectOutbreaks(_reports.value)
    }
}
