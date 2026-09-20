package com.fieldwatch.server

import com.fieldwatch.shared.data.SeedData
import com.fieldwatch.shared.model.DiseaseReport
import com.fieldwatch.shared.model.ReportStatus
import com.fieldwatch.shared.sync.SyncPushRequest
import com.fieldwatch.shared.sync.SyncPushResponse
import com.fieldwatch.shared.sync.SyncPullResponse
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

val surveillanceStore = SurveillanceStore()

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        install(ContentNegotiation) {
            json()
        }
        install(CORS) {
            anyHost()
            allowHeader(HttpHeaders.ContentType)
            allowMethod(HttpMethod.Options)
            allowMethod(HttpMethod.Put)
            allowMethod(HttpMethod.Patch)
            allowMethod(HttpMethod.Delete)
        }

        routing {
            get("/api/health") {
                call.respond(mapOf("status" to "ok", "service" to "FieldWatch Surveillance Engine"))
            }

            get("/api/diseases") {
                call.respond(SeedData.diseases)
            }

            get("/api/symptoms") {
                call.respond(SeedData.symptoms)
            }

            get("/api/reports") {
                call.respond(surveillanceStore.getAllReports())
            }

            post("/api/reports") {
                val report = call.receive<DiseaseReport>()
                val saved = surveillanceStore.addReport(report)
                call.respond(HttpStatusCode.Created, saved)
            }

            patch("/api/reports/{id}/status") {
                val id = call.parameters["id"] ?: return@patch call.respond(HttpStatusCode.BadRequest)
                val params = call.receive<Map<String, String>>()
                val statusStr = params["status"] ?: return@patch call.respond(HttpStatusCode.BadRequest)
                val notes = params["notes"] ?: ""
                val status = runCatching { ReportStatus.valueOf(statusStr) }.getOrNull()
                    ?: return@patch call.respond(HttpStatusCode.BadRequest)

                val updated = surveillanceStore.updateReportStatus(id, status, notes)
                if (updated != null) {
                    call.respond(updated)
                } else {
                    call.respond(HttpStatusCode.NotFound)
                }
            }

            get("/api/outbreaks") {
                call.respond(surveillanceStore.getActiveOutbreaks())
            }

            post("/api/sync/push") {
                val pushReq = call.receive<SyncPushRequest>()
                val accepted = mutableListOf<String>()
                pushReq.reports.forEach { report ->
                    surveillanceStore.addReport(report)
                    accepted.add(report.id)
                }
                call.respond(
                    SyncPushResponse(
                        acceptedReportIds = accepted,
                        rejectedReportIds = emptyList(),
                        serverTimestamp = System.currentTimeMillis()
                    )
                )
            }

            get("/api/sync/pull") {
                val since = call.request.queryParameters["since"]?.toLongOrNull() ?: 0L
                val allReports = surveillanceStore.getAllReports().filter { it.timestampMillis >= since }
                val outbreaks = surveillanceStore.getActiveOutbreaks()
                call.respond(
                    SyncPullResponse(
                        activeOutbreaks = outbreaks,
                        updatedReports = allReports,
                        serverTimestamp = System.currentTimeMillis()
                    )
                )
            }
        }
    }.start(wait = true)
}
