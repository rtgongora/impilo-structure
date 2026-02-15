package health.impilo.harness;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Centralised configuration for integration tests.
 * <p>
 * Values are loaded from {@code harness.properties} (Maven-filtered)
 * and can be overridden via {@code -DtenantId=...} system properties.
 */
public final class HarnessConfig {

    private static final Properties PROPS = new Properties();

    static {
        try (InputStream is = HarnessConfig.class
                .getClassLoader()
                .getResourceAsStream("harness.properties")) {
            if (is != null) {
                PROPS.load(is);
            }
        } catch (IOException e) {
            throw new ExceptionInInitializerError("Failed to load harness.properties: " + e.getMessage());
        }
    }

    // ── Identifiers ──────────────────────────────────────────────────────

    public static String tenantId() {
        return resolve("tenant.id", "tenantId", "tenant-integration-01");
    }

    public static String podId() {
        return resolve("pod.id", "podId", "pod-local-01");
    }

    public static String facilityId() {
        return resolve("facility.id", "facilityId", "fac-integration-01");
    }

    public static String workspaceId() {
        return resolve("workspace.id", "workspaceId", "ws-integration-01");
    }

    // ── Base URLs ────────────────────────────────────────────────────────

    public static String baseUrlTshepo() {
        return resolve("base.url.tshepo", "baseUrlTshepo", "http://localhost:54321/functions/v1");
    }

    public static String baseUrlButano() {
        return resolve("base.url.butano", "baseUrlButano", "http://localhost:54321/functions/v1");
    }

    public static String baseUrlMsika() {
        return resolve("base.url.msika", "baseUrlMsika", "http://localhost:54321/functions/v1");
    }

    public static String baseUrlKernel() {
        return resolve("base.url.kernel", "baseUrlKernel", "http://localhost:54321/functions/v1");
    }

    public static String supabaseAnonKey() {
        return resolve("supabase.anon.key", "supabaseAnonKey", "");
    }

    // ── Internal ─────────────────────────────────────────────────────────

    /**
     * Resolve a config value: system property wins, then properties file, then default.
     */
    private static String resolve(String propKey, String sysPropKey, String defaultValue) {
        String sys = System.getProperty(sysPropKey);
        if (sys != null && !sys.isBlank()) return sys;
        String file = PROPS.getProperty(propKey);
        if (file != null && !file.isBlank() && !file.startsWith("${")) return file;
        return defaultValue;
    }
}
