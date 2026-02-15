package health.impilo.harness;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import okhttp3.*;

import java.io.IOException;
import java.util.UUID;

/**
 * Lightweight HTTP helper that auto-injects v1.1 mandatory headers.
 */
public final class HttpHelper {

    private static final OkHttpClient CLIENT = new OkHttpClient();
    public static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());
    public static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private HttpHelper() {}

    // ── Header builder ───────────────────────────────────────────────────

    /**
     * Build a request with all v1.1 mandatory headers pre-populated.
     */
    public static Request.Builder request(String url) {
        Request.Builder b = new Request.Builder()
                .url(url)
                .header("X-Tenant-ID", HarnessConfig.tenantId())
                .header("X-Pod-ID", HarnessConfig.podId())
                .header("X-Request-ID", UUID.randomUUID().toString())
                .header("X-Correlation-ID", UUID.randomUUID().toString())
                .header("X-Device-Fingerprint", UUID.randomUUID().toString())
                .header("X-Purpose-Of-Use", "INTEGRATION_TEST")
                .header("X-Actor-Id", "harness-bot")
                .header("X-Actor-Type", "SYSTEM")
                .header("Content-Type", "application/json");

        String anonKey = HarnessConfig.supabaseAnonKey();
        if (anonKey != null && !anonKey.isBlank()) {
            b.header("Authorization", "Bearer " + anonKey);
            b.header("apikey", anonKey);
        }
        return b;
    }

    /**
     * Build a request with additional actor-context headers (roles, assurance).
     */
    public static Request.Builder request(String url, String subjectId, String roles, String assuranceLevel) {
        return request(url)
                .header("X-Actor-Subject-ID", subjectId)
                .header("X-Actor-Roles", roles)
                .header("X-Actor-Facility-ID", HarnessConfig.facilityId())
                .header("X-Actor-Assurance-Level", assuranceLevel);
    }

    // ── Execute helpers ──────────────────────────────────────────────────

    public static Response execute(Request request) throws IOException {
        return CLIENT.newCall(request).execute();
    }

    public static JsonNode executeAndParse(Request request) throws IOException {
        try (Response response = execute(request)) {
            String body = response.body() != null ? response.body().string() : "{}";
            return MAPPER.readTree(body);
        }
    }

    public static RequestBody jsonBody(Object obj) throws IOException {
        return RequestBody.create(MAPPER.writeValueAsString(obj), JSON);
    }
}
