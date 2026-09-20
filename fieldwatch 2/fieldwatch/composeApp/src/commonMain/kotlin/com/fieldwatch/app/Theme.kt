package com.fieldwatch.app

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val ForestGreen = Color(0xFF1E5631)
val EmeraldLight = Color(0xFF4C9A2A)
val AlertAmber = Color(0xFFD97706)
val DangerRed = Color(0xFFDC2626)
val EarthWarm = Color(0xFFF7F5F0)
val DarkSurface = Color(0xFF181C14)

private val LightColorScheme = lightColorScheme(
    primary = ForestGreen,
    secondary = EmeraldLight,
    background = EarthWarm,
    surface = Color.White,
    error = DangerRed,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFF1F2937),
    onSurface = Color(0xFF111827)
)

private val DarkColorScheme = darkColorScheme(
    primary = EmeraldLight,
    secondary = ForestGreen,
    background = DarkSurface,
    surface = Color(0xFF242A20),
    error = Color(0xFFEF4444),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFFF3F4F6),
    onSurface = Color(0xFFE5E7EB)
)

@Composable
fun FieldWatchTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colors,
        content = content
    )
}
