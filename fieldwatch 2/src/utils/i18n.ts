import { SupportedLanguage } from '../types';

export const TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  app_name: {
    en: 'FieldWatch',
    sw: 'FieldWatch',
    hi: 'फील्डवॉच',
    es: 'FieldWatch',
  },
  subtitle: {
    en: 'Digital Agricultural & Veterinary Disease Surveillance',
    sw: 'Ufuatiliaji wa Kidijitali wa Magonjwa ya Kilimo na Mifugo',
    hi: 'डिजिटल कृषि और पशु रोग निगरानी प्रणाली',
    es: 'Vigilancia Epidemiológica Agrícola y Veterinaria',
  },
  tab_farmer: {
    en: 'Home',
    sw: 'Nyumbani',
    hi: 'होम',
    es: 'Inicio',
  },
  action_report_sick: {
    en: 'Report Sick Animal or Crop',
    sw: 'Ripoti Mnyama au Zao Mgonjwa',
    hi: 'बीमार पशु या फसल की रिपोर्ट करें',
    es: 'Reportar Animal o Cultivo Enfermo',
  },
  action_ask_agribro: {
    en: 'Ask AgriBro (AI Farm Advisor)',
    sw: 'Uliza AgriBro (Mshauri wa AI)',
    hi: 'एग्रीब्रो से पूछें (एआई कृषि सलाहकार)',
    es: 'Preguntar a AgriBro (Asesor IA)',
  },
  action_my_reports: {
    en: 'My Submitted Reports',
    sw: 'Ripoti Zangu Zilizotumwa',
    hi: 'मेरी दर्ज की गई रिपोर्टें',
    es: 'Mis Reportes Enviados',
  },
  action_alerts: {
    en: 'Disease Warnings & Advisories',
    sw: 'Maonyo na Ushauri wa Magonjwa',
    hi: 'रोग चेतावनियाँ और सलाह',
    es: 'Alertas y Consejos Sanitarios',
  },
  online_status: {
    en: 'Online Sync Active',
    sw: 'Ulinganishaji Mtandaoni',
    hi: 'ऑनलाइन सिंक सक्रिय',
    es: 'Sincronización en línea',
  },
  offline_status: {
    en: 'Offline Mode (Local Outbox)',
    sw: 'Hali ya Nje ya Mtandao (Outbox)',
    hi: 'ऑफ़लाइन मोड (आउटबॉक्स)',
    es: 'Modo sin conexión (Bandeja local)',
  },
  new_report_title: {
    en: 'Submit Clinical Case Report',
    sw: 'Wasilisha Ripoti ya Kesi',
    hi: 'नया रोग मामला दर्ज करें',
    es: 'Enviar Reporte Clínico',
  },
  host_label: {
    en: 'Select Affected Species / Crop',
    sw: 'Chagua Aina ya Mnyama au Zao',
    hi: 'प्रभावित प्रजाति या फसल चुनें',
    es: 'Seleccionar Especie o Cultivo',
  },
  symptoms_label: {
    en: 'Check Observed Symptoms',
    sw: 'Chagua Dalili Zinazoonekana',
    hi: 'देखे गए लक्षण चुनें',
    es: 'Marcar Síntomas Observados',
  },
  diff_diagnosis: {
    en: 'Differential Diagnosis Engine',
    sw: 'Injini ya Utambuzi wa Ugonjwa',
    hi: 'विभेदक निदान इंजन',
    es: 'Motor de Diagnóstico Diferencial',
  },
  confidence_match: {
    en: 'Match Likelihood',
    sw: 'Uwezekano wa Ulinganifu',
    hi: 'संभाव्यता',
    es: 'Probabilidad de Coincidencia',
  },
  recommended_action: {
    en: 'Field Intervention Advisory',
    sw: 'Ushauri wa Hatua za Shambani',
    hi: 'अनुशंसित हस्तक्षेप सलाह',
    es: 'Recomendación de Intervención',
  },
  affected_count: {
    en: 'Number of Sick Animals / Acres',
    sw: 'Idadi ya Wanyama Wagonjwa / Ekari',
    hi: 'बीमार पशुओं / एकड़ की संख्या',
    es: 'Animales Enfermos / Hectáreas',
  },
  mortality_count: {
    en: 'Number of Deceased / Dead',
    sw: 'Idadi ya Waliokufa',
    hi: 'मृत पशुओं की संख्या',
    es: 'Número de Muertos',
  },
  submit_btn: {
    en: 'Submit Surveillance Report',
    sw: 'Tuma Ripoti ya Uchunguzi',
    hi: 'निगरानी रिपोर्ट दर्ज करें',
    es: 'Enviar Reporte Epidemiológico',
  },
  outbreak_alert_banner: {
    en: 'ACTIVE OUTBREAK DETECTED',
    sw: 'MLIPUKO WA UGONJWA UMEGUNDULIKA',
    hi: 'सक्रिय बीमारी का प्रकोप चिन्हित',
    es: 'BROTE EPIDÉMICO ACTIVO DETECTADO',
  },
  quarantine_radius: {
    en: 'Recommended Quarantine Radius',
    sw: 'Kipenyo cha Karantini Iliyopendekezwa',
    hi: 'अनुशंसित संगरोध (क्वारंटीन) दायरा',
    es: 'Radio de Cuarentena Recomendado',
  },
  broadcast_alert: {
    en: 'Broadcast Regional Advisory SMS',
    sw: 'Tuma Onyo la SMS kwa Wakulima',
    hi: 'क्षेत्रीय एसएमएस अलर्ट जारी करें',
    es: 'Difundir Alerta SMS a Productores',
  },
};

export function t(key: string, lang: SupportedLanguage): string {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[lang] || entry['en'] || key;
}
