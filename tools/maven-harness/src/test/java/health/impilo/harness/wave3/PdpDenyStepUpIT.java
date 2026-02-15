package health.impilo.harness.wave3;

import com.fasterxml.jackson.databind.JsonNode;
import health.impilo.harness.HarnessConfig;
import health.impilo.harness.HttpHelper;
import okhttp3.Request;
import okhttp3.Response;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Wave 3 — TSHEPO PDP deny / step-up behaviour via HTTP.
 */
@Tag("wave3")
@DisplayName("Wave 3 · PDP Deny / Step-Up Behaviour")
class PdpDenyStepUpIT {

    private static final String PDP_URL =
            HarnessConfig.baseUrlTshepo() + "/v1/internal/pdp/decide";

    private Map<String, Object> pdpRequest(String userId, String roles, String assurance, String action) {
        Map<String, Object> req = new HashMap<>();

        Map<String, Object> subject = new HashMap<>();
        subject.put("user_id", userId);
        subject.put("roles", roles.split(","));
        subject.put("assurance_level", assurance);
        req.put("subject", subject);

        req.put("action", action);
        req.put("resource", new HashMap<>());

        Map<String, Object> context = new HashMap<>();
        context.put("tenant_id", HarnessConfig.tenantId());
        context.put("pod_id", HarnessConfig.podId());
        req.put("context", context);

        return req;
    }

    @Test
    @DisplayName("DENY when CLINICIAN attempts tariff update")
    void denyWrongRole() throws Exception {
        Map<String, Object> body = pdpRequest("user-1", "CLINICIAN", "aal2", "finance.msika.tariff.update");

        Request req = HttpHelper.request(PDP_URL, "user-1", "CLINICIAN", "aal2")
                .post(HttpHelper.jsonBody(body))
                .build();

        try (Response resp = HttpHelper.execute(req)) {
            if (resp.code() == 404) {
                System.out.println("[SKIP] PDP endpoint not deployed.");
                return;
            }
            // Expect 403 or 200 with decision=DENY
            String respBody = resp.body() != null ? resp.body().string() : "";
            JsonNode json = HttpHelper.MAPPER.readTree(respBody);

            if (resp.code() == 403) {
                assertThat(respBody).contains("POLICY_DENY");
            } else {
                assertThat(json.path("decision").asText()).isEqualTo("DENY");
            }
        }
    }

    @Test
    @DisplayName("STEP_UP_REQUIRED when assurance level missing")
    void stepUpRequired() throws Exception {
        Map<String, Object> body = pdpRequest("user-1", "FINANCE_ADMIN", "", "finance.msika.tariff.update");

        Request req = HttpHelper.request(PDP_URL, "user-1", "FINANCE_ADMIN", "")
                .post(HttpHelper.jsonBody(body))
                .build();

        try (Response resp = HttpHelper.execute(req)) {
            if (resp.code() == 404) {
                System.out.println("[SKIP] PDP endpoint not deployed.");
                return;
            }
            String respBody = resp.body() != null ? resp.body().string() : "";
            // Expect 412 or decision=STEP_UP_REQUIRED
            if (resp.code() == 412) {
                assertThat(respBody).contains("STEP_UP_REQUIRED");
            } else {
                JsonNode json = HttpHelper.MAPPER.readTree(respBody);
                assertThat(json.path("decision").asText()).isEqualTo("STEP_UP_REQUIRED");
            }
        }
    }

    @Test
    @DisplayName("ALLOW when FINANCE_ADMIN + aal2 requests tariff update")
    void allowCorrectRole() throws Exception {
        Map<String, Object> body = pdpRequest("user-1", "FINANCE_ADMIN", "aal2", "finance.msika.tariff.update");

        Request req = HttpHelper.request(PDP_URL, "user-1", "FINANCE_ADMIN", "aal2")
                .post(HttpHelper.jsonBody(body))
                .build();

        try (Response resp = HttpHelper.execute(req)) {
            if (resp.code() == 404) {
                System.out.println("[SKIP] PDP endpoint not deployed.");
                return;
            }
            String respBody = resp.body() != null ? resp.body().string() : "";
            JsonNode json = HttpHelper.MAPPER.readTree(respBody);
            assertThat(json.path("decision").asText()).isEqualTo("ALLOW");
        }
    }
}
