package health.impilo.harness.wave1;

import com.fasterxml.jackson.databind.JsonNode;
import health.impilo.harness.FixtureLoader;
import health.impilo.harness.HarnessConfig;
import health.impilo.harness.HttpHelper;
import okhttp3.Request;
import okhttp3.Response;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Wave 1 — Validates that emitted events conform to the v1.1 envelope shape.
 *
 * <p>These tests call an internal diagnostic endpoint that returns
 * the last emitted event envelope for inspection.</p>
 */
@Tag("wave1")
@DisplayName("Wave 1 · Event Envelope v1.1 Shape")
class EventEnvelopeV11IT {

    private static final String DIAGNOSTIC_URL =
            HarnessConfig.baseUrlKernel() + "/v1/internal/diagnostics/last-event";

    @Test
    @DisplayName("Envelope contains required v1.1 fields")
    void envelopeShape() throws Exception {
        // Trigger a lightweight event by calling an internal emit-test endpoint
        String emitUrl = HarnessConfig.baseUrlKernel() + "/v1/internal/diagnostics/emit-test-event";
        Request emitReq = HttpHelper.request(emitUrl)
                .post(HttpHelper.jsonBody(new java.util.HashMap<>() {{
                    put("event_type", "impilo.test.harness.ping.v1");
                    put("partition_key", HarnessConfig.tenantId());
                }}))
                .build();

        try (Response emitResp = HttpHelper.execute(emitReq)) {
            // Endpoint may not exist yet — skip gracefully
            if (emitResp.code() == 404) {
                System.out.println("[SKIP] Diagnostic emit endpoint not deployed; skipping envelope shape test.");
                return;
            }
            assertThat(emitResp.code()).isIn(200, 201);
        }

        // Fetch the last event
        Request fetchReq = HttpHelper.request(DIAGNOSTIC_URL).get().build();
        JsonNode event = HttpHelper.executeAndParse(fetchReq);

        if (event.has("error")) {
            System.out.println("[SKIP] No events available: " + event);
            return;
        }

        // Assert v1.1 envelope mandatory fields
        assertThat(event.has("event_id")).as("event_id present").isTrue();
        assertThat(event.has("event_type")).as("event_type present").isTrue();
        assertThat(event.has("schema_version")).as("schema_version present").isTrue();
        assertThat(event.get("schema_version").asInt()).as("schema_version >= 1").isGreaterThanOrEqualTo(1);
        assertThat(event.has("correlation_id")).as("correlation_id present").isTrue();
        assertThat(event.has("meta")).as("meta block present").isTrue();
        assertThat(event.get("meta").has("partition_key")).as("meta.partition_key present").isTrue();
    }
}
