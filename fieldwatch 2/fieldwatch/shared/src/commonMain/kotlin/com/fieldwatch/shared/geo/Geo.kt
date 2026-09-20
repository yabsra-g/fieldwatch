package com.fieldwatch.shared.geo

import com.fieldwatch.shared.model.GeoLocation
import kotlin.math.*

object GeoUtils {
    private const val EARTH_RADIUS_KM = 6371.0

    /**
     * Calculates great-circle distance between two points using the Haversine formula.
     */
    fun distanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val dLat = (lat2 - lat1).toRadians()
        val dLon = (lon2 - lon1).toRadians()
        val rLat1 = lat1.toRadians()
        val rLat2 = lat2.toRadians()

        val a = sin(dLat / 2.0).pow(2.0) + cos(rLat1) * cos(rLat2) * sin(dLon / 2.0).pow(2.0)
        val c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a))
        return EARTH_RADIUS_KM * c
    }

    fun distanceBetween(loc1: GeoLocation, loc2: GeoLocation): Double {
        return distanceKm(loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude)
    }

    /**
     * Finds geographic centroid of a group of locations.
     */
    fun calculateCentroid(locations: List<GeoLocation>): GeoLocation {
        if (locations.isEmpty()) return GeoLocation(0.0, 0.0)
        var totalX = 0.0
        var totalY = 0.0
        var totalZ = 0.0

        for (loc in locations) {
            val latRad = loc.latitude.toRadians()
            val lonRad = loc.longitude.toRadians()
            totalX += cos(latRad) * cos(lonRad)
            totalY += cos(latRad) * sin(lonRad)
            totalZ += sin(latRad)
        }

        val total = locations.size.toDouble()
        val avgX = totalX / total
        val avgY = totalY / total
        val avgZ = totalZ / total

        val lon = atan2(avgY, avgX).toDegrees()
        val hyp = sqrt(avgX * avgX + avgY * avgY)
        val lat = atan2(avgZ, hyp).toDegrees()

        val sample = locations.firstOrNull()
        return GeoLocation(
            latitude = lat,
            longitude = lon,
            district = sample?.district ?: "",
            village = "Centroid Area"
        )
    }

    private fun Double.toRadians(): Double = this * PI / 180.0
    private fun Double.toDegrees(): Double = this * 180.0 / PI
}
