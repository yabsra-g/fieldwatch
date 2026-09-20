# FieldWatch: Digital Disease Surveillance & Outbreak Detection Platform

FieldWatch is an offline-first agricultural and veterinary disease surveillance system built for rural smallholder farmers and district veterinary/agricultural extension officers. It bridges field observations in remote regions with central epidemiology surveillance and rapid outbreak response.

---

## Core Features

### 1. Farmer Field Reporting (`FarmerScreen`)
- **Rapid Case Entry**: Report sick or dead crops and livestock with species selection (Cattle, Small Ruminants, Swine, Poultry, Maize, Cassava, Rice).
- **Differential Symptom Engine (`SymptomEngine`)**: Interactive visual checklist of observed symptoms that calculates matching confidence scores across high-consequence diseases.
- **Offline Outbox (`Outbox`)**: Full offline functionality with persistent local queue. Queued reports automatically synchronize when connectivity is restored.
- **Geotagging & Proximity**: Captures GPS coordinates, district boundary data, and calculates distance to nearest veterinary health posts.
- **Multi-lingual Support (`i18n`)**: Localized for field accessibility in English, Kiswahili (Swahili), Hindi, and Spanish.

### 2. Surveillance & Outbreak Detection (`OfficerScreen`)
- **Spatiotemporal Outbreak Clustering (`OutbreakDetector`)**:
  - Implements the Haversine distance algorithm to group reports geographically within a radius ($R$, e.g., 20 km).
  - Evaluates sliding temporal windows ($T$, e.g., 7–14 days).
  - Triggers **Outbreak Warning** when incident thresholds ($\theta$) are reached for specific suspect pathogens.
- **Geospatial Surveillance Map**: Real-time map displaying reported cases, hot-spot clusters, quarantine buffer radiuses, and movement restriction zones.
- **Case Verification & Action Workflow**: Allows surveillance officers to triage reports, update status (Suspect $\rightarrow$ Verified $\rightarrow$ Quarantined $\rightarrow$ Resolved), and dispatch rapid veterinary field teams.
- **Alert Broadcast & Advisory**: Automated SMS/radio broadcast advisory generation for neighboring farms within the transmission buffer zone.

---

## Architecture

FieldWatch follows Kotlin Multiplatform (KMP) architecture:
- **`shared/`**: Common business logic, data models, symptom engine, geospatial calculations, and outbreak detection algorithms compiled to JVM, Android, and Web targets.
- **`server/`**: Ktor / Kotlin backend server providing REST API and persistent store for disease reports, outbreak clusters, and sync endpoints.
- **`composeApp/`**: Compose Multiplatform user interface with adaptive layouts for Farmer and Officer roles.
