package health.impilo.harness;

import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.io.InputStream;

/**
 * Loads JSON fixtures from {@code src/test/resources/fixtures/}.
 */
public final class FixtureLoader {

    private FixtureLoader() {}

    /**
     * Load a fixture file by name (e.g. "tenants.json").
     */
    public static JsonNode load(String filename) throws IOException {
        String path = "fixtures/" + filename;
        try (InputStream is = FixtureLoader.class.getClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                throw new IOException("Fixture not found on classpath: " + path);
            }
            return HttpHelper.MAPPER.readTree(is);
        }
    }

    /**
     * Load a fixture and return the element at the given array index.
     */
    public static JsonNode load(String filename, int index) throws IOException {
        return load(filename).get(index);
    }
}
