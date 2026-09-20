package com.fieldwatch.app

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.fieldwatch.shared.data.SeedData
import com.fieldwatch.shared.i18n.Strings
import com.fieldwatch.shared.model.*

@Composable
fun FarmerScreen(
    appState: AppState,
    modifier: Modifier = Modifier
) {
    val currentLang by appState.currentLanguage.collectAsState()
    val isOnline by appState.isOnline.collectAsState()
    var selectedHost by remember { mutableStateOf(HostType.CATTLE) }
    val selectedSymptoms = remember { mutableStateListOf<String>() }
    var affectedCount by remember { mutableStateOf("5") }
    var mortalityCount by remember { mutableStateOf("0") }
    var farmerName by remember { mutableStateOf("") }
    var farmerPhone by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var submitSuccessMessage by remember { mutableStateOf<String?>(null) }

    val matches = remember(selectedHost, selectedSymptoms.toList()) {
        appState.diagnose(selectedHost, selectedSymptoms.toSet())
    }

    LazyColumn(
        modifier = modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = Strings.get("farmer_portal", currentLang),
                        style = MaterialTheme.typography.titleLarge
                    )
                    Text(
                        text = if (isOnline) "🟢 Online: Direct cloud submission" else "🟠 Offline: Submissions queued in local Outbox",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }

        item {
            Text("1. Select Affected Animal / Crop", style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HostType.values().forEach { host ->
                    FilterChip(
                        selected = selectedHost == host,
                        onClick = {
                            selectedHost = host
                            selectedSymptoms.clear()
                        },
                        label = { Text(host.name.replace("_", " ")) }
                    )
                }
            }
        }

        item {
            Text("2. Check Observed Symptoms", style = MaterialTheme.typography.titleMedium)
            val availableSymptoms = SeedData.symptoms.filter { selectedHost in it.applicableHosts }
            availableSymptoms.forEach { symptom ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                ) {
                    Checkbox(
                        checked = symptom.id in selectedSymptoms,
                        onCheckedChange = { isChecked ->
                            if (isChecked) selectedSymptoms.add(symptom.id)
                            else selectedSymptoms.remove(symptom.id)
                        }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(symptom.nameKey, style = MaterialTheme.typography.bodyLarge)
                        Text(symptom.description, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }

        if (matches.isNotEmpty()) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Differential Diagnosis Match", style = MaterialTheme.typography.titleMedium)
                        matches.take(2).forEach { match ->
                            Text(
                                "• ${match.disease.commonName} (${match.score.toInt()}% Match)",
                                style = MaterialTheme.typography.bodyLarge
                            )
                            Text(match.recommendation, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }
        }

        item {
            Button(
                onClick = {
                    val report = DiseaseReport(
                        id = "REP-${System.currentTimeMillis() % 100000}",
                        farmerName = farmerName.ifBlank { "Community Farmer" },
                        farmContact = farmerPhone.ifBlank { "+254 700 000 000" },
                        hostType = selectedHost,
                        totalAnimalsOrAcres = (affectedCount.toIntOrNull() ?: 1) + 10,
                        affectedCount = affectedCount.toIntOrNull() ?: 1,
                        mortalityCount = mortalityCount.toIntOrNull() ?: 0,
                        observedSymptomIds = selectedSymptoms.toList(),
                        suspectDiseaseId = matches.firstOrNull()?.disease?.id,
                        location = GeoLocation(-1.2921, 36.8219, 5.0, "Kajiado District", "Oloolua Ward"),
                        timestampMillis = System.currentTimeMillis(),
                        notes = notes
                    )
                    val syncedDirectly = appState.submitReport(report)
                    submitSuccessMessage = if (syncedDirectly) {
                        "Report submitted directly to surveillance database!"
                    } else {
                        "Report stored in offline outbox. Will sync when connectivity returns."
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(Strings.get("submit_report", currentLang))
            }
        }
    }
}
