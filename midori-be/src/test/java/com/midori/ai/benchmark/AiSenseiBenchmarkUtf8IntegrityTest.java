package com.midori.ai.benchmark;

import org.junit.jupiter.api.Test;

import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AiSenseiBenchmarkUtf8IntegrityTest {

    private static final Set<String> TEXT_EXTENSIONS = Set.of(
            ".java", ".json", ".yml", ".yaml", ".properties", ".xml", ".sql", ".txt", ".md");

    @Test
    void sourceAndTextResourcesDecodeAsStrictUtf8() throws Exception {
        List<Path> roots = List.of(
                Path.of("src", "main", "java"),
                Path.of("src", "test", "java"),
                Path.of("src", "main", "resources"),
                Path.of("src", "test", "resources"));
        List<String> invalid = new ArrayList<>();

        for (Path root : roots) {
            if (!Files.exists(root)) continue;
            try (var paths = Files.walk(root)) {
                for (Path path : paths.filter(Files::isRegularFile).filter(AiSenseiBenchmarkUtf8IntegrityTest::isText).toList()) {
                    try {
                        StandardCharsets.UTF_8.newDecoder()
                                .onMalformedInput(CodingErrorAction.REPORT)
                                .onUnmappableCharacter(CodingErrorAction.REPORT)
                                .decode(ByteBuffer.wrap(Files.readAllBytes(path)));
                    } catch (Exception e) {
                        invalid.add(path.toString() + " (" + e.getClass().getSimpleName() + ")");
                    }
                }
            }
        }

        assertTrue(invalid.isEmpty(), "Non-UTF-8 source/resource files: " + invalid);
    }

    private static boolean isText(Path path) {
        String name = path.getFileName().toString().toLowerCase(java.util.Locale.ROOT);
        return TEXT_EXTENSIONS.stream().anyMatch(name::endsWith);
    }
}
