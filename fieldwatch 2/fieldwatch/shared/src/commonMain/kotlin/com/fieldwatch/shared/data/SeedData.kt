package com.fieldwatch.shared.data

import com.fieldwatch.shared.model.*

object SeedData {
    val symptoms = listOf(
        // Livestock symptoms
        Symptom("sym_blisters", "Mouth/Hoof Blisters", "Erosive vesicles and ulcers on oral mucosa and feet", listOf(HostType.CATTLE, HostType.SHEEP_GOAT, HostType.SWINE), 1.5),
        Symptom("sym_salivation", "Excessive Salivation / Drooling", "Heavy foamy drooling, tongue protrusion", listOf(HostType.CATTLE, HostType.SHEEP_GOAT), 1.2),
        Symptom("sym_high_fever", "Sudden High Fever (>41°C)", "Severe pyrexia, lethargy, shivering", listOf(HostType.CATTLE, HostType.SWINE, HostType.SHEEP_GOAT, HostType.POULTRY), 1.0),
        Symptom("sym_sudden_death", "Acute Sudden Mortality", "Rapid death within 12-24h without prolonged illness", listOf(HostType.CATTLE, HostType.SWINE, HostType.POULTRY), 2.0),
        Symptom("sym_skin_cyanosis", "Skin Cyanosis / Hemorrhages", "Purple blotches on ears, abdomen, and extremities", listOf(HostType.SWINE), 1.8),
        Symptom("sym_bloody_diarrhea", "Hemorrhagic Diarrhea", "Severe bloody watery stool, dehydration", listOf(HostType.CATTLE, HostType.SWINE, HostType.SHEEP_GOAT), 1.3),
        Symptom("sym_twisted_neck", "Nervous Signs / Torticollis", "Twisted neck, circling, leg paralysis", listOf(HostType.POULTRY), 1.8),
        Symptom("sym_comb_swelling", "Comb and Wattle Swelling", "Edema and cyanosis of head, comb, and wattles", listOf(HostType.POULTRY), 1.6),

        // Crop symptoms
        Symptom("sym_windowpane_leaf", "Windowpane Foliar Feeding", "Young caterpillars skeletonize leaf epidermis", listOf(HostType.MAIZE), 1.4),
        Symptom("sym_stem_boring", "Stem Boring & Frass", "Heavy sawdust-like fecal matter inside whorl and stem", listOf(HostType.MAIZE), 1.7),
        Symptom("sym_mosaic_curling", "Leaf Mosaic & Severe Distortion", "Yellow-green mosaic chlorosis, reduced leaf size", listOf(HostType.CASSAVA), 1.8),
        Symptom("sym_stunted_growth", "Severe Plant Stunting", "Shortened internodes and bushy appearance", listOf(HostType.CASSAVA, HostType.MAIZE), 1.2),
        Symptom("sym_pustules_rust", "Orange-Brown Spore Pustules", "Powdery pustules rupturing leaf sheath and stems", listOf(HostType.WHEAT_GRAIN), 1.5)
    )

    val diseases = listOf(
        DiseaseProfile(
            id = "fmd",
            commonName = "Foot-and-Mouth Disease (FMD)",
            scientificName = "Aphthovirus (Picornaviridae)",
            hostType = HostType.CATTLE,
            primarySymptoms = listOf("sym_blisters", "sym_salivation", "sym_high_fever"),
            secondarySymptoms = listOf("sym_bloody_diarrhea"),
            severity = SeverityLevel.HIGH,
            infectiousnessScore = 9.5,
            quarantineRadiusKm = 20.0,
            recommendedInterventions = listOf(
                "Immediate ring vaccination within 20 km zone",
                "Strict quarantine: prohibit all live animal transport and milk collection",
                "Deploy vehicle wheel-bath disinfection points at district boundaries"
            )
        ),
        DiseaseProfile(
            id = "asf",
            commonName = "African Swine Fever (ASF)",
            scientificName = "Asfarviridae",
            hostType = HostType.SWINE,
            primarySymptoms = listOf("sym_sudden_death", "sym_skin_cyanosis", "sym_high_fever"),
            secondarySymptoms = listOf("sym_bloody_diarrhea"),
            severity = SeverityLevel.CRITICAL,
            infectiousnessScore = 9.8,
            quarantineRadiusKm = 25.0,
            recommendedInterventions = listOf(
                "Total movement standstill on pigs, pork products, and feed",
                "Humane culling of confirmed herds with biosecure burial",
                "Disinfection of all farm equipment with 2% sodium hydroxide"
            )
        ),
        DiseaseProfile(
            id = "newcastle",
            commonName = "Newcastle Disease / Avian Flu",
            scientificName = "Avian orthoavulavirus 1",
            hostType = HostType.POULTRY,
            primarySymptoms = listOf("sym_sudden_death", "sym_twisted_neck", "sym_comb_swelling"),
            secondarySymptoms = listOf("sym_high_fever"),
            severity = SeverityLevel.CRITICAL,
            infectiousnessScore = 9.2,
            quarantineRadiusKm = 10.0,
            recommendedInterventions = listOf(
                "Emergency biosecurity perimeter around flock housing",
                "Quarantine poultry movement to live bird markets",
                "Cleanse water supplies and incinerate bird carcasses"
            )
        ),
        DiseaseProfile(
            id = "fall_armyworm",
            commonName = "Fall Armyworm (FAW)",
            scientificName = "Spodoptera frugiperda",
            hostType = HostType.MAIZE,
            primarySymptoms = listOf("sym_windowpane_leaf", "sym_stem_boring"),
            secondarySymptoms = listOf("sym_stunted_growth"),
            severity = SeverityLevel.MODERATE,
            infectiousnessScore = 8.0,
            quarantineRadiusKm = 15.0,
            recommendedInterventions = listOf(
                "Apply recommended biological control (Bacillus thuringiensis)",
                "Hand-pick egg masses and crush larvae in smallholder plots",
                "Deploy pheromone monitoring traps across adjacent village blocks"
            )
        ),
        DiseaseProfile(
            id = "cassava_mosaic",
            commonName = "Cassava Mosaic Disease (CMD)",
            scientificName = "Cassava mosaic begomovirus",
            hostType = HostType.CASSAVA,
            primarySymptoms = listOf("sym_mosaic_curling", "sym_stunted_growth"),
            secondarySymptoms = emptyList(),
            severity = SeverityLevel.MODERATE,
            infectiousnessScore = 7.5,
            quarantineRadiusKm = 15.0,
            recommendedInterventions = listOf(
                "Uproot and burn severely symptomatic plants (roguing)",
                "Distribute virus-free certified planting cuttings to affected farmers",
                "Control whitefly vector populations using integrated pest management"
            )
        )
    )

    val sampleReports = listOf(
        DiseaseReport(
            id = "REP-2026-001",
            farmerName = "Ezekiel Kiprono",
            farmContact = "+254 712 884 102",
            hostType = HostType.CATTLE,
            totalAnimalsOrAcres = 45,
            affectedCount = 14,
            mortalityCount = 2,
            observedSymptomIds = listOf("sym_blisters", "sym_salivation", "sym_high_fever"),
            suspectDiseaseId = "fmd",
            location = GeoLocation(-1.286389, 36.817223, 4.0, "Kajiado North", "Oloolua"),
            timestampMillis = System.currentTimeMillis() - 2 * 24 * 3600 * 1000L,
            status = ReportStatus.VERIFIED,
            notes = "Four dairy heifers showing excessive ropey drooling and painful hoof lesions unable to graze."
        ),
        DiseaseReport(
            id = "REP-2026-002",
            farmerName = "Grace Mwangi",
            farmContact = "+254 722 419 803",
            hostType = HostType.CATTLE,
            totalAnimalsOrAcres = 30,
            affectedCount = 9,
            mortalityCount = 1,
            observedSymptomIds = listOf("sym_blisters", "sym_salivation"),
            suspectDiseaseId = "fmd",
            location = GeoLocation(-1.312000, 36.834000, 5.0, "Kajiado North", "Ngong Ward"),
            timestampMillis = System.currentTimeMillis() - 1 * 24 * 3600 * 1000L,
            status = ReportStatus.SUSPECT,
            notes = "Neighbor's cattle also showing foot limping after shared communal water trough."
        ),
        DiseaseReport(
            id = "REP-2026-003",
            farmerName = "Joseph Ole Ntimama",
            farmContact = "+254 733 671 294",
            hostType = HostType.CATTLE,
            totalAnimalsOrAcres = 75,
            affectedCount = 22,
            mortalityCount = 4,
            observedSymptomIds = listOf("sym_blisters", "sym_salivation", "sym_high_fever", "sym_bloody_diarrhea"),
            suspectDiseaseId = "fmd",
            location = GeoLocation(-1.298000, 36.850000, 6.0, "Kajiado North", "Kiserian Valley"),
            timestampMillis = System.currentTimeMillis() - 12 * 3600 * 1000L,
            status = ReportStatus.SUSPECT,
            notes = "Severe outbreak spread after Tuesday livestock market. Urgently need vet ring vaccination."
        ),
        DiseaseReport(
            id = "REP-2026-004",
            farmerName = "David Cheruiyot",
            farmContact = "+254 701 552 911",
            hostType = HostType.SWINE,
            totalAnimalsOrAcres = 60,
            affectedCount = 18,
            mortalityCount = 11,
            observedSymptomIds = listOf("sym_sudden_death", "sym_skin_cyanosis", "sym_high_fever"),
            suspectDiseaseId = "asf",
            location = GeoLocation(-0.303099, 36.080025, 4.5, "Nakuru South", "Njoro"),
            timestampMillis = System.currentTimeMillis() - 3 * 24 * 3600 * 1000L,
            status = ReportStatus.CONTAINMENT_DEPLOYED,
            notes = "Sudden death in grower pigs with dark blue discoloration behind ears and belly."
        ),
        DiseaseReport(
            id = "REP-2026-005",
            farmerName = "Mary Wambui",
            farmContact = "+254 720 338 741",
            hostType = HostType.MAIZE,
            totalAnimalsOrAcres = 8,
            affectedCount = 5,
            mortalityCount = 0,
            observedSymptomIds = listOf("sym_windowpane_leaf", "sym_stem_boring"),
            suspectDiseaseId = "fall_armyworm",
            location = GeoLocation(-0.023559, 37.072834, 3.0, "Laikipia Central", "Nanyuki"),
            timestampMillis = System.currentTimeMillis() - 4 * 24 * 3600 * 1000L,
            status = ReportStatus.VERIFIED,
            notes = "Whorls heavily damaged with sawdust frass. Larvae visibly boring into central stalks."
        )
    )
}
