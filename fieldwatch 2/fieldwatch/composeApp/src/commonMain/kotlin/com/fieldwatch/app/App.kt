package com.fieldwatch.app

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.fieldwatch.shared.i18n.Strings
import com.fieldwatch.shared.i18n.SupportedLanguage

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun App() {
    val appState = remember { AppState() }
    val currentScreen by appState.currentScreen.collectAsState()
    val currentLang by appState.currentLanguage.collectAsState()
    val isOnline by appState.isOnline.collectAsState()
    val pendingOutboxCount = appState.outbox.countPending()

    FieldWatchTheme {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("FieldWatch") },
                    actions = {
                        // Language switcher
                        SupportedLanguage.values().forEach { lang ->
                            TextButton(onClick = { appState.setLanguage(lang) }) {
                                Text(lang.code.uppercase())
                            }
                        }
                        // Online / Offline toggle
                        Button(onClick = { appState.toggleConnectivity() }) {
                            Text(if (isOnline) "Online" else "Offline ($pendingOutboxCount)")
                        }
                    }
                )
            },
            bottomBar = {
                NavigationBar {
                    NavigationBarItem(
                        selected = currentScreen == ActiveScreen.FARMER,
                        onClick = { appState.setScreen(ActiveScreen.FARMER) },
                        label = { Text("Farmer") },
                        icon = {}
                    )
                    NavigationBarItem(
                        selected = currentScreen == ActiveScreen.OFFICER,
                        onClick = { appState.setScreen(ActiveScreen.OFFICER) },
                        label = { Text("Surveillance") },
                        icon = {}
                    )
                }
            }
        ) { paddingValues ->
            when (currentScreen) {
                ActiveScreen.FARMER -> FarmerScreen(appState, modifier = Modifier.padding(paddingValues))
                ActiveScreen.OFFICER -> OfficerScreen(appState, modifier = Modifier.padding(paddingValues))
                ActiveScreen.CODE_INSPECTOR -> {}
            }
        }
    }
}
