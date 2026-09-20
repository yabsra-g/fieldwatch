package com.fieldwatch.app

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.fieldwatch.shared.i18n.Strings
import com.fieldwatch.shared.model.ReportStatus

@Composable
fun OfficerScreen(
    appState: AppState,
    modifier: Modifier = Modifier
) {
    val currentLang by appState.currentLanguage.collectAsState()
    val reports by appState.reports.collectAsState()
    val outbreaks by appState.outbreaks.collectAsState()

    LazyColumn(
        modifier = modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = Strings.get("officer_portal", currentLang),
                        style = MaterialTheme.typography.titleLarge
                    )
                    Text("Total Field Reports: ${reports.size} | Active Outbreak Clusters: ${outbreaks.size}")
                }
            }
        }

        if (outbreaks.isNotEmpty()) {
            item {
                Text(
                    text = "🚨 ${Strings.get("outbreak_detected", currentLang)} (${outbreaks.size} Active)",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.error
                )
            }
            items(outbreaks) { cluster ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Outbreak: ${cluster.diseaseName}", style = MaterialTheme.typography.titleMedium)
                        Text("Containment Radius: ${cluster.radiusKm.toInt()} km around (${cluster.center.latitude}, ${cluster.center.longitude})")
                        Text("Reports in Cluster: ${cluster.reportIds.size} | Total Affected: ${cluster.totalAffected} | Mortalities: ${cluster.totalMortality}")
                        Text("Severity: ${cluster.severity}")
                    }
                }
            }
        }

        item {
            Text("Recent Field Case Reports", style = MaterialTheme.typography.titleMedium)
        }

        items(reports) { report ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("${report.farmerName} (${report.location.district})", style = MaterialTheme.typography.titleSmall)
                        Text(report.status.name, style = MaterialTheme.typography.labelMedium)
                    }
                    Text("Host: ${report.hostType.name} | Affected: ${report.affectedCount} | Dead: ${report.mortalityCount}")
                    Text("Notes: ${report.notes}", style = MaterialTheme.typography.bodySmall)

                    if (report.status == ReportStatus.SUSPECT) {
                        Row(modifier = Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = { appState.updateReportStatus(report.id, ReportStatus.VERIFIED, "Verified by district vet team") },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Text("Verify Case")
                            }
                            OutlinedButton(
                                onClick = { appState.updateReportStatus(report.id, ReportStatus.CONTAINMENT_DEPLOYED, "Emergency quarantine ring ordered") }
                            ) {
                                Text("Deploy Containment")
                            }
                        }
                    }
                }
            }
        }
    }
}
