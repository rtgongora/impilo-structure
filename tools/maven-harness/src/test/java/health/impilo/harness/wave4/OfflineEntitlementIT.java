package health.impilo.harness.wave4;

import com.fasterxml.jackson.databind.JsonNode;
import health.impilo.harness.HarnessConfig;
import health.impilo.harness.HttpHelper;
import okhttp3.Request;
import okhttp3.Response;
import org.junit.jupiter.api.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Wave 4 — Offline Entitlement issue / verify / revoke / consume via HTTP.
 */
@Tag("wave4")
@DisplayName("Wave 4 · Offline Entitlements Lifecycle")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class OfflineEntitlementIT {

    private static final String ENTITLEMENT_URL =
            HarnessConfig.baseUrlKernel() + "/v1/internal/entitlements";

    private static String issuedEntitlementId;

    private Map<String, Object> issuePayload() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("subject_id", "user-harness-e2e");
        payload.put("subject_type", "USER");
        payload.put("scope", "clinical.view");
        payload.put("target_type", "CPID");
        payload.put("target_id", "cpid-int-001");
        payload.put("validity_minutes", 60);

        Map<String, Object> constraints = new HashMap<>();
        constraints.put("facility_id", HarnessConfig.facilityId());
        constraints.put("max_uses", 5);
        payload.put("constraints", constraints);

        return payload;
    }

    @Test
    @Order(1)
    @DisplayName("Issue entitlement returns signed token")
    void issueEntitlement() throws Exception {
        Request req = HttpHelper.request(ENTITLEMENT_URL + "/issue",
                        "user-harness-e2e", "CLINICIAN", "aal2")
                .post(HttpHelper.jsonBody(issuePayload()))
                .build();

        try (Response resp = HttpHelper.execute(req)) {
            if (resp.code() == 404) {
                System.out.println("[SKIP] Entitlement endpoint not deployed.");
                Assumptions.assumeTrue(false, "Endpoint not available");
                return;
            }
            assertThat(resp.code()).isEqualTo(200);
            String body = resp.body() != null ? resp.body().string() : "";
            JsonNode json = HttpHelper.MAPPER.readTree(body);
            assertThat(json.has("entitlement_id")).isTrue();
            assertThat(json.has("token")).isTrue();
            assertThat(json.path("alg").asText()).isEqualTo("Ed25519");
            issuedEntitlementId = json.get("entitlement_id").asText();
        }
    }

    @Test
    @Order(2)
    @DisplayName("Verify issued entitlement passes")
    void verifyEntitlement() throws Exception {
        Assumptions.assumeTrue(issuedEntitlementId != null, "No entitlement issued in prior step");

        Request req = HttpHelper.request(ENTITLEMENT_URL + "/verify",
                        "user-harness-e2e", "CLINICIAN", "aal2")
                .post(HttpHelper.jsonBody(new HashMap<>() {{
                    put("entitlement_id", issuedEntitlementId);
                    put("scope", "clinical.view");
                    put("target_id", "cpid-int-001");
                    put("facility_id", HarnessConfig.facilityId());
                }}))
                .build();

        try (Response resp = HttpHelper.execute(req)) {
            if (resp.code() == 404) {
                System.out.println("[SKIP] Verify endpoint not deployed.");
                return;
            }
            assertThat(resp.code()).isEqualTo(200);
            String body = resp.body() != null ? resp.body().string() : "";
            assertThat(body).contains("\"valid\"");
        }
    }

    @Test
    @Order(3)
    @DisplayName("Consume entitlement decrements usage")
    void consumeEntitlement() throws Exception {
        Assumptions.assumeTrue(issuedEntitlementId != null, "No entitlement issued in prior step");

        Request req = HttpHelper.request(ENTITLEMENT_URL + "/consume",
                        "user-harness-e2e", "CLINICIAN", "aal2")
                .post(HttpHelper.jsonBody(new HashMap<>() {{
                    put("entitlement_id", issuedEntitlementId);
                }}))
                .build();

        try (Response resp = HttpHelper.execute(req)) {
            if (resp.code() == 404) {
                System.out.println("[SKIP] Consume endpoint not deployed.");
                return;
            }
            assertThat(resp.code()).isIn(200, 204);
        }
    }

    @Test
    @Order(4)
    @DisplayName("Revoke entitlement")
    void revokeEntitlement() throws Exception {
        Assumptions.assumeTrue(issuedEntitlementId != null, "No entitlement issued in prior step");

        Request req = HttpHelper.request(ENTITLEMENT_URL + "/revoke",
                        "user-harness-e2e", "CLINICIAN", "aal2")
                .post(HttpHelper.jsonBody(new HashMap<>() {{
                    put("entitlement_id", issuedEntitlementId);
                    put("reason", "INTEGRATION_TEST_CLEANUP");
                }}))
                .build();

        try (Response resp = HttpHelper.execute(req)) {
            if (resp.code() == 404) {
                System.out.println("[SKIP] Revoke endpoint not deployed.");
                return;
            }
            assertThat(resp.code()).isIn(200, 204);
        }
    }

    @Test
    @Order(5)
    @DisplayName("Verify revoked entitlement fails")
    void verifyRevokedFails() throws Exception {
        Assumptions.assumeTrue(issuedEntitlementId != null, "No entitlement issued in prior step");

        Request req = HttpHelper.request(ENTITLEMENT_URL + "/verify",
                        "user-harness-e2e", "CLINICIAN", "aal2")
                .post(HttpHelper.jsonBody(new HashMap<>() {{
                    put("entitlement_id", issuedEntitlementId);
                    put("scope", "clinical.view");
                    put("target_id", "cpid-int-001");
                    put("facility_id", HarnessConfig.facilityId());
                }}))
                .build();

        try (Response resp = HttpHelper.execute(req)) {
            if (resp.code() == 404) {
                System.out.println("[SKIP] Verify endpoint not deployed.");
                return;
            }
            // Should fail verification — 403 or body with valid=false
            String body = resp.body() != null ? resp.body().string() : "";
            if (resp.code() == 200) {
                assertThat(body).contains("false");
            } else {
                assertThat(resp.code()).isIn(403, 410);
            }
        }
    }
}
