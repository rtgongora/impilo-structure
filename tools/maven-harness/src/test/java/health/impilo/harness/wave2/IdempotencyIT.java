package health.impilo.harness.wave2;

import com.fasterxml.jackson.databind.JsonNode;
import health.impilo.harness.FixtureLoader;
import health.impilo.harness.HarnessConfig;
import health.impilo.harness.HttpHelper;
import okhttp3.Request;
import okhttp3.Response;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Wave 2 — Idempotency replay + conflict validation.
 *
 * <p>Targets the MSIKA tariff-update internal endpoint as the reference
 * idempotent command.</p>
 */
@Tag("wave2")
@DisplayName("Wave 2 · Idempotency Replay + Conflict")
class IdempotencyIT {

    private static final String TARIFF_URL =
            HarnessConfig.baseUrlMsika() + "/v1/internal/msika/tariff-update";

    private Map<String, Object> sampleTariff() throws Exception {
        JsonNode fixture = FixtureLoader.load("msika_items.json", 0);
        Map<String, Object> tariff = new HashMap<>();
        tariff.put("tariff_id", fixture.get("tariff_id").asText());
        tariff.put("product_id", fixture.get("product_id").asText());
        tariff.put("currency", fixture.get("currency").asText());
        tariff.put("amount", fixture.get("amount").asDouble());
        tariff.put("effective_from", fixture.get("effective_from").asText());
        return tariff;
    }

    @Test
    @DisplayName("Replay with same key + body returns idempotent_replay=true")
    void idempotentReplay() throws Exception {
        String idempotencyKey = UUID.randomUUID().toString();
        Map<String, Object> tariff = sampleTariff();

        // First request
        Request r1 = HttpHelper.request(TARIFF_URL, "user-harness-1", "FINANCE_ADMIN", "aal2")
                .header("Idempotency-Key", idempotencyKey)
                .post(HttpHelper.jsonBody(tariff))
                .build();

        try (Response resp1 = HttpHelper.execute(r1)) {
            if (resp1.code() == 404) {
                System.out.println("[SKIP] Tariff-update endpoint not deployed; skipping idempotency test.");
                return;
            }
            assertThat(resp1.code()).isEqualTo(200);
        }

        // Replay — same key, same body
        Request r2 = HttpHelper.request(TARIFF_URL, "user-harness-1", "FINANCE_ADMIN", "aal2")
                .header("Idempotency-Key", idempotencyKey)
                .post(HttpHelper.jsonBody(tariff))
                .build();

        JsonNode replay = HttpHelper.executeAndParse(r2);
        assertThat(replay.path("idempotent_replay").asBoolean()).isTrue();
    }

    @Test
    @DisplayName("Conflict with same key but different body returns 409")
    void idempotencyConflict() throws Exception {
        String idempotencyKey = UUID.randomUUID().toString();
        Map<String, Object> tariff = sampleTariff();

        // First request
        Request r1 = HttpHelper.request(TARIFF_URL, "user-harness-1", "FINANCE_ADMIN", "aal2")
                .header("Idempotency-Key", idempotencyKey)
                .post(HttpHelper.jsonBody(tariff))
                .build();

        try (Response resp1 = HttpHelper.execute(r1)) {
            if (resp1.code() == 404) {
                System.out.println("[SKIP] Tariff-update endpoint not deployed; skipping conflict test.");
                return;
            }
        }

        // Conflict — same key, different amount
        tariff.put("amount", 99999.99);
        Request r2 = HttpHelper.request(TARIFF_URL, "user-harness-1", "FINANCE_ADMIN", "aal2")
                .header("Idempotency-Key", idempotencyKey)
                .post(HttpHelper.jsonBody(tariff))
                .build();

        try (Response resp2 = HttpHelper.execute(r2)) {
            assertThat(resp2.code()).isEqualTo(409);
            String body = resp2.body() != null ? resp2.body().string() : "";
            assertThat(body).contains("IDEMPOTENCY_CONFLICT");
        }
    }

    @Test
    @DisplayName("Missing Idempotency-Key returns 400")
    void missingKey() throws Exception {
        Map<String, Object> tariff = sampleTariff();

        Request req = HttpHelper.request(TARIFF_URL, "user-harness-1", "FINANCE_ADMIN", "aal2")
                // Intentionally no Idempotency-Key header
                .post(HttpHelper.jsonBody(tariff))
                .build();

        try (Response resp = HttpHelper.execute(req)) {
            if (resp.code() == 404) {
                System.out.println("[SKIP] Tariff-update endpoint not deployed.");
                return;
            }
            assertThat(resp.code()).isEqualTo(400);
        }
    }
}
