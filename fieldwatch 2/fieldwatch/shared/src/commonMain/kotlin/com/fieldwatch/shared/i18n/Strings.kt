package com.fieldwatch.shared.i18n

enum class SupportedLanguage(val code: String, val displayName: String) {
    ENGLISH("en", "English"),
    SWAHILI("sw", "Kiswahili"),
    HINDI("hi", "हिन्दी"),
    SPANISH("es", "Español")
}

object Strings {
    private val translations = mapOf(
        "app_title" to mapOf(
            "en" to "FieldWatch Disease Surveillance",
            "sw" to "FieldWatch Ufuatiliaji wa Magonjwa",
            "hi" to "फील्डवॉच रोग निगरानी",
            "es" to "FieldWatch Vigilancia Epidemiológica"
        ),
        "farmer_portal" to mapOf(
            "en" to "Farmer Field Reporter",
            "sw" to "Ripoti ya Mkulima",
            "hi" to "किसान रिपोर्टिंग",
            "es" to "Portal del Agricultor"
        ),
        "officer_portal" to mapOf(
            "en" to "Surveillance Officer Hub",
            "sw" to "Kituo cha Afisa wa Mifugo",
            "hi" to "निगरानी अधिकारी केंद्र",
            "es" to "Centro de Vigilancia Veterinaria"
        ),
        "submit_report" to mapOf(
            "en" to "Submit Case Report",
            "sw" to "Tuma Ripoti ya Ugonjwa",
            "hi" to "केस रिपोर्ट दर्ज करें",
            "es" to "Enviar Reporte de Caso"
        ),
        "outbreak_detected" to mapOf(
            "en" to "OUTBREAK WARNING",
            "sw" to "ONYO LA MLIPUKO WA UGONJWA",
            "hi" to "प्रकोप की चेतावनी",
            "es" to "ALERTA DE BROTE"
        ),
        "offline_queued" to mapOf(
            "en" to "Offline: Saved to Outbox",
            "sw" to "Nje ya Mtandao: Imehifadhiwa",
            "hi" to "ऑफ़लाइन: आउटबॉक्स में सहेजा गया",
            "es" to "Sin conexión: Guardado en bandeja"
        ),
        "synced" to mapOf(
            "en" to "Synchronized with Server",
            "sw" to "Imelandanishwa na Seva",
            "hi" to "सर्वर के साथ समन्वयित",
            "es" to "Sincronizado con el Servidor"
        )
    )

    fun get(key: String, lang: SupportedLanguage = SupportedLanguage.ENGLISH): String {
        return translations[key]?.get(lang.code) ?: translations[key]?.get("en") ?: key
    }
}
